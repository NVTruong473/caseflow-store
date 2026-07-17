# Entry 04 - Domain Model

Type: real implementation journal entry.

## Goal

Convert the selected product domain into stable TypeScript and runtime contracts.

## Work Completed

The product domain was confirmed as phone accessories for the `v1.0.0` MVP. Categories were defined for phone cases, screen protectors, chargers, cables and adapters, and stands and mounts. The domain-specific feature was compatibility filtering by phone model.

TypeScript types were created for `Category`, `Product`, `CartItem`, `Order`, and `OrderItem`. Runtime Zod schemas followed, including validation for slugs, IDs, ISO timestamps, integer VND money amounts, stock quantities, cart quantities, compatibility labels, customer fields, order codes, and order-item line totals.

The mock catalog added 5 categories and 16 products, parsed through the Zod schemas at module import time.

## Evidence

- `src/types/domain.ts` added the domain types and constants.
- `src/lib/validation/domain.ts` added Zod schemas.
- Runtime import reported 5 categories, 16 products, and 6 featured products.
- `npm run lint` and `npx tsc --noEmit`: passed.

## Lesson

The strongest early decision was treating mock data as validated data, not loose demo content. That made later Supabase mapping and API validation less ambiguous.
