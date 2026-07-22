# ADR-0016: Transactional Notifications And Simulated Transfer Operations

- Status: Accepted
- Date: 2026-07-22
- Planning task: `NOTIFY-T01`

## Context

CaseFlow Books already confirms customer email through Supabase Auth, records
account-bound orders, exposes customer order history, and lets staff/admin
operate order, payment, and shipping states. It does not yet have an
application-owned notification pipeline, transactional order email/SMS, or a
durable record of notification attempts.

Sending email or SMS inline with an order transaction would create a new
failure mode: a provider timeout could make checkout appear to fail after the
order has committed. Treating an unconfigured sandbox provider as real would
also mislead customers and weaken production safety.

## Decision

Keep the Next.js modular monolith and layered architecture. Add a transactional
notification outbox and provider boundary with three channels:

1. `in-app` is always available and is the authoritative customer fallback.
2. `email` uses a server-only provider adapter and is live only with validated
   provider configuration.
3. `sms` uses a server-only provider adapter and is live only with validated
   provider configuration and approved sender identity.

Order and payment mutations enqueue deterministic notification events in the
database. A dispatcher sends queued channels after the commerce transaction.
Provider failure never rolls back or duplicates an order.

## Simulated Transfer Boundary

- `bank-transfer` remains a simulated payment method.
- Customers can create an order in `awaiting-transfer` state and view its
  timeline in their account.
- Staff/admin can confirm or reject the simulated transfer through the
  existing protected order-operations boundary.
- No customer-facing button can mark payment confirmed in production.
- No real bank account, real QR deep link, settlement, refund, or financial
  webhook is introduced.

## Data Boundary

- `notification_outbox` stores event identity, channel, template, aggregate
  reference, status, attempts, retry time, and provider-safe metadata.
- `customer_notifications` stores account-scoped in-app messages and read
  timestamps.
- `phone_verification_challenges` stores hashed OTP challenges, expiry,
  attempt count, and consumption timestamp; plaintext OTP is never stored.
- Idempotency is enforced by a unique event/channel key.
- Provider secrets, rendered SMS OTP values, and raw provider errors are never
  exposed to customer APIs.

## Environment Modes

- `NOTIFICATION_MODE=disabled`: in-app events remain available; external
  channels are recorded as blocked.
- `NOTIFICATION_MODE=sandbox`: email/SMS are rendered into staff/admin-only
  previews and never leave the system.
- `NOTIFICATION_MODE=live`: external delivery requires complete server-only
  provider credentials; missing or placeholder values fail closed.

Sandbox mode may run locally or in a protected preview. It must not make a
customer-facing claim that an email or SMS was delivered.

## Alternatives Considered

### Send Email/SMS Inline During Checkout

Rejected. External provider latency and failure must not control order
durability or invite duplicate checkout retries.

### Store Notifications Only In Application Logs

Rejected. Logs are not an idempotency boundary, customer inbox, retry queue, or
auditable operations record.

### Expose A Production Simulate-Paid Button

Rejected. A browser control is not payment evidence and would conflict with
the existing production mock-payment lock.

### Require SMS Verification Immediately

Rejected until a live provider is configured. Enforcing it now would block all
production checkout while providing no real verification channel.

## Consequences

Positive:

- Commerce writes remain independent from provider availability.
- Customers gain durable in-app order updates.
- Email/SMS providers can be replaced without rewriting checkout.
- Staff/admin can diagnose queued, blocked, sent, and failed notifications.
- Duplicate order/status events cannot send duplicate channel deliveries.

Negative:

- A dispatcher and retry policy become operational responsibilities.
- Live email/SMS still require external accounts, sender verification, secrets,
  and potentially recurring cost.
- Sandbox evidence proves application behavior, not real-world deliverability.

## Guardrails

- No real payment or bank credential integration.
- No secret in `NEXT_PUBLIC_*`, browser state, logs, screenshots, or API bodies.
- No raw OTP storage.
- No marketing notification without explicit consent and a separate ADR.
- Customer APIs are account-scoped; staff/admin operations repeat server-side
  permission checks.
- Production live mode fails closed when provider configuration is incomplete.
- Migration is additive and rollback does not delete order/customer data.
