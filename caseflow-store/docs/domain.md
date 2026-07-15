# CaseFlow Store - Domain Decision

## Status

- Task: `D03-T01 - Confirm final product domain, categories, and domain-specific feature`
- Date: 2026-07-14
- Status: accepted by user-delegated selection

The user asked the agent to propose the best suitable option and continue with the next step. Based on the existing roadmap, the selected domain is phone accessories.

## Decision

CaseFlow Store will be a small e-commerce MVP for phone accessories.

### Categories

| Slug | Name | Reason |
|---|---|---|
| `phone-cases` | Phone cases | Clear visual product type and easy mock inventory |
| `screen-protectors` | Screen protectors | Natural compatibility-driven category |
| `chargers` | Chargers | Useful for stock, price, and checkout examples |
| `cables-adapters` | Cables and adapters | Common accessory category with broad compatibility |
| `stands-mounts` | Stands and mounts | Adds variety without operational complexity |

### Domain-Specific Feature

The domain-specific feature is compatibility filtering by phone model.

Initial compatibility labels:

- `iPhone 13`
- `iPhone 14`
- `iPhone 15`
- `iPhone 16`
- `Galaxy S23`
- `Galaxy S24`
- `Galaxy S25`
- `Pixel 8`
- `Pixel 9`
- `Universal`

### Initial Seed Target

Use 16 demo products:

- 4 phone cases
- 3 screen protectors
- 3 chargers
- 3 cables and adapters
- 3 stands and mounts

## Rationale

Phone accessories are specific enough to avoid a generic tutorial clone, but small enough for a 20-day MVP. Compatibility filtering gives the project a clear domain behavior without requiring real payments, shipping integrations, recommendations, reviews, or vendor management.

## Scope Boundaries

- Do not build a full device database in the MVP.
- Store compatibility as a small string list, not a normalized phone-model table.
- Do not create variant/SKU complexity unless a later ADR explicitly approves it.
- Do not add real payment, reviews, wishlist, or recommendation features.
- Do not let product-copy polish block cart, checkout, admin authorization, or server-side validation.

## Acceptance Criteria

- Product domain is documented.
- Categories are documented.
- Domain-specific feature is documented.
- Roadmap can move from `D03-T01` to `D03-T02`.
- Schema and mock data work can use this document as the source of truth.
