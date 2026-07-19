# Verified CV Bullets

These bullets are grounded in repository files, command output, deployment
evidence, and production smoke checks through the `v1.4.0` release. They
intentionally avoid unmeasured
performance claims, inflated scale claims, revenue claims, and the implication
that simulated payment flows process real money.

## Recommended three-bullet version

- Built and deployed CaseFlow Books, a full-stack bilingual bookstore with
  Next.js 16, TypeScript, Supabase PostgreSQL/Auth, and Vercel, covering a
  100-edition catalog, project-created cover portfolio, book-specific filters,
  local cart, account-gated checkout, customer order history, guarded
  tracking, and admin/staff operations.
- Implemented server-authoritative commerce logic with Zod validation,
  Supabase row mappers, RLS-backed access control, role-based admin/staff
  permissions, server-reloaded book records, promotion evaluation, VAT/shipping
  and payment-fee estimates, and VND totals that never trust browser-supplied
  prices or order state.
- Created and ran release gates across TypeScript, ESLint, production build,
  full local Playwright `20/20`, production smoke checks, full production
  Playwright `20/20`, assistant verification, cleanup checks, secret scan,
  content/provenance/cover quality checks, accessibility/mobile screenshots,
  documented dependency audit findings, a post-release visual hotfix with a
  dedicated compact-card overlap verifier, and a `v1.4` merchandising QA gate.

## Alternative bullets by focus

### Full-stack product delivery

- Delivered a Next.js modular monolith containing customer storefront,
  account, checkout, order tracking, rule-based assistant, and admin/staff
  operations in one Vercel deployment.
- Modeled a bookstore domain around works, editions, authors, translators,
  publishers, categories, cover assets, promotions, inventory adjustments,
  profiles, orders, order snapshots, source provenance, content-quality
  checks, and merchandising shelves.
- Built Vietnamese and English UI modes with VND as the authoritative currency
  and approximate USD display for English-mode users.

### Security and data integrity

- Secured customer, staff, and admin workflows with Supabase SSR cookie
  sessions, RLS, explicit server-side role checks, and tested 401/403/200
  access boundaries.
- Prevented client price/tax/fee/status tampering by storing only edition IDs
  and quantities in localStorage, then reloading book records and recalculating
  trusted totals on the server before order creation.
- Kept service-role secrets server-only and verified production deployment with
  a secret scan that excluded committed database URLs, service keys, admin
  passwords, and JWT-like values.

### Frontend, UX, and quality

- Built responsive bookstore discovery, catalog filters, book detail,
  English/Vietnamese edition comparison, cart, account-gated checkout,
  customer orders, tracking, and admin operations with 375px and 1440px visual
  verification.
- Added a rule-based bookstore assistant that can guide catalog search and
  buying steps without using an external AI API or bypassing checkout/account
  validation.
- Verified loading, empty, error, success, missing-book, out-of-stock,
  unauthorized, forbidden, keyboard-focus, mobile, admin operation, catalog
  content-quality, and production smoke paths before accepting the `v1.2`
  release candidate.

### Operations and reporting

- Added admin/staff workflows for order filtering/detail updates, catalog
  management, content-quality review, merchandising shelf operations, stock
  adjustments, promotion management, customer overview, dashboard metrics, and
  CSV export.
- Documented known non-blockers honestly: simulated payments, no real SMS/OTP,
  no carrier shipping integration, no commercial cover hotlinking, no
  commercial metadata feed, and moderate transitive dependency advisories
  pending upstream fixes.

## Interview summary

CaseFlow Books demonstrates pragmatic full-stack product engineering. Public
catalog reads are RLS-scoped, cart state is intentionally local and untrusted,
checkout requires an authenticated customer profile, the server recalculates
all order totals, and admin/staff operations repeat authorization checks on the
server. The design favors one auditable deployment surface and strong release
evidence over a large feature list with weak implementation depth.

The payment flows are simulated. The project persists orders and operational
state, but it does not collect card data, process real MoMo/ZaloPay/VNPay/bank
payments, send SMS OTPs, integrate shipping carriers, use licensed commercial
cover images, or claim real commercial revenue.

## Evidence ledger

| Claim | Evidence |
|---|---|
| Public production deployment | `https://caseflow-store.vercel.app`; latest release `v1.4.0`; `caseflow-store/docs/v1.4-real-commerce-visual-merchandising-release-notes.md` |
| 100 active book editions and 50 works in production | `caseflow-store/.agent/artifacts/v12-t11/post-migration-supabase-check.json`; `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json` |
| 100 project-created cover assets | `docs/v1.2-cover-portfolio.md`; `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-check.json`; `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json` |
| Provenance and content-quality policy | `docs/domain.md`; `docs/v1.2-provenance-content-quality-contracts.md`; `docs/v1.2-release-audit.md` |
| Server-owned totals and book order creation | `src/app/api/orders/route.ts`; `src/lib/checkout/`; `src/lib/repositories/supabase-orders.ts`; `supabase/migrations/0006_caseflow_books_schema_draft.sql` |
| Customer/admin/staff access boundaries | `tests/e2e/admin-access.spec.ts`; `caseflow-store/.agent/artifacts/d35-t01/role-access-check.json`; `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json` |
| Admin operations | `src/features/admin/`; `caseflow-store/.agent/artifacts/d37-t03/order-operations-check.json`; `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`; `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-check.json` |
| Local release gate | `.agent/step-results.md` SR-170; `caseflow-store/.agent/artifacts/v12-t17/local-quality-gate-check.json` |
| Production release smoke | `.agent/step-results.md`; `caseflow-store/.agent/artifacts/v14-t13/production-release-smoke.json` |
| Production Playwright pass | `caseflow-store/.agent/artifacts/v12-t18/production-playwright-summary.json`; `caseflow-store/.agent/artifacts/qa-final-t01/final-post-release-qa.json` |
| Post-release visual hotfix | `caseflow-store/scripts/verify-hotfix-compact-card-overlap.ts`; `caseflow-store/.agent/artifacts/hotfix-v13-t01/compact-card-overlap-check.json` |
| Real-commerce visual merchandising upgrade | `caseflow-store/docs/v1.4-real-commerce-visual-merchandising-release-notes.md`; `caseflow-store/.agent/artifacts/v14-t13/production-release-smoke.json`; `caseflow-store/.agent/artifacts/v14-t11/admin-operations-visual-check.json` |
| Accessibility/mobile/performance pass | `caseflow-store/.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`; `caseflow-store/docs/screenshots/` |
| Known release boundaries | `docs/known-limitations.md`; `docs/v1.2-release-audit.md` |
