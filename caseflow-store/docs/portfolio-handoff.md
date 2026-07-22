# CaseFlow Books Portfolio Handoff

- Latest release: `v1.12.1`
- Production URL: `https://caseflow-store.vercel.app`
- GitHub Release: `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.12.1`
- Vercel deployment: `dpl_Ar6sNH1nUraGoK25BhJt6Gn6KCrY`
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
- The 500-edition catalog uses local Project Gutenberg source-work covers where
  reviewed, local project-created fallback covers, and self-written summaries
  instead of copied publisher blurbs.
- The v1.8/v1.9 storefront adds search-first navigation, live category
  discovery, cover provenance evidence, restrained motion, real-cover
  merchandising, and long-page support on top of the reading-table/spine-rail
  motif.
- Account-bound signup vouchers, production email confirmation redirect, and
  signed-in password change are covered by focused production UAT/verifier
  evidence.
- Cancelled/rejected orders are normalized server-side so admin/staff
  dashboards do not count stale pending payments as still collectable.
- The highest-risk order creation API now follows a Controller -> Use Case ->
  Repository boundary, with an architecture verifier guarding import direction.
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
9. Mention that public sign-up and email confirmation were verified on
   production after Supabase Auth URL Configuration was corrected to the
   production domain.

### Private demo, with test credentials

Use private Supabase test identities only in a controlled environment. Do not
commit or share passwords. When presenting the project publicly, create a fresh
customer account rather than sharing a reusable password.

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
| Catalog content | 50 works, 500 sellable editions, 250 English/250 Vietnamese products, local source-work covers plus generated fallback cover portfolio |
| Localization | Vietnamese and English UI modes |
| Currency | VND source-of-truth, English-mode approximate USD estimate |
| Cart | Browser-local cart storing edition IDs and quantities only |
| Checkout | Account-gated simulated COD, bank transfer, MoMo, ZaloPay, VNPay-style choices |
| Customer | Supabase email confirmation, profile readiness, signup vouchers, order history, eligible cancellation, guarded public tracking, signed-in password change |
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
- `src/lib/use-cases`: application workflows for high-risk mutating APIs.
- `src/lib/repositories`: Supabase persistence and trusted calculations.
- `src/lib/api`: stable response envelope and controller/use-case mapping.
- `src/lib/validation`: Zod schemas for public/customer/admin inputs.
- `supabase/migrations`: bookstore schema, RLS, grants, RPCs, and v1.2
  merchandising tables.

See `docs/architecture.md` for the full architecture notes.

## Verification Evidence

| Evidence | Location |
|---|---|
| Latest release notes | `docs/v1.12.1-order-reliability-release-notes.md` |
| v1.12.1 production consistency audit | `docs/postv121-t01-final-release-consistency-audit.md` |
| v1.12.1 production smoke | `.agent/artifacts/order-reliability-t06-production-smoke/production-smoke-check.json` |
| v1.12.1 production security posture | `.agent/artifacts/order-reliability-t06-production-security/security-posture-check.json` |
| v1.12.1 QR production lock | `.agent/artifacts/order-reliability-t06-production-qr-safety/qr-payment-production-safety-check.json` |
| v1.12.1 post-release secret scan | `.agent/artifacts/order-reliability-t06-post-release-secret/secret-scan.json` |
| v1.12.0 production consistency audit | `docs/postv120-t01-final-release-consistency-audit.md` |
| v1.12.0 architecture boundary verifier | `.agent/artifacts/arch-layer-t05/layer-boundaries-check.json` |
| v1.12.0 production smoke | `.agent/artifacts/arch-layer-t07-production-smoke/production-smoke-check.json` |
| v1.12.0 production security posture | `.agent/artifacts/arch-layer-t07-production-security/security-posture-check.json` |
| v1.12.0 QR production lock | `.agent/artifacts/arch-layer-t07-production-qr-safety/qr-payment-production-safety-check.json` |
| v1.11.3 production consistency audit | `docs/postv113-t01-final-release-consistency-audit.md` |
| v1.11.1 dependency security patch | `docs/v1.11.1-security-dependency-patch-release-notes.md` |
| v1.11.1 production smoke | `.agent/artifacts/secdep-t01-production-smoke/production-smoke-check.json` |
| v1.11.1 production security posture | `.agent/artifacts/secdep-t01-production-security/security-posture-check.json` |
| v1.11.1 QR production lock | `.agent/artifacts/secdep-t01-production-qr-safety/qr-payment-production-safety-check.json` |
| v1.11 account security release notes | `docs/v1.11.0-account-security-password-release-notes.md` |
| v1.11 release consistency audit | `docs/postv111-t01-final-release-consistency-audit.md` |
| v1.11 production email UAT | `docs/auth-email-t03-real-email-confirmation-uat.md` |
| v1.11 production password change | `.agent/artifacts/auth-password-t01/customer-password-change-check.json` |
| v1.10 signup voucher release | `docs/v1.10.0-account-bound-signup-voucher-release-notes.md` |
| v1.9 real cover release | `docs/v1.9.0-real-cover-commerce-polish-release-notes.md` |
| v1.8 production bookstore UX | `.agent/artifacts/v18-t02-production/v18-bookstore-experience-check.json` |
| v1.8 production release smoke | `.agent/artifacts/v18-t02-production/production-release-smoke.json` |
| v1.8 production final QA | `.agent/artifacts/v18-t02-production/final-post-release-qa.json` |
| v1.8 production security posture | `.agent/artifacts/v18-t02-production/security-posture-check.json` |
| v1.8 QR production lock | `.agent/artifacts/v18-t02-production/qr-payment-production-safety-check.json` |
| v1.7 release notes | `docs/v1.7.0-ui-humanization-release-notes.md` |
| UI humanization audit | `docs/ui-humanization-audit.md` |
| UI style guide | `docs/style-guide.md` |
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
- `npm audit --audit-level=high`
- `npm run build`
- `npm run test:e2e`
- production email confirmation UAT after Supabase Auth URL Configuration fix
- production password-change verifier
- account-bound signup voucher verifier
- admin dashboard cancellation/payment summary verifier
- admin/staff cancellation normalization verifier
- UI humanization verifier
- 500-edition catalog verifier
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

> I built and deployed a bilingual bookstore with a 500-edition catalog,
> account-gated checkout, signup vouchers, email-confirmed accounts,
> self-service password change, server-owned totals, customer order history and
> cancellation, guarded tracking, and admin/staff operations. The interesting
> part is the integrity boundary:
> cart state is local and untrusted, prices and totals are recalculated on the
> server, role checks are repeated server-side, and every release claim has
> evidence from TypeScript, lint, build, Playwright, production smoke, cleanup,
> real-email UAT, QR production-safety checks, and visual verification. The
> later storefront passes also tightened the visual system so the site reads
> like a specialist bookstore rather than a generic AI-generated landing page.

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
- Operational honesty: the production email redirect bug was found through UAT,
  corrected in Supabase Auth URL Configuration, and rerun without service-role
  confirmation.
- Product design discipline: v1.7 introduced an audit-backed style guide,
  product-specific visual motif, reduced generic card repetition, and
  regression checks for overflow and focus behavior.

## Honest Boundaries

Do not claim these as production capabilities:

- Real payment processing.
- Real SMS OTP.
- Custom SMTP deliverability. Supabase default email confirmation passed on
  production, but `AUTH-SMTP-T02` remains blocked pending a real SMTP provider
  and Supabase Management API token.
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
- Configure custom SMTP for Supabase Auth and rerun the strict email
  confirmation UAT through that provider.
- Add real provider integration through a new ADR: payment webhooks,
  idempotency, reconciliation, refunds, and failure states.
- Add production-grade identity hardening: MFA, real SMS verification, rate
  limits, abuse controls, and account recovery.
- Add operational audit logs and inventory reservation/decrement semantics.
- Add licensed metadata/media pipeline if the bookstore becomes commercial.

For the latest operational handoff packet, see
`docs/v1.11-final-operational-handoff.md`.
