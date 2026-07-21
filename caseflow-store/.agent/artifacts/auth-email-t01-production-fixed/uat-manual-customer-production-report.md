# UAT-MANUAL-T01 Production Customer Order Test

- Generated at: 2026-07-21T15:59:16.154Z
- Base URL: https://caseflow-store.vercel.app
- Result: BLOCKED - self-service sign-up did not create a customer account
- Fallback disabled: yes

## Customer Account Attempt

- Email: `truongskull014+caseflow-uat-fixed-202607211558@gmail.com`
- Name: CaseFlow UAT Customer
- Password: not stored in repository artifacts.

## Registration Response

- HTTP status: 429
- Error code: CUSTOMER_AUTH_FAILED
- Error message: Customer sign-up is temporarily rate-limited. Try again later.
- Account created: no
- Signed in: no

## Result

The no-fallback customer UAT stopped before profile completion, cart,
checkout, QR boundary, and order history because the public production sign-up
flow did not create a customer account.

## Target Book Reserved For Test

- Book: A Christmas Carol (`a-christmas-carol-english-paperback`)
- Edition ID: `00000000-0000-4000-8000-000000003027`
- Price: 159000 VND

## Evidence

- `.agent/artifacts/auth-email-t01-production-fixed/uat-manual-customer-production-check.json`
