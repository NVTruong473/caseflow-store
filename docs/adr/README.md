# Architecture Decision Records

This index lists the accepted architecture decisions for CaseFlow Store and the
verified implementation outcome of each decision.

| ADR | Status | Decision | Production outcome |
|---|---|---|---|
| [ADR-0001](0001-use-nextjs-modular-monolith.md) | Accepted | Use a Next.js modular monolith | Storefront, admin UI, and Route Handlers deploy as one Vercel application. |
| [ADR-0002](0002-use-supabase.md) | Accepted | Use Supabase for PostgreSQL and Auth | Five RLS-enabled tables, Supabase Auth admin sessions, and live production persistence are active. |
| [ADR-0003](0003-use-mock-first-development.md) | Accepted | Build domain and UI against mock repositories first | The production runtime uses Supabase repositories through stable domain mapping; mock modules remain only as development history/fixtures. |
| [ADR-0004](0004-use-local-cart.md) | Accepted | Store the guest cart in React Context and localStorage | Only product IDs and quantities persist locally; the server revalidates stock and prices before ordering. |
| [ADR-0005](0005-use-simulated-checkout.md) | Accepted | Simulate checkout without collecting card data | Production creates real database orders but processes no payment and renders no card fields. |

## Status meanings

- **Proposed**: under review and not approved for implementation.
- **Accepted**: approved and currently governs the project.
- **Superseded**: replaced by a newer ADR.
- **Rejected**: considered but not adopted.

## Adding a decision

Create the next numbered Markdown file when a change affects a major boundary,
data model, authentication/authorization model, external service, deployment
model, or established MVP constraint. Include context, decision, alternatives,
consequences, and guardrails, then add it to this index.
