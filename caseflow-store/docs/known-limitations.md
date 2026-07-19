# Known Limitations

This document records the intentional boundaries and accepted risks of
CaseFlow Books through the latest `v1.5.0` QR demo payment release.
These items are not hidden production capabilities; they define where the
portfolio release stops.

## Commerce scope

### Payments are simulated

Checkout supports COD, bank transfer, wallet/provider-style choices, and a
development/sandbox QR payment experience. No real provider is integrated. The
app does not collect card numbers, CVV, card expiry, bank-login data, wallet
credentials, real QR payment confirmations, or real provider webhooks.

**Current control:** payment method choices produce pending or awaiting
confirmation states, and server code calculates the final stored VND totals.
QR demo sessions read `orders.total_vnd` on the backend, use demo bank
configuration, verify mock webhook HMAC signatures, and are locked when
`NODE_ENV=production`.

**Next step:** integrate a real provider only after a new ADR covers provider
selection, webhook verification, idempotency, reconciliation, refunds, failure
states, and sensitive-data handling.

### QR demo is not a production payment rail

`v1.5.0` adds a realistic QR waiting page, mock gateway flow, VietQR demo
payload, countdown, polling, and paid-state simulation for local/development
verification. It is intentionally disabled for production settlement and should
not be turned into live payment by only replacing the demo account number.

**Current control:** production runtime denies QR demo payment creation and the
simulate-success endpoint unless the app is running outside production with
explicit demo flags. The QR UI marks sandbox payment as demo where it is
available.

**Next step:** use an official provider, real merchant onboarding, webhook
secret management, HTTPS callback validation, reconciliation, refunds,
chargeback/failure handling, monitoring, and a separate security review.

### Phone and email are not truly verified

Customer checkout requires profile/contact fields, and those fields are
validated for shape and completeness. CaseFlow Books does not send real SMS
OTPs or provider-backed email verification.

**Current control:** checkout readiness prevents missing or malformed profile
data, but documentation avoids claiming verified phone numbers or verified email
ownership.

**Next step:** add SMS/email verification through a real provider with rate
limits, retry windows, abuse monitoring, and recovery flows.

### Shipping, VAT, FX, and fees are estimates

The app calculates server-owned shipping, VAT, payment fee, and English-mode
USD estimates. These are configurable demo assumptions, not legal tax advice,
shipping-carrier quotes, or bank-guaranteed exchange rates.

**Current control:** VND remains the source-of-truth stored currency. USD is
displayed as an approximation.

**Next step:** connect real shipping/tax/FX providers only after documenting
jurisdiction, rounding, invoice, refund, and reconciliation rules.

### Stock is validated, not fully reserved

The server reloads each book edition and rejects quantities above current stock
before order creation. The current flow records order and item snapshots, but it
is not a full reservation system with expiring holds and conflict recovery.

**Current control:** inventory status and stock quantity are checked server-side
and admin inventory adjustments are recorded.

**Next step:** decrement or reserve stock inside the same database transaction,
add conflict messaging, and define restock/cancel behavior.

### Cart remains browser-local

The cart stores only edition IDs and quantities in React Context/localStorage.
It does not sync across devices, browsers, or authenticated identities.

**Current control:** the server revalidates active edition status, price,
promotion, stock, VAT, shipping, payment fee, and totals before checkout.

**Next step:** add a server cart only when cross-device account behavior justifies
merge rules, expiry rules, and abandoned-cart cleanup.

## Customer and admin scope

### Customer cancellation is intentionally limited

Signed-in customers can view their own order history and cancel eligible orders
while they are still in early operational states. They cannot cancel orders
after fulfillment or payment has moved beyond the accepted cancellation window.

**Current control:** the customer cancellation API checks the authenticated
customer, order ownership, order status, payment status, and shipping status on
the server before setting order, payment, and shipping states to cancelled.

**Next step:** add a full cancellation policy workflow with refund handling,
stock release/reservation semantics, staff approval windows, and customer
notifications before accepting real commercial traffic.

### Public tracking lacks production abuse protection

Public order tracking requires order code plus matching email or phone and
returns tracking-safe fields. It is not protected by production CAPTCHA, request
rate limiting, device fingerprinting, or abuse-alert workflows.

**Current control:** wrong-contact and missing-order lookups use the same
not-found response, and raw customer email, phone, address, and item details are
not exposed in the public tracking response.

**Next step:** add rate limiting, alerting, signed lookup links, or CAPTCHA
before accepting real customer traffic.

### Personal-data governance is incomplete

Customer profile, order, contact, and shipping data are stored for the demo
workflow. There is no automated retention/deletion workflow, consent-management
screen, export/delete request handling, or privacy operations runbook.

**Current control:** field shapes and lengths are validated, sensitive payment
data is not collected, and operational customer views minimize raw address/phone
exposure.

**Next step:** define retention, deletion, consent, access logging, and data
subject request workflows before using the deployment as a live business system.

### Admin operations are functional but not enterprise-grade

Admin/staff roles cover dashboard, order operations, catalog, inventory,
promotions, customers, settings, and exports. The system does not yet include
MFA enforcement, append-only audit logs for every admin action, staff invitation
flows, or per-record approval workflows.

**Current control:** server pages and Route Handlers repeat session, role, and
permission checks. UI hiding is not treated as an authorization boundary.

**Next step:** add MFA, audit events, staff lifecycle management, finer-grained
permissions, and alerting before expanding real operational access.

## Catalog and content scope

### Book metadata is curated demo content

The 100-edition catalog uses factual classic/public-domain-style metadata where
practical and self-written summaries. It is not a licensed commercial book data
feed, publisher inventory sync, or bibliographic authority database.

**Current control:** the project avoids copied publisher blurbs, reviews, and
protected excerpts. Rights assumptions are documented in `docs/domain.md`.

**Next step:** use a licensed metadata provider or explicitly permitted source
before presenting the catalog as commercial production data.

### Cover assets are illustrative, not licensed publisher covers

The active v1.2 catalog uses 100 project-created SVG cover illustrations with
stable local references. It does not hotlink or copy commercial book covers,
marketplace images, publisher marks, or protected layouts.

**Current control:** cover provenance and safe-asset rules are documented in
`docs/v1.2-cover-portfolio.md` and `docs/v1.1-safe-cover-asset-strategy.md`.
Missing or placeholder cover states remain available only as fallback/admin
quality states.

**Next step:** add a media pipeline only after defining licensing, uploads,
image processing, CDN caching, alt text, and takedown handling.

## Production operations

### Security headers are not a complete security program

The `v1.4.2` patch adds runtime security headers, CSP, no-store cache policy on
protected/API surfaces, and a security posture verifier. These controls reduce
common browser-side and response-handling risks, but they are not equivalent to
a full security operations program.

**Current control:** public, account, admin, checkout, and API routes are
checked by `scripts/verify-security-posture.ts`, and final QA smoke verifies
the app still works after the header policy.

**Next step:** add rate limiting, WAF/bot controls, admin MFA, append-only
audit logs, strict nonce-based CSP, monitoring/alerting, incident response, and
backup-restore drills before treating the app as a real commercial system.

### Managed deployment is not a full operations program

The application uses managed Vercel and Supabase services without a documented
SLO, load test, alert routing, incident response runbook, disaster-recovery
exercise, or automated backup-restore test.

**Current control:** release acceptance covers local gates, production smoke,
Playwright checks, cleanup, deployment status, and secret scan.

**Next step:** add request metrics, error monitoring, alerts, load baselines,
backup-restore drills, and incident playbooks before claiming commercial
availability.

## Accepted dependency advisory

At the latest release gate, `npm audit --audit-level=high` passed. The known
moderate advisory remains inherited through Next.js/PostCSS and is documented
because the available automated forced fix proposes a breaking downgrade path.
At the original `v1.2` release audit, `npm audit --audit-level=moderate`
reported:

- 0 critical
- 0 high
- 2 moderate
- 0 low

Both moderate findings are inherited through Next.js 16.2.10 and PostCSS
8.4.31. `npm view next version` reported Next.js 16.2.10 as the current latest
version during the check, and `npm audit fix --force` proposed a breaking
downgrade to Next.js 9.3.3, so the unsafe automated fix was rejected.

**Next step:** monitor upstream Next.js/PostCSS updates and apply a compatible
patched release, then rerun TypeScript, lint, build, Playwright, production
smoke, and dependency audit.
