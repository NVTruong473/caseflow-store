# POSTV130-T01 - Final v1.13.0 Release Consistency Audit

Date: 2026-07-23

## Release State

- Runtime commit: `c25a1b43f3c71fc49df904b0dc6439912e5d5d13`
- Tag: `v1.13.0`
- GitHub Release:
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.13.0`
- Vercel deployment: `dpl_9N1HSkydBBzsrM1UmtT2Lfvpo7np`
- Deployment URL:
  `https://caseflow-store-j5ttypy16-nvt-ruong473.vercel.app`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel status: `READY`

## Verified Results

| Area | Result | Evidence |
|---|---:|---|
| Additive schema apply | PASS | `notify-t09-migration` and `notify-t09-lifecycle` |
| Public/API smoke | PASS | `notify-t09-production-smoke` |
| Security headers | PASS | `notify-t09-production-security` |
| QR Production lock | PASS | `notify-t09-production-qr-safety`, runtime `401` |
| Notification boundary | PASS | `notify-t09-production-notification-safety`, 8/8 unauthorized surfaces |
| Role/operations matrix | PASS | `notify-t09-production-operations` |
| Storefront freeze | PASS | `notify-t09-production-storefront` |
| Accessibility/mobile | PASS | `notify-t09-production-accessibility` |
| Final QA | PASS | `notify-t09-production-final-qa`, 0 findings |
| Full browser suite | PASS | Production Playwright `24/24` |
| Cleanup | PASS | `notify-t09-production-cleanup`, 0 residue |

## Configuration Consistency

Vercel Production contains the existing site and Supabase variables only. It
does not contain notification mode, Resend, Twilio, OTP, or dispatcher values.
The server therefore keeps external delivery disabled while retaining the
in-app inbox. No secret was printed into this audit or committed to Git.

## Conclusion

The released runtime, migrations, production alias, safety controls, role
boundaries, and QA evidence are consistent with the `v1.13.0` scope. This is a
production-shaped simulated-commerce release, not evidence of real payment,
SMS, or email-provider operation.
