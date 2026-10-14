# Graph Report - tint_it  (2026-10-15)

## Corpus Check
- 27 files · ~11,791 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 148 nodes · 191 edges · 27 communities (16 shown, 11 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9c87baf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.py
- Command
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
- CCA 2 — CI/CD Pipeline Implementation & Deployment Report
- OrderAdmin
- urls.py

## God Nodes (most connected - your core abstractions)
1. `Order` - 13 edges
2. `StoreCheckoutAndPaymentTests` - 12 edges
3. `CCA 2 — CI/CD Pipeline Implementation & Deployment Report` - 10 edges
4. `Product` - 9 edges
5. `process_order_payment()` - 8 edges
6. `create_checkout_session()` - 8 edges
7. `OrderItem` - 8 edges
8. `itint Storefront Landing Page` - 8 edges
9. `CheckoutSchema` - 7 edges
10. `verify_payment()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `OrderItemInline` --uses--> `OrderItem`  [INFERRED]
  backend/store/admin.py → backend/store/models.py
- `Command` --uses--> `Order`  [INFERRED]
  backend/store/management/commands/prune_pending_orders.py → backend/store/models.py
- `StoreCheckoutAndPaymentTests` --uses--> `Product`  [INFERRED]
  backend/store/tests.py → backend/store/models.py
- `StoreCheckoutAndPaymentTests` --uses--> `Order`  [INFERRED]
  backend/store/tests.py → backend/store/models.py
- `StoreCheckoutAndPaymentTests` --uses--> `OrderItem`  [INFERRED]
  backend/store/tests.py → backend/store/models.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Knowledge Graph Integration & Workflow** — _agents_rules_graphify_graphify_rules, _agents_rules_graphify_graphify_query_rule, _agents_rules_graphify_graphify_update_rule, _agents_workflows_graphify_graphify_workflow [INFERRED 0.85]
- **E-Commerce Shopping & Checkout Flow** — frontend_index_shop_bento_grid, frontend_index_cart_drawer, frontend_index_checkout_modal, frontend_index_razorpay_integration [INFERRED 0.95]

## Communities (27 total, 11 thin omitted)

### Community 0 - "api.py"
Cohesion: 0.18
Nodes (17): OrderItemInline, create_checkout_session(), get_razorpay_client(), health_check(), list_products(), process_order_payment(), Shared atomic and idempotent function to mark an order as paid and decrement…, razorpay_webhook() (+9 more)

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
Cohesion: 0.14
Nodes (12): 1. Prerequisites, 2. Setup, Architecture Overview, Deployment, itint — E-Commerce Storefront & API, Local Development, Step 1: Render One-Click Blueprint, Step 2: Configure Environment Variables (+4 more)

### Community 19 - "CheckoutSchema"
Cohesion: 0.21
Nodes (7): CartItemSchema, CheckoutSchema, ProductSchema, ShippingAddressSchema, field_validator, Schema, ValidationInfo

### Community 24 - "CCA 2 — CI/CD Pipeline Implementation & Deployment Report"
Cohesion: 0.13
Nodes (15): 1. Project Overview & Selection, 2. CI/CD Architecture & Pipeline Flow, 3. Pipeline Stages Breakdown, 4. AWS Server & Tool Installation Guide, 5. Jenkins Setup & Job Configuration, 6. How to Deploy & Verify (Run #1), 7. Demonstrating Source Code Change (Run #2), 8. Artifacts Included in this Submission (+7 more)

### Community 25 - "OrderAdmin"
Cohesion: 0.67
Nodes (3): OrderAdmin, ProductAdmin, register

## Knowledge Gaps
- **29 isolated node(s):** `Migration`, `Migration`, `Migration`, `build.sh script`, `1. Project Overview & Selection` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StoreCheckoutAndPaymentTests` connect `StoreCheckoutAndPaymentTests` to `api.py`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Order` connect `api.py` to `StoreCheckoutAndPaymentTests`, `Command`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `CCA 2 — CI/CD Pipeline Implementation & Deployment Report` connect `CCA 2 — CI/CD Pipeline Implementation & Deployment Report` to `Deployment`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `Order` (e.g. with `create_checkout_session()` and `process_order_payment()`) actually correct?**
  _`Order` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `StoreCheckoutAndPaymentTests` (e.g. with `Order` and `OrderItem`) actually correct?**
  _`StoreCheckoutAndPaymentTests` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `Product` (e.g. with `create_checkout_session()` and `list_products()`) actually correct?**
  _`Product` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `process_order_payment()` (e.g. with `Order` and `Product`) actually correct?**
  _`process_order_payment()` has 2 INFERRED edges - model-reasoned connections that need verification._