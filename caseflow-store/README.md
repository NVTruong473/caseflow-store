# CaseFlow Books application

This directory contains the Next.js application for
[CaseFlow Books](https://caseflow-store.vercel.app), a deployed bilingual
bookstore and small-business operations demo. See the
[repository README](../README.md) for screenshots, feature scope, release
evidence, and portfolio notes.

> Payments are simulated. The app does not collect card numbers, CVV, card
> expiry, real bank credentials, or real MoMo/ZaloPay/VNPay credentials. QR
> demo payment is available only in development/sandbox and is locked in
> production. The in-app notification inbox works without an external vendor.
> Email/SMS delivery and SMS OTP are disabled in production until approved
> provider credentials and sender configuration are supplied.

## Current scope

- 500 sellable book editions across 50 works, with 250 English and 250
  Vietnamese editions.
- Vietnamese and English UI modes.
- VND source-of-truth pricing with optional approximate USD display in English
  mode.
- Account-gated checkout with simulated COD, bank transfer, wallet/provider
  choices, and development-only QR demo payment flows.
- Account-bound signup welcome vouchers with one-code-per-order enforcement.
- Customer order history, eligible order cancellation, and guarded public
  tracking.
- Customer in-app order notifications, with optional provider-gated email/SMS
  delivery and SMS phone verification.
- Admin/staff dashboard, order operations, simulated-transfer decisions,
  notification operations, catalog, inventory, promotions, customers,
  settings, and CSV export.
- Rule-based bookstore assistant with no external AI API.

## Run locally

Requires Node.js 20 or newer, npm, and a configured Supabase project.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply [`supabase/schema.sql`](supabase/schema.sql) and the migrations under
[`supabase/migrations/`](supabase/migrations/) to the Supabase project before
starting the app. Required and test-only variables are documented in
[`.env.example`](.env.example).

Open [http://localhost:3000](http://localhost:3000).

## Quality gates

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

The release suite can target the public deployment without starting a local
server:

```bash
PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app npm run test:e2e
```

Playwright requires local admin/customer credentials such as
`CASEFLOW_ADMIN_EMAIL`, `CASEFLOW_ADMIN_PASSWORD`, `CASEFLOW_CUSTOMER_EMAIL`,
and `CASEFLOW_CUSTOMER_PASSWORD`. Those credentials are not part of the deployed
runtime.

## Latest release evidence

- Release tag: `v1.14.0`
- GitHub Release:
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.14.0`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment ID: `dpl_6cLwah2gUno1dbar97VQKFSopirM`
- Local gates: npm audit with zero vulnerabilities, TypeScript, ESLint,
  59-route production build, full Playwright `24/24`, notification and
  architecture verifiers, productization/default/buyer-override gates, QR
  production-safety, security posture, final QA, secret scan, and cleanup
  passed.
- Production smoke: release smoke, security posture, QR lock, notification
  boundary, catalog filters, SEO, storefront/accessibility/final QA, cleanup,
  and full Playwright `24/24` passed. Evidence is under
  `.agent/artifacts/productize-t06-production-*`.
- Release notes:
  [`docs/v1.14.0-sellable-demo-productization-release-notes.md`](docs/v1.14.0-sellable-demo-productization-release-notes.md),
  [`docs/v1.13.1-order-response-reliability-patch-release-notes.md`](docs/v1.13.1-order-response-reliability-patch-release-notes.md),
  [`docs/v1.12.1-order-reliability-release-notes.md`](docs/v1.12.1-order-reliability-release-notes.md),
  [`docs/v1.12.0-layered-architecture-release-notes.md`](docs/v1.12.0-layered-architecture-release-notes.md),
  [`docs/v1.11.3-expert-polish-release-notes.md`](docs/v1.11.3-expert-polish-release-notes.md),
  [`docs/v1.11.2-neutral-light-ui-patch-release-notes.md`](docs/v1.11.2-neutral-light-ui-patch-release-notes.md),
  [`docs/v1.11.1-security-dependency-patch-release-notes.md`](docs/v1.11.1-security-dependency-patch-release-notes.md)
  and
  [`docs/v1.11.0-account-security-password-release-notes.md`](docs/v1.11.0-account-security-password-release-notes.md)
- Operational evidence:
  [`docs/postv140-t01-final-release-consistency-audit.md`](docs/postv140-t01-final-release-consistency-audit.md),
  [`docs/postv131-t01-final-release-consistency-audit.md`](docs/postv131-t01-final-release-consistency-audit.md),
  [`docs/uat-owner-t01-production-acceptance.md`](docs/uat-owner-t01-production-acceptance.md),
  [`docs/postv121-t01-final-release-consistency-audit.md`](docs/postv121-t01-final-release-consistency-audit.md),
  [`docs/postv120-t01-final-release-consistency-audit.md`](docs/postv120-t01-final-release-consistency-audit.md),
  [`docs/postv113-t01-final-release-consistency-audit.md`](docs/postv113-t01-final-release-consistency-audit.md),
  [`docs/auth-email-t03-real-email-confirmation-uat.md`](docs/auth-email-t03-real-email-confirmation-uat.md)
  and
  [`docs/postv111-t01-final-release-consistency-audit.md`](docs/postv111-t01-final-release-consistency-audit.md)
- Known boundaries: simulated payments, QR demo locked from production
  settlement, external email/SMS/OTP disabled without approved credentials,
  no real shipping carrier integration, and no licensed commercial metadata
  feed.

Architecture and decision records are under [`docs/`](docs/).
The portfolio handoff packet is
[`docs/portfolio-handoff.md`](docs/portfolio-handoff.md).
The latest operational handoff packet is
[`docs/v1.11-final-operational-handoff.md`](docs/v1.11-final-operational-handoff.md).
Buyer productization starts with
[`docs/buyer-discovery-questionnaire.md`](docs/buyer-discovery-questionnaire.md)
and
[`docs/commercial-handoff-boundaries.md`](docs/commercial-handoff-boundaries.md).
