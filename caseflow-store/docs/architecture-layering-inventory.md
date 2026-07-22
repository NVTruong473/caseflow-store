# Architecture Layering Inventory

Date: 2026-07-22

Task: `ARCH-LAYER-T02`

## Method

Route Handlers under `src/app/api/**/route.ts` were reviewed by size and
responsibility. The goal is not to make every file tiny; it is to identify
routes where HTTP handling, business orchestration, persistence, and rollback
logic are mixed in one file.

## Summary

| Route group | Current shape | Risk | Decision |
|---|---|---:|---|
| `POST /api/orders` | 235-line controller that handles auth, cart validation, promotion, voucher reservation, totals, order creation, and rollback. | High | Refactor first into `createBookOrderUseCase`. |
| `/api/payments/**` | Already delegates to `src/lib/payments/service.ts` and repository/provider modules. | Low | Keep shape; protect with boundary verifier. |
| `/api/admin/**` | Several medium controllers call admin repositories and validation directly. | Medium | Leave behavior unchanged for v1.12; future use-case extraction can target order operations/promotions. |
| `/api/customer/**` | Medium controllers for profile, password, orders, and session. | Medium | Leave behavior unchanged for v1.12; future use-case extraction can target profile/password/cancel order. |
| Public catalog routes | Mostly read-only controllers with validation and repository calls. | Low | No refactor in v1.12. |

## Highest-Risk Route

`src/app/api/orders/route.ts` is the highest-risk file because it mixes:

- JSON parsing and request DTO validation;
- customer session and role checks;
- checkout profile completeness checks;
- account contact confirmation;
- server-side cart validation;
- promotion and signup voucher eligibility;
- signup voucher reservation;
- trusted total calculation;
- order transaction creation;
- signup voucher confirmation;
- signup voucher rollback on failure;
- API response mapping.

That logic is business orchestration and belongs in an application use case.

## v1.12 Scope

Refactor only the high-risk order creation route and add boundary verification.
This is intentionally conservative because the app is already released and
production verified.
