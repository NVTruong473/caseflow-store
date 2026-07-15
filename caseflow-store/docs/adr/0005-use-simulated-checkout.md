# ADR-0005: Use Simulated Checkout Only

- Status: Accepted
- Date: 2026-07-14

## Context

Real payment integration increases legal, security, testing, and timeline risk. The portfolio goal is to demonstrate product flow, validation, persistence, and admin order management.

## Decision

Use simulated checkout. Do not collect payment card information.

## Alternatives Considered

- Stripe test mode
- Manual bank transfer simulation
- Fake card form

## Consequences

Positive:

- Lower risk.
- Faster delivery.
- No sensitive payment data.
- Clearer MVP scope.

Negative:

- Does not demonstrate payment gateway integration.

## Guardrail

The UI must not include card number, CVV, or expiry fields. README and production UI should state that checkout is a demo.
