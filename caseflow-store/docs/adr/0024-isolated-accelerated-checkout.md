# ADR-0024: Isolated Accelerated Checkout

- Status: Accepted
- Date: 2026-07-28
- Decision owner: CaseFlow Books
- Release target: `v1.17.0`

## Context

The product-detail page currently requires every customer to add an edition to
the browser-local cart before checkout. That path is correct for multi-book
shopping, but it adds an unnecessary cart-review step for a customer who has
already chosen one edition and quantity.

Shopify documents accelerated checkout as a product-page alternative that
skips the cart for a single product. Baymard's checkout research also records
checkout length and perceived complexity as avoidable abandonment causes.
Neither source justifies skipping trusted totals, stock validation, customer
identity, shipping details, or final order confirmation.

## Decision

CaseFlow Books will provide two explicit product-detail actions:

1. `Buy now / Mua ngay` starts an isolated accelerated checkout for the selected
   edition and quantity.
2. `Add to cart / Thêm vào giỏ` keeps the existing multi-item shopping path.

The accelerated selection is represented by a minimal same-origin URL intent:

```text
/checkout?mode=buy-now&editionId=<uuid>&quantity=<integer>
```

The URL contains no price, discount, shipping fee, tax, customer data, payment
state, or authorization claim. The checkout route parses the intent with a
strict shared schema and passes only the edition ID and quantity to the client.

The existing `/api/cart/validate` and `/api/orders` boundaries remain
authoritative. They reload the edition, stock, price, promotion eligibility,
shipping, VAT, fees, and final total from server-owned data. Browser input is
never a trusted total.

## Cart Isolation

- Buy Now does not add, replace, merge, or remove any cart line.
- Existing cart contents remain visible in the header and cart drawer.
- The accelerated checkout displays and submits only the selected edition.
- A successful Buy Now order clears only the checkout attempt state, not the
  browser cart.
- Standard cart checkout retains its existing clear-after-order behavior.

## Authentication Resume

If the customer is not signed in, the checkout route redirects to the existing
account page with the complete validated checkout path encoded as `next`.
Successful sign-in returns to the same Buy Now intent. Invalid or malformed
intents fail closed and do not fall back to silently purchasing the cart.

## UI Rules

- `Mua ngay` is the primary action on the product-detail purchase panel.
- `Thêm vào giỏ` remains a visible secondary action.
- Buy Now is not added to dense catalog cards, where accidental activation and
  repeated controls would reduce scan quality.
- Checkout states clearly identify the direct-purchase scope and state that the
  existing cart is unchanged.
- The official and QR experience tabs both consume the same server-validated
  direct-purchase selection.

## Alternatives Rejected

### Add the item to cart and redirect

Rejected because existing cart items could be purchased unintentionally.

### Replace the cart with the selected item

Rejected because it destroys customer data and creates surprising back
navigation behavior.

### Store the intent only in `sessionStorage`

Rejected because URL intent is simpler, survives refresh and authentication
redirects, and remains safe when it carries no trusted value.

### One-click order creation

Rejected because the customer must still confirm address, delivery, payment
method, fees, VAT, discount, and final total.

## Guardrails

- No database migration or new dependency.
- No price or total in the URL.
- No order creation from the product page.
- No cart mutation from Buy Now.
- Invalid intent shows a recoverable state.
- Quantity remains bounded by client schema and server stock validation.
- Existing API envelope and layered order-creation boundary remain unchanged.
- Focus, disabled, loading, bilingual, mobile, and no-overflow states are
  required.

## Verification

- Shared intent parser unit-level assertions through E2E route behavior.
- Anonymous Buy Now resumes after sign-in with the complete intent.
- Checkout validates and shows only the selected edition and quantity.
- Existing cart remains unchanged before and after Buy Now order creation.
- Standard cart checkout still clears the cart after successful order creation.
- QR experience uses the direct-purchase amount without creating an order.
- Invalid UUID, quantity, unavailable stock, and modified URL inputs fail
  safely.
- Focused Playwright at mobile and desktop, followed by the full release gate.

## References

- [Shopify: accelerated checkout buttons](https://help.shopify.com/en/manual/online-store/themes/os/customize/dynamic-checkout)
- [Baymard: checkout usability and abandonment](https://baymard.com/blog/ecommerce-checkout-usability-report-and-benchmark)
