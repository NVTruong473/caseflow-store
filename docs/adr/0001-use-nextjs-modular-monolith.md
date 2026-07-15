# ADR-0001: Use Next.js Modular Monolith

- Status: Accepted
- Date: 2026-07-14

## Context

The project is a small e-commerce MVP built by one developer within 20 implementation days. It must show full-stack capability, responsive UI, API design, persistence, auth, tests, and deployment.

## Decision

Use one Next.js application containing:

- Storefront UI
- Admin UI
- Route Handlers for APIs
- Repository layer
- Supabase integration

## Alternatives Considered

- Separate React frontend and Express backend
- Microservices
- Serverless functions split across multiple projects

## Consequences

Positive:

- One repository.
- Faster setup.
- Fewer deployment surfaces.
- Same-origin UI/API avoids unnecessary CORS complexity.
- Suitable for Vercel.

Negative:

- Does not demonstrate a separately deployed backend.
- UI and API share deployment lifecycle.

## Guardrail

Do not split frontend/backend unless a real blocker appears and a new ADR is accepted.
