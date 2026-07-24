# Commerce Starter Architecture

## Shape

The application is a Next.js modular monolith deployed as one web application.
Supabase provides PostgreSQL, authentication, and row-level security.

```text
Browser
  -> Next.js pages and client components
  -> Route Handlers
  -> application use cases
  -> domain validation and policies
  -> repositories
  -> buyer-owned Supabase
```

## Trust Boundaries

- The server reloads products and calculates prices, discounts, fees, tax, and
  totals.
- Route Handlers validate inputs and repeat authentication/authorization.
- Repositories own persistence and database row mapping.
- Supabase RLS is an additional boundary, not a replacement for server checks.
- Order and payment states remain separate.
- Mock payment completion is disabled in Production.
- External email/SMS delivery remains disabled until configured for a buyer.

## Deployment Boundary

Each buyer receives an isolated repository, Supabase project, Vercel project,
domain, and secret set. No buyer shares the reference showroom's database,
auth tenant, provider accounts, or deployment credentials.

## Deferred Buyer Decisions

Real payment settlement, sender identities, carrier integration, invoicing,
analytics/observability, legal text, catalog rights, and operational support
require buyer-specific design and acceptance.
