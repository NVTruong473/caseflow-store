# CaseFlow Store - Roadmap And Execution Tracker

## Status Legend

- `[ ]`: not started
- `[/]`: in progress
- `[x]`: completed with evidence
- `[!]`: blocked

## Current State

- Project: CaseFlow Store
- Mode: implementation enabled
- Current gate: Production accepted; portfolio packaging and release tag pending
- Current task: `D20-T06 - Create release tag v1.0.0`
- Implementation day: Day 20 in progress
- Last updated: 2026-07-16

## Pre-Implementation Checklist

- [x] `DOC-001` Package useful project knowledge from the referenced chat into repository Markdown files - 2026-07-14
- [x] `DOC-002` Create context-management system for future AI sessions - 2026-07-14
- [x] `DOC-003` Create risk register and mitigation plan - 2026-07-14
- [x] `DOC-004` Create architecture and ADR scaffolding - 2026-07-14
- [x] `DOC-005` Create design-system guidance for UI consistency - 2026-07-14
- [x] `DOC-006` Review documentation for gaps before implementation - 2026-07-14
- [x] `CONFIRM-001` User confirms that implementation can begin - 2026-07-14

No app code was created before `CONFIRM-001` was complete.

## Phase 1 - Local Environment And Project Skeleton

### Day 1 - Environment preflight and Next.js initialization

- [x] `D01-T01` Check Node.js, npm, npx, and Git versions. - 2026-07-14
  - Commands:
    - `node -v`
    - `npm -v`
    - `npx --version`
    - `git --version`
  - Pass: Node.js meets current Next.js requirement; npm, npx, and Git respond.
  - Result: passed after installing official Node.js LTS binary `v24.18.0` with npm/npx `11.16.0`. Git reports `git version 2.37.1 (Apple Git-137.1)`.
- [x] `D01-T02` Initialize Next.js app. - 2026-07-14
  - Command:
    - `npx create-next-app@latest caseflow-store --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
  - Result: initialized `caseflow-store` with Next.js `16.2.10`, React `19.2.4`, TypeScript, Tailwind CSS, ESLint, App Router, and `src/`.
  - Note: actual command added `--yes --disable-git` to avoid interactive prompts and nested Git inside the existing repository.
- [x] `D01-T03` Run app locally. - 2026-07-14
  - Commands:
    - `cd caseflow-store`
    - `npm run dev`
  - Result: dev server started at `http://localhost:3000`; `curl -I http://localhost:3000` returned `HTTP/1.1 200 OK`.
- [x] `D01-T04` Run baseline checks. - 2026-07-14
  - Commands:
    - `npm run lint`
    - `npm run build`
    - `git status`
  - Result: lint passed, production build passed, and Git status showed the new app as untracked under the existing root repository.

### Day 2 - Project structure, agent files, and smoke deploy

- [x] `D02-T01` Move or copy project management docs into the app repository if the app is nested. - 2026-07-14
  - Result: copied `AGENTS.md`, `DESIGN.md`, `SKILL.md`, `.agent/`, and `docs/` into `caseflow-store/`.
  - Result: replaced scaffolded `caseflow-store/AGENTS.md` with project rules plus a Next.js 16 version note.
- [x] `D02-T02` Create folders: `components`, `features`, `lib`, `data`, `types`, `supabase`, and `tests`. - 2026-07-14
  - Result: created `src/components`, `src/features`, `src/lib`, `src/data`, `src/types`, `supabase`, and `tests` under `caseflow-store/`.
  - Result: added `.gitkeep` files so Git can retain the empty folders.
- [x] `D02-T03` Create `.env.example` and verify `.env.local` is ignored. - 2026-07-14
  - Result: created `caseflow-store/.env.example` with placeholder public Supabase values, server-only service key placeholder, and local site URL.
  - Result: updated `caseflow-store/.gitignore` to ignore `.env*` but allow `.env.example`.
  - Verification: `.env.local` is ignored; `.env.example` is not ignored and appears in Git status.
- [x] `D02-T04` Replace default page with a simple CaseFlow status page. - 2026-07-14
  - Result: replaced default Next.js landing page with a simple CaseFlow Store implementation status page.
  - Result: updated metadata and global CSS tokens to align with `DESIGN.md`.
  - Verification: `npm run lint`, `npm run build`, and HTTP content check passed.
- [x] `D02-T05` Create or verify `AGENTS.md`, `DESIGN.md`, and `docs/adr`. - 2026-07-14
  - Result: verified root `AGENTS.md`, `DESIGN.md`, and 5 ADR files.
  - Result: verified app-level `caseflow-store/AGENTS.md`, `caseflow-store/DESIGN.md`, and copied ADR files.
- [x] `D02-T06` Run `npm run lint && npm run build`. - 2026-07-14
  - Result: lint passed and production build passed.
- [ ] `D02-T07` Optional but recommended: smoke deploy baseline app to Vercel.
  - Deferred: Vercel access and deployment target are not verified yet. Do not deploy without explicit user approval and environment clarity.

## Phase 2 - Domain Model, Database Draft, And Mock APIs

### Day 3 - Domain model and database draft

- [x] `D03-T01` Confirm final product domain, categories, and domain-specific feature. - 2026-07-14
  - Result: selected phone accessories by user-delegated decision.
  - Result: confirmed categories are phone cases, screen protectors, chargers, cables and adapters, and stands and mounts.
  - Result: confirmed domain-specific feature is compatibility filtering by phone model.
  - Source of truth: `docs/domain.md`.
- [x] `D03-T02` Define `Category`, `Product`, `CartItem`, `Order`, and `OrderItem`. - 2026-07-14
  - Result: created `caseflow-store/src/types/domain.ts`.
  - Result: exported category, compatibility, and order-status constants plus TypeScript domain types.
  - Result: separated product stock quantity from cart/order item quantity.
  - Verification: `npm run lint` passed.
- [x] `D03-T03` Create Zod schemas. - 2026-07-14
  - Result: created `caseflow-store/src/lib/validation/domain.ts`.
  - Result: added runtime schemas for category, product, cart item, order, and order item.
  - Result: added constraints for integer money, stock, positive quantities, compatibility labels, image paths, customer contact fields, and order-item line totals.
  - Verification: `npm run lint` and `npx tsc --noEmit` passed.
- [x] `D03-T04` Create `supabase/schema.sql` draft. - 2026-07-14
  - Result: created `caseflow-store/supabase/schema.sql`.
  - Result: drafted profiles, categories, products, orders, and order_items tables with constraints, indexes, updated_at triggers, and RLS defaults.
  - Result: no cart table was created.
  - Verification: file inspection and constraint search passed; `psql` and Supabase CLI are not installed, so SQL was not applied locally.
- [x] `D03-T05` Create 12-20 mock products. - 2026-07-14
  - Result: created `caseflow-store/src/data/mock/catalog.ts`.
  - Result: added 5 mock categories and 16 mock products.
  - Result: mock catalog is parsed with Zod schemas at module import time.
  - Verification: `npm run lint`, `npx tsc --noEmit`, and runtime import via `npx --yes tsx` passed.
- [x] `D03-T06` Create Supabase proof-of-connection plan or project if credentials are available. - 2026-07-14
  - Result: created `docs/supabase-proof-of-connection.md`.
  - Result: created `caseflow-store/docs/supabase-proof-of-connection.md`.
  - Result: confirmed `.env.local` is missing and Supabase environment variables are not set.
  - Result: no Supabase project was created because credentials are unavailable.
  - Verification: root/app plan diff passed and `.env.local` is ignored.

### Day 4 - Product APIs

- [x] `D04-T01` Install Zod. - 2026-07-14
  - Completed early because `D03-T03` requires the `zod` package.
  - Result: `caseflow-store/package.json` now includes `zod` `^4.4.3`.
  - Verification: `npm run lint` passed.
- [x] `D04-T02` Implement `GET /api/products`. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/products/route.ts`.
  - Result: created mock product repository and product list query validation.
  - Result: endpoint supports category, compatibility, search, featured, and sort query parameters.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and HTTP curl checks passed.
- [x] `D04-T03` Implement `GET /api/products/[slug]`. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/products/[slug]/route.ts`.
  - Result: added active product lookup by slug to mock repository.
  - Result: invalid slug returns `400`; missing product returns `404`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and HTTP curl checks passed.
- [x] `D04-T04` Implement `GET /api/categories`. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/categories/route.ts`.
  - Result: added active category listing to mock repository.
  - Verification: `npm run lint`, `npx tsc --noEmit`, and HTTP curl check passed.
- [x] `D04-T05` Implement `POST /api/cart/validate`. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/cart/validate/route.ts`.
  - Result: created cart validation request schema.
  - Result: server aggregates duplicate product IDs, reads current product data, checks stock, and recalculates line totals/subtotal.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and HTTP curl checks passed.
- [x] `D04-T06` Test APIs with `curl`. - 2026-07-14
  - Result: verified product list, filtered product list, invalid product query, product detail, missing product, categories, valid cart validation, out-of-stock cart, invalid JSON, and invalid cart payload.
  - Verification: curl checks passed; `npm run lint` and `npm run build` passed.

### Day 5 - Orders API and preview API deploy

- [x] `D05-T01` Implement `POST /api/orders` against mock repository. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/orders/route.ts`.
  - Result: created order request schema and mock order repository.
  - Result: server re-reads product data through cart validation and recalculates line totals/subtotal.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and HTTP curl checks passed.
- [x] `D05-T02` Implement `GET /api/admin/orders`. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/admin/orders/route.ts`.
  - Result: added server-side mock admin token guard.
  - Result: added mock order list repository function.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and HTTP curl checks passed.
- [x] `D05-T03` Implement `PATCH /api/admin/orders/[id]`. - 2026-07-14
  - Result: created `caseflow-store/src/app/api/admin/orders/[id]/route.ts`.
  - Result: added order status update validation and mock repository update function.
  - Result: admin token is required server-side before status updates.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and HTTP curl checks passed.
- [x] `D05-T04` Standardize `{ data, error, meta }` response shape. - 2026-07-14
  - Result: created `caseflow-store/src/lib/api/response.ts`.
  - Result: refactored API routes to return `{ data, error, meta }`.
  - Result: list endpoints include `meta.count`; detail/mutation/error responses include `meta: null`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and response-shape curl checks passed.
- [x] `D05-T05` Verify server never trusts client price/subtotal. - 2026-07-14
  - Result: cart validation ignored fake client subtotal, price, and lineTotal.
  - Result: order creation ignored fake client subtotal, price, and lineTotal.
  - Result: admin status update ignored fake subtotal and items fields.
  - Verification: HTTP curl checks confirmed server-calculated totals were preserved.
- [!] `D05-T06` Preview deploy mock API if Vercel is ready. - deferred 2026-07-14
  - Result: not deployed.
  - Reason: Vercel CLI is not installed, `.vercel` project link is missing, Vercel environment variables are missing, and deploy approval/target is not confirmed.
  - Verification: readiness checks ran without exposing secrets.

## Phase 3 - Frontend UI/UX With Mock Data

### Day 6 - Design system and layout

- [x] `D06-T01` Map `DESIGN.md` tokens into global CSS/Tailwind. - 2026-07-14
  - Result: mapped color, radius, spacing, typography, selection, and focus-visible tokens in `caseflow-store/src/app/globals.css`.
  - Verification: `npm run lint`, `npm run build`, and token search passed.
- [x] `D06-T02` Create Button, Input, Badge, Container, Card, Skeleton, and ErrorMessage. - 2026-07-15
  - Result: created shared UI primitives under `caseflow-store/src/components/ui/` and exported them from `src/components/ui/index.ts`.
  - Result: added `caseflow-store/src/app/ui-preview/page.tsx` for visual QA of the primitives.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and Playwright screenshots at 375px and 1440px passed visual review.
- [x] `D06-T03` Create Header, Footer, and mobile navigation. - 2026-07-15
  - Result: created `SiteHeader`, `SiteFooter`, `MobileNavigation`, and shared navigation config under `caseflow-store/src/components/layout/`.
  - Result: wired the layout shell into `caseflow-store/src/app/layout.tsx`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and desktop/mobile/menu-open screenshots passed visual review.
- [x] `D06-T04` Verify 375px and 1440px layouts. - 2026-07-15
  - Result: verified `/`, `/ui-preview`, and mobile menu-open state at the required breakpoints.
  - Verification: production local screenshots and DOM overflow checks passed; no horizontal overflow was detected.

### Day 7 - Homepage and product listing

- [x] `D07-T01` Build homepage. - 2026-07-15
  - Result: replaced the implementation status page with a storefront homepage using mock catalog data.
  - Result: added hero, category shortcuts, featured product preview, compatibility section, and support cards.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, Playwright screenshots, and DOM overflow checks passed at 1440px and 375px.
- [x] `D07-T02` Build product grid. - 2026-07-15
  - Result: created reusable product visual, product card, and product grid components under `caseflow-store/src/features/products/`.
  - Result: homepage now renders all 16 mock products in a responsive grid.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, product-card count check, Playwright screenshots, and DOM overflow checks passed at 1440px and 375px.
- [x] `D07-T03` Add category filter. - 2026-07-15
  - Result: created `ProductCatalog` client component with category filter state and accessible filter buttons.
  - Result: filter buttons show per-category counts and update the rendered product grid.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, category interaction checks, Playwright/CDP screenshots, and DOM overflow checks passed.
- [x] `D07-T04` Add search and basic sorting. - 2026-07-15
  - Result: added product search, basic sort control, clear search action, dynamic filter counts after search, and accessible filter count labels.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, CDP interaction checks, screenshots, and DOM overflow checks passed at 1440px and 375px.
- [x] `D07-T05` Add loading, empty, and error states. - 2026-07-15
  - Result: added reusable product grid skeleton, empty state, error state, disabled control behavior for unavailable catalog states, and a noindex catalog state preview route.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, Playwright screenshots for empty/loading/error at 1440px and 375px, and HTML selector checks passed.

### Day 8 - Product detail

- [x] `D08-T01` Build `/products/[slug]`. - 2026-07-15
  - Result: added dynamic product detail route, static params, product metadata, and product-card links to detail pages.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, HTTP status checks, link count checks, and desktop/mobile screenshots passed.
- [x] `D08-T02` Show image, price, stock, compatibility, and description. - 2026-07-15
  - Result: product detail page now shows product image visual, formatted price, stock state, compatibility labels, product description, and category context.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, HTML content checks, and desktop/mobile screenshots passed.
- [x] `D08-T03` Add quantity selector and add-to-cart feedback. - 2026-07-15
  - Result: added product detail quantity controls, stock-aware increment/decrement buttons, and live add-to-cart feedback.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, HTML marker checks, desktop/mobile screenshots, and Chrome interaction check passed.
- [x] `D08-T04` Add not-found behavior. - 2026-07-15
  - Result: added product-specific not-found UI for unknown product slugs.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, HTTP 404 marker check, and desktop/mobile screenshots passed.

### Day 9 - Cart

- [x] `D09-T01` Implement Cart Context. - 2026-07-15
  - Result: added in-memory Cart Context, app provider, cart count link, and product detail add-to-cart integration.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, no-storage/no-price grep, and Chrome desktop/mobile interaction checks passed.
- [x] `D09-T02` Persist only `{ productId, quantity }` in localStorage with a version. - 2026-07-15
  - Result: persisted cart state to `caseflow-store.cart.v1` with `{ version, items }` and item-only `{ productId, quantity }` payloads.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, localStorage schema check, reload persistence check, invalid-version check, and desktop/mobile screenshots passed.
- [x] `D09-T03` Build cart drawer. - 2026-07-15
  - Result: added cart drawer with empty state, item list, estimated subtotal, remove, clear, close, backdrop, Escape close, and focus loop.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, Chrome desktop/mobile drawer interaction checks, localStorage payload check, and screenshots passed.
- [x] `D09-T04` Validate quantity boundaries. - 2026-07-15
  - Result: add-to-cart and drawer quantity updates now clamp against available stock.
  - Result: product detail shows remaining quantity, disables add-to-cart at stock max, and shows quantity `0` when no more units can be added.
  - Result: cart drawer supports bounded quantity decrement/increment and detects tampered over-stock localStorage with a visible error plus Set to max action.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, browser interaction checks, localStorage schema checks, and desktop/mobile screenshots passed.

### Day 10 - Checkout

- [x] `D10-T01` Build `/checkout`. - 2026-07-15
  - Result: added `/checkout` route with empty cart state, contact/shipping form shell, server-validated cart review, and over-stock validation error state.
  - Result: cart drawer now links to `/checkout`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, browser interaction checks, localStorage schema check, and desktop/mobile screenshots passed.
- [x] `D10-T02` Validate customer name, email, phone, and shipping address. - 2026-07-15
  - Result: checkout form now validates full name, email, phone, and shipping address using the same domain Zod schemas as order data.
  - Result: fields validate on blur and submit, show inline errors, and show a success status when customer details are valid.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, browser checks for empty fields, invalid email/phone, valid details, no card-like inputs, and desktop/mobile screenshots passed.
- [x] `D10-T03` Build order summary. - 2026-07-15
  - Result: added an order summary that uses server-validated cart data for item count, subtotal, and order total.
  - Result: summary includes demo shipping/payment rows and is hidden when server cart validation fails.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, browser checks for valid summary, over-stock error suppression, no card-like inputs, and desktop/mobile screenshots passed.
- [x] `D10-T04` Build order success page. - 2026-07-15
  - Result: added `/checkout/success`, submitted simulated orders through `POST /api/orders`, stored a non-PII success snapshot in sessionStorage, and cleared the local cart after success.
  - Result: success page shows order code, pending status, server-calculated total, items, direct-URL fallback, and no payment fields.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, browser checkout-submit success flow, cart-clear check, fallback check, and desktop/mobile screenshots passed.
- [x] `D10-T05` Create Playwright test skeleton. - 2026-07-15
  - Result: installed `@playwright/test`, added `npm run test:e2e`, and created `playwright.config.ts`.
  - Result: added `tests/e2e/checkout.spec.ts` with checkout happy-path and success direct-link fallback tests.
  - Result: the happy-path test seeds localStorage with item-only cart data, verifies server-calculated totals, submits a simulated order, verifies cart clear and non-PII success snapshot, and writes a visual screenshot artifact.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, `npx playwright install chromium`, and `npm run test:e2e` passed.
  - Note: `D17-T01` overlaps with this task now; Day 17 should expand E2E coverage rather than reinstall Playwright as a fake separate milestone.

### Day 11 - Admin UI

- [x] `D11-T01` Build `/admin/login`. - 2026-07-15
  - Result: added `/admin/login` with token form, server API verification, invalid-token error state, saved-session state, and shared mock admin session helpers.
  - Result: successful verification stores a versioned session under `caseflow-store.admin.session.v1` in sessionStorage for this browser tab.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, admin curl checks, `npm run test:e2e`, Playwright interaction check, and desktop/mobile screenshots passed.
  - Note: this is mock-phase admin token handling, not Supabase Auth. Supabase Auth and role checks remain Day 15 work.
- [x] `D11-T02` Build admin order list. - 2026-07-15
  - Result: added `/admin/orders` with auth-required, loading, error, empty, and list states.
  - Result: order list reads the saved mock admin session, calls `GET /api/admin/orders` with the admin header, and renders desktop table plus mobile cards.
  - Result: `/admin/login` now links to `/admin/orders` after a session is saved.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, admin curl checks, `npm run test:e2e`, Playwright admin orders check, and desktop/mobile screenshots passed.
  - Note: order list is read-only; order detail and status updates remain `D11-T03`.
- [x] `D11-T03` Build order detail and status update UI. - 2026-07-15
  - Result: `/admin/orders` now includes selected-order detail, visible desktop/mobile order selection controls, customer/shipping/item details, and a status update form.
  - Result: status updates call the guarded `PATCH /api/admin/orders/[id]` route with the saved admin token and update the UI from the server response.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, `npm run test:e2e`, Playwright admin detail/status QA, server status verification, and desktop/mobile screenshots passed.
  - Note: no separate `GET /api/admin/orders/[id]` route was added; the detail panel uses the already-loaded list payload.
- [x] `D11-T04` Build mobile admin treatment. - 2026-07-15
  - Result: mobile/tablet admin now uses compact summary, selected-order bar, denser order cards, and mobile selection that scrolls/focuses the order detail panel.
  - Result: tablet widths below `lg` keep card layout instead of activating the desktop table too early.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, `npm run test:e2e`, Playwright mobile admin QA, status PATCH server verification, and 375px/768px/1440px screenshots passed.

### Day 12 - UI acceptance and feature freeze

- [x] `D12-T01` Test 375px, 768px, 1024px, and 1440px. - 2026-07-15
  - Result: tested home/catalog, product detail, cart drawer, checkout with cart, checkout success, admin login, and admin orders at 375px, 768px, 1024px, and 1440px.
  - Result: generated 28 screenshot artifacts and one JSON check artifact; no horizontal overflow failures were found.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run test:e2e`, and Playwright breakpoint QA passed.
- [x] `D12-T02` Check keyboard navigation and focus states. - 2026-07-15
  - Result: added Playwright keyboard/focus coverage for mobile navigation, cart drawer, product detail, checkout, admin login, and mobile admin order detail.
  - Result: fixed cart drawer focus return after closing from mobile menu; focus now falls back to a visible control when the original opener becomes hidden.
  - Result: generated 6 screenshot artifacts and one JSON check artifact.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, targeted keyboard/focus Playwright spec, and full `npm run test:e2e` passed.
- [x] `D12-T03` Check loading, empty, error, and success states. - 2026-07-15
  - Result: added Playwright state coverage for catalog loading/empty/error, cart empty, checkout empty/error/success, product not-found, admin auth-required/loading/empty/error, and admin login error/success.
  - Result: generated 14 screenshot artifacts and one JSON check artifact.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`, targeted state Playwright spec, and full `npm run test:e2e` passed.
- [x] `D12-T04` Run `npm run lint && npm run build`. - 2026-07-15
  - Result: final Day 12 lint and production build verification passed.
  - Verification: `npm run lint && npm run build` completed successfully; Next.js generated 31 static pages.
- [x] `D12-T05` Freeze features; after this point only fixes and integration work are allowed. - 2026-07-15
  - Result: feature freeze is active after Day 12 UI acceptance.
  - Result: future work is limited to fixes, integration work, deployment work, tests, documentation, and explicitly approved roadmap changes.
  - Next: begin Phase 4 with `D13-T01 - Create Supabase project`.

## Phase 4 - Supabase Integration

### Day 13 - Supabase project and schema

- [x] `D13-T01` Create Supabase project. - completed 2026-07-15
  - Result: created and verified Supabase project `caseflow-store` in `NVTruong473's Org`.
  - Evidence: dashboard URL `https://supabase.com/dashboard/project/fcsuldrerhbynwotcvyn`, public project URL `https://fcsuldrerhbynwotcvyn.supabase.co`, and screenshot artifact `caseflow-store/.agent/artifacts/d13-t01-supabase-project-dashboard.png`.
  - Security note: no service role key or database password was printed or stored during this task.
  - Remaining for later tasks: configure ignored `.env.local`, apply schema, verify RLS, and seed data.
- [x] `D13-T02` Install Supabase packages. - completed 2026-07-15
  - Result: installed `@supabase/supabase-js` `^2.110.5` and `@supabase/ssr` `^0.12.3`.
  - Result: updated `caseflow-store/package.json` and `caseflow-store/package-lock.json`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm ls @supabase/supabase-js @supabase/ssr`, and `git diff --check` passed.
  - Audit note: `npm audit --json` still reports 2 moderate findings through Next.js bundled PostCSS; `npm audit fix --force` suggests an inappropriate Next.js downgrade and was not run.
- [x] `D13-T03` Apply schema SQL. - completed 2026-07-15
  - Result: applied `caseflow-store/supabase/schema.sql` to Supabase project `caseflow-store` through SQL Editor.
  - Verification: SQL Editor returned `Success. No rows returned`.
  - Verification query result: expected table count `5`, tables `categories`, `order_items`, `orders`, `products`, `profiles`; cart table count `0`; `order_status` type count `1`; trigger count `4`; policy count `3`; RLS flags true for all 5 schema tables.
  - Visual evidence: `caseflow-store/.agent/artifacts/d13-t03-schema-verification.png`.
- [x] `D13-T04` Enable RLS. - completed 2026-07-15
  - Result: explicitly enabled RLS for `profiles`, `categories`, `products`, `orders`, and `order_items`.
  - Result: added explicit Data API grants/revokes to `caseflow-store/supabase/schema.sql`.
  - Verification: anon/authenticated can select active catalog tables; anon cannot select profiles; anon/authenticated cannot directly select or insert `orders` or `order_items`.
  - Behavior check: temporary transaction under role `anon` saw only active category/product data and no order privileges, then rollback removed all test rows.
  - Visual evidence: `caseflow-store/.agent/artifacts/d13-t04-rls-behavior-check.png`.
- [x] `D13-T05` Seed categories and products. - completed 2026-07-15
  - Result: created `caseflow-store/supabase/seed.sql` from the verified mock catalog and applied it through Supabase SQL Editor.
  - Result: inserted or updated 5 active categories and 16 active products with deterministic UUIDs aligned to `src/data/mock/catalog.ts`.
  - Verification: SQL Editor returned `seed_check` with category count `5`, active category count `5`, product count `16`, active product count `16`, featured product count `6`, and category distribution `chargers: 3`, `phone-cases: 4`, `stands-mounts: 3`, `cables-adapters: 3`, `screen-protectors: 3`.
  - Visual evidence: `caseflow-store/.agent/artifacts/d13-t05-seed-verification.png`.

### Day 14 - Product repository

- [x] `D14-T01` Create Supabase server and browser clients. - completed 2026-07-15
  - Result: added typed Supabase raw database contracts in `caseflow-store/src/types/supabase.ts`.
  - Result: added browser client factory in `caseflow-store/src/lib/supabase/browser.ts`.
  - Result: added async per-request server client factory in `caseflow-store/src/lib/supabase/server.ts` using Next.js `cookies()`.
  - Result: added public Supabase environment guard in `caseflow-store/src/lib/supabase/env.ts`.
  - Security note: no service role key is imported by the browser client, and no mixed server/browser barrel export was kept.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
- [x] `D14-T02` Implement row-to-domain mapping. - completed 2026-07-15
  - Result: added typed category and product row mappers in `caseflow-store/src/lib/supabase/mappers.ts`.
  - Result: converted database `snake_case` fields to domain `camelCase` fields and parsed every mapped object through the existing Zod domain schemas.
  - Verification: runtime checks mapped valid rows, defensively copied product compatibility, and rejected a negative product price; `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.
- [x] `D14-T03` Replace mock product repository with Supabase repository. - completed 2026-07-15
  - Result: configured an ignored `.env.local` with the public project URL and anon key; no server secret was added to client code.
  - Result: added `supabase-catalog.ts` and moved homepage, product detail, product/category APIs, cart validation, cart drawer, and checkout catalog reads to Supabase.
  - Result: catalog rows are mapped and Zod-validated before reaching UI/API responses; cart price, stock, subtotal, and category metadata come from current database rows.
  - Verification: live checks returned 5 categories, 16 products, 6 featured products, 4 phone-case products, a valid detail record, cart subtotal `658000` for two AeroGuard cases, and Supabase-backed homepage HTML.
  - Verification: `.env.local` is ignored; no service-role reference exists in `src`; lint, TypeScript, diff check, and production build passed.
- [x] `D14-T04` Retest storefront. - completed 2026-07-15
  - Result: production checks verified live Supabase counts, category filtering, product detail, add-to-cart feedback, cart validation, and checkout summary.
  - Verification: focused Playwright storefront/cart/checkout suite passed `7/7`; desktop Chrome checks confirmed 5 categories, 16 products, 4 phone cases, quantity 2, and subtotal `658000` VND.
  - Visual evidence: `caseflow-store/.agent/artifacts/d14-t04-supabase-storefront-1440.png`, `d14-t04-supabase-cart-drawer.png`, and `d14-t04-supabase-checkout.png`.
  - Known Day 15 finding: two broader admin tests failed because the production server no longer accepts the development mock admin token; this is not a storefront regression and must be resolved by D15-T03..D15-T05.

### Day 15 - Orders and admin auth

- [x] `D15-T01` Create order and order items safely. - completed 2026-07-15
  - Result: added a server-only Supabase admin client, trusted order command validation, order row mappers, and a `security definer` RPC that inserts an order and its items atomically.
  - Security: execute is restricted to `service_role`; anon and authenticated roles retain no direct order-table access; the service credential remains only in ignored server environment configuration.
  - Verification: permission checks, forced rollback checks, live create/read/delete cleanup, invalid-subtotal rejection, lint, TypeScript, diff check, and production build passed.
  - Visual evidence: `caseflow-store/.agent/artifacts/d15-t01-service-role-verification.png`.
- [x] `D15-T02` Recalculate price server-side. - completed 2026-07-15
  - Result: replaced mock order creation in `POST /api/orders` with live catalog validation followed by atomic Supabase persistence.
  - Security: the route accepts only customer fields plus product IDs and quantities; current product name, price, stock, line totals, and subtotal are rebuilt on the server.
  - Verification: tampered price/subtotal input persisted the real `329000` unit price and `658000` subtotal; missing product returned 404, excess stock returned 409, Playwright checkout passed `2/2`, cleanup passed, and production build passed.
  - Visual evidence: `caseflow-store/.agent/artifacts/d15-t02-live-order-success.png`.
- [x] `D15-T03` Configure admin account and role. - completed 2026-07-15
  - Result: created a dedicated confirmed Supabase Auth identity and upserted its matching `profiles` row with role `admin`.
  - Security: generated credentials are stored only in ignored `.env.local`, the password was not printed or documented, and local file permissions were restricted to `0600`.
  - Verification: password sign-in succeeded through the anon client and the authenticated session could read its own `admin` profile through RLS.
  - Visual evidence: `caseflow-store/.agent/artifacts/d15-t03-supabase-admin-account.png`.
- [x] `D15-T04` Protect admin pages and APIs. - completed 2026-07-15
  - Result: replaced the mock header token/sessionStorage flow with Supabase SSR cookie login/logout, session refresh Proxy, server page gates, and per-request API role checks.
  - Result: admin order list and status updates now read/write live Supabase data through the service-role repository only after session and profile authorization pass.
  - Verification: anonymous API returned 401, anonymous page redirected, wrong password returned 401, admin page/API returned 200, status update persisted, sign-out restored 401, QA cleanup passed, and the production build passed.
  - Fix: removed a duplicate React footer key exposed by browser QA.
  - Visual evidence: `caseflow-store/.agent/artifacts/d15-t04-protected-admin-orders.png`.
- [x] `D15-T05` Test anonymous, normal user, and admin access. - completed 2026-07-15
  - Result: added a Playwright access matrix backed by temporary real Supabase customer identities and SSR cookies, with automatic user/order cleanup.
  - Verification: anonymous catalog/admin behavior, customer 403 behavior, direct Data API denial, admin list/update/sign-out behavior, and server-owned order access all passed.
  - Verification: the full production Playwright suite passed `12/12`; test order count and temporary customer count both returned 0 after cleanup.
  - Security verification: 26 client assets contained no service-role or admin-password value; `.env.local` remained ignored with mode `0600`.
  - Visual evidence: `caseflow-store/.agent/artifacts/d15-t05-customer-forbidden.png` and `d15-t05-admin-access-matrix.png`.

### Day 16 - Environment, errors, and integration freeze

- [x] `D16-T01` Finalize `.env.example`. - completed 2026-07-15
  - Result: documented the exact three runtime variables and two Playwright-only admin credential variables currently used by the codebase.
  - Result: removed obsolete `CASEFLOW_ADMIN_API_TOKEN` and unused `NEXT_PUBLIC_SITE_URL`; optional Playwright URL/port overrides remain commented so copying the template cannot create an empty base URL override.
  - Verification: automated contract comparison found 5 used keys, 5 active template keys, 0 missing keys, 0 stale keys, and 0 non-empty placeholder values.
- [x] `D16-T02` Verify no secret is committed. - completed 2026-07-15
  - Result: added root ignore rules for OS metadata, environment files, and the unrelated local `password manager/` directory.
  - Verification: `.env.local` is ignored with mode `0600`; 299 commit-candidate files and 397 build files contained 0 exact service-role/admin-password hits and 0 common secret-pattern hits.
  - Limitation: the repository has no Git `HEAD`, so there is no committed history to scan yet; D19 must repeat the scan immediately before the first commit/push.
  - Visual evidence: `caseflow-store/.agent/artifacts/d16-t02-secret-scan.json`.
- [x] `D16-T03` Add stable API error codes. - completed 2026-07-15
  - Result: added a 13-code compile-time contract, constrained `apiError`, and documented HTTP/code semantics in `docs/api-contract.md`.
  - Result: added production API contract coverage for public validation/not-found and admin validation/authentication errors.
  - Verification: 8 Route Handlers used no undeclared literal code; lint, TypeScript, production build, and Playwright API contract tests `2/2` passed.
- [x] `D16-T04` Deploy integration preview. - completed 2026-07-15
  - Result: created a Vercel Hobby workspace/project, configured the three preview runtime variables, and deployed a Vercel-authenticated preview in Ready state.
  - Result: added root-anchored `.vercelignore` rules so internal docs/tests/SQL/artifacts are excluded without dropping `src/lib/supabase` runtime modules.
  - Verification: home 200, catalog counts 5/16, stable 404/401 errors, live order 201 plus cleanup 1/1, admin login/list/logout/post-logout 200/200/200/401, and 0 browser console errors/warnings.
  - Preview: `https://caseflow-store-74nu9i3d7-nvt-ruong473.vercel.app` (Vercel Authentication enabled).
  - Visual evidence: `caseflow-store/.agent/artifacts/d16-t04-vercel-preview.png` and `d16-t04-vercel-preview.json`.
- [x] `D16-T05` Run `npm run lint && npm run build`. - completed 2026-07-15
  - Verification: the exact combined command passed; Next.js compiled, typechecked, and generated 16 static pages.
  - Security verification: post-Vercel scan checked service-role, admin-password, and Vercel OIDC values across 307 commit candidates and 397 build files with 0 hits.
  - Cleanup: 0 D16 preview QA orders remain.
  - Result: Day 16 is complete and integration freeze is active.
  - Visual evidence: `caseflow-store/.agent/artifacts/d16-t05-final-gate.json`.

## Phase 5 - Local E2E Testing

### Day 17 - E2E happy path

- [x] `D17-T01` Install and configure Playwright. - 2026-07-16
  - Note: core install/config was completed early in `D10-T05`; reassess this as E2E hardening when Day 17 starts.
  - Result: hardened the existing config with explicit boolean, URL, and port parsing; global required-environment validation; deterministic production-server startup; bounded action and navigation timeouts; and one worker for the shared live Supabase test backend.
  - Verification: lint and TypeScript passed; Playwright discovered 14 tests in 5 files; invalid port rejection passed; Chromium executed the focused production API suite `2/2` on a clean port.
  - Visual evidence: `caseflow-store/.agent/artifacts/d17-t01-playwright-hardening.json`.
- [x] `D17-T02` Test homepage to product to cart to checkout to success. - 2026-07-16
  - Result: added a browser-driven storefront test that visits the homepage, opens AeroGuard MagSafe Case, selects quantity 2, adds it to the cart, reviews the drawer, checks out, and reaches the success page without test-side cart seeding.
  - Verification: lint and TypeScript passed; focused Chromium flow passed; order API returned 201 and server-calculated subtotal `658000`; cart and success storage were correct; remaining QA orders were 0.
  - Visual evidence: `caseflow-store/.agent/artifacts/d17-t02-storefront-checkout-success.png`.
- [x] `D17-T03` Test checkout validation failure. - 2026-07-16
  - Result: added a focused checkout test for all four empty-field errors and all four malformed or over-limit field errors.
  - Verification: each field exposed `aria-invalid` and referenced its error through `aria-describedby`; the form remained idle on `/checkout`; `POST /api/orders` request count remained 0; lint, TypeScript, and focused Chromium passed.
  - Visual evidence: `caseflow-store/.agent/artifacts/d17-t03-checkout-validation.png`.
- [x] `D17-T04` Test admin login and status update. - 2026-07-16
  - Result: added a focused admin workflow that creates a pending QA order, logs in through the admin form, selects that exact order, updates it to confirmed, checks the protected API response and Supabase row, then signs out.
  - Verification: lint and TypeScript passed; focused Chromium passed; API, UI, and database all reported `confirmed`; post-sign-out admin API returned 401; remaining QA orders were 0.
  - Visual evidence: `caseflow-store/.agent/artifacts/d17-t04-admin-status-update.png`.
- [x] `D17-T05` Run `npx playwright test`. - 2026-07-16
  - Result: the complete Chromium suite ran 17 tests across 8 spec files with one worker against a Playwright-managed production server.
  - Verification: exact command `npx playwright test` passed `17/17` in 1.3 minutes with 0 failed, flaky, or skipped tests; all QA orders and temporary customer users were cleaned to 0; the production test server stopped cleanly.
  - Visual evidence: `caseflow-store/.agent/artifacts/d17-t05-playwright-report.png`, `caseflow-store/.agent/artifacts/d17-t05-playwright-suite.json`, and `caseflow-store/playwright-report/index.html`.

### Day 18 - Edge cases and release candidate

- [x] `D18-T01` Test empty cart. - 2026-07-16
  - Verification: focused Chromium test passed; cart count was 0; drawer and checkout empty states were visible; no checkout action or order form was rendered; `POST /api/orders` count remained 0.
  - Visual evidence: `caseflow-store/.agent/artifacts/d18-t01-empty-cart-drawer.png` and `d18-t01-empty-checkout.png`.
- [x] `D18-T02` Test missing product. - 2026-07-16
  - Verification: API and product page returned 404; API code was `PRODUCT_NOT_FOUND`; no purchase controls rendered; Browse products returned to the 16-product catalog.
  - Visual evidence: `caseflow-store/.agent/artifacts/d18-t02-missing-product.png`.
- [x] `D18-T03` Test out-of-stock or invalid quantity. - 2026-07-16
  - Verification: quantity 0 returned `400/VALIDATION_ERROR`; quantity 19 returned `409/OUT_OF_STOCK`; product UI clamped to 1-18 and disabled further increments; tampered quantity 99 disabled checkout submission.
  - Visual evidence: `caseflow-store/.agent/artifacts/d18-t03-quantity-max-cart.png` and `d18-t03-out-of-stock-checkout.png`.
- [x] `D18-T04` Run production-like local test with `npm run build && npm run start`. - 2026-07-16
  - Verification: exact build/start chain produced 16 pages and a Ready production server; HTTP home/products/categories/missing/admin checks returned 200/200/200/404/401; 5 representative Playwright flows passed; QA cleanup returned 0.
  - Visual evidence: `caseflow-store/.agent/artifacts/d18-t04-production-local.png` and `d18-t04-production-local.json`.
- [x] `D18-T05` Mark release candidate only if blockers are closed. - 2026-07-16
  - Result: accepted `v1.0.0-rc.1` only after resolving test-only cart storage races and obtaining a clean full-suite pass.
  - Verification: lint and TypeScript passed; production build/start passed; Playwright passed 20/20 in 1.6 minutes with 0 failed/flaky/skipped; 327 commit candidates had 0 exact secret matches; QA orders/users were 0; dependency audit had 0 high/critical and 2 accepted moderate advisories.
  - Evidence: `caseflow-store/docs/release-candidate.md`, `.agent/artifacts/d18-t05-release-candidate-report.png`, and `d18-t05-release-candidate.json`.

## Phase 6 - Deploy And Portfolio Acceptance

### Day 19 - Production deployment

- [x] `D19-T01` Push repository. - 2026-07-16
  - Result: created public GitHub repository `NVTruong473/caseflow-store`, committed the release candidate, and pushed `main`.
  - Verification: local and remote commit both equal `c4e4dfa4a7962057652045134ccbc81b7006fe04`; pre-push scan found 0 exact secrets across 331 candidates; `.env.local` and `.vercel` remained ignored.
  - Evidence: `caseflow-store/.agent/artifacts/d19-t01-github-push.json`.
- [x] `D19-T02` Configure production environment variables. - 2026-07-16
  - Result: configured the three runtime Supabase variables as sensitive Production values without deploying Playwright credentials.
  - Verification: Vercel lists all three as Encrypted for Production and all three existing Preview entries remain intact; no values were logged.
  - Evidence: `caseflow-store/.agent/artifacts/d19-t02-production-env.json`.
- [x] `D19-T03` Deploy preview and smoke test. - 2026-07-16
  - Result: deployed preview `dpl_EDqtfK9XuinEoKmCQjMMuY9GDagw` in Ready state.
  - Verification: protected smoke test returned home 200, categories/products 5/16, missing product 404, anonymous admin 401, order 201 with server subtotal `329000`, and cleanup 0.
  - Evidence: `caseflow-store/.agent/artifacts/d19-t03-preview-smoke.json`.
- [x] `D19-T04` Deploy production. - 2026-07-16
  - Result: deployed production `dpl_4Wocg3yqgFoSUSCR76jvN6xL2esu` in Ready state with canonical alias `https://caseflow-store.vercel.app`.
  - Verification: the canonical alias returned HTTP 200 and a full-page browser capture showed the live 5-category, 16-product storefront without layout failures.
  - Evidence: `caseflow-store/.agent/artifacts/d19-t04-production.json` and `d19-t04-production.png`.
- [x] `D19-T05` Test storefront, checkout, and admin on production. - 2026-07-16
  - Result: fixed a production-only admin navigation race, redeployed `dpl_D5GLc5s5WbDs4xB3d22kXieyDCpz`, and accepted the public production application.
  - Verification: lint/build passed with 16 routes; the full Chromium suite passed 20/20 against the canonical production URL in 2.8 minutes with 0 failed/flaky/skipped; QA orders/users returned 0/0.
  - Evidence: `caseflow-store/.agent/artifacts/d19-t05-production-acceptance.json` and `d19-t05-production-report.png`.

### Day 20 - Acceptance and portfolio packaging

- [x] `D20-T01` Finalize README. - 2026-07-16
  - Result: replaced the scaffold README with a repository portfolio overview and an application-level setup guide grounded in verified release evidence.
  - Verification: both README files passed whitespace checks; all relative links resolve; production, simulated checkout, environment boundaries, setup, commands, and 20/20 release evidence are documented without secret values.
  - Evidence: `README.md`, `caseflow-store/README.md`, and `caseflow-store/.agent/artifacts/d20-t01-readme.json`.
- [x] `D20-T02` Finalize architecture summary and ADR index. - 2026-07-16
  - Result: replaced planning-era architecture text with the verified production runtime, request flows, data/security boundaries, deployment gate, and a five-record ADR index.
  - Verification: root/app mirrors match; 4 files passed whitespace and relative-link checks with 0 missing links; the order RPC scope and lack of stock decrement are explicit.
  - Evidence: `docs/architecture.md`, `docs/adr/README.md`, and `caseflow-store/.agent/artifacts/d20-t02-architecture.json`.
- [x] `D20-T03` Capture desktop/mobile screenshots. - 2026-07-16
  - Result: captured and embedded production storefront/product-detail views at desktop 1440px and mobile 375px.
  - Verification: all 4 non-empty PNGs were opened and visually checked with 0 blank, crop, or overlap failures; dimensions match the intended viewports.
  - Evidence: `caseflow-store/docs/screenshots/` and `caseflow-store/.agent/artifacts/d20-t03-screenshots.json`.
- [x] `D20-T04` Document known limitations. - 2026-07-16
  - Result: documented 8 verified MVP/product/operational boundaries with impact, current controls, and credible next steps; also recorded the accepted dependency advisory.
  - Verification: root/app mirrors match and pass whitespace checks; current audit is 0 critical/high/low and 2 moderate, with the breaking Next 9.3.3 force-downgrade explicitly rejected.
  - Evidence: `docs/known-limitations.md` and `caseflow-store/.agent/artifacts/d20-t04-known-limitations.json`.
- [x] `D20-T05` Write CV bullets using only verified evidence. - 2026-07-16
  - Result: created a 3-bullet CV version, 6 focus-specific alternatives, interview summary, caveats, and a 9-entry evidence ledger.
  - Verification: root/app mirrors match and pass whitespace checks; 0 unverified scale, percentage, or elapsed-time claims; simulated checkout is explicit.
  - Evidence: `docs/cv-bullets.md` and `caseflow-store/.agent/artifacts/d20-t05-cv-bullets.json`.
- [/] `D20-T06` Create release tag `v1.0.0`.

## 30 Journal Entries

Entries 01-20 document real implementation work. Entries 21-30 are retrospective and must not pretend the project took 30 development days.

- [ ] Entry 01: Environment preflight
- [ ] Entry 02: Next.js initialization
- [ ] Entry 03: Project structure
- [ ] Entry 04: Domain model
- [ ] Entry 05: Database schema
- [ ] Entry 06: Product API
- [ ] Entry 07: Order API
- [ ] Entry 08: Design system
- [ ] Entry 09: Store homepage
- [ ] Entry 10: Product listing
- [ ] Entry 11: Product detail
- [ ] Entry 12: Cart state
- [ ] Entry 13: Checkout
- [ ] Entry 14: Admin dashboard
- [ ] Entry 15: Responsive and accessibility
- [ ] Entry 16: Supabase integration
- [ ] Entry 17: Authentication and security
- [ ] Entry 18: E2E testing
- [ ] Entry 19: Deployment
- [ ] Entry 20: Production acceptance
- [ ] Entry 21: Architecture retrospective
- [ ] Entry 22: Database decisions
- [ ] Entry 23: API design lessons
- [ ] Entry 24: State management lessons
- [ ] Entry 25: Responsive UI lessons
- [ ] Entry 26: Validation and security lessons
- [ ] Entry 27: Testing lessons
- [ ] Entry 28: Deployment lessons
- [ ] Entry 29: Known limitations
- [ ] Entry 30: CV and interview summary
