# POSTV111-T01 - Final v1.11.0 Release Consistency Audit

Date: 2026-07-22

Status: PASS

Production URL: `https://caseflow-store.vercel.app`

Production deployment: `dpl_DtUDA7pbv7ZcJYFRM5TVmsQUhThq`

Release: `v1.11.0`

## Objective

Confirm that the shipped `v1.11.0` release is internally consistent across the
release commit, tag, GitHub Release metadata, Vercel production, and fresh
production runtime checks. The audit evidence was captured before this
post-release documentation commit was pushed.

## Findings

- At audit time, local `main` and `origin/main` were on release commit
  `8ed23eade1d5e251549119b8e2cac5fdcd01b6e0`.
- The peeled `v1.11.0` tag points to
  `8ed23eade1d5e251549119b8e2cac5fdcd01b6e0`.
- GitHub Release `v1.11.0` is published, not draft, and not prerelease.
- Vercel alias `https://caseflow-store.vercel.app` points to ready production
  deployment `dpl_DtUDA7pbv7ZcJYFRM5TVmsQUhThq`.
- After the audit was documented and pushed, `origin/main` advanced to the
  post-release documentation commit. The `v1.11.0` tag and GitHub Release were
  intentionally left unchanged.

## Verification

- `git ls-remote origin refs/heads/main refs/tags/v1.11.0 refs/tags/v1.11.0^{}`:
  PASS.
- `gh release view v1.11.0 --json tagName,url,name,publishedAt,targetCommitish,isDraft,isPrerelease`:
  PASS.
- `npx vercel inspect https://caseflow-store.vercel.app`: PASS.
- `PRODUCTION_SMOKE_BASE_URL=https://caseflow-store.vercel.app PRODUCTION_SMOKE_ARTIFACT_ID=postv111-t01-production-smoke npm exec -- tsx scripts/verify-production-smoke.ts`:
  PASS.
- `SECURITY_QA_BASE_URL=https://caseflow-store.vercel.app SECURITY_QA_ARTIFACT_ID=postv111-t01-production-security npm exec -- tsx scripts/verify-security-posture.ts`:
  PASS.
- `PAYQR_PRODUCTION_SAFETY_BASE_URL=https://caseflow-store.vercel.app PAYQR_ARTIFACT_ID=postv111-t01-production-qr-safety npm exec -- tsx scripts/verify-qr-payment-production-safety.ts`:
  PASS.
- `PASSWORD_CHANGE_BASE_URL=https://caseflow-store.vercel.app npm exec -- tsx scripts/verify-customer-password-change.ts`:
  PASS.

## Evidence

- `.agent/artifacts/postv111-t01-production-smoke/production-smoke-check.json`
- `.agent/artifacts/postv111-t01-production-security/security-posture-check.json`
- `.agent/artifacts/postv111-t01-production-qr-safety/qr-payment-production-safety-check.json`
- `.agent/artifacts/auth-password-t01/customer-password-change-check.json`

## Guardrails

No runtime source change, schema mutation, deploy, tag rewrite, release rewrite,
force-push, or production mock-payment enablement was performed during this
audit.
