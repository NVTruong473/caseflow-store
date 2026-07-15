# ADR-0004: Use localStorage For Guest Cart

- Status: Accepted
- Date: 2026-07-14

## Context

The MVP supports guest checkout. It does not need cross-device cart synchronization.

## Decision

Store guest cart in React Context and localStorage.

Persist only:

```ts
type CartItem = {
  productId: string;
  quantity: number;
};
```

## Alternatives Considered

- Database cart table
- Supabase anonymous user cart
- Session-based server cart

## Consequences

Positive:

- Fast implementation.
- No auth required for shopping.
- Works well for MVP demo.

Negative:

- Cart does not sync across devices.
- Cart can become stale if product price, stock, or active status changes.

## Guardrail

Validate cart with the server before checkout. Do not trust localStorage price, subtotal, stock, or product details.
