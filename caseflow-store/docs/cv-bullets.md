# Verified CV Bullets

These bullets are grounded in repository files, command output, deployment
evidence, and production smoke checks through the `v1.12.0` release. They
intentionally avoid unmeasured
performance claims, inflated scale claims, revenue claims, and the implication
that simulated payment flows process real money.

## Recommended three-bullet version

- Built and deployed CaseFlow Books, a full-stack bilingual bookstore with
  Next.js 16, TypeScript, Supabase PostgreSQL/Auth, and Vercel, covering a
  500-edition catalog, real source-work covers plus project-created fallbacks,
  book-specific filters, local cart, account-gated checkout, signup vouchers,
  customer order history and cancellation, guarded tracking, signed-in password
  change, and admin/staff operations.
- Implemented server-authoritative commerce logic with Zod validation,
  Supabase row mappers, RLS-backed access control, role-based admin/staff
  permissions, server-reloaded book records, order ownership checks, promotion
  evaluation, VAT/shipping and payment-fee estimates, and VND totals that
  never trust browser-supplied prices or order state.
- Created and ran release gates across TypeScript, ESLint, production build,
  full local Playwright `20/20`, production smoke checks, full production
  Playwright `20/20`, assistant verification, cleanup checks, secret scan,
  content/provenance/cover quality checks, accessibility/mobile screenshots,
  documented dependency audit findings, a post-release visual hotfix with a
  dedicated compact-card overlap verifier, a `v1.4` merchandising QA gate, a
  `v1.4.2` security-header posture verifier, `v1.5.0` QR production-safety
  gates, a `v1.6.0` 500-edition catalog verifier, production signup-voucher
  and password-change verifiers, a real-email confirmation UAT that caught
  and fixed a Supabase redirect-to-localhost configuration issue, and a
  `v1.11.1` dependency patch that moved the audit from high-severity findings
  to zero reported vulnerabilities without forcing a breaking downgrade, plus
  a `v1.12.0` use-case extraction and architecture boundary verifier for the
  highest-risk order creation API.

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
- Added account-bound welcome vouchers, real Supabase email confirmation,
  profile readiness, and self-service password change without letting staff or
  admin reset another user's password.

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
- Verified production customer sign-up with a real Gmail confirmation link,
  corrected Supabase Auth URL Configuration from localhost to the production
  account route, and reran checkout/order-history UAT without service-role
  confirmation.

### Operations and reporting

- Added admin/staff workflows for order filtering/detail updates,
  rejection/cancellation of risky orders with internal notes, catalog
  management, content-quality review, merchandising shelf operations, stock
  adjustments, promotion management, customer overview, dashboard metrics, and
  CSV export.
- Documented known non-blockers honestly: simulated payments, no real SMS/OTP,
  no custom SMTP provider yet, no carrier shipping integration, and no
  licensed commercial metadata feed.

## Interview summary

CaseFlow Books demonstrates pragmatic full-stack product engineering. Public
catalog reads are RLS-scoped, cart state is intentionally local and untrusted,
checkout requires an authenticated customer profile, the server recalculates
all order totals, and admin/staff operations repeat authorization checks on the
server. The design favors one auditable deployment surface and strong release
evidence over a large feature list with weak implementation depth.

The payment flows are simulated. The project persists orders and operational
state, but it does not collect card data, process real MoMo/ZaloPay/VNPay/bank
payments, send SMS OTPs, integrate shipping carriers, use a licensed
commercial metadata feed, or claim real commercial revenue. Supabase default
email confirmation passed on production after the Auth URL configuration fix;
custom SMTP remains a documented operations upgrade.

## Evidence ledger

| Claim | Evidence |
|---|---|
| Public production deployment | `https://caseflow-store.vercel.app`; latest release `v1.12.0`; `caseflow-store/docs/v1.12.0-layered-architecture-release-notes.md` |
| Layered order creation architecture | `caseflow-store/docs/adr/0014-layered-architecture-boundary.md`; `caseflow-store/src/lib/use-cases/orders/create-book-order.ts`; `caseflow-store/.agent/artifacts/arch-layer-t05/layer-boundaries-check.json` |
| 500 active book editions and 50 works in production | `caseflow-store/.agent/artifacts/v16-t01/catalog-expansion-apply.json`; `caseflow-store/.agent/artifacts/v16-t01-production/catalog-retail-polish-check.json` |
| 500 project-created cover assets | `docs/v1.2-cover-portfolio.md`; `caseflow-store/public/images/books/v16-covers/`; `caseflow-store/.agent/artifacts/v16-t01-production/catalog-retail-polish-check.json` |
| Provenance and content-quality policy | `docs/domain.md`; `docs/v1.2-provenance-content-quality-contracts.md`; `docs/v1.2-release-audit.md` |
| Server-owned totals and book order creation | `src/app/api/orders/route.ts`; `src/lib/checkout/`; `src/lib/repositories/supabase-orders.ts`; `supabase/migrations/0006_caseflow_books_schema_draft.sql` |
| Customer/admin/staff access boundaries | `tests/e2e/admin-access.spec.ts`; `caseflow-store/.agent/artifacts/d35-t01/role-access-check.json`; `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json` |
| Admin operations | `src/features/admin/`; `caseflow-store/.agent/artifacts/v141-t01/admin-order-operations-check.json`; `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-check.json`; `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`; `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-check.json` |
| Customer order cancellation | `src/app/api/customer/orders/[orderCode]/route.ts`; `src/features/customer/customer-orders-page.tsx`; `caseflow-store/.agent/artifacts/v141-t01/customer-order-history-check.json` |
| Local release gate | `.agent/step-results.md` SR-170; `caseflow-store/.agent/artifacts/v12-t17/local-quality-gate-check.json` |
| Production release smoke | `.agent/step-results.md`; `caseflow-store/.agent/artifacts/v14-t13/production-release-smoke.json` |
| Production Playwright pass | `caseflow-store/.agent/artifacts/v12-t18/production-playwright-summary.json`; `caseflow-store/.agent/artifacts/qa-final-t01/final-post-release-qa.json` |
| Post-release visual hotfix | `caseflow-store/scripts/verify-hotfix-compact-card-overlap.ts`; `caseflow-store/.agent/artifacts/hotfix-v13-t01/compact-card-overlap-check.json` |
| Real-commerce visual merchandising upgrade | `caseflow-store/docs/v1.4-real-commerce-visual-merchandising-release-notes.md`; `caseflow-store/docs/v1.4.1-stable-closeout-patch-release-notes.md`; `caseflow-store/.agent/artifacts/v141-t01/production-release-smoke.json`; `caseflow-store/.agent/artifacts/v14-t11/admin-operations-visual-check.json` |
| Security hardening | `caseflow-store/next.config.ts`; `caseflow-store/scripts/verify-security-posture.ts`; `caseflow-store/docs/v1.4.2-agent-security-qa-report.md`; `caseflow-store/.agent/artifacts/secqa-t01/security-posture-check.json` |
| Accessibility/mobile/performance pass | `caseflow-store/.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`; `caseflow-store/docs/screenshots/` |
| Known release boundaries | `docs/known-limitations.md`; `docs/v1.2-release-audit.md` |
| Account-bound signup vouchers | `docs/v1.10.0-account-bound-signup-voucher-release-notes.md`; `.agent/artifacts/signupvoucher-t02-production/signup-vouchers-check.json` |
| Real-email confirmation UAT | `docs/auth-email-t03-real-email-confirmation-uat.md`; `.agent/artifacts/auth-email-t03-production-fixed-20260722/uat-manual-customer-production-check.json` |
| Signed-in password change | `docs/v1.11.0-account-security-password-release-notes.md`; `.agent/artifacts/auth-password-t01/customer-password-change-check.json` |
