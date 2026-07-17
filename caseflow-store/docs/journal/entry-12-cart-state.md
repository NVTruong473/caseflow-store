# Entry 12 - Cart State

Type: real implementation journal entry.

## Goal

Implement cart behavior without trusting client-side commercial data.

## Work Completed

An in-memory Cart Context was added first, then versioned localStorage persistence. The persisted payload intentionally stored only `{ productId, quantity }` under `caseflow-store.cart.v1`. Price, subtotal, stock, product name, and status were not stored as trusted cart state.

The cart drawer added empty and item states, estimated subtotal, remove, clear, close, backdrop, Escape close, and focus loop behavior. Quantity controls were bounded against stock. Tampered localStorage with over-stock quantity produced a visible error and recovery action.

## Evidence

- Reload persistence worked with the versioned cart schema.
- Cart drawer interaction checks passed on desktop and mobile.
- Tampered localStorage checks exposed over-stock state safely.
- Grep checks confirmed no persisted price/subtotal payload.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build`: passed.

## Lesson

Local cart was acceptable because it was treated as a request draft, not as source of truth. This kept the MVP simple without weakening price and stock integrity.
