# ADR-0010: QR Demo Payment Provider Boundary

- Status: Accepted
- Date: 2026-07-19
- Planning task: `PAYQR-T01 - Integrate Production-Locked QR Demo Payment`

## Context

CaseFlow Books already has account-gated checkout, server-owned totals, order
history, public tracking, and admin/staff order operations. The current payment
experience records method/status on the order, but it does not create a
separate payment session, QR payload, webhook boundary, or idempotent payment
event record.

The new requirement is to add a realistic QR payment experience for a demo or
sandbox context while preserving the existing safety boundary:

- no real bank, wallet, card, or payment-provider integration;
- no real bank account or production payment credentials;
- no client-controlled amount;
- no production endpoint that can mark a payment as paid through mock tooling;
- clear runtime labeling that the QR is demo-only.

This supersedes only the narrow payment-session part of ADR-0005. It does not
approve real payment collection.

## Decision

Add a provider-shaped payment layer with two demo providers:

- `MockGatewayPaymentProvider` for a generic internal QR gateway payload;
- `DemoVietQrPaymentProvider` for a VietQR/EMVCo-style demo QR payload.

Payment sessions are persisted in a new additive `payments` table and processed
through a shared payment service. Payment status is separate from order status.
The existing order `payment_status` remains the operational order-payment
summary and is updated only by trusted server-side logic.

Frontend checkout will offer the two QR methods and redirect eligible orders to
`/checkout/payment?orderCode=...`. The payment page calls backend APIs, renders
the QR from a server-generated payload, polls status, and shows development-only
simulate controls when allowed by server response.

## Scope

Allowed:

- additive payment tables, indexes, RLS/grants, and one transaction-style RPC;
- `POST /api/payments`, `GET /api/payments/[paymentId]`,
  `POST /api/dev/payments/[paymentId]/simulate-success`, and
  `POST /api/webhooks/mock-payment`;
- environment-based demo payment configuration;
- QR payload generation, CRC utility, and server-side HMAC verification;
- frontend QR payment page, QR renderer, countdown, polling, loading, success,
  expired, and error states;
- a verifier that proves local/demo behavior works and production simulate
  controls are locked.

Not allowed:

- live payment provider SDKs or banking/wallet APIs;
- real bank account numbers, merchant accounts, provider secrets, or card
  fields;
- deep links that open real banking apps;
- production mock-payment success APIs;
- client-side amount authority;
- using CSS visibility as the only protection for simulate controls;
- deleting existing security QA evidence or rewriting published release
  history.

## Data Ownership

Payment amount must always come from the server-owned order record. The browser
may select a payment provider but cannot set the amount, status, account name,
webhook secret, or paid timestamp.

The demo account name is derived from the current merchant name when
`DEMO_BANK_ACCOUNT_NAME` is empty:

```text
CASEFLOW BOOKS DEMO
```

The default account number remains obviously non-real:

```text
0000000000
```

## Production Safety

Production can render existing order/payment states, but it must not expose or
execute local mock payment success controls.

The simulate endpoint must return a non-success response when:

- `NODE_ENV=production`; or
- `ENABLE_MOCK_PAYMENT` is not exactly `true`.

The frontend must use server-provided capability flags and must not contain or
render secrets. The webhook endpoint must require an HMAC signature using the
server-only `MOCK_PAYMENT_WEBHOOK_SECRET`.

## Consequences

Positive:

- checkout can demonstrate a realistic Vietnamese QR payment flow without
  collecting money;
- payment state, order state, webhook, and idempotency are separated clearly;
- later production payment providers can reuse the same service boundary.

Negative:

- adding a persisted payment table requires a schema migration and production
  deploy verification;
- the runtime no-demo copy gate must distinguish safe QR demo disclosures from
  accidental portfolio/demo leakage;
- this still does not prove real-world reconciliation, refunds, chargebacks, or
  provider settlement.

## Acceptance Criteria

- QR payment sessions are created from order IDs only.
- The backend reads amount from `orders.total_vnd`.
- Both QR providers render a clear demo payment page.
- Countdown uses server `expiresAt`.
- Simulate success updates payment to paid and order payment status to
  confirmed without a reload in non-production environments.
- Webhook signature verification and idempotency are tested.
- Production does not render simulate controls and rejects simulate requests.
- Lint, typecheck, build, security posture, no-demo/production-safety gate,
  browser QA, and production smoke are rerun after the final code change.
