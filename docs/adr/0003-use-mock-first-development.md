# ADR-0003: Use Mock-First Development

- Status: Accepted
- Date: 2026-07-14

## Context

The project must be developed quickly and verified locally. Waiting for database setup before building UI can block progress.

## Decision

Build domain types, validation schemas, mock data, and repository interfaces before connecting Supabase. UI should depend on domain objects, not database rows.

## Alternatives Considered

- Build directly against Supabase from the start.
- Build UI with hardcoded component-local data.

## Consequences

Positive:

- UI can be tested early.
- API contract can stabilize before integration.
- Supabase integration can replace repository implementation later.

Negative:

- Mock schema can drift from database schema.
- Mapping layer requires discipline.

## Guardrail

Use shared TypeScript types and Zod schemas. Database rows must be mapped into domain objects before reaching UI.
