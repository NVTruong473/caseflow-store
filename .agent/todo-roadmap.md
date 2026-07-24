# CaseFlow Store - Roadmap And Execution Tracker

## Status Legend

- `[ ]`: not started
- `[/]`: in progress
- `[x]`: completed with evidence
- `[!]`: blocked

## Current State

- Project: CaseFlow Books
- Mode: `v1.14` showroom plus private-template separation
- Current gate: `TEMPLATE-T03` deterministic export accepted
- Current task: `TEMPLATE-T04 - Generate And Harden The Private Template`
- Implementation day: Day 40 complete
- Last updated: 2026-07-24

> Detailed post-v1.3 roadmap entries are maintained in
> `caseflow-store/.agent/todo-roadmap.md`.

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
- [x] `D20-T06` Create release tag `v1.0.0`. - 2026-07-16
  - Result: accepted the final release gates and created annotated tag `v1.0.0` for the production/portfolio release.
  - Verification: mirrors/diff/secret scan passed; lint and 16-route build passed; local and production Playwright passed 20/20 with 0 failed/flaky/skipped; production smoke returned home 200, catalog 5/16, admin 401; QA cleanup returned 0/0.
  - Evidence: `caseflow-store/.agent/artifacts/d20-t06-release.json` and `d20-t06-release-report.png`.

## 30 Journal Entries

Entries 01-20 document real implementation work. Entries 21-30 are retrospective and must not pretend the project took 30 development days.

- [x] Entry 01: Environment preflight - 2026-07-16
- [x] Entry 02: Next.js initialization - 2026-07-16
- [x] Entry 03: Project structure - 2026-07-16
- [x] Entry 04: Domain model - 2026-07-16
- [x] Entry 05: Database schema - 2026-07-16
- [x] Entry 06: Product API - 2026-07-16
- [x] Entry 07: Order API - 2026-07-16
- [x] Entry 08: Design system - 2026-07-16
- [x] Entry 09: Store homepage - 2026-07-16
- [x] Entry 10: Product listing - 2026-07-16
- [x] Entry 11: Product detail - 2026-07-16
- [x] Entry 12: Cart state - 2026-07-16
- [x] Entry 13: Checkout - 2026-07-16
- [x] Entry 14: Admin dashboard - 2026-07-16
- [x] Entry 15: Responsive and accessibility - 2026-07-16
- [x] Entry 16: Supabase integration - 2026-07-16
- [x] Entry 17: Authentication and security - 2026-07-16
- [x] Entry 18: E2E testing - 2026-07-16
- [x] Entry 19: Deployment - 2026-07-16
- [x] Entry 20: Production acceptance - 2026-07-16
- [x] Entry 21: Architecture retrospective - 2026-07-16
- [x] Entry 22: Database decisions - 2026-07-16
- [x] Entry 23: API design lessons - 2026-07-16
- [x] Entry 24: State management lessons - 2026-07-16
- [x] Entry 25: Responsive UI lessons - 2026-07-16
- [x] Entry 26: Validation and security lessons - 2026-07-16
- [x] Entry 27: Testing lessons - 2026-07-16
- [x] Entry 28: Deployment lessons - 2026-07-16
- [x] Entry 29: Known limitations - 2026-07-16
- [x] Entry 30: CV and interview summary - 2026-07-16

Journal evidence:

- Root index: `docs/journal/README.md`
- App mirror index: `caseflow-store/docs/journal/README.md`
- Entries 01-20 document real implementation work.
- Entries 21-30 are retrospective notes and do not represent extra development days.

## Phase 7 - CaseFlow Books v1.1 Planning

Do not start `v1.1` runtime implementation until the post-MVP ADR and Day 21-40 roadmap are written and accepted.

### Day 21 - Post-MVP planning gate

- [x] `D21-T01` Create post-MVP ADR for CaseFlow Books. - 2026-07-16
  - Result: created accepted `ADR-0006: Pivot v1.1 To CaseFlow Books`.
  - Result: preserved the Next.js modular monolith, Supabase, mock-first discipline, local cart, and simulated checkout decisions unless a future ADR supersedes them.
  - Result: formalized the Vietnam-first bilingual bookstore direction, 100-edition catalog target, account-gated checkout, admin/staff/customer roles, simulated Vietnam payment methods, business-management scope, and rule-based assistant direction.
  - Guardrails: no unlicensed copying of book covers/descriptions; no real payment claims; no hard-coded tax/FX legal assumptions; no phone-verification claims without a provider.
  - Verification: ADR exists in root/app mirrors, ADR index includes ADR-0006, root/app `.agent` mirrors match, and `git diff --check` passes.
- [x] `D21-T02` Create Day 21-40 roadmap for CaseFlow Books. - 2026-07-16
  - Result: created accepted roadmap `docs/v1.1-caseflow-books-roadmap.md`.
  - Result: defined Day 21-40 task IDs, acceptance criteria, verification, release gates, out-of-scope items, and v1.1 guardrails.
  - Result: included data/legal handling for book metadata, covers, descriptions, translations, VAT/FX estimates, payment simulation, account-gated checkout, roles, admin operations, assistant, testing, deployment, and release packaging.
  - Verification: root/app roadmap mirrors match, roadmap links resolve, root/app `.agent` mirrors match, trailing-whitespace check passes, and `git diff --check` passes.

### Day 22 - Book domain and content policy

- [x] `D22-T01` Create Book Domain And Content Policy. - 2026-07-16
  - Result: updated `docs/domain.md` as the active CaseFlow Books source of truth.
  - Result: defined book works, sellable editions, authors, translators, publishers, categories, formats, languages, ISBN fields, inventory, pricing, summaries, account-gated checkout, roles, operations, payment methods, and assistant boundaries.
  - Result: added content and asset policy distinguishing lower-risk factual metadata from higher-risk copyrighted material.
  - Result: stated summaries/descriptions must be project-written unless a source is clearly permitted.
  - Verification: root/app domain docs match; old phone-accessory domain is no longer described as the active `v1.1` product domain; no runtime files changed; trailing-whitespace check and `git diff --check` pass.
- [x] `D22-T02` Define Book TypeScript Domain Contracts. - 2026-07-16
  - Result: added CaseFlow Books constants and types to `caseflow-store/src/types/domain.ts`.
  - Result: supported book works, editions, authors, translators, publishers, categories, inventory status, language, format, VND pricing, tax/fee/FX estimates, roles, customer profile requirements, payment method identifiers, book cart items, book orders, promotions, and inventory adjustments.
  - Result: kept legacy `Category`, `Product`, `CartItem`, `Order`, and `OrderItem` exports so the released `v1.0.0` runtime can continue to typecheck until later roadmap tasks replace UI/API behavior.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, export search, VND source-of-truth search, and `git diff --check` passed.
- [x] `D22-T03` Create Book Zod Schemas. - 2026-07-16
  - Result: added CaseFlow Books runtime schemas to `caseflow-store/src/lib/validation/domain.ts`.
  - Result: validated book categories, authors, translators, publishers, cover assets, works, editions, cart items, shipping addresses, customer/staff profiles, profile completeness, tax/fee/FX estimates, book orders, book order items, promotions, inventory adjustments, checkout requests, and customer profile update requests.
  - Result: kept legacy validation schemas intact for the released `v1.0.0` runtime.
  - Result: added strict mutating request schemas that reject browser-supplied trusted fields such as `role`, `status`, and `totals`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, focused runtime schema checks, `npm run build`, export search, and `git diff --check` passed.

Day 22 result: complete. CaseFlow Books domain policy, TypeScript contracts, and Zod schemas are ready for Day 23 database/migration planning.

### Day 23 - Database and migration plan

- [x] `D23-T01` Draft CaseFlow Books Schema Migration. - 2026-07-16
  - Result: created `caseflow-store/supabase/migrations/0006_caseflow_books_schema_draft.sql`.
  - Result: drafted book works, editions, authors, translators, publishers, cover assets, categories, customer addresses, promotions, inventory adjustments, and v1.1 order snapshot fields.
  - Result: extended `profiles` role support to `customer`, `staff`, and `admin`.
  - Result: preserved legacy v1.0.0 catalog/order compatibility by expanding rather than deleting the existing schema.
  - Result: added a draft service-role-only `create_book_order_with_items` RPC for account-gated book checkout and server-owned book order snapshots.
  - Guardrail: no SQL was applied; D23-T02 must plan migration/rollback before D23-T03 applies anything.
  - Verification: SQL inspection found expected tables, constraints, indexes, RLS, grants, and no direct public order-table write policies; service-role key use remains under server/lib modules; `git diff --check` passed.
  - Note: local `psql` is not installed, so PostgreSQL dry-run/parse verification is deferred to D23-T03.
- [x] `D23-T02` Plan Production Data Migration And Rollback. - 2026-07-16
  - Result: created `docs/v1.1-production-data-migration-rollback-plan.md`.
  - Result: mirrored the plan to `caseflow-store/docs/v1.1-production-data-migration-rollback-plan.md`.
  - Result: defined an expand-and-contract strategy that preserves v1.0.0 phone-accessory categories, products, profiles, orders, and order items in place.
  - Result: defined backup/export evidence required before D23-T03 applies SQL.
  - Result: listed pre-migration SQL checks, post-migration database checks, post-migration app checks, stop conditions, and rollback decision paths.
  - Result: documented when app rollback is enough, when additive DB schema should stay in place, and when provider backup restore is required.
  - Guardrail: no SQL was applied and no destructive database operation was performed.
  - Verification: root/app plan mirrors match; required plan sections are present; `git diff --check` passed.
- [x] `D23-T03` Apply And Verify Book Schema In Supabase. - 2026-07-16
  - Result: retried after `SUPABASE_DB_URL` was added to local env.
  - Result: created pre-migration `public` schema/data export artifacts and checksums under `caseflow-store/.agent/artifacts/d23-t03-backup/`.
  - Result: applied `caseflow-store/supabase/migrations/0006_caseflow_books_schema_draft.sql` to Supabase project `fcsuldrerhbynwotcvyn` through a verified direct PostgreSQL transaction path.
  - Result: expected CaseFlow Books tables, order/order item columns, RLS flags, policies, grants, constraints, triggers, and `create_book_order_with_items` were verified.
  - Result: anon and authenticated roles cannot directly read protected order/admin tables through Supabase client checks and have no direct write privileges on those protected tables.
  - Result: v1.0.0 catalog/profile counts were preserved and direct book orders remain `0`.
  - Verification: pre/post SQL check artifacts, access-control artifact, `npm run lint`, `npm run build`, `npm run test:e2e` with `20/20` passing, and production smoke checks passed.
  - Guardrail: no secrets were printed or committed; SQL backup files are ignored because they may contain app/customer PII.

Day 23 result: complete. The production Supabase schema is ready for Day 24 catalog data work.

### Day 24 - Catalog data and safe book assets

- [x] `D24-T01` Build 100-Edition Book Seed Dataset. - 2026-07-16
  - Result: created `caseflow-store/src/data/books/seed.ts`.
  - Result: defined 50 real public-domain/classic works and 100 sellable CaseFlow Books demo editions.
  - Result: each work has one English and one Vietnamese edition relationship.
  - Result: each edition includes category linkage through the work, title, author relationship, language, format, price VND, stock, publication year where safe, and self-written short summaries.
  - Guardrail: ISBNs and commercial cover references are intentionally `null`; D24-T01 does not fabricate ISBNs or copy publisher blurbs/covers.
  - Verification: runtime import/count check passed with 50 works, 100 editions, 50 English editions, 50 Vietnamese editions, 11 categories, and 41 authors.
  - Verification: content scan found no copied-blurb markers, no long summary violations, no duplicate long summaries, no commercial cover references, and no fabricated ISBNs.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
- [x] `D24-T02` Create Safe Cover Asset Strategy. - 2026-07-16
  - Result: created `docs/v1.1-safe-cover-asset-strategy.md` and app mirror.
  - Result: added internal placeholder SVG at `caseflow-store/public/images/books/placeholders/book-cover-placeholder.svg`.
  - Result: added one internal `BookCoverAsset` to the seed dataset and mapped all 100 editions to its stable cover ID.
  - Guardrail: no commercial cover URLs, publisher cover files, marketplace image links, or external hotlinked assets were used.
  - Verification: cover strategy check confirmed local path, existing SVG file, no external `href/src`, accessible title metadata, 100/100 editions mapped to a stable cover ID, and a Playwright visual smoke screenshot rendered successfully.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
- [x] `D24-T03` Seed Book Data Into Supabase. - 2026-07-16
  - Result: created deterministic seed script `caseflow-store/scripts/seed-books.ts`.
  - Result: dry-run reported expected payload counts before mutation.
  - Result: applied and reran Supabase upserts with stable IDs and `onConflict` rules.
  - Result: Supabase now contains 11 book categories, 41 authors, 1 publisher, 1 cover asset, 50 works, 51 work-author joins, 100 work-category joins, and 100 editions.
  - Result: active edition language distribution is 50 English and 50 Vietnamese.
  - Result: legacy phone-accessory `categories` and `products` counts remain 5 and 16.
  - Verification: public Supabase smoke query returned 100 active `book_editions` rows and sampled bookstore rows only.
  - Verification: seed artifact saved at `caseflow-store/.agent/artifacts/d24-t03/seed-books-apply.json`.
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.

Day 24 result: complete. CaseFlow Books now has safe seed data and safe placeholder cover assets in Supabase.

### Day 25 - Book repositories and catalog APIs

- [x] `D25-T01` Implement Book Row Mappers And Repositories. - 2026-07-16
  - Evidence:
    - `caseflow-store/src/lib/supabase/book-mappers.ts`
    - `caseflow-store/src/lib/repositories/supabase-books.ts`
    - `caseflow-store/scripts/verify-book-repository.ts`
    - `caseflow-store/.agent/artifacts/d25-t01/book-repository-check.json`
  - Verification: `npx tsx scripts/verify-book-repository.ts`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
- [x] `D25-T02` Replace Product APIs With Book Catalog APIs. - 2026-07-16
  - Evidence:
    - `caseflow-store/src/lib/validation/books.ts`
    - `caseflow-store/src/lib/api/book-catalog.ts`
    - `caseflow-store/src/app/api/categories/route.ts`
    - `caseflow-store/src/app/api/products/route.ts`
    - `caseflow-store/src/app/api/products/[slug]/route.ts`
    - `caseflow-store/.agent/artifacts/d25-t02/api-curl-checks.json`
  - Verification: API curl smoke checks, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
- [x] `D25-T03` Accept Data/Domain Freeze. - 2026-07-16
  - Evidence:
    - `docs/v1.1-data-domain-freeze.md`
    - `caseflow-store/docs/v1.1-data-domain-freeze.md`
    - `caseflow-store/.agent/artifacts/d25-t03/data-domain-freeze-check.json`
  - Verification: freeze artifact, API smoke checks, `npm run lint`, `npx tsc --noEmit`, and `git diff --check` passed.

Day 25 result: complete. Data/domain/API foundation is frozen for Day 26 storefront expansion.

### Day 26 - Branding and bilingual foundation

- [x] `D26-T01` Rebrand UI To CaseFlow Books. - 2026-07-16
  - Evidence:
    - `caseflow-store/src/app/page.tsx`
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/src/components/layout/site-header.tsx`
    - `caseflow-store/src/components/layout/site-footer.tsx`
    - `README.md`
    - `caseflow-store/README.md`
    - `caseflow-store/.agent/artifacts/d26-t01/rebrand-visual-text-check.json`
    - `caseflow-store/.agent/artifacts/d26-t01/home-desktop.png`
    - `caseflow-store/.agent/artifacts/d26-t01/home-mobile.png`
  - Verification: text search, Playwright desktop/mobile screenshots, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
- [x] `D26-T02` Implement Vietnamese/English Language Mode. - 2026-07-16
  - Evidence:
    - `caseflow-store/src/lib/i18n/language.ts`
    - `caseflow-store/src/lib/i18n/server.ts`
    - `caseflow-store/src/components/layout/language-switcher.tsx`
    - `caseflow-store/src/app/api/preferences/language/route.ts`
    - `caseflow-store/src/app/layout.tsx`
    - `caseflow-store/src/app/page.tsx`
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/src/features/cart/cart-drawer.tsx`
    - `caseflow-store/src/features/checkout/checkout-page.tsx`
    - `caseflow-store/src/features/admin/admin-orders-page.tsx`
    - `caseflow-store/.agent/artifacts/d26-t02/language-mode-check.json`
    - `caseflow-store/.agent/artifacts/d26-t02/header-en-desktop.png`
    - `caseflow-store/.agent/artifacts/d26-t02/header-vi-desktop.png`
    - `caseflow-store/.agent/artifacts/d26-t02/header-en-mobile.png`
    - `caseflow-store/.agent/artifacts/d26-t02/header-vi-mobile.png`
  - Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, Playwright language switch checks, screenshot review, and `git diff --check` passed.
  - Follow-up risk: existing seeded Vietnamese book/category content includes some unaccented text; content polish should correct that with explicit data evidence.
- [x] `D26-T03` Add Currency Display Rules. - 2026-07-16
  - Evidence:
    - `caseflow-store/src/lib/format/currency.ts`
    - `caseflow-store/src/lib/format/currency-display.ts`
    - `caseflow-store/src/lib/format/currency-display.server.ts`
    - `caseflow-store/src/components/currency/currency-amount.tsx`
    - `caseflow-store/src/app/page.tsx`
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/.env.example`
    - `caseflow-store/scripts/verify-currency-display-rules.ts`
    - `caseflow-store/.agent/artifacts/d26-t03/currency-display-rules-check.json`
    - `caseflow-store/.agent/artifacts/d26-t03/currency-display-visual-check.json`
    - `caseflow-store/.agent/artifacts/d26-t03/currency-en-home.png`
    - `caseflow-store/.agent/artifacts/d26-t03/currency-vi-home.png`
  - Verification: runtime currency check, Playwright English/Vietnamese display smoke, screenshot review, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed.
  - Follow-up risk: Next dev reported an above-the-fold LCP image warning for the placeholder cover; address during homepage/performance polish.

Day 26 result: complete. Branding, bilingual mode, and currency display rules are ready for Day 27 storefront homepage work.

### Day 27 - Bookstore homepage

- [x] `D27-T01` Build CaseFlow Books Homepage. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/page.tsx`
    - `caseflow-store/scripts/verify-homepage-sections.ts`
    - `caseflow-store/.agent/artifacts/d27-t01/homepage-sections-check.json`
    - `caseflow-store/.agent/artifacts/d27-t01/home-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d27-t01/home-mobile-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-homepage-sections.ts`, and
    `git diff --check`.
  - Scope note: D27-T01 intentionally did not create a full catalog route;
    D28-T01 owns the full catalog page. Homepage links now target current
    curated sections and valid book detail routes instead of dead links.
- [x] `D27-T02` Add Book Category And Discovery Navigation. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/components/layout/navigation.ts`
    - `caseflow-store/src/components/layout/mobile-navigation.tsx`
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/scripts/verify-discovery-navigation.ts`
    - `caseflow-store/.agent/artifacts/d27-t02/discovery-navigation-check.json`
    - `caseflow-store/.agent/artifacts/d27-t02/navigation-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d27-t02/navigation-mobile-vi-open.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-discovery-navigation.ts`,
    source anchor scan, screenshot review, and `git diff --check`.
  - Scope note: customer account, public order tracking, and promotion engine
    routes remain owned by Days 31, 34, and 37. D27-T02 only links to valid
    current routes/anchors and admin entry point.

Day 27 result: complete. Homepage and discovery navigation are ready for Day 28
catalog page work.

### Day 28 - Catalog listing, search, and filters

- [x] `D28-T01` Build Full Book Catalog Page. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/catalog/page.tsx`
    - `caseflow-store/scripts/verify-catalog-page.ts`
    - `caseflow-store/.agent/artifacts/d28-t01/catalog-page-check.json`
    - `caseflow-store/.agent/artifacts/d28-t01/catalog-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d28-t01/catalog-mobile-vi-page-2.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-catalog-page.ts`, updated
    `npx tsx scripts/verify-discovery-navigation.ts`, screenshot review, and
    `git diff --check`.
  - Scope note: D28-T01 adds the paginated catalog shell and active view chips.
    Full filter/sort behavior remains owned by D28-T02.
- [x] `D28-T02` Add Book-Specific Filters And Sorting. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/catalog/page.tsx`
    - `caseflow-store/scripts/verify-catalog-filters.ts`
    - `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-check.json`
    - `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d28-t02/catalog-invalid-mobile-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-catalog-page.ts`,
    `npx tsx scripts/verify-catalog-filters.ts`, and `git diff --check`.
  - Scope note: UI supports relevance/default and author A-Z sorting without
    expanding the frozen public `/api/products` sort contract. API/UI count
    agreement was verified for representative filters supported by the public
    API.
- [x] `D28-T03` Add Empty, Loading, And Error Catalog States. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/features/books/catalog-states.tsx`
    - `caseflow-store/src/app/catalog/loading.tsx`
    - `caseflow-store/src/app/catalog/error.tsx`
    - `caseflow-store/src/app/catalog-state-preview/page.tsx`
    - `caseflow-store/scripts/verify-catalog-states.ts`
    - `caseflow-store/.agent/artifacts/d28-t03/catalog-states-check.json`
    - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-loading.png`
    - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-empty.png`
    - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-error.png`
    - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-loading.png`
    - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-empty.png`
    - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-error.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-catalog-states.ts`,
    `npx tsx scripts/verify-catalog-page.ts`, screenshot review, and
    `git diff --check`.
  - Scope note: The catalog-state preview is a QA surface for loading, empty,
    and error states. It does not expand catalog API semantics or add new
    storefront features outside Day 28.

Day 28 result: complete. Catalog listing, filters, sorting, pagination, and
catalog recovery states are ready for Day 29 detail-page work.

### Day 29 - Book detail and edition choice

- [x] `D29-T01` Build Book Detail Page. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/src/features/books/book-edition-purchase-controls.tsx`
    - `caseflow-store/scripts/verify-book-detail-page.ts`
    - `caseflow-store/.agent/artifacts/d29-t01/book-detail-check.json`
    - `caseflow-store/.agent/artifacts/d29-t01/book-detail-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d29-t01/book-detail-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/d29-t01/book-detail-not-found.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-book-detail-page.ts`,
    screenshot review, and `git diff --check`.
  - Scope note: Add-to-cart now targets a specific sellable book edition id
    through the existing cart context. Full book-edition cart validation and
    drawer adaptation remain owned by `D30-T01`.
- [x] `D29-T02` Add Related Books And Buying Confidence Content. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/scripts/verify-book-detail-confidence.ts`
    - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-check.json`
    - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-mobile-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-book-detail-confidence.ts`,
    regression `npx tsx scripts/verify-book-detail-page.ts`, focused source
    search for old accessory copy, screenshot review, and `git diff --check`.
  - Scope note: Related recommendations use existing author/category/language
    catalog data and link only to valid detail routes.

Day 29 result: complete. Book detail, edition choice, related recommendations,
and buying-confidence content are ready for Day 30 cart work.

### Day 30 - Book cart and storefront freeze

- [x] `D30-T01` Adapt Cart To Book Editions. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/types/catalog.ts`
    - `caseflow-store/src/lib/repositories/supabase-books.ts`
    - `caseflow-store/src/app/api/cart/validate/route.ts`
    - `caseflow-store/src/features/cart/cart-drawer.tsx`
    - `caseflow-store/src/features/checkout/checkout-page.tsx`
    - `caseflow-store/scripts/verify-book-cart.ts`
    - `caseflow-store/.agent/artifacts/d30-t01/book-cart-check.json`
    - `caseflow-store/.agent/artifacts/d30-t01/book-cart-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d30-t01/book-cart-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/d30-t01/book-cart-tampered-storage.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-book-cart.ts`,
    screenshot review, and `git diff --check`.
  - Scope note: Local cart storage still persists `{ productId, quantity }`,
    where `productId` is now the book edition id. Account-gated checkout/order
    creation remains owned by later checkout/auth tasks.
- [x] `D30-T02` Accept Storefront Feature Freeze. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/scripts/verify-storefront-freeze.ts`
    - `caseflow-store/.agent/artifacts/d30-t02/storefront-freeze-check.json`
    - `caseflow-store/.agent/artifacts/d30-t02/home-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d30-t02/home-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/d30-t02/catalog-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d30-t02/catalog-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/d30-t02/detail-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d30-t02/detail-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/d30-t02/cart-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d30-t02/cart-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/d30-t02/language-switch-desktop-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-storefront-freeze.ts`,
    screenshot review, and `git diff --check`.
  - Freeze note: Storefront feature freeze is now active. Product discovery,
    catalog, detail, language mode, and cart entry are stable enough for the
    checkout/auth phase. New storefront features now require explicit roadmap
    approval.

Day 30 result: complete. Storefront feature freeze is active; continue with
Day 31 customer account work.

### Day 31 - Customer accounts

- [x] `D31-T01` Implement Customer Auth Pages. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/account/page.tsx`
    - `caseflow-store/src/app/api/customer/session/route.ts`
    - `caseflow-store/src/features/customer/customer-auth-page.tsx`
    - `caseflow-store/src/lib/auth/customer.ts`
    - `docs/v1.1-auth-access-expectations.md`
    - `caseflow-store/scripts/verify-customer-auth.ts`
    - `caseflow-store/.agent/artifacts/d31-t01/customer-auth-check.json`
    - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signed-out-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signed-in-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signup-mobile-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-customer-auth.ts`, screenshot
    review, source search for phone-verification claims, and `git diff --check`.
  - Caveat: Supabase Auth email sign-up was provider rate-limited during the
    final verification run. The UI now surfaces the `429` clearly and the
    Playwright check uses a verified customer test user as the configured local
    equivalent for login/logout while still checking sign-up form behavior.
- [x] `D31-T02` Add Customer Profile And Address Requirements. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/api/customer/profile/route.ts`
    - `caseflow-store/src/features/customer/customer-profile-form.tsx`
    - `caseflow-store/src/features/checkout/checkout-page.tsx`
    - `caseflow-store/scripts/verify-customer-profile.ts`
    - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-check.json`
    - `caseflow-store/.agent/artifacts/d31-t02/checkout-profile-blocked-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-complete-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d31-t02/checkout-profile-ready-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-validation-mobile-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-customer-profile.ts`,
    screenshot review, focused source search for phone-verification claims, and
    `git diff --check`.
  - Scope note: Checkout is not fully account-gated yet. Anonymous checkout
    still uses the existing contact/shipping form until D32-T01.

### Day 32 - Account-gated checkout

- [x] `D32-T01` Gate Checkout Behind Customer Login. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/checkout/page.tsx`
    - `caseflow-store/scripts/verify-checkout-login-gate.ts`
    - `caseflow-store/.agent/artifacts/d32-t01/checkout-login-gate-check.json`
    - `caseflow-store/.agent/artifacts/d32-t01/checkout-login-redirect-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d32-t01/checkout-after-login-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-checkout-login-gate.ts`,
    screenshot review, and `git diff --check`.
- [x] `D32-T02` Rebuild Checkout Steps For Books. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/api/orders/route.ts`
    - `caseflow-store/src/features/checkout/checkout-page.tsx`
    - `caseflow-store/src/lib/checkout/book-totals.ts`
    - `caseflow-store/src/lib/repositories/supabase-orders.ts`
    - `caseflow-store/scripts/verify-book-checkout-steps.ts`
    - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-steps-check.json`
    - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-steps-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-success-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-book-checkout-steps.ts`,
    screenshot review, UI source search for simulated/demo checkout wording,
    and `git diff --check`.

### Day 33 - Payment simulation and order totals

- [x] `D33-T01` Add Vietnam Payment Method Simulation. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/features/checkout/checkout-success-storage.ts`
    - `caseflow-store/src/features/checkout/checkout-success-page.tsx`
    - `caseflow-store/src/lib/supabase/mappers.ts`
    - `caseflow-store/scripts/verify-payment-methods.ts`
    - `caseflow-store/.agent/artifacts/d33-t01/payment-methods-check.json`
    - `caseflow-store/.agent/artifacts/d33-t01/payment-cod-success-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d33-t01/payment-vnpay-success-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-payment-methods.ts`,
    screenshot review, targeted input source search for card/CVV/expiry/wallet
    credential fields, and `git diff --check`.
- [x] `D33-T02` Add Shipping, VAT, And FX Estimate Engine. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/lib/checkout/book-totals.ts`
    - `caseflow-store/src/lib/format/currency-display.ts`
    - `caseflow-store/src/app/api/orders/route.ts`
    - `caseflow-store/src/app/checkout/page.tsx`
    - `caseflow-store/src/features/checkout/checkout-page.tsx`
    - `caseflow-store/scripts/verify-order-totals-engine.ts`
    - `caseflow-store/.agent/artifacts/d33-t02/order-totals-engine-check.json`
    - `caseflow-store/.agent/artifacts/d33-t02/checkout-usd-estimate-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-order-totals-engine.ts`,
    screenshot review, HSBC FX source verification, and `git diff --check`.

### Day 34 - Customer orders and tracking

- [x] `D34-T01` Add Customer Order History. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/account/orders/page.tsx`
    - `caseflow-store/src/app/api/customer/orders/route.ts`
    - `caseflow-store/src/app/api/customer/orders/[orderCode]/route.ts`
    - `caseflow-store/src/features/customer/customer-orders-page.tsx`
    - `caseflow-store/src/lib/repositories/supabase-orders.ts`
    - `caseflow-store/scripts/verify-customer-order-history.ts`
    - `caseflow-store/.agent/artifacts/d34-t01/customer-order-history-check.json`
    - `caseflow-store/.agent/artifacts/d34-t01/customer-order-history-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-customer-order-history.ts`,
    screenshot review, and `git diff --check`.
- [x] `D34-T02` Add Public Order Tracking With Guarded Lookup. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/app/orders/track/page.tsx`
    - `caseflow-store/src/app/api/orders/track/route.ts`
    - `caseflow-store/src/features/orders/order-tracking-page.tsx`
    - `caseflow-store/src/lib/repositories/supabase-orders.ts`
    - `caseflow-store/src/lib/validation/orders.ts`
    - `caseflow-store/scripts/verify-public-order-tracking.ts`
    - `caseflow-store/.agent/artifacts/d34-t02/public-order-tracking-check.json`
    - `caseflow-store/.agent/artifacts/d34-t02/public-tracking-success-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d34-t02/public-tracking-error-mobile-vi.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-public-order-tracking.ts`,
    screenshot review, and `git diff --check`.
- [x] `D34-T03` Accept Checkout/Auth Freeze. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `docs/v1.1-checkout-auth-freeze.md`
    - `caseflow-store/docs/v1.1-checkout-auth-freeze.md`
    - `caseflow-store/scripts/verify-checkout-auth-freeze.ts`
    - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-check.json`
    - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-anonymous-gate.png`
    - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-order-history-en.png`
    - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-public-tracking-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-checkout-auth-freeze.ts`,
    screenshot review, and `git diff --check`.
  - Day 34 result: checkout/auth freeze is accepted; continue with Day 35
    staff/admin shell tasks.

### Day 35 - Roles and admin shell

- [x] `D35-T01` Add Staff/Operator Role. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `docs/v1.1-role-access-policy.md`
    - `caseflow-store/docs/v1.1-role-access-policy.md`
    - `caseflow-store/src/lib/auth/admin.ts`
    - `caseflow-store/src/app/api/admin/settings/route.ts`
    - `caseflow-store/scripts/verify-staff-role-access.ts`
    - `caseflow-store/.agent/artifacts/d35-t01/staff-role-access-check.json`
    - `caseflow-store/.agent/artifacts/d35-t01/staff-operations-orders-page-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-staff-role-access.ts`,
    screenshot review, and `git diff --check`.
- [x] `D35-T02` Rebuild Admin Navigation For Book Operations. - 2026-07-16
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/features/admin/admin-navigation.tsx`
    - `caseflow-store/src/features/admin/admin-shell-page.tsx`
    - `caseflow-store/src/app/admin/page.tsx`
    - `caseflow-store/src/app/admin/catalog/page.tsx`
    - `caseflow-store/src/app/admin/inventory/page.tsx`
    - `caseflow-store/src/app/admin/promotions/page.tsx`
    - `caseflow-store/src/app/admin/customers/page.tsx`
    - `caseflow-store/src/app/admin/settings/page.tsx`
    - `caseflow-store/scripts/verify-admin-navigation.ts`
    - `caseflow-store/.agent/artifacts/d35-t02/admin-navigation-check.json`
    - `caseflow-store/.agent/artifacts/d35-t02/admin-navigation-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d35-t02/staff-admin-navigation-mobile-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-admin-navigation.ts`,
    screenshot dimension/no-overflow review, and `git diff --check`.

### Day 36 - Catalog and inventory management

- [x] `D36-T01` Add Admin Book Catalog Management. - 2026-07-17
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/lib/auth/admin.ts`
    - `caseflow-store/src/lib/repositories/supabase-books.ts`
    - `caseflow-store/src/lib/validation/books.ts`
    - `caseflow-store/src/lib/api/admin-book-catalog.ts`
    - `caseflow-store/src/app/api/admin/books/editions/route.ts`
    - `caseflow-store/src/app/api/admin/books/editions/[id]/route.ts`
    - `caseflow-store/src/features/admin/admin-catalog-page.tsx`
    - `caseflow-store/src/app/admin/catalog/page.tsx`
    - `caseflow-store/scripts/verify-admin-book-catalog.ts`
    - `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-check.json`
    - `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-admin-book-catalog.ts`,
    screenshot dimension/no-overflow review, and `git diff --check`.
- [x] `D36-T02` Add Inventory Adjustment Workflow. - 2026-07-17
  - Acceptance and verification: `docs/v1.1-caseflow-books-roadmap.md`.
  - Evidence:
    - `caseflow-store/src/lib/auth/admin.ts`
    - `caseflow-store/src/types/supabase.ts`
    - `caseflow-store/src/lib/supabase/book-mappers.ts`
    - `caseflow-store/src/lib/validation/books.ts`
    - `caseflow-store/src/lib/api/admin-inventory.ts`
    - `caseflow-store/src/lib/repositories/supabase-books.ts`
    - `caseflow-store/src/app/api/admin/inventory/route.ts`
    - `caseflow-store/src/app/api/admin/inventory/adjustments/route.ts`
    - `caseflow-store/src/features/admin/admin-inventory-page.tsx`
    - `caseflow-store/src/app/admin/inventory/page.tsx`
    - `caseflow-store/scripts/verify-inventory-adjustments.ts`
    - `caseflow-store/.agent/artifacts/d36-t02/inventory-adjustments-check.json`
    - `caseflow-store/.agent/artifacts/d36-t02/inventory-adjustments-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-inventory-adjustments.ts`,
    screenshot dimension/no-overflow review, and `git diff --check`.

### Day 37 - Promotions, customers, and order operations

- [x] `D37-T01` Add Promotion Management. - 2026-07-17
  - Result: added admin-only promotion management, promotion APIs,
    checkout promotion-code submission, server-side promotion evaluation, and
    discounted order totals.
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d37-t01/promotion-management-check.json`
    - `caseflow-store/.agent/artifacts/d37-t01/admin-promotions-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-promotion-management.ts`,
    updated `npx tsx scripts/verify-admin-navigation.ts`, screenshot
    dimension/no-overflow review, and `git diff --check`.
- [x] `D37-T02` Add Customer Management. - 2026-07-17
  - Result: added read-only admin/staff customer search and detail view with
    profile readiness, masked contact state, address summary, and order metrics.
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d37-t02/admin-customers-check.json`
    - `caseflow-store/.agent/artifacts/d37-t02/admin-customers-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-admin-customers.ts`,
    screenshot dimension/no-overflow review, and `git diff --check`.
- [x] `D37-T03` Upgrade Order Operations. - 2026-07-17
  - Result: added server-backed order filters, admin/staff order operations
    update flow, payment/shipping status handling, internal notes, and
    server-side transition validation.
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-check.json`
    - `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-desktop-en.png`
  - Verification passed: migration check, `npm run lint`,
    `npx tsc --noEmit`, `npm run build`,
    `npx tsx scripts/verify-admin-order-operations.ts`, screenshot
    dimension/no-overflow review, and `git diff --check`.

### Day 38 - Business dashboard and operations freeze

- [x] `D38-T01` Add Sales And Inventory Dashboard. - 2026-07-17
  - Result: replaced the dashboard placeholder with server-backed sales,
    payment, order, top-book, recent-order, and inventory-risk metrics plus
    range filtering.
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`
    - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-empty-mobile-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-admin-dashboard.ts`, screenshot
    dimension/no-overflow review, and `git diff --check`.
- [x] `D38-T02` Add CSV Export For Orders Or Inventory. - 2026-07-17
  - Result: added a protected server-generated order CSV export and linked it
    from the admin dashboard date-range controls.
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d38-t02/admin-orders-csv-export-check.json`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, rerun `npx tsx scripts/verify-admin-dashboard.ts`,
    `npx tsx scripts/verify-admin-orders-csv-export.ts`, public catalog
    response check, and `git diff --check`.
- [x] `D38-T03` Accept Operations Freeze. - 2026-07-17
  - Result: accepted the operations freeze for admin/staff workflows,
    dashboard, CSV export, permissions, and cleanup expectations.
  - Artifacts:
    - `docs/v1.1-operations-freeze.md`
    - `caseflow-store/docs/v1.1-operations-freeze.md`
    - `caseflow-store/scripts/verify-operations-freeze.ts`
    - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-check.json`
    - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-staff-dashboard.png`
    - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-admin-settings.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npx tsx scripts/verify-operations-freeze.ts`, screenshot dimensions,
    `git diff --check`, and `npm run build`.
  - Freeze note: Operations freeze is active. New operations features now
    require explicit review except release-blocking fixes.

Day 38 result: complete. Operations freeze is active; continue with Day 39
assistant, SEO, accessibility, and performance work.

### Day 39 - Assistant, SEO, accessibility, and performance

- [x] `D39-T01` Add Rule-Based Bookstore Assistant. - 2026-07-17
  - Result: added a rule-based assistant widget that searches the public book
    catalog by title/query and filters, shows suggested messages, links to
    valid catalog/detail routes, and guides checkout without bypassing cart,
    account, or server validation.
  - Artifacts:
    - `caseflow-store/src/features/assistant/bookstore-assistant.tsx`
    - `caseflow-store/scripts/verify-bookstore-assistant.ts`
    - `caseflow-store/.agent/artifacts/d39-t01/bookstore-assistant-check.json`
    - `caseflow-store/.agent/artifacts/d39-t01/assistant-find-book-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d39-t01/assistant-no-result-mobile-en.png`
    - `caseflow-store/.agent/artifacts/d39-t01/assistant-checkout-guidance-desktop-en.png`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `npm run build`, `npx tsx scripts/verify-bookstore-assistant.ts`,
    screenshot review, screenshot dimensions, and `git diff --check`.
- [x] `D39-T02` Add SEO And Metadata For Bookstore. - 2026-07-17
  - Result: added bilingual page metadata, canonical URLs, robots and sitemap
    routes, noindex handling for private checkout/account surfaces, and
    book detail JSON-LD with VND offer data.
  - Artifacts:
    - `caseflow-store/src/lib/seo/metadata.ts`
    - `caseflow-store/src/app/robots.ts`
    - `caseflow-store/src/app/sitemap.ts`
    - `caseflow-store/scripts/verify-seo-metadata.ts`
    - `caseflow-store/.agent/artifacts/d39-t02/seo-metadata-check.json`
  - Verification passed: `npx tsc --noEmit`, `npm run lint`,
    `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`,
    `npx tsx scripts/verify-seo-metadata.ts`, and `git diff --check`.
- [x] `D39-T03` Run Accessibility, Mobile, And Performance Pass. - 2026-07-17
  - Result: added a focused accessibility/mobile/performance verification
    script, hid the assistant from checkout/account/admin form surfaces to
    prevent fixed-overlay overlap, and compacted the assistant toggle on
    mobile storefront pages.
  - Artifacts:
    - `caseflow-store/scripts/verify-accessibility-mobile-performance.ts`
    - `caseflow-store/.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`
    - `caseflow-store/.agent/artifacts/d39-t03/home-mobile-en.png`
    - `caseflow-store/.agent/artifacts/d39-t03/catalog-mobile-en.png`
    - `caseflow-store/.agent/artifacts/d39-t03/checkout-mobile-en.png`
    - `caseflow-store/.agent/artifacts/d39-t03/admin-orders-mobile-en.png`
  - Verification passed: `npx tsc --noEmit`, `npm run lint`,
    `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`,
    `npx tsx scripts/verify-bookstore-assistant.ts`,
    `npx tsx scripts/verify-accessibility-mobile-performance.ts`,
    screenshot visual review, screenshot dimensions, and `git diff --check`.

Day 39 result: complete. Assistant, SEO, accessibility, mobile, and catalog
performance checks are verified. Continue with Day 40 release gates.

### Day 40 - v1.1 release candidate and portfolio update

- [x] `D40-T01` Run Full Local Quality Gate. - 2026-07-17
  - Result: migrated the full Playwright suite from legacy phone-accessory and
    guest-checkout assumptions to CaseFlow Books, fixed tablet header overflow,
    verified cleanup, and documented the dependency audit.
  - Artifacts:
    - `caseflow-store/playwright-report/index.html`
    - `caseflow-store/.agent/artifacts/d40-t01/npm-audit.json`
    - `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
    - `docs/v1.1-release-audit.md`
    - `caseflow-store/docs/v1.1-release-audit.md`
  - Verification passed: `npm run lint`, `npx tsc --noEmit`,
    `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`,
    `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3006 npx playwright test`
    with `20 passed`, `npx tsx scripts/verify-release-cleanup.ts`, and
    `git diff --check`.
  - Audit note: `npm audit --audit-level=moderate` reports `0` high/critical
    and `2` moderate transitive Next/PostCSS findings. `npm audit fix --force`
    proposes a breaking downgrade to `next@9.3.3`, so the risk is documented
    instead of applying an unsafe fix.
- [x] `D40-T02` Deploy And Smoke Test v1.1. - 2026-07-17
  - Result: deployed CaseFlow Books `v1.1` to Vercel production and verified
    the canonical alias.
  - Deployment:
    - Production alias: `https://caseflow-store.vercel.app`
    - Deployment URL: `https://caseflow-store-7gf7ugxka-nvt-ruong473.vercel.app`
    - Deployment ID: `dpl_BkiJt9gDCh5d2cHwAhpFDbLotoAy`
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d40-t02/deployment.json`
    - `caseflow-store/.agent/artifacts/d40-t02/production-smoke-check.json`
    - `caseflow-store/.agent/artifacts/d40-t02/secret-scan.txt`
    - `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
  - Verification passed: Vercel production build generated 41 app routes,
    `npx tsx scripts/verify-production-smoke.ts`,
    `PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app npx playwright test tests/e2e/storefront-flow.spec.ts tests/e2e/admin-workflow.spec.ts tests/e2e/admin-access.spec.ts`
    with `5 passed`, production assistant smoke, post-smoke cleanup zero, and
    secret scan clean.
- [x] `D40-T03` Update Portfolio Documentation. - 2026-07-17
  - Result: updated README, app README, architecture, ADR index, known
    limitations, release-candidate notes, CV bullets, and stable docs
    screenshots for CaseFlow Books `v1.1`.
  - Result: documented simulated payments, non-real SMS/OTP and email
    verification, safe book metadata/summaries, placeholder cover strategy,
    release gates, and accepted dependency advisory.
  - Artifacts:
    - `caseflow-store/.agent/artifacts/d40-t03/portfolio-documentation-check.json`
    - `caseflow-store/docs/screenshots/storefront-desktop.png`
    - `caseflow-store/docs/screenshots/storefront-mobile.png`
    - `caseflow-store/docs/screenshots/catalog-desktop.png`
    - `caseflow-store/docs/screenshots/catalog-mobile.png`
    - `caseflow-store/docs/screenshots/product-desktop.png`
    - `caseflow-store/docs/screenshots/product-mobile.png`
    - `caseflow-store/docs/screenshots/checkout-mobile.png`
    - `caseflow-store/docs/screenshots/admin-dashboard-desktop.png`
    - `caseflow-store/docs/screenshots/admin-orders-mobile.png`
  - Verification passed: `npx tsx scripts/verify-portfolio-documentation.ts`,
    `npx tsc --noEmit`, `npm run lint`, `git diff --check`, and visual review
    of representative storefront, checkout, and admin screenshots.
- [x] `D40-T04` Tag v1.1.0 Only If Release Gates Pass. - 2026-07-17
  - Result: all Day 40 gates passed and the release tree is accepted for the
    annotated `v1.1.0` tag.
  - Result: known non-blockers are documented, including simulated payments,
    non-real SMS/OTP/email verification, configurable VAT/FX/fee assumptions,
    safe placeholder cover assets, no commercial metadata feed, and the
    moderate transitive Next/PostCSS advisory.
  - Tag target:
    - `v1.1.0`
  - Verification passed before tag: D40-T01 local gate, D40-T02 production
    deploy/smoke, D40-T03 portfolio documentation verification, `npx tsc
    --noEmit`, `npm run lint`, and `git diff --check`.

## Phase 8 - CaseFlow Books v1.2 Content And Merchandising Planning

This is a post-release versioned upgrade, not Day 41+ and not an extension of
the 20-day implementation history. The provenance and pilot-cover gates are
accepted; the next task is full 100-cover portfolio production.

- [x] `V12-T01` Create v1.2 Content And Merchandising ADR. - 2026-07-17
  - Result: accepted `ADR-0007: Realistic Bookstore Content And Merchandising
    Upgrade For v1.2` in root/app mirrors.
  - Result: bounded v1.2 around the released 100-edition catalog, provenance,
    defensible cover assets, truthful merchandising, and focused storefront and
    admin presentation improvements.
  - Result: rejected copied commercial covers/descriptions, fabricated
    ISBN/ratings/sold counts/rankings, direct runtime metadata imports, and
    unrelated review/wishlist/AI/e-book scope.
  - Verification passed: ADR mirrors and index mirrors match, required
    guardrails are present, the ADR index links ADR-0007, and
    `git diff --check` passes.
- [x] `V12-T02` Create v1.2 Content And Merchandising Roadmap. - 2026-07-17
  - Result: accepted
    `docs/v1.2-realistic-bookstore-content-merchandising-roadmap.md` in
    root/app mirrors.
  - Result: defined unique tasks `V12-T01` through `V12-T18` with explicit
    prerequisites, acceptance criteria, verification, evidence, release gates,
    and rollback strategy.
  - Result: set provenance, content, data, experience, local release-candidate,
    and production release gates without creating Day 41+ history.
  - Verification passed: roadmap mirrors match, ADR/local links resolve, 18
    unique task IDs each have acceptance and verification sections, trailing
    whitespace check passes, and `git diff --check` passes.
- [x] `V12-T03` Audit v1.1 Catalog Realism Baseline. - 2026-07-17
  - Result: the committed seed and Supabase read path match exactly at 50
    active works, 100 active editions, 11 active categories, 50 English
    editions, and 50 Vietnamese editions; no audit/test/QA rows remain.
  - Result: identified 7 v1.2 release blockers: one shared primary placeholder,
    demo/missing edition facts, weak Vietnamese localization, missing
    provenance/merchandising contracts, generic storefront values, absent
    translator records, and 195px admin-catalog mobile overflow.
  - Result: accepted `additive-schema-required`; no destructive migration is
    justified and no database/runtime behavior was changed.
  - Evidence: `docs/v1.2-catalog-realism-baseline.md` and
    `caseflow-store/.agent/artifacts/v12-t03/` with read-only JSON/Markdown
    reports plus full-page and first-viewport screenshots.
  - Verification passed: Supabase read-only audit and seed parity, production
    build with 41 routes, 8 page/breakpoint browser baselines, zero QA rows,
    `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
- [x] `V12-T04` Define Provenance And Content Quality Contracts. - 2026-07-17
  - Result: added catalog-specific TypeScript/Zod contracts for source,
    checked date, content kind, rights basis, license, attribution, review,
    internal reviewer note, and edition-match confidence without changing the
    legacy v1.1 `SourceNote` contract.
  - Result: added edition fact bundles that reject duplicate fields, wrong
    targets, and facts mixed across source-edition keys.
  - Result: added blocking/optional content-quality assessment where only
    verified evidence with a provenance record receives credit.
  - Result: added an approved-only public provenance serializer and proved that
    internal review notes and matching keys are not exposed by either the new
    serializer or the existing public catalog serializer.
  - Result: confirmed an additive database migration is required, but deferred
    SQL shape to `V12-T10` after content and merchandising fields are frozen.
  - Evidence: `docs/v1.2-provenance-content-quality-contracts.md` and
    `caseflow-store/.agent/artifacts/v12-t04/provenance-content-quality-check.json`.
  - Verification passed: 21 focused contract/serialization assertions,
    `npx tsc --noEmit`, `npm run lint`, `npm run build`, mirror checks, and
    `git diff --check`.
- [x] `V12-T05` Curate The Canonical 100-Edition Catalog Manifest. - 2026-07-17
  - Result: froze 50 real-book works and exactly 100 sellable editions as 50
    reciprocal English/Vietnamese pairs with project-written bilingual copy.
  - Result: retained 98 existing edition IDs/slugs and replaced the unsupported
    `The Elements of Style` pair with new-ID editions of `The Old Man and the
    Sea` / `Ông già và biển cả`; the retired work and editions use explicit
    no-redirect compatibility records.
  - Result: separated same-edition bibliographic facts and field provenance
    from CaseFlow-owned price, stock, promotion, availability, and planned SKU
    format decisions; unsupported optional facts remain null.
  - Evidence: `src/data/books/v1.2-canonical-manifest.json`,
    `docs/v1.2-canonical-catalog-manifest.md`, and
    `caseflow-store/.agent/artifacts/v12-t05/canonical-manifest-check.{json,md}`.
  - Verification passed: deterministic manifest SHA-256 across two builds,
    100/100 source reviews, 74 ISBN-13 values, zero identifier/pair/provenance/
    content/compatibility issues, provenance contract regression, TypeScript,
    ESLint, and `git diff --check`.
- [x] `V12-T06` Build The Edition-Specific Cover Asset Pipeline. - 2026-07-17
  - Result: added cover pipeline TypeScript contracts and Zod validation for
    project-created media assets, dimensions, checksum, size budget, contrast,
    deterministic typography, bilingual alt text, approved provenance, and
    commercial-cover-reference rejection.
  - Result: added deterministic SVG pilot builder and verifier scripts.
  - Result: produced a 10-cover pilot covering five English/Vietnamese pairs,
    five visual concepts, long titles, light/dark artwork, and card/detail
    preview sizes without copying commercial cover layouts or external images.
  - Evidence:
    - `caseflow-store/src/types/cover-assets.ts`
    - `caseflow-store/src/lib/validation/cover-assets.ts`
    - `caseflow-store/scripts/build-v12-cover-pilot.ts`
    - `caseflow-store/scripts/verify-v12-cover-pipeline.ts`
    - `caseflow-store/src/data/books/v1.2-cover-pilot-manifest.json`
    - `caseflow-store/public/images/books/v12-pilot/`
    - `docs/v1.2-cover-asset-pipeline.md`
    - `caseflow-store/.agent/artifacts/v12-t06/cover-pipeline-check.json`
    - `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-contact-sheet.svg`
    - `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-preview-desktop.png`
    - `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-preview-mobile.png`
  - Verification passed: `npx tsx scripts/build-v12-cover-pilot.ts`,
    `npx tsx scripts/verify-v12-cover-pipeline.ts`, visual review of
    desktop/mobile preview screenshots, `npx tsc --noEmit`, `npm run lint`,
    `npm run build`, root/app mirror checks, and `git diff --check`.
- [x] `V12-T07` Produce And Review The 100-Cover Portfolio. - 2026-07-17
  - Result: expanded the accepted cover pipeline into a complete 100-cover
    project-created SVG portfolio for the canonical v1.2 catalog.
  - Result: every canonical edition has one approved portfolio asset with
    deterministic localized title text, author text, language marker, checksum,
    dimensions, contrast data, bilingual alt text, and approved project-created
    media provenance.
  - Result: the portfolio manifest has 50 English covers, 50 Vietnamese covers,
    50 paired visual families, 50 concept keys, zero duplicate hashes, and zero
    placeholder primary references.
  - Evidence:
    - `caseflow-store/scripts/build-v12-cover-portfolio.ts`
    - `caseflow-store/scripts/verify-v12-cover-portfolio.ts`
    - `caseflow-store/src/data/books/v1.2-cover-portfolio-manifest.json`
    - `caseflow-store/public/images/books/v12-covers/`
    - `docs/v1.2-cover-portfolio.md`
    - `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-check.json`
    - `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-all.svg`
    - `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-en.svg`
    - `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-vi.svg`
    - `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-preview-desktop.png`
    - `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-preview-mobile.png`
  - Verification passed: `npx tsx scripts/build-v12-cover-portfolio.ts`,
    `npx tsx scripts/verify-v12-cover-portfolio.ts`, contact sheet visual
    review, desktop/mobile preview visual review, T06 pipeline regression,
    `npx tsc --noEmit`, `npm run lint`, `npm run build`, mirror checks, and
    `git diff --check`.
- [x] `V12-T08` Complete Bilingual Metadata And Editorial Copy. - 2026-07-17
  - Result: added editorial metadata contracts, validation, builder, and
    verifier for display-safe public edition content.
  - Result: produced `v1.2-editorial-metadata-manifest.json` by joining the
    canonical catalog and 100-cover portfolio into 100 records with bilingual
    titles, summaries, reason-to-read notes, cover alt text, display facts,
    omitted optional fact keys, and content-quality evidence.
  - Result: the verifier reports 100 editions, 334 display facts, 100
    release-ready editions, and 0 prohibited public-copy findings.
  - Evidence:
    - `caseflow-store/src/types/editorial-metadata.ts`
    - `caseflow-store/src/lib/validation/editorial-metadata.ts`
    - `caseflow-store/scripts/build-v12-editorial-metadata.ts`
    - `caseflow-store/scripts/verify-v12-editorial-metadata.ts`
    - `caseflow-store/src/data/books/v1.2-editorial-metadata-manifest.json`
    - `docs/v1.2-editorial-metadata.md`
    - `caseflow-store/.agent/artifacts/v12-t08/editorial-metadata-check.json`
  - Verification passed: `npx tsx scripts/build-v12-editorial-metadata.ts`,
    `npx tsx scripts/verify-v12-editorial-metadata.ts`, `npx tsc --noEmit`,
    `npm run lint`, `npm run build`, mirror checks, and `git diff --check`.
- [x] `V12-T09` Define Merchandising Rules And Minimal Storage. - 2026-07-17
  - Result: added merchandising TypeScript contracts, Zod validation, a pure
    shelf resolver, deterministic rules builder, and verifier.
  - Result: produced `v1.2-merchandising-rules-manifest.json` with 9 shelves,
    8 active shelves, 1 inactive order-derived shelf, explicit editorial versus
    order-derived source kinds, localized labels, date windows, fallback
    behavior, and `merchandising:manage` mutation permission.
  - Result: documented the smallest additive storage contract for
    `book_merchandising_shelves` and `book_merchandising_shelf_items` without
    applying production SQL in this task.
  - Evidence:
    - `caseflow-store/src/types/merchandising.ts`
    - `caseflow-store/src/lib/validation/merchandising.ts`
    - `caseflow-store/src/lib/merchandising/shelves.ts`
    - `caseflow-store/scripts/build-v12-merchandising-rules.ts`
    - `caseflow-store/scripts/verify-v12-merchandising-rules.ts`
    - `caseflow-store/src/data/books/v1.2-merchandising-rules-manifest.json`
    - `docs/v1.2-merchandising-rules-storage.md`
    - `caseflow-store/.agent/artifacts/v12-t09/merchandising-rules-check.json`
  - Verification passed: `npx tsx scripts/verify-v12-merchandising-rules.ts`,
    `npx tsc --noEmit`, `npm run lint`, `npm run build`, mirror checks, and
    `git diff --check`.
- [x] `V12-T10` Build A Reversible v1.2 Catalog Migration. - 2026-07-17
  - Result: added additive migration SQL for v1.2 edition metadata,
    provenance, content quality, compatibility, and merchandising storage.
  - Result: added deterministic migration planner and verifier with manifest
    checksum snapshot, 100-cover asset manifest, count-only live Supabase
    pre-migration evidence, private backup ignore path, SQL inspection, and
    rollback evidence.
  - Result: dry-run plans 1 new work and 2 new editions for `The Old Man and
    the Sea`, preserves 49 works and 98 editions, deactivates 1 work and 2
    editions for `The Elements of Style`, and plans zero deletes.
  - Result: corrected migration-source hygiene before import by omitting
    non-Bookland `893...` codes from ISBN fields and replacing/normalizing
    malformed publisher display values.
  - Evidence:
    - `caseflow-store/supabase/migrations/0008_v12_catalog_merchandising.sql`
    - `caseflow-store/scripts/plan-v12-catalog-migration.ts`
    - `caseflow-store/scripts/verify-v12-catalog-migration-plan.ts`
    - `docs/v1.2-catalog-migration-rollback-plan.md`
    - `caseflow-store/.agent/artifacts/v12-t10/v12-catalog-migration-plan.json`
    - `caseflow-store/.agent/artifacts/v12-t10/v12-catalog-migration-check.json`
    - `caseflow-store/.agent/artifacts/v12-t10/pre-migration-counts-live.json`
  - Verification passed: canonical rebuild/check, editorial rebuild/check,
    merchandising rebuild/check, migration planner with live count capture,
    migration verifier, supplemental publisher/ISBN checks, `npx tsc --noEmit`,
    `npm run lint`, `npm run build`, mirror checks, and
    `git diff --check`.
- [x] `V12-T11` Apply And Verify The v1.2 Catalog In Supabase. - 2026-07-18
  - Result: created a private pre-migration production export and public backup
    manifest without exposing row data.
  - Result: applied additive migration
    `caseflow-store/supabase/migrations/0008_v12_catalog_merchandising.sql`
    to Supabase production through a direct `pg` SQL client after the Supabase
    CLI and `pg_dump`/Docker route were unavailable.
  - Result: applied the deterministic v1.2 catalog upsert twice successfully,
    proving idempotent counts with 50 active works, 100 active editions, 50
    English editions, 50 Vietnamese editions, and 0 active primary placeholder
    covers.
  - Result: Supabase now contains 100 v1.2 cover assets, 602 provenance
    records, 2,000 content-quality checks, 3 compatibility records, 9
    merchandising shelves, and 20 manual shelf items.
  - Result: `The Elements of Style` work and two editions are inactive, while
    historical orders, profiles, phone products, promotions, and inventory
    adjustment counts are preserved.
  - Result: updated `src/types/supabase.ts` for v1.2 edition columns and new
    provenance/content-quality/merchandising tables.
  - Evidence:
    - `caseflow-store/scripts/backup-v12-pre-migration.ts`
    - `caseflow-store/scripts/apply-v12-catalog-data.ts`
    - `caseflow-store/scripts/verify-v12-supabase-import.ts`
    - `caseflow-store/.agent/artifacts/v12-t11/pre-migration-backup-manifest.json`
    - `caseflow-store/.agent/artifacts/v12-t11/schema-apply.json`
    - `caseflow-store/.agent/artifacts/v12-t11/catalog-upsert-apply.json`
    - `caseflow-store/.agent/artifacts/v12-t11/post-migration-supabase-check.json`
    - `caseflow-store/.agent/artifacts/v12-t11/post-migration-db-inspection.json`
    - `caseflow-store/.agent/artifacts/v12-t11/local-api-smoke.json`
  - Verification passed: migration-plan verifier, pre-migration backup,
    schema apply, catalog upsert apply, idempotent rerun, Supabase import
    verifier, SQL DB inspection, repository smoke, local public/detail/admin
    API smoke, and `npx tsc --noEmit`.
- [x] `V12-T12` Upgrade Homepage Merchandising. - 2026-07-18
  - Result: homepage now reads public active Supabase merchandising shelves and
    renders editor picks, weekend starter set, Vietnamese editions, English
    editions, promotion-ready editions, and paired English/Vietnamese edition
    groups without UI-local hard-coded shelf order.
  - Result: hero now uses one clear browse action, three above-the-fold real
    v1.2 covers, eager hero image loading, stable first-viewport layout at
    375px/tablet/1440px, and category-band visibility in the first viewport.
  - Result: fixed paired-edition resolution so shelf limits keep complete
    English/Vietnamese work pairs.
  - Evidence:
    - `caseflow-store/src/app/page.tsx`
    - `caseflow-store/src/lib/repositories/supabase-merchandising.ts`
    - `caseflow-store/src/lib/merchandising/shelves.ts`
    - `caseflow-store/scripts/verify-v12-homepage-merchandising.ts`
    - `caseflow-store/scripts/verify-v12-homepage-ui.ts`
    - `caseflow-store/.agent/artifacts/v12-t12/homepage-merchandising-check.json`
    - `caseflow-store/.agent/artifacts/v12-t12/homepage-ui-check.json`
    - `caseflow-store/.agent/artifacts/v12-t12/home-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v12-t12/home-tablet-en.png`
    - `caseflow-store/.agent/artifacts/v12-t12/home-desktop-en.png`
  - Verification passed: homepage merchandising data verifier, merchandising
    rules verifier, homepage UI Playwright verifier, `npx tsc --noEmit`,
    `npm run lint`, `npm run build`, and `git diff --check`.
- [x] `V12-T13` Upgrade Catalog Cards And Discovery Results. - 2026-07-18
  - Result: `/catalog` now reads public active Supabase merchandising shelves
    and builds per-edition labels for editor picks, paired editions, real
    compare-at offers, and stock status.
  - Result: catalog cards are compact on mobile and cover-led on
    tablet/desktop, with title, author, category, language, format, current VND
    price, optional compare-at price, stock, editorial, pair, and detail entry
    visible without fake ratings/sold counts/urgency.
  - Result: the old `featured=true` filter keeps its URL/backend behavior but
    is now labeled as curation/editor picks rather than promotion.
  - Result: result signal badges distinguish sort, availability, visible offer
    labels, and shelf-backed editorial labels.
  - Evidence:
    - `caseflow-store/src/app/catalog/page.tsx`
    - `caseflow-store/scripts/verify-catalog-page.ts`
    - `caseflow-store/scripts/verify-catalog-filters.ts`
    - `caseflow-store/scripts/verify-v12-catalog-discovery.ts`
    - `caseflow-store/.agent/artifacts/v12-t13/catalog-discovery-check.json`
    - `caseflow-store/.agent/artifacts/v12-t13/catalog-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v12-t13/catalog-mobile-vi-page-2.png`
    - `caseflow-store/.agent/artifacts/v12-t13/catalog-filtered-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v12-t13/catalog-long-title-mobile-en.png`
  - Verification passed: catalog page verifier, catalog filters verifier,
    catalog states verifier, V12 catalog discovery verifier,
    `npx tsc --noEmit`, `npm run lint`, `npm run build`, and
    `git diff --check`.
- [x] `V12-T14` Upgrade Book Detail And Edition Comparison. - 2026-07-18
  - Result: product detail now maps v1.2 pair, reason-to-read, display-fact,
    omitted-fact, source-edition, and source-review fields through the public
    domain/API layer.
  - Result: `/products/[slug]` now has a cover-led but purchase-focused detail
    hierarchy, compact mobile add-to-cart controls, English/Vietnamese edition
    comparison, source-reviewed facts only, reason-to-read copy, work context,
    more-by-author and related-book groups, and preserved buying-confidence
    copy without fake ratings/sold counts/urgency.
  - Evidence:
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/src/features/books/book-edition-purchase-controls.tsx`
    - `caseflow-store/src/types/domain.ts`
    - `caseflow-store/src/lib/validation/domain.ts`
    - `caseflow-store/src/lib/supabase/book-mappers.ts`
    - `caseflow-store/src/lib/api/book-catalog.ts`
    - `caseflow-store/scripts/verify-book-detail-page.ts`
    - `caseflow-store/scripts/verify-seo-metadata.ts`
    - `caseflow-store/scripts/verify-v12-book-detail-edition-comparison.ts`
    - `caseflow-store/.agent/artifacts/v12-t14/book-detail-edition-comparison-check.json`
    - `caseflow-store/.agent/artifacts/v12-t14/detail-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v12-t14/detail-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v12-t14/detail-missing-facts-mobile-vi.png`
  - Verification passed: V12 detail/edition comparison verifier, book detail
    verifier, book confidence verifier, book cart verifier, SEO metadata
    verifier with local expected origin, `npx tsc --noEmit`, `npm run lint`,
    `npm run build`, and `git diff --check`.
- [x] `V12-T15` Add Admin Content Quality And Merchandising Operations. - 2026-07-18
  - Result: admin runtime permissions now include `merchandising:manage` for
    admin/staff, and `/admin/catalog` displays server-enriched content quality,
    source review, cover status, active state, language, and shelf membership
    signals.
  - Result: admin/staff can filter catalog operations by completeness, source
    review, cover status, language, active state, and shelf membership.
  - Result: allowed content fixes include bilingual reason-to-read through the
    existing validated catalog APIs; protected source fields are admin-only and
    cannot be moved to `approved` without source key, approved display-fact
    provenance, and verified source/content quality checks.
  - Result: added protected merchandising shelf API for approved shelf active
    state and sort-order operations, plus a dense responsive admin panel with
    success/error/loading/empty states.
  - Evidence:
    - `caseflow-store/src/features/admin/admin-catalog-page.tsx`
    - `caseflow-store/src/app/admin/catalog/page.tsx`
    - `caseflow-store/src/app/api/admin/books/editions/route.ts`
    - `caseflow-store/src/app/api/admin/books/editions/[id]/route.ts`
    - `caseflow-store/src/app/api/admin/merchandising/shelves/route.ts`
    - `caseflow-store/src/lib/api/admin-book-catalog.ts`
    - `caseflow-store/src/lib/api/admin-merchandising.ts`
    - `caseflow-store/src/lib/auth/admin.ts`
    - `caseflow-store/src/lib/repositories/supabase-books.ts`
    - `caseflow-store/src/lib/repositories/supabase-content-operations.ts`
    - `caseflow-store/src/lib/repositories/supabase-merchandising.ts`
    - `caseflow-store/src/lib/validation/books.ts`
    - `caseflow-store/src/lib/validation/merchandising.ts`
    - `caseflow-store/scripts/verify-v12-admin-content-operations.ts`
    - `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-check.json`
    - `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-mobile-vi.png`
  - Verification passed: V12 admin content operations verifier, `npx tsc
    --noEmit`, `npm run lint`, and `npm run build`.
- [x] `V12-T16` Integrate Catalog Content Across Search, Assistant, SEO, And
  Docs. - 2026-07-18
  - Result: public catalog/API serialization no longer exposes
    `sourceEditionKey` or `sourceReviewStatus`; admin serializers still retain
    protected source-review operations.
  - Result: public product detail no longer renders source-review status as a
    customer-facing badge, while verified display facts remain visible.
  - Result: search now indexes v1.2 reason-to-read, display facts, ISBN,
    publisher, translator, language, and format terms, with accent-insensitive
    token fallback for natural queries such as title + language + format.
  - Result: product social metadata and JSON-LD include the accepted local v1.2
    cover asset and localized description without source-review leakage.
  - Result: cart validation, customer order snapshots, and admin CSV exports
    use v1.2 book snapshot fields; CSV exports now include item language,
    format, and item summary while still excluding customer PII/internal notes.
  - Result: retired v1.1 public slugs return safe 404 recovery to catalog, and
    historical legacy order item snapshots still map through fallback fields.
  - Result: architecture, cover portfolio, known limitations, and project
    context docs no longer claim the v1.2 catalog is placeholder-only or not
    imported.
  - Evidence:
    - `caseflow-store/src/lib/api/book-catalog.ts`
    - `caseflow-store/src/lib/repositories/supabase-books.ts`
    - `caseflow-store/src/lib/repositories/supabase-order-exports.ts`
    - `caseflow-store/src/lib/seo/metadata.ts`
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/src/app/products/[slug]/not-found.tsx`
    - `caseflow-store/scripts/verify-v12-catalog-runtime-integration.ts`
    - `caseflow-store/.agent/artifacts/v12-t16/catalog-runtime-integration-check.json`
    - `caseflow-store/.agent/artifacts/v12-t16/assistant-result-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v12-t16/checkout-gate-mobile-en.png`
    - `caseflow-store/.agent/artifacts/v12-t16/seo-detail-desktop-en.png`
  - Verification passed: V12 catalog runtime integration verifier on a fresh
    production build at `http://127.0.0.1:3001`, `npm run lint`,
    `npx tsc --noEmit --pretty false`, `npm run build`, and
    `git diff --check`.
- [x] `V12-T17` Run The Full v1.2 Local Quality Gate. - 2026-07-18
  - Result: fresh production build passed with 42 App Router routes plus proxy,
    then `next start` served the release candidate locally at
    `http://127.0.0.1:3001` for runtime verification.
  - Result: full Playwright suite passed `20/20` on the production-style local
    server after stabilizing screenshot capture and auth helpers for the v1.2
    runtime.
  - Result: aggregate local quality gate passed with static V12 reports,
    mobile performance baseline, high/critical dependency audit, documented
    moderate dependency risk, secret scan, and cleanup evidence.
  - Result: Lighthouse CLI package installation/version check did not complete
    in this environment, so the accepted fallback baseline used 3-run
    Playwright mobile medians for home, catalog, and detail pages.
  - Evidence:
    - `caseflow-store/scripts/verify-v12-local-quality-gate.ts`
    - `caseflow-store/.agent/artifacts/v12-t17/local-quality-gate-check.json`
    - `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
  - Verification passed: `npx tsc --noEmit --pretty false`, `npm run lint`,
    `npm run build`, full Playwright `20/20`, `node
    scripts/verify-v12-local-quality-gate.ts`, release cleanup verifier, and
    `git diff --check`.
- [x] `V12-T18` Deploy, Smoke Test, Document, And Tag v1.2.0. - 2026-07-18
  - Result: deployed the accepted v1.2 release to Vercel production and aliased
    deployment `dpl_7Y2Qsf4VJRBuzaMGXZMi81Rq5pKQ` to
    `https://caseflow-store.vercel.app`.
  - Result: added production release verification that checks public pages/APIs,
    canonical alias, robots, sitemap, language mode, cart/checkout account
    boundary, customer boundary, admin boundary, assistant behavior, catalog
    quality, and representative detail pages.
  - Result: production catalog quality passed with 100 active editions, 100
    cover responses, 50 English editions, 50 Vietnamese editions, 100 content
    metadata records, zero active primary placeholder covers, zero broken cover
    responses, and zero public source-review leakage.
  - Result: refreshed release documentation, screenshots, architecture notes,
    known limitations, release candidate notes, CV evidence, and release audit
    for `v1.2.0`.
  - Result: created a release commit and annotated `v1.2.0` tag.
  - Evidence:
    - `caseflow-store/scripts/verify-v12-production-release.ts`
    - `caseflow-store/.agent/artifacts/v12-t18/deployment.json`
    - `caseflow-store/.agent/artifacts/v12-t18/vercel-inspect.json`
    - `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json`
    - `caseflow-store/.agent/artifacts/v12-t18/production-playwright-summary.json`
    - `caseflow-store/docs/v1.2-release-audit.md`
    - `docs/v1.2-release-audit.md`
  - Verification passed: production Vercel deploy, V12 production release
    smoke `ok: true`, full production Playwright `20/20`, release cleanup
    `totalMatches: 0`, `npx tsc --noEmit --pretty false`, `npm run lint`,
    `npm run build`, high/critical dependency audit, secret scan, stale-doc
    checks, `git diff --check`, clean release commit, and annotated
    `v1.2.0` tag verification.

## v1.3 Visual Merchandising And Brand Polish

- [x] `V13-T01` Create Visual Merchandising ADR And Roadmap. - 2026-07-18
  - Result: accepted ADR-0008 and v1.3 roadmap for bounded visual
    merchandising and brand polish.
  - Result: clarified that v1.3 may improve tokens, cover-led composition,
    hierarchy, and visual QA, but cannot add new payment, shipping,
    database, external-service, commercial-cover, fake-review, or marketplace
    scope.
  - Evidence:
    - `docs/adr/0008-visual-merchandising-brand-polish.md`
    - `caseflow-store/docs/adr/0008-visual-merchandising-brand-polish.md`
    - `docs/v1.3-visual-merchandising-brand-polish-roadmap.md`
    - `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-roadmap.md`
  - Verification passed: mirror comparisons, ADR/reference search, and
    `git diff --check`.
- [x] `V13-T02` Run Hallmark-Informed Visual Audit Baseline. - 2026-07-18
  - Result: captured baseline screenshots for homepage, catalog, book detail,
    checkout/account boundary, admin dashboard, and admin catalog at 375px and
    1440px.
  - Result: recorded a ranked Hallmark-informed punch list mapping visual
    issues to `V13-T03` through `V13-T09`.
  - Result: confirmed zero horizontal overflow on all audited surfaces.
  - Evidence:
    - `caseflow-store/scripts/verify-v13-visual-audit.ts`
    - `caseflow-store/.agent/artifacts/v13-t02/visual-audit-baseline.json`
    - `caseflow-store/.agent/artifacts/v13-t02/visual-audit-baseline.md`
    - `caseflow-store/.agent/artifacts/v13-t02/*.png`
  - Verification passed: `npx tsx scripts/verify-v13-visual-audit.ts`,
    artifact inspection, no UI runtime file changes, and `git diff --check`.
- [x] `V13-T03` Expand Bookstore Design Tokens. - 2026-07-18
  - Result: expanded the design system from the MVP blue/slate palette into
    paper/ink, moss/teal discovery, wine editorial, amber offer, and admin
    trust tokens.
  - Result: mapped the new palette into Tailwind theme aliases while preserving
    primary/success/warning/error semantics.
  - Evidence:
    - `DESIGN.md`
    - `caseflow-store/DESIGN.md`
    - `caseflow-store/src/app/globals.css`
    - `caseflow-store/scripts/verify-v13-design-tokens.ts`
    - `caseflow-store/.agent/artifacts/v13-t03/design-token-check.json`
  - Verification passed: `npx tsx scripts/verify-v13-design-tokens.ts`,
    `npx tsc --noEmit --pretty false`, `npm run lint`, and
    `git diff --check`.
- [x] `V13-T04` Build Cover-Led Merchandising Components. - 2026-07-18
  - Result: added reusable book cover frame, stack, shelf, and display helpers
    for later page-level integration.
  - Result: enforced local `/images/books/` cover paths and stable `2/3`
    cover aspect ratios.
  - Evidence:
    - `caseflow-store/src/features/books/cover-merchandising.tsx`
    - `caseflow-store/scripts/verify-v13-cover-merchandising.ts`
    - `caseflow-store/.agent/artifacts/v13-t04/cover-merchandising-check.json`
  - Verification passed: `npx tsx scripts/verify-v13-cover-merchandising.ts`,
    `npx tsc --noEmit --pretty false`, `npm run lint`, and
    `git diff --check`.
- [x] `V13-T05` Upgrade Homepage Visual Merchandising. - 2026-07-18
  - Result: upgraded the homepage hero with the V13 bookstore palette,
    desktop cover stack, and reusable cover frames across homepage product
    cards.
  - Result: preserved homepage counts, product links, language switching,
    cart entry, and merchandising rule-driven shelves.
  - Evidence:
    - `caseflow-store/src/app/page.tsx`
    - `caseflow-store/scripts/verify-v13-homepage-visual-merchandising.ts`
    - `caseflow-store/.agent/artifacts/v13-t05/homepage-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t05/home-v13-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v13-t05/home-v13-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v12-t12/homepage-ui-check.json`
    - `caseflow-store/.agent/artifacts/d27-t01/homepage-sections-check.json`
  - Verification passed: V13 homepage visual verifier, V12 homepage UI
    verifier, homepage sections verifier, `npx tsc --noEmit --pretty false`,
    `npm run lint`, and `git diff --check`.
- [x] `V13-T06` Polish Catalog Cards And Discovery. - 2026-07-18
  - Result: upgraded catalog card covers to the shared V13 cover frame and
    applied discovery/editorial/offer token accents to catalog summary and
    filter surfaces.
  - Result: preserved 24-card pagination, filter/sort URL behavior, product
    links, result signals, and V12 catalog discovery behavior.
  - Evidence:
    - `caseflow-store/src/app/catalog/page.tsx`
    - `caseflow-store/scripts/verify-v13-catalog-visual-merchandising.ts`
    - `caseflow-store/scripts/verify-v12-catalog-discovery.ts`
    - `caseflow-store/.agent/artifacts/v13-t06/catalog-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t06/catalog-v13-mobile-vi-page-2.png`
    - `caseflow-store/.agent/artifacts/v13-t06/catalog-v13-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d28-t01/catalog-page-check.json`
    - `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-check.json`
    - `caseflow-store/.agent/artifacts/v12-t13/catalog-discovery-check.json`
  - Verification passed: V13 catalog visual verifier, catalog page verifier,
    catalog filters verifier, V12 catalog discovery verifier,
    `npx tsc --noEmit --pretty false`, `npm run lint`, and `git diff --check`.
- [x] `V13-T07` Polish Book Detail Visual Hierarchy. - 2026-07-18
  - Result: upgraded detail cover, edition comparison, recommendations, price,
    reason, facts, and confidence sections with shared cover frames and V13
    token accents.
  - Result: preserved add-to-cart behavior, cart payloads, edition comparison
    links, SEO structured data, no unsupported claims, and no overflow.
  - Evidence:
    - `caseflow-store/src/app/products/[slug]/page.tsx`
    - `caseflow-store/scripts/verify-v13-book-detail-visual-hierarchy.ts`
    - `caseflow-store/.agent/artifacts/v13-t07/book-detail-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t07/book-detail-v13-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v13-t07/book-detail-v13-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d29-t01/book-detail-check.json`
    - `caseflow-store/.agent/artifacts/v12-t14/book-detail-edition-comparison-check.json`
  - Verification passed: V13 detail visual verifier, book detail verifier,
    V12 edition comparison verifier, `npx tsc --noEmit --pretty false`,
    `npm run lint`, and `git diff --check`.
- [x] `V13-T08` Polish Admin Operations Visual System. - 2026-07-18
  - Result: applied the V13 admin trust palette to the admin shell,
    operations navigation, dashboard panels, catalog list/form, quality
    signals, and merchandising operations without changing permissions or API
    contracts.
  - Result: fixed a real staff catalog update regression where source-review
    defaults were treated as explicit source-review changes even when PATCH
    bodies only changed operational fields.
  - Result: hardened admin dashboard/catalog verification login flows against
    flaky form submission by using the app's own session APIs.
  - Evidence:
    - `caseflow-store/src/features/admin/admin-shell-page.tsx`
    - `caseflow-store/src/features/admin/admin-navigation.tsx`
    - `caseflow-store/src/features/admin/admin-dashboard-page.tsx`
    - `caseflow-store/src/features/admin/admin-catalog-page.tsx`
    - `caseflow-store/src/app/api/admin/books/editions/[id]/route.ts`
    - `caseflow-store/scripts/verify-v13-admin-visual-system.ts`
    - `caseflow-store/.agent/artifacts/v13-t08/admin-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t08/admin-dashboard-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v13-t08/admin-dashboard-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v13-t08/admin-catalog-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v13-t08/admin-catalog-desktop-en.png`
    - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`
    - `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-check.json`
  - Verification passed: V13 admin visual verifier, admin dashboard verifier,
    admin book catalog verifier, `npx tsc --noEmit --pretty false`,
    `npm run lint`, `git diff --check`, and desktop screenshot inspection.
- [x] `V13-T09` Run Full Visual QA And Documentation Gate. - 2026-07-18
  - Result: refreshed V13 audit and focused screenshots after final homepage
    cover-loading polish.
  - Result: added mirrored v1.3 release notes for the local QA gate and
    deferred production deployment/tagging to explicit user approval in
    `V13-T10`.
  - Result: completed affected homepage, catalog, detail, and admin
    regressions after verifier hardening for lazy images and duplicate dev
    nodes.
  - Evidence:
    - `docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
    - `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
    - `caseflow-store/.agent/artifacts/v13-t02/visual-audit-baseline.json`
    - `caseflow-store/.agent/artifacts/v13-t05/homepage-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t06/catalog-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t07/book-detail-visual-check.json`
    - `caseflow-store/.agent/artifacts/v13-t08/admin-visual-check.json`
    - `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
  - Verification passed: V13 audit, design token verifier, cover component
    verifier, homepage visual verifier, catalog visual verifier, detail visual
    verifier, admin visual verifier, homepage UI/sections, catalog page,
    catalog filters, V12 catalog discovery, book detail, V12 edition
    comparison, admin dashboard, admin catalog, cleanup `totalMatches: 0`,
    release-notes mirror check, stale v1.3 release/deploy claim scan,
    secret-like scan, `npx tsc --noEmit --pretty false`, `npm run lint`,
    `npm run build`, `git diff --check`, and visual artifact inspection.
  - Deployment/tag status at this gate: deferred to `V13-T10` pending explicit
    user instruction.
- [x] `V13-T10` Deploy, Smoke Test, Document, And Tag v1.3.0. - 2026-07-18
  - Result: created release-prep commit `79347b7`.
  - Result: deployed Vercel production deployment
    `dpl_6in3zn6CsXKtj3mR2xjGVh4X3q59`, aliased to
    `https://caseflow-store.vercel.app`.
  - Result: production smoke passed with 100 active editions, 100 cover
    responses, 50 English editions, 50 Vietnamese editions, and all public,
    account, admin, cart/checkout, assistant, language, detail, robots, and
    sitemap checks passing.
  - Result: release notes and trackers were updated with production evidence;
    annotated `v1.3.0` tagging followed production smoke.
  - Evidence:
    - `caseflow-store/.agent/artifacts/v13-t10/production-release-smoke.json`
    - `caseflow-store/.agent/artifacts/v13-t10/production-home-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v13-t10/production-catalog-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v13-t10/production-detail-desktop-en.png`
    - `caseflow-store/.agent/artifacts/v13-t10/production-detail-mobile-vi.png`
    - `caseflow-store/.agent/artifacts/v13-t10/production-admin-boundary-mobile-en.png`
    - `docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
    - `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
  - Acceptance criteria:
    - Release tree is committed before production deploy.
    - Vercel production deployment succeeds for CaseFlow Books v1.3.
    - Production smoke verifies public pages/APIs, catalog quality, covers,
      language mode, cart/checkout boundary, assistant, and protected admin/
      customer boundaries.
    - Release notes and `.agent` trackers document production release facts
      without hiding v1.3 scope boundaries.
    - Release cleanup, stale claim scan, secret-like scan, TypeScript, lint,
      production build, and `git diff --check` pass.
    - Annotated `v1.3.0` tag is created only after production smoke passes.
  - Verification:
    - `npx tsc --noEmit --pretty false`
    - `npm run lint`
    - `npm run build`
    - `npx vercel --prod`
    - Production smoke script against `https://caseflow-store.vercel.app`
    - `npx tsx scripts/verify-release-cleanup.ts`
    - stale release/deploy claim scan and secret-like scan
    - `git diff --check`
    - annotated tag inspection

## Post-Release QA

- [x] `QA-FINAL-T01` Final Post-Release Tester Audit For v1.3.0. - 2026-07-18
  - Result: final production tester audit passed with no findings.
  - Result: production release smoke passed with 100 active editions, 100
    cover responses, 50 English editions, 50 Vietnamese editions, and all
    public, language, assistant, cart/checkout, customer boundary, admin
    boundary, detail, robots, sitemap, and catalog-quality checks passing.
  - Result: full Playwright E2E passed `20/20` on a production-style local
    server.
  - Result: accessibility/mobile/performance audit passed with focus states,
    admin/checkout controls, catalog performance, screenshots, and no overflow.
  - Result: cleanup passed with `totalMatches: 0`; secret-like scan,
    stale-claim scan, TypeScript, lint, build, and `git diff --check` passed.
  - Residual: `npm audit --audit-level=high` passed; a moderate transitive
    Next/PostCSS advisory remains documented because `npm audit fix --force`
    proposes a breaking downgrade path.
  - Evidence:
    - `docs/v1.3-final-post-release-qa-audit.md`
    - `caseflow-store/docs/v1.3-final-post-release-qa-audit.md`
    - `caseflow-store/scripts/verify-final-post-release-qa.ts`
    - `caseflow-store/.agent/artifacts/qa-final-t01/final-post-release-qa.json`
    - `caseflow-store/.agent/artifacts/qa-final-t01/production-release-smoke.json`
    - `caseflow-store/.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`
    - `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
  - Acceptance criteria:
    - Test strategy/checklist is documented with functional, UX, access,
      content, SEO, performance, accessibility, and cleanup coverage.
    - Production non-mutating smoke verifies the live `v1.3.0` site.
    - Production-style local E2E verifies storefront, checkout, account,
      admin/staff, API error, keyboard/focus, and edge-case journeys.
    - Additional tester audit verifies UI text, no overflow, actionable empty/
      error states, bilingual controls, and no obvious public leakage.
    - No P0/P1 defects remain open; any residual P2/P3 findings are documented
      with severity, evidence, and recommended next action.
    - Cleanup, secret-like scan, stale-claim scan, TypeScript, lint, build,
      and `git diff --check` pass after the audit.
  - Verification:
    - production release smoke against `https://caseflow-store.vercel.app`
    - full Playwright E2E on a production-style local server
    - final QA audit script/report
    - `npx tsx scripts/verify-release-cleanup.ts`
    - secret-like scan and stale-claim scan
    - `npx tsc --noEmit --pretty false`
    - `npm run lint`
    - `npm run build`
    - `git diff --check`
