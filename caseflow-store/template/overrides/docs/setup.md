# Buyer-Owned Setup

## Prerequisites

- Node.js version compatible with `package.json`.
- A private buyer repository.
- A buyer-owned Supabase project.
- A buyer-owned deployment project.

## Local Setup

```bash
npm ci
cp .env.example .env.local
```

Populate only buyer-owned Supabase values in `.env.local`. Apply
`supabase/schema.sql` followed by the ordered files under
`supabase/migrations/` to a new, empty buyer database. Review every migration
before execution and record a backup/rollback point.

Then run:

```bash
npm run lint
npx tsc --noEmit --pretty false
npm run verify:architecture
npm run build
npm run dev
```

## Required Customization

- public store identity and canonical URL;
- real monitored support channels;
- buyer-approved catalog, prices, stock, images, and policies;
- buyer-owned staff/admin accounts and role assignments;
- delivery, payment, tax, notification, and operational decisions.

The included import/schema contract is bookstore-specific. Treating an
unrelated retail catalog as a row-only import is unsupported; define and test a
new domain migration first.

Provider variables being present is not sufficient evidence for Production
readiness. Real providers require contracts, credential controls, webhook
verification, reconciliation, failure handling, and buyer UAT.

## E2E

The retained Playwright tests create and delete test data. Run them only
against an isolated buyer/test Supabase project, never against the showroom
project or an unbacked-up live database.
