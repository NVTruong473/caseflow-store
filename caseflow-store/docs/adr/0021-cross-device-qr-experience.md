# ADR-0021: Cross-device QR Checkout Experience

- Status: Accepted
- Date: 2026-07-27
- Task: `SECURITY-UX-PLAN-T01`
- Target: `v1.16.0`

## Context

ADR-0019 created a safe, browser-local checkout experience. Its internal
`caseflow-experience://` payload cannot be opened by a normal phone camera and
its completion state cannot return to the desktop that displayed the QR.

The requested experience needs a phone to scan an HTTPS QR, open a transfer
simulation, confirm the server-owned cart total, and update the desktop without
creating a real order or payment.

## Decision

Add an isolated `checkout_experience_sessions` boundary:

1. an authenticated customer submits only edition IDs, quantities, and a
   client request ID;
2. the server reloads active editions and calculates the same standard
   shipping and bank-transfer checkout total;
3. the server creates an expiring experience session with no order, payment,
   stock, voucher, notification, or analytics mutation;
4. the QR contains an HTTPS URL whose opaque capability token is stored in the
   URL fragment so it is not sent in the initial request, server logs, or
   referrer;
5. the phone page sends the token in a POST body, displays demo merchant data,
   and requires the exact total plus a six-digit confirmation code shown on
   the authenticated desktop;
6. an atomic database operation enforces pending-to-completed transition,
   expiry, attempt limits, amount matching, code matching, and idempotency;
7. the desktop polls a bounded status endpoint and updates without reload.

The token and confirmation code are deterministically derived from a
server-only secret, customer ID, and client request ID. The database stores
only hashes. Repeated create requests recover the same session instead of
creating duplicates.

## Security And Commerce Boundary

- The QR page never requests an account password, card data, real bank
  credential, or wallet credential.
- The merchant account number is an unmistakable non-real demo value.
- The experience can operate in Production because it cannot settle money or
  mutate commerce records; all customer-visible screens state that boundary.
- Session access is a 256-bit bearer capability. Creation and cancellation
  require the owning customer session.
- Completion allows a capability holder but also requires the separate
  six-digit code and exact server-owned amount.
- Five failed confirmations lock the session.
- Session expiry uses server/database time and cannot be reset by client
  rerenders or device clock changes.
- RLS exposes no table operations to `anon` or `authenticated`; Route Handlers
  use the service-role repository.
- Secrets are server-only and never use `NEXT_PUBLIC_*`.

## Data And Retention

The table stores customer ID, request ID, token/code hashes, cart fingerprint,
amount, currency, status, failed-attempt count, transfer reference, and
timestamps. It stores no name, email, phone, address, book title, password, raw
token, or raw confirmation code.

Expired sessions may be retained briefly for QA evidence, then deleted by an
operations cleanup. Deleting a customer cascades their experience sessions.

## Alternatives Rejected

- **Put amount and completion state only in the QR:** the phone cannot safely
  synchronize with the desktop and the amount remains client-controlled.
- **Use the account password as transfer PIN:** trains unsafe password reuse
  and exposes an authentication credential to an unrelated simulated form.
- **Reuse the payments table:** would falsely represent an experience as a
  business payment and requires an order foreign key.
- **Put the bearer token in the query string:** increases exposure through
  logs, analytics, browser history, and referrers.
- **Real VietQR or bank deep link:** conflicts with the no-real-money boundary.

## Consequences

The experience becomes testable across devices and closer to a real payment
handoff while remaining technically and commercially separate from checkout.
It adds one table, one atomic RPC, one server-only secret, four API operations,
and one public no-index page.
