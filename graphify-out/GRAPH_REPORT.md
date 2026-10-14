# Graph Report - tint_it  (2026-10-15)

## Corpus Check
- 26 files · ~10,168 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 132 nodes · 175 edges · 24 communities (15 shown, 9 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a287e8e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.py
- Order
- itint Storefront Landing Page
- script.js
- Graphify Knowledge Graph Rules
- StoreConfig
- main
- itint Product Showcase Image
- asgi.py
- settings.py
- wsgi.py
- 0001_initial.py
- 0002_rename_stripe_checkout_id_order_razorpay_order_id_and_more.py
- StoreCheckoutAndPaymentTests
- Deployment
- CheckoutSchema
- 0003_order_phone_number_order_shipping_address_and_more.py
- build.sh

## God Nodes (most connected - your core abstractions)
1. `Order` - 13 edges
2. `StoreCheckoutAndPaymentTests` - 12 edges
3. `Product` - 9 edges
4. `process_order_payment()` - 8 edges
5. `create_checkout_session()` - 8 edges
6. `OrderItem` - 8 edges
7. `itint Storefront Landing Page` - 8 edges
8. `CheckoutSchema` - 7 edges
9. `verify_payment()` - 7 edges
10. `Deployment` - 7 edges

## Surprising Connections (you probably didn't know these)
- `OrderItemInline` --uses--> `OrderItem`  [INFERRED]
  backend/store/admin.py → backend/store/models.py
- `process_order_payment()` --uses--> `Order`  [INFERRED]
  backend/store/api.py → backend/store/models.py
- `process_order_payment()` --uses--> `Product`  [INFERRED]
  backend/store/api.py → backend/store/models.py
- `list_products()` --uses--> `Product`  [INFERRED]
  backend/store/api.py → backend/store/models.py
- `create_checkout_session()` --uses--> `Order`  [INFERRED]
  backend/store/api.py → backend/store/models.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Knowledge Graph Integration & Workflow** — _agents_rules_graphify_graphify_rules, _agents_rules_graphify_graphify_query_rule, _agents_rules_graphify_graphify_update_rule, _agents_workflows_graphify_graphify_workflow [INFERRED 0.85]
- **E-Commerce Shopping & Checkout Flow** — frontend_index_shop_bento_grid, frontend_index_cart_drawer, frontend_index_checkout_modal, frontend_index_razorpay_integration [INFERRED 0.95]

## Communities (24 total, 9 thin omitted)

### Community 0 - "api.py"
Cohesion: 0.19
Nodes (17): URL configuration for itint_backend project. The `urlpatterns` list routes URLs…, create_checkout_session(), get_razorpay_client(), health_check(), list_products(), process_order_payment(), ProductSchema, Shared atomic and idempotent function to mark an order as paid and decrement… (+9 more)

### Community 1 - "Order"
Cohesion: 0.16
Nodes (9): OrderAdmin, OrderItemInline, ProductAdmin, Command, Order, OrderItem, Product, BaseCommand (+1 more)

### Community 2 - "itint Storefront Landing Page"
Cohesion: 0.44
Nodes (9): Lip Tint Application Guide, Slide-out Cart Drawer, Checkout & Geolocation Modal, Product Feature & Formulation Grid, Hero Product Showcase, itint Storefront Landing Page, Storefront Navigation Bar, Razorpay Payment Gateway Script (+1 more)

### Community 3 - "script.js"
Cohesion: 0.19
Nodes (5): loadProduct(), openCheckoutModal(), saveCart(), setCheckoutError(), updateCartUI()

### Community 4 - "Graphify Knowledge Graph Rules"
Cohesion: 0.50
Nodes (4): Graphify Query & Navigation Guidelines, Graphify Knowledge Graph Rules, Graphify AST Update Rule, Graphify Execution Workflow

### Community 7 - "itint Product Showcase Image"
Cohesion: 1.00
Nodes (3): itint Product Showcase Image, itint Lip Tint Product, Pink Gift Packaging Box

### Community 16 - "StoreCheckoutAndPaymentTests"
Cohesion: 0.16
Nodes (9): Test that checkout is refused if requested quantity exceeds stock., Test idempotency: calling both verify-payment and webhook only decrements stock…, Test webhook returns 400 when X-Razorpay-Signature is missing or invalid., Test that if stock drops to 0 before payment verification, order is marked…, Test that checkout saves customer phone and full shipping address on the Order., Test that any price submitted by the client is ignored; backend uses database…, StoreCheckoutAndPaymentTests, patch (+1 more)

### Community 18 - "Deployment"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Setup, Architecture Overview, Deployment, itint — E-Commerce Storefront & API, Local Development, Step 1: Render One-Click Blueprint, Step 2: Configure Environment Variables (+4 more)

### Community 19 - "CheckoutSchema"
Cohesion: 0.24
Nodes (4): CartItemSchema, CheckoutSchema, field_validator, ValidationInfo

## Knowledge Gaps
- **17 isolated node(s):** `Migration`, `Migration`, `Migration`, `build.sh script`, `Architecture Overview` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StoreCheckoutAndPaymentTests` connect `StoreCheckoutAndPaymentTests` to `Order`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `Order` connect `Order` to `api.py`, `StoreCheckoutAndPaymentTests`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `CheckoutSchema` connect `CheckoutSchema` to `api.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `Order` (e.g. with `create_checkout_session()` and `process_order_payment()`) actually correct?**
  _`Order` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `StoreCheckoutAndPaymentTests` (e.g. with `Order` and `OrderItem`) actually correct?**
  _`StoreCheckoutAndPaymentTests` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `Product` (e.g. with `create_checkout_session()` and `list_products()`) actually correct?**
  _`Product` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `process_order_payment()` (e.g. with `Order` and `Product`) actually correct?**
  _`process_order_payment()` has 2 INFERRED edges - model-reasoned connections that need verification._