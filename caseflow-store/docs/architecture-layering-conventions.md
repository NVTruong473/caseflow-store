# Architecture Layering Conventions

Date: 2026-07-22

Task: `ARCH-LAYER-T03`

## Preferred Shape

CaseFlow Books uses a Next.js modular monolith with layered boundaries:

```text
Route Handler / Controller
  -> Application Use Case
  -> Domain Policy and Validation
  -> Repository
  -> Supabase/PostgreSQL
```

## Controller Rules

Route Handlers under `src/app/api/**/route.ts` should:

- parse HTTP request bodies and query strings;
- run request DTO validation;
- call a use case or service;
- map results through the stable `{ data, error, meta }` envelope;
- avoid multi-step business orchestration when a use case exists.

## Use Case Rules

Use cases under `src/lib/use-cases/**` should:

- coordinate one business workflow;
- call auth helpers, policies, validators, repositories, and services;
- own rollback/compensation logic for the workflow;
- return typed success/failure results instead of raw `NextResponse`.

Use cases must not import UI components, feature components, or app routes.

## Repository Rules

Repositories under `src/lib/repositories/**` should:

- perform persistence reads/writes;
- map database rows into domain objects;
- call Supabase RPCs;
- validate database-shaped data.

Repositories must not import UI components, feature components, app routes, or
`next/server`.

## DTO And API Rules

- Request schemas live in `src/lib/validation/**`.
- Stable API error codes live in `src/lib/api/error-codes.ts`.
- Controllers return only the stable API envelope.
- Business failures use typed use-case results; unexpected persistence failures
  may be caught by the use case and converted into stable API errors.

## Import Direction

Allowed direction:

```text
src/app/api -> src/lib/use-cases -> src/lib/repositories
src/app/api -> src/lib/api
src/lib/use-cases -> src/lib/auth, src/lib/checkout, src/lib/orders, src/lib/payments, src/lib/repositories, src/lib/validation
src/lib/repositories -> src/lib/supabase, src/lib/validation, src/types
```

Disallowed direction:

```text
src/lib/repositories -> src/features
src/lib/repositories -> src/components
src/lib/repositories -> src/app
src/lib/repositories -> next/server
src/lib/use-cases -> src/features
src/lib/use-cases -> src/components
src/lib/use-cases -> src/app
```
