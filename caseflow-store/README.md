# CaseFlow Books application

This directory contains the Next.js application for
[CaseFlow Books](https://caseflow-store.vercel.app), a deployed bilingual
bookstore and small-business operations demo. See the
[repository README](../README.md) for screenshots, feature scope, release
evidence, and portfolio notes.

> Payments are simulated. The app does not collect card numbers, CVV, card
> expiry, real bank credentials, or real MoMo/ZaloPay/VNPay credentials. Phone
> fields are validated for profile completeness, but no real SMS/OTP provider is
> integrated.

## Current scope

- 100 sellable book editions across 50 works.
- Vietnamese and English UI modes.
- VND source-of-truth pricing with optional approximate USD display in English
  mode.
- Account-gated checkout with simulated COD, bank transfer, MoMo, ZaloPay, and
  VNPay-style flows.
- Customer order history and guarded public tracking.
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

## v1.2 release evidence

- Release tag: `v1.2.0`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment ID: `dpl_7Y2Qsf4VJRBuzaMGXZMi81Rq5pKQ`
- Local release gate: TypeScript, ESLint, production build, and 20 Playwright
  tests passed.
- Production smoke: public pages/APIs, 100-edition catalog quality, 100 v1.2
  covers, language mode, cart/checkout boundary, customer/admin boundary,
  assistant, robots, sitemap, and 20 production Playwright tests passed.
- Known boundaries: simulated payments, no real SMS/OTP, no real shipping
  carrier integration, and no commercial book-cover hotlinking.

Architecture and decision records are under [`docs/`](docs/).
