import json
from decimal import Decimal
from unittest.mock import patch, MagicMock

import razorpay
from django.test import TestCase, Client
from django.conf import settings

from store.models import Product, Order, OrderItem
from store.api import process_order_payment


class StoreCheckoutAndPaymentTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.product = Product.objects.create(
            name="Signature Cherry Tint",
            description="3ml lip tint",
            price=Decimal("18.00"),
            stock_quantity=10
        )
        self.checkout_payload = {
            "items": [
                {"product_id": self.product.id, "quantity": 2}
            ],
            "customer_email": "customer@example.com",
            "phone_number": "+919876543210",
            "shipping_address": {
                "street": "123 Cherry Lane",
                "city": "Mumbai",
                "state": "Maharashtra",
                "zip": "400001",
                "country": "India"
            }
        }

    @patch('store.api.get_razorpay_client')
    def test_checkout_creates_order_with_address_and_phone(self, mock_get_client):
        """Test that checkout saves customer phone and full shipping address on the Order."""
        mock_client = MagicMock()
        mock_client.order.create.return_value = {
            "id": "order_test_abc123",
            "amount": 3600,
            "currency": "INR"
        }
        mock_get_client.return_value = mock_client

        response = self.client.post(
            "/api/checkout",
            data=json.dumps(self.checkout_payload),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["order_id"], "order_test_abc123")
        self.assertEqual(data["currency"], "INR")

        # Verify Order in DB
        order = Order.objects.get(razorpay_order_id="order_test_abc123")
        self.assertEqual(order.customer_email, "customer@example.com")
        self.assertEqual(order.phone_number, "+919876543210")
        self.assertEqual(order.shipping_street, "123 Cherry Lane")
        self.assertEqual(order.shipping_city, "Mumbai")
        self.assertEqual(order.shipping_state, "Maharashtra")
        self.assertEqual(order.shipping_zip, "400001")
        self.assertEqual(order.shipping_country, "India")
        self.assertIn("123 Cherry Lane", order.shipping_address)
        self.assertEqual(order.total_amount, Decimal("36.00"))
        self.assertEqual(order.status, "pending")

    @patch('store.api.get_razorpay_client')
    def test_tampered_client_price_is_ignored(self, mock_get_client):
        """Test that any price submitted by the client is ignored; backend uses database price."""
        mock_client = MagicMock()
        mock_client.order.create.return_value = {
            "id": "order_test_tamper",
            "amount": 1800,
            "currency": "INR"
        }
        mock_get_client.return_value = mock_client

        tampered_payload = dict(self.checkout_payload)
        tampered_payload["items"] = [
            {"product_id": self.product.id, "quantity": 1, "price": 0.01}
        ]

        response = self.client.post(
            "/api/checkout",
            data=json.dumps(tampered_payload),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        order = Order.objects.get(razorpay_order_id="order_test_tamper")
        # Price should be database price (18.00), not tampered price (0.01)
        self.assertEqual(order.total_amount, Decimal("18.00"))

    @patch('store.api.get_razorpay_client')
    def test_out_of_stock_checkout_is_refused(self, mock_get_client):
        """Test that checkout is refused if requested quantity exceeds stock."""
        out_of_stock_payload = dict(self.checkout_payload)
        out_of_stock_payload["items"] = [
            {"product_id": self.product.id, "quantity": 50}
        ]

        response = self.client.post(
            "/api/checkout",
            data=json.dumps(out_of_stock_payload),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Not enough stock", response.json()["error"])
        mock_get_client.assert_not_called()

    @patch('store.api.get_razorpay_client')
    def test_double_delivery_verification_and_webhook_deducts_stock_once(self, mock_get_client):
        """Test idempotency: calling both verify-payment and webhook only decrements stock once."""
        mock_client = MagicMock()
        mock_client.utility.verify_payment_signature.return_value = True
        mock_client.utility.verify_webhook_signature.return_value = True
        mock_get_client.return_value = mock_client

        order = Order.objects.create(
            customer_email="buyer@example.com",
            phone_number="1234567890",
            total_amount=Decimal("36.00"),
            status="pending",
            razorpay_order_id="order_double_123"
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=self.product.price
        )

        initial_stock = self.product.stock_quantity  # 10

        # Step 1: Call verify-payment
        verify_resp = self.client.post(
            "/api/verify-payment",
            data=json.dumps({
                "razorpay_payment_id": "pay_test_001",
                "razorpay_order_id": "order_double_123",
                "razorpay_signature": "valid_signature_hash"
            }),
            content_type="application/json"
        )
        self.assertEqual(verify_resp.status_code, 200)
        self.assertEqual(verify_resp.json()["status"], "success")

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, initial_stock - 2)  # 8

        # Step 2: Call webhook for same order
        webhook_payload = json.dumps({
            "event": "order.paid",
            "payload": {
                "order": {"entity": {"id": "order_double_123"}},
                "payment": {"entity": {"id": "pay_test_001"}}
            }
        })

        with patch.object(settings, 'RAZORPAY_WEBHOOK_SECRET', 'test_secret'):
            webhook_resp = self.client.post(
                "/api/webhook",
                data=webhook_payload,
                content_type="application/json",
                HTTP_X_RAZORPAY_SIGNATURE="valid_webhook_sig"
            )
            self.assertEqual(webhook_resp.status_code, 200)

        # Stock must STILL be 8, not 6
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, initial_stock - 2)

        order.refresh_from_db()
        self.assertEqual(order.status, "paid")
        self.assertEqual(order.razorpay_payment_id, "pay_test_001")

    def test_webhook_rejected_when_signature_missing_or_invalid(self):
        """Test webhook returns 400 when X-Razorpay-Signature is missing or invalid."""
        with patch.object(settings, 'RAZORPAY_WEBHOOK_SECRET', 'valid_secret'):
            # Missing signature header
            resp_missing = self.client.post(
                "/api/webhook",
                data=json.dumps({"event": "order.paid"}),
                content_type="application/json"
            )
            self.assertEqual(resp_missing.status_code, 400)

            # Invalid signature
            with patch('store.api.get_razorpay_client') as mock_get_client:
                mock_client = MagicMock()
                mock_client.utility.verify_webhook_signature.side_effect = razorpay.errors.SignatureVerificationError()
                mock_get_client.return_value = mock_client

                resp_invalid = self.client.post(
                    "/api/webhook",
                    data=json.dumps({"event": "order.paid"}),
                    content_type="application/json",
                    HTTP_X_RAZORPAY_SIGNATURE="bad_signature"
                )
                self.assertEqual(resp_invalid.status_code, 400)

    def test_stock_insufficient_at_payment_flags_needs_refund(self):
        """Test that if stock drops to 0 before payment verification, order is marked needs_refund."""
        order = Order.objects.create(
            customer_email="buyer@example.com",
            phone_number="1234567890",
            total_amount=Decimal("18.00"),
            status="pending",
            razorpay_order_id="order_depleted_123"
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=5,
            price=self.product.price
        )

        # Force product stock to be lower than ordered quantity
        self.product.stock_quantity = 2
        self.product.save()

        processed_order = process_order_payment("order_depleted_123", "pay_late_123")
        self.assertEqual(processed_order.status, "needs_refund")
        self.product.refresh_from_db()
        # Stock should NOT be deducted
        self.assertEqual(self.product.stock_quantity, 2)
