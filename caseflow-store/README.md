# CaseFlow Store application

This directory contains the Next.js application for
[CaseFlow Store](https://caseflow-store.vercel.app). See the
[repository README](../README.md) for the verified feature scope, architecture,
security model, release evidence, and portfolio summary.

> Checkout is simulated. No card details are collected and no real payment is
> processed.

## Run locally

Requires Node.js 20 or newer, npm, and a configured Supabase project.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply [`supabase/schema.sql`](supabase/schema.sql) and then
[`supabase/seed.sql`](supabase/seed.sql) to the Supabase project before starting
the app. Required and test-only variables are documented in
[`.env.example`](.env.example).

Open [http://localhost:3000](http://localhost:3000).

## Quality gates

```bash
npm run lint
npm run build
npm run test:e2e
```

The release suite can target the public deployment without starting a local
server:

```bash
PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app npm run test:e2e
```

Playwright requires `CASEFLOW_ADMIN_EMAIL` and `CASEFLOW_ADMIN_PASSWORD` in the
local environment. Those credentials are not part of the deployed runtime.

Architecture and decision records are under [`docs/`](docs/).
