# Entry 07 - Order API

Type: real implementation journal entry.

## Goal

Create the order and admin API surface while preserving server-side ownership of prices and statuses.

## Work Completed

`POST /api/orders` was implemented against the mock repository first. It reused cart validation, re-read product data, and recalculated all order totals before accepting an order.

Admin endpoints were added for listing orders and updating order status. The early version used a server-side mock admin token guard, which was appropriate for the mock phase but explicitly temporary.

The API response shape was standardized as `{ data, error, meta }` across public and admin routes. This reduced ambiguity before Supabase and production tests were added.

## Evidence

- `POST /api/orders` returned server-calculated order totals.
- `GET /api/admin/orders` and `PATCH /api/admin/orders/[id]` required admin authorization.
- Tampered client price, subtotal, and status fields were ignored.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, and curl checks passed.

## Lesson

Standardizing the response envelope early made later API contract tests possible. The weak point was the mock admin token, but it was documented and later replaced by Supabase Auth.
