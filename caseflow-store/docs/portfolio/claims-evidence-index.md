# Claims And Evidence Index

| Claim | Primary source | Verification evidence |
|---|---|---|
| 500 sellable editions across 50 works, EN/VI split | `src/data/books-v1.2-canonical.json`, catalog repositories | Release verification and Production catalog capture |
| Browser is not trusted for commerce totals | `src/lib/use-cases/create-book-order.ts`, checkout repositories | Order-total, cart-validation, and v1.17 Playwright gates |
| Buy Now preserves the saved cart | Product/checkout features and ADR-0024 | `tests/e2e/buy-now-checkout.spec.ts`, Production demo capture |
| Account vouchers are owned, expiring, and single-use | Voucher repository and order use case | Signup-voucher verifier and order transaction evidence |
| Customer sees own order history and eligible cancellation | Customer order features and APIs | Customer history/cancellation Playwright and capture screenshots |
| Staff/admin operations are server-authorized | Admin auth, policies, Route Handlers | Role-access tests and admin capture |
| QR practice does not mutate commerce | Checkout experience APIs and repository | `tests/e2e/uat-auto-customer.spec.ts`, Production capture report |
| Mock payment completion is locked in Production | Payment environment guards and dev endpoint | No-demo/QR Production safety gates |
| Order creation is layered and transactional | ADR-0014, order use case, RPC migration | Architecture verifier and order reliability verification |
| Product has zero observed console errors in portfolio journey | Capture script listeners | `assets/demo-v1.18.3/capture-report.json` |
| Portfolio capture data was removed | Temporary-customer cleanup helper | Capture report plus release-cleanup verification artifact |
| Video contains Production footage, audio, captions, and no real PII | Capture/render scripts | `render-report.json` and portfolio-package verifier |
| Video score is reproducible and sample-free | Background-score generator and render manifest | `scripts/generate-portfolio-background-music.mjs` and v1.18.3 render report |

## Claims Deliberately Not Made

- Real bookstore revenue, users, conversion, ratings, or commercial traction.
- Real payment settlement, refund, reconciliation, or bank integration.
- Real SMS/email delivery reliability without buyer-owned providers.
- Real-time carrier tracking or warehouse operations.
- Ownership of third-party publisher cover rights beyond documented source
  assumptions.
- Marketplace, enterprise, or microservice scale.
