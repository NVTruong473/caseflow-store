# Bookstore Commerce Starter

Private bookstore-first, single-store e-commerce source template derived from a
tested reference implementation. It includes storefront, book/edition catalog,
account, checkout, promotion, order, notification, and admin workflows in one
Next.js modular monolith.

## Honest Boundary

This source is not a turnkey operating business. It contains no buyer catalog,
licensed commercial media, legal identity, live payment settlement, approved
email/SMS sender, carrier account, warehouse integration, tax invoice service,
domain, or service-level commitment.

Its domain model includes books, editions, authors, translations, ISBN, and
book merchandising. A buyer selling unrelated product types needs a separately
estimated domain/schema/UI migration; replacing rows alone is not sufficient.

## Before Running

1. Read `PRIVATE-SOURCE-NOTICE.md`.
2. Complete buyer discovery and ownership decisions.
3. Create a buyer-owned private repository and isolated Supabase project.
4. Follow `docs/setup.md`.
5. Replace brand, catalog, support, policy, and provider configuration.
6. Complete `docs/buyer-handoff-checklist.md`.

## Quality Commands

```bash
npm ci
npm run lint
npx tsc --noEmit --pretty false
npm run verify:architecture
npm run build
```

The Playwright suite requires a buyer-isolated test Supabase project. Never run
it with the public showroom database or credentials.
