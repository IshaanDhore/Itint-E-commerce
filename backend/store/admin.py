from django.contrib import admin
from .models import Product, Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('price',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock_quantity', 'created_at')
    search_fields = ('name',)
    list_filter = ('created_at',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_email', 'phone_number', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer_email', 'phone_number', 'razorpay_order_id', 'razorpay_payment_id', 'shipping_address')
    inlines = [OrderItemInline]
    readonly_fields = ('razorpay_order_id', 'razorpay_payment_id')
    fieldsets = (
        ("Customer Info", {
            "fields": ("customer_email", "phone_number")
        }),
        ("Shipping Address", {
            "fields": ("shipping_street", "shipping_city", "shipping_state", "shipping_zip", "shipping_country", "shipping_address")
        }),
        ("Order Details", {
            "fields": ("total_amount", "status", "razorpay_order_id", "razorpay_payment_id")
        }),
    )
