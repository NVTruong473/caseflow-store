# Known Limitations

This document records the intentional boundaries and accepted risks of CaseFlow
Store `v1.0.0`. These items are not hidden production capabilities; they define
where the portfolio MVP stops.

## Commerce scope

### Simulated payment and shipping

The checkout persists a real order but does not process payment, calculate tax,
quote shipping, or collect card details. The displayed order total equals the
server-calculated product subtotal.

**Current control:** the checkout, success page, footer, and README state that no
payment is collected.

**Next step:** integrate a payment provider and shipping/tax rules only after a
new ADR covers webhook verification, idempotency, refunds, and data handling.

### Stock is validated, not reserved or decremented

The server reloads each product and rejects quantities above current stock. The
`create_order_with_items` RPC atomically inserts the order and item snapshots,
but it does not decrement `products.stock` or reserve inventory. Concurrent
orders can therefore oversell the displayed quantity.

**Current control:** stock is checked immediately before order creation and
quantity boundaries are enforced in the UI and API.

**Next step:** lock product rows and decrement stock in the same transaction, or
introduce expiring reservations with explicit release behavior.

### Cart is browser-local

The cart stores only product IDs and quantities in React Context/localStorage.
It does not sync across devices, browsers, or authenticated identities and can
become stale between visits.

**Current control:** the server revalidates product activity, price, and stock at
checkout; stale or invalid carts are blocked.

**Next step:** add a server cart only when account or cross-device requirements
justify the extra persistence and merge rules.

## Customer and admin scope

### Guest order follow-up is manual

Customers do not have accounts, order history, a public order lookup, or email
notifications. The success summary is stored in sessionStorage, so a direct link
can show the order code but not reconstruct private order details.

**Current control:** the confirmation page tells the shopper to retain the order
code and does not expose order records through public RLS/API access.

**Next step:** add verified-email notifications or a short-lived, signed order
lookup mechanism without making order codes authorization tokens.

### Personal-data retention and abuse controls are incomplete

Guest name, email, phone, and shipping address are stored for the admin workflow.
There is no automated retention/deletion policy, rate limiter, CAPTCHA, or
production abuse-monitoring workflow.

**Current control:** server validation limits field shapes and lengths; no card
data is collected; release tests remove synthetic QA records.

**Next step:** define retention, deletion, consent, rate limits, alerting, and
demo-data cleanup before accepting real customer traffic. The public deployment
should be treated as a portfolio demo and used with synthetic data.

### Admin authorization is coarse-grained

The data model supports only `customer` and `admin` roles. Admins can list
orders and update status, but there is no MFA requirement, per-action permission
model, status-change audit trail, or staff management UI.

**Current control:** Supabase Auth supplies cookie sessions; both server pages and
Route Handlers repeat the server-side admin-role check; direct order-table access
remains denied by RLS.

**Next step:** add MFA, least-privilege staff roles, and append-only audit events
before expanding the admin team or operational impact.

## Catalog and operations

### Catalog management and media are seed-driven

Products and categories are loaded from SQL seed data. Product visuals are
code-rendered representations rather than managed product photography. There is
no catalog CRUD UI, media upload pipeline, CDN policy, or merchandising workflow.

**Next step:** add managed media and catalog administration only after defining
ownership, validation, image processing, and cache invalidation.

### Production operations are lightweight

The application uses managed Vercel and Supabase services without a documented
SLO, load test, custom alerting, disaster-recovery exercise, or automated backup
restore test.

**Current control:** release acceptance covers HTTP smoke checks, 20 Playwright
flows, database cleanup, and managed-platform deployment status.

**Next step:** add error monitoring, request metrics, alerts, load baselines, and
restore drills before claiming commercial availability.

## Accepted dependency advisory

At the release audit, `npm audit` reports:

- 0 critical
- 0 high
- 2 moderate
- 0 low

Both moderate findings refer to PostCSS bundled through Next.js 16.2.10. The
available automated `--force` remediation proposes a breaking downgrade to
Next.js 9.3.3, so it was rejected rather than presenting a downgrade as a safe
fix.

**Next step:** monitor the upstream Next.js dependency and apply a compatible
patched release, then rerun lint, build, Playwright, and production acceptance.
