# ADR-0002: Use Supabase For Database And Auth

- Status: Accepted
- Date: 2026-07-14

## Context

The MVP needs PostgreSQL persistence, simple authentication for admin, and a free or low-cost deployment path. Building custom auth would waste time and add security risk.

## Decision

Use Supabase PostgreSQL and Supabase Auth.

## Alternatives Considered

- MongoDB
- Firebase
- Custom PostgreSQL hosting plus custom auth
- Local-only JSON/mock data

## Consequences

Positive:

- PostgreSQL supports relational order data well.
- Auth is available without building password handling.
- RLS supports access control.
- Good fit for Vercel-hosted Next.js.

Negative:

- RLS can be misconfigured.
- Free-tier behavior and limits must be checked near deployment.
- Supabase client/server boundaries must be handled carefully in Next.js.

## Guardrail

Do not expose Supabase service secrets to client code. Test anonymous, normal user, and admin access before production.
