# CV And Interview Pack

## Project Pitch

CaseFlow Books is a deployed bilingual bookstore and small-business operations
showroom built as a Next.js modular monolith with Supabase Auth/PostgreSQL. It
demonstrates server-owned commerce calculations, account-bound checkout,
role-aware operations, transactional order creation, isolated cross-device QR
practice, and repeatable Production QA.

## CV Bullets

- Built and deployed a Vietnam-first bilingual bookstore with 500 sellable
  editions, catalog discovery, edition comparison, account checkout, order
  history, cancellation, and admin/staff operations.
- Designed a layered Next.js modular monolith using thin Route Handlers,
  application use cases, Zod domain/DTO validation, repositories, Supabase Auth,
  PostgreSQL RLS, and transactional RPCs.
- Protected commerce integrity by reloading catalog records and calculating
  price, stock, discount, VAT, shipping, fees, and order totals on the server.
- Implemented idempotent account-bound order creation and atomic consumption of
  one eligible signup voucher per transaction.
- Built an isolated cross-device QR practice flow with server-owned amount,
  expiring capability sessions, confirmation code, attempt controls, and zero
  order/payment/inventory mutation.
- Established release gates across ESLint, TypeScript, build, architecture,
  secret/no-demo checks, Playwright, Production smoke testing, data cleanup, and
  traceable QA artifacts.

## English CV Version

- Built and deployed a Vietnam-first bilingual bookstore with 500 sellable
  editions, account-gated checkout, customer order self-service, and role-aware
  staff/admin operations.
- Structured a Next.js modular monolith around HTTP controllers, application
  use cases, Zod domain contracts, repositories, Supabase Auth/PostgreSQL RLS,
  and transactional order RPCs.
- Enforced server-owned pricing, inventory, discount, tax, shipping, fee, and
  order calculations instead of trusting browser totals.
- Delivered repeatable release evidence with Playwright Production journeys,
  architecture/security gates, temporary-data cleanup, and documented product
  boundaries.

## Interview Guide

### Why a modular monolith instead of microservices?

One team and one deployment do not justify distributed consistency, observability,
and network failure costs. Internal layers protect high-risk workflows while
keeping deployment and local development simple.

### Is this MVC?

It applies MVC responsibilities rather than forcing textbook folders. App
Router and feature components form presentation; Route Handlers are HTTP
controllers; domain contracts/use cases/repositories separate business and
data concerns. DTOs are Zod schemas plus inferred TypeScript types.

### How do you stop price tampering?

The browser sends edition IDs and quantities. The server reloads sellable
editions, stock, promotions, and policy configuration, then calculates every
trusted total before transaction commit.

### How is duplicate order submission handled?

The client reuses one checkout attempt ID. The use case first recovers an
existing order for the same customer/attempt, while the database transaction
enforces atomic order, items, and voucher state.

### Why is the QR practice flow separate from payment?

It demonstrates cross-device UX without creating false settlement. Its
completion cannot create an order, mark payment paid, change inventory, or
affect analytics revenue.

### What is protected only by UI?

Nothing security-critical. Hidden navigation improves usability; Route Handlers,
repositories, RLS, and policies enforce identity, role, ownership, and allowed
state transitions.

### What would change for a real buyer?

Start with buyer discovery, then replace branding and licensed catalog data,
configure domain/SMTP/monitoring, integrate approved payment and fulfillment
providers, complete legal content, and run provider-specific security/UAT.

### What would you improve next technically?

Only buyer-driven work: cross-device server cart if required, commercial
catalog ingestion, provider observability, backup drills, incident runbooks, and
real integration contracts. More generic features would weaken focus.
