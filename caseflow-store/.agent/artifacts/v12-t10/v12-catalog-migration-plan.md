# V12-T10 Catalog Migration Dry-Run Plan

Generated: 2026-07-17T00:00:00.000Z

## Planned Writes

No deletes are planned. Existing customer, order, order item, promotion,
inventory-adjustment, phone catalog, and profile rows are unchanged.

### Inserts

- book_authors: 1
- book_publishers: 44
- book_translators: 14
- book_cover_assets: 100
- book_works: 1
- book_work_authors: 51
- book_work_categories: 100
- book_editions: 2
- book_edition_translators: 14
- book_catalog_provenance_records: 602
- book_content_quality_checks: 2000
- book_catalog_compatibility: 3
- book_merchandising_shelves: 9
- book_merchandising_shelf_items: 20

### Updates

- book_categories: 11
- book_authors: 40
- book_publishers: 0
- book_works: 49
- book_editions: 98

### Deactivations

- book_works: 1
- book_editions: 2

## ID Stability

- Inserted work IDs: 00000000-0000-4000-8000-000000007000
- Inserted edition IDs: 00000000-0000-4000-8000-000000007100, 00000000-0000-4000-8000-000000007200
- Retired work IDs: 00000000-0000-4000-8000-000000002049
- Retired edition IDs: 00000000-0000-4000-8000-000000003049, 00000000-0000-4000-8000-000000004049
- New authors: Ernest Hemingway
- New publishers: 44
- New translators: 14

## Live Count Status

- captured
