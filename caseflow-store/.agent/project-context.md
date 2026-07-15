# CaseFlow Store - Project Context

## Project Identity

- Project name: CaseFlow Store
- Repository folder: `/Users/vantruong/Documents/TSNN 2`
- Product domain: phone accessories
- Project type: small full-stack e-commerce MVP
- Purpose: portfolio/CV project for Web or Full-Stack Developer applications
- Implementation duration: exactly 20 days
- Journal entries: 30, with entries 21-30 as retrospective documentation
- Current mode: implementation enabled
- Current gate: Release candidate `v1.0.0-rc.1` accepted; production deployment pending

## Confirmed Facts

- The user wants a small MVP, not a large e-commerce platform.
- The project must be usable locally before public deployment.
- The project must preserve context across future AI sessions using Markdown files.
- The user wants critical evaluation of risks, assumptions, and missing data.
- Implementation was confirmed by the user on 2026-07-14.
- Implementation was unblocked by installing the official Node.js LTS binary after Homebrew failed.
- The Next.js app has been initialized in `caseflow-store`.
- The app runs locally at `http://localhost:3000` when `npm run dev` is active.
- The user delegated the product-domain choice to the agent on 2026-07-14.
- The selected product domain is phone accessories.

## Working Assumptions

These are defaults that remain tentative until a later task or ADR freezes them:

- Stack: Next.js App Router, TypeScript, Tailwind CSS, Route Handlers, Supabase, Zod, Playwright, Vercel.
- Customer checkout: guest checkout.
- Payment: simulated checkout only.
- Admin authentication: required.
- Cart persistence: localStorage.

## Confirmed Product Domain

Confirmed by user-delegated selection on 2026-07-14.

- Domain: phone accessories.
- Categories: phone cases, screen protectors, chargers, cables and adapters, stands and mounts.
- Domain-specific feature: compatibility filtering by phone model.
- Initial seed target: 16 demo products.
- Compatibility labels: `iPhone 13`, `iPhone 14`, `iPhone 15`, `iPhone 16`, `Galaxy S23`, `Galaxy S24`, `Galaxy S25`, `Pixel 8`, `Pixel 9`, `Universal`.
- Source of truth: `docs/domain.md`.
- Scope boundary: compatibility is a simple string list for the MVP, not a full phone-model database.

## MVP Scope

### Included

- Store homepage
- Product listing
- Category filter
- Search
- Basic price sorting
- Product detail
- Cart drawer
- localStorage cart persistence
- Guest checkout
- Order confirmation
- Admin login
- Admin order list
- Admin order status update
- Responsive mobile/desktop UI
- Loading, empty, error, and success states
- Server-side validation
- Server-side price calculation
- Supabase persistence
- Playwright E2E happy path
- Vercel deployment
- README, architecture docs, ADRs, known limitations, and CV summary

### Excluded

- Real payment gateway
- Card input fields
- Coupon engine
- Shipping integration
- Reviews and ratings
- Wishlist
- Chat
- Recommendation AI
- Multi-vendor marketplace
- Microservices
- Queue infrastructure
- Redis
- Elasticsearch
- Kubernetes
- Native mobile app
- Complex CMS
- Realtime analytics

## Architecture Decision

Use a modular monolith:

```text
Browser
  |
  v
Next.js UI
  |
  +-- React Context/localStorage for temporary cart state
  |
  +-- Next.js Route Handlers
        |
        +-- Zod validation
        +-- Repository interface
              |
              +-- Mock repository during early UI/API work
              +-- Supabase repository during integration
```

Rationale:

- One repository is realistic for 20 days.
- UI and API share the same origin, reducing unnecessary CORS work.
- Vercel deployment is simpler.
- Mock-first development prevents UI from being blocked by database setup.
- Repository interfaces reduce mock/database drift.

## Actual Repository Structure

Current structure after Day 1:

```text
.
├── AGENTS.md
├── DESIGN.md
├── SKILL.md
├── .agent/
│   ├── project-context.md
│   ├── step-results.md
│   └── todo-roadmap.md
├── docs/
    ├── architecture.md
    ├── context-management.md
    ├── pre-implementation-review.md
    ├── adr/
    │   ├── 0001-use-nextjs-modular-monolith.md
    │   ├── 0002-use-supabase.md
    │   ├── 0003-use-mock-first-development.md
    │   ├── 0004-use-local-cart.md
    │   └── 0005-use-simulated-checkout.md
    └── diagrams/
        ├── container-diagram.md
        └── system-context.md
└── caseflow-store/
    ├── .agent/
    ├── AGENTS.md
    ├── CLAUDE.md
    ├── DESIGN.md
    ├── README.md
    ├── SKILL.md
    ├── docs/
    ├── eslint.config.mjs
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── public/
    ├── supabase/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── data/
    │   ├── features/
    │   ├── lib/
    │   └── types/
    ├── tests/
    └── tsconfig.json
```

The app is nested under `caseflow-store`. Day 2 copied project management docs into the app directory so future agents can work from either the repository root or the app folder without losing context.

## Environment Preflight

Latest check: 2026-07-14.

- Initial `node -v`: failed with `zsh:1: command not found: node`
- Initial `npm -v`: failed with `zsh:1: command not found: npm`
- Initial `npx --version`: failed with `zsh:1: command not found: npx`
- Initial `git --version`: passed with `git version 2.37.1 (Apple Git-137.1)`
- Homebrew is available: `Homebrew 6.0.6`
- Codex bundled Node exists at `/Users/vantruong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` and reports `v24.14.0`
- Codex bundled `npm`, `npx`, and `corepack` were not found under the bundled runtime paths checked.
- User approved `brew install node` on 2026-07-14.
- `brew install node` failed while installing the `llvm` dependency with: `Errno::ENOENT: No such file or directory @ rb_sysopen ... .diff`.
- After the failed Homebrew install attempt, `node`, `npm`, and `npx` still fail with `command not found`.
- Homebrew did install or update some dependencies before the failure, including `openssl@3 3.6.3`, `cmake 4.4.0`, and `python@3.14 3.14.6`.
- `python@3.14` built successfully but did not link cleanly because `/usr/local/bin/python3`, `/usr/local/bin/pip3`, and related files already point to other Python installations.
- Official Node.js LTS binary `v24.18.0` for `darwin-x64` was downloaded from nodejs.org, verified with `SHASUMS256.txt`, extracted to `/usr/local/lib/nodejs/node-v24.18.0-darwin-x64`, and symlinked into `/usr/local/bin`.
- Final `node -v`: `v24.18.0`
- Final `npm -v`: `11.16.0`
- Final `npx --version`: `11.16.0`
- Final `git --version`: `git version 2.37.1 (Apple Git-137.1)`

Implication: future setup should not assume Homebrew can install current Node quickly on this macOS 12 machine. Prefer the verified official Node LTS binary path unless the user wants to repair Homebrew separately.

## Day 1 Actual Stack

- Next.js: `16.2.10`
- React: `19.2.4`
- React DOM: `19.2.4`
- TypeScript: `^5`
- Tailwind CSS: `^4`
- ESLint: `^9`
- Package manager: npm `11.16.0`

Day 1 checks:

- `npm run lint`: passed.
- `npm run build`: passed.
- `curl -I http://localhost:3000`: returned `HTTP/1.1 200 OK`.

Day 3 dependency update:

- `zod` was installed early for `D03-T03` because the roadmap originally listed installation as `D04-T01` after the schema task that requires it.
- `caseflow-store/package.json` now includes `zod` `^4.4.3`.
- `npm run lint` passed after installation.
- npm still reports 2 moderate severity vulnerabilities and pending install-script approvals for `sharp` and `unrs-resolver`; do not run `npm audit fix --force` casually.

Known Day 1 risks:

- `npm install` reported 2 moderate severity vulnerabilities. Do not run `npm audit fix --force` casually because it may introduce breaking dependency changes.
- npm warned that install scripts for `unrs-resolver` and `sharp` are pending approval.
- `create-next-app` generated `caseflow-store/AGENTS.md` and `caseflow-store/CLAUDE.md`; Day 2 must reconcile these with the root project rules instead of leaving contradictory agent instructions.

## Day 2 Documentation Sync

Completed `D02-T01` on 2026-07-14.

Copied into `caseflow-store/`:

- `AGENTS.md`
- `DESIGN.md`
- `SKILL.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- `.agent/step-results.md`
- `docs/architecture.md`
- `docs/context-management.md`
- `docs/pre-implementation-review.md`
- `docs/adr/`
- `docs/diagrams/`

`caseflow-store/AGENTS.md` now contains the project rules and a Next.js `16.2.10` version note. `caseflow-store/CLAUDE.md` still points to `AGENTS.md`.

## Day 2 Structure Setup

Completed `D02-T02` on 2026-07-14.

Created under `caseflow-store/`:

- `src/components`
- `src/features`
- `src/lib`
- `src/data`
- `src/types`
- `supabase`
- `tests`

Each empty directory has a `.gitkeep` so the structure is retained by Git.

## Day 2 Environment Example

Completed `D02-T03` on 2026-07-14.

Created `caseflow-store/.env.example` with placeholders:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Updated `caseflow-store/.gitignore` so `.env.local` stays ignored while `.env.example` can be committed.

Verification:

- `git -C caseflow-store check-ignore -q .env.local` exits `0`, so `.env.local` is ignored.
- `git -C caseflow-store check-ignore -q .env.example` exits `1`, so `.env.example` is not ignored.

## Day 2 Status Page

Completed `D02-T04` on 2026-07-14.

Changed:

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/app/globals.css`

Result:

- Default Next.js template page was replaced with a simple CaseFlow Store implementation status page.
- Metadata now uses `CaseFlow Store`.
- Global CSS maps core `DESIGN.md` tokens into Tailwind v4 theme variables.

Verification:

- `npm run lint`: passed.
- `npm run build`: passed.
- `curl -s http://localhost:3000 | rg -n "CaseFlow Store|Local baseline ready|Implementation Status"` found the expected content.

Limitation: no browser screenshot tool was available in this turn, so visual QA was limited to code review plus HTTP render output.

## Day 2 Agent File Verification

Completed `D02-T05` on 2026-07-14.

Verified:

- Root `AGENTS.md`
- Root `DESIGN.md`
- Root `docs/adr/0001-use-nextjs-modular-monolith.md`
- Root `docs/adr/0002-use-supabase.md`
- Root `docs/adr/0003-use-mock-first-development.md`
- Root `docs/adr/0004-use-local-cart.md`
- Root `docs/adr/0005-use-simulated-checkout.md`
- App-level `caseflow-store/AGENTS.md`
- App-level `caseflow-store/DESIGN.md`
- App-level `caseflow-store/docs/adr/` with the same 5 ADR files

## Day 2 Baseline Checks

Completed `D02-T06` on 2026-07-14.

Command:

```bash
npm run lint && npm run build
```

Result:

- `npm run lint`: passed.
- `npm run build`: passed.

Deferred:

- `D02-T07` optional Vercel smoke deploy was not attempted because Vercel access and deployment target are not verified.

Next required task:

- `D03-T03` must add Zod schemas that enforce the runtime constraints described by `caseflow-store/src/types/domain.ts`.

## Target Application Structure

```text
caseflow-store/
├── AGENTS.md
├── DESIGN.md
├── README.md
├── .agent/
├── docs/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (store)/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── features/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── orders/
│   ├── data/
│   │   └── mock/
│   ├── lib/
│   │   ├── repositories/
│   │   ├── supabase/
│   │   ├── validation/
│   │   └── utils/
│   └── types/
├── supabase/
│   ├── schema.sql
│   └── seed.sql
└── tests/
    └── e2e/
```

## Implemented Domain Types

Implemented in `caseflow-store/src/types/domain.ts` on 2026-07-14.

- `CATEGORY_SLUGS`
- `COMPATIBILITY_LABELS`
- `ORDER_STATUSES`
- `CategorySlug`
- `CompatibilityLabel`
- `OrderStatus`
- `ISODateTimeString`
- `MoneyAmount`
- `StockQuantity`
- `Quantity`
- `Category`
- `Product`
- `CartItem`
- `Order`
- `OrderItem`

Important modeling notes:

- `MoneyAmount` is a number alias, but values must be integer amounts in the smallest currency unit. Runtime validation belongs in `D03-T03`.
- Product `stock` uses `StockQuantity`, while cart/order item `quantity` uses `Quantity`; their runtime constraints are different.
- Product compatibility uses the confirmed `CompatibilityLabel` values from `docs/domain.md`.

## Implemented Validation Schemas

Implemented in `caseflow-store/src/lib/validation/domain.ts` on 2026-07-14.

- `categorySlugSchema`
- `compatibilityLabelSchema`
- `orderStatusSchema`
- `idSchema`
- `slugSchema`
- `isoDateTimeStringSchema`
- `moneyAmountSchema`
- `stockQuantitySchema`
- `quantitySchema`
- `productImageUrlSchema`
- `compatibilityListSchema`
- `categorySchema`
- `productSchema`
- `cartItemSchema`
- `orderSchema`
- `orderItemSchema`

Important validation notes:

- Money must be a non-negative integer.
- Product stock must be a non-negative integer.
- Cart and order item quantity must be a positive integer.
- Product compatibility labels must be from the confirmed phone-model list and must not be duplicated.
- Product images must be root-relative paths or `http(s)` URLs.
- `orderItemSchema` verifies that `lineTotal` equals `unitPrice * quantity`.
- Schemas are not wired into API handlers yet; that belongs to the API tasks.

## Database Schema Draft

Implemented in `caseflow-store/supabase/schema.sql` on 2026-07-14.

Drafted tables:

- `profiles`
- `categories`
- `products`
- `orders`
- `order_items`

Important schema decisions:

- Product prices and order totals are integer VND.
- No cart table exists; the MVP cart remains localStorage-only.
- `order_items` stores product name, unit price, quantity, and line total snapshots.
- `line_total` has a database check: `line_total = unit_price * quantity`.
- Product compatibility is stored as `text[]` with allowed labels from `docs/domain.md`.
- Category slugs are constrained to the five confirmed MVP categories.
- RLS is enabled on all drafted tables.
- Public direct reads are allowed only for active categories and active products.
- Direct public order insert/update policies are intentionally not defined; checkout and admin writes must go through Next.js Route Handlers.

Verification limitation:

- `psql` and Supabase CLI are not installed locally, so the schema was not executed against PostgreSQL yet. D13 must apply and verify it in a real Supabase project.

## Mock Catalog

Implemented in `caseflow-store/src/data/mock/catalog.ts` on 2026-07-14.

- Mock categories: 5.
- Mock products: 16.
- Featured products: 6.
- Domain: phone accessories.
- Runtime guard: `mockCategories` and `mockProducts` are parsed with Zod schemas at module import time.

Category distribution:

- Phone cases: 4 products.
- Screen protectors: 3 products.
- Chargers: 3 products.
- Cables and adapters: 3 products.
- Stands and mounts: 3 products.

Important limitation:

- Product `imageUrl` values are root-relative planned paths under `/images/products/`, but the actual image files have not been created yet. Product UI work must add or replace real assets before visual QA.

## Supabase Proof Of Connection Plan

Implemented in `docs/supabase-proof-of-connection.md` and `caseflow-store/docs/supabase-proof-of-connection.md` on 2026-07-14.

Latest D13-T01 access check: 2026-07-15.

D13-T01 project creation result:

- Supabase project `caseflow-store` exists in `NVTruong473's Org`.
- Project ref: `fcsuldrerhbynwotcvyn`.
- Dashboard URL: `https://supabase.com/dashboard/project/fcsuldrerhbynwotcvyn`.
- Public project URL: `https://fcsuldrerhbynwotcvyn.supabase.co`.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t01-supabase-project-dashboard.png`.
- No service role key or database password was printed or stored during D13-T01.

D13-T03 schema application result:

- Applied `caseflow-store/supabase/schema.sql` to Supabase project `caseflow-store` through SQL Editor on 2026-07-15.
- SQL Editor result: `Success. No rows returned`.
- Verification query returned expected table count `5`.
- Tables verified: `categories`, `order_items`, `orders`, `products`, `profiles`.
- No cart table was created; `cart_table_count` was `0`.
- `order_status` enum type exists.
- `profiles_set_updated_at`, `categories_set_updated_at`, `products_set_updated_at`, and `orders_set_updated_at` triggers exist.
- Verification query reported `3` policies and RLS enabled for all 5 schema tables.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t03-schema-verification.png`.

D13-T04 RLS result:

- Explicitly enabled RLS for `profiles`, `categories`, `products`, `orders`, and `order_items`.
- Added explicit grants/revokes to `caseflow-store/supabase/schema.sql` and applied them in Supabase SQL Editor.
- Policy surface remains 3 SELECT policies:
  - `Public can read active categories` for `anon` and `authenticated`.
  - `Public can read active products` for `anon` and `authenticated`.
  - `Users can read own profile` for `authenticated`.
- Direct role privileges verified:
  - `anon` can select `categories` and `products`.
  - `anon` cannot select `profiles`.
  - `anon` and `authenticated` cannot directly select or insert `orders` or `order_items`.
  - `authenticated` can select `profiles`, `categories`, and `products`.
- Behavior test under `current_user = anon` saw only `phone-cases` and `rls-t04-visible-product`; inactive product/category data stayed hidden.
- Rollback verification after the behavior test returned 0 temporary `rls-t04` products, orders, and order items.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t04-rls-behavior-check.png`.

Actual status:

- `.env.local` is missing.
- `NEXT_PUBLIC_SUPABASE_URL` is not set in the shell environment.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not set in the shell environment.
- `SUPABASE_SERVICE_ROLE_KEY` is not set in the shell environment.
- Supabase CLI is not installed.
- Supabase runtime packages are installed in the app: `@supabase/supabase-js` `^2.110.5` and `@supabase/ssr` `^0.12.3`.
- Supabase CLI package is not installed.
- No `~/.supabase` session/config files were found.
- `psql` is not installed.
- Target Supabase organization is verified as `NVTruong473's Org`.
- Database password handling remains user-managed and was not exposed.
- Supabase project was created and verified.
- Live SQL Editor schema application was completed.
- Follow-up unblock attempt on 2026-07-15 opened Supabase Dashboard in Chrome after user sign-in and verified the project dashboard.

Plan acceptance checks for later:

- Add Supabase values to ignored `caseflow-store/.env.local`.
- Apply `caseflow-store/supabase/schema.sql`. Completed in D13-T03.
- Confirm expected tables exist. Completed in D13-T03.
- Confirm RLS is enabled. Completed in D13-T04.
- Confirm anonymous users cannot read/write orders directly. Completed in D13-T04 through privilege checks.
- Confirm active products/categories can be read after seed data exists. Initial behavior verified in D13-T04 with rollback data; D13-T05 must seed real catalog data.

## Product List API

Implemented `GET /api/products` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/products/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`
- `caseflow-store/src/lib/validation/products.ts`

Current behavior:

- Uses mock catalog data, not Supabase.
- Returns `{ data, error }`.
- Returns only active products from active categories.
- Supports `category`, `compatibility`, `q`, `featured`, and `sort` query parameters.
- Supported sort values: `newest`, `price-asc`, `price-desc`, `name-asc`.
- Invalid query values return `400` with `VALIDATION_ERROR`.
- Compatibility filtering treats `Universal` products as compatible with specific phone-model filters.

Verified examples:

- `GET /api/products`: 200, 16 products.
- `GET /api/products?category=chargers&compatibility=iPhone%2015&sort=price-asc`: 200, 3 products.
- `GET /api/products?category=bad-category`: 400.

Limitations:

- No pagination yet.
- Response shape has no `meta` yet; response standardization is scheduled for `D05-T04`.
- Data source is still mock-first.

## Product Detail API

Implemented `GET /api/products/[slug]` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/products/[slug]/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`

Current behavior:

- Uses mock catalog data, not Supabase.
- Returns `{ data, error }`.
- Valid active product slug returns `200`.
- Valid but missing slug returns `404` with `PRODUCT_NOT_FOUND`.
- Invalid slug format returns `400` with `VALIDATION_ERROR`.

Verified examples:

- `GET /api/products/aeroguard-magsafe-case`: 200.
- `GET /api/products/not-a-real-product`: 404.
- `GET /api/products/Bad_Slug`: 400.

## Categories API

Implemented `GET /api/categories` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/categories/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`

Current behavior:

- Uses mock catalog data, not Supabase.
- Returns `{ data, error }`.
- Returns active categories sorted by `sortOrder`, then name.

Verified example:

- `GET /api/categories`: 200, 5 categories in the confirmed domain order.

## Cart Validation API

Implemented `POST /api/cart/validate` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/cart/validate/route.ts`
- `caseflow-store/src/lib/validation/cart.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`

Current behavior:

- Request body: `{ "items": [{ "productId": string, "quantity": number }] }`.
- Uses mock catalog data, not Supabase.
- Does not trust client price, subtotal, stock, or product details.
- Aggregates duplicate product IDs before stock checks.
- Recalculates `unitPrice`, `lineTotal`, and `subtotal` on the server.
- Returns `PRODUCT_NOT_FOUND` for stale/unavailable product IDs.
- Returns `OUT_OF_STOCK` when requested quantity exceeds stock.
- Allows empty cart with subtotal 0 for cart refresh; checkout/order creation must still reject empty orders later.

Verified examples:

- Valid cart: 200, subtotal recalculated.
- Duplicate product IDs: 200, quantities aggregated.
- Missing product ID: 404.
- Out of stock: 409.
- Invalid quantity: 400.
- Empty cart: 200, subtotal 0.

## Day 4 API Verification

Completed `D04-T06` on 2026-07-14.

Verified with curl:

- `GET /api/products`: 200, 16 products.
- `GET /api/products?category=chargers&compatibility=iPhone%2015&sort=price-asc`: 200, 3 products.
- `GET /api/products?category=bad-category`: 400, `VALIDATION_ERROR`.
- `GET /api/products/aeroguard-magsafe-case`: 200.
- `GET /api/products/not-a-real-product`: 404, `PRODUCT_NOT_FOUND`.
- `GET /api/categories`: 200, 5 categories.
- `POST /api/cart/validate` valid cart: 200, subtotal 1017000.
- `POST /api/cart/validate` out of stock: 409, `OUT_OF_STOCK`.
- `POST /api/cart/validate` invalid JSON: 400, `VALIDATION_ERROR`.
- `POST /api/cart/validate` invalid payload: 400, `VALIDATION_ERROR`.

Final Day 4 checks:

- `npm run lint`: passed.
- `npm run build`: passed.

## Mock Order Creation API

Implemented `POST /api/orders` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/orders/route.ts`
- `caseflow-store/src/lib/validation/orders.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`

Current behavior:

- Uses mock catalog/order repositories, not Supabase.
- Accepts guest checkout fields and `{ productId, quantity }` items.
- Does not collect payment fields.
- Server re-reads products through cart validation.
- Server recalculates `unitPrice`, `lineTotal`, and `subtotal`.
- Creates `pending` orders with generated order code and order item snapshots.
- Invalid JSON returns 400.
- Invalid order payload, including empty items, returns 400.
- Out-of-stock item returns 409.
- Client-supplied subtotal is ignored.

Verified examples:

- Valid order with fake client `subtotal: 1`: 201; server subtotal 1017000.
- Empty order: 400.
- Out of stock: 409.
- Invalid JSON: 400.

Important limitations:

- Orders are stored in module-level memory and reset when the server process restarts.
- Mock order creation does not decrement stock. Real stock handling must be transactional/RPC-backed during Supabase integration or documented as an MVP limitation.

## Admin Order List API

Implemented `GET /api/admin/orders` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/admin/orders/route.ts`
- `caseflow-store/src/lib/auth/admin.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`
- `caseflow-store/.env.example`

Current behavior:

- Uses mock in-memory orders.
- Requires server-side admin token guard.
- Local development accepts `x-caseflow-admin-token: dev-admin-token` when `CASEFLOW_ADMIN_API_TOKEN` is empty.
- Production requires `CASEFLOW_ADMIN_API_TOKEN`; missing production token returns `ADMIN_AUTH_NOT_CONFIGURED`.
- No token or wrong token returns `UNAUTHORIZED`.

Verified examples:

- `GET /api/admin/orders` without token: 401.
- Create order, then `GET /api/admin/orders` with dev token: 200, list includes pending order.

Important limitation:

- This is temporary mock admin authorization, not final Supabase Auth/RLS. It exists to prevent a public admin API during mock-first development.

## Admin Order Status API

Implemented `PATCH /api/admin/orders/[id]` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/admin/orders/[id]/route.ts`
- `caseflow-store/src/lib/validation/orders.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`

Current behavior:

- Requires server-side admin token guard before updating.
- Validates order id.
- Validates status against the `OrderStatus` enum.
- Updates only `status` and server-side `updatedAt`.
- Does not let clients change subtotal, items, customer data, or order code.
- Missing order returns `ORDER_NOT_FOUND`.

Verified examples:

- Valid admin PATCH to `confirmed`: 200.
- No token: 401, `UNAUTHORIZED`.
- Invalid status: 400, `VALIDATION_ERROR`.
- Missing order: 404, `ORDER_NOT_FOUND`.

Important limitation:

- Status transition rules are not enforced yet; the MVP currently allows any known status value from the enum.

## Standard API Response Shape

Implemented on 2026-07-14.

File:

- `caseflow-store/src/lib/api/response.ts`

Current response shape:

```json
{
  "data": {},
  "error": null,
  "meta": null
}
```

Error response shape:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  },
  "meta": null
}
```

Current behavior:

- All API routes use `apiSuccess` or `apiError`.
- List endpoints include `meta.count`.
- Detail, mutation, and error responses include `meta: null`.

Verified examples:

- Product list: keys `data`, `error`, `meta`; `meta.count` is 16.
- Product detail: keys `data`, `error`, `meta`; `meta` is null.
- Product query error: keys `data`, `error`, `meta`; `meta` is null.
- Order creation: keys `data`, `error`, `meta`; `meta` is null.

## Price And Subtotal Tampering Verification

Completed `D05-T05` on 2026-07-14.

Verified:

- `POST /api/cart/validate` ignored fake client `subtotal`, item `price`, and item `lineTotal`.
- `POST /api/orders` ignored fake client `subtotal`, item `price`, and item `lineTotal`.
- `PATCH /api/admin/orders/[id]` ignored fake `subtotal` and `items` fields, updating only status.

Evidence:

- Tampered cart request returned subtotal 658000, unitPrice 329000, lineTotal 658000.
- Tampered order request returned subtotal 658000, unitPrice 329000, lineTotal 658000.
- Tampered admin PATCH kept subtotal 658000 and item count 1 while changing status to `shipping`.

## Preview Deploy Readiness

Checked `D05-T06` on 2026-07-14.

Actual status:

- `vercel` CLI is not installed.
- `.vercel` project link is missing.
- `VERCEL_TOKEN` is missing in the shell environment.
- `VERCEL_ORG_ID` is missing in the shell environment.
- `VERCEL_PROJECT_ID` is missing in the shell environment.
- Deploy target and user approval are not confirmed.

Result:

- Preview deploy was not attempted.
- `D05-T06` is deferred as an external readiness/deployment task.
- Local work can continue to Day 6.

## Design Token Mapping

Completed `D06-T01` on 2026-07-14.

File:

- `caseflow-store/src/app/globals.css`

Mapped from `DESIGN.md`:

- Colors.
- Radius tokens.
- Spacing tokens.
- Typography size tokens.
- Font family.
- Selection styling.
- Global `focus-visible` outline.

Verification:

- `npm run lint`: passed.
- `npm run build`: passed.
- `rg` confirmed the mapped CSS variables.

## UI Component Primitives

Completed `D06-T02` on 2026-07-15.

Files:

- `caseflow-store/src/lib/utils/cn.ts`
- `caseflow-store/src/components/ui/button.tsx`
- `caseflow-store/src/components/ui/input.tsx`
- `caseflow-store/src/components/ui/badge.tsx`
- `caseflow-store/src/components/ui/container.tsx`
- `caseflow-store/src/components/ui/card.tsx`
- `caseflow-store/src/components/ui/skeleton.tsx`
- `caseflow-store/src/components/ui/error-message.tsx`
- `caseflow-store/src/components/ui/index.ts`
- `caseflow-store/src/app/ui-preview/page.tsx`

Current behavior:

- `Button` supports primary, secondary, destructive, and ghost variants plus sm/md/lg/icon sizing, disabled, loading, and icon slots.
- `Input` requires a visible label and wires helper/error text with `aria-describedby` and `aria-invalid`.
- `Badge` supports neutral, primary, success, warning, and error variants without relying only on color.
- `Container`, `Card`, `Skeleton`, and `ErrorMessage` use the mapped design tokens and responsive-safe `min-w-0` treatment.
- `/ui-preview` renders the primitives for visual QA and is marked `noindex`.

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright screenshots captured at 1440px and 375px from production local server and passed visual review.

Important limitation:

- `/ui-preview` is a QA route, not a storefront feature. Decide before production whether to keep it, hide it behind environment checks, or remove it.

## Layout Shell

Completed `D06-T03` on 2026-07-15.

Files:

- `caseflow-store/src/components/layout/navigation.ts`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/site-footer.tsx`
- `caseflow-store/src/components/layout/index.ts`
- `caseflow-store/src/app/layout.tsx`

Current behavior:

- Root layout now renders `SiteHeader`, page content, and `SiteFooter`.
- Desktop header shows brand, primary nav links, and a cart drawer trigger.
- Mobile header uses a client-side `MobileNavigation` toggle with `aria-expanded`, `aria-controls`, and accessible open/close labels.
- Footer contains compact storefront/support navigation and a short MVP limitation note.
- Navigation links use current-page anchors for planned sections to avoid creating 404 links before product/cart/admin routes exist.

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright/CDP screenshots captured desktop, mobile closed, and mobile menu-open states from a production local server.

Important limitation:

- Header and mobile cart controls open the cart drawer. Quantity boundary validation was added in `D09-T04`; checkout still needs server validation before order creation.

## Layout Verification

Completed `D06-T04` on 2026-07-15.

Verified surfaces:

- `/` at 1440px.
- `/` at 375px.
- `/` at 375px with the mobile menu open.
- `/ui-preview` at 1440px.
- `/ui-preview` at 375px.

Artifacts:

- `caseflow-store/.agent/artifacts/d06-t04-home-1440.png`
- `caseflow-store/.agent/artifacts/d06-t04-home-375.png`
- `caseflow-store/.agent/artifacts/d06-t04-home-375-menu.png`
- `caseflow-store/.agent/artifacts/d06-t04-ui-preview-1440.png`
- `caseflow-store/.agent/artifacts/d06-t04-ui-preview-375.png`
- `caseflow-store/.agent/artifacts/d06-t04-layout-check.json`

Result:

- DOM checks found no horizontal overflow at 375px or 1440px.
- Header and footer were present on checked pages.
- Mobile menu rendered open without layout overflow.

Important limitation:

- This verifies the current Day 6 shell and primitive preview only. Full responsive acceptance still belongs to Day 12 after product, cart, checkout, and admin UI exist.

## Storefront Homepage

Completed `D07-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/lib/format/currency.ts`
- `caseflow-store/src/components/layout/site-footer.tsx`

Current behavior:

- `/` is now a storefront homepage instead of the implementation status page.
- Homepage uses mock catalog data directly for stats, categories, and featured product preview.
- Sections exist for `#categories`, `#products`, `#compatibility`, `#support`, and `#checkout`.
- Product visuals are CSS-built placeholders, not final product photos.
- Visible copy was revised to avoid internal terms like mock APIs, future tasks, or portfolio MVP language.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t01-homepage-1440.png`
- `caseflow-store/.agent/artifacts/d07-t01-homepage-375.png`
- `caseflow-store/.agent/artifacts/d07-t01-homepage-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- DOM checks found no horizontal overflow at 1440px or 375px.

Important limitation:

- Product imagery is still generated with CSS placeholders. Real product image assets remain unresolved and should be addressed before final portfolio acceptance.

## Product Grid

Completed `D07-T02` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-visual.tsx`
- `caseflow-store/src/features/products/product-card.tsx`
- `caseflow-store/src/features/products/product-grid.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/page.tsx`

Current behavior:

- Homepage `#products` now renders all 16 mock products.
- Product grid is responsive: one column on mobile, two columns on small screens, and four columns on large desktop.
- `ProductCard` shows category, stock badge, product name, clamped description, price, and stock count.
- Product cards expose `data-product-card={slug}` for reliable checks.
- Product visuals are centralized in `ProductVisual` and remain CSS placeholders.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t02-product-grid-1440.png`
- `caseflow-store/.agent/artifacts/d07-t02-product-grid-375.png`
- `caseflow-store/.agent/artifacts/d07-t02-product-grid-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- HTML/DOM checks found 16 product cards.
- DOM checks found no horizontal overflow at 1440px or 375px.

Important limitation:

- Product cards do not link to product detail pages yet because `/products/[slug]` is scheduled for Day 8.

## Category Filter

Completed `D07-T03` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-catalog.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/page.tsx`

Current behavior:

- Homepage product section uses `ProductCatalog`, a client component that owns category filter state.
- Filter buttons include `All`, `Phone cases`, `Screen protectors`, `Chargers`, `Cables and adapters`, and `Stands and mounts`.
- Buttons expose `aria-pressed` and `data-category-filter` for accessibility and reliable checks.
- Result count is shown with `data-product-result-count`.
- Product grid updates without page navigation.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t03-category-filter-1440-all.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-375-all.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-1440-chargers.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-375-chargers.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Category interaction checks passed for all expected counts: all 16, phone cases 4, screen protectors 3, chargers 3, cables and adapters 3, stands and mounts 3.
- DOM checks found no horizontal overflow for desktop and mobile checked states.

Important limitation:

- Category state is client-side only and is not synced to URL query parameters.

## Search And Sorting

Completed `D07-T04` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-catalog.tsx`

Current behavior:

- Homepage product catalog now includes a visible `Search products` input.
- Search matches product name, description, and slug, matching the mock API search scope.
- Basic sorting supports `Newest`, `Price: low to high`, `Price: high to low`, and `Name: A to Z`.
- Search, category filter, and sorting are composed in this order: search first, category filter second, sort last.
- Category filter counts update against the current search result set.
- Filter buttons expose `aria-label`, `aria-pressed`, `data-category-filter`, and `data-category-filter-count`.
- A `Clear` action appears only when the search input has content.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t04-search-sort-1440-default.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-375-default.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-1440-charger-price-desc.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-375-charger-price-desc.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- CDP checks verified all sort modes, search for `charger`, search plus category for `glass`, clear search behavior, selected category state, and responsive screenshots.
- DOM checks found no visible horizontal overflow at 1440px or 375px.

Important limitation:

- Search, category, and sort state is client-side only and is not synced to URL query parameters.

## Catalog State UI

Completed `D07-T05` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-catalog.tsx`
- `caseflow-store/src/features/products/product-catalog-states.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/catalog-state-preview/page.tsx`
- `caseflow-store/src/app/catalog-state-preview/catalog-state-preview.tsx`

Current behavior:

- Product catalog renders an empty state when the current search/category view has no products.
- Empty state includes a `Reset filters` action that clears search, category, and sort state.
- Product catalog accepts `isLoading` and `errorMessage` props for future API-backed states.
- Loading state disables catalog controls and renders stable product-card skeletons.
- Error state disables catalog controls, shows an error message, and offers a retry page refresh.
- `/catalog-state-preview?state=empty|loading|error` is a noindex visual QA route for these states.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t05-preview-empty-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-empty-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-loading-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-loading-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-error-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-error-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-catalog-states-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright screenshots passed visual review for empty, loading, and error states at 1440px and 375px.
- HTML selector checks confirmed homepage still renders 16 product cards and each preview state renders exactly one expected state marker.

Important limitation:

- Loading and error are prepared states, not live network states yet. Homepage still uses mock data imported directly; API-backed catalog fetching belongs to a later integration task.

## Product Detail Route

Completed `D08-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/products/product-card.tsx`

Current behavior:

- `/products/[slug]` renders a dynamic product detail page from the mock catalog.
- The route uses `generateStaticParams` to prerender current active mock product slugs.
- Product metadata uses the selected product name and description.
- Unknown product slugs return Next.js 404.
- Product cards on the homepage now link to their detail pages and keep `data-product-card={slug}` selectors.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-1440.png`
- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-375.png`
- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and listed `/products/[slug]` as SSG with 16 generated paths.
- HTTP checks confirmed homepage 200, sample detail 200, missing slug 404, 16 product-card links, and one sample detail marker.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- D08-T01 only establishes the route and link path. Full detail content belongs to `D08-T02`; quantity and add-to-cart feedback belong to `D08-T03`.

## Product Detail Content

Completed `D08-T02` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/page.tsx`

Current behavior:

- Product detail pages now show a stable product visual, product description, formatted VND price, stock state, compatibility labels, and category context.
- Product image area exposes `data-product-detail-image`.
- Product content exposes selectors for description, price, stock, and compatibility labels.
- Stock state uses a success or error badge based on current stock quantity.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-1440.png`
- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-375.png`
- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and preserved the 16 generated SSG product paths.
- HTML content checks confirmed image, price, stock, description, and compatibility markers on the sample product.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- Product visuals are still CSS placeholders because real product image assets are not present. Quantity selection and add-to-cart feedback remain for `D08-T03`.

## Product Detail Purchase Controls

Completed `D08-T03` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`
- `caseflow-store/src/features/products/index.ts`

Current behavior:

- Product detail pages now include a stock-aware quantity selector.
- Quantity decrement is disabled at 1 and increment is disabled at the current product stock.
- The quantity input has a visible label and clamps entered values to the valid stock range.
- The Add to cart button shows an accessible live feedback message after click.
- Stable selectors include `data-product-purchase-controls`, `data-quantity-input`, `data-quantity-decrement`, `data-quantity-increment`, and `data-add-to-cart-feedback`.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-1440.png`
- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-375.png`
- `caseflow-store/.agent/artifacts/d08-t03-add-to-cart-feedback-1440.png`
- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and preserved the 16 generated SSG product paths.
- HTML marker checks confirmed the purchase controls, quantity input, add-to-cart button, and stock text render on the sample product.
- Chrome interaction check confirmed two increment clicks set quantity to `3`, then Add to cart produced `Added 3 x AeroGuard MagSafe Case to cart.` with success feedback.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- D08-T03 feedback is local UI feedback only. Real cart state, header count, cart drawer, and localStorage persistence belong to Day 9 tasks.

## Product Detail Not-Found Behavior

Completed `D08-T04` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/not-found.tsx`

Current behavior:

- Unknown product slugs render a product-specific not-found view instead of the generic Next.js 404 UI.
- The not-found response preserves HTTP status `404`.
- The page gives users direct actions back to the product list and homepage.
- Stable selector: `data-product-not-found`.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-1440.png`
- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-375.png`
- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and preserved the 16 generated SSG product paths.
- HTTP check confirmed `/products/not-a-real-product` returns status `404` and includes `data-product-not-found`.
- Desktop/mobile screenshots passed visual review.

## Cart Context

Completed `D09-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/app/providers.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`
- `caseflow-store/src/features/cart/index.ts`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`

Current behavior:

- The app shell is wrapped in `CartProvider`.
- `useCart` exposes `items`, `totalQuantity`, `addItem`, `updateItemQuantity`, `removeItem`, and `clearCart`.
- Cart state is in-memory only at this point.
- The cart stores only `productId` and `quantity`.
- Product detail Add to cart now writes to cart context.
- Desktop header and mobile navigation cart controls read the shared `totalQuantity`.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t01-cart-context-after-add-1440.png`
- `caseflow-store/.agent/artifacts/d09-t01-cart-context-mobile-menu-375.png`
- `caseflow-store/.agent/artifacts/d09-t01-cart-context-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Grep check found no `localStorage`, `sessionStorage`, `price`, or `subtotal` usage in the new cart/client integration.
- Chrome interaction check confirmed adding quantity `3` updates desktop header and mobile menu to `Cart (3)`.

Important limitation:

- Cart state is lost on page reload until `D09-T02` adds versioned localStorage persistence.

## Versioned Cart Persistence

Completed `D09-T02` on 2026-07-15.

Files:

- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`

Current behavior:

- Cart state persists to localStorage key `caseflow-store.cart.v1`.
- Stored payload shape is `{ version: 1, items: [{ productId, quantity }] }`.
- Stored items are parsed defensively and normalized.
- Duplicate stored product IDs are merged.
- Invalid JSON, invalid item shapes, and unsupported storage versions are ignored.
- Desktop header and mobile menu restore cart count after reload.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-after-reload-1440.png`
- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-mobile-menu-375.png`
- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Chrome interaction check confirmed localStorage payload uses top-level keys `items` and `version` only.
- Chrome interaction check confirmed stored item keys are `productId` and `quantity` only.
- Chrome interaction check confirmed the stored payload does not contain price, subtotal, product name, slug, description, or stock fields.
- Chrome interaction check confirmed reload restores `Cart (3)` in desktop header and mobile menu.
- Chrome interaction check confirmed unsupported storage version is ignored and resets the count to `Cart (0)`.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- localStorage cart contents remain untrusted. Checkout must still call server validation before creating orders.

## Cart Drawer

Completed `D09-T03` on 2026-07-15.

Files:

- `caseflow-store/src/app/providers.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`
- `caseflow-store/src/features/cart/index.ts`

Current behavior:

- Header and mobile cart controls open the cart drawer instead of navigating to a placeholder anchor.
- Drawer empty state is explicit.
- Drawer item state maps local cart `productId` values to the mock catalog for display.
- Drawer shows product name, category, stock badge, quantity, unit price, line total, and estimated subtotal.
- Drawer supports item remove and clear cart.
- Drawer supports close button, backdrop click, Escape key close, focus restoration, and a simple focus loop.
- Cart persistence remains `{ version, items: [{ productId, quantity }] }`.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-empty-1440.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-with-item-1440.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-mobile-375.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Chrome interaction check confirmed empty drawer opens with focus on Close.
- Chrome interaction check confirmed quantity `3` renders one product item and estimated subtotal `987.000 d`.
- Chrome interaction check confirmed drawer works at 375px mobile.
- Chrome interaction check confirmed Escape closes the drawer.
- Chrome interaction check confirmed Remove and Clear cart reset count to `Cart (0)` and write an empty items array to localStorage.
- Chrome interaction check confirmed stored cart still does not include price, subtotal, product name, slug, description, or stock fields.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- Drawer totals are still display-only. Checkout must not trust local quantity, line total, subtotal, or stock state from the browser.

## Cart Quantity Boundaries

Completed `D09-T04` on 2026-07-15.

Files:

- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`

Current behavior:

- Cart `addItem` and `updateItemQuantity` accept an optional `maxQuantity` and clamp requested quantities against it.
- Product detail calculates `cartQuantity` and `remainingQuantity` from the local cart for the current product.
- Product detail disables Add to cart when the cart already contains all available stock.
- Product detail shows quantity `0` when no more units can be added, instead of showing a misleading disabled `1`.
- Product detail passes the product stock as the max boundary when adding to cart.
- Drawer item rows now include quantity decrement/increment controls.
- Drawer decrement is disabled at quantity `1`.
- Drawer increment is disabled when the line item quantity reaches product stock.
- Tampered over-stock localStorage remains visible as an invalid state, shows a boundary error, and exposes a Set to max action.
- Cart localStorage still stores only `{ productId, quantity }` items inside `{ version, items }`; product details, prices, stock, and subtotals are not persisted.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t04-product-boundary-1440.png`
- `caseflow-store/.agent/artifacts/d09-t04-cart-boundary-drawer-1440.png`
- `caseflow-store/.agent/artifacts/d09-t04-cart-boundary-tampered-375.png`
- `caseflow-store/.agent/artifacts/d09-t04-quantity-boundary-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Browser check confirmed adding stock max `18` results in `In cart: 18. Remaining to add: 0.`
- Browser check confirmed product quantity input value is `0` and Add to cart is disabled when remaining quantity is `0`.
- Browser check confirmed cart count is `18` and localStorage stores only `productId` and `quantity`.
- Browser check confirmed drawer increment is disabled at `18`, decrement changes quantity to `17`, and increment returns it to `18`.
- Browser check confirmed tampered localStorage quantity `99` shows a visible boundary error and Set to max fixes storage back to `18`.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- UI quantity boundaries are not authoritative. Checkout must call server-side cart validation before order creation.
- In a tampered over-stock cart state, drawer subtotal reflects the invalid local quantity until the user fixes it. That subtotal must remain display-only and must not feed checkout totals.

## Checkout Route

Completed `D10-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/checkout/page.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `caseflow-store/src/features/checkout/index.ts`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`

Current behavior:

- `/checkout` exists as a static App Router page that renders a client checkout surface.
- Checkout waits for cart localStorage hydration before deciding whether the cart is empty.
- Empty cart state has a direct action back to the product list.
- Non-empty cart state renders a contact/shipping form with visible labels and customer field validation.
- Payment card fields are intentionally absent.
- The checkout form currently validates details with a `Validate details` action; order submission remains pending.
- Cart review posts local `{ productId, quantity }` items to `/api/cart/validate`.
- Valid cart review renders server-calculated line totals and subtotal.
- Invalid over-stock cart state renders a visible validation error and does not render a subtotal.
- Valid cart review also renders an order summary from server-validated cart data.
- Cart drawer now includes a Checkout link to `/checkout`.
- Cart localStorage remains item-only; no product details, stock, prices, line totals, or subtotal are stored.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t01-checkout-empty-1440.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-with-cart-1440.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-with-cart-375.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-validation-error-375.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-route-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout`.
- Browser check confirmed empty cart state renders when localStorage is empty.
- Browser check confirmed cart quantity `2` validates through `/api/cart/validate` and shows subtotal `658.000 d`.
- Browser check confirmed Place order is disabled for this shell task.
- Browser check confirmed drawer Checkout link navigates to `/checkout`.
- Browser check confirmed stored cart item keys remain only `productId` and `quantity`.
- Browser check confirmed tampered quantity `99` renders `OUT_OF_STOCK` with `Needs fix`.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- Checkout still depends on mock repository validation until Supabase integration replaces mock data.

## Checkout Customer Validation

Completed `D10-T02` on 2026-07-15.

Files:

- `caseflow-store/src/features/checkout/checkout-page.tsx`

Current behavior:

- Customer form state is controlled in the checkout feature module.
- Full name, email, phone, and shipping address reuse the domain Zod schemas from `src/lib/validation/domain.ts`.
- Empty fields show specific inline messages after blur or submit.
- Invalid email and phone formats show specific inline messages.
- Valid customer details clear the field errors and show `Customer details are valid for the next checkout step.`
- Payment card fields remain absent; browser verification found no card, CVV, expiry, or payment-like inputs.
- Cart review still uses `/api/cart/validate` for server-calculated subtotal; customer field validation does not trust cart totals from localStorage.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t02-checkout-invalid-1440.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-valid-1440.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-valid-375.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-validation-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout`.
- `curl -I http://localhost:3001/checkout`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed all four empty fields show required errors.
- Browser check confirmed invalid email and invalid phone show format errors.
- Browser check confirmed valid customer details show success status and no field errors.
- Browser check confirmed no card-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- This is client-side checkout UX validation only. Final order creation must still validate the same customer fields on the server through `POST /api/orders`.

## Checkout Order Summary

Completed `D10-T03` on 2026-07-15.

Files:

- `caseflow-store/src/features/checkout/checkout-page.tsx`

Current behavior:

- Checkout renders `Order summary` only after `/api/cart/validate` succeeds.
- Summary item count is derived from validated cart lines, not from local cart display state.
- Subtotal and order total use the server-calculated subtotal from `CartValidationData`.
- Shipping row is explicit as `Not charged in demo`.
- Payment row is explicit as `No payment collected`.
- Summary keeps `data-checkout-subtotal` on the server subtotal for existing checks and adds summary-specific selectors.
- If cart validation fails, the order summary and summary totals do not render, preventing stale local totals from being displayed.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t03-order-summary-1440.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-375.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-error-1440.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout`.
- `curl -I http://localhost:3001/checkout`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed valid cart summary shows `2 items`, subtotal `658.000 d`, shipping `Not charged in demo`, payment `No payment collected`, and total `658.000 d`.
- Browser check confirmed no card-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Browser check confirmed over-stock cart validation returns `OUT_OF_STOCK` and does not render summary totals.
- Desktop/mobile/error screenshots passed visual review.

Important limitation:

- `POST /api/orders` remains the authoritative boundary for validating customer fields and recalculating totals during submission.

## Checkout Success Flow

Completed `D10-T04` on 2026-07-15.

Files:

- `caseflow-store/src/app/checkout/success/page.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `caseflow-store/src/features/checkout/checkout-success-page.tsx`
- `caseflow-store/src/features/checkout/checkout-success-storage.ts`
- `caseflow-store/src/features/checkout/index.ts`

Current behavior:

- Checkout form submit now validates customer fields and requires server cart review success before creating an order.
- The submit action posts item-only cart data plus customer fields to `POST /api/orders`.
- `POST /api/orders` remains responsible for server-side customer validation, cart validation, price recalculation, and order creation.
- Successful submit stores a non-PII success snapshot in sessionStorage under `caseflow-store.checkout.success.v1`.
- The success snapshot stores order code, status, subtotal, item count, created timestamp, and order item names/quantities/line totals.
- The cart is cleared after successful order creation.
- `/checkout/success` renders order code, pending status, server-calculated total, and item summary.
- `/checkout/success?orderCode=...` has a fallback state when browser session success data is missing.
- Payment card fields remain absent.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-1440.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-375.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-fallback-1440.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout/success`.
- `curl -I http://localhost:3001/checkout/success`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed checkout submit button is enabled after cart validation and reads `Place simulated order`.
- Browser check confirmed successful submit navigates to `/checkout/success?orderCode=...`.
- Browser check confirmed order code starts with `CF-`.
- Browser check confirmed success total is `658.000 d` from server-created order data.
- Browser check confirmed success status is `pending`.
- Browser check confirmed localStorage cart is cleared to `{ version: 1, items: [] }`.
- Browser check confirmed no card-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Browser check confirmed direct success URL fallback shows the order code when session snapshot is missing.
- Desktop/mobile/fallback screenshots passed visual review.

Important limitation:

- The success page snapshot is browser-session data, not durable order retrieval. Durable order lookup should wait for Supabase integration or an explicit public order lookup task.
- Mock order storage remains in memory until the Supabase order repository replaces it.

## Checkout Playwright Skeleton

Completed `D10-T05` on 2026-07-15.

Implemented files:

- `caseflow-store/playwright.config.ts`
- `caseflow-store/tests/e2e/checkout.spec.ts`
- `caseflow-store/package.json`
- `caseflow-store/package-lock.json`
- `caseflow-store/.gitignore`

Behavior:

- Installed `@playwright/test` and added `npm run test:e2e`.
- Configured Playwright to run Chromium desktop tests from `tests/e2e`.
- Configured the test web server to use `npm run start -- -p 3001`, with `PLAYWRIGHT_BASE_URL` support for externally managed servers.
- Added a checkout happy-path test that seeds localStorage with only `{ productId, quantity }`, validates server-calculated checkout totals, submits a simulated order, verifies success page order code/status/total, verifies cart clear, verifies the non-PII success snapshot, and checks no card-like inputs exist.
- Added a direct-link success fallback test for `/checkout/success?orderCode=CF-SKELETON`.
- The happy-path test writes a visual artifact to `.agent/artifacts/d10-t05-playwright-checkout-success.png`.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t05-playwright-checkout-success.png`
- `caseflow-store/playwright-report/index.html`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `npx playwright install chromium`: passed.
- `npm run test:e2e`: passed, 2 tests.
- Visual review of `d10-t05-playwright-checkout-success.png`: passed.

Important notes:

- The first E2E run correctly exposed a test bug: `[data-cart-count]` exists in both desktop and mobile navigation. The test was fixed to assert every cart count instance is zero after successful checkout.
- Playwright emitted a macOS 12 environment warning that its ffmpeg browser is frozen. This did not block Chromium checkout tests, but it is a local environment risk to remember.
- npm still reports 2 moderate vulnerabilities and pending install-script approvals for `sharp` and `unrs-resolver`; do not run `npm audit fix --force` casually.
- `D17-T01` now overlaps with work completed in `D10-T05`. Treat Day 17 as expanding and hardening E2E coverage rather than pretending Playwright was first installed then.

## Admin Login

Completed `D11-T01` on 2026-07-15.

Implemented files:

- `caseflow-store/src/app/admin/login/page.tsx`
- `caseflow-store/src/features/admin/admin-login-page.tsx`
- `caseflow-store/src/features/admin/admin-session.ts`
- `caseflow-store/src/features/admin/index.ts`
- `caseflow-store/src/lib/auth/admin-constants.ts`
- `caseflow-store/src/lib/auth/admin.ts`

Behavior:

- Added `/admin/login` with metadata.
- Added an admin access form that validates a token by calling `GET /api/admin/orders` with the server-required `x-caseflow-admin-token` header.
- Invalid or missing token does not create a saved session.
- Valid token writes a versioned mock admin session to `sessionStorage` under `caseflow-store.admin.session.v1`.
- The saved session stores the token and `verifiedAt` timestamp for this browser tab only.
- Added shared admin session helpers for the next admin UI tasks to read the saved token and construct admin API headers.
- The login UI does not expose `CASEFLOW_ADMIN_API_TOKEN` through any `NEXT_PUBLIC_*` value.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t01-admin-login-1440.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-375.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-success-1440.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/login`.
- `curl -I http://127.0.0.1:3001/admin/login`: returned `HTTP/1.1 200 OK`.
- `curl http://127.0.0.1:3001/api/admin/orders` without token: returned `401 UNAUTHORIZED`.
- `curl -H 'x-caseflow-admin-token: dev-admin-token' http://127.0.0.1:3001/api/admin/orders`: returned `200 OK`.
- `npm run test:e2e`: passed, 2 tests.
- Playwright admin login check confirmed invalid-token error, valid-token success state, saved session version `1`, and no horizontal overflow at 1440px or 375px.
- Desktop/mobile/success screenshots passed visual review.

Important notes:

- The admin login is still a mock-phase token check, not Supabase Auth. Supabase Auth and role-based protection remain Day 15 tasks.
- `sessionStorage` is acceptable only for this mock admin phase. Durable auth must replace it before production.
- The local QA server was started with `CASEFLOW_ADMIN_API_TOKEN=dev-admin-token` so production-mode `next start` could verify the admin guard.

## Admin Order List

Completed `D11-T02` on 2026-07-15.

Implemented files:

- `caseflow-store/src/app/admin/orders/page.tsx`
- `caseflow-store/src/features/admin/admin-orders-page.tsx`
- `caseflow-store/src/features/admin/admin-login-page.tsx`
- `caseflow-store/src/features/admin/index.ts`

Behavior:

- Added `/admin/orders` with metadata.
- Reads the versioned mock admin session from `sessionStorage`.
- Shows an auth-required state when no valid session is present.
- Calls `GET /api/admin/orders` with the saved `x-caseflow-admin-token` header.
- Clears the saved session and returns to auth-required state when the admin API returns `401`.
- Renders loading, error, empty, and list states.
- Renders desktop order table and mobile order cards.
- Summary shows order count, pending count, item count, and server-created order total.
- Order list shows order code, customer name/email, status, total, item count, and created date.
- `/admin/login` now shows a `View orders` link when a session is saved.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-1440.png`
- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-375.png`
- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/orders`.
- `curl -I http://127.0.0.1:3001/admin/orders`: returned `HTTP/1.1 200 OK`.
- Admin API without token returned `401 UNAUTHORIZED`.
- Admin API with `x-caseflow-admin-token: dev-admin-token` returned `200 OK`.
- `npm run test:e2e`: passed, 2 tests.
- Test order was created through `POST /api/orders`; server returned subtotal `1017000`.
- Playwright admin orders check confirmed auth-required state, list selectors, desktop table rows, mobile cards, no horizontal overflow at 1440px or 375px, and QA order presence.
- Desktop and mobile screenshots passed visual review.

Important notes:

- The order list uses the mock in-memory order repository. Restarting the server clears orders.
- Counts and totals can include orders created by checkout E2E during the same server process.
- D11-T03 extends this screen with order detail and status update controls.

## Admin Order Detail And Status Update

Completed `D11-T03` on 2026-07-15.

Implemented files:

- `caseflow-store/src/features/admin/admin-orders-page.tsx`

Behavior:

- `/admin/orders` now selects the newest order by default after loading the guarded admin order list.
- Admin users can select any listed order with visible `View` controls on desktop table rows and mobile cards.
- The detail panel shows order code, current status, created/updated timestamps, customer name, email, phone, shipping address, server-created total, and order items.
- The status form supports the known order statuses from `ORDER_STATUSES`.
- Status updates call `PATCH /api/admin/orders/[id]` with the saved `x-caseflow-admin-token` header and `{ status }` JSON body.
- The UI handles `401` by clearing the mock admin session and returning to the auth-required state.
- Successful PATCH responses update the selected order, list row/card, and summary pending count from the server response.
- No client price, subtotal, item, or customer data is trusted during status update.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-1440.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-status-updated-1440.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-375.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/orders` plus `/api/admin/orders/[id]`.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright admin detail/status QA seeded a test order, verified the seeded order was selected, verified customer/shipping/items in the detail panel, changed status from `pending` to `confirmed`, verified the server returned `confirmed`, and captured desktop/mobile screenshots.
- Overflow checks passed at 1440px and 375px.
- Visual review passed after moving the desktop `View` control into the first visible table column.

Important notes:

- No `GET /api/admin/orders/[id]` route was added for this task. The detail view uses the already-loaded list payload and keeps the mutation path on the existing PATCH route.
- The admin token/session is still mock-phase `sessionStorage`, not Supabase Auth.
- The order repository is still in-memory; restarting `next start` clears orders.
- D11-T04 remains useful because the mobile admin layout works but can still be tightened specifically for repeated mobile operations.

## Admin Mobile Treatment

Completed `D11-T04` on 2026-07-15.

Implemented files:

- `caseflow-store/src/features/admin/admin-orders-page.tsx`

Behavior:

- Mobile summary metrics now use a two-column layout instead of four full-width blocks.
- Mobile and tablet widths below `lg` use order cards instead of the desktop table.
- A compact selected-order bar appears above the mobile/tablet order list with `Orders` and `Detail` actions.
- Mobile order cards are denser and keep order code, status, date, total, item count, customer, email, and visible `View details` action.
- Selecting `View details` on mobile updates selection, scrolls to the detail panel, and focuses the panel.
- The detail/status update flow still uses the guarded PATCH route and server response.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-default-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-detail-focus-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-status-updated-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-tablet-768.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-desktop-regression-1440.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-treatment-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright admin mobile QA seeded three orders, verified the mobile selected-order bar, verified two-column summary layout, selected a non-default order, confirmed the detail panel focused after mobile selection, changed status to `shipping`, and verified server status was `shipping`.
- Overflow checks passed at 375px, 768px, and 1440px.
- Visual review passed for mobile default, mobile focused detail, mobile status-updated, tablet, and desktop regression screenshots.

Important notes:

- The 768px tablet QA initially found horizontal overflow because the desktop table activated at `md`; this was fixed by keeping cards active until `lg`.
- The sticky site header can appear in full-page screenshots captured after scroll because the QA intentionally verifies the detail-focused scroll position.
- Admin auth and persistence are still mock-phase and remain future Day 15 Supabase work.

## UI Breakpoint Acceptance

Completed `D12-T01` on 2026-07-15.

Scope:

- Viewports: 375px, 768px, 1024px, and 1440px.
- Scenarios: home/catalog, product detail, cart drawer, checkout with cart, checkout success, admin login, and admin orders with data.

Artifacts:

- `caseflow-store/.agent/artifacts/d12-t01-breakpoint-check.json`
- `caseflow-store/.agent/artifacts/d12-t01-home-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-product-detail-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-cart-drawer-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-checkout-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-checkout-success-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-admin-login-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-admin-orders-{375,768,1024,1440}.png`

Verification:

- Breakpoint QA generated 28 screenshots and found 0 horizontal overflow failures.
- The QA seeded cart data, checkout success data, admin session data, and a mock admin order instead of depending on stale browser state.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run test:e2e`: passed, 2 checkout tests.

Important notes:

- No source UI changes were required for D12-T01.
- The QA script itself needed two corrections: the cart button exists in both desktop/mobile markup, and on 375px the visible cart action is inside the mobile menu.
- D12-T02 should now audit keyboard navigation and focus states; it should not repeat the same broad screenshot sweep unless a focus issue requires visual confirmation.

## Keyboard And Focus Acceptance

Completed `D12-T02` on 2026-07-15.

Scope:

- Mobile navigation and cart drawer keyboard behavior at 375px.
- Product detail quantity/add-to-cart keyboard behavior at 1024px.
- Checkout customer fields keyboard order and focus state at 1024px.
- Admin login token input at 768px.
- Mobile admin selected-order detail jump and focused detail panel at 375px.

Artifacts:

- `caseflow-store/.agent/artifacts/d12-t02-keyboard-focus-check.json`
- `caseflow-store/.agent/artifacts/d12-t02-mobile-menu-focus-375.png`
- `caseflow-store/.agent/artifacts/d12-t02-cart-drawer-focus-375.png`
- `caseflow-store/.agent/artifacts/d12-t02-product-detail-focus-1024.png`
- `caseflow-store/.agent/artifacts/d12-t02-checkout-focus-1024.png`
- `caseflow-store/.agent/artifacts/d12-t02-admin-login-focus-768.png`
- `caseflow-store/.agent/artifacts/d12-t02-admin-orders-focus-375.png`

Verification:

- Added `tests/e2e/keyboard-focus.spec.ts`.
- The targeted keyboard/focus spec passed: 3 tests.
- Full `npm run test:e2e` passed: 5 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.

Important notes:

- D12-T02 found a real mobile accessibility defect: after opening the cart drawer from the mobile menu, closing the drawer with Escape could leave focus on `body` because the original cart opener was hidden when the menu closed.
- The fix restores focus to the previous element only when it is still visible, otherwise falling back to a visible cart opener, mobile menu toggle, or home link.
- Playwright webServer now supplies `CASEFLOW_ADMIN_API_TOKEN` for E2E when no external token is configured; this keeps admin E2E deterministic without weakening server-side admin checks.
- D12-T03 should now audit loading, empty, error, and success states. It should focus on state coverage, not repeat broad breakpoint or keyboard sweeps.

## State Acceptance

Completed `D12-T03` on 2026-07-15.

Scope:

- Catalog loading, empty, and error preview states.
- Cart drawer empty state.
- Checkout empty, cart-validation error, and order success states.
- Product not-found fallback.
- Admin orders auth-required, loading, empty, and error states.
- Admin login invalid-token error and valid-token success states.

Artifacts:

- `caseflow-store/.agent/artifacts/d12-t03-state-check.json`
- `caseflow-store/.agent/artifacts/d12-t03-catalog-loading-375.png`
- `caseflow-store/.agent/artifacts/d12-t03-catalog-empty-375.png`
- `caseflow-store/.agent/artifacts/d12-t03-catalog-error-375.png`
- `caseflow-store/.agent/artifacts/d12-t03-cart-empty-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-checkout-empty-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-product-not-found-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-checkout-error-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-checkout-success-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-auth-required-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-loading-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-empty-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-error-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-login-error-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-login-success-768.png`

Verification:

- Added `tests/e2e/ui-states.spec.ts`.
- The targeted state spec passed: 4 tests.
- Full `npm run test:e2e` passed: 9 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.

Important notes:

- D12-T03 did not require production UI changes; it added acceptance coverage and visual artifacts.
- The first full-suite attempt exposed weak test isolation and stale production-server CSS artifacts. The spec was hardened, the production server was restarted after build, and D12-T03 screenshots were regenerated with correct styling.
- D12-T04 is the right next step: run the final Day 12 lint/build verification task before `D12-T05` feature freeze.

## Final Day 12 Verification

Completed `D12-T04` on 2026-07-15.

Scope:

- Run the final Day 12 lint and production build gate before feature freeze.

Verification:

- `npm run lint && npm run build`: passed.
- Next.js production build completed TypeScript, page data collection, and static page generation.
- Static generation count: 31 pages.

Important notes:

- No source code changes were made for D12-T04.
- D12-T05 should now freeze features. After freeze, only fixes and integration work should be allowed unless the roadmap is explicitly changed.

## Feature Freeze

Completed `D12-T05` on 2026-07-15.

Feature freeze is active after Day 12 UI acceptance.

Allowed after freeze:

- Fixes for defects, accessibility issues, responsive regressions, security issues, and test instability.
- Supabase integration work already listed in Phase 4.
- Deployment, E2E expansion, documentation, README, known limitations, and CV summary work already listed in the roadmap.
- Explicitly approved roadmap changes with updated documentation and ADRs when the change is major.

Not allowed after freeze without explicit roadmap change:

- New user-facing storefront features.
- New cart, checkout, admin, or catalog features outside the existing roadmap.
- Scope expansions that make the MVP look larger than a 20-day implementation.

After D12-T05, Phase 4 began with Supabase integration work.

## Supabase Seed Data

Completed `D13-T05` on 2026-07-15.

Scope:

- Create an idempotent seed file for categories and products.
- Keep Supabase catalog rows aligned with the validated mock catalog in `caseflow-store/src/data/mock/catalog.ts`.
- Apply the seed file to the real Supabase project `caseflow-store`.

Files and artifacts:

- `caseflow-store/supabase/seed.sql`
- `caseflow-store/.agent/artifacts/d13-t05-seed-verification.png`

Seed result from Supabase SQL Editor:

```json
{
  "product_count": 16,
  "category_count": 5,
  "active_product_count": 16,
  "active_category_count": 5,
  "featured_product_count": 6,
  "product_counts_by_category": {
    "chargers": 3,
    "phone-cases": 4,
    "stands-mounts": 3,
    "cables-adapters": 3,
    "screen-protectors": 3
  }
}
```

Important notes:

- `seed.sql` is idempotent and uses `on conflict (slug) do update`.
- Category/product UUIDs intentionally match the mock catalog so cart tests and later repository integration can compare stable IDs.
- The SQL Editor query runs as `postgres`; D13-T04 already verified the RLS/public-read surface separately.
- `.env.local` is still missing, so the Next.js app is not connected to Supabase yet.

## Supabase Client Factories

Completed `D14-T01` on 2026-07-15.

Scope:

- Add typed raw Supabase database contracts.
- Add a browser Supabase client factory for Client Components.
- Add a per-request server Supabase client factory for Server Components and Route Handlers.
- Keep service role secrets out of browser-importable code.

Files:

- `caseflow-store/src/types/supabase.ts`
- `caseflow-store/src/lib/supabase/env.ts`
- `caseflow-store/src/lib/supabase/browser.ts`
- `caseflow-store/src/lib/supabase/server.ts`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed; static generation count remained 31 pages.

Important notes:

- `createSupabaseServerClient()` is async because Next.js `16.2.10` exposes `cookies()` as a Promise.
- The server client uses the public anon key and RLS. It does not use the service role key.
- A mixed `src/lib/supabase/index.ts` barrel was intentionally not kept because exporting server and browser modules together can let Client Components accidentally import `next/headers`.
- `.env.local` is still missing, so live Supabase reads are not wired into the app yet.

## Supabase Catalog Row Mapping

Completed `D14-T02` on 2026-07-15.

Scope:

- Map Supabase `categories` rows to `Category` domain objects.
- Map Supabase `products` rows to `Product` domain objects.
- Convert database `snake_case` fields to application `camelCase` fields.
- Parse mapped objects through the existing Zod domain schemas so runtime database drift fails explicitly.

File:

- `caseflow-store/src/lib/supabase/mappers.ts`

Verification:

- Runtime mapper check passed for valid category/product rows.
- Product compatibility is copied instead of sharing the raw row array.
- Runtime mapper check confirmed that a negative product price raises a Zod error.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.

Important notes:

- D14-T02 maps catalog rows only because Day 14 owns the product repository. Order row mapping belongs with the Day 15 order persistence flow.
- The mock repository remains active until D14-T03.
- `.env.local` is still missing, so the next task must establish the live app connection before repository replacement can be verified.

Next task: `D14-T03 - Replace mock product repository with Supabase repository`.

## Live Supabase Catalog Repository

Completed `D14-T03` on 2026-07-15.

Scope:

- Configured ignored local public Supabase environment values.
- Added an async Supabase catalog repository for categories, products, product detail, filters/sort, and cart validation.
- Replaced live storefront, product detail, catalog API, cart drawer, and checkout catalog reads with Supabase data.
- Kept the catalog state preview on deterministic mock data because it is an isolated QA fixture.
- Kept mock order persistence only until Day 15 order integration.

Files:

- `caseflow-store/.env.local` (ignored; values not recorded in project docs)
- `caseflow-store/src/lib/repositories/supabase-catalog.ts`
- `caseflow-store/src/types/catalog.ts`
- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/app/api/products/route.ts`
- `caseflow-store/src/app/api/products/[slug]/route.ts`
- `caseflow-store/src/app/api/categories/route.ts`
- `caseflow-store/src/app/api/cart/validate/route.ts`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`

Verification:

- Live category API returned 5 active categories.
- Live product API returned 16 active products and 6 featured products.
- Phone-case filter returned 4 products with ascending price sort verified.
- Product detail returned `aeroguard-magsafe-case`.
- Cart validation returned `658000` VND for quantity 2 of the `329000` VND AeroGuard case.
- API output used domain `imageUrl` and did not expose raw `image_url`.
- Homepage HTML included live Supabase catalog content.
- `.env.local` is ignored by Git.
- No service-role reference exists in `src`.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.

Important notes:

- The public catalog uses the anon key plus RLS and does not require a service-role key.
- Homepage and product detail changed from static generation to request-time rendering because the repository uses the cookie-aware Supabase server client.
- The service-role key remains intentionally unconfigured until the server-only Day 15 order persistence design is implemented.

Next task: `D14-T04 - Retest storefront`.

## Live Storefront Retest

Completed `D14-T04` on 2026-07-15.

Verified on the production build at `http://127.0.0.1:3002`:

- Homepage rendered 5 categories, 16 products, and 6 featured products from Supabase.
- Phone-case filter rendered exactly 4 products.
- AeroGuard product detail rendered current price `329000`, stock `18`, compatibility, and category.
- Adding quantity 2 produced cart count 2 and server-validated subtotal `658000`.
- Checkout review rendered the same product, quantity, category, stock, and recalculated total.
- Focused Playwright storefront/cart/checkout suite passed 7 of 7 tests.

Visual artifacts:

- `caseflow-store/.agent/artifacts/d14-t04-supabase-storefront-1440.png`
- `caseflow-store/.agent/artifacts/d14-t04-supabase-cart-drawer.png`
- `caseflow-store/.agent/artifacts/d14-t04-supabase-checkout.png`

Broader test finding:

- An initial 9-test run passed 7 storefront tests and failed 2 admin tests.
- The failures were caused by production-mode mock admin token behavior, not catalog integration.
- Day 15 must replace mock admin/order behavior and rerun these tests; they are not counted as passed.

Next task: `D15-T01 - Create order and order items safely`.

## Atomic Supabase Order Persistence

Completed `D15-T01` on 2026-07-15.

- Added a server-only admin client whose service-role credential is read only from ignored server environment configuration.
- Added strict trusted-command validation and row-to-domain mapping for orders and order items.
- Added `public.create_order_with_items(...)` as a `security definer` RPC so the order header and all line items commit or roll back together.
- Revoked RPC execution from public, anon, and authenticated roles; granted it only to `service_role`.
- Added explicit service-role table privileges needed for trusted backend operations while preserving direct order-table denial for anon and authenticated roles.
- Kept `POST /api/orders` on the mock repository until D15-T02 so server price and stock recalculation can be activated in one verified change.

Verification:

- Permission check: service role can execute the RPC; anon and authenticated roles cannot.
- Forced database failure left zero orphan orders and zero orphan items.
- Live repository check created one order with one item, validated mapped values, and removed both rows successfully.
- A subtotal inconsistent with line totals was rejected before any write.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t01-service-role-verification.png`.

Next task: `D15-T02 - Recalculate price server-side`.

## Server-Owned Checkout Totals

Completed `D15-T02` on 2026-07-15.

- Replaced `POST /api/orders` mock persistence with live Supabase cart validation and the atomic order RPC.
- The browser contract remains customer fields plus `productId` and `quantity`; unknown client price, product-name, line-total, and subtotal fields are discarded.
- The route reads current active products, checks stock, rebuilds product-name and price snapshots, calculates each line total and subtotal, then passes only that trusted command to persistence.
- Missing products return `PRODUCT_NOT_FOUND` with 404; quantities above current stock return `OUT_OF_STOCK` with 409; internal persistence failures return `ORDER_CREATE_FAILED` without leaking backend details.

Verification:

- A deliberately tampered payload sent unit price and subtotal `1`; the persisted item retained unit price `329000` and the order subtotal was `658000` for quantity 2.
- Persisted product name also came from Supabase instead of the tampered browser field.
- Missing-product and out-of-stock HTTP checks returned 404 and 409 respectively.
- Playwright checkout flow passed 2 of 2 against the live route; all created QA orders were removed afterward.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t02-live-order-success.png`.

Next task: `D15-T03 - Configure admin account and role`.

## Dedicated Supabase Admin Identity

Completed `D15-T03` on 2026-07-15.

- Created a dedicated synthetic Supabase Auth user for CaseFlow administration instead of reusing the Supabase project owner's identity.
- Confirmed the email through the trusted Admin API and upserted the matching `profiles` row with display name `CaseFlow Admin` and role `admin`.
- Generated a strong random password and stored both test-login values only in ignored `.env.local`; no credential value was printed or added to tracked documentation.
- Restricted `.env.local` permissions to `0600`.

Verification:

- Auth Admin API returned the confirmed dedicated user.
- Password sign-in through the public anon client succeeded.
- The authenticated user could read its own profile through RLS and the returned role was `admin`.
- `.env.local` remains ignored and there are no admin credential references in `src`.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t03-supabase-admin-account.png`.

Next task: `D15-T04 - Protect admin pages and APIs`.

## Supabase Admin Authorization Boundary

Completed `D15-T04` on 2026-07-15.

- Replaced the development header token and browser `sessionStorage` admin secret with a Supabase SSR cookie session created and deleted by `/api/admin/session`.
- Added a Next.js 16 Proxy that refreshes Supabase sessions on admin page/API requests without using Proxy as the authorization decision point.
- Centralized server authorization in `requireAdminRequest()`: validate the user with `auth.getUser()`, read the caller's own profile through RLS, then require role `admin`.
- Protected `/admin/orders` in its Server Component and repeated the same session/role check inside every admin Route Handler.
- Replaced mock admin order list and status updates with server-only service-role repository operations after authorization succeeds.
- Removed the mock token constants and admin session-storage module.
- Fixed a duplicate React footer key found during Chrome console QA.

Verification:

- Anonymous admin API returned 401; anonymous admin page redirected to login.
- Wrong password returned 401 without creating an authorized session.
- The real admin cookie accessed the protected page/API, listed a live order, and persisted a status update.
- Sign-out cleared browser cookies and the next admin API request returned 401.
- The same redirect, login, API, and sign-out checks passed against the production build.
- QA orders were removed; lint, TypeScript, diff check, and production build passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t04-protected-admin-orders.png`.

Next task: `D15-T05 - Test anonymous, normal user, and admin access`.

## Day 15 Access Matrix

Completed `D15-T05` on 2026-07-15.

- Added reusable E2E helpers for admin login, temporary customer provisioning, Supabase SSR session cookies, and deterministic order/user cleanup.
- Added a three-role Playwright matrix covering anonymous, authenticated customer, and admin behavior across Next.js pages/APIs and direct Supabase Data API calls.
- Updated prior keyboard-focus and UI-state tests to use the real email/password login flow instead of mock admin token storage.
- Added cleanup to checkout, UI-state, keyboard, and access tests so synthetic orders and temporary Auth users do not accumulate.
- Loaded `.env.local` into the Playwright process with Next's environment loader without exposing values to browser code.

Verified behavior:

- Anonymous: public catalog 200; admin API 401; admin page redirected; direct orders read denied.
- Customer: own profile role `customer`; admin API 403; admin page redirected; direct orders read denied.
- Admin: protected page/API allowed; live order listed; status update persisted; direct order table remained denied; sign-out restored 401.
- Full production Playwright suite passed 12 of 12 tests.
- Post-suite checks found zero test orders and zero temporary customer users.
- Lint, TypeScript, diff check, and production build passed.
- A scan of 26 client assets found zero service-role or admin-password value leaks; `.env.local` remained mode `0600`.
- Visual artifacts: `caseflow-store/.agent/artifacts/d15-t05-customer-forbidden.png` and `caseflow-store/.agent/artifacts/d15-t05-admin-access-matrix.png`.

Day 15 is complete. Next task: `D16-T01 - Finalize .env.example`.

## Day 16 Environment Contract

Completed `D16-T01` on 2026-07-15.

- `.env.example` now contains exactly the runtime and test-runner variables consumed by current code.
- Runtime public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Runtime server-only: `SUPABASE_SERVICE_ROLE_KEY`.
- Playwright-only: `CASEFLOW_ADMIN_EMAIL`, `CASEFLOW_ADMIN_PASSWORD`.
- Removed the obsolete mock-phase `CASEFLOW_ADMIN_API_TOKEN` and unused `NEXT_PUBLIC_SITE_URL`.
- Kept `PLAYWRIGHT_PORT` and `PLAYWRIGHT_BASE_URL` as commented optional overrides, preventing a copied blank value from overriding Playwright defaults.
- Automated comparison found zero missing keys, zero stale active keys, and zero non-empty template placeholders.

Next task: `D16-T02 - Verify no secret is committed`.

## Day 16 Secret Boundary

Completed `D16-T02` on 2026-07-15.

- Added root `.gitignore` coverage for `.env*`, `.DS_Store`, and the unrelated local `password manager/` directory.
- `.env.local` remains ignored with mode `0600`; `.env.example` remains a commit candidate.
- Scanned all 299 Git commit-candidate files against the local service-role and admin-password values without printing either value.
- Scanned 397 files under `.next/static` and `.next/server` for the same sensitive values.
- Found zero exact secret-value hits and zero common secret-pattern hits.
- The repository has no Git `HEAD`; therefore there is no commit history to scan. Repeat this check before the first D19 commit/push.
- Visual artifact: `caseflow-store/.agent/artifacts/d16-t02-secret-scan.json`.

Next task: `D16-T03 - Add stable API error codes`.

## Stable API Error Contract

Completed `D16-T03` on 2026-07-15.

- Added `src/lib/api/error-codes.ts` as the compile-time source of truth for 13 server error codes.
- Changed `apiError` from accepting an arbitrary `string` code to the `ApiErrorCode` union.
- Added `docs/api-contract.md` with the stable response envelope and HTTP/code mapping; clients must branch on code, not message text.
- Added `tests/e2e/api-errors.spec.ts` for deterministic public and admin error responses.

Verification:

- 8 Route Handlers had zero undeclared literal error codes.
- `npm run lint` and `npx tsc --noEmit` passed.
- `npm run build` passed.
- API contract Playwright checks passed `2/2` against the new production build.

Next task: `D16-T04 - Deploy integration preview`.

## Vercel Integration Preview

Completed `D16-T04` on 2026-07-15.

- Created Vercel Hobby workspace `NVTruong473` and project `caseflow-store`; no paid plan or payment method was added.
- Linked the local app through ignored `.vercel/` metadata.
- Configured only the three application runtime values for Preview: two public Supabase values and the sensitive service-role value.
- Vercel CLI added a local `VERCEL_OIDC_TOKEN` to ignored mode-`0600` `.env.local`; it is not an application runtime variable or part of `.env.example`.
- Added `.vercelignore` to exclude internal docs, tests, SQL, and QA artifacts from uploads.
- The first remote build exposed an overbroad `supabase/` ignore rule; root-anchoring it as `/supabase/` restored `src/lib/supabase` and the second build passed.
- Preview remains behind Vercel Authentication because checkout writes to the live integration database.

Verified preview:

- Deployment status `Ready`; home 200.
- 5 categories and 16 products loaded from Supabase.
- Missing product 404 and anonymous admin 401 returned stable codes.
- Live order creation returned 201 with one item and subtotal `329000`; cleanup deleted the test order.
- Admin login, order list, logout, and post-logout checks returned 200, 200, 200, and 401.
- Browser console returned zero errors/warnings.
- URL: `https://caseflow-store-74nu9i3d7-nvt-ruong473.vercel.app`.
- Visual artifacts: `caseflow-store/.agent/artifacts/d16-t04-vercel-preview.png` and `d16-t04-vercel-preview.json`.

Next task: `D16-T05 - Run npm run lint && npm run build`.

## Day 16 Final Gate

Completed `D16-T05` on 2026-07-15.

- The exact command `npm run lint && npm run build` passed.
- Next.js compiled successfully, completed TypeScript checking, and generated 16 static pages.
- Re-scanned after Vercel linked the project and added a local OIDC token: 3 sensitive values across 307 commit candidates and 397 build files produced zero hits.
- Confirmed 0 D16 preview QA orders remain in Supabase.
- Feature freeze and integration freeze are now active.
- Visual artifact: `caseflow-store/.agent/artifacts/d16-t05-final-gate.json`.

Day 16 is complete.

## Day 17 E2E Hardening

Completed `D17-T01` on 2026-07-16.

- Kept the existing Playwright installation from `D10-T05` and hardened configuration instead of claiming a duplicate installation milestone.
- Added early validation for required E2E environment names, external base URLs, and local ports.
- Preserved one worker because tests mutate a shared live Supabase project.
- Disabled implicit reuse of an existing local server after a 12-hour-old Next server on port 3001 returned a stale admin API response; the same focused suite passed `2/2` on a clean server.
- Lint, TypeScript, 14-test discovery, invalid-port rejection, and Chromium execution passed.
- Evidence: `caseflow-store/.agent/artifacts/d17-t01-playwright-hardening.json`.

Completed `D17-T02` on 2026-07-16.

- Added `tests/e2e/storefront-flow.spec.ts` to exercise the real UI from homepage through product detail, quantity selection, add-to-cart feedback, cart drawer, checkout, and success.
- The test does not seed the cart directly, so it covers the integration boundaries omitted by the early checkout skeleton.
- Verified order API 201, server-calculated subtotal `658000`, pending success state, cleared cart, persisted non-PII success snapshot, and 0 remaining QA orders.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t02-storefront-checkout-success.png`.

Completed `D17-T03` on 2026-07-16.

- Added `tests/e2e/checkout-validation.spec.ts` for empty and malformed customer checkout details.
- Verified all four fields expose `aria-invalid` and an `aria-describedby` reference to the rendered validation error.
- Proved invalid forms remain on checkout and make 0 order-creation requests.
- The first run exposed a test-only text assertion issue because the visual `!` icon is in DOM text but hidden from the accessibility tree; using contained message text fixed the assertion without weakening accessibility checks.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t03-checkout-validation.png`.

Completed `D17-T04` on 2026-07-16.

- Added `tests/e2e/admin-workflow.spec.ts` with a dedicated order and cleanup boundary.
- Logged in through the real admin form, selected the exact order by ID, and updated pending to confirmed through the protected Route Handler.
- Verified response 200, UI success and badge, persisted Supabase status, post-sign-out admin API 401, and 0 remaining QA orders.
- Captured only the selected QA order panel rather than the whole admin list to keep unrelated order details out of the artifact.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t04-admin-status-update.png`.

Completed `D17-T05` on 2026-07-16.

- Ran the exact command `npx playwright test` against a Playwright-managed production server.
- Chromium passed all 17 tests across 8 spec files in 1.3 minutes with 0 failures, flaky tests, or skips.
- Post-suite checks found 0 QA orders and 0 temporary customer users, and confirmed the production test server stopped.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t05-playwright-report.png`, `caseflow-store/.agent/artifacts/d17-t05-playwright-suite.json`, and `caseflow-store/playwright-report/index.html`.

Day 17 is complete.

## Day 1-17 Release-Readiness Audit

Completed on 2026-07-16 before starting Day 18.

- Fresh `npm run lint && npm run build` passed and generated 16 pages.
- The latest complete Chromium suite passed 17/17 tests.
- Live Supabase checks confirmed 5 categories, 16 products, at least one admin profile, public catalog reads, and denied anonymous order reads.
- The Day 16 Vercel preview remains Ready.
- `D02-T07` and `D05-T06` were conditional early deploy tasks honestly deferred when tooling was unavailable; the verified Day 16 preview superseded their risk without rewriting project history.
- Git commits/remote, Production environment variables, and production deployment are intentionally still open for Day 19.
- `npm audit --omit=dev` reports 2 moderate PostCSS advisories inherited through Next.js. The suggested force fix would downgrade Next.js to 9.3.3, so it is not a rational release fix; the app does not accept user-controlled CSS and the advisory remains documented.
- Evidence: `caseflow-store/.agent/artifacts/day-01-17-release-readiness-audit.json`.

Audit decision: approved to continue.

Completed `D18-T01` on 2026-07-16.

- Added the first release edge-case test with clean cart and checkout storage.
- Verified cart count 0, explicit drawer and checkout empty states, no checkout path from the drawer, no order form on checkout, and 0 order-creation requests.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t01-empty-cart-drawer.png` and `d18-t01-empty-checkout.png`.

Completed `D18-T02` on 2026-07-16.

- Verified stable API `404/PRODUCT_NOT_FOUND` and a matching HTTP 404 storefront fallback.
- Confirmed missing pages render no purchase controls and Browse products returns to the live 16-product catalog.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t02-missing-product.png`.

Completed `D18-T03` on 2026-07-16.

- Verified invalid quantity 0 returns `400/VALIDATION_ERROR` and quantity 19 against stock 18 returns `409/OUT_OF_STOCK`.
- Verified the product UI clamps quantity to 1-18, disables further additions at stock, and the drawer disables increment at 18.
- Verified a tampered local cart quantity 99 shows the checkout stock error and disables order submission.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t03-quantity-max-cart.png` and `d18-t03-out-of-stock-checkout.png`.

Completed `D18-T04` on 2026-07-16.

- The exact production-like chain `npm run build && npm run start` compiled, typechecked, generated 16 pages, and started on port 3000.
- HTTP home/products/categories/missing/admin checks returned 200/200/200/404/401.
- Five representative edge, storefront checkout, and admin workflow tests passed directly against that server.
- QA order cleanup returned 0 and the server stopped cleanly.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t04-production-local.png` and `d18-t04-production-local.json`.

Completed `D18-T05` on 2026-07-16.

- Initial full-suite attempts exposed test-only localStorage seed races across checkout, keyboard, and UI-state specs. These were fixed at the helper boundary and verified with focused repeat runs.
- The final full Chromium suite passed 20/20 in 1.6 minutes with 0 failed, flaky, or skipped tests.
- Exact secret scan found 0 matches across 327 commit candidates; live QA orders and temporary users were 0.
- Dependency audit has 0 critical/high findings and 2 accepted moderate PostCSS advisories; the unsafe force downgrade was rejected.
- Release candidate `v1.0.0-rc.1` is accepted for production deployment.
- Evidence: `caseflow-store/docs/release-candidate.md`, `.agent/artifacts/d18-t05-release-candidate-report.png`, and `d18-t05-release-candidate.json`.

Day 18 is complete.

Completed `D19-T01` on 2026-07-16.

- Created public repository `https://github.com/NVTruong473/caseflow-store`.
- Initial release-candidate commit `c4e4dfa4a7962057652045134ccbc81b7006fe04` was pushed to `main` and matches the remote branch.
- Pre-push checks covered 331 files / 27,749,663 bytes with 0 exact secret matches; local environment and Vercel link files remained ignored.
- Git 2.37 initially failed the 27 MB HTTP pack; a repository-local 500 MiB post buffer and HTTP/1.1 retry completed the push without changing commit contents.
- Evidence: `caseflow-store/.agent/artifacts/d19-t01-github-push.json`.

Completed `D19-T02` on 2026-07-16.

- Configured `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as sensitive Production variables through stdin.
- Vercel lists all three Production entries as Encrypted and preserves their Preview counterparts.
- Playwright admin credentials were not deployed and no values were printed.
- Evidence: `caseflow-store/.agent/artifacts/d19-t02-production-env.json`.

Completed `D19-T03` on 2026-07-16.

- Preview `dpl_EDqtfK9XuinEoKmCQjMMuY9GDagw` deployed Ready at `https://caseflow-store-oh8lf9ayr-nvt-ruong473.vercel.app`.
- Vercel-protected smoke checks verified home 200, 5 categories, 16 products, stable missing-product 404, anonymous admin 401, and live order 201 with server subtotal `329000`.
- Preview QA orders were cleaned to 0.
- Evidence: `caseflow-store/.agent/artifacts/d19-t03-preview-smoke.json`.

Completed `D19-T04` on 2026-07-16.

- Production deployment `dpl_4Wocg3yqgFoSUSCR76jvN6xL2esu` is Ready.
- The stable public alias is `https://caseflow-store.vercel.app`; alternate Vercel aliases resolve to the same deployment.
- The canonical alias returned HTTP 200 and the full-page browser capture rendered the live 5-category, 16-product storefront correctly.
- Evidence: `caseflow-store/.agent/artifacts/d19-t04-production.json` and `d19-t04-production.png`.

Current task: `D19-T05 - Test storefront, checkout, and admin on production`.

Completed `D19-T05` on 2026-07-16.

- The first production run passed 18/20 and exposed a real admin navigation race: the session succeeded, but paired client `replace`/`refresh` calls could leave the browser on the login route.
- Admin login now performs a full-document replacement after the session cookie is set; lint and the 16-route production build passed before redeployment.
- Production deployment `dpl_D5GLc5s5WbDs4xB3d22kXieyDCpz` is Ready at the canonical alias.
- The final full Chromium suite passed 20/20 against production in 2.8 minutes with 0 failed, flaky, or skipped tests.
- QA cleanup returned 0 orders and 0 temporary users.
- Evidence: `caseflow-store/.agent/artifacts/d19-t05-production-acceptance.json` and `d19-t05-production-report.png`.

Day 19 is complete.

Current task: `D20-T01 - Finalize README`.

Completed `D20-T01` on 2026-07-16.

- Added a repository-root portfolio README and replaced the default application scaffold README with a focused setup guide.
- The documentation covers only verified features, production evidence, stack, structure, setup, commands, environment boundaries, and security posture.
- Simulated checkout and the prohibition on deployed Playwright credentials are explicit.
- Both README files passed whitespace validation and all relative links resolve.
- Evidence: `README.md`, `caseflow-store/README.md`, and `caseflow-store/.agent/artifacts/d20-t01-readme.json`.

Current task: `D20-T02 - Finalize architecture summary and ADR index`.

Completed `D20-T02` on 2026-07-16.

- Replaced planning-era architecture text with an as-built production description covering containers, module boundaries, request flows, data model, security matrix, deployment, and evolution path.
- Production Supabase repositories are distinguished from retained mock-first history.
- The create-order RPC guarantees atomic order/item inserts but does not decrement stock; the limitation is explicit.
- Added a five-record ADR index with each accepted decision and verified implementation outcome.
- Root/app mirrors match; all four files passed whitespace and relative-link checks with 0 missing links.
- Evidence: `docs/architecture.md`, `docs/adr/README.md`, and `caseflow-store/.agent/artifacts/d20-t02-architecture.json`.

Current task: `D20-T03 - Capture desktop/mobile screenshots`.

Completed `D20-T03` on 2026-07-16.

- Captured production storefront and product-detail screenshots at 1440px desktop and 375px mobile widths.
- The desktop storefront and both product views are full-page; the storefront mobile image uses the standard 375x812 viewport to avoid a 12,745px portfolio image while preserving the next-section cue.
- Opened all four files and found 0 blank, crop, or overlap failures.
- Embedded the images in the repository README with descriptive alt text.
- Evidence: `caseflow-store/docs/screenshots/` and `caseflow-store/.agent/artifacts/d20-t03-screenshots.json`.

Current task: `D20-T04 - Document known limitations`.

Completed `D20-T04` on 2026-07-16.

- Documented 8 verified boundaries across commerce, customer/admin scope, catalog management, and production operations.
- Each limitation includes impact, the current control, and a concrete next step; stock validation is not misrepresented as reservation/decrement.
- Recorded the current dependency audit: 0 critical/high/low and 2 moderate PostCSS-via-Next findings; the unsafe force downgrade to Next 9.3.3 remains rejected.
- Root/app documents match, pass whitespace checks, and are linked from the repository README.
- Evidence: `docs/known-limitations.md` and `caseflow-store/.agent/artifacts/d20-t04-known-limitations.json`.

Current task: `D20-T05 - Write CV bullets using only verified evidence`.

Completed `D20-T05` on 2026-07-16.

- Created 3 recommended CV bullets, 6 alternatives grouped by full-stack/security/frontend focus, an interview summary, explicit caveats, and a 9-entry evidence ledger.
- Claims are tied to production URLs, schema, source modules, Playwright specs, and release artifacts.
- The file contains no unverified scale, percentage-improvement, or elapsed-calendar-time claims and explicitly identifies checkout as simulated.
- Root/app mirrors match and pass whitespace checks.
- Evidence: `docs/cv-bullets.md` and `caseflow-store/.agent/artifacts/d20-t05-cv-bullets.json`.

Current task: `D20-T06 - Create release tag v1.0.0`.

## Domain Model Draft Reference

```ts
type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  compatibility: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
};

type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};
```

## Database Draft

Tables:

- `profiles`
- `categories`
- `products`
- `orders`
- `order_items`

Required constraints:

- `products.slug` unique
- `categories.slug` unique
- `products.price >= 0`
- `products.stock >= 0`
- `order_items.quantity > 0`
- `orders.order_code` unique
- `orders.status` constrained to known values
- order item snapshots store `product_name`, `unit_price`, and `line_total`

Do not create a cart table for this MVP unless the scope changes.

## API Contract Draft

Public:

- `GET /api/products`
- `GET /api/products/[slug]`
- `GET /api/categories`
- `POST /api/cart/validate`
- `POST /api/orders`
- `GET /api/me`

Admin:

- `GET /api/admin/orders`
- `GET /api/admin/orders/[id]`
- `PATCH /api/admin/orders/[id]`

Standard success:

```json
{
  "data": {},
  "error": null
}
```

Standard failure:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ"
  }
}
```

Stable error codes:

- `VALIDATION_ERROR`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_INACTIVE`
- `OUT_OF_STOCK`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `ORDER_CREATE_FAILED`

## Security Rules

- Never trust client price, subtotal, stock, role, or order status.
- Server must read current product data before order creation.
- Server must calculate line totals and subtotal.
- Admin pages and admin APIs must verify session and role.
- RLS should deny by default, then allow only required access.
- Do not put server secrets in `NEXT_PUBLIC_*`.
- Do not log passwords, tokens, full addresses, or full phone numbers.
- Do not collect card data.

## UI Rules

- Read `DESIGN.md` before UI work.
- Mobile baseline: 375px.
- Desktop baseline: 1440px.
- Every form field needs a visible label.
- Interactive controls need focus states.
- Product images need stable dimensions.
- Use accessible names that Playwright can target.
- Avoid animation until the core flow is complete.

## Testing Gates

After code tasks:

```bash
npm run lint
```

After each implementation day:

```bash
npm run lint
npm run build
```

From E2E phase:

```bash
npm run test:e2e
```

Before production:

```bash
npm run lint
npm run build
npm run test:e2e
```

## Schedule Gates

- End Day 2: product domain, app skeleton, and smoke deploy path are clear.
- End Day 5: domain model and API contract are frozen.
- End Day 12: feature freeze.
- End Day 16: integration freeze.
- End Day 18: release candidate.
- End Day 20: production and portfolio acceptance.

## Risk Register

| ID | Risk | Impact | Mitigation |
|---|---|---:|---|
| R-01 | Product domain remains unconfirmed | Closed | Resolved on 2026-07-14; see `docs/domain.md` |
| R-02 | Scope creep | Critical | Freeze features Day 12; cut non-core polish first |
| R-03 | Deploy attempted too late | Critical | Smoke deploy Day 2-3 and preview deploy Day 5/16 |
| R-04 | Supabase issues found too late | High | Proof plan exists; live connection is still blocked by missing credentials |
| R-05 | Mock schema drifts from database schema | Medium | Domain types, Zod schemas, and SQL draft are aligned; mock data must follow them |
| R-06 | Client tampers with price or subtotal | Critical | Server recalculates totals from database |
| R-07 | Order creation is not atomic | Critical | Use transaction/RPC or document stock limitation clearly |
| R-08 | Admin API relies only on UI hiding | Critical | Server session and role check on every admin API |
| R-09 | Secret leaks to client | Critical | Separate public and server-only environment variables |
| R-10 | RLS policy leaks orders | Critical | Deny by default; test anonymous/user/admin |
| R-11 | localStorage cart becomes stale | Medium | Store only productId/quantity; validate before checkout |
| R-12 | UI polish consumes core-flow time | High | Prioritize flow, security, tests, responsive, then polish |
| R-13 | Product images break layout | Medium | Mock image paths exist, but actual image assets still need to be created before UI visual QA |
| R-14 | E2E tests start too late | High | Add testable selectors and skeleton by Day 10 |
| R-15 | Public demo receives spam or real PII | High | Demo notice, validation, honeypot, cleanup plan |
| R-16 | Documentation overgrows the product | Medium | Keep docs useful and short; do not delay implementation |
| R-17 | Project looks like a tutorial clone | High | Add phone-compatibility filter and strong technical evidence |

## Current External Blockers

- Supabase project, app packages, schema, RLS, seed data, local public credentials, and live catalog repository integration are complete.
- Live order persistence, server-owned totals, Supabase admin auth, and the three-role access matrix are complete.
- Vercel account/project permissions are not verified.
- Exact deployment/free-tier constraints must be checked when deployment begins.
