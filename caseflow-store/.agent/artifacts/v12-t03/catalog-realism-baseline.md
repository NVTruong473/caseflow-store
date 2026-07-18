# V12-T03 Catalog Realism Baseline Artifact

- Generated at: 2026-07-17T12:55:08.574Z
- Mode: read-only
- Database writes: none
- Supabase read status: ok

## Catalog Counts

| Metric | Seed | Supabase |
|---|---:|---:|
| Active categories | 11 | 11 |
| Authors | 41 | 41 |
| Publishers | 1 | 1 |
| Cover assets | 1 | 1 |
| Active works | 50 | 50 |
| Active editions | 100 | 100 |
| English editions | 50 | 50 |
| Vietnamese editions | 50 | 50 |

## Edition Completeness

| Gap | Affected editions |
|---|---:|
| Generic placeholder primary cover | 100 |
| Demo publisher | 100 |
| Missing ISBN-13 | 100 |
| Missing ISBN-10 | 100 |
| Missing page count | 100 |
| Missing translator credit | 100 |
| Missing publication year | 16 |
| Vietnamese summary without diacritics | 98 |

## Release Blockers

- **V12-B01 (critical)**: 100/100 seed editions and 100/100 Supabase editions use the same placeholder as their primary cover.
- **V12-B02 (high)**: 100/100 editions point to a demo publisher, while ISBN-13, ISBN-10, and page count are missing on every edition.
- **V12-B03 (high)**: 98/100 Vietnamese summaries have no Vietnamese diacritics, so field presence overstates localization quality.
- **V12-B04 (high)**: The current schema cannot attach reviewed provenance to works, editions, or publishers and cannot represent v1.2 merchandising collections.
- **V12-B05 (medium)**: Normal storefront source still contains generic UI paths (TBC: 6, not-specified: 2, placeholder: 15).
- **V12-B06 (medium)**: All 50 works have an English and Vietnamese SKU, but no translator records exist; the relationship is structurally complete and bibliographically incomplete.

## Schema Recommendation

Recommendation: **additive-schema-required**.

- book_works, book_editions, and book_publishers cannot store reviewed provenance in the current domain or table contracts.
- SourceNote cannot express content kind, rights basis, attribution requirements/location, review status, reviewer note, or edition-match confidence.
- is_featured is only a boolean and cannot represent localized shelf labels, deterministic order, date windows, editorial versus sales-derived provenance, or operator-managed collections.

V12-T04 should define additive provenance contracts. V12-T09 should add the smallest merchandising storage only after content fields are frozen. No destructive change is justified.

## Optional Polish

- Add richer work-level editorial fields only after provenance contracts are frozen.
- Improve category breadth only after the canonical 100-edition manifest is accepted.
- Consider external preview links only when regional availability and link rights are explicit.

