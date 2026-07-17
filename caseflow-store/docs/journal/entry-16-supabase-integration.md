# Entry 16 - Supabase Integration

Type: real implementation journal entry.

## Goal

Move from mock data to live Supabase-backed catalog and order persistence.

## Work Completed

A Supabase project was created and the schema SQL was applied. RLS was enabled for profiles, categories, products, orders, and order items. Categories and products were seeded into Supabase from the validated mock catalog.

Typed Supabase clients were added for browser and server use. Row-to-domain mappers converted snake_case database rows to camelCase domain objects and parsed mapped objects through Zod schemas. Storefront catalog reads, product/category APIs, cart validation, cart drawer, and checkout catalog reads moved from mock data to Supabase.

Atomic live order creation was added through a server-only service client and a restricted `security definer` RPC.

## Evidence

- Supabase schema verification found 5 expected tables and no cart table.
- Seed verification found 5 categories and 16 products.
- Live APIs returned expected catalog counts.
- Cart subtotal for two AeroGuard cases was `658000`.
- Order persistence created and cleaned live QA orders.
- Lint, TypeScript, and production build passed.

## Lesson

The mock-first architecture paid off because the UI and API contracts were already shaped. The hard part became mapping, validation, RLS, and service-role containment rather than rebuilding product flows.
