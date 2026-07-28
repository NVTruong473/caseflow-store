# Case Study: CaseFlow Books

## Executive Summary

CaseFlow Books turns a basic commerce MVP into a deployable bookstore showroom
that demonstrates both customer commerce and small-business operations. The
product serves Vietnamese readers who compare English originals with Vietnamese
editions, while giving staff and administrators a separate operational surface.

The implementation is a Next.js modular monolith on Vercel with Supabase Auth
and PostgreSQL. It applies Controller, use-case, domain/policy, repository, and
infrastructure boundaries where risk justifies them. It does not imitate
microservices or textbook MVC folder names for their own sake.

## Problem

A portfolio e-commerce site is weak if it only looks polished. A buyer or
interviewer needs evidence that the system can:

- help a reader find the right edition;
- keep price, stock, discounts, and totals authoritative on the server;
- complete an account-bound checkout without corrupting an existing cart;
- let customers view and cancel eligible orders;
- let staff operate orders and inventory without inheriting every admin power;
- remain honest about simulated payments and missing real-world providers;
- prove its claims through repeatable tests and release evidence.

## Audience And Primary Jobs

| Audience | Primary job |
|---|---|
| Reader | Discover, compare, buy, and revisit book orders with minimal ambiguity |
| Staff | Process orders, inspect stock, and handle routine operations |
| Admin | Govern catalog, promotions, customer operations, settings, and elevated actions |
| Source-code buyer | Evaluate architecture, customization scope, evidence, and known prerequisites |
| Interviewer | Inspect concrete full-stack decisions instead of generic feature claims |

## Constraints

- Vietnam-first checkout with VND as the source currency.
- Vietnamese and English interface modes.
- No real payment settlement, bank account, card data, or carrier integration.
- Cart remains browser-local and stores only edition IDs and quantities.
- One Next.js deployment; no unsupported distributed-system claims.
- Public repository is a showroom under a proprietary source license.
- Product claims must be tied to source, test, or release evidence.

## Product Decisions

### Bilingual edition discovery

The catalog models works and sellable editions separately. A reader can inspect
language, format, ISBN, stock, and price, then compare related English and
Vietnamese editions. The active catalog contains 500 editions across 50 works,
split evenly between English and Vietnamese products.

### Two purchase paths, one commerce authority

`Add to cart` supports multi-item shopping. `Buy now` carries only edition ID
and quantity to an isolated checkout intent. It does not copy a browser price,
mutate the saved cart, or create an order from the product page. Both paths
reload trusted book data and recalculate totals on the server.

### Official checkout versus isolated practice

Official checkout creates an order using account profile data, one eligible
account-bound voucher, shipping choice, and a simulated payment method.
The QR practice mode is intentionally separate. It demonstrates cross-device
interaction with an expiring server session and confirmation code but performs
no commerce mutation.

### Role-aware operations

Customer, staff, and admin are separate identities. UI visibility improves
usability, but Route Handlers still enforce session, role, ownership, and
policy on the server. Staff handle routine operations; admin retains elevated
catalog, promotion, customer, and settings authority.

## Architecture

The main request direction is:

```text
Presentation
  -> Route Handler / HTTP Controller
  -> Application Use Case
  -> Domain Policy and Zod DTO validation
  -> Repository
  -> Supabase Auth / PostgreSQL / RLS / RPC
```

High-risk order creation uses a dedicated use case and transactional database
RPC. Lower-risk reads stay direct enough to avoid abstraction without value.
The complete map is in
[layer-architecture-v1.17.md](../layer-architecture-v1.17.md).

## Security And Data Integrity

- Browser totals, prices, stock, role, and status are not trusted.
- Mutating API payloads are validated with Zod.
- Customer payment/order access is account-scoped.
- Admin/staff authorization is checked server-side.
- Order creation uses a stable checkout attempt ID and transaction boundary.
- Production locks mock payment completion and does not expose demo secrets.
- The practice QR session uses a capability token, expiry, server-owned amount,
  attempt limits, and a separate code.
- Secrets are excluded from repository artifacts and portfolio footage.

## Verification Evidence

The `v1.17.0` release records TypeScript, ESLint, production build, architecture,
security/no-demo gates, focused Playwright, full sequential Playwright, and
Production smoke checks. This portfolio task added a fresh Production capture:

- customer order created;
- QR practice completed across desktop and mobile contexts;
- customer order history rendered;
- admin located and updated the temporary order;
- 14 screenshots captured;
- zero page/console errors collected;
- temporary account, order, and voucher data removed.

See [claims-evidence-index.md](claims-evidence-index.md) and
[video-qa-report.md](video-qa-report.md).

## Outcome

The result is a compact, inspectable full-stack commerce showroom. It provides
enough depth to discuss product UX, authorization, transactional integrity,
server-owned calculations, test strategy, release discipline, and buyer
customization without pretending that simulated integrations are Production
commerce.

No revenue, conversion, customer count, or performance improvement is claimed:
the repository does not contain reliable evidence for those business outcomes.

## Tradeoffs And Next Buyer Work

- A browser-local cart is simple and privacy-preserving but does not sync across
  devices.
- A modular monolith reduces operational overhead but requires disciplined
  internal boundaries.
- A seeded catalog proves data shape and merchandising, not licensed commercial
  supply.
- Supabase Auth and PostgreSQL reduce infrastructure work but create provider
  coupling that a buyer must explicitly accept.
- Real launch requires brand discovery, licensed catalog data, legal policies,
  business email/SMTP, monitoring, provider-backed payment, fulfillment,
  backups, incident response, and operating ownership.
