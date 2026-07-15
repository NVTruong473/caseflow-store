# Verified CV Bullets

These bullets are grounded in repository files, command output, and production
acceptance evidence. They intentionally avoid unmeasured performance claims,
inflated scale claims, and the implication that simulated checkout processes
real payments.

## Recommended three-bullet version

- Built and deployed a full-stack phone-accessories storefront with Next.js 16,
  TypeScript, Supabase PostgreSQL/Auth, and Vercel, covering a 5-category,
  16-product catalog, persistent guest cart, simulated checkout, and protected
  admin order workflow.
- Implemented a server-authoritative order pipeline with Zod validation,
  database-backed price/stock reloads, server-calculated VND totals, atomic
  order/item inserts, snapshot pricing, and RLS that denies direct public access
  to order data.
- Created and ran a 20-test Playwright release suite across storefront,
  checkout, error states, quantity limits, keyboard focus, three-role access
  control, and admin status updates; the final production run passed 20/20 with
  0 failed, flaky, or skipped tests.

## Alternative bullets by focus

### Full-stack delivery

- Delivered a Next.js modular monolith containing responsive storefront/admin
  UI and same-origin Route Handlers, backed by five Supabase tables and deployed
  to a public Vercel production URL.
- Mapped Supabase snake_case rows into typed camelCase domain objects and kept UI,
  validation, persistence, and auth concerns in explicit application modules.

### Security and data integrity

- Secured guest and admin workflows with Supabase SSR cookie sessions, RLS,
  explicit grants, server-side role checks, and a tested access matrix returning
  401 for anonymous admin requests and 403 for authenticated non-admin users.
- Prevented browser price and stock tampering by persisting only product IDs and
  quantities in localStorage, then reloading products and recalculating all
  order totals on the server.

### Frontend and quality

- Built responsive storefront, cart, checkout, success, login, order-list, and
  order-detail states verified at 375px, 768px, 1024px, and 1440px, including
  visible keyboard focus and horizontal-overflow checks.
- Exercised loading, empty, error, success, missing-product, empty-cart, and
  out-of-stock paths with stable UI and API fallbacks before accepting the
  production release.

## Interview summary

CaseFlow Store demonstrates one coherent full-stack delivery path: catalog data
is public through RLS, cart state is intentionally local, checkout sends only
IDs/quantities and customer fields, the server recalculates the order, and admin
access requires both a valid Supabase session and an admin profile. The design
favors a small, auditable deployment surface over microservices.

The checkout is simulated. It persists orders but does not collect card data,
charge shipping/tax, decrement inventory, or process payment. Those boundaries
are documented rather than presented as completed commerce capabilities.

## Evidence ledger

| Claim | Evidence |
|---|---|
| Public production deployment | `https://caseflow-store.vercel.app`; `.agent/artifacts/d19-t05-production-acceptance.json` |
| 5 categories and 16 products | `supabase/seed.sql`; preview/production smoke artifacts |
| Five RLS-enabled tables | `supabase/schema.sql`; `docs/supabase-proof-of-connection.md` |
| Server-owned totals and atomic order/item insert | `src/app/api/orders/route.ts`; `src/lib/repositories/supabase-orders.ts`; `supabase/schema.sql` |
| Anonymous/customer/admin access matrix | `tests/e2e/admin-access.spec.ts`; production Playwright report |
| 20/20 production suite | `.agent/artifacts/d19-t05-production-report.png`; `d19-t05-production-acceptance.json` |
| Four responsive widths | `.agent/artifacts/d12-t01-breakpoint-check.json` and associated screenshots |
| Keyboard focus coverage | `.agent/artifacts/d12-t02-keyboard-focus-check.json`; `tests/e2e/keyboard-focus.spec.ts` |
| Known release boundaries | `docs/known-limitations.md` |
