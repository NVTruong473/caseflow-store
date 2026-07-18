# CaseFlow Books Architecture

## Status

This document describes the deployed CaseFlow Books architecture after the Day
21-40 upgrade, the realistic catalog/content merchandising release, and the
`v1.3.0` visual merchandising polish. The system is intentionally a Next.js
modular monolith: it demonstrates a realistic specialist e-commerce workflow
without claiming marketplace scale, real payment processing, or enterprise
operations.

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

`V12-T11` applied the accepted v1.2 additive catalog migration to Supabase
production. `book_editions` now also carries edition-pair, reason-to-read,
display-fact, omitted-fact, source-edition-key, and source-review-status fields.
The database also includes catalog provenance records, content-quality checks,
catalog compatibility records, merchandising shelves, and merchandising shelf
items. The data-freeze import contains 50 active works, 100 active editions,
100 v1.2 cover assets, 602 provenance records, 2,000 content-quality checks, 9
merchandising shelves, and 20 manual shelf items. `V12-T12` through `V12-T15`
wire this data through homepage merchandising, catalog discovery, product
detail/edition comparison, and admin content-quality/merchandising operations.
`V12-T16` integrates the same accepted catalog across search, the rule-based
assistant, SEO, cart/order snapshots, exports, and current documentation.

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
practical, self-written summaries, and 100 local project-created SVG cover
illustrations for the active `v1.2` catalog. The generic placeholder remains
only as a fallback/admin quality state. The project does not hotlink commercial
book covers or copy publisher blurbs, reviews, or protected excerpts. The
current policy is documented in [`domain.md`](domain.md),
[`v1.2-cover-portfolio.md`](v1.2-cover-portfolio.md), and
[`v1.2-provenance-content-quality-contracts.md`](v1.2-provenance-content-quality-contracts.md).

## v1.2 provenance contract boundary

`V12-T04` defined catalog-specific provenance, edition-consistency,
content-quality, and public-safe serialization contracts. `V12-T11` applied the
additive storage needed for those contracts after the catalog, cover,
editorial, merchandising, and rollback plans were frozen. The legacy
`SourceNote` remains stable for existing estimate and source-note uses.

Public serialization uses an allowlist and never exposes internal reviewer
notes, rights-analysis notes, or source-edition matching keys. See
[`v1.2-provenance-content-quality-contracts.md`](v1.2-provenance-content-quality-contracts.md).

## Deployment and verification

- Production alias: `https://caseflow-store.vercel.app`.
- Current production deployment ID: `dpl_6in3zn6CsXKtj3mR2xjGVh4X3q59`
  (`v1.3.0`).
- Supabase hosts PostgreSQL and Auth.
- Production runtime variables include the public Supabase URL, public anon key,
  and server-only service-role key. Canonical metadata defaults to the
  production alias when `NEXT_PUBLIC_SITE_URL` is absent.
- The `v1.2` local release gate passed TypeScript, ESLint, production build,
  aggregate catalog/content/asset/runtime checks, cleanup, and 20 Playwright
  tests.
- The `v1.2` production smoke gate passed public page/API checks, 100-edition
  catalog quality, 100 v1.2 cover responses, protected customer/admin boundary
  checks, language mode, cart/checkout boundary, assistant, robots/sitemap, and
  20 production Playwright tests.
- The `v1.3.0` production release kept the same architecture and added visual
  merchandising polish. `QA-FINAL-T01` passed production smoke, full local
  production-style Playwright `20/20`, final tester audit, accessibility/
  mobile/performance checks, cleanup, secret-like scan, stale-claim scan,
  TypeScript, lint, and production build.
- Dependency audit status is recorded in
  [`v1.2-release-audit.md`](v1.2-release-audit.md).

## Decision record

The accepted decisions and their implementation outcomes are indexed in
[`adr/README.md`](adr/README.md).

## Evolution path

The next architecture changes should respond to real product requirements.
Likely candidates are real payment-provider integration, SMS/email
verification, stock reservation/decrement inside checkout, shipping-carrier
quotes, rate limiting, audit logs, managed product media, and cross-device
carts. Each major change requires a new ADR before implementation.
