# Entry 05 - Database Schema

Type: real implementation journal entry.

## Goal

Draft a Supabase PostgreSQL schema aligned with the TypeScript and Zod domain model.

## Work Completed

The schema draft created `profiles`, `categories`, `products`, `orders`, and `order_items`. It deliberately did not create a cart table because the MVP cart is local to the browser and must be validated server-side before checkout.

The schema included constraints for allowed category slugs, nonnegative product prices, stock quantities, order status, customer fields, compatibility arrays, and order-item line totals. It also added indexes, `updated_at` triggers, and RLS enabled by default.

Public read policies were drafted only for active categories and active products. Public order insert/update policies were intentionally avoided.

## Evidence

- `caseflow-store/supabase/schema.sql` was created.
- Constraint and policy searches passed.
- `psql` and Supabase CLI were not installed locally, so execution was deferred to the Supabase integration phase.

## Lesson

The schema was useful as a design contract before the live database existed. The honest limitation was also important: a SQL draft is not production proof until it is applied and queried against the actual backend.
