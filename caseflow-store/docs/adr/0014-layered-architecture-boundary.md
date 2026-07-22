# ADR-0014: Layered Architecture Boundary For Mutating APIs

- Status: Accepted
- Date: 2026-07-22
- Planning task: `ARCH-LAYER-T01 - Adopt Layered Architecture Boundary`

## Context

CaseFlow Books is a Next.js modular monolith, not a classic MVC application.
That remains the right deployment shape for this portfolio: one Vercel app
contains pages, Route Handlers, customer flows, admin/staff operations,
repositories, Supabase integration, and tests.

The strict review gap is not framework choice. The gap is that some important
Route Handlers still coordinate too much business logic directly. The clearest
example is `POST /api/orders`, which validates the request, checks customer
state, validates the cart, evaluates promotions, reserves account vouchers,
calculates trusted totals, creates the order, confirms the voucher, and rolls
back the voucher on failure.

That works, but it is harder to explain as enterprise-style architecture. A
business reviewer expects a clearer boundary between request handling,
application orchestration, domain policy, and persistence.

## Decision

Keep the Next.js modular monolith from ADR-0001. Do not force textbook MVC.
Adopt a layered boundary for high-risk mutating APIs:

```text
Route Handler / Controller
  -> Application Use Case
  -> Domain Policy / Validation
  -> Repository
  -> Supabase/PostgreSQL
```

The first implementation target is order creation because it is the highest
value and highest risk flow. Payment already has a service/repository split and
will be validated by boundary rules rather than rewritten for style.

## Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `src/app/api/**/route.ts` | Parse HTTP input, validate request DTOs, call use cases/services, map results to `{ data, error, meta }`. |
| `src/lib/use-cases/**` | Coordinate application workflows: auth, validation, business steps, rollback, and repository calls. |
| `src/lib/policies/**` and focused domain modules | Pure or near-pure business rules such as status transitions, totals, permissions, and eligibility. |
| `src/lib/repositories/**` | Persistence, row mapping, Supabase RPC calls, and database-specific checks. |
| `src/lib/validation/**` | Zod request and domain DTO validation. |
| `src/lib/api/**` | Stable API response envelope, error codes, and controller result mapping. |

## Guardrails

- Do not split the app into a separate backend unless a new blocker ADR is
  accepted.
- Do not change the stable API response envelope.
- Do not change runtime behavior only to satisfy a naming pattern.
- Do not let repositories import UI components, features, Route Handlers, or
  `next/server`.
- Do not let use cases import UI components, features, or app routes.
- Keep controller refactors covered by local and production E2E checks.

## Alternatives Considered

### Classic MVC

Rejected. Next.js App Router already has page and Route Handler conventions.
Forcing controller/model/view folders would fight the framework and add
ceremony without improving runtime quality.

### No Architecture Refactor

Rejected. The app already works, but the high-risk order route is too dense for
a strict architecture review. A small use-case extraction improves clarity and
interview defensibility.

### Full Rewrite Into Clean Architecture

Rejected. The project is stable and released. A sweeping rewrite would create
regression risk and violate the current post-release guardrails.

## Consequences

Positive:

- High-risk routes become easier to test and explain.
- Business workflows can be reviewed without HTTP boilerplate.
- Repository and controller boundaries are easier to enforce with a script.
- The project gains stronger enterprise architecture evidence without changing
  the product surface.

Negative:

- Adds another layer and some indirection.
- Partial adoption must be documented honestly; not every historical route is
  immediately refactored.

## Verification

- Add an architecture boundary verifier.
- Refactor `POST /api/orders` into a use case.
- Run lint, TypeScript, production build, E2E, architecture verifier, security
  scans, and production smoke before any release.
