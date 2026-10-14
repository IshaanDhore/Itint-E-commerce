import hmac
import hashlib
import json
import logging
import re
from decimal import Decimal
from typing import List, Optional

import razorpay
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import F
from django.http import HttpResponse
from ninja import NinjaAPI, Schema
from pydantic import field_validator, ValidationInfo

import urllib.request
import urllib.parse
from django_ratelimit.decorators import ratelimit

from .models import Product, Order, OrderItem

logger = logging.getLogger(__name__)

api = NinjaAPI(title="itint Store API", version="1.0.0")


@api.get("/health")
def health_check(request):
    return {"status": "ok", "service": "itint-backend"}


@api.get("/reverse-geocode")
@ratelimit(key='ip', rate='20/m', block=False)
def reverse_geocode(request, lat: float, lon: float):
    if getattr(request, 'limited', False):
        return api.create_response(request, {"error": "Rate limit exceeded. Please wait a moment."}, status=429)

    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        return api.create_response(request, {"error": "Invalid latitude or longitude coordinates"}, status=400)

    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "itint-store-app/1.0 (contact: info@itint.local)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                return data
            return api.create_response(request, {"error": "Geocoding service unavailable"}, status=502)
    except Exception as e:
        logger.error("Reverse geocoding error: %s", e)
        return api.create_response(request, {"error": "Failed to fetch address"}, status=502)



def get_razorpay_client():
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    return razorpay.Client(auth=(key_id, key_secret))


class ProductSchema(Schema):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int


class CartItemSchema(Schema):
    product_id: int
    quantity: int

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v


class ShippingAddressSchema(Schema):
    street: str
    city: str
    state: str
    zip: str
    country: str

    @field_validator('street', 'city', 'state', 'zip', 'country')
    @classmethod
    def validate_non_empty(cls, v: str, info: ValidationInfo) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} is required and cannot be empty")
        return v.strip()


class CheckoutSchema(Schema):
    items: List[CartItemSchema]
    customer_email: str
    phone_number: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_address: Optional[ShippingAddressSchema] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None
    customer_location: Optional[str] = None

    @field_validator('items')
    @classmethod
    def validate_items(cls, v: List[CartItemSchema]) -> List[CartItemSchema]:
        if not v:
            raise ValueError("Order must contain at least one item")
        return v

    @field_validator('customer_email')
    @classmethod
    def validate_customer_email(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Customer email is required")
        cleaned = v.strip().lower()
        try:
            validate_email(cleaned)
        except ValidationError:
            raise ValueError("Invalid email address format")
        return cleaned

    def clean_phone(self) -> str:
        phone = (self.phone_number or self.customer_phone or "").strip()
        digits = re.sub(r'\D', '', phone)
        if len(digits) < 7:
            raise ValueError("A valid phone number with at least 7 digits is required")
        return phone

    def clean_address(self) -> dict:
        if self.shipping_address:
            return {
                "street": self.shipping_address.street.strip(),
                "city": self.shipping_address.city.strip(),
                "state": self.shipping_address.state.strip(),
                "zip": self.shipping_address.zip.strip(),
                "country": self.shipping_address.country.strip(),
            }
        street = (self.street or "").strip()
        city = (self.city or "").strip()
        state = (self.state or "").strip()
        zip_code = (self.zip or "").strip()
        country = (self.country or "").strip()
        if not (street and city and state and zip_code and country):
            raise ValueError("All address fields (street, city, state, zip, country) are required")
        return {
            "street": street,
            "city": city,
            "state": state,
            "zip": zip_code,
            "country": country,
        }


class VerifyPaymentSchema(Schema):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


def process_order_payment(razorpay_order_id: str, razorpay_payment_id: Optional[str] = None) -> Order:
    """
    Shared atomic and idempotent function to mark an order as paid and decrement stock.
    Used by both /api/verify-payment and /api/webhook.

    - Uses transaction.atomic() and select_for_update() on the Order.
    - Idempotent: returns immediately if already 'paid' or 'needs_refund'.
    - Re-checks stock at payment time. If insufficient, marks 'needs_refund' and logs warning.
    - Decrements stock using F() expressions.
    - If concurrent race drives stock negative, flags 'needs_refund' and logs error without crashing.
    """
    with transaction.atomic():
        order = Order.objects.select_for_update().get(razorpay_order_id=razorpay_order_id)

        # Idempotency check
        if order.status in ('paid', 'needs_refund'):
            if razorpay_payment_id and not order.razorpay_payment_id:
                order.razorpay_payment_id = razorpay_payment_id
                order.save(update_fields=['razorpay_payment_id', 'updated_at'])
            return order

        if razorpay_payment_id:
            order.razorpay_payment_id = razorpay_payment_id

        # Re-check stock at payment time across all items in this order
        order_items = list(order.items.select_related('product'))
        insufficient_stock = False
        insufficient_product_name = ""

        for item in order_items:
            product = Product.objects.select_for_update().get(id=item.product.id)
            if product.stock_quantity < item.quantity:
                insufficient_stock = True
                insufficient_product_name = product.name
                break

        if insufficient_stock:
            logger.warning(
                "Order #%s payment received, but stock is insufficient for '%s'. Marking as 'needs_refund'.",
                order.id, insufficient_product_name
            )
            order.status = 'needs_refund'
            order.save()
            return order

        # Deduct stock with F() expressions
        for item in order_items:
            Product.objects.filter(id=item.product.id).update(
                stock_quantity=F('stock_quantity') - item.quantity
            )

        # Re-check if stock went negative due to a race condition
        stock_went_negative = False
        for item in order_items:
            product = Product.objects.get(id=item.product.id)
            if product.stock_quantity < 0:
                stock_went_negative = True
                logger.error(
                    "Product #%s (%s) stock went negative (%s) after order #%s.",
                    product.id, product.name, product.stock_quantity, order.id
                )

        if stock_went_negative:
            order.status = 'needs_refund'
            order.save()
            logger.warning("Order #%s flagged as 'needs_refund' due to negative stock.", order.id)
            return order

        order.status = 'paid'
        order.save()
        logger.info("Order #%s successfully marked as paid and stock decremented.", order.id)
        return order


@api.get("/products", response=List[ProductSchema])
def list_products(request):
    return Product.objects.all()


@api.post("/checkout")
@ratelimit(key='ip', rate='10/m', block=False)
def create_checkout_session(request, payload: CheckoutSchema):
    if getattr(request, 'limited', False):
        return api.create_response(request, {"error": "Too many checkout requests. Please wait a moment."}, status=429)

    try:
        try:
            phone = payload.clean_phone()
            addr = payload.clean_address()
        except ValueError as val_err:
            return api.create_response(request, {"error": str(val_err)}, status=400)

        total_amount = Decimal('0.00')

        with transaction.atomic():
            order = Order.objects.create(
                customer_email=payload.customer_email,
                phone_number=phone,
                shipping_street=addr['street'],
                shipping_city=addr['city'],
                shipping_state=addr['state'],
                shipping_zip=addr['zip'],
                shipping_country=addr['country'],
                total_amount=Decimal('0.00'),
                status='pending'
            )

            for item in payload.items:
                try:
                    product = Product.objects.select_for_update().get(id=item.product_id)
                except Product.DoesNotExist:
                    raise ValueError(f"Product with ID {item.product_id} does not exist")

                if product.stock_quantity < item.quantity:
                    raise ValueError(f"Not enough stock for {product.name}")

                item_total = product.price * item.quantity
                total_amount += item_total

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item.quantity,
                    price=product.price
                )

            order.total_amount = total_amount
            order.save()

            client = get_razorpay_client()
            currency = getattr(settings, 'RAZORPAY_CURRENCY', 'INR')
            amount_subunits = int(total_amount * Decimal('100'))

            razorpay_order = client.order.create(dict(
                amount=amount_subunits,
                currency=currency,
                receipt=str(order.id),
                payment_capture='1'
            ))

            order.razorpay_order_id = razorpay_order['id']
            order.save()

        return {
            "order_id": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "key_id": settings.RAZORPAY_KEY_ID
        }

    except ValueError as e:
        return api.create_response(request, {"error": str(e)}, status=400)
    except Exception as e:
        logger.error("Checkout error: %s", e, exc_info=True)
        return api.create_response(
            request,
            {"error": "An unexpected error occurred during checkout. Please try again later."},
            status=500
        )


@api.post("/verify-payment")
@ratelimit(key='ip', rate='15/m', block=False)
def verify_payment(request, payload: VerifyPaymentSchema):
    if getattr(request, 'limited', False):
        return api.create_response(request, {"error": "Too many payment verification attempts. Please wait a moment."}, status=429)

    try:
        client = get_razorpay_client()
        client.utility.verify_payment_signature({
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        })

        order = process_order_payment(
            razorpay_order_id=payload.razorpay_order_id,
            razorpay_payment_id=payload.razorpay_payment_id
        )

        if order.status == 'needs_refund':
            return {
                "status": "needs_refund",
                "message": "Payment received, but items are out of stock. A refund will be initiated."
            }

        return {"status": "success"}

    except razorpay.errors.SignatureVerificationError:
        return api.create_response(request, {"status": "failed", "error": "Invalid signature"}, status=400)
    except Order.DoesNotExist:
        return api.create_response(request, {"status": "failed", "error": "Order not found"}, status=404)
    except Exception as e:
        logger.error("Payment verification error: %s", e, exc_info=True)
        return api.create_response(request, {"status": "failed", "error": "An unexpected error occurred."}, status=500)


@api.post("/webhook")
def razorpay_webhook(request):
    signature = request.headers.get('X-Razorpay-Signature')
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')

    if not signature or not webhook_secret:
        logger.warning("Webhook rejected: missing X-Razorpay-Signature or unconfigured RAZORPAY_WEBHOOK_SECRET.")
        return HttpResponse("Missing signature or webhook secret", status=400)

    raw_body = request.body
    try:
        body_text = raw_body.decode('utf-8')
        client = get_razorpay_client()
        client.utility.verify_webhook_signature(body_text, signature, webhook_secret)
    except (razorpay.errors.SignatureVerificationError, UnicodeDecodeError) as e:
        logger.warning("Webhook signature verification failed: %s", e)
        return HttpResponse("Invalid signature", status=400)
    except Exception as e:
        logger.error("Webhook verification error: %s", e, exc_info=True)
        return HttpResponse("Verification error", status=400)

    try:
        event = json.loads(body_text)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON", status=400)

    if event.get('event') == 'order.paid':
        order_entity = event.get('payload', {}).get('order', {}).get('entity', {})
        razorpay_order_id = order_entity.get('id')
        payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
        razorpay_payment_id = payment_entity.get('id')

        if razorpay_order_id:
            try:
                process_order_payment(
                    razorpay_order_id=razorpay_order_id,
                    razorpay_payment_id=razorpay_payment_id
                )
            except Order.DoesNotExist:
                logger.warning("Webhook received for unknown order: %s", razorpay_order_id)
            except Exception as e:
                logger.error("Error processing order.paid in webhook: %s", e, exc_info=True)
                return HttpResponse(status=500)

    return HttpResponse(status=200)
