# Catalog Replacement Handoff

The 500-edition CaseFlow catalog is a reference dataset. Replacing it for a
buyer is a controlled data migration, not a search-and-replace task.

## Active Domain

The bookstore catalog separates:

- categories;
- authors and work-author links;
- translators;
- publishers;
- cover assets and provenance;
- works and localized work summaries;
- editions, formats, language, prices, stock, and localized copy;
- work-category and edition-translator links;
- content-quality/provenance records;
- merchandising shelves and shelf items;
- promotions and inventory adjustments.

Order items persist book title, edition, language, format, price, and line
snapshots. Existing order history must remain readable even when the active
catalog changes.

## Required Buyer Mapping

Every buyer source needs an explicit mapping for:

- stable source ID and slug;
- product/work/variant relationship;
- title and localized title;
- category and author relationships;
- language and format;
- ISBN/SKU or another unique identifier;
- integer VND price and optional compare-at price;
- stock quantity, threshold, and inventory state;
- active/featured state;
- summary, alt text, reason-to-buy/read, and optional facts;
- image path, ownership/source, and provenance status;
- publication/publisher fields where known;
- related or paired variants;
- promotion and merchandising membership.

Unknown values must be `null`, omitted, or explicitly marked for review. Do not
invent ISBN, publisher, translator, stock, discount, rating, or sales data.

## Migration Sequence

1. Obtain a representative buyer export and freeze its schema/version.
2. Create a field mapping and reject report before writing Production data.
3. Validate identifiers, relationships, prices, stock, images, and localized
   content in a non-Production environment.
4. Back up affected tables and record row counts/checksums.
5. Generate a dry-run plan: inserts, updates, deactivations, conflicts, and
   zero unintended deletes.
6. Import in dependency order: identity tables, works, editions, joins,
   provenance/quality, merchandising, then promotions/inventory.
7. Reconcile counts and sample records through repository/API/UI paths.
8. Run catalog, cart, checkout-total, order-snapshot, SEO, responsive, and
   admin operations tests.
9. Obtain buyer acceptance before Production apply.
10. Apply with an idempotent key and retain the backup/rollback evidence.

## Deactivation And History

- Prefer `is_active=false` for retired editions over deletion.
- Do not delete an edition referenced by order history.
- Do not rewrite historical order-item snapshots after a price/title change.
- Preserve stable redirects when buyer slugs change after public launch.
- Restore stock changed by tests before reconciliation.

## Reference Scripts

The repository contains proven reference-specific tools:

- `scripts/backup-v12-pre-migration.ts`
- `scripts/plan-v12-catalog-migration.ts`
- `scripts/apply-v12-catalog-data.ts`
- `scripts/apply-v16-catalog-expansion.ts`
- `scripts/verify-v12-supabase-import.ts`
- `scripts/verify-catalog-filters.ts`
- `scripts/verify-admin-book-catalog.ts`
- `scripts/verify-release-cleanup.ts`

These scripts encode the CaseFlow manifests and are examples, not universal
buyer importers. Fork them only after documenting the buyer mapping and
rollback contract.

## Rollback

Rollback must be designed before import:

- stop further catalog writes;
- identify the migration batch/idempotency key;
- restore changed reference rows from the private backup or reverse manifest;
- remove only rows created by that batch and not referenced by orders;
- restore merchandising and stock;
- rerun reconciliation and public/admin smoke tests;
- record unresolved manual repairs.

Never use `git reset`, a database drop, or blanket table deletion as a catalog
rollback.

## Acceptance Evidence

- source file hash and mapping version;
- validation/reject report;
- before/after counts;
- backup identifier and restore test;
- dry-run insert/update/deactivate/delete plan;
- API/catalog/admin screenshots;
- cart and server-total checks;
- order snapshot regression;
- SEO/sitemap checks;
- cleanup report;
- buyer sign-off.
