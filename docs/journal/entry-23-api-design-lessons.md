# Entry 23 - API Design Lessons

Type: retrospective note, not an additional development day.

## What Held Up

The `{ data, error, meta }` envelope made route behavior predictable. It helped product, cart, order, and admin endpoints return consistent shapes instead of ad hoc payloads.

Stable error codes became especially useful after production and E2E tests were added. Tests could assert `PRODUCT_NOT_FOUND`, `UNAUTHORIZED`, `VALIDATION_ERROR`, and `OUT_OF_STOCK` rather than brittle message text.

Server-side recalculation was the most important API rule. Cart validation and order creation ignored browser-provided price, subtotal, stock, role, and order status.

## What Was Risky

The initial mock admin token was acceptable only because it was temporary and replaced before production. Leaving that in place would have undermined the project.

## Portfolio Takeaway

The API layer shows defensive design: validate input, return stable errors, keep browser intent separate from trusted business calculations, and test failure paths.
