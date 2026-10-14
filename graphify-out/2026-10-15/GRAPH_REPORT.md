# Graph Report - tint_it  (2026-08-23)

## Corpus Check
- Corpus is ~6,832 words - fits in a single context window. You may not need a graph.

## Summary
- 71 nodes · 86 edges · 18 communities (11 shown, 7 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.94)
- Token cost: 2,000 input · 900 output

## Community Hubs (Navigation)
- Checkout & Payment API
- Store Models & Admin
- Storefront UI Components
- Frontend Cart & Interactions
- Agent Rules & Workflows
- Django App Configuration
- Django Management CLI
- Product Media Assets
- ASGI Server Entry
- Django Project Settings
- WSGI Server Entry
- Initial DB Migration
- Razorpay Migration

## God Nodes (most connected - your core abstractions)
1. `itint Storefront Landing Page` - 8 edges
2. `Order` - 7 edges
3. `create_checkout_session()` - 6 edges
4. `Product` - 6 edges
5. `OrderItem` - 6 edges
6. `Storefront Navigation Bar` - 5 edges
7. `verify_payment()` - 4 edges
8. `Bento Shop Product Card` - 4 edges
9. `Slide-out Cart Drawer` - 4 edges
10. `CheckoutSchema` - 3 edges

## Surprising Connections (you probably didn't know these)
- `OrderItemInline` --uses--> `OrderItem`  [INFERRED]
  backend/store/admin.py → backend/store/models.py
- `create_checkout_session()` --uses--> `OrderItem`  [INFERRED]
  backend/store/api.py → backend/store/models.py
- `create_checkout_session()` --uses--> `Product`  [INFERRED]
  backend/store/api.py → backend/store/models.py
- `list_products()` --uses--> `Product`  [INFERRED]
  backend/store/api.py → backend/store/models.py
- `create_checkout_session()` --uses--> `Order`  [INFERRED]
  backend/store/api.py → backend/store/models.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **E-Commerce Shopping & Checkout Flow** — frontend_index_shop_bento_grid, frontend_index_cart_drawer, frontend_index_checkout_modal, frontend_index_razorpay_integration [INFERRED 0.95]
- **Graphify Knowledge Graph Integration & Workflow** — _agents_rules_graphify_graphify_rules, _agents_rules_graphify_graphify_query_rule, _agents_rules_graphify_graphify_update_rule, _agents_workflows_graphify_graphify_workflow [INFERRED 0.85]

## Communities (18 total, 7 thin omitted)

### Community 0 - "Checkout & Payment API"
Cohesion: 0.25
Nodes (11): URL configuration for itint_backend project. The `urlpatterns` list routes URLs…, CartItemSchema, CheckoutSchema, create_checkout_session(), ProductSchema, razorpay_webhook(), verify_payment(), VerifyPaymentSchema (+3 more)

### Community 1 - "Store Models & Admin"
Cohesion: 0.23
Nodes (8): OrderAdmin, OrderItemInline, ProductAdmin, list_products(), OrderItem, Product, get, register

### Community 2 - "Storefront UI Components"
Cohesion: 0.44
Nodes (9): Lip Tint Application Guide, Slide-out Cart Drawer, Checkout & Geolocation Modal, Product Feature & Formulation Grid, Hero Product Showcase, itint Storefront Landing Page, Storefront Navigation Bar, Razorpay Payment Gateway Script (+1 more)

### Community 3 - "Frontend Cart & Interactions"
Cohesion: 0.32
Nodes (3): loadProduct(), saveCart(), updateCartUI()

### Community 4 - "Agent Rules & Workflows"
Cohesion: 0.50
Nodes (4): Graphify Query & Navigation Guidelines, Graphify Knowledge Graph Rules, Graphify AST Update Rule, Graphify Execution Workflow

### Community 7 - "Product Media Assets"
Cohesion: 1.00
Nodes (3): itint Product Showcase Image, itint Lip Tint Product, Pink Gift Packaging Box

## Knowledge Gaps
- **6 isolated node(s):** `Migration`, `Migration`, `Graphify Query & Navigation Guidelines`, `Graphify AST Update Rule`, `Graphify Execution Workflow` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Order` connect `Checkout & Payment API` to `Store Models & Admin`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `OrderItem` connect `Store Models & Admin` to `Checkout & Payment API`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Product` connect `Store Models & Admin` to `Checkout & Payment API`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Order` (e.g. with `create_checkout_session()` and `razorpay_webhook()`) actually correct?**
  _`Order` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `create_checkout_session()` (e.g. with `Order` and `OrderItem`) actually correct?**
  _`create_checkout_session()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Product` (e.g. with `create_checkout_session()` and `list_products()`) actually correct?**
  _`Product` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `OrderItem` (e.g. with `OrderItemInline` and `create_checkout_session()`) actually correct?**
  _`OrderItem` has 2 INFERRED edges - model-reasoned connections that need verification._