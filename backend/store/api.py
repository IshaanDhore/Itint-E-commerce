import razorpay
from django.conf import settings
from ninja import NinjaAPI, Schema
from django.http import HttpResponse
from .models import Product, Order, OrderItem
from typing import List
import logging

logger = logging.getLogger(__name__)

api = NinjaAPI()
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class ProductSchema(Schema):
    id: int
    name: str
    description: str = None
    price: float
    stock_quantity: int

class CartItemSchema(Schema):
    product_id: int
    quantity: int

class CheckoutSchema(Schema):
    items: List[CartItemSchema]
    customer_email: str

class VerifyPaymentSchema(Schema):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@api.get("/products", response=List[ProductSchema])
def list_products(request):
    return Product.objects.all()

@api.post("/checkout")
def create_checkout_session(request, payload: CheckoutSchema):
    try:
        # Calculate total and check stock
        total_amount = 0
        
        # Create a pending order
        order = Order.objects.create(
            customer_email=payload.customer_email,
            total_amount=0, # will update
            status='pending'
        )

        for item in payload.items:
            product = Product.objects.get(id=item.product_id)
            if product.stock_quantity < item.quantity:
                return {"error": f"Not enough stock for {product.name}"}
            
            item_total = float(product.price) * item.quantity
            total_amount += item_total
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item.quantity,
                price=product.price
            )
        
        order.total_amount = total_amount
        order.save()

        # Create Razorpay Order
        razorpay_order = client.order.create(dict(
            amount=int(total_amount * 100), # Amount in paise
            currency='USD',
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

    except Exception as e:
        logger.error("Checkout error: %s", e, exc_info=True)
        return {"error": "An unexpected error occurred during checkout. Please try again later."}

@api.post("/verify-payment")
def verify_payment(request, payload: VerifyPaymentSchema):
    try:
        # Verify the signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        })

        # Signature is valid, update order status
        order = Order.objects.get(razorpay_order_id=payload.razorpay_order_id)
        order.status = 'paid'
        order.razorpay_payment_id = payload.razorpay_payment_id
        order.save()

        # Deduct stock
        for item in order.items.all():
            product = item.product
            product.stock_quantity -= item.quantity
            product.save()

        return {"status": "success"}

    except razorpay.errors.SignatureVerificationError:
        return {"status": "failed", "error": "Invalid signature"}
    except Order.DoesNotExist:
        return {"status": "failed", "error": "Order not found"}
    except Exception as e:
        logger.error("Payment verification error: %s", e, exc_info=True)
        return {"status": "failed", "error": "An unexpected error occurred. Please try again later."}
