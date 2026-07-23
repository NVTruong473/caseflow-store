# POSTV140-T01 - Final v1.14.0 Release Consistency Audit

Date: 2026-07-24

## Result

PASS. The public Vercel alias, production deployment, remote `main`, annotated
tag, GitHub Release, release notes, and committed QA evidence are consistent
with the `v1.14.0` sellable-demo productization release.

## Release Identity

- Runtime commit: `fb0a07f`
- Release/evidence commit and peeled tag: `7d791b6819f25fdfe9be8c19b055a5849a9c67bd`
- Annotated tag object: `81f6c3172c558d94e3131919cce351af997f0550`
- GitHub Release ID: `358904780`
- GitHub Release:
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.14.0`
- Vercel deployment: `dpl_6cLwah2gUno1dbar97VQKFSopirM`
- Production URL: `https://caseflow-store.vercel.app`

The release/evidence commit follows the deployed runtime commit and changes
documentation plus QA artifacts only; no runtime source changed between those
commits.

## Verified State

- Vercel deployment target is `production`, status is `Ready`, and the public
  alias resolves to the expected deployment.
- At release publication, remote `main` and peeled `v1.14.0` both resolved to
  the release/evidence commit. The post-release audit commit is documentation
  only and may leave `main` one commit ahead without changing the tag or
  deployed runtime.
- GitHub reports `v1.14.0` as the latest release, non-draft and
  non-prerelease.
- Root/app README and handoff documents identify `v1.14.0` and the verified
  Vercel deployment.
- Productization, build, architecture, notification, secret, asset,
  dependency, no-demo, smoke, security, QR lock, notification boundary,
  catalog, accessibility, SEO, final QA, cleanup, and local/Production
  Playwright gates passed.

## Honest Boundaries

- The site is a configurable reference/demo product, not a live merchant
  business.
- Payment settlement, external email/SMS, logistics, buyer domain,
  observability, buyer legal text, and licensed buyer catalog/media remain
  buyer-specific work.
- The Production mock-payment success path remains locked.
