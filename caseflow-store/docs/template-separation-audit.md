# Template Separation Audit

Date: 2026-07-24
Task: `TEMPLATE-T01`

## Result

The released showroom is suitable as a reference implementation but must not be
cloned wholesale for a buyer. A fresh-history, allowlisted export is required.

## Critical Findings

| Finding | Risk | Required control |
|---|---|---|
| The root repository contains more than 2,500 tracked files and extensive release/QA history. | Buyer receives irrelevant evidence and a large, confusing maintenance surface. | Export only buyer-relevant application paths and begin a new Git history. |
| `.agent` contains hundreds of megabytes of screenshots and operational evidence. | Size, privacy, provenance, and accidental Production-detail transfer. | Exclude `.agent` and regenerate buyer-specific evidence later. |
| `.env.example` contains CaseFlow/Vercel defaults and development-only mock settings. | A buyer can mistake reference infrastructure or demo controls for deployable configuration. | Supply neutral values and fail-safe provider defaults in the template. |
| The public asset tree contains externally sourced Gutenberg cover downloads. | Distribution rights and buyer catalog suitability are not guaranteed by the application license. | Exclude downloaded covers; retain only project-created or neutral development assets. |
| Source and historical scripts contain CaseFlow release-specific migrations and verification assumptions. | Buyer onboarding becomes coupled to the showroom's release history. | Keep runtime/schema essentials; separate historical migration tooling from buyer setup. |
| The template has no explicit source-distribution license boundary. | Repository access may be confused with redistribution or resale permission. | Mark the template private and `UNLICENSED`; require a signed buyer agreement. |
| Production build and tests normally discover local environment files. | A template check could accidentally read showroom credentials. | Verify in a fresh directory with no copied `.env.local` or `.vercel`. |

## What The Template Must Preserve

- Next.js modular-monolith runtime and stable API contracts.
- Server-owned price and total calculation.
- Supabase schema, RLS, auth, role, and repository boundaries.
- Catalog, account, checkout, promotion, order, notification, and admin flows.
- Mock-payment Production lock and disabled external-provider defaults.
- Design system, accessibility behavior, tests, and buyer-facing setup docs.

## What The Template Must Not Claim

- a real operating bookstore;
- licensed buyer catalog or cover media;
- live payment settlement, email/SMS delivery, shipping, invoicing, or ERP;
- Production uptime, incident response, legal compliance, or support SLA;
- compatibility with an unknown buyer's data before discovery and migration.

## Decision

Proceed with an automated allowlisted export and private template repository.
Do not create a buyer repository until a real buyer exists.
