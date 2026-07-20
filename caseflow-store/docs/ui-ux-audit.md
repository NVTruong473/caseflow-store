# CaseFlow Books UI/UX Audit

- Task: `V18-T01`
- Date: 2026-07-21
- Product direction: modern editorial bookstore commerce
- Local baseline: `http://127.0.0.1:3000`
- Baseline screenshots:
  - `.agent/artifacts/v18-t01/baseline/home-1440.png`
  - `.agent/artifacts/v18-t01/baseline/home-390.png`
  - `.agent/artifacts/v18-t01/baseline/catalog-1440.png`
  - `.agent/artifacts/v18-t01/baseline/detail-390.png`

## Stack Summary

- Framework: Next.js `16.2.10` App Router.
- UI: React `19.2.4`, Server Components plus focused Client Components.
- Styling: Tailwind CSS `4` with CSS variables in `src/app/globals.css`.
- State: local cart in React Context and `localStorage`; Supabase SSR sessions
  for auth.
- Backend/runtime: Next.js Route Handlers in the same app.
- Database/auth: Supabase PostgreSQL, Auth, RLS, and server-only service-role
  repositories.
- Testing: Playwright E2E through `npm run test:e2e`, ESLint, TypeScript, and
  production build.

## Route Map

- Public storefront: `/`, `/catalog`, `/products/[slug]`.
- Customer: `/account`, `/account/orders`, `/orders/track`.
- Checkout: `/checkout`, `/checkout/payment`, `/checkout/success`.
- Policy/support: `/contact`, `/shipping`, `/payment`, `/returns`,
  `/privacy`, `/terms`.
- Admin/staff: `/admin`, `/admin/login`, `/admin/orders`, `/admin/catalog`,
  `/admin/inventory`, `/admin/promotions`, `/admin/customers`,
  `/admin/settings`.
- API: `/api/products`, `/api/categories`, `/api/cart/validate`,
  `/api/orders`, `/api/payments`, customer/admin protected endpoints, and
  mock-payment webhook/dev endpoints.

## Reference Review

| Reference | Direct review result | Principles extracted | What CaseFlow must not copy |
|---|---|---|---|
| Fahasa | Playwright reached Cloudflare security verification, so no visual screenshot was usable. | Use only prompt-level principles: search-first header, dense category access, policy/support visibility. | No scraped assets, no copied layout, no inferred visual details from the blocked page. |
| Nhà sách Phương Nam | Screenshot captured. Homepage is banner-heavy, has many shelf blocks, category/service shortcuts, and visible product density. | Bookstore users expect search, category entry, shelf rhythm, policy/service access, and promotional/product density. | Do not copy banners, campaign art, brand colors, copy, or over-dense skeleton/loading pattern. |
| XCodi | Screenshot captured. It is a service website with a strong hero image, sticky nav, strong scroll rhythm, and prominent contact action. | Borrow controlled section rhythm, clear nav hierarchy, and subtle motion sequencing. | Do not turn CaseFlow into an agency site, add consultation CTAs, or add unsupported service claims. |

## Findings

| Severity | Area | Evidence | Problem | Correction |
|---|---|---|---|---|
| High | Header/search | `src/components/layout/site-header.tsx`, baseline homepage | Header has logo/nav/account/language/cart but no prominent book search. Real bookstore users usually start by title, author, or ISBN. | Add a search form in the header that submits to `/catalog?q=...`, with visible labels and clear placeholder. |
| High | Category navigation | `site-header.tsx`, `mobile-navigation.tsx` | Category access exists as a homepage anchor, not a real header discovery menu. | Add a small category mega menu from live category data and mobile category links. |
| High | Product covers | `cover-merchandising.tsx` | Cover frame uses `object-cover`; fallback covers can look like blank decorative art instead of honest missing-cover state. | Use `object-contain`, show explicit “Bia dang cap nhat / Cover updating” for fallback, and record cover source manifest. |
| High | Image provenance | current docs/assets | There is no single manifest under `assets/book-covers/sources.json` listing cover source assumptions for the active catalog. | Generate a manifest from the public catalog API and mark generated/local covers as synthetic project assets. |
| Medium | Homepage rhythm | baseline homepage | `v1.7.0` improved the hero, but sections still repeat card grids and equal shelves often. | Add more utility/search/category hierarchy at the top; avoid adding more sections unless data supports them. |
| Medium | Catalog cards | baseline catalog | Cards are functional but visually dense and have similar treatment across tones. Hover behavior is mostly color/shadow, not clear product feedback. | Add restrained product-card motion and keep CTA readable without layout jump. |
| Medium | Catalog mobile filtering | current code | Filtering is a full page form rather than a bottom sheet. This is acceptable for now but less refined than a mobile commerce filter drawer. | Keep URL-backed filters; defer drawer until a focused task because current form is accessible and functional. |
| Medium | Product detail mobile | baseline detail | Purchase CTA appears near top, but the page becomes long before related content. Sticky mobile buy bar could help, but duplicating controls risks cart logic complexity. | Do not duplicate purchase controls in this phase; improve cover/policy clarity and preserve checkout behavior. |
| Medium | Motion | `globals.css` | Reduced-motion guard exists, but there are no reusable motion tokens/classes for page rhythm. | Add CSS motion tokens and limited reveal/hover helpers using only transform and opacity. |
| Low | Back-to-top | baseline long pages | Long catalog/detail pages require a lot of scrolling, and assistant button occupies bottom-right. | Add a small bottom-left back-to-top button after scroll, with reduced-motion respect and no auto-opening behavior. |
| Low | Newsletter/blog/reviews | prompt suggestions | No backend/content model proves newsletter storage, blog content, reviews, or real rating data. | Reject for this phase to avoid fake content and dead UI. |

## Features Already Present

- 500-edition catalog with search, filters, sort, pagination, and book detail.
- Account-gated checkout and local cart validation.
- Customer order history and guarded order tracking.
- Admin/staff operations.
- Policy/support pages.
- Rule-based assistant.
- QR demo payment with production lock.
- SEO metadata, sitemap, robots, and book structured data.

## Missing Or Deferred Features

- Header-level search: implement now.
- Header category/mega menu: implement now with real categories.
- Cover source manifest: implement now.
- Back-to-top: implement now as a real interaction.
- Quick-view: defer because it adds modal focus-trap and cart selection
  complexity; product detail and cart are already functional.
- Wishlist/recently viewed: defer until storage and account behavior are
  defined.
- Reviews/ratings/bestsellers: reject until real data exists.
- Newsletter/blog: reject until real content and email consent/provider storage
  exist.

## Risks

- Header DB category fetch must fail gracefully so the whole app does not fail
  if category data is temporarily unavailable.
- A large mega menu can crowd the header on tablet; desktop-only menu plus
  mobile drawer links is safer.
- Back-to-top must not compete with the assistant or checkout controls.
- Cover fallback text must not imply official cover art.
- Motion must not hide content before JavaScript or delay checkout.

## Must Preserve

- Existing routes, auth, cart, checkout, payment, and admin API behavior.
- Server-owned pricing/totals/status transitions.
- Production QR mock-payment lock.
- 500-edition catalog baseline.
- No scraped covers, fake reviews, fake sales numbers, or unsupported services.
