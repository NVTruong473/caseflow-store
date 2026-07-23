# UAT-OPS-T01 - Production Simulated Transfer Acceptance

## Scope

- Date: 2026-07-23
- Candidate commit: `432a972`
- Deployment: `dpl_6DjptcafKsNspyLe2XAs5rZbYJ8t`
- Production URL: `https://caseflow-store.vercel.app`
- Roles: authenticated customer, staff, and admin
- Payment method: simulated bank transfer
- Real payment, bank account, email, and SMS: not used

## Acceptance Results

| Check | Result |
| --- | --- |
| Customer created two orders with server-calculated positive totals | PASS |
| Both orders started as `pending` / `awaiting-transfer` | PASS |
| Customer transfer-decision request was denied | PASS (`403`) |
| Staff confirmed one transfer from the operations UI | PASS (`200`) |
| Staff was denied admin-only settings | PASS (`403`) |
| Admin rejected one transfer with a persisted risk-review reason | PASS (`200`) |
| Admin could access settings | PASS (`200`) |
| Repeated confirmation and rejection were idempotent | PASS (`200`) |
| Invalid reverse decisions were rejected | PASS (`409`) |
| Customer history showed confirmed and cancelled outcomes | PASS |
| Customer inbox showed confirmation, rejection, and cancellation events | PASS |
| Three temporary identities and two orders were removed | PASS |
| Both touched edition stock values were restored | PASS |

## Visual Evidence

- `.agent/artifacts/uat-ops-t01-production/staff-confirmed-transfer-en.png`
- `.agent/artifacts/uat-ops-t01-production/admin-rejected-transfer-en.png`
- `.agent/artifacts/uat-ops-t01-production/customer-transfer-outcomes-en.png`
- `.agent/artifacts/uat-ops-t01-production/customer-transfer-notifications-en.png`

The screenshots were reviewed at a 1440 x 1000 desktop viewport. Status labels,
order totals, internal notes, notification rows, and customer history were
readable without clipping or incoherent overlap.

## Machine-Readable Evidence

- `.agent/artifacts/uat-ops-t01-production/operations-transfer-uat-check.json`

The artifact contains only temporary synthetic UAT identities and order
identifiers. Cleanup completed before the verifier returned success.

## Decision

`UAT-OPS-T01` passes. The candidate may proceed to the `v1.13.1` production
smoke, security, browser-regression, documentation, tag, and release gates.
