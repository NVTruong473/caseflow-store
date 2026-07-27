# Checkout QR Experience

## Purpose

CaseFlow Books keeps two different checkout intents explicit:

1. **Place order / Dat hang** runs the account, address, shipping, voucher,
   payment-method, inventory, and order-persistence workflow.
2. **QR experience / Trai nghiem QR** demonstrates a QR transfer interaction
   without creating or settling an order.

The split prevents a public portfolio visitor from confusing a visual
demonstration with a business transaction.

## Boundary

The experience reuses the latest cart returned by `/api/cart/validate` and the
existing checkout total rules. It then stays entirely in local component state.

It does not:

- call `POST /api/orders`;
- call `POST /api/payments`;
- call a mock simulate-success endpoint;
- store a payment or order;
- consume a voucher or inventory;
- update notifications, order history, or admin analytics;
- open a bank or wallet application.

The QR payload uses the internal `caseflow-experience://` scheme and the
visibly non-real account number `0000000000`. Completion resets on reload and is
not proof of payment.

## Official Checkout

The official mode remains the default. Existing server-owned prices, account
authorization, shipping and payment choices, voucher ownership, order
idempotency, inventory, and history behavior are unchanged.

The success page now localizes order status and uses a responsive detail grid
so long order codes and payment labels remain inside the summary at mobile and
desktop widths.

## Production Safety

The persisted `MOCK_GATEWAY` and `DEMO_VIETQR` providers remain disabled in
Production under ADR-0010. The public experience does not weaken that lock
because it cannot write a business record.

The production-safety verifier rejects the experience component if it contains
order/payment mutation endpoints, the simulate-success endpoint, backend
VietQR generation, or `fetch`.

## Verification

- ESLint: PASS.
- TypeScript: PASS.
- Next.js Production build: PASS, 59 routes plus proxy.
- Architecture boundary verifier: PASS, 224 files and zero findings.
- Full local Playwright: PASS, 26/26.
- QR production-safety source gate: PASS, zero findings.
- Existing Production mock endpoint boundary: PASS, denied with HTTP 401.
- Customer-facing no-demo copy gate: PASS, 133 files and zero findings.
- Secret scan: PASS, 1,543 files and zero findings.
- Runtime dependency audit: PASS, zero vulnerabilities.
- Desktop and 375px mobile visual inspection: PASS.

Evidence:

- `.agent/artifacts/checkout-mode-t01-experience-desktop-vi.png`
- `.agent/artifacts/checkout-mode-t01-experience-mobile-vi.png`
- `.agent/artifacts/checkout-mode-t01-official-success-desktop-vi.png`
- `.agent/artifacts/checkout-mode-t01-success-desktop-vi.png`
- `.agent/artifacts/checkout-mode-t01-success-mobile-vi.png`
- `.agent/artifacts/checkout-mode-t01/qr-payment-production-safety-check.json`
- `.agent/artifacts/checkout-mode-t01/no-demo-runtime-copy-check.json`
- `.agent/artifacts/checkout-mode-t01/secret-scan.json`
- `.agent/artifacts/checkout-mode-t01-production/qr-payment-production-safety-check.json`

The full development dependency audit reports a high-severity
`brace-expansion` denial-of-service advisory inside the ESLint/Next plugin
chain. It is not bundled into the runtime, and `npm audit --omit=dev` reports
zero vulnerabilities. The only automated full fix currently replaces the
compatible lint stack with breaking versions; that force fix was rejected
after an ESLint 10 compatibility check failed. Reassess when the pinned Next
lint plugins support the fixed dependency chain.
