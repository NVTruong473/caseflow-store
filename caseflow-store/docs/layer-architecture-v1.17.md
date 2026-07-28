# CaseFlow Books Layer Architecture

## Scope

This document redraws the complete `v1.17.0` application architecture from the
deployed system boundary down to the database. It describes the source that
exists in the repository. It does not claim that CaseFlow Books is a
microservice system, a textbook MVC application, or a live payment/logistics
platform.

CaseFlow Books is a layered Next.js modular monolith:

- page and feature components own presentation;
- Route Handlers act as HTTP controllers;
- use cases coordinate high-risk workflows;
- policies, Zod schemas, and calculation modules own business rules;
- repositories own persistence and row mapping;
- Supabase provides authentication and PostgreSQL;
- Vercel hosts the application runtime.

## Report-ready Summary Diagram

Use this compact diagram when a report needs one full-system architecture
figure before the detailed module and sequence diagrams.

```mermaid
flowchart TB
  Users["Customer / Staff / Admin"]

  subgraph Presentation["1. Presentation"]
    Pages["Next.js App Router pages"]
    Features["Storefront, Cart, Checkout, Account, Admin"]
    BrowserState["Cart / Guidance / Checkout Intent"]
  end

  subgraph Controllers["2. HTTP Controllers"]
    Routes["Next.js Route Handlers"]
  end

  subgraph Application["3. Application Services"]
    UseCases["Order, Cancellation, Operations,<br/>Notification, Checkout Experience"]
  end

  subgraph Domain["4. Domain And Policy"]
    Validation["Zod / DTO Contracts"]
    Policies["Auth, Ownership, State Transitions"]
    Commerce["Trusted Totals, VAT, Voucher, Stock"]
    Payment["Payment Provider And Webhook Policies"]
  end

  subgraph Data["5. Data And Integration"]
    Repositories["Supabase Repositories And Mappers"]
    Providers["Payment / Email / SMS Adapters"]
  end

  subgraph Infrastructure["6. Infrastructure"]
    Auth["Supabase Auth"]
    Database["PostgreSQL, RLS, RPC, Transactions"]
    Hosting["Vercel"]
  end

  Users --> Pages
  Pages --> Features
  Features <--> BrowserState
  Pages --> Routes
  Features --> Routes
  Routes --> UseCases
  Routes --> Validation
  UseCases --> Policies
  UseCases --> Commerce
  UseCases --> Payment
  UseCases --> Repositories
  Payment --> Providers
  Repositories --> Auth
  Repositories --> Database
  Hosting --> Pages
  Hosting --> Routes
```

## 1. System And Deployment Context

```mermaid
flowchart LR
  Customer["Customer browser"]
  Operator["Admin or staff browser"]
  Vercel["Vercel<br/>Next.js modular monolith"]
  Auth["Supabase Auth"]
  DB["Supabase PostgreSQL<br/>RLS, constraints, RPCs"]
  Email["Optional email provider<br/>disabled or sandbox by default"]
  SMS["Optional SMS provider<br/>disabled or sandbox by default"]

  Customer -->|"HTTPS"| Vercel
  Operator -->|"HTTPS"| Vercel
  Vercel -->|"SSR cookie auth"| Auth
  Vercel -->|"anon/session and server-only service role"| DB
  Vercel -.->|"explicitly configured delivery only"| Email
  Vercel -.->|"explicitly configured delivery only"| SMS
```

The browser never connects to a payment gateway, notification secret, or
service-role credential. There is no real bank settlement, card processor,
shipping carrier, warehouse feed, or map tracking integration in this
showroom release.

## 2. Application Layers

```mermaid
flowchart TB
  subgraph L1["Layer 1 - Presentation"]
    Pages["src/app pages and layouts<br/>Server Components"]
    Features["src/features<br/>Client and feature components"]
    UI["src/components/ui<br/>shared accessible primitives"]
    BrowserState["Cart, guidance, and checkout attempt state<br/>React Context and localStorage"]
  end

  subgraph L2["Layer 2 - HTTP Controllers"]
    Routes["src/app/api/**/route.ts<br/>authenticate, authorize, parse, map envelopes"]
  end

  subgraph L3["Layer 3 - Application"]
    UseCases["src/lib/use-cases<br/>order, cancellation, operations,<br/>notifications, checkout experience"]
  end

  subgraph L4["Layer 4 - Domain And Policy"]
    Validation["src/lib/validation and Zod contracts"]
    Policies["src/lib/policies and auth rules"]
    Commerce["src/lib/checkout and orders<br/>trusted totals and state transitions"]
    PaymentDomain["src/lib/payments<br/>provider interface, webhook, VietQR"]
    NotificationDomain["src/lib/notifications<br/>templates, dispatch policy, OTP hashing"]
  end

  subgraph L5["Layer 5 - Data And Integration"]
    Repositories["src/lib/repositories<br/>Supabase queries and row mappers"]
    SupabaseClients["src/lib/supabase<br/>browser, SSR, and service-role clients"]
    Providers["Payment and notification provider adapters"]
  end

  subgraph L6["Layer 6 - Infrastructure"]
    Auth["Supabase Auth"]
    Postgres["PostgreSQL<br/>RLS, grants, constraints, transactions, RPCs"]
    Hosting["Vercel runtime and environment configuration"]
  end

  Pages --> Features
  Features --> UI
  Features <--> BrowserState
  Pages --> Routes
  Features --> Routes
  Routes --> UseCases
  Routes --> Validation
  UseCases --> Policies
  UseCases --> Commerce
  UseCases --> PaymentDomain
  UseCases --> NotificationDomain
  UseCases --> Repositories
  Repositories --> SupabaseClients
  PaymentDomain --> Providers
  NotificationDomain --> Providers
  SupabaseClients --> Auth
  SupabaseClients --> Postgres
  Hosting --> Pages
  Hosting --> Routes
```

Allowed dependency direction is downward. UI code may call same-origin
controllers, but it must not import the service-role client or write trusted
commerce state. Repositories may map database rows, but they do not render UI.

## 3. Feature Modules

| Module | Presentation responsibility | Server/application responsibility |
|---|---|---|
| Books | Home, catalog, filters, details, edition comparison, merchandising | Catalog reads, active/sellable filtering, content quality |
| Cart | Local cart drawer, quantity and removal controls | Server revalidation through `/api/cart/validate` |
| Checkout | Profile gate, official/experience selection, review, success | Trusted totals, voucher validation, atomic order creation |
| Customer | Account, profile, notifications, order history, cancellation | Ownership checks, password assurance, order transitions |
| Admin | Dashboard, catalog, inventory, orders, promotions, customers | Role/permission checks and operational use cases |
| Payments | QR status and payment presentation | Provider interface, HMAC webhook, idempotency, Production lock |
| Notifications | Customer inbox and operator delivery status | Outbox, templates, provider modes, OTP hash/expiry/attempt policy |
| Assistant | Rule-based guided search UI | Catalog-backed matching and bounded bookstore responses |
| Guidance | Contextual customer tours | Browser-local completion only; no commerce authority |

## 4. Storefront Read Flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant P as Next.js page
  participant R as Catalog repository
  participant S as Supabase

  B->>P: Request home, catalog, category, or product
  P->>R: Request active catalog data
  R->>S: RLS-scoped query
  S-->>R: snake_case rows
  R-->>P: validated camelCase domain objects
  P-->>B: Server-rendered HTML and local cover assets
```

Catalog content is read from active/sellable records. Price, stock, edition
identity, and publication metadata come from repository-backed domain objects,
not from decorative client fixtures.

## 5. Cart And Buy Now Checkout

Both purchase entry points converge at the same trusted server boundaries, but
their browser state remains intentionally separate.

```mermaid
flowchart TB
  Detail["Product detail<br/>edition and quantity"]
  Add["Add to cart"]
  Buy["Buy now"]
  Cart["Saved cart<br/>editionId and quantity only"]
  Intent["Strict URL intent<br/>editionId and quantity only"]
  Auth["Customer authentication and profile gate"]
  Validate["POST /api/cart/validate<br/>reload price, stock, sellability"]
  Review["Checkout review<br/>official or QR experience"]
  Create["POST /api/orders<br/>request DTO only"]
  UseCase["createBookOrderUseCase"]
  Totals["Server totals, voucher, VAT,<br/>shipping and payment fee"]
  RPC["create_book_order_with_items_v2<br/>atomic database RPC"]
  Success["Order success snapshot"]

  Detail --> Add --> Cart
  Detail --> Buy --> Intent
  Cart --> Auth
  Intent --> Auth
  Auth --> Validate
  Validate --> Review
  Review -->|"Official checkout"| Create
  Create --> UseCase --> Totals --> RPC --> Success
  Review -->|"Experience only"| Experience["Isolated QR experience<br/>creates no order or payment"]
  Success -->|"Cart checkout"| Clear["Clear purchased cart"]
  Success -->|"Buy Now"| Preserve["Preserve saved cart"]
```

The URL and localStorage are untrusted transport. They never carry an
authoritative price, discount, VAT, fee, order state, payment state, or role.
Malformed Buy Now intent fails closed instead of falling back to the cart.

## 6. Order, Payment, And Notification Write Flow

```mermaid
sequenceDiagram
  participant UI as Customer UI
  participant C as Route Handler
  participant U as Order use case
  participant P as Domain policies
  participant R as Repositories
  participant DB as PostgreSQL RPC
  participant O as Notification outbox

  UI->>C: POST order DTO with edition IDs and quantities
  C->>C: Authenticate, validate, stable error mapping
  C->>U: Execute command
  U->>P: Check profile, voucher, stock, transitions, totals
  U->>R: Load trusted catalog and customer state
  U->>DB: Atomic order, items, voucher mutation
  DB-->>U: Persisted order snapshot
  U->>O: Append lifecycle event
  U-->>C: Use-case result
  C-->>UI: Stable API envelope
```

Persisted QR payment sessions are a separate domain from the isolated checkout
experience. Payment status and fulfillment status are separate fields.
Production cannot call the development simulate-success endpoint.

## 7. Customer Authentication And Authorization

```mermaid
flowchart LR
  Request["Page or API request"]
  Cookie["Supabase SSR cookie session"]
  Profile["profiles role and ownership lookup"]
  Policy{"Authorization policy"}
  Customer["Customer-owned response or action"]
  Staff["Permission-scoped staff operation"]
  Admin["Admin-only operation"]
  Denied["401 or 403 stable response"]

  Request --> Cookie --> Profile --> Policy
  Policy -->|"customer owns resource"| Customer
  Policy -->|"staff permission"| Staff
  Policy -->|"admin role"| Admin
  Policy -->|"missing or insufficient"| Denied
```

Navigation visibility is only presentation. Every protected Route Handler
repeats authentication, role, ownership, and transition checks on the server.
Customers use single-use email recovery for password changes. Admin/staff
password changes add current-password reauthentication and a server-only
operations control; this is a showroom safeguard, not enterprise MFA.

## 8. Admin And Staff Operations

```mermaid
flowchart TB
  Dashboard["Admin/staff dashboard"]
  Controller["Protected admin Route Handler"]
  Permission["Role and permission policy"]
  UseCase["Operational use case"]
  Repository["Dashboard, order, catalog,<br/>promotion, inventory repository"]
  DB["PostgreSQL and audit-supporting records"]

  Dashboard --> Controller --> Permission
  Permission -->|"allowed"| UseCase --> Repository --> DB
  Permission -->|"denied"| Error["403 stable response"]
```

Staff handles bounded day-to-day operations. Admin retains higher-risk
settings and promotion authority. Rejected/cancelled orders are excluded from
collectable pending-payment metrics by server-owned dashboard normalization.

## 9. Payment Boundaries

```mermaid
flowchart LR
  Order["Persisted order with trusted VND total"]
  PaymentAPI["Payment Route Handlers"]
  Service["Payment service"]
  Provider{"Provider adapter"}
  Mock["Mock gateway<br/>non-Production only"]
  VietQR["Demo VietQR payload"]
  Webhook["HMAC and idempotent webhook handler"]
  DB["payments and orders"]

  Order --> PaymentAPI --> Service --> Provider
  Provider --> Mock
  Provider --> VietQR
  Mock --> Webhook --> DB
  VietQR --> DB
```

The service owns payment state transitions. The frontend can render a returned
QR payload and poll status, but it cannot choose the amount, access the webhook
secret, or mark a payment paid. The separate checkout experience is a
showroom interaction and cannot mutate these tables.

## 10. Notification Boundaries

```mermaid
flowchart LR
  Event["Order, transfer, or account event"]
  Outbox["Transactional outbox"]
  Dispatcher["Notification dispatcher"]
  Template["Centralized bilingual template"]
  InApp["Customer in-app inbox"]
  Email["Email adapter"]
  SMS["SMS adapter"]
  Ops["Staff/admin delivery status"]

  Event --> Outbox --> Dispatcher --> Template
  Template --> InApp
  Template -.-> Email
  Template -.-> SMS
  Dispatcher --> Ops
```

External delivery is fail-closed unless explicitly configured. Sandbox mode
records inspectable previews without network delivery. OTP values are hashed
and bounded by ownership, expiry, resend, and attempt limits.

## 11. Data Ownership

| Data | Authoritative owner | Browser role |
|---|---|---|
| Catalog price and stock | PostgreSQL through catalog repositories | Display only |
| Cart selection | Browser localStorage | Stores edition ID and quantity |
| Buy Now selection | Strict same-origin URL intent | Transports edition ID and quantity |
| Shipping, VAT, fee, discount, total | Server checkout policy | Displays server result |
| Customer identity and role | Supabase Auth and `profiles` | Holds SSR session cookie |
| Order and order items | PostgreSQL transaction/RPC | Submits request DTO and reads own result |
| Payment status | Payment service and `payments` table | Polls authorized status |
| Notification state | Outbox and notification repositories | Reads own inbox |
| Guidance completion | Browser localStorage | Presentation preference only |

## 12. Boundary Rules

1. Client code never imports service-role modules or provider secrets.
2. Route Handlers remain thin controllers and map stable API envelopes.
3. High-risk mutations go through use cases instead of direct UI-to-repository
   calls.
4. Domain validation and policy run before persistence.
5. Repositories own database queries and snake_case-to-camelCase mapping.
6. Order totals are always recalculated on the server.
7. Authentication, role, ownership, and transition checks are repeated on
   every protected server boundary.
8. Payment and fulfillment states remain separate.
9. Mock settlement stays disabled in Production.
10. New external providers or runtime boundaries require an ADR.

## 13. Why This Is Not A Textbook MVC Rewrite

Next.js App Router combines server rendering and same-origin HTTP endpoints in
one deployable unit. Forcing folders named `models`, `views`, and
`controllers` would not improve the actual dependency direction. The project
uses the useful parts of layered architecture:

- React/Next.js pages and features are the view/presentation layer.
- Route Handlers are controllers.
- Zod/domain types and business policies are the model/domain layer.
- Use cases are the application service layer.
- Repositories and Supabase clients are the data-access layer.
- Request and response schemas are DTO contracts.

This mapping is explicit, testable, and compatible with the framework rather
than imitating an unrelated server architecture.

## 14. Verification

The architecture is verified by:

- `npm run verify:architecture` for forbidden dependency and boundary checks;
- TypeScript for contract integrity;
- API and E2E tests for auth, role, ownership, order, payment, notification,
  cart, and Buy Now behavior;
- build and Production smoke tests for deploy-time and runtime integration;
- secret, no-demo, and Production mock-payment gates.

The authoritative implementation details remain in
[`architecture.md`](architecture.md), the ADR index under
[`adr/README.md`](adr/README.md), and the source paths named above.

## 15. Report Reuse

- Recommended placement: the report chapter `System Design / Overall
  Architecture`, after the technology-stack overview and before module or
  database details.
- Recommended Vietnamese caption: `Hinh: Kien truc phan lop tong the cua he
  thong CaseFlow Books`.
- Recommended English caption: `Figure: CaseFlow Books complete layered
  architecture`.
- Use the compact summary diagram for the main report. Move the detailed
  deployment, commerce, authentication, operations, payment, and notification
  diagrams to their corresponding subsections or appendix.
- Render from this Mermaid source when the report is generated. Do not keep a
  separately edited screenshot as the source of truth.
- If runtime boundaries change after `v1.17.0`, update this document and rerun
  `npm run verify:architecture` before reusing the figure.
