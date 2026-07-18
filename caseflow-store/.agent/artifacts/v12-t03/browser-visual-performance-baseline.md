# V12-T03 Browser, Visual, And Performance Baseline

- Generated: 2026-07-17
- Runtime: local Next.js production server
- Viewports: 375x900 and 1440x1100
- Pages: homepage, catalog, product detail, and authenticated admin catalog
- Console warnings/errors on the final admin catalog check: 0

## Build Baseline

- Production build: passed
- Generated routes: 41
- Wall time: 46.04 seconds
- User CPU time: 67.14 seconds
- System CPU time: 6.13 seconds

## Page Baseline

| Page | Viewport | Scroll height | Horizontal overflow | Images | Placeholder images | Broken images | Unnamed-control heuristic |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home (EN) | 1440x1100 | 4,453px | 0px | 18 | 18 | 0 | 0 |
| Catalog (EN) | 1440x1100 | 5,931px | 0px | 24 | 24 | 0 | 3 |
| Detail (EN) | 1440x1100 | 2,961px | 0px | 5 | 5 | 0 | 0 |
| Home (VI) | 375x900 | 12,271px | 0px | 18 | 18 | 0 | 0 |
| Catalog (VI) | 375x900 | 21,630px | 0px | 24 | 24 | 0 | 3 |
| Detail (VI) | 375x900 | 4,499px | 0px | 5 | 5 | 0 | 0 |
| Admin catalog (VI) | 1440x1100 | 11,263px | 0px | 0 | 0 | 0 | 2 |
| Admin catalog (VI) | 375x900 | 16,520px | 195px | 0 | 0 | 0 | 2 |

All reviewed pages had zero duplicate IDs and zero missing image alt values in
the deterministic DOM heuristic. Catalog and admin unnamed-control counts are
review prompts, not confirmed accessibility failures, because the lightweight
heuristic does not resolve every visible `label` association. Axe-core and
assistive-technology testing remain release-gate work.

## Image And Performance Baseline

- The committed placeholder SVG is 1,390 decoded bytes and was 300 transferred
  bytes in the uncached product-detail observation.
- Normal storefront pages expose only one unique image source even when 5-24
  images are rendered.
- The first desktop home navigation transferred 29,606 bytes; observed page
  resource transfer was 356,088 bytes and decoded resource bytes were 809,769.
- Navigation transfer ranged from 18,119 bytes on product detail to 47,607
  bytes on the mobile catalog observation.
- Image resource timing is cache-sensitive. Deterministic cover-file inventory,
  unique-source counts, and file bytes are the authoritative v1.1 image
  baseline.
- Observed CLS was 0 with zero exposed layout-shift entries for all eight
  captures. LCP was not captured because the lightweight audit observer was
  not installed before navigation; it must be measured in the v1.2 release
  quality gate.

## Visual Findings

### Release Blocker

- `V12-B07` (high): authenticated `/admin/catalog` has 195px horizontal
  overflow at 375px and exposes a horizontal scrollbar. The storefront pages
  did not overflow horizontally at the same viewport.

### Optional Polish

- Desktop navigation labels wrap and the signed-in brand/account area can
  truncate at 1440px, but controls remain reachable and do not overlap.
- Mobile catalog and admin catalog pages are very long. Pagination exists on
  the storefront catalog; admin density and navigation can be improved after
  content contracts and data are stable.
- The repeated placeholder makes otherwise coherent cards and detail layouts
  look like a template. This is already covered by catalog blocker `V12-B01`,
  not a separate component-layout defect.

## Evidence

The artifact directory contains full-page and first-viewport screenshots for
all four pages at both breakpoints. Machine-readable metrics are in
`browser-visual-performance-baseline.json`.

