# CaseFlow Books application

This directory contains the Next.js application for
[CaseFlow Books](https://caseflow-store.vercel.app), a deployed bilingual
bookstore and small-business operations demo. See the
[repository README](../README.md) for screenshots, feature scope, release
evidence, and portfolio notes.

> Payments are simulated. The app does not collect card numbers, CVV, card
> expiry, real bank credentials, or real MoMo/ZaloPay/VNPay credentials. QR
> demo payment is available only in development/sandbox and is locked in
> production. Phone fields are validated for profile completeness, but no real
> SMS/OTP provider is integrated.

## Current scope

- 500 sellable book editions across 50 works, with 250 English and 250
  Vietnamese editions.
- Vietnamese and English UI modes.
- VND source-of-truth pricing with optional approximate USD display in English
  mode.
- Account-gated checkout with simulated COD, bank transfer, wallet/provider
  choices, and development-only QR demo payment flows.
- Customer order history, eligible order cancellation, and guarded public
  tracking.
- Admin/staff dashboard, order operations, catalog, inventory, promotions,
  customers, settings, and CSV export.
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

- Release tag: `v1.8.0`
- GitHub Release:
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.8.0`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment ID: `dpl_9FRaok8hK8sddmbGBL3RvkMM9fLs`
- Local gates: TypeScript, ESLint, production build, full Playwright `20/20`,
  V18 bookstore experience verifier, 500-edition catalog verifier, QR
  production-safety verifier, security posture verifier, final QA smoke,
  dependency audit at high threshold, and `git diff --check` passed.
- Production smoke: V18 bookstore experience verifier, 500-edition catalog
  verifier, release smoke, security posture, final QA smoke, and QR
  production-safety lock passed.
- Release notes:
  [`docs/v1.8.0-modern-editorial-bookstore-release-notes.md`](docs/v1.8.0-modern-editorial-bookstore-release-notes.md)
- Known boundaries: simulated payments, QR demo locked from production
  settlement, no real SMS/OTP, no real shipping carrier integration, and no
  commercial book-cover hotlinking.

Architecture and decision records are under [`docs/`](docs/).
The portfolio handoff packet is
[`docs/portfolio-handoff.md`](docs/portfolio-handoff.md).
