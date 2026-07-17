# Entry 13 - Checkout

Type: real implementation journal entry.

## Goal

Build a checkout flow that validates customer input and recalculates cart totals server-side.

## Work Completed

The `/checkout` route was added with empty-cart handling, contact and shipping form fields, a server-validated cart review, and an over-stock validation state. The cart drawer linked into checkout.

Customer validation used the same domain Zod schemas for full name, email, phone, and shipping address. The order summary came from the server-validated cart, not the client subtotal. The success page stored only enough confirmation data for the immediate post-checkout experience.

## Evidence

- Empty checkout state hid the form and order submission.
- Invalid customer fields showed accessible validation errors.
- Server cart validation drove the order summary.
- Simulated order submission reached checkout success.
- Playwright checkout skeleton was added.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build`: passed.

## Lesson

Checkout is where weak assumptions show up. The flow had to block invalid input before mutation and still revalidate cart content on the server when submitting.
