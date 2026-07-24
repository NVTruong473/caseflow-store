# Template Engineering Rules

## Product Boundary

This repository is a configurable single-store commerce template. It is not a
multi-tenant SaaS, marketplace, payment processor, logistics platform, or
legally launch-ready business.

## Security

- Never trust price, discount, stock, role, order state, or totals from the
  browser.
- Validate mutating inputs on the server.
- Repeat auth and role checks in Route Handlers and repositories.
- Never expose service-role keys, provider credentials, or webhook secrets
  through `NEXT_PUBLIC_*` variables or Client Components.
- Keep external providers disabled until buyer-owned credentials, contracts,
  and security review exist.

## Buyer Isolation

- Use a buyer-owned private repository, Supabase project, Vercel project,
  domain, and secrets.
- Never connect this template or a buyer instance to the showroom database.
- Replace catalog, brand, support, policy, and provider configuration before
  buyer acceptance.

## Quality

- Read `docs/architecture.md` and `docs/setup.md` before changing boundaries.
- Prefer the existing Next.js modular-monolith and layered use-case/repository
  conventions.
- Run lint, TypeScript, architecture checks, tests appropriate to the change,
  and a production build.
- Run Playwright only against an isolated buyer/test Supabase project.
