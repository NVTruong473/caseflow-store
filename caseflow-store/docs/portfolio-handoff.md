# CaseFlow Books Portfolio Handoff

- Latest release: `v1.6.0`
- Production URL: `https://caseflow-store.vercel.app`
- GitHub Release: `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.6.0`
- Vercel deployment: `dpl_AxywdtLdcWEgeC9ytoiJwqNTwCK7`
- Project type: full-stack bookstore and small-business operations portfolio
- Stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Supabase
  PostgreSQL/Auth/RLS, Zod, Playwright, Vercel

## Positioning

CaseFlow Books is a focused e-commerce portfolio project, not a marketplace
clone. It demonstrates a realistic specialist bookstore with bilingual
discovery, account-gated checkout, server-owned order totals, customer order
history and cancellation, guarded tracking, and admin/staff operations in one
deployable Next.js modular monolith.

The strongest technical story is not "many features." It is that commerce,
access control, content safety, release evidence, and known limitations are
handled deliberately:

- Browser cart state stores only edition IDs and quantities.
- Server code reloads trusted book records before calculating subtotal,
  promotion, VAT, shipping, payment fee, and final VND totals.
- Customer/admin/staff access boundaries are checked server-side, not only by
  hiding UI.
- The 500-edition catalog uses local project-created cover assets and
  self-written summaries instead of copied commercial covers or publisher
  blurbs.
- Release claims are backed by Playwright, production smoke, cleanup, audit,
  and screenshot evidence.

## Demo Script

### Public demo, no credentials

1. Open `https://caseflow-store.vercel.app`.
2. Show the bilingual bookstore positioning, language switcher, VND pricing,
   English-mode USD estimate, and cover-led merchandising shelves.
3. Open the catalog and demonstrate search, category, language, format, price,
   stock, and sort filters.
4. Open a book detail page and show title hierarchy, price, stock, edition
   comparison, reason-to-read copy, verified facts, related books, and cart
   entry.
5. Open the assistant and ask for a book recommendation or buying guidance.
6. Add an item to the cart, then open checkout to show the account gate and the
   fact that checkout does not accept anonymous orders.
7. Open order tracking with invalid data to show the guarded public lookup
   behavior without exposing customer data.
8. Open admin routes while signed out to show protected access boundaries.

### Private demo, with test credentials

Use private Supabase test identities only in a controlled environment. Do not
commit or share passwords.

1. Sign in as a customer, complete profile readiness, and walk through a
   simulated COD/bank/wallet checkout path.
2. Show customer order history, tracking-safe order details, and cancellation
   of an eligible order before fulfillment.
3. Sign in as staff/admin and show dashboard metrics, order operations,
   catalog management, inventory adjustments, promotions, customers, settings,
   CSV export, and rejection/cancellation of a risky order with internal notes.
4. Highlight that mutating admin/customer APIs repeat server-side role checks.

## Feature Matrix

| Area | Implemented |
|---|---|
| Storefront | Homepage merchandising, catalog, filters, sorting, book detail, edition comparison, related books |
| Catalog content | 50 works, 500 sellable editions, 250 English/250 Vietnamese products, local SVG cover portfolio |
| Localization | Vietnamese and English UI modes |
| Currency | VND source-of-truth, English-mode approximate USD estimate |
| Cart | Browser-local cart storing edition IDs and quantities only |
| Checkout | Account-gated simulated COD, bank transfer, MoMo, ZaloPay, VNPay-style choices |
| Customer | Profile readiness, order history, eligible cancellation, guarded public tracking |
| Admin/staff | Dashboard, orders, catalog, inventory, promotions, customers, settings, CSV export |
| Assistant | Rule-based bookstore assistant with guided result links |
| SEO | Metadata, canonical URLs, robots, sitemap, and eligible book JSON-LD |
| Quality | TypeScript, ESLint, production build, Playwright, production smoke, visual verifiers, cleanup and secret scans |

## Architecture Summary

CaseFlow Books uses a Next.js modular monolith deployed to Vercel. Pages,
Server Components, Client Components, and Route Handlers live in one
application. Supabase provides PostgreSQL, Auth, RLS, SSR cookie sessions, and
server-only service-role operations.

Core boundaries:

- `src/app`: routes, pages, metadata, and API Route Handlers.
- `src/features/books`: discovery, catalog, cards, detail, and related books.
- `src/features/cart`: local cart drawer and cart summary.
- `src/features/checkout`: account-gated checkout and totals display.
- `src/features/customer`: account, profile readiness, history, tracking.
- `src/features/admin`: dashboard and operational admin/staff surfaces.
- `src/lib/repositories`: Supabase persistence and trusted calculations.
- `src/lib/validation`: Zod schemas for public/customer/admin inputs.
- `supabase/migrations`: bookstore schema, RLS, grants, RPCs, and v1.2
  merchandising tables.

See `docs/architecture.md` for the full architecture notes.

## Verification Evidence

| Evidence | Location |
|---|---|
| Latest release notes | `docs/v1.6.0-retail-catalog-scale-release-notes.md` |
| v1.6 production catalog polish | `.agent/artifacts/v16-t01-production/catalog-retail-polish-check.json` |
| v1.6 production final QA | `.agent/artifacts/v16-t01-production/final-post-release-qa.json` |
| v1.6 production release smoke | `.agent/artifacts/v16-t01-production/production-release-smoke.json` |
| v1.6 QR production lock | `.agent/artifacts/v16-t01-production/qr-payment-production-safety-check.json` |
| v1.4.2 security posture | `.agent/artifacts/secqa-t01/security-posture-check.json` |
| v1.4.1 production smoke | `.agent/artifacts/v141-t01/production-release-smoke.json` |
| v1.4.1 customer cancellation | `.agent/artifacts/v141-t01/customer-order-history-check.json` |
| v1.4.1 admin rejection | `.agent/artifacts/v141-t01/admin-order-operations-check.json` |
| v1.4.1 compact-card visual check | `.agent/artifacts/v141-t01/compact-card-overlap-check.json` |
| v1.4 release readiness | `docs/v1.4-release-readiness-report.md` |
| v1.4 production smoke | `.agent/artifacts/v14-t13/production-release-smoke.json` |
| v1.4 visual screenshots | `.agent/artifacts/v14-t13/` |
| Final post-release QA | `docs/v1.3-final-post-release-qa-audit.md` |
| v1.3.1 overlap verifier | `scripts/verify-hotfix-compact-card-overlap.ts` |
| v1.3.1 production smoke | `.agent/artifacts/hotfix-v13-t01/production-release-smoke.json` |
| v1.3.1 visual screenshots | `.agent/artifacts/hotfix-v13-t01/` |
| v1.2 release audit | `docs/v1.2-release-audit.md` |
| CV bullets | `docs/cv-bullets.md` |
| Known limitations | `docs/known-limitations.md` |
| Architecture | `docs/architecture.md` |
| Full task evidence | `.agent/step-results.md` |

Latest verified gates include:

- `npx tsc --noEmit --pretty false`
- `npm run lint`
- `npm run build`
- production release smoke against `https://caseflow-store.vercel.app`
- V14 visual QA for homepage, catalog, detail, policy, checkout, customer, and
  admin surfaces
- customer order history and cancellation verifier
- admin/staff order rejection-cancellation verifier
- local and production compact-card overlap verifier
- affected v1.3 homepage/detail visual verifiers
- release cleanup check
- targeted secret-value scan
- `git diff --check`

## Interview Narrative

Short version:

> I built and deployed a bilingual bookstore with a 100-edition catalog,
> account-gated checkout, server-owned totals, customer order history and
> cancellation, guarded tracking, and admin/staff operations. The interesting
> part is the integrity boundary:
> cart state is local and untrusted, prices and totals are recalculated on the
> server, role checks are repeated server-side, and every release claim has
> evidence from TypeScript, lint, build, Playwright, production smoke, cleanup,
> and visual verification.

What to emphasize:

- Product thinking: focused bookstore depth instead of a shallow marketplace
  clone.
- Data modeling: works vs editions, bilingual edition pairs, catalog
  provenance, order snapshots, inventory and promotions.
- Security posture: service role stays server-only, stable API envelopes,
  RLS/session checks, explicit admin/staff permissions.
- QA discipline: release gates, screenshots, production smoke, cleanup,
  the `v1.3.1` hotfix verifier added after a real visual defect was found, and
  the `v1.4` real-commerce visual merchandising gate.

## Honest Boundaries

Do not claim these as production capabilities:

- Real payment processing.
- Real SMS OTP or provider-backed email verification.
- Live shipping carrier quotes, tax filing, bank FX, or reconciliation.
- Licensed commercial cover artwork or publisher metadata feed.
- Marketplace scale, seller onboarding, real revenue, or load-tested SLOs.
- Full privacy operations, automated data deletion, abuse monitoring, or
  enterprise audit logging.

These are documented in `docs/known-limitations.md` and should be presented as
clear next-step opportunities, not hidden capabilities.

## Strong Next Steps If The Project Continues

Only continue if the goal moves beyond portfolio polish:

- Add real observability: error tracking, request metrics, alerts, and an
  incident runbook.
- Add real provider integration through a new ADR: payment webhooks,
  idempotency, reconciliation, refunds, and failure states.
- Add production-grade identity hardening: MFA, real email/SMS verification,
  rate limits, and account recovery.
- Add operational audit logs and inventory reservation/decrement semantics.
- Add licensed metadata/media pipeline if the bookstore becomes commercial.
