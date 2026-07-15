# Supabase Proof Of Connection Plan

## Status

- Task: `D03-T06 - Create Supabase proof-of-connection plan or project if credentials are available`
- Date: 2026-07-14
- Status: plan created; connection not attempted
- D13-T01 check: blocked on 2026-07-15 because account/project access is not available locally
- D13-T01 unblock attempt: still blocked on 2026-07-15 because both in-app browser and Chrome require Supabase sign-in
- D13-T01 completion: Supabase project `caseflow-store` was created and verified on 2026-07-15
- D13-T03 completion: `caseflow-store/supabase/schema.sql` was applied successfully on 2026-07-15
- D13-T04 completion: RLS and direct role privileges were verified on 2026-07-15
- D13-T05 completion: catalog seed data was inserted and verified on 2026-07-15
- D14-T01 completion: typed Supabase browser/server client factories were added and compiled on 2026-07-15
- D14-T03 completion: local public credentials and the live storefront catalog repository were verified on 2026-07-15
- D15-T01 completion: server-only credentials and atomic order persistence were verified on 2026-07-15
- D15-T02 completion: server-owned price, stock, and subtotal calculation was verified on 2026-07-15
- D15-T03 completion: dedicated Supabase admin identity and profile role were verified on 2026-07-15
- D15-T04 completion: Supabase cookie sessions and server-side admin authorization were verified on 2026-07-15
- D15-T05 completion: anonymous, customer, and admin access matrix passed on 2026-07-15

Supabase project metadata:

- Organization: `NVTruong473's Org`
- Project ref: `fcsuldrerhbynwotcvyn`
- Dashboard URL: `https://supabase.com/dashboard/project/fcsuldrerhbynwotcvyn`
- Public project URL: `https://fcsuldrerhbynwotcvyn.supabase.co`

The public project URL, anon key, and server-only service-role credential are configured in an ignored `.env.local`. The service-role credential is not exposed through a `NEXT_PUBLIC_*` variable or Client Component. Supabase CLI is not installed.

Supabase app packages are installed in `caseflow-store`:

- `@supabase/supabase-js` `^2.110.5`
- `@supabase/ssr` `^0.12.3`

Supabase client code exists in `caseflow-store`:

- `src/types/supabase.ts`
- `src/lib/supabase/env.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`

Client factory verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

Schema verification:

- SQL Editor result: `Success. No rows returned`.
- Expected table count: `5`.
- Tables: `categories`, `order_items`, `orders`, `products`, `profiles`.
- Cart table count: `0`.
- `order_status` type count: `1`.
- Trigger count: `4`.
- Policy count: `3`.
- RLS enabled flags: true for all 5 schema tables.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t03-schema-verification.png`.

RLS verification:

- Explicit Data API grants/revokes were added to `caseflow-store/supabase/schema.sql` and applied.
- `anon` can select `categories` and `products`.
- `anon` cannot select `profiles`.
- `anon` and `authenticated` cannot directly select or insert `orders` or `order_items`.
- `authenticated` can select `profiles`, `categories`, and `products`.
- Rollback behavior test under role `anon` saw only active category/product data.
- Rollback cleanup check returned 0 temporary `rls-t04` products, orders, and order items.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t04-rls-behavior-check.png`.

Seed verification:

- Seed file: `caseflow-store/supabase/seed.sql`.
- Seed source: `caseflow-store/src/data/mock/catalog.ts`.
- Categories inserted or updated: `5`.
- Active categories: `5`.
- Products inserted or updated: `16`.
- Active products: `16`.
- Featured products: `6`.
- Product counts by category:
  - `chargers`: `3`
  - `phone-cases`: `4`
  - `stands-mounts`: `3`
  - `cables-adapters`: `3`
  - `screen-protectors`: `3`
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t05-seed-verification.png`.

Atomic order persistence verification:

- `public.create_order_with_items(...)` inserts the order and its items in one PostgreSQL transaction.
- Function execution is revoked from public, anon, and authenticated roles and granted only to `service_role`.
- Forced constraint failure produced zero orphan orders and zero orphan items.
- A live server repository check created one order with one item and cleaned both rows successfully.
- Invalid trusted-command subtotal was rejected before the write boundary.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t01-service-role-verification.png`.

Server-owned checkout verification:

- `POST /api/orders` accepts customer data plus product IDs and quantities, then reads current catalog rows before persistence.
- Forged browser price, product name, line total, and subtotal fields were ignored.
- Quantity 2 of AeroGuard persisted unit price `329000` and subtotal `658000`.
- Missing-product and out-of-stock checks returned 404 and 409.
- Playwright checkout passed `2/2`; created QA orders were removed afterward.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t02-live-order-success.png`.

Admin identity verification:

- A dedicated synthetic Auth user was created and email-confirmed through the trusted Admin API.
- Its matching `profiles` row has role `admin`.
- Public password sign-in succeeded and the session read its own admin profile through RLS.
- Generated credentials remain only in ignored `.env.local`, whose local permissions are `0600`.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t03-supabase-admin-account.png`.

Admin authorization verification:

- Mock header tokens and browser admin `sessionStorage` were removed.
- Login/logout uses Supabase SSR cookies; Next.js Proxy refreshes sessions only.
- Admin pages and APIs independently verify `auth.getUser()` and the caller's own profile role.
- Anonymous access returned 401 or redirected; wrong credentials returned 401.
- Admin access listed a live order and persisted a status update; sign-out restored 401.
- Production build checks passed and all QA orders were removed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t04-protected-admin-orders.png`.

Final access matrix:

- Anonymous users can read active catalog data but receive 401/redirect for admin access and cannot query orders directly.
- Authenticated customers can read their own `customer` profile but receive 403/redirect for admin access and cannot query orders directly.
- Admins can list and update orders through protected Next.js APIs; direct order-table access remains denied so the service boundary stays authoritative.
- Focused access tests passed `3/3`; full production Playwright passed `12/12`.
- Cleanup left zero test orders and zero temporary customer users.
- A scan of 26 client assets found zero service-role or admin-password value leaks.
- Visual artifacts: `caseflow-store/.agent/artifacts/d15-t05-customer-forbidden.png` and `caseflow-store/.agent/artifacts/d15-t05-admin-access-matrix.png`.

## Required Credentials

Create `caseflow-store/.env.local` from `caseflow-store/.env.example` when a real Supabase project exists:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Playwright only; do not configure these in the deployed app runtime.
CASEFLOW_ADMIN_EMAIL=
CASEFLOW_ADMIN_PASSWORD=
```

Rules:

- Never commit `.env.local`.
- Never place `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable.
- Treat `CASEFLOW_ADMIN_EMAIL` and `CASEFLOW_ADMIN_PASSWORD` as local/CI test-runner values, not application runtime configuration.
- Do not print secret values in logs or step results.
- Use the service role key only in server-side code.

## Proof Steps

1. Create a Supabase project.
2. Add the three Supabase values to `caseflow-store/.env.local`.
3. Apply `caseflow-store/supabase/schema.sql` in a Supabase SQL editor or with a verified local SQL client.
4. Confirm that the expected tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'categories', 'products', 'orders', 'order_items')
order by table_name;
```

5. Confirm RLS is enabled:

```sql
select relname, relrowsecurity
from pg_class
where relname in ('profiles', 'categories', 'products', 'orders', 'order_items')
order by relname;
```

6. Confirm direct public product reads work only for active catalog data.
7. Confirm anonymous users cannot directly read `orders` or `order_items`.
8. Confirm anonymous users cannot directly insert orders. Checkout must go through Next.js Route Handlers.
9. Record command output or screenshots in `.agent/step-results.md`.

## Minimum Acceptance Evidence

- `.env.local` exists locally and remains ignored by Git.
- Supabase URL and anon key are set without exposing their values.
- Service role key is server-only.
- `schema.sql` applies without SQL errors.
- Expected tables exist.
- RLS is enabled.
- Anonymous order read/write attempts fail.
- Public active product/category read path works after seed data exists.

## Current Blockers

- Public Supabase credentials are configured locally and remain ignored by Git.
- Supabase CLI is not installed.
- Supabase runtime packages are installed; CLI is still not installed.
- No `~/.supabase` session/config files were found.
- Authenticated Supabase Dashboard access was verified in Chrome.
- Secure database password handling remains user-managed and was not exposed.
- `psql` is not installed.
- `schema.sql` has been executed against Supabase PostgreSQL.
- Dedicated RLS/policy acceptance is complete.
- Catalog seed data has been inserted.
- Supabase client factories compile.
- Live catalog repository integration is complete.
- Day 15 Supabase order persistence, admin auth, and three-role access verification are complete.
