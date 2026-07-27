# ADR-0020: Contextual Customer Guidance

- Status: Accepted
- Date: 2026-07-27
- Task: `GUIDANCE-T01`

## Context

CaseFlow Books has a complete customer path, but first-time customers must
discover catalog search, cart controls, the official/experience checkout
boundary, order status, and self-service cancellation without structured help.
Showing the same blocking tutorial on every visit would reduce usability rather
than improve it.

## Decision

Add one reusable, bilingual, accessible slide dialog and four product-specific
tours:

1. end-to-end buying from the storefront;
2. quantity, single-item removal, clear-cart, continue-shopping, and checkout
   controls in the cart drawer;
3. the official order flow versus the isolated QR experience at checkout;
4. order/payment status, details, and eligible customer cancellation in order
   history.

Each tour may open automatically once for an authenticated customer on the
current browser. `Understood` stores only the completed tour identifier in
local storage under a key scoped by the authenticated user ID. Closing without
confirmation suppresses repeat opening only for the current page session.
Every surface keeps an explicit replay control.

## Guardrails

- Guidance cannot mutate cart, checkout, order, payment, voucher, inventory,
  notification, role, or profile state.
- Copy must describe current behavior and must not claim real payment,
  logistics tracking, refunds, or cancellation rights that are not present.
- Guidance storage contains no email, phone, address, order code, price, or
  credential.
- No new dependency, database column, API, or external analytics service is
  introduced.
- Anonymous visitors may replay the cart guide, but automatic first-use
  onboarding is reserved for authenticated customers.
- Escape and close do not mean `Understood`.

## Alternatives Rejected

- **Always open tutorials on every visit:** intrusive and likely to train users
  to dismiss important information.
- **Persist onboarding in Supabase:** adds schema and cross-device profile
  state without a demonstrated business requirement.
- **Separate tutorial pages:** detach instructions from the controls customers
  are trying to understand.
- **Third-party product-tour SDK:** unnecessary dependency and telemetry risk
  for four bounded flows.

## Consequences

The customer gets first-use help and permanent replay access without changing
commerce behavior. Completion is browser-specific; a customer using another
browser may see the tour once again. Cross-device synchronization can be added
later only if a buyer explicitly requires it.
