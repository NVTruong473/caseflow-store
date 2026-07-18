# V12-T05 Canonical Manifest Check

Status: **PASS**

## Counts

- Works: 50
- Sellable editions: 100
- Preserved legacy edition IDs/slugs: 98
- Retired legacy entities with compatibility records: 3

## Coverage

| Field | Editions |
| --- | ---: |
| Source reviewed | 100 |
| ISBN-13 | 72 |
| ISBN-10 | 65 |
| Publisher | 65 |
| Translator | 13 |
| Publication year | 94 |
| Page count | 84 |
| Source physical format | 6 |
| Dimensions | 0 |
| Weight | 0 |

Unavailable optional values remain null. Dimensions and weight are intentionally
not inferred from other editions or from CaseFlow's SKU format.

## Distributions

| Dimension | Counts |
| --- | --- |
| Languages | `{"en":50,"vi":50}` |
| Formats | `{"hardcover":8,"paperback":86,"special-edition":6}` |
| Inventory | `{"in-stock":92,"low-stock":8}` |
| Price bands | `{"150k-249k":41,"under-150k":59}` |
| Providers | `{"Fahasa":1,"Google Books":77,"Minh Khai Books":2,"NetaBooks":1,"Nhã Nam":1,"Open Library":16,"Sách Tiếng Việt":1,"Thư viện VOV":1}` |

## Checks

| Check | Result |
| --- | --- |
| schemaValid | PASS |
| exactWorkCount | PASS |
| exactEditionCount | PASS |
| bilingualEditionBalance | PASS |
| uniqueIdentifiers | PASS |
| uniqueSlugs | PASS |
| isbnShapesAndChecksumsValid | PASS |
| isbnValuesUnique | PASS |
| pairRelationshipsValid | PASS |
| workRelationshipsValid | PASS |
| everyEditionSourceReviewed | PASS |
| everyEditionHasBilingualContent | PASS |
| vietnameseDiacriticsPresent | PASS |
| prohibitedCopyAbsent | PASS |
| sourcedFactsSupported | PASS |
| sourceEditionsNotMixed | PASS |
| storeClaimsExplicit | PASS |
| inventoryStateConsistent | PASS |
| legacyCompatibilityComplete | PASS |

Unsupported sourced facts: 0.
Store prices, stock, promotions, and availability are CaseFlow Books editorial
merchandising decisions, not copied market claims.
