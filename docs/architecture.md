# CaseFlow Books Architecture

## Status

This document describes the deployed CaseFlow Books `v1.1` architecture after
the Day 21-40 upgrade. The system is intentionally a Next.js modular monolith:
it demonstrates a realistic specialist e-commerce workflow without claiming
marketplace scale, real payment processing, or enterprise operations.

## System context

```mermaid
flowchart LR
  Shopper["Customer browser"]
  Operator["Admin or staff browser"]
  App["CaseFlow Books on Vercel"]
  Database["Supabase PostgreSQL"]
  Auth["Supabase Auth"]

  Shopper --> App
  Operator --> App
  App --> Database
  App --> Auth
```

Vercel runs one Next.js application. Supabase is the only external data and
identity service. There is no separate API deployment, payment provider,
shipping-carrier integration, SMS provider, or external AI assistant service.

## Runtime containers

```mermaid
flowchart TB
  Browser["Browser"]
  UI["Next.js Server and Client Components"]
  Cart["React Context and localStorage"]
  Routes["Next.js Route Handlers"]
  Domain["Zod validation, mappers, repositories"]
  Session["Supabase SSR cookie session"]
  Service["Server-only service-role client"]
  DB["PostgreSQL, RLS, order RPCs"]
  Auth["Supabase Auth"]

  Browser --> UI
  UI <--> Cart
  UI --> Routes
  UI --> Domain
  Routes --> Domain
  Domain --> Session
  Domain --> Service
  Session --> Auth
  Session --> DB
  Service --> DB
```

Production pages and Route Handlers use Supabase repositories. Earlier mock
repositories remain as development history and test fixtures, not the selected
production runtime path.

## Application boundaries

| Boundary | Responsibility |
|---|---|
| `src/app` | Pages, layouts, metadata, robots/sitemap, and same-origin Route Handlers |
| `src/features/books` | Storefront discovery, catalog, cards, filters, detail, and related books |
| `src/features/cart` | Browser-local cart drawer and cart summary |
| `src/features/checkout` | Account-gated checkout, totals display, payment-method choice, success state |
| `src/features/customer` | Account, profile readiness, order history, and public tracking UI |
| `src/features/admin` | Dashboard, orders, catalog, inventory, promotions, customers, settings, exports |
| `src/features/assistant` | Rule-based bookstore assistant and guided result links |
| `src/components/ui` | Shared accessible UI primitives |
| `src/lib/validation` | Zod schemas for public, customer, checkout, and admin inputs |
| `src/lib/repositories` | Supabase persistence, trusted calculations, and operational queries |
| `src/lib/auth` | Customer/admin/staff session and role checks |
| `src/lib/checkout` | Server-owned shipping, VAT, payment fee, promotion, and FX estimate rules |
| `src/lib/seo` | Canonical URL, Open Graph, robots, sitemap, and JSON-LD helpers |
| `supabase/schema.sql` and `supabase/migrations` | Base schema, v1.1 book schema, RLS, grants, constraints, and RPCs |
| `tests/e2e` | Release flows and access-control verification |

Database rows use `snake_case`. Repository mappers convert them to
`camelCase` domain objects before UI or API code consumes them.

## Core request flows

### Catalog read

```text
Browser request
  -> Next.js page or GET Route Handler
  -> Supabase book repository
  -> RLS-scoped active category/work/edition query
  -> row-to-domain mapping and Zod validation
  -> rendered UI or { data, error, meta } API envelope
```

Anonymous catalog reads use public RLS-scoped access. Public catalog results
include active book categories, works, sellable editions, author/publisher
metadata, safe cover references, pagination metadata, and stable error
envelopes.

### Local cart

```text
Browser localStorage cart
  -> editionId + quantity only
  -> cart drawer/detail/cart entry points
  -> POST /api/cart/validate before checkout display
  -> server reloads active edition records and recalculates line totals
```

The cart deliberately does not store trusted price, subtotal, tax, role, or
order status. It remains browser-local rather than cross-device.

### Account-gated checkout

```text
Customer session
  -> profile readiness check
  -> checkout cart validation
  -> payment/shipping method selection
  -> server-owned subtotal, promotion, VAT, shipping, payment fee, total
  -> create_book_order_with_items RPC
  -> order snapshot and confirmation state
```

Checkout requires a signed-in customer and enough profile/contact/address data
to submit the order. The server ignores browser-supplied totals and reloads
trusted edition records before creating the order. Simulated payment states
represent pending COD, bank transfer, or provider confirmation; no external
payment credential is collected or submitted.

### Customer order history and public tracking

```text
Signed-in customer
  -> own order API/page
  -> server session check
  -> own-order response only

Public lookup
  -> order code plus matching email or phone
  -> tracking-safe response
```

Public tracking intentionally returns the same not-found response for missing
orders and wrong-contact lookups to reduce order enumeration risk. It does not
expose raw address, raw phone, or customer email.

### Admin and staff operations

```text
Supabase Auth session
  -> profile role lookup
  -> admin/staff permission check
  -> protected admin page or Route Handler
  -> server-only repository
  -> operational mutation or read
```

UI navigation is not an authorization boundary. Protected admin Route Handlers
repeat role and permission checks server-side. Staff can access operational
screens allowed by policy; high-risk settings and promotion changes remain
admin-only where implemented.

## Data model

The active `v1.1` schema adds a bookstore domain while preserving the original
project history:

- `book_categories`, `book_works`, `book_editions`, author/category join
  tables, translators, publishers, and cover assets form the public catalog.
- `profiles` stores customer/admin/staff role and checkout-readiness profile
  fields.
- `orders` stores customer/order status, payment status, shipping status,
  shipping/tax/payment-fee/promotion snapshots, and guarded tracking fields.
- `order_items` stores book edition/work snapshots so historical orders do not
  change when catalog records change.
- `book_promotions` stores simple fixed-VND or percentage promotion codes.
- `book_inventory_adjustments` records operational stock adjustments.
- Monetary values are stored as integer VND amounts. USD display is an
  estimate, not a source-of-truth value.

The cart is absent from the database. It stores only `editionId` and `quantity`
in localStorage and is revalidated before checkout.

## Security model

| Actor | Catalog | Customer order history | Public tracking | Admin/staff APIs |
|---|---|---|---|---|
| Anonymous | Read active rows | Denied | Guarded lookup only | 401 |
| Authenticated customer | Read catalog and own profile | Own orders only | Guarded lookup only | 403 |
| Staff | Read catalog and allowed operations | Operational reads as allowed | Guarded lookup only | Permission-scoped |
| Admin | Read catalog and all operations in scope | Operational reads | Guarded lookup only | Allowed after role check |
| Server service role | Trusted backend operations | Trusted backend operations | Trusted backend operations | Internal only |

Additional controls:

- RLS is enabled on catalog, profile, order, promotion, and inventory tables.
- Public/admin mutating bodies are validated with Zod.
- The service-role key is read only by server modules and never exposed through
  `NEXT_PUBLIC_*`.
- Server code recalculates price, promotion, VAT, shipping, payment fee, and
  total values.
- The application does not collect card fields, real e-wallet credentials, or
  bank credentials.
- Phone/email profile fields are not backed by real SMS/OTP or email-provider
  verification in `v1.1`.
- Production does not contain Playwright admin/customer credentials.

## Content and asset model

CaseFlow Books uses factual classic/public-domain-style book metadata where
practical, self-written summaries, and internal placeholder cover assets. The
project does not hotlink commercial book covers or copy publisher blurbs,
reviews, or protected excerpts. The current policy is documented in
[`domain.md`](domain.md) and
[`v1.1-safe-cover-asset-strategy.md`](v1.1-safe-cover-asset-strategy.md).

## Deployment and verification

- Production alias: `https://caseflow-store.vercel.app`.
- Vercel deployment ID: `dpl_BkiJt9gDCh5d2cHwAhpFDbLotoAy`.
- Supabase hosts PostgreSQL and Auth.
- Production runtime variables include the public Supabase URL, public anon key,
  server-only service-role key, and canonical site URL.
- The local release gate passed TypeScript, ESLint, production build, cleanup,
  and 20 Playwright tests.
- The production smoke gate passed public page/API checks, protected admin
  boundary checks, robots/sitemap checks, assistant smoke, secret scan, and a
  5-test Playwright subset.
- Dependency audit status is recorded in
  [`v1.1-release-audit.md`](v1.1-release-audit.md).

## Decision record

The accepted decisions and their implementation outcomes are indexed in
[`adr/README.md`](adr/README.md).

## Evolution path

The next architecture changes should respond to real product requirements.
Likely candidates are real payment-provider integration, SMS/email
verification, stock reservation/decrement inside checkout, shipping-carrier
quotes, rate limiting, audit logs, managed product media, and cross-device
carts. Each major change requires a new ADR before implementation.
