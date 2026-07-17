# D23-T03 Verification Summary

- Date: 2026-07-16
- Task: `D23-T03 - Apply And Verify Book Schema In Supabase`
- Target project: `caseflow-store` (`fcsuldrerhbynwotcvyn`)
- Status: completed

## Backup Evidence

- Created a pre-migration `public` schema export:
  `.agent/artifacts/d23-t03-backup/schema-before-v1-1.sql`
- Created a pre-migration `public` data export:
  `.agent/artifacts/d23-t03-backup/data-before-v1-1.sql`
- Created checksums:
  `.agent/artifacts/d23-t03-backup/checksums.sha256`
- Created manifest:
  `.agent/artifacts/d23-t03-backup/manifest.md`
- The SQL dump files are intentionally ignored by Git because the data export
  may contain app/customer PII.

## Migration Apply

- Applied `supabase/migrations/0006_caseflow_books_schema_draft.sql` through a
  verified direct PostgreSQL connection.
- Migration apply result:
  `.agent/artifacts/d23-t03/migration-apply.json`
- No secrets were printed or committed.

## Database Verification

- Pre-migration checks:
  `.agent/artifacts/d23-t03/pre-migration-checks.json`
- Post-migration schema/RLS/grant checks:
  `.agent/artifacts/d23-t03/post-migration-db-checks.json`
- Access-control checks:
  `.agent/artifacts/d23-t03/post-migration-access-control-checks.json`

Verified results:

- Expected CaseFlow Books tables exist.
- Expected v1.1 columns exist on `orders` and `order_items`.
- RLS is enabled on expected book and protected tables.
- `create_book_order_with_items` exists.
- Anon and authenticated roles cannot directly read protected order/admin
  tables through Supabase client checks.
- Anon and authenticated roles have no direct write privileges on protected
  order/admin tables.
- Existing v1.0.0 data counts were preserved.
- Direct book orders remain `0`.

## App Verification

- Pre-migration `npm run lint`: passed.
- Pre-migration `npm run build`: passed.
- Post-migration `npm run lint`: passed.
- Post-migration `npm run build`: passed.
- Post-migration `npm run test:e2e`: passed, `20/20`.
- Production smoke:
  - `/`: `200`
  - `/api/categories`: `200`, count `5`
  - `/api/products`: `200`, count `16`
  - `/api/admin/orders` without auth: `401`
- Post-E2E cleanup/state check:
  - `orders`: `0`
  - `order_items`: `0`
  - `direct_book_orders`: `0`
