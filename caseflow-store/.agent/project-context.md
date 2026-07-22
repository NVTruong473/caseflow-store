# CaseFlow Store - Project Context

## Project Identity

- Project name: CaseFlow Store `v1.0.0`; CaseFlow Books `v1.1.0`, `v1.2.0`,
  `v1.3.0`, `v1.3.1`, `v1.4.0`, `v1.4.1`, `v1.4.2`, `v1.5.0`, `v1.6.0`,
  `v1.7.0`, `v1.8.0`, `v1.9.0`, `v1.10.0`, `v1.11.0`, `v1.11.1`,
  `v1.11.2`, `v1.11.3`, `v1.12.0`, and `v1.12.1` released
- Repository folder: `/Users/vantruong/Documents/TSNN 2`
- Product domain: books for released `v1.1.0` and `v1.2.0`; phone
  accessories for released `v1.0.0`
- Project type: full-stack e-commerce portfolio app evolving into a bookstore and small-business operations demo
- Purpose: portfolio/CV project for Web or Full-Stack Developer applications
- Implementation duration: exactly 20 days
- Journal entries: 30, with entries 21-30 as retrospective documentation
- Current mode: approved `v1.13` transactional notification and simulated
  transfer implementation.
- Current gate: `NOTIFY-T08` and the refreshed `NOTIFY-T09` local release gate
  passed; migrations `0012` and `0013` are applied with count-preserving and
  order-lifecycle evidence. Production deploy/reverification remains pending.
- Current task: `NOTIFY-T09 - Apply, Deploy, Smoke Test, Document, And Release`.

## Confirmed Facts

- The released `v1.0.0` is a small MVP, not a large e-commerce platform.
- The accepted `v1.1` direction is still not a marketplace, but it expands the project into a focused bookstore plus small-business operations demo.
- The project must be usable locally before public deployment.
- The project must preserve context across future AI sessions using Markdown files.
- The user wants critical evaluation of risks, assumptions, and missing data.
- The user requested QR payment demo integration after `v1.4.2` had already
  been published; published tag/release history must not be rewritten. The QR
  scope must ship as a later version after all affected gates are rerun.
- `PAYQR-T01` was accepted on 2026-07-19 as `v1.5.0`: additive `payments`
  schema and idempotent RPC applied to Supabase, QR payment APIs and UI were
  added, VietQR demo payload/CRC and mock webhook HMAC verification passed,
  mock payment is production-locked, Vercel deployment
  `dpl_9rMZwbykPksBiFWLLfVyR1i38nPy` is aliased to
  `https://caseflow-store.vercel.app`, and production Playwright passed
  `20/20`.
- `V16-T01` was accepted on 2026-07-19 as the retail catalog scale and hero
  copy hotfix: Supabase production now has 500 active editions, 250 English
  editions, 250 Vietnamese editions, 400 generated v1.6 retail editions,
  400 new generated local covers, refreshed realistic VND price bands, a
  120,000 VND active price floor, customer-facing homepage hero copy, catalog
  result-count layout polish, and production deployment
  `dpl_AxywdtLdcWEgeC9ytoiJwqNTwCK7` aliased to
  `https://caseflow-store.vercel.app`.
- `UIH-T01` was completed on 2026-07-19 as a local UI humanization pass after
  `v1.6.0`: reference sites were reviewed for principles only,
  `docs/ui-humanization-audit.md` and `docs/style-guide.md` were added, the
  storefront header no longer exposes admin as public navigation, homepage
  hero now uses a reading-table/spine-rail motif, catalog intro and quick
  links use lighter shelf treatment, product detail edition notes use
  customer-facing copy and safer metadata wrapping, reduced-motion handling
  was verified, stale 100-edition E2E/catalog verifier baselines were updated
  to 500, and full local Playwright passed `20/20`.
- `UIH-T02` was accepted on 2026-07-19 as the v1.7.0 production release:
  admin dashboard payment summaries now treat cancelled/rejected orders with
  stale active payment states as cancelled, admin/staff cancellation
  normalizes open payment and shipping states server-side, reading-path step
  labels no longer wrap vertically, Vercel deployment
  `dpl_EKSUm28mL8w4acchGxoZeeJA8iJc` is aliased to
  `https://caseflow-store.vercel.app`, and production smoke, UIH, catalog,
  security posture, QR production-safety, and final QA checks passed.
- `V18-T01` was completed locally on 2026-07-21 as the modern editorial
  bookstore pass governed by `ADR-0012`: created
  `docs/ui-ux-audit.md`, `docs/v1.8-modern-editorial-bookstore-roadmap.md`,
  and updated `docs/style-guide.md`; added search-first desktop header,
  live category menu, mobile search/category discovery, cover provenance
  manifest generation, honest fallback-cover labeling, restrained product-card
  motion tokens, and a reduced-motion-aware back-to-top control. Local QA
  passed `npm run lint`, `npm exec -- tsc --noEmit --pretty false`,
  `npm run build`, `npm run test:e2e` (`20/20`),
  `node scripts/verify-v18-bookstore-experience.mjs`, high/critical
  dependency audit, and `git diff --check`. No production deploy/tag/release
  was performed.
- `V18-T02` was completed on 2026-07-21 as the v1.8.0 production release:
  pushed commit `b93175b` to `origin/main`, deployed Vercel production
  deployment `dpl_9FRaok8hK8sddmbGBL3RvkMM9fLs`, verified the alias
  `https://caseflow-store.vercel.app`, passed production V18 bookstore
  experience, catalog, release smoke, security posture, QR production-safety,
  and final QA smoke gates, updated release documentation, and created the
  `v1.8.0` tag/GitHub Release.
- `V19-T01` through `V19-T04` were completed on 2026-07-21 as the real cover
  commerce polish release: accepted `ADR-0013`, added the V19 roadmap,
  stripped public image metadata, hardened the rule-based assistant, downloaded
  49 local Project Gutenberg source-work JPEG covers, deployed Vercel
  production deployment `dpl_GozgRJiNvpPTwC2WUua9VXXovErd`, applied 49
  `public-domain` cover asset rows and 490 active edition cover references in
  Supabase production, regenerated cover manifests with 490
  `public-domain-local` and 10 `project-generated` entries, and passed V19,
  V18 compatibility, smoke, security, QR production-safety, and final QA
  checks. Fahasa automation remained blocked by anti-bot challenge responses;
  official Vietnamese covers require reviewed direct image URLs or licensed
  assets later.
- `SIGNUPVOUCHER-T01` was completed locally on 2026-07-21 as a
  post-`v1.9.0` conversion patch: added account-bound signup vouchers,
  Supabase migration `0010_customer_signup_vouchers.sql`, server-side
  voucher grant/list/reserve/confirm/release repositories, checkout and
  account voucher UI, homepage registration CTA, and an end-to-end verifier.
  Local verification passed typecheck, lint, production build, and
  `scripts/verify-signup-vouchers.ts`. Production deploy/tag/release has not
  been performed for this patch.
- `SIGNUPVOUCHER-T02` was completed on 2026-07-21 as the `v1.10.0` production
  release: pushed commit `97f5c67`, deployed Vercel production deployment
  `dpl_FPZwifR2vJr9ZFDa1cbbJ8y89QsW`, verified
  `https://caseflow-store.vercel.app`, passed production signup-voucher
  verifier, production smoke, security posture, QR production-safety, and
  final QA, and created the `v1.10.0` tag/GitHub Release.
- `POSTV110-T01` was completed on 2026-07-21 as the final `v1.10.0` release
  consistency audit: local `main`, `origin/main`, the peeled `v1.10.0` tag,
  GitHub latest release metadata, Vercel alias
  `https://caseflow-store.vercel.app`, production smoke, security posture, QR
  production-safety, and final QA are consistent with `v1.10.0`; stale
  top-level `.agent` snapshot text from `v1.8.0` was corrected.
- `UAT-MANUAL-T01` was executed on production on 2026-07-21 with a customer
  UAT account and order `CF-MRULYDA5-0834135AE0`: customer sign-in, 3
  account-bound vouchers, profile completion, add-to-cart, one-voucher
  checkout, server-persisted totals, production QR/payment lock, and account
  order history passed. Self-service sign-up was blocked by Supabase Auth
  rate-limit `429 CUSTOMER_AUTH_FAILED`, so the UAT account was provisioned by
  service-role as a controlled fallback and the finding remains open.
- `AUTH-UAT-T01` was completed on 2026-07-21: Supabase Auth rate-limit docs
  were reviewed, the production customer UAT verifier gained a no-fallback
  mode and configurable email domain, and production UAT was rerun against
  `https://caseflow-store.vercel.app` with fallback disabled. Public sign-up
  returned `201`, `fallbackProvisioned` stayed false, 3 signup vouchers were
  visible, checkout with `WELCOME30K` created order
  `CF-MRUSRE2K-007B2B5B07`, QR/payment production lock passed, and account
  order history passed. The remaining launch concern is operational: configure
  custom SMTP and abuse controls before treating public email registration as
  business-grade.
- `AUTH-EMAIL-T01` preflight was started on 2026-07-21: the customer UAT
  verifier now supports exact mailbox input, no service-role fallback, and a
  real email-confirmation wait loop that polls Supabase Auth
  `email_confirmed_at` before continuing sign-in, voucher, checkout,
  QR/payment boundary, and order-history checks. The task is blocked until a
  controlled mailbox or confirmation link is available; it must not be marked
  pass through service-role confirmation.
- `AUTH-EMAIL-T01` was rerun on 2026-07-21 with the tester-controlled Gmail
  alias `truongskull014+caseflow-uat-202607211550@gmail.com`: public sign-up
  returned `201`, Supabase Auth real email confirmation was observed, no
  service-role fallback was used, and checkout/order history passed with order
  `CF-MRUU092P-A54D8D8BB5`. The tester screenshot exposed a production UX
  defect where the confirmation redirect landed on `localhost:3000` with an
  expired/consumed OTP fragment. Commit `409c333` fixed signup email redirects
  to use `NEXT_PUBLIC_SITE_URL` or forwarded public headers; Vercel Production
  now has `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app`, deployment
  `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5` is aliased to production, and production
  smoke/security/QR safety checks passed. Immediate post-fix real-email rerun
  was blocked by Supabase Auth `429`, so a fresh email-link UX revalidation
  must wait for cooldown or custom SMTP.
- `AUTH-EMAIL-T02` was attempted once on 2026-07-21 against production
  deployment `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5` with Gmail alias
  `truongskull014+caseflow-uat-t02-202607211605@gmail.com`; public sign-up
  returned `429 CUSTOMER_AUTH_FAILED` before account creation, fallback stayed
  disabled, no email was sent/clicked, and the post-fix redirect UX remains
  blocked pending Supabase Auth cooldown or custom SMTP.
- `AUTH-SMTP-T01` was prepared on 2026-07-21: added
  `scripts/configure-supabase-custom-smtp.ts`, documented
  `docs/auth-smtp-t01-custom-smtp-automation.md`, and added `.env.example`
  placeholders for Supabase Management API and SMTP settings. Dry-run blocks
  safely because `SUPABASE_ACCESS_TOKEN`, `SMTP_ADMIN_EMAIL`, `SMTP_HOST`,
  `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` are missing. No fake SMTP
  configuration was applied. A later automatic apply-mode preflight also
  blocked before any Supabase API mutation for the same missing credentials;
  production inspect, smoke, security posture, and QR production-safety checks
  passed against `https://caseflow-store.vercel.app`.
- `AUTH-PASSWORD-T01` was completed and released as `v1.11.0` on
  2026-07-22: `.env.local` was
  updated with non-secret SMTP helper values (`SUPABASE_PROJECT_REF`,
  `SMTP_PORT=587`, `SMTP_SENDER_NAME=CaseFlow Books`) while real SMTP secrets
  remain absent; added a self-service signed-in password change form on
  `/account`, `PATCH /api/customer/password`, validation/API contract docs, and
  a Playwright verifier proving the old password is rejected after change and
  the new password signs in. The feature does not let admin/staff reset another
  user's password. It was then deployed to Vercel production deployment
  `dpl_DtUDA7pbv7ZcJYFRM5TVmsQUhThq`, aliased to
  `https://caseflow-store.vercel.app`, with production smoke, security posture,
  QR production-safety, and production password-change verifier passing.
- `POSTV111-T01` was completed on 2026-07-22 as the final `v1.11.0` release
  consistency audit: at audit time local `main`, `origin/main`, the peeled
  `v1.11.0` tag, GitHub Release metadata, Vercel production alias, production
  smoke, security posture, QR production-safety, and production
  password-change verifier were consistent with deployed release `v1.11.0`.
  The subsequent post-release documentation commit advances `origin/main`
  without rewriting the `v1.11.0` tag or release.
- `AUTH-SMTP-T02` was attempted automatically on 2026-07-22 in apply mode and
  safely blocked before any Supabase API mutation because `.env.local` still
  lacks `SUPABASE_ACCESS_TOKEN`, `SMTP_ADMIN_EMAIL`, `SMTP_HOST`, `SMTP_USER`,
  and `SMTP_PASS`. Non-secret helper values are present only.
- `AUTH-EMAIL-T03` passed on 2026-07-22 after Supabase Auth URL Configuration
  was corrected in the dashboard: Site URL is now
  `https://caseflow-store.vercel.app` and Redirect URLs includes
  `https://caseflow-store.vercel.app/account`. A first same-day UAT proved the
  data path but exposed the old `localhost:3000` redirect; the fixed rerun used
  `truongskull014+caseflow-uat-t03-fixed-202607220925@gmail.com`, observed a
  production redirect target, used no service-role confirmation, completed
  checkout/order history, and created order `CF-MRVGAH41-6042473213`.
- `OP-HANDOFF-T01` was completed on 2026-07-22 as the stable operations and
  portfolio handoff after `v1.11.0`: stale portfolio/docs references from
  `v1.6`, `v1.8`, and `v1.10` were updated, `docs/v1.11-final-operational-handoff.md`
  was added, README/release evidence/CV bullets/known limitations now describe
  the actual `v1.11.0` production state, and SMTP remains the only explicit
  operations blocker.
- `SECDEP-T01` was completed and released on 2026-07-22 as the `v1.11.1`
  dependency security patch: `next` and `eslint-config-next` were updated to
  `16.2.11`, npm overrides pin the Next dependency tree to
  `postcss@8.5.19` and `sharp@0.35.3`, `npm audit --audit-level=high` reports
  zero vulnerabilities, lint/typecheck/build passed, and full local Playwright
  passed `20/20` after a transient Supabase network/DNS failure was rerun and
  cleared. Vercel production deployment `dpl_Gb8aaXLz5MJhuzKwByEndNYtgT75` is
  aliased to `https://caseflow-store.vercel.app`, and production smoke,
  security posture, and QR production-safety checks passed.
- `UI-LIGHT-T01` was completed locally on 2026-07-22 as the `v1.11.2`
  neutral light UI patch: base colors were shifted away from yellow/orange
  Night Shift tones toward neutral paper, white surfaces, muted green-gray
  secondary surfaces, softer borders, and lighter shadows. Local lint/build
  passed, and Playwright screenshots for homepage, catalog, product detail,
  homepage mobile, and catalog mobile rendered with HTTP 200 and no horizontal
  overflow.
- `UI-LIGHT-T02` was completed locally on 2026-07-22 as the compact catalog
  pagination patch for `v1.11.2`: catalog pagination no longer renders all 21
  page numbers at once; desktop/tablet use first/nearby/last pages with
  ellipsis, and mobile uses a stable current-page control with previous/next.
  Local lint/build passed, and Playwright screenshots for desktop,
  narrow-desktop, and mobile pagination rendered with HTTP 200 and no
  horizontal overflow.
- `POSTV112-T01` was completed on 2026-07-22 as the final `v1.11.2` release
  consistency audit: local `main`, `origin/main`, and the peeled `v1.11.2`
  tag all point to `50f48ea8b365eb38c876c0f9ed8f3aa422aed045`; GitHub Release
  `v1.11.2` is published; Vercel production alias
  `https://caseflow-store.vercel.app` points to ready deployment
  `dpl_HLbiwbbsboiPd1T1ZSV8hvJACqNb`; production smoke, security posture, QR
  production-safety, high-level dependency audit, and production pagination
  render checks passed.
- `EXPERT-FINAL-AUDIT-T01` was completed locally on 2026-07-22 as a
  release-safe expert audit and polish patch for `v1.11.3`: raw production
  visual findings were triaged to separate lazy-image/screen-reader false
  positives from real issues; catalog filter controls now expose explicit
  `id`/`htmlFor` label associations; persistent topbar/footer support links
  now provide a 32px minimum hit area while preserving focus states; lint,
  typecheck, build, full Playwright `20/20`, no-demo runtime-copy, public
  asset metadata, QR secret scan, high-level dependency audit, and focused
  catalog desktop/tablet/mobile render checks all passed locally.
- `POSTV113-T01` was completed on 2026-07-22 as the final `v1.11.3` release
  consistency audit: local `main`, `origin/main`, and the peeled `v1.11.3`
  tag all point to `6d4914212e59bd37beab22d4848eaa76f05eb95f`; GitHub Release
  `v1.11.3` is published; Vercel production alias
  `https://caseflow-store.vercel.app` points to ready deployment
  `dpl_5iq8hNMbtsiiMUBkN39Uog9MQjXV`; production smoke, security posture, QR
  production-safety, production render audit, and production Playwright
  `20/20` passed. A first production E2E attempt had one transient
  `/api/products` timeout, but direct API timing, targeted admin-access rerun,
  and the full rerun all passed.
- Implementation was confirmed by the user on 2026-07-14.
- Implementation was unblocked by installing the official Node.js LTS binary after Homebrew failed.
- The Next.js app has been initialized in `caseflow-store`.
- The app runs locally at `http://localhost:3000` when `npm run dev` is active.
- The user delegated the original `v1.0.0` product-domain choice to the agent on 2026-07-14.
- The released `v1.0.0` product domain is phone accessories.
- The accepted active `v1.1` product domain is books.
- Production was deployed to `https://caseflow-store.vercel.app` on 2026-07-16.
- The annotated release tag `v1.0.0` was created on 2026-07-16.
- The 30-entry journal phase is complete as of 2026-07-16.
- `ADR-0006: Pivot v1.1 To CaseFlow Books` was accepted on 2026-07-16.
- `docs/v1.1-caseflow-books-roadmap.md` was accepted on 2026-07-16.
- The annotated `v1.1.0` tag exists on release commit `90a9907` as of
  2026-07-17.
- The user approved the `v1.2` Realistic Bookstore Content & Merchandising
  planning phase on 2026-07-17.
- `ADR-0007: Realistic Bookstore Content And Merchandising Upgrade For v1.2`
  was accepted on 2026-07-17.
- `docs/v1.2-realistic-bookstore-content-merchandising-roadmap.md` was accepted
  on 2026-07-17.
- `V12-T03` catalog realism baseline was accepted on 2026-07-17 with no
  production data or runtime behavior changes.
- `V12-T04` provenance and content-quality contracts were accepted on
  2026-07-17 with no database migration or runtime API change.
- `V12-T05` canonical catalog manifest was accepted on 2026-07-17 with 50
  works, 100 source-reviewed editions, 50 English/Vietnamese pairs, and no
  database or runtime catalog replacement.
- `V12-T06` cover asset pipeline was accepted on 2026-07-17 with deterministic
  project-created SVG pilot assets, rights/provenance records, contact sheet,
  and static card/detail preview checks.
- `V12-T07` cover portfolio was accepted on 2026-07-17 with 100
  edition-specific project-created SVG assets, 50 English/Vietnamese pairs, 50
  visual families, and no placeholder references in the portfolio manifest.
- `V12-T08` editorial metadata was accepted on 2026-07-17 with 100
  display-safe public edition records, bilingual summaries/reasons/alt text,
  334 display facts, and 100 release-ready content-quality assessments.
- `V12-T09` merchandising rules and minimal storage contracts were accepted on
  2026-07-17 with 9 approved shelves, 8 active shelves, 1 inactive
  order-derived shelf, deterministic fallbacks, and explicit
  `merchandising:manage` admin/staff mutation permission.
- `V12-T10` reversible migration planning was accepted on 2026-07-17 with
  additive SQL, deterministic dry-run planning, live count-only pre-migration
  evidence, private backup ignore rules, zero planned deletes, and publisher/
  ISBN source hygiene corrections before import.
- `V12-T11` Supabase production import was accepted on 2026-07-18 with a
  private pre-migration backup, additive schema apply, idempotent catalog
  upsert, 50 active works, 100 active editions, zero active primary placeholder
  covers, complete provenance/content-quality/merchandising rows, RLS/API
  smoke, unchanged order/profile/promotion/inventory counts, and SQL
  inspection evidence.
- `V12-T12` homepage merchandising was accepted on 2026-07-18 with public
  Supabase shelf resolution, one clear homepage browse action,
  editor/weekend/language/promotion/paired shelves, first-viewport coverage at
  375px/tablet/1440px, route-preserving language switch, detail/cart-entry
  smoke, and bilingual screenshot evidence.
- `V12-T13` catalog discovery was accepted on 2026-07-18 with shelf-backed
  catalog labels, compact mobile cards, cover-led desktop cards, real
  compare-at offer badges, editor-pick curation copy, paired-edition labels,
  URL-backed filter preservation, low-stock and out-of-stock empty-state
  coverage, and bilingual screenshot evidence.
- `V12-T14` book detail and edition comparison was accepted on 2026-07-18 with
  first-screen cover/title/price/stock/add-to-cart hierarchy, source-reviewed
  display facts, omitted unknown facts, English/Vietnamese edition switching,
  reason-to-read copy, more-by-author and related-book groups,
  cart/SEO/not-found preservation, and bilingual screenshot evidence.
- `V12-T15` admin content-quality and merchandising operations was accepted on
  2026-07-18 with server-enriched admin quality/cover/source/shelf states,
  staff/admin filters, merchandising shelf state/order operations,
  admin-only source field mutations, source approval guardrails,
  protected API role checks, no reviewer-note leakage, and desktop/mobile
  screenshot evidence.
- `V12-T16` catalog runtime integration was accepted on 2026-07-18 with public
  source-field removal, v1.2 search/assistant/SEO/social/JSON-LD/cart/order/
  export/docs integration, legacy-link and legacy-order snapshot compatibility,
  temporary Supabase cleanup, and production-style screenshot/runtime evidence.
- `V12-T17` full local quality gate was accepted on 2026-07-18 with TypeScript,
  lint, production build, full Playwright `20/20`, static V12 report
  aggregation, mobile performance baseline, SEO/accessibility/cleanup
  evidence, high/critical dependency audit pass, secret scan pass across 595
  text files, and a documented non-blocking moderate Next/PostCSS audit risk.
- `V12-T18` production release was accepted on 2026-07-18 with Vercel
  deployment `dpl_7Y2Qsf4VJRBuzaMGXZMi81Rq5pKQ` aliased to
  `https://caseflow-store.vercel.app`, production smoke `ok: true`, 100 active
  editions, 100 cover responses, 50 English and 50 Vietnamese editions, zero
  active primary placeholder covers, full production Playwright `20/20`,
  cleanup `totalMatches: 0`, release documentation, release commit, and
  annotated `v1.2.0` tag.
- The user approved automatic execution of the v1.3 visual merchandising and
  brand polish roadmap on 2026-07-18, with verification after each task and no
  per-step confirmation required.
- `ADR-0008: Visual Merchandising And Brand Polish For v1.3` was accepted on
  2026-07-18 as a bounded polish phase that must not add new payment,
  shipping, database, external-service, commercial-cover, fake-review, or
  marketplace scope.
- `V13-T09` passed on 2026-07-18 with refreshed visual evidence, affected
  regression checks, TypeScript/lint/build, cleanup, stale-claim scan,
  secret-like scan, and mirrored release notes; production deployment and
  tagging were intentionally deferred to explicit user approval in `V13-T10`.
- The user explicitly approved `V13-T10 - Deploy, Smoke Test, Document, And Tag
  v1.3.0` on 2026-07-18.
- `V13-T10` production release was accepted on 2026-07-18 with release-prep
  commit `79347b7`, Vercel deployment `dpl_6in3zn6CsXKtj3mR2xjGVh4X3q59`
  aliased to `https://caseflow-store.vercel.app`, production smoke `ok: true`,
  100 active editions, 100 cover responses, 50 English and 50 Vietnamese
  editions, release documentation, release commit, and annotated `v1.3.0` tag.
- The user approved `QA-FINAL-T01 - Final Post-Release Tester Audit For
  v1.3.0` on 2026-07-18 to verify the released web app from a tester
  perspective before deciding further work.
- `QA-FINAL-T01` passed on 2026-07-18 with final production tester audit
  `ok: true`, production release smoke `ok: true`, full local Playwright
  `20/20`, accessibility/mobile/performance audit `ok: true`, cleanup
  `totalMatches: 0`, secret-like scan, stale-claim scan, TypeScript, lint,
  build, and `git diff --check`. No P0/P1 findings remain open.
- After `v1.3.0` was released, the user reported a real visual defect on
  2026-07-18: related-book recommendation cards could overlap cover art,
  badges, and text at tablet/desktop widths because some fixed grid columns
  were narrower than the responsive compact book-cover frame.
- `HOTFIX-V13-T01` was completed on 2026-07-18 as a patch release candidate:
  compact cover card grid columns now match the responsive compact cover frame,
  a Playwright overlap verifier covers detail recommendations and homepage
  compact cards, production deploy `dpl_CtyPPR1cExwXQWctsh7to98Vg3yb` is
  aliased to `https://caseflow-store.vercel.app`, production overlap
  verification passed, and production release smoke passed on retry after a
  separately probed cart-count timing flake.
- `CLOSEOUT-T01` was completed on 2026-07-19 as documentation-only portfolio
  handoff: public README, app README, CV bullets, known limitations, and
  `docs/portfolio-handoff.md` now describe the latest `v1.3.1` release, demo
  script, feature matrix, architecture, verification evidence, and honest
  portfolio boundaries without changing runtime behavior.
- `CLOSEOUT-T02` was completed on 2026-07-19 as a verification-only final
  repository hygiene audit: GitHub Release `v1.3.1`, production URL, remote
  main, docs links, stale release claims, secret-value hygiene, high-severity
  dependency audit, TypeScript, lint, build, production smoke, compact-card
  verifier, cleanup, and `git diff --check` all passed. No runtime feature,
  schema, dependency, deploy, tag, or release change was introduced.
- The user approved `V14-T01 - Real Commerce + Visual Merchandising ADR` on
  2026-07-19 and authorized automatic implementation of the accepted
  `V14-T02` through `V14-T12` roadmap without per-step confirmation, while
  preserving verification after each task.
- `ADR-0009: Real Commerce And Visual Merchandising Upgrade For v1.4` was
  accepted on 2026-07-19. It governs post-`v1.3.1` runtime commercial-copy
  cleanup, structurally varied merchandising layouts, trust/policy surfaces,
  and operations polish without fake proof signals, commercial-cover copying,
  database migrations, new external integrations, deploys, tags, or releases
  unless a later task explicitly authorizes them.
- `V14-T02` was completed on 2026-07-19 with a runtime no-demo-copy verifier
  scanning `src/app`, `src/components`, and `src/features`; the verifier passed
  across 101 runtime UI files after commercial-language cleanup in homepage,
  footer, checkout, checkout success, and assistant copy. No auth/API/database
  or payment behavior changed.
- `V14-T03` was completed on 2026-07-19 with token-backed visual roles for
  translation, academic, trust, arrival, and operations surfaces in `DESIGN.md`
  and `src/app/globals.css`, plus a verifier proving required CSS/theme tokens
  exist and runtime UI code has no raw hex color additions.
- `V14-T04` was completed on 2026-07-19 with additive merchandising layout
  components in `src/features/books/merchandising-layouts.tsx` for editorial
  feature shelves, deal strips, translation pairs, category spine rails,
  reading paths, and compact retail tiles. The library compiles but is not yet
  wired into homepage/catalog/detail until later V14 tasks.
- `V14-T05` was completed on 2026-07-19 by rewiring homepage sections to use
  structurally distinct V14 layouts: category spine rail, editorial feature,
  reading path, translation pair shelf, and deal strip. Verification passed for
  mobile/tablet/desktop screenshots, no overflow, local images, cover aspect
  ratios, hero card count, product links, and runtime no-demo copy.
- `V14-T06` was completed on 2026-07-19 by adding catalog quick discovery
  links, a stronger active-filter summary, and token-backed catalog card
  variants for offer, translation, editorial, academic, trust, and standard
  records. Catalog visual, filter, pagination, no-demo, TypeScript, lint, and
  diff checks passed.
- `V14-T07` was completed on 2026-07-19 by adding product-detail commercial
  trust panels, edition identity, account checkout proof, inventory proof, and
  structurally varied recommendation tiles while preserving purchase,
  edition-switching, cart, and SEO behavior.
- `V14-T08` was completed on 2026-07-19 by adding bilingual customer-facing
  contact, shipping, payment, returns, privacy, and terms pages; footer support
  context; sitemap/robots coverage; and policy-page visual verification.
- `V14-T09` was completed on 2026-07-19 by making checkout copy and payment
  presentation read like a real bookstore flow: COD and bank transfer are
  prioritized, wallet/gateway methods remain awaiting-confirmation choices,
  policy links are visible, and VND checkout with English USD comparison is
  explicit.
- `V14-T10` was completed on 2026-07-19 by polishing account, customer
  profile, public tracking, and assistant surfaces: internal Supabase/project
  copy was removed from runtime UI, public tracking now exposes a privacy guard
  and minimal public data, assistant is positioned on the mobile right side,
  customer/public tracking verifier login was stabilized through API sessions,
  and screenshot capture avoids Playwright caret-induced hydration warnings.
- On 2026-07-19, the user suggested Project Gutenberg, Standard Ebooks, and
  several Vietnamese ebook/PDF sites as future book-cover/title sources. These
  were recorded in `docs/v1.2-cover-asset-pipeline.md` as source candidates,
  not approved runtime assets; direct cover reuse still requires documented
  public-domain, CC0, license, permission, or replacement/takedown provenance.
- `V14-T11` was completed on 2026-07-19 by adding a reusable admin operations
  rail, denser admin metric treatment, dashboard status rails, mobile recent
  order cards, and operations/trust panel treatment for orders, inventory, and
  customer admin surfaces. Verification covered dashboard/orders/catalog/
  inventory/customers visual smoke across mobile and desktop, staff/admin
  access boundaries, order operations, catalog management, inventory
  adjustments, customer management, dashboard/export/navigation regressions,
  TypeScript, lint, no-demo runtime copy, visual tokens, and diff check.
- `V14-T12` was completed on 2026-07-19 with
  `docs/v1.4-release-readiness-report.md`. The local `v1.4.0` candidate passed
  TypeScript, lint, production build with 48 generated App Router routes, full
  Playwright `20/20` against `next start`, V14 no-demo runtime copy scan,
  V14 visual-token scan, home/catalog/detail/policy/checkout/customer/admin
  visual QA, accessibility/mobile/performance, cleanup `totalMatches: 0`,
  high/critical dependency audit, targeted secret scan across 1058 candidate
  files, and `git diff --check`. A verifier-only screenshot timeout in the
  older accessibility script was fixed and rerun successfully. No deploy, tag,
  GitHub Release, schema migration, production catalog mutation, payment/
  shipping provider integration, or external cover import was performed.
- The user explicitly approved `V14-T13 - Deploy, Smoke Test, Commit, Tag,
  Push, And Create GitHub Release v1.4.0` on 2026-07-19. Release guardrails
  remain active: no schema migration, production catalog mutation, payment/
  shipping provider integration, or external cover import is allowed inside
  this release task.
- `V14-T13` deployed production release candidate commit `3f20bc6` to Vercel
  deployment `dpl_7S279YwsGzB4D6H11PiauzG9GvDL`, aliased it to
  `https://caseflow-store.vercel.app`, and passed production smoke on
  2026-07-19. Production release smoke returned `ok: true` with public pages,
  language mode, cart/checkout boundary, customer boundary, admin boundary,
  assistant, representative detail pages, canonical alias, 100 active editions,
  100 cover responses, 50 English editions, and 50 Vietnamese editions. The
  short production smoke verifier was fixed to accept localized detail titles
  and rerun successfully.
- `QA-V14-FINAL-T01` passed on 2026-07-19 with final production tester audit
  `ok: true`, production release smoke `ok: true`, Vercel production `Ready`,
  GitHub Release `v1.4.0` verified as latest/non-draft/non-prerelease, release
  cleanup `totalMatches: 0`, no-demo runtime copy pass, targeted secret scan
  pass across 1085 files, public current-release docs pointing to `v1.4.0`,
  TypeScript, lint, build, and `git diff --check`. No P0/P1 findings remain
  open. A P3 admin-login vendor-label polish was prepared locally but is not
  part of the already published `v1.4.0` deployment.
- `V141-T01` passed on 2026-07-19 as the stable closeout patch: production
  deployment `dpl_kd4F5BbcWPTNhhXedWHZmTmxJXTW` is aliased to
  `https://caseflow-store.vercel.app`; compact-card layout, customer order
  history/cancellation, staff/admin rejected-cancelled operations, final QA
  smoke, production release smoke, cleanup, secret scan, TypeScript, lint,
  build, and `git diff --check` passed; latest-release docs now point to
  `v1.4.1`.
- `SECQA-T01` passed on 2026-07-19 as an agent-inspired QA and security
  hardening patch: production deployment `dpl_8rPTCFb4pf3MEcoNbXfFiTq7ztSh`
  is aliased to `https://caseflow-store.vercel.app`; `browser-use/web-ui` and
  `agentlabs-dev/auto-inspector` were mapped as QA workflow references, not
  runtime dependencies; security headers/no-store policy were added; security
  posture verifier and final QA smoke passed locally and in production; no
  new dependency, schema migration, external agent integration, or production
  data mutation was introduced.

## v1.2 Canonical Catalog

- Source of truth: `caseflow-store/src/data/books/v1.2-canonical-manifest.json`.
- Runtime status: imported into Supabase production in `V12-T11`; storefront
  homepage merchandising is upgraded in `V12-T12`; catalog cards and discovery
  results are upgraded in `V12-T13`; book detail and edition comparison are
  upgraded in `V12-T14`; admin content-quality and merchandising operations are
  upgraded in `V12-T15`; search, assistant, SEO, cart/order snapshots, exports,
  legacy-link recovery, and documentation integration were completed in
  `V12-T16`; full local release-candidate quality gates passed in `V12-T17`;
  production deployment, smoke, documentation, and release tagging completed in
  `V12-T18`.
- Catalog shape: 50 works, 100 editions, 50 English and 50 Vietnamese editions.
- Compatibility: 98 existing edition IDs/slugs preserved. `The Elements of
  Style` and its two editions are retired without redirect; `The Old Man and
  the Sea` / `Ông già và biển cả` use new IDs.
- Content: bilingual titles, summaries, and merchandising rationales are
  project-written; retailer descriptions and excerpts were not copied.
- Provenance: all 100 editions have one reviewed source-edition key; unavailable
  publisher, translator, ISBN, date, page, format, dimension, or weight facts
  remain null.
- Store boundary: price, stock, threshold, promotion, availability, and
  planned SKU format are CaseFlow merchandising data rather than source claims.
- Cover pipeline rules are accepted from `V12-T06`, and the complete
  100-cover portfolio is accepted from `V12-T07`; the portfolio was imported
  in `V12-T11` and rendered across runtime surfaces by `V12-T16`. The generic
  placeholder is now a fallback/admin quality state, not the active primary
  catalog image set.

## v1.2 Cover Asset Pipeline And Portfolio

- Source of truth: `caseflow-store/src/data/books/v1.2-cover-pilot-manifest.json`.
- Source of truth for full portfolio:
  `caseflow-store/src/data/books/v1.2-cover-portfolio-manifest.json`.
- Runtime status: portfolio assets were imported into Supabase in `V12-T11`
  and rendered across home, catalog, detail, cart, SEO/social metadata, and
  integration checks by `V12-T16`; the generic placeholder remains only as a
  fallback/admin quality signal.
- Asset paths:
  - `caseflow-store/public/images/books/v12-pilot/`
  - `caseflow-store/public/images/books/v12-covers/`
- Pipeline scripts:
  - `caseflow-store/scripts/build-v12-cover-pilot.ts`
  - `caseflow-store/scripts/verify-v12-cover-pipeline.ts`
  - `caseflow-store/scripts/build-v12-cover-portfolio.ts`
  - `caseflow-store/scripts/verify-v12-cover-portfolio.ts`
- Pilot shape: 10 SVG covers, 5 English/Vietnamese pairs, 5 art families,
  600x900 dimensions, 2:3 aspect ratio, and maximum pilot file size under 4 KB.
- Portfolio shape: 100 SVG covers, 50 English and 50 Vietnamese, 50 art
  families, 50 concept keys, zero duplicate hashes, zero placeholder primary
  references in the portfolio manifest, and maximum SVG size under 4 KB.
- Rights boundary: project-created vector art only; no commercial cover,
  publisher mark, external image, marketplace image, or generated reference
  image was used.
- Evidence: `docs/v1.2-cover-asset-pipeline.md` and
  `docs/v1.2-cover-portfolio.md`, plus
  `caseflow-store/.agent/artifacts/v12-t06/` and
  `caseflow-store/.agent/artifacts/v12-t07/`.

## v1.2 Editorial Metadata

- Source of truth:
  `caseflow-store/src/data/books/v1.2-editorial-metadata-manifest.json`.
- Runtime status: imported into Supabase production in `V12-T11`; rendered by
  homepage/catalog/detail surfaces in `V12-T12` through `V12-T14`; admin
  operations surface content quality in `V12-T15`; search/assistant/SEO/docs
  integration was completed in `V12-T16`.
- Builder and verifier:
  - `caseflow-store/scripts/build-v12-editorial-metadata.ts`
  - `caseflow-store/scripts/verify-v12-editorial-metadata.ts`
- Shape: 100 edition records, 334 display-safe optional facts, 100
  content-quality release-ready assessments, and 0 prohibited public-copy
  findings.
- Boundary: unavailable optional facts are omitted, not rendered as `TBC`,
  `null`, `undefined`, placeholder, seed, or debug text.
- Evidence: `docs/v1.2-editorial-metadata.md` and
  `caseflow-store/.agent/artifacts/v12-t08/`.

## v1.2 Merchandising Rules And Storage Contract

- Source of truth:
  `caseflow-store/src/data/books/v1.2-merchandising-rules-manifest.json`.
- Runtime status: imported into Supabase production in `V12-T11` and wired into
  homepage rendering in `V12-T12`, catalog discovery in `V12-T13`, related
  detail recommendations in `V12-T14`, and admin shelf operations in
  `V12-T15`.
- Builder and verifier:
  - `caseflow-store/scripts/build-v12-merchandising-rules.ts`
  - `caseflow-store/scripts/verify-v12-merchandising-rules.ts`
- Shape: 9 shelves total, 8 active shelves, 1 inactive order-derived shelf, 7
  shelf types, localized labels/descriptions, date windows, active state,
  fallback behavior, and deterministic manual/catalog/promotion/inventory/pair
  resolution.
- Boundary: editorial shelves are source-kind `editorial`; sales/order-derived
  shelves are source-kind `order-derived` and remain inactive unless backed by
  a first-party order query, time window, and minimum-data rule.
- Permission: merchandising mutations require `merchandising:manage` and are
  allowed only for admin or staff actors with that permission.
- Storage decision: T09 freezes the minimal additive table contract for
  `book_merchandising_shelves` and `book_merchandising_shelf_items`; the
  reversible SQL migration is deferred to `V12-T10`.
- Evidence: `docs/v1.2-merchandising-rules-storage.md` and
  `caseflow-store/.agent/artifacts/v12-t09/`.

## v1.2 Migration And Rollback Plan

- Source of truth:
  `docs/v1.2-catalog-migration-rollback-plan.md`.
- Migration draft:
  `caseflow-store/supabase/migrations/0008_v12_catalog_merchandising.sql`.
- Planner and verifier:
  - `caseflow-store/scripts/plan-v12-catalog-migration.ts`
  - `caseflow-store/scripts/verify-v12-catalog-migration-plan.ts`
- Runtime status: applied to Supabase production in `V12-T11` after explicit
  user approval and a private pre-migration export.
- Dry-run shape: 1 inserted work, 2 inserted editions, 49 preserved works, 98
  preserved editions, 1 retired work, 2 retired editions, 100 cover assets, 602
  persisted provenance records, 2,000 content-quality checks, 9 merchandising
  shelves, 20 manual shelf items, and zero planned deletes.
- Live evidence: count-only Supabase pre-migration capture succeeded without
  row export or PII row storage.
- Backup boundary: full/private production exports for `V12-T11` must stay
  under `caseflow-store/.agent/artifacts/v12-t10/private-backups/`, which is
  ignored by Git.
- Data hygiene correction: non-Bookland `893...` product codes are no longer
  stored/displayed as ISBN-13, and malformed publisher display values such as
  `vh` were replaced or normalized before import.
- Data-freeze result: 50 active works, 100 active editions, 50 English and 50
  Vietnamese editions, 100 v1.2 cover assets, 602 provenance records, 2,000
  content-quality checks, 3 compatibility records, 9 merchandising shelves, 20
  manual shelf items, and zero active primary placeholder cover references.
- Rollback evidence remains in
  `caseflow-store/.agent/artifacts/v12-t10/private-backups/` and
  `caseflow-store/.agent/artifacts/v12-t11/`.
- Release gate: `V12-T18` deployed and smoke-tested v1.2 production, refreshed
  release documentation, and tags `v1.2.0`.
- Evidence: `caseflow-store/.agent/artifacts/v12-t10/` and
  `caseflow-store/.agent/artifacts/v12-t11/`.

## Working Assumptions

These are defaults that remain tentative until a later task or ADR freezes them:

- Stack: Next.js App Router, TypeScript, Tailwind CSS, Route Handlers, Supabase, Zod, Playwright, Vercel.
- Customer checkout: account-gated checkout for `v1.1`; guest checkout remains the released `v1.0.0` behavior.
- Payment: simulated checkout only.
- Admin authentication: required.
- Cart persistence: localStorage.

## v1.3 Visual Merchandising And Brand Polish

- Governing ADR: `docs/adr/0008-visual-merchandising-brand-polish.md`.
- Roadmap:
  `docs/v1.3-visual-merchandising-brand-polish-roadmap.md`.
- Runtime status: ADR and roadmap accepted in `V13-T01`; visual audit baseline
  completed in `V13-T02`; bookstore token expansion completed in `V13-T03`;
  cover-led merchandising components completed in `V13-T04`; homepage visual
  merchandising completed in `V13-T05`; catalog card and discovery polish
  completed in `V13-T06`; book detail visual hierarchy polish completed in
  `V13-T07`; admin operations visual system polish completed in `V13-T08`;
  full visual QA and documentation gate completed in `V13-T09`; production
  deployment, smoke, documentation, and release tagging completed in
  `V13-T10`.
- Design intent: warmer bookstore palette, cover-led merchandising, stronger
  hierarchy, and Hallmark-informed audit discipline without deleting routes or
  turning commerce surfaces into decorative landing pages.
- Guardrails: no schema migration, no real payment/shipping/verification
  integrations, no external stock imagery, no commercial cover copying, no
  fake ratings/sold counts/bestseller claims, and no stable API contract
  change under v1.3 polish.
- Release status: `v1.3.1` remains the compact-card layout hotfix release.
  Later production releases now supersede it; the current latest production
  release is `v1.10.0`.

## v1.1 Active Product Domain

Confirmed by ADR-0006 and `D22-T01`.

- Product identity: CaseFlow Books.
- Domain: books and sellable book editions.
- Source of truth: `docs/domain.md`.
- Market focus: Vietnam-first, with English as a secondary language mode.
- Catalog target: 500 active sellable book editions at the current v1.6
  baseline, with 250 English and 250 Vietnamese editions.
- Domain-specific features: book works vs editions, English/Vietnamese edition relationships, book-specific filters, account-gated checkout, simulated Vietnam payment methods, staff/admin/customer roles, inventory and sales operations, and a rule-based bookstore assistant.
- Content boundary: use factual metadata carefully; write summaries internally; do not copy commercial covers, publisher blurbs, reviews, or protected excerpts without a clearly permitted source.

## v1.0 Released Product Domain

Confirmed by user-delegated selection on 2026-07-14.

- Domain: phone accessories.
- Categories: phone cases, screen protectors, chargers, cables and adapters, stands and mounts.
- Domain-specific feature: compatibility filtering by phone model.
- Initial seed target: 16 demo products.
- Compatibility labels: `iPhone 13`, `iPhone 14`, `iPhone 15`, `iPhone 16`, `Galaxy S23`, `Galaxy S24`, `Galaxy S25`, `Pixel 8`, `Pixel 9`, `Universal`.
- Source of truth: `docs/domain.md`.
- Historical note: this was the source of truth for the `v1.0.0` release. `docs/domain.md` now governs the accepted CaseFlow Books `v1.1` direction.
- Scope boundary: compatibility is a simple string list for the MVP, not a full phone-model database.

## MVP Scope

### Included

- Store homepage
- Product listing
- Category filter
- Search
- Basic price sorting
- Product detail
- Cart drawer
- localStorage cart persistence
- Guest checkout
- Order confirmation
- Admin login
- Admin order list
- Admin order status update
- Responsive mobile/desktop UI
- Loading, empty, error, and success states
- Server-side validation
- Server-side price calculation
- Supabase persistence
- Playwright E2E happy path
- Vercel deployment
- README, architecture docs, ADRs, known limitations, and CV summary

### Excluded

- Real payment gateway
- Card input fields
- Coupon engine
- Shipping integration
- Reviews and ratings
- Wishlist
- Chat
- Recommendation AI
- Multi-vendor marketplace
- Microservices
- Queue infrastructure
- Redis
- Elasticsearch
- Kubernetes
- Native mobile app
- Complex CMS
- Realtime analytics

## Journal Status

- Entries 01-20 document the real 20 implementation days for `v1.0.0`.
- Entries 21-30 are retrospective notes written after the release.
- Journal root: `docs/journal/README.md`.
- Journal app mirror: `caseflow-store/docs/journal/README.md`.
- Do not present Entries 21-30 as additional implementation days.

## Post-v1.0 Direction Accepted For Day 21 Planning

The user has requested a post-MVP `v1.1` planning phase after the `v1.0.0` release and journal phase.

Accepted direction:

- New product identity: `CaseFlow Books`.
- Market focus: Vietnam-first e-commerce bookstore, with international patterns used only as reference.
- Language strategy: Vietnamese and English site modes.
- Catalog goal: about 100 book editions, with English originals and Vietnamese translations where appropriate.
- Account strategy: login required before purchase; customer contact/address data required for checkout completion.
- Payment strategy: simulated COD, bank transfer, MoMo, ZaloPay, and VNPay-style flows.
- Role strategy: admin, staff/operator, and customer.
- Business operations target: product/category/stock/promotion/customer/order management plus sales and inventory visibility.
- Assistant target: rule-based bookstore assistant for finding books and guiding purchase steps.

Guardrails:

- Work one task ID at a time. Day 40 is complete; continue with post-release audit after the `v1.1.0` tag is created.
- Storefront feature freeze is active after D30-T02; new storefront discovery,
  catalog, detail, language, or cart-entry features now require explicit
  roadmap approval.
- Data/domain/API foundation is frozen after D25-T03; changing book schema,
  domain enums/field names, seed licensing policy, public catalog API envelope,
  or public query semantics now requires explicit review.
- Avoid unlicensed copying of copyrighted book covers or descriptions.
- Treat USD conversion, VAT, and international payment fees as configurable estimates, not legal/tax advice.
- Do not claim real payment processing unless a real provider is integrated and tested.
- Do not claim verified phone numbers without a real phone verification provider.

## v1.1 Roadmap Status

- Roadmap source of truth: `docs/v1.1-caseflow-books-roadmap.md`.
- App mirror: `caseflow-store/docs/v1.1-caseflow-books-roadmap.md`.
- Day 21 planning is complete.
- `D22-T01 - Create Book Domain And Content Policy` is complete.
- `D22-T02 - Define Book TypeScript Domain Contracts` is complete.
- `D22-T03 - Create Book Zod Schemas` is complete.
- `D23-T01 - Draft CaseFlow Books Schema Migration` is complete.
- `D23-T02 - Plan Production Data Migration And Rollback` is complete.
- `D23-T03 - Apply And Verify Book Schema In Supabase` is complete.
- `D24-T01 - Build 100-Edition Book Seed Dataset` is complete.
- `D24-T02 - Create Safe Cover Asset Strategy` is complete.
- `D24-T03 - Seed Book Data Into Supabase` is complete.
- `D25-T01 - Implement Book Row Mappers And Repositories` is complete.
- `D25-T02 - Replace Product APIs With Book Catalog APIs` is complete.
- `D25-T03 - Accept Data/Domain Freeze` is complete.
- `D26-T01 - Rebrand UI To CaseFlow Books` is complete.
- `D26-T02 - Implement Vietnamese/English Language Mode` is complete.
- `D26-T03 - Add Currency Display Rules` is complete.
- `D27-T01 - Build CaseFlow Books Homepage` is complete.
- `D27-T02 - Add Book Category And Discovery Navigation` is complete.
- `D28-T01 - Build Full Book Catalog Page` is complete.
- `D28-T02 - Add Book-Specific Filters And Sorting` is complete.
- `D28-T03 - Add Empty, Loading, And Error Catalog States` is complete.
- `D29-T01 - Build Book Detail Page` is complete.
- `D29-T02 - Add Related Books And Buying Confidence Content` is complete.
- `D30-T01 - Adapt Cart To Book Editions` is complete.
- `D30-T02 - Accept Storefront Feature Freeze` is complete.
- `D31-T01 - Implement Customer Auth Pages` is complete.
- `D31-T02 - Add Customer Profile And Address Requirements` is complete.
- `D32-T01 - Gate Checkout Behind Customer Login` is complete.
- `D32-T02 - Rebuild Checkout Steps For Books` is complete.
- `D33-T01 - Add Vietnam Payment Method Simulation` is complete.
- `D33-T02 - Add Shipping, VAT, And FX Estimate Engine` is complete.
- `D34-T01 - Add Customer Order History` is complete.
- `D34-T02 - Add Public Order Tracking With Guarded Lookup` is complete.
- `D34-T03 - Accept Checkout/Auth Freeze` is complete.
- `D35-T01 - Add Staff/Operator Role` is complete.
- `D35-T02 - Rebuild Admin Navigation For Book Operations` is complete.
- `D36-T01 - Add Admin Book Catalog Management` is complete.
- `D36-T02 - Add Inventory Adjustment Workflow` is complete.
- `D37-T01 - Add Promotion Management` is complete.
- `D37-T02 - Add Customer Management` is complete.
- `D37-T03 - Upgrade Order Operations` is complete.
- `D38-T01 - Add Sales And Inventory Dashboard` is complete.
- `D38-T02 - Add CSV Export For Orders Or Inventory` is complete.
- `D38-T03 - Accept Operations Freeze` is complete.
- `D39-T01 - Add Rule-Based Bookstore Assistant` is complete.
- `D39-T02 - Add SEO And Metadata For Bookstore` is complete.
- `D39-T03 - Run Accessibility, Mobile, And Performance Pass` is complete.
- `D40-T01 - Run Full Local Quality Gate` is complete.
- `D40-T02 - Deploy And Smoke Test v1.1` is complete.
- `D40-T03 - Update Portfolio Documentation` is complete.
- `D40-T04 - Tag v1.1.0 Only If Release Gates Pass` is complete.
- Next task: post-release audit.
- Data/domain freeze is active.
- Data/domain freeze target: end of Day 25.
- Storefront feature freeze is active as of Day 30.
- Checkout/auth freeze is active as of Day 34.
- Operations freeze is active as of Day 38.
- Release candidate target: Day 40.

## v1.1 Portfolio Documentation Status

- D40-T03 is complete as of 2026-07-17.
- The active public portfolio story is CaseFlow Books `v1.1`, not the
  historical phone-accessory `v1.0.0` MVP.
- Updated docs:
  - `README.md`
  - `caseflow-store/README.md`
  - `docs/architecture.md`
  - `docs/known-limitations.md`
  - `docs/cv-bullets.md`
  - `docs/release-candidate.md`
  - `docs/adr/README.md`
- App mirrors match for architecture, known limitations, CV bullets,
  release-candidate notes, and ADR index.
- Stable portfolio screenshots live in
  `caseflow-store/docs/screenshots/`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d40-t03/portfolio-documentation-check.json`.
- Verification passed: docs mirror check, local Markdown link check, screenshot
  load/nonblank check, stale-claim scan, `npx tsc --noEmit`, `npm run lint`,
  and `git diff --check`.

## v1.1 Release Status

- D40-T04 is complete as of 2026-07-17.
- Annotated release tag: `v1.1.0` on commit `90a9907`.
- Production alias: `https://caseflow-store.vercel.app`.
- Production deployment ID: `dpl_BkiJt9gDCh5d2cHwAhpFDbLotoAy`.
- D40 release gates passed:
  - D40-T01 local full quality gate.
  - D40-T02 Vercel production deploy and smoke.
  - D40-T03 portfolio documentation verification.
- Known non-blockers are documented in `docs/known-limitations.md` and
  `docs/v1.1-release-audit.md`.
- The release is the stable baseline for the separate v1.2 planning line.

## v1.2 Provenance Gate Status

- Governing decision:
  `docs/adr/0007-realistic-bookstore-content-merchandising-upgrade.md`.
- Governing roadmap:
  `docs/v1.2-realistic-bookstore-content-merchandising-roadmap.md`.
- `V12-T01` through `V12-T17` are complete as of 2026-07-18.
- Baseline report: `docs/v1.2-catalog-realism-baseline.md`.
- Contract report: `docs/v1.2-provenance-content-quality-contracts.md`.
- Evidence directories: `caseflow-store/.agent/artifacts/v12-t03/`,
  `caseflow-store/.agent/artifacts/v12-t04/`,
  `caseflow-store/.agent/artifacts/v12-t05/`,
  `caseflow-store/.agent/artifacts/v12-t06/`,
  `caseflow-store/.agent/artifacts/v12-t07/`,
  `caseflow-store/.agent/artifacts/v12-t08/`,
  `caseflow-store/.agent/artifacts/v12-t09/`,
  `caseflow-store/.agent/artifacts/v12-t10/`,
  `caseflow-store/.agent/artifacts/v12-t11/`,
  `caseflow-store/.agent/artifacts/v12-t12/`,
  `caseflow-store/.agent/artifacts/v12-t13/`,
  `caseflow-store/.agent/artifacts/v12-t14/`,
  `caseflow-store/.agent/artifacts/v12-t15/`,
  `caseflow-store/.agent/artifacts/v12-t16/`, and
  `caseflow-store/.agent/artifacts/v12-t17/`.
- v1.2 is a post-release versioned iteration, not Day 41+ and not additional
  journal history.
- Seed/Supabase parity is exact: 50 works, 100 active editions, 11 active
  categories, 50 English editions, and 50 Vietnamese editions; QA rows are 0.
- Runtime integration status: the accepted v1.2 catalog, editorial metadata,
  covers, provenance, content-quality checks, compatibility records, and
  merchandising shelves are imported into Supabase and wired through the public
  storefront, admin catalog operations, search, assistant, SEO, cart/order
  snapshots, exports, legacy retired-link recovery, and current docs.
- Local release-candidate status: `V12-T17` passed TypeScript, ESLint,
  production build, full Playwright `20/20`, aggregate content/asset/runtime
  reports, mobile performance baseline, cleanup, secret scan, and diff hygiene
  on 2026-07-18.
- Primary visual blocker from the baseline audit was resolved in the admin
  catalog operations pass; public home, catalog, detail, and admin catalog
  checks have zero horizontal overflow at audited breakpoints.
- Contract decision: keep legacy `SourceNote` stable and use the separate
  `CatalogProvenanceRecord`, `EditionProvenanceSet`, content-quality checklist,
  and approved-only public serializer for v1.2 catalog content.
- Validation requires complete licensed/public-domain rights data, explicitly
  identifies internal/generated media, rejects mixed source editions, and
  gives no quality credit to missing or unverified facts.
- Schema decision: the additive reversible SQL/upsert plan is accepted; no
  destructive change is justified and T11 must preserve customer, order,
  promotion, inventory-adjustment, profile, phone catalog, and auth data.
- Accepted direction: provenance-first catalog records, edition-specific safe
  cover assets, truthful data-backed merchandising, focused homepage/catalog/
  detail improvements, and admin content-quality visibility.
- Current task: `V12-T18 - Deploy, Smoke Test, Document, And Tag v1.2.0`.

## v1.1 Promotion Management Status

- D37-T01 is complete as of 2026-07-17.
- Promotions are intentionally admin-only because discounts affect revenue and
  checkout totals.
- Admin can create, edit, activate, and deactivate simple fixed-VND or
  percentage promotion codes with bilingual names and validity windows.
- Staff and customers cannot access promotion APIs; the admin navigation check
  was updated so staff no longer expects the Promotions item.
- Checkout accepts an optional promotion code, but the server evaluates the
  code, clamps the discount to the order subtotal, recalculates VAT and total,
  and writes the promotion snapshot to the order.
- Expired, inactive, invalid, over-limit, and tampered promotion cases are
  covered by `caseflow-store/scripts/verify-promotion-management.ts`.
- Verification evidence:
  - `caseflow-store/.agent/artifacts/d37-t01/promotion-management-check.json`
  - `caseflow-store/.agent/artifacts/d37-t01/admin-promotions-desktop-en.png`

## v1.1 Customer Management Status

- D37-T02 is complete as of 2026-07-17.
- Admin and staff can search customer profiles and inspect a read-only customer
  detail panel from `/admin/customers`.
- Customer management access is backed by the existing `orders:read`
  permission; anonymous requests return `UNAUTHORIZED`, customer sessions return
  `FORBIDDEN`, and admin/staff sessions can read the operational customer view.
- The admin customer API intentionally minimizes sensitive data: it exposes
  email, verification/profile state, masked phone last-four, district/province
  shipping summary, and order metrics, but not full address lines or raw phone
  numbers.
- Customer metrics include order count, total spend, last order code/date, and
  checkout-readiness fields derived from the stored profile.
- Verification evidence:
  - `caseflow-store/.agent/artifacts/d37-t02/admin-customers-check.json`
  - `caseflow-store/.agent/artifacts/d37-t02/admin-customers-desktop-en.png`

## v1.1 Order Operations Status

- D37-T03 is complete as of 2026-07-17.
- Admin/staff order list now supports server-backed filters for search, order
  status, payment status, and shipping status.
- Admin/staff order detail can update order status, payment status, shipping
  status, and internal notes through `PATCH /api/admin/orders/[id]`.
- Order, payment, and shipping transitions are enforced server-side. Invalid
  transitions return `ORDER_INVALID_TRANSITION`.
- `internal_notes` is stored on orders but intentionally remains outside
  customer/public order payloads.
- Supabase migration `0007_order_operations_fields.sql` was applied and
  verified with `shipping_status`, `internal_notes`, constraints, and index.
- Verification evidence:
  - `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-check.json`
  - `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-desktop-en.png`

## v1.1 Sales And Inventory Dashboard Status

- D38-T01 is complete as of 2026-07-17.
- `/admin` now renders a real server-backed sales and inventory dashboard
  instead of a placeholder shell.
- `GET /api/admin/dashboard` requires `orders:read` and returns dashboard
  metrics from Supabase.
- Dashboard metrics include revenue estimate, order count, average order value,
  payment summary, order status summary, top books, low-stock editions, recent
  orders, and active/low/out-of-stock inventory counts.
- Dashboard date filtering supports `7d`, `30d`, `all`, and custom `from/to`
  ranges. Custom future ranges were used to verify empty-state rendering without
  mutating real data.
- Verification evidence:
  - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`
  - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-empty-mobile-en.png`

## v1.1 CSV Export Status

- D38-T02 is complete as of 2026-07-17.
- Admin and staff can export server-generated order CSV data from
  `/api/admin/exports/orders`.
- The dashboard date-range controls link to the export route and preserve
  `7d`, `30d`, `all`, or custom `from/to` ranges.
- The export requires `orders:read`; anonymous requests return `UNAUTHORIZED`,
  and customer sessions return `FORBIDDEN`.
- The CSV includes operational order fields such as order code, statuses,
  payment/shipping methods, item count, totals, and promotion code. It
  intentionally excludes customer email, phone, full address, customer id, and
  internal notes.
- D38-T01 dashboard verification was rerun after fixing its QA catalog fixture
  so temporary active books now include valid author/category relationships.
- Verification evidence:
  - `caseflow-store/.agent/artifacts/d38-t02/admin-orders-csv-export-check.json`

## v1.1 Operations Freeze Status

- D38-T03 is complete as of 2026-07-17.
- Operations freeze is now active for admin/staff navigation, role boundaries,
  catalog management, inventory adjustments, promotion management, customer
  management, order operations, dashboard metrics, and order CSV export.
- Staff can operate dashboard, orders, catalog, inventory, and customers. Admin
  can additionally manage promotions and the admin-only settings boundary.
- New operations features now require explicit review unless they are
  release-blocking fixes or security fixes that preserve or strengthen the
  frozen permission model.
- Remaining risks are explicit in `docs/v1.1-operations-freeze.md`: simulated
  payment/shipping, no automatic stock decrement on order creation, no immutable
  staff action audit trail, portfolio-scale CSV export, no production rate
  limiter, and estimate-only dashboard revenue.
- Verification evidence:
  - `docs/v1.1-operations-freeze.md`
  - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-check.json`
  - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-staff-dashboard.png`
  - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-admin-settings.png`

## v1.1 Bookstore Assistant Status

- D39-T01 is complete as of 2026-07-17.
- A rule-based assistant widget is mounted in the app shell through
  `AppProviders`.
- The assistant can parse title/search queries plus category, edition language,
  format, and VND price range hints, then link to matching catalog or book
  detail routes.
- The assistant includes suggested messages and no-result recovery links.
- Checkout guidance can open the cart and link to account/checkout, but it does
  not add cart items, create orders, bypass login, bypass profile requirements,
  or bypass server-side checkout validation.
- No external AI API is used; the verification script checks for common external
  AI endpoint/API-key references in the assistant source.
- Verification evidence:
  - `caseflow-store/.agent/artifacts/d39-t01/bookstore-assistant-check.json`
  - `caseflow-store/.agent/artifacts/d39-t01/assistant-find-book-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t01/assistant-no-result-mobile-en.png`
  - `caseflow-store/.agent/artifacts/d39-t01/assistant-checkout-guidance-desktop-en.png`

## v1.1 Domain Contract Status

- Source file: `caseflow-store/src/types/domain.ts`.
- D22-T02 added CaseFlow Books constants and types while preserving legacy `v1.0.0` product/accessory exports needed by the current runtime.
- New contracts cover book works, editions, authors, translators, publishers, categories, inventory status, language, format, VND pricing, tax/fee/FX estimates, roles, customer profile requirements, payment methods, book cart items, book orders, promotions, and inventory adjustments.
- VND remains the source-of-truth currency; USD appears only as an approximate display estimate type.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## v1.1 Validation Schema Status

- Source file: `caseflow-store/src/lib/validation/domain.ts`.
- D22-T03 added CaseFlow Books Zod schemas while preserving legacy `v1.0.0` validation schemas.
- Schemas cover book categories, authors, translators, publishers, cover assets, works, editions, cart items, shipping addresses, customer/staff profiles, profile completeness, tax/fee/FX estimates, book orders, order items, promotions, inventory adjustments, checkout requests, and profile update requests.
- Strict mutating request schemas reject browser-supplied trusted fields such as `role`, `status`, and `totals`.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, focused runtime schema checks, and `npm run build`.

## v1.1 Schema Migration Draft Status

- Source file: `caseflow-store/supabase/migrations/0006_caseflow_books_schema_draft.sql`.
- D23-T01 drafted the CaseFlow Books v1.1 database expansion without applying SQL to Supabase.
- The draft keeps the legacy v1.0.0 phone-accessory tables compatible while adding bookstore tables for book categories, authors, translators, publishers, cover assets, works, editions, edition translators, customer addresses, promotions, and inventory adjustments.
- The draft extends `profiles` role support to `customer`, `staff`, and `admin`.
- The draft extends `orders` and `order_items` with v1.1 customer, payment method, payment status, shipping method, tax/fee estimate, display estimate, and book edition snapshot fields.
- The draft preserves deny-by-default posture: public/authenticated users receive read-only active catalog policies, customer addresses are readable only by owner, operational writes stay behind service-role usage, and no direct public order-table write policies were added.
- The draft includes a service-role-only `create_book_order_with_items` RPC for account-gated book checkout snapshots.
- Verification passed by SQL inspection, service-role source search, and `git diff --check`.
- Local `psql` is not installed; D23-T03 used a verified direct PostgreSQL connection through a temporary JS PostgreSQL client because Supabase CLI dump required Docker in this local environment.

## v1.1 Production Migration And Rollback Plan Status

- Source file: `docs/v1.1-production-data-migration-rollback-plan.md`.
- App mirror: `caseflow-store/docs/v1.1-production-data-migration-rollback-plan.md`.
- D23-T02 accepted an expand-and-contract strategy: preserve v1.0.0 phone-accessory categories, products, profiles, orders, and order items in place while adding v1.1 book schema.
- The plan states that phone-accessory data is not converted into book data; CaseFlow Books seed data starts separately in Day 24.
- D23-T03 must create backup/export evidence before applying SQL.
- D23-T03 must run pre-migration checks, apply the schema through a verified transactional path, run post-migration DB checks, and rerun v1.0.0 app regression checks.
- Rollback preference is app rollback first if additive DB schema remains compatible, DB cleanup only before live v1.1 data exists, and provider backup restore for corruption or missing production data.
- No SQL was applied and no destructive database operation was performed in D23-T02.

## v1.1 Supabase Schema Apply Status

- D23-T03 is complete as of 2026-07-16.
- Target project: Supabase project `caseflow-store`, project ref `fcsuldrerhbynwotcvyn`.
- Initial D23-T03 preflight correctly blocked before SQL apply because backup/export evidence was unavailable.
- Retry proceeded after `SUPABASE_DB_URL` was added to `caseflow-store/.env.local`.
- Supabase CLI dump was attempted but could not run because this local environment lacks Docker Desktop; D23-T03 used a verified direct PostgreSQL metadata/data export for the `public` schema instead.
- Backup/export evidence exists under `caseflow-store/.agent/artifacts/d23-t03-backup/`.
- SQL backup files are intentionally ignored by Git because they may contain app/customer PII.
- Migration apply evidence exists at `caseflow-store/.agent/artifacts/d23-t03/migration-apply.json`.
- Database verification evidence exists at:
  - `caseflow-store/.agent/artifacts/d23-t03/pre-migration-checks.json`
  - `caseflow-store/.agent/artifacts/d23-t03/post-migration-db-checks.json`
  - `caseflow-store/.agent/artifacts/d23-t03/post-migration-access-control-checks.json`
  - `caseflow-store/.agent/artifacts/d23-t03/verification-summary.md`
- Applied migration: `caseflow-store/supabase/migrations/0006_caseflow_books_schema_draft.sql`.
- Expected CaseFlow Books tables, order/order item v1.1 columns, RLS flags, policies, grants, constraints, triggers, and `create_book_order_with_items` were verified.
- Anon and authenticated roles cannot directly read protected order/admin tables and have no direct write privileges on those protected tables.
- v1.0.0 catalog/profile counts were preserved and direct book orders remain `0`.
- Post-migration verification passed: `npm run lint`, `npm run build`, `npm run test:e2e` with `20/20`, and production smoke checks.
- Day 23, Day 24, Day 25, Day 26, Day 27, and Day 28 are complete; next
  task is `D29-T01 - Build Book Detail Page`.

## v1.1 Book Seed Dataset Status

- D24-T01 is complete as of 2026-07-16.
- Source file: `caseflow-store/src/data/books/seed.ts`.
- Verification artifact: `caseflow-store/.agent/artifacts/d24-t01/seed-summary.json`.
- Dataset contains 50 real public-domain/classic works and 100 sellable CaseFlow Books demo editions.
- Every work has one English edition and one Vietnamese edition relationship.
- Dataset includes 11 categories, 41 authors, 1 demo publisher, 50 works, and 100 editions.
- Language distribution is balanced: 50 English editions and 50 Vietnamese editions.
- Edition data includes title, work/category/author relationship, language, format, VND price, stock, publication year where safe, and project-written summaries.
- ISBNs are intentionally `null` to avoid fabricating real identifiers.
- Cover strategy is now defined by D24-T02.
- Content scan passed: no copied-blurb markers, no overlong summaries, no duplicate long summaries, no commercial cover references, and no fabricated ISBNs.
- Verification passed: runtime import/count check, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.

## v1.1 Safe Cover Asset Status

- D24-T02 is complete as of 2026-07-16.
- Strategy docs:
  - `docs/v1.1-safe-cover-asset-strategy.md`
  - `caseflow-store/docs/v1.1-safe-cover-asset-strategy.md`
- Placeholder asset: `caseflow-store/public/images/books/placeholders/book-cover-placeholder.svg`.
- Seed file now includes one internal `BookCoverAsset` and maps all 100 editions to the stable placeholder cover ID.
- No commercial cover URLs, publisher cover files, marketplace image links, or external hotlinked assets are used.
- Verification artifact: `caseflow-store/.agent/artifacts/d24-t02/cover-strategy-check.json`.
- Visual smoke screenshot: `caseflow-store/.agent/artifacts/d24-t02/cover-placeholder-smoke.png`.
- Verification passed: local path exists, SVG has accessible title metadata, no external `href/src`, 100/100 editions have a stable cover ID, Playwright visual smoke rendered, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.

## v1.1 Book Supabase Seed Status

- D24-T03 is complete as of 2026-07-16.
- Seed script: `caseflow-store/scripts/seed-books.ts`.
- Seed verification artifact: `caseflow-store/.agent/artifacts/d24-t03/seed-books-apply.json`.
- Supabase seed counts:
  - `book_categories`: 11
  - `book_authors`: 41
  - `book_publishers`: 1
  - `book_cover_assets`: 1
  - `book_works`: 50
  - `book_work_authors`: 51
  - `book_work_categories`: 100
  - `book_editions`: 100
  - `book_edition_translators`: 0
- Active edition language distribution: 50 English and 50 Vietnamese.
- Legacy phone-accessory tables remain preserved: `categories` 5 and `products` 16.
- Public Supabase smoke query returned 100 active `book_editions` and sampled bookstore rows only.
- Verification passed: dry-run, apply rerun/upsert, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- Day 24, Day 25, Day 26, Day 27, and Day 28 are complete; next task is
  `D29-T01 - Build Book Detail Page`.

## v1.1 Book Repository Status

- D25-T01 is complete as of 2026-07-16.
- Supabase database types now include the v1.1 book catalog tables and the order/order item columns added by the book schema migration.
- Book row mappers live in `caseflow-store/src/lib/supabase/book-mappers.ts`.
- Book catalog repository functions live in `caseflow-store/src/lib/repositories/supabase-books.ts`.
- Repository support currently includes book category listing, edition catalog listing, category/language/format/author/price/search/featured/availability filtering, sort/pagination, edition detail lookup by slug, and related-edition lookup by work.
- The old phone-accessory catalog repository remains available for legacy UI/cart flows, but public catalog APIs were cut over to book DTOs in `D25-T02`.
- Runtime verification script: `caseflow-store/scripts/verify-book-repository.ts`.
- Verification artifact: `caseflow-store/.agent/artifacts/d25-t01/book-repository-check.json`.
- Runtime verification passed with 100 book records, 50 English editions, 50 Vietnamese editions, joined detail data for `pride-and-prejudice-english-special-edition`, a sibling Vietnamese related edition, and legacy phone products still readable at count 16.
- Verification passed: `npx tsx scripts/verify-book-repository.ts`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.

## v1.1 Book Catalog API Status

- D25-T02 is complete as of 2026-07-16.
- Public catalog APIs now return book DTOs while preserving the stable
  `{ data, error, meta }` envelope.
- Updated routes:
  - `GET /api/categories` returns book categories with `type:
    "book-category"`.
  - `GET /api/products` returns book editions with `type: "book-edition"`.
  - `GET /api/products/[slug]` returns book edition detail plus
    `relatedEditions`.
- Query validation source: `caseflow-store/src/lib/validation/books.ts`.
- API DTO serializer source: `caseflow-store/src/lib/api/book-catalog.ts`.
- Supported list query parameters: `category`, `language`, `format`, `author`,
  `minPriceVnd`, `maxPriceVnd`, `q`, `search`, `featured`, `availability`,
  `sort`, `limit`, and `offset`.
- `BOOK_EDITION_NOT_FOUND` was added to the stable API error contract for
  missing active book edition detail responses. `PRODUCT_NOT_FOUND` remains for
  legacy cart/product flows until those are migrated.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d25-t02/api-curl-checks.json`.
- Curl/API smoke covered categories, default list, language/author filter,
  category/format/price/availability filter, search, pagination, invalid query,
  invalid price range, detail, and missing detail.
- Verification passed: API curl smoke checks, `npm run lint`,
  `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- Temporary roadmap boundary: the storefront UI pages still use the legacy
  phone-accessory repository until the Day 26-30 UI pivot tasks. Do not treat
  that as final product behavior.

## v1.1 Data/Domain Freeze Status

- D25-T03 is complete as of 2026-07-16.
- Freeze docs:
  - `docs/v1.1-data-domain-freeze.md`
  - `caseflow-store/docs/v1.1-data-domain-freeze.md`
- Freeze artifact:
  `caseflow-store/.agent/artifacts/d25-t03/data-domain-freeze-check.json`.
- Frozen foundation includes book domain contracts, Zod schemas, Supabase book
  schema, safe seed strategy, safe cover strategy, row mappers, repositories,
  API DTOs, public catalog routes, and the stable `{ data, error, meta }`
  envelope.
- Known risks were documented before storefront expansion, including the
  temporary `/api/products` book DTO path, legacy phone UI still active, old
  v1.0 release API tests no longer matching the D25 catalog API, in-memory
  filtering at 100-edition scale, placeholder-only covers, no translator rows,
  and book checkout not yet wired.
- Verification passed: freeze artifact/API smoke, `npm run lint`,
  `npx tsc --noEmit`, and `git diff --check`.
- Day 25 is complete. Day 26 starts the visible storefront pivot.

## v1.1 UI Rebrand Status

- D26-T01 is complete as of 2026-07-16.
- Visible app identity is now CaseFlow Books in layout metadata, header,
  footer, active homepage copy, book detail route copy, checkout metadata, admin
  metadata, and README references.
- Homepage now reads from `listSupabaseBookCatalog` and
  `listSupabaseBookCategories` and renders bookstore-oriented hero, stats,
  reading categories, featured editions, reading-path guidance, and support
  cards.
- `/products/[slug]` now renders a minimal book edition detail page with cover,
  author, categories, language, format, price, stock, work context, and related
  editions.
- The public route path remains `/products/[slug]` for now, but visible copy is
  book-oriented. Canonical route naming remains a known post-freeze API/UI risk.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d26-t01/rebrand-visual-text-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d26-t01/home-desktop.png`
  - `caseflow-store/.agent/artifacts/d26-t01/home-mobile.png`
- Text search over active UI/README found no old phone-accessory marketing copy.
- Verification passed: Playwright desktop/mobile screenshots, `npm run lint`,
  `npx tsc --noEmit`, `npm run build`, and `git diff --check`.

## v1.1 Bilingual Language Mode Status

- D26-T02 is complete as of 2026-07-16.
- Language preference is stored in the `caseflow-books.language` cookie and set
  through the validated `POST /api/preferences/language` route.
- The root layout reads the selected language server-side and sets `html lang`.
- Header, mobile navigation, footer, homepage, book detail, book not-found,
  cart drawer, checkout, checkout success, admin login, and admin orders now
  receive or read the selected language for core visible labels where
  implemented.
- Homepage and book detail prefer localized book/category fields from the book
  catalog data instead of hard-coding product text.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d26-t02/language-mode-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d26-t02/header-en-desktop.png`
  - `caseflow-store/.agent/artifacts/d26-t02/header-vi-desktop.png`
  - `caseflow-store/.agent/artifacts/d26-t02/header-en-mobile.png`
  - `caseflow-store/.agent/artifacts/d26-t02/header-vi-mobile.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  Playwright language switch checks, screenshot review, and `git diff --check`.
- Known content-quality risk: existing seeded Vietnamese book/category content
  still contains some unaccented text. This does not block the language-mode
  infrastructure, but it should be corrected with explicit data-update evidence
  before claiming polished Vietnamese content.

## v1.1 Currency Display Rules Status

- D26-T03 is complete as of 2026-07-16.
- VND remains the authoritative stored/source currency.
- English mode now displays approximate USD estimates on homepage and book
  detail price surfaces while preserving VND as the primary visible price.
- Vietnamese mode hides approximate USD estimates and continues to show VND.
- FX/VAT/fee assumptions are server-owned and validated with Zod:
  - default source: HSBC Vietnam telegraphic selling rate.
  - default rate: `26,400 VND/USD`.
  - quoted timestamp: `2026-07-16T08:35:00+07:00`.
  - default VAT estimate: `1000` basis points.
  - default international payment fee estimate: `300` basis points.
- `.env.example` documents server-only override variables for exchange rate,
  source label/source URL, quoted timestamp, VAT basis points, and
  international payment fee basis points.
- Verification artifacts:
  - `caseflow-store/.agent/artifacts/d26-t03/currency-display-rules-check.json`
  - `caseflow-store/.agent/artifacts/d26-t03/currency-display-visual-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d26-t03/currency-en-home.png`
  - `caseflow-store/.agent/artifacts/d26-t03/currency-vi-home.png`
- Verification passed: runtime currency rule check, Playwright display smoke,
  screenshot review, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and
  `git diff --check`.
- Known follow-up risk: Next dev reported an LCP warning for the above-the-fold
  placeholder cover image. This should be addressed during Day 27 homepage or
  later SEO/performance work.

## v1.1 Bookstore Homepage Status

- D27-T01 is complete as of 2026-07-16.
- Source file: `caseflow-store/src/app/page.tsx`.
- Homepage now presents bookstore categories, featured books, new arrivals,
  translated English/Vietnamese edition pairs, Vietnamese recommendations, and
  trust/shipping signals.
- Homepage reads the 100-edition Supabase-backed catalog but renders a curated
  subset only: 14 unique editions and 12 visible book cards in the D27-T01
  verification artifact.
- Book cards and hero cards link to valid existing book detail routes.
- The homepage does not create a full catalog route; D28-T01 owns that page to
  avoid adding dead or placeholder links in D27-T01.
- Vietnamese homepage category and selected title copy received scoped accent
  polish without changing the frozen book schema, public catalog API, or seed
  data contract.
- The global footer disclosure was changed from demo/simulation wording to a
  no-card/no-wallet-credential disclosure, preserving the guardrail against
  collecting sensitive payment data without making the storefront read like a
  project note.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d27-t01/homepage-sections-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d27-t01/home-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d27-t01/home-mobile-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-homepage-sections.ts`, screenshot review, and
  `git diff --check`.

## v1.1 Discovery Navigation Status

- D27-T02 is complete as of 2026-07-16.
- Source files:
  - `caseflow-store/src/components/layout/navigation.ts`
  - `caseflow-store/src/components/layout/mobile-navigation.tsx`
  - `caseflow-store/src/app/products/[slug]/page.tsx`
  - `caseflow-store/src/app/products/[slug]/not-found.tsx`
  - `caseflow-store/src/features/checkout/checkout-page.tsx`
  - `caseflow-store/src/features/checkout/checkout-success-page.tsx`
- Primary desktop navigation now links only to valid current routes/anchors:
  home, categories, featured books, edition pairs, support, and admin.
- Mobile navigation includes a Discovery group for new arrivals, current
  offers, and Vietnamese recommendations without crowding the desktop header.
- Footer navigation links to valid shop/help anchors and the admin entry point.
- Product detail now has a Home / Books / current-edition breadcrumb; product
  not-found and checkout recovery links now return to `/#featured`.
- Old dead anchors `#books`, `#reading-path`, and `#checkout` were removed from
  active source navigation.
- Customer account, public order tracking, and real promotion management routes
  remain deferred to their accepted roadmap tasks rather than being represented
  by placeholder links.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d27-t02/discovery-navigation-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d27-t02/navigation-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d27-t02/navigation-mobile-vi-open.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-discovery-navigation.ts`, source anchor scan,
  screenshot review, and `git diff --check`.

## v1.1 Catalog Page Status

- D28-T01 is complete as of 2026-07-16.
- Source file: `caseflow-store/src/app/catalog/page.tsx`.
- New route: `/catalog`.
- The catalog page lists the seeded 100-edition bookstore catalog in
  manageable pages of 24 cards per page.
- Cards show cover/placeholder image, title, author, category, language,
  format, VND price plus English-mode USD estimate, stock state/quantity, and
  sale state (`Featured shelf` or `Standard price`).
- Result count and active view chips are visible. The active view is intentionally
  limited to all-category/all-language/all-format plus title A-Z/page state;
  full filter and sorting behavior is owned by D28-T02.
- Header/footer navigation now include the `/catalog` route.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d28-t01/catalog-page-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d28-t01/catalog-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d28-t01/catalog-mobile-vi-page-2.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-catalog-page.ts`, updated
  `npx tsx scripts/verify-discovery-navigation.ts`, screenshot review, and
  `git diff --check`.

## v1.1 Catalog Filters And Sorting Status

- D28-T02 is complete as of 2026-07-16.
- Source file: `caseflow-store/src/app/catalog/page.tsx`.
- Catalog filters are URL-backed and recoverable through search params.
- Supported filters: category/genre, language, format, author, min/max VND
  price, availability, featured-shelf promotion state, and search.
- Supported UI sorts: relevance/default, newest, price low-high, price
  high-low, title A-Z, and author A-Z.
- Pagination preserves the active filter/sort query state.
- Invalid query params are ignored safely rather than crashing the page.
- Scope note: UI-only sorts `relevance` and `author-asc` did not expand the
  frozen public `/api/products` sort contract. API/UI count agreement was
  verified for representative filters already supported by the public API.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d28-t02/catalog-invalid-mobile-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-catalog-page.ts`,
  `npx tsx scripts/verify-catalog-filters.ts`, screenshot review, and
  `git diff --check`.

## v1.1 Catalog States Status

- D28-T03 is complete as of 2026-07-16.
- Shared state UI source:
  `caseflow-store/src/features/books/catalog-states.tsx`.
- Runtime catalog states:
  - `caseflow-store/src/app/catalog/loading.tsx`
  - `caseflow-store/src/app/catalog/error.tsx`
- QA preview route:
  `caseflow-store/src/app/catalog-state-preview/page.tsx`.
- The catalog now has bilingual loading, empty, and error states.
- Empty states include clear recovery actions for clearing filters or returning
  to featured books.
- Error states use customer-safe copy and do not expose stack traces, exception
  names, SQL details, environment values, or implementation internals.
- Verification script:
  `caseflow-store/scripts/verify-catalog-states.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d28-t03/catalog-states-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-loading.png`
  - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-empty.png`
  - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-error.png`
  - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-loading.png`
  - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-empty.png`
  - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-error.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-catalog-states.ts`,
  `npx tsx scripts/verify-catalog-page.ts`, screenshot review, and
  `git diff --check`.
- Day 28 is complete; `D29-T01 - Build Book Detail Page` is complete.

## v1.1 Book Detail Page Status

- D29-T01 is complete as of 2026-07-16.
- Source files:
  - `caseflow-store/src/app/products/[slug]/page.tsx`
  - `caseflow-store/src/features/books/book-edition-purchase-controls.tsx`
- The book detail page shows cover/placeholder, title, author, category,
  language, format, price, stock, summary, publisher, translator, ISBN,
  original title, original language, publication era, shipping/totals hints,
  payment-method hints, and related edition links.
- Add-to-cart behavior now targets the specific sellable book edition id using
  the existing local cart context.
- Scope note: D29-T01 intentionally does not replace cart validation or drawer
  rendering with book-edition semantics. That belongs to `D30-T01 - Adapt Cart
  To Book Editions`.
- Verification script:
  `caseflow-store/scripts/verify-book-detail-page.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d29-t01/book-detail-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d29-t01/book-detail-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d29-t01/book-detail-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d29-t01/book-detail-not-found.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-book-detail-page.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Related Books And Buying Confidence Status

- D29-T02 is complete as of 2026-07-16.
- Source file: `caseflow-store/src/app/products/[slug]/page.tsx`.
- Verification script:
  `caseflow-store/scripts/verify-book-detail-confidence.ts`.
- Book detail pages now show related recommendations based on existing
  author/category/language catalog data.
- Recommendation cards include reason badges and link only to valid book detail
  routes.
- Buying-confidence content now includes shipping/totals, payment options, and
  return support in both English and Vietnamese.
- Focused source search confirmed the active detail page/book purchase source
  no longer contains phone-accessory compatibility copy such as iPhone, Galaxy,
  Pixel, screen protector, phone case, charger, cable, or accessory wording.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d29-t02/book-confidence-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-mobile-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-book-detail-confidence.ts`, regression
  `npx tsx scripts/verify-book-detail-page.ts`, screenshot review, focused
  source search, and `git diff --check`.
- Day 29 is complete. `D30-T01 - Adapt Cart To Book Editions` is complete.

## v1.1 Book Cart Status

- D30-T01 is complete as of 2026-07-16.
- Source files:
  - `caseflow-store/src/types/catalog.ts`
  - `caseflow-store/src/lib/repositories/supabase-books.ts`
  - `caseflow-store/src/app/api/cart/validate/route.ts`
  - `caseflow-store/src/features/cart/cart-drawer.tsx`
  - `caseflow-store/src/features/checkout/checkout-page.tsx`
- `/api/cart/validate` now validates book edition ids against the Supabase book
  catalog instead of the legacy phone-accessory products table.
- Local cart storage still stores only `{ productId, quantity }`; for v1.1 the
  `productId` value is the sellable book edition id.
- Cart validation reloads book edition data server-side, checks stock/status,
  and recalculates unit prices, line totals, and subtotal.
- Cart drawer and checkout review now display book cover, title, author,
  category, edition language, format, price, quantity, stock, line total, and
  subtotal.
- Tampered localStorage/client payloads cannot force title, price, stock, line
  total, or subtotal into the validated cart.
- Scope note: account-gated checkout and v1.1 book order creation were completed
  by the Day 32 checkout/auth tasks.
- Verification script: `caseflow-store/scripts/verify-book-cart.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d30-t01/book-cart-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d30-t01/book-cart-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d30-t01/book-cart-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d30-t01/book-cart-tampered-storage.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-book-cart.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Customer Order History Status

- D34-T01 is complete as of 2026-07-16.
- Customer order history page exists at `/account/orders`.
- Customer-scoped APIs exist at:
  - `GET /api/customer/orders`
  - `GET /api/customer/orders/[orderCode]`
- Repository reads filter by `customer_id` before returning customer order
  records.
- Order history displays order code, order status, payment method, payment
  status, total, created time, and item snapshots.
- Cross-customer detail lookup returns `ORDER_NOT_FOUND` and another customer's
  order does not appear in the list.
- Verification script:
  `caseflow-store/scripts/verify-customer-order-history.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d34-t01/customer-order-history-check.json`.
- Screenshot:
  `caseflow-store/.agent/artifacts/d34-t01/customer-order-history-desktop-en.png`.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-customer-order-history.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Public Order Tracking Status

- D34-T02 is complete as of 2026-07-16.
- Public order tracking page exists at `/orders/track`.
- Public tracking API exists at `POST /api/orders/track`.
- Lookup requires `orderCode` plus matching customer email or phone from the
  checkout snapshot.
- Order code casing, email casing, and common Vietnam phone formatting are
  normalized before matching.
- Wrong-contact and missing-order lookups return the same `ORDER_NOT_FOUND`
  response.
- Public tracking payload intentionally excludes customer email, phone,
  shipping address, and item detail.
- Tracking UI displays order status timeline plus payment method, payment
  status, shipping method, total, and updated timestamp.
- Navigation and footer link to `/orders/track`.
- API contract and known limitations were updated to reflect the guarded public
  lookup and remaining notification/rate-limit gaps.
- Verification script:
  `caseflow-store/scripts/verify-public-order-tracking.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d34-t02/public-order-tracking-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d34-t02/public-tracking-success-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d34-t02/public-tracking-error-mobile-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-public-order-tracking.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Checkout/Auth Freeze Status

- D34-T03 is complete as of 2026-07-16.
- Checkout/auth freeze is active.
- Freeze document:
  `docs/v1.1-checkout-auth-freeze.md`.
- App mirror:
  `caseflow-store/docs/v1.1-checkout-auth-freeze.md`.
- Frozen behavior covers customer auth/profile requirements, checkout login
  gate, server-owned totals, simulated payment methods, customer order history,
  and guarded public order tracking.
- Admin/staff work from Day 35 onward must not weaken the frozen checkout/auth
  contracts without an explicit roadmap or ADR review.
- Remaining documented risks include simulated payment, no phone OTP, Supabase
  email verification dependence, no public tracking rate limiter/CAPTCHA, no
  customer notifications, local-only cart, no stock reservation/decrement, and
  estimate-only VAT/FX/payment fee assumptions.
- Verification script:
  `caseflow-store/scripts/verify-checkout-auth-freeze.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-anonymous-gate.png`
  - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-order-history-en.png`
  - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-public-tracking-en.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-checkout-auth-freeze.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Staff/Operator Role Status

- D35-T01 is complete as of 2026-07-16.
- Role access policy exists at `docs/v1.1-role-access-policy.md`.
- App mirror exists at `caseflow-store/docs/v1.1-role-access-policy.md`.
- Server permission policy is implemented in
  `caseflow-store/src/lib/auth/admin.ts`.
- Current permissions:
  - `catalog:manage`: staff and admin.
  - `inventory:adjust`: staff and admin.
  - `orders:read`: staff and admin.
  - `orders:update-status`: staff and admin.
  - `settings:manage`: admin only.
- Staff/admin sessions can use the operations login and orders page.
- `GET /api/admin/orders` requires `orders:read`.
- `PATCH /api/admin/orders/[id]` requires `orders:update-status`.
- `GET /api/admin/settings` requires `settings:manage`.
- Anonymous admin/staff API calls return `UNAUTHORIZED`; customer calls return
  `FORBIDDEN`.
- Verification script:
  `caseflow-store/scripts/verify-staff-role-access.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d35-t01/staff-role-access-check.json`.
- Screenshot:
  `caseflow-store/.agent/artifacts/d35-t01/staff-operations-orders-page-en.png`.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-staff-role-access.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Inventory Adjustment Workflow Status

- D36-T02 is complete as of 2026-07-17.
- Admin/staff inventory permission exists as `inventory:adjust`.
- Inventory UI at `/admin/inventory` now supports:
  - listing tracked book editions by stock.
  - searching by title, slug, or author.
  - selecting an edition and submitting positive or negative stock adjustments.
  - requiring a reason for every adjustment.
  - showing recent adjustment audit records.
  - showing low-stock and out-of-stock states.
- Inventory APIs exist at:
  - `GET /api/admin/inventory`
  - `POST /api/admin/inventory/adjustments`
- The `book_inventory_adjustments` Supabase table is now represented in
  TypeScript database types.
- Stock adjustments update `book_editions.stock_quantity`, derive
  `inventory_status`, and insert an audit row with `created_by_user_id`.
- Negative adjustments that would make stock below zero return `OUT_OF_STOCK`.
- Public catalog/purchase boundary reflects adjusted stock: low-stock remains
  visible in public detail data, out-of-stock blocks cart validation.
- Scope boundary: D36-T02 does not implement stock reservation/decrement on
  checkout. It adds operational stock adjustment and audit visibility only.
- Verification script:
  `caseflow-store/scripts/verify-inventory-adjustments.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d36-t02/inventory-adjustments-check.json`.
- Screenshot:
  `caseflow-store/.agent/artifacts/d36-t02/inventory-adjustments-desktop-en.png`.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-inventory-adjustments.ts`, screenshot dimension/no-overflow
  review, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Admin Navigation Shell Status

- D35-T02 is complete as of 2026-07-16.
- Operations dashboard exists at `/admin`.
- Admin/staff shell routes now exist for:
  - `/admin/orders`
  - `/admin/catalog`
  - `/admin/inventory`
  - `/admin/promotions`
  - `/admin/customers`
  - `/admin/settings`
- Shared admin shell and navigation components exist at:
  - `caseflow-store/src/features/admin/admin-navigation.tsx`
  - `caseflow-store/src/features/admin/admin-shell-page.tsx`
- The main site admin link and operations login now route to `/admin`.
- Staff navigation shows dashboard, orders, catalog, inventory, promotions, and
  customers, but hides settings. Catalog visibility is now backed by
  `catalog:manage`.
- Direct staff access to `/admin/settings` renders an access-denied state, and
  the settings API still requires `settings:manage`.
- Admin navigation includes settings and can access the settings shell.
- Scope boundary: D35-T02 added navigation shells and permission-aware access
  surfaces only. Real catalog, inventory, promotion, customer, and dashboard
  operations remain Day 36-Day 38 work.
- Verification script:
  `caseflow-store/scripts/verify-admin-navigation.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d35-t02/admin-navigation-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d35-t02/admin-navigation-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d35-t02/staff-admin-navigation-mobile-en.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-admin-navigation.ts`, screenshot dimension/no-overflow
  review, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Admin Book Catalog Management Status

- D36-T01 is complete as of 2026-07-17.
- Admin/staff catalog permission exists as `catalog:manage`.
- Admin catalog UI at `/admin/catalog` now supports:
  - listing active and inactive book editions.
  - local search by title, slug, author, and category.
  - creating a sellable edition for an existing book work.
  - editing core edition fields: slug, display title, localized titles,
    language, format, price, stock, low-stock threshold, inventory status,
    summaries, featured state, and active state.
  - activating/deactivating editions.
- Admin catalog APIs exist at:
  - `GET /api/admin/books/editions`
  - `POST /api/admin/books/editions`
  - `PATCH /api/admin/books/editions/[id]`
- Mutating catalog payloads are validated server-side with Zod.
- Mutations run through the service-role client only after a verified
  admin/staff session has `catalog:manage`.
- Public catalog behavior remains frozen: active editions are visible, inactive
  editions are excluded from `/api/products` and `/api/products/[slug]`.
- Scope boundary: D36-T01 manages book editions only. Creating new works,
  authors, categories, publishers, or media assets remains outside this task.
- Verification script:
  `caseflow-store/scripts/verify-admin-book-catalog.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-check.json`.
- Screenshot:
  `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-desktop-en.png`.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-admin-book-catalog.ts`, screenshot dimension/no-overflow
  review, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Shipping, VAT, And FX Estimate Status

- D33-T02 is complete as of 2026-07-16.
- Checkout totals use server-owned/configured assumptions for shipping, VAT, and
  USD display estimates.
- VND remains authoritative for persisted order totals.
- English checkout displays approximate USD total with source, rate, timestamp,
  and display-only international payment fee assumption.
- Current default FX rule is HSBC Vietnam telegraphic selling rate:
  `26,400 VND/USD`, quoted `2026-07-16T08:35:00+07:00`.
- Server ignores browser-supplied shipping, tax, payment fee, total, and USD
  display values.
- Verification script:
  `caseflow-store/scripts/verify-order-totals-engine.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d33-t02/order-totals-engine-check.json`.
- Screenshot:
  `caseflow-store/.agent/artifacts/d33-t02/checkout-usd-estimate-desktop-en.png`.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-order-totals-engine.ts`, screenshot review, HSBC FX
  source verification, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Payment Method Simulation Status

- D33-T01 is complete as of 2026-07-16.
- Checkout supports COD, bank transfer, MoMo, ZaloPay, and VNPay-style choices.
- Success snapshots now persist `paymentMethod` and `paymentStatus`.
- Success UI displays payment method and payment status:
  - COD: `pending`.
  - bank transfer: `awaiting-transfer`.
  - MoMo, ZaloPay, VNPay: `awaiting-provider-confirmation`.
- Unknown payment methods are rejected by API validation.
- No card-number, CVV, expiry, wallet credential, bank credential, or provider
  login fields are collected.
- Verification script: `caseflow-store/scripts/verify-payment-methods.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d33-t01/payment-methods-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d33-t01/payment-cod-success-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d33-t01/payment-vnpay-success-desktop-en.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-payment-methods.ts`, screenshot review, targeted
  input source search for card/CVV/expiry/wallet credential fields, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Account-Gated Checkout Status

- D32-T01 and D32-T02 are complete as of 2026-07-16.
- `/checkout` now redirects anonymous and non-customer sessions to
  `/account?next=/checkout`.
- Anonymous users can still browse and add books to the local cart.
- After login, customer users return to `/checkout` and the local cart remains
  preserved.
- Checkout now shows cart review, read-only customer/contact confirmation,
  shipping method, payment method, server-backed total review, and final submit.
- `POST /api/orders` now requires a customer session, validates contact
  confirmation, validates book cart items, recalculates server-owned totals,
  and creates v1.1 book order/item snapshots through
  `create_book_order_with_items`.
- UI checkout/success copy does not expose simulated/demo wording; docs and ADRs
  still document the payment limitation truthfully.
- Verification script:
  `caseflow-store/scripts/verify-book-checkout-steps.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d32-t02/book-checkout-steps-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-steps-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-success-desktop-en.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-book-checkout-steps.ts`, screenshot review, UI source
  search for simulated/demo checkout wording, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Customer Auth Page Status

- D31-T01 is complete as of 2026-07-16.
- Customer account page exists at `/account`.
- Customer sign-in, sign-up form, logout, and header/mobile auth state UI are
  implemented.
- Customer auth uses Supabase Auth sessions and creates/backfills `profiles`
  server-side; browser payloads cannot set `role`.
- Access expectations are documented in
  `docs/v1.1-auth-access-expectations.md`.
- No phone verification is claimed.
- Supabase Auth email sign-up was provider rate-limited during final
  verification. The route now returns a clear `429` with
  `CUSTOMER_AUTH_FAILED`, and the verification uses a verified customer test
  user as the configured local equivalent for login/logout.
- Verification script: `caseflow-store/scripts/verify-customer-auth.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d31-t01/customer-auth-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signed-out-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signed-in-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signup-mobile-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-customer-auth.ts`, screenshot review, focused source
  search for phone-verification claims, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Customer Profile And Address Status

- D31-T02 is complete as of 2026-07-16.
- Customer profile save API exists at `PATCH /api/customer/profile`.
- Customer account page supports full name, read-only account email, phone,
  recipient name, recipient phone, and default Vietnamese shipping address.
- Profile updates are validated with Zod and saved server-side through the
  service-role client after Supabase session checks.
- Browser payloads cannot set role.
- Checkout now blocks signed-in customer checkout when required profile fields
  are missing and links to `/account?next=/checkout`.
- D32-T01 later made `/checkout` account-gated.
- Verification script: `caseflow-store/scripts/verify-customer-profile.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d31-t02/customer-profile-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d31-t02/checkout-profile-blocked-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-complete-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t02/checkout-profile-ready-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-validation-mobile-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-customer-profile.ts`, screenshot review, focused
  source search for phone-verification claims, and `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## v1.1 Storefront Feature Freeze Status

- D30-T02 is complete as of 2026-07-16.
- Storefront feature freeze is active.
- Freeze coverage: homepage, catalog, filters/sorting, catalog states, detail
  page, related recommendations, buying-confidence content, bilingual mode,
  currency display, and cart entry.
- No known blocker remains in product discovery or cart entry at the freeze
  gate.
- New storefront discovery/catalog/detail/language/cart-entry features now
  require explicit roadmap approval. Day 31-34 should focus on customer auth
  and checkout/account gating.
- Verification script:
  `caseflow-store/scripts/verify-storefront-freeze.ts`.
- Verification artifact:
  `caseflow-store/.agent/artifacts/d30-t02/storefront-freeze-check.json`.
- Screenshots:
  - `caseflow-store/.agent/artifacts/d30-t02/home-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d30-t02/home-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d30-t02/catalog-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d30-t02/catalog-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d30-t02/detail-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d30-t02/detail-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d30-t02/cart-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d30-t02/cart-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d30-t02/language-switch-desktop-vi.png`
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`,
  `npx tsx scripts/verify-storefront-freeze.ts`, screenshot review, and
  `git diff --check`.
- Continue with `D40-T02 - Deploy And Smoke Test v1.1`.

## Architecture Decision

Use a modular monolith:

```text
Browser
  |
  v
Next.js UI
  |
  +-- React Context/localStorage for temporary cart state
  |
  +-- Next.js Route Handlers
        |
        +-- Zod validation
        +-- Repository interface
              |
              +-- Mock repository during early UI/API work
              +-- Supabase repository during integration
```

Rationale:

- One repository is realistic for 20 days.
- UI and API share the same origin, reducing unnecessary CORS work.
- Vercel deployment is simpler.
- Mock-first development prevents UI from being blocked by database setup.
- Repository interfaces reduce mock/database drift.

## Actual Repository Structure

Current structure after Day 1:

```text
.
├── AGENTS.md
├── DESIGN.md
├── SKILL.md
├── .agent/
│   ├── project-context.md
│   ├── step-results.md
│   └── todo-roadmap.md
├── docs/
    ├── architecture.md
    ├── context-management.md
    ├── pre-implementation-review.md
    ├── adr/
    │   ├── 0001-use-nextjs-modular-monolith.md
    │   ├── 0002-use-supabase.md
    │   ├── 0003-use-mock-first-development.md
    │   ├── 0004-use-local-cart.md
    │   └── 0005-use-simulated-checkout.md
    └── diagrams/
        ├── container-diagram.md
        └── system-context.md
└── caseflow-store/
    ├── .agent/
    ├── AGENTS.md
    ├── CLAUDE.md
    ├── DESIGN.md
    ├── README.md
    ├── SKILL.md
    ├── docs/
    ├── eslint.config.mjs
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── public/
    ├── supabase/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── data/
    │   ├── features/
    │   ├── lib/
    │   └── types/
    ├── tests/
    └── tsconfig.json
```

The app is nested under `caseflow-store`. Day 2 copied project management docs into the app directory so future agents can work from either the repository root or the app folder without losing context.

## Environment Preflight

Latest check: 2026-07-14.

- Initial `node -v`: failed with `zsh:1: command not found: node`
- Initial `npm -v`: failed with `zsh:1: command not found: npm`
- Initial `npx --version`: failed with `zsh:1: command not found: npx`
- Initial `git --version`: passed with `git version 2.37.1 (Apple Git-137.1)`
- Homebrew is available: `Homebrew 6.0.6`
- Codex bundled Node exists at `/Users/vantruong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` and reports `v24.14.0`
- Codex bundled `npm`, `npx`, and `corepack` were not found under the bundled runtime paths checked.
- User approved `brew install node` on 2026-07-14.
- `brew install node` failed while installing the `llvm` dependency with: `Errno::ENOENT: No such file or directory @ rb_sysopen ... .diff`.
- After the failed Homebrew install attempt, `node`, `npm`, and `npx` still fail with `command not found`.
- Homebrew did install or update some dependencies before the failure, including `openssl@3 3.6.3`, `cmake 4.4.0`, and `python@3.14 3.14.6`.
- `python@3.14` built successfully but did not link cleanly because `/usr/local/bin/python3`, `/usr/local/bin/pip3`, and related files already point to other Python installations.
- Official Node.js LTS binary `v24.18.0` for `darwin-x64` was downloaded from nodejs.org, verified with `SHASUMS256.txt`, extracted to `/usr/local/lib/nodejs/node-v24.18.0-darwin-x64`, and symlinked into `/usr/local/bin`.
- Final `node -v`: `v24.18.0`
- Final `npm -v`: `11.16.0`
- Final `npx --version`: `11.16.0`
- Final `git --version`: `git version 2.37.1 (Apple Git-137.1)`

Implication: future setup should not assume Homebrew can install current Node quickly on this macOS 12 machine. Prefer the verified official Node LTS binary path unless the user wants to repair Homebrew separately.

## Day 1 Actual Stack

- Next.js: `16.2.10`
- React: `19.2.4`
- React DOM: `19.2.4`
- TypeScript: `^5`
- Tailwind CSS: `^4`
- ESLint: `^9`
- Package manager: npm `11.16.0`

Day 1 checks:

- `npm run lint`: passed.
- `npm run build`: passed.
- `curl -I http://localhost:3000`: returned `HTTP/1.1 200 OK`.

Day 3 dependency update:

- `zod` was installed early for `D03-T03` because the roadmap originally listed installation as `D04-T01` after the schema task that requires it.
- `caseflow-store/package.json` now includes `zod` `^4.4.3`.
- `npm run lint` passed after installation.
- npm still reports 2 moderate severity vulnerabilities and pending install-script approvals for `sharp` and `unrs-resolver`; do not run `npm audit fix --force` casually.

Known Day 1 risks:

- `npm install` reported 2 moderate severity vulnerabilities. Do not run `npm audit fix --force` casually because it may introduce breaking dependency changes.
- npm warned that install scripts for `unrs-resolver` and `sharp` are pending approval.
- `create-next-app` generated `caseflow-store/AGENTS.md` and `caseflow-store/CLAUDE.md`; Day 2 must reconcile these with the root project rules instead of leaving contradictory agent instructions.

## Day 2 Documentation Sync

Completed `D02-T01` on 2026-07-14.

Copied into `caseflow-store/`:

- `AGENTS.md`
- `DESIGN.md`
- `SKILL.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- `.agent/step-results.md`
- `docs/architecture.md`
- `docs/context-management.md`
- `docs/pre-implementation-review.md`
- `docs/adr/`
- `docs/diagrams/`

`caseflow-store/AGENTS.md` now contains the project rules and a Next.js `16.2.10` version note. `caseflow-store/CLAUDE.md` still points to `AGENTS.md`.

## Day 2 Structure Setup

Completed `D02-T02` on 2026-07-14.

Created under `caseflow-store/`:

- `src/components`
- `src/features`
- `src/lib`
- `src/data`
- `src/types`
- `supabase`
- `tests`

Each empty directory has a `.gitkeep` so the structure is retained by Git.

## Day 2 Environment Example

Completed `D02-T03` on 2026-07-14.

Created `caseflow-store/.env.example` with placeholders:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Updated `caseflow-store/.gitignore` so `.env.local` stays ignored while `.env.example` can be committed.

Verification:

- `git -C caseflow-store check-ignore -q .env.local` exits `0`, so `.env.local` is ignored.
- `git -C caseflow-store check-ignore -q .env.example` exits `1`, so `.env.example` is not ignored.

## Day 2 Status Page

Completed `D02-T04` on 2026-07-14.

Changed:

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/app/globals.css`

Result:

- Default Next.js template page was replaced with a simple CaseFlow Store implementation status page.
- Metadata now uses `CaseFlow Store`.
- Global CSS maps core `DESIGN.md` tokens into Tailwind v4 theme variables.

Verification:

- `npm run lint`: passed.
- `npm run build`: passed.
- `curl -s http://localhost:3000 | rg -n "CaseFlow Store|Local baseline ready|Implementation Status"` found the expected content.

Limitation: no browser screenshot tool was available in this turn, so visual QA was limited to code review plus HTTP render output.

## Day 2 Agent File Verification

Completed `D02-T05` on 2026-07-14.

Verified:

- Root `AGENTS.md`
- Root `DESIGN.md`
- Root `docs/adr/0001-use-nextjs-modular-monolith.md`
- Root `docs/adr/0002-use-supabase.md`
- Root `docs/adr/0003-use-mock-first-development.md`
- Root `docs/adr/0004-use-local-cart.md`
- Root `docs/adr/0005-use-simulated-checkout.md`
- App-level `caseflow-store/AGENTS.md`
- App-level `caseflow-store/DESIGN.md`
- App-level `caseflow-store/docs/adr/` with the same 5 ADR files

## Day 2 Baseline Checks

Completed `D02-T06` on 2026-07-14.

Command:

```bash
npm run lint && npm run build
```

Result:

- `npm run lint`: passed.
- `npm run build`: passed.

Deferred:

- `D02-T07` optional Vercel smoke deploy was not attempted because Vercel access and deployment target are not verified.

Next required task:

- `D03-T03` must add Zod schemas that enforce the runtime constraints described by `caseflow-store/src/types/domain.ts`.

## Target Application Structure

```text
caseflow-store/
├── AGENTS.md
├── DESIGN.md
├── README.md
├── .agent/
├── docs/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (store)/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── features/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── orders/
│   ├── data/
│   │   └── mock/
│   ├── lib/
│   │   ├── repositories/
│   │   ├── supabase/
│   │   ├── validation/
│   │   └── utils/
│   └── types/
├── supabase/
│   ├── schema.sql
│   └── seed.sql
└── tests/
    └── e2e/
```

## Implemented Domain Types

Implemented in `caseflow-store/src/types/domain.ts` on 2026-07-14.

- `CATEGORY_SLUGS`
- `COMPATIBILITY_LABELS`
- `ORDER_STATUSES`
- `CategorySlug`
- `CompatibilityLabel`
- `OrderStatus`
- `ISODateTimeString`
- `MoneyAmount`
- `StockQuantity`
- `Quantity`
- `Category`
- `Product`
- `CartItem`
- `Order`
- `OrderItem`

Important modeling notes:

- `MoneyAmount` is a number alias, but values must be integer amounts in the smallest currency unit. Runtime validation belongs in `D03-T03`.
- Product `stock` uses `StockQuantity`, while cart/order item `quantity` uses `Quantity`; their runtime constraints are different.
- Product compatibility uses the confirmed `CompatibilityLabel` values from `docs/domain.md`.

## Implemented Validation Schemas

Implemented in `caseflow-store/src/lib/validation/domain.ts` on 2026-07-14.

- `categorySlugSchema`
- `compatibilityLabelSchema`
- `orderStatusSchema`
- `idSchema`
- `slugSchema`
- `isoDateTimeStringSchema`
- `moneyAmountSchema`
- `stockQuantitySchema`
- `quantitySchema`
- `productImageUrlSchema`
- `compatibilityListSchema`
- `categorySchema`
- `productSchema`
- `cartItemSchema`
- `orderSchema`
- `orderItemSchema`

Important validation notes:

- Money must be a non-negative integer.
- Product stock must be a non-negative integer.
- Cart and order item quantity must be a positive integer.
- Product compatibility labels must be from the confirmed phone-model list and must not be duplicated.
- Product images must be root-relative paths or `http(s)` URLs.
- `orderItemSchema` verifies that `lineTotal` equals `unitPrice * quantity`.
- Schemas are not wired into API handlers yet; that belongs to the API tasks.

## Database Schema Draft

Implemented in `caseflow-store/supabase/schema.sql` on 2026-07-14.

Drafted tables:

- `profiles`
- `categories`
- `products`
- `orders`
- `order_items`

Important schema decisions:

- Product prices and order totals are integer VND.
- No cart table exists; the MVP cart remains localStorage-only.
- `order_items` stores product name, unit price, quantity, and line total snapshots.
- `line_total` has a database check: `line_total = unit_price * quantity`.
- Product compatibility is stored as `text[]` with allowed labels from `docs/domain.md`.
- Category slugs are constrained to the five confirmed MVP categories.
- RLS is enabled on all drafted tables.
- Public direct reads are allowed only for active categories and active products.
- Direct public order insert/update policies are intentionally not defined; checkout and admin writes must go through Next.js Route Handlers.

Verification limitation:

- `psql` and Supabase CLI are not installed locally, so the schema was not executed against PostgreSQL yet. D13 must apply and verify it in a real Supabase project.

## Mock Catalog

Implemented in `caseflow-store/src/data/mock/catalog.ts` on 2026-07-14.

- Mock categories: 5.
- Mock products: 16.
- Featured products: 6.
- Domain: phone accessories.
- Runtime guard: `mockCategories` and `mockProducts` are parsed with Zod schemas at module import time.

Category distribution:

- Phone cases: 4 products.
- Screen protectors: 3 products.
- Chargers: 3 products.
- Cables and adapters: 3 products.
- Stands and mounts: 3 products.

Important limitation:

- Product `imageUrl` values are root-relative planned paths under `/images/products/`, but the actual image files have not been created yet. Product UI work must add or replace real assets before visual QA.

## Supabase Proof Of Connection Plan

Implemented in `docs/supabase-proof-of-connection.md` and `caseflow-store/docs/supabase-proof-of-connection.md` on 2026-07-14.

Latest D13-T01 access check: 2026-07-15.

D13-T01 project creation result:

- Supabase project `caseflow-store` exists in `NVTruong473's Org`.
- Project ref: `fcsuldrerhbynwotcvyn`.
- Dashboard URL: `https://supabase.com/dashboard/project/fcsuldrerhbynwotcvyn`.
- Public project URL: `https://fcsuldrerhbynwotcvyn.supabase.co`.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t01-supabase-project-dashboard.png`.
- No service role key or database password was printed or stored during D13-T01.

D13-T03 schema application result:

- Applied `caseflow-store/supabase/schema.sql` to Supabase project `caseflow-store` through SQL Editor on 2026-07-15.
- SQL Editor result: `Success. No rows returned`.
- Verification query returned expected table count `5`.
- Tables verified: `categories`, `order_items`, `orders`, `products`, `profiles`.
- No cart table was created; `cart_table_count` was `0`.
- `order_status` enum type exists.
- `profiles_set_updated_at`, `categories_set_updated_at`, `products_set_updated_at`, and `orders_set_updated_at` triggers exist.
- Verification query reported `3` policies and RLS enabled for all 5 schema tables.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t03-schema-verification.png`.

D13-T04 RLS result:

- Explicitly enabled RLS for `profiles`, `categories`, `products`, `orders`, and `order_items`.
- Added explicit grants/revokes to `caseflow-store/supabase/schema.sql` and applied them in Supabase SQL Editor.
- Policy surface remains 3 SELECT policies:
  - `Public can read active categories` for `anon` and `authenticated`.
  - `Public can read active products` for `anon` and `authenticated`.
  - `Users can read own profile` for `authenticated`.
- Direct role privileges verified:
  - `anon` can select `categories` and `products`.
  - `anon` cannot select `profiles`.
  - `anon` and `authenticated` cannot directly select or insert `orders` or `order_items`.
  - `authenticated` can select `profiles`, `categories`, and `products`.
- Behavior test under `current_user = anon` saw only `phone-cases` and `rls-t04-visible-product`; inactive product/category data stayed hidden.
- Rollback verification after the behavior test returned 0 temporary `rls-t04` products, orders, and order items.
- Visual artifact: `caseflow-store/.agent/artifacts/d13-t04-rls-behavior-check.png`.

Actual status:

- `.env.local` is missing.
- `NEXT_PUBLIC_SUPABASE_URL` is not set in the shell environment.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not set in the shell environment.
- `SUPABASE_SERVICE_ROLE_KEY` is not set in the shell environment.
- Supabase CLI is not installed.
- Supabase runtime packages are installed in the app: `@supabase/supabase-js` `^2.110.5` and `@supabase/ssr` `^0.12.3`.
- Supabase CLI package is not installed.
- No `~/.supabase` session/config files were found.
- `psql` is not installed.
- Target Supabase organization is verified as `NVTruong473's Org`.
- Database password handling remains user-managed and was not exposed.
- Supabase project was created and verified.
- Live SQL Editor schema application was completed.
- Follow-up unblock attempt on 2026-07-15 opened Supabase Dashboard in Chrome after user sign-in and verified the project dashboard.

Plan acceptance checks for later:

- Add Supabase values to ignored `caseflow-store/.env.local`.
- Apply `caseflow-store/supabase/schema.sql`. Completed in D13-T03.
- Confirm expected tables exist. Completed in D13-T03.
- Confirm RLS is enabled. Completed in D13-T04.
- Confirm anonymous users cannot read/write orders directly. Completed in D13-T04 through privilege checks.
- Confirm active products/categories can be read after seed data exists. Initial behavior verified in D13-T04 with rollback data; D13-T05 must seed real catalog data.

## Product List API

Implemented `GET /api/products` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/products/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`
- `caseflow-store/src/lib/validation/products.ts`

Current behavior:

- Uses mock catalog data, not Supabase.
- Returns `{ data, error }`.
- Returns only active products from active categories.
- Supports `category`, `compatibility`, `q`, `featured`, and `sort` query parameters.
- Supported sort values: `newest`, `price-asc`, `price-desc`, `name-asc`.
- Invalid query values return `400` with `VALIDATION_ERROR`.
- Compatibility filtering treats `Universal` products as compatible with specific phone-model filters.

Verified examples:

- `GET /api/products`: 200, 16 products.
- `GET /api/products?category=chargers&compatibility=iPhone%2015&sort=price-asc`: 200, 3 products.
- `GET /api/products?category=bad-category`: 400.

Limitations:

- No pagination yet.
- Response shape has no `meta` yet; response standardization is scheduled for `D05-T04`.
- Data source is still mock-first.

## Product Detail API

Implemented `GET /api/products/[slug]` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/products/[slug]/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`

Current behavior:

- Uses mock catalog data, not Supabase.
- Returns `{ data, error }`.
- Valid active product slug returns `200`.
- Valid but missing slug returns `404` with `PRODUCT_NOT_FOUND`.
- Invalid slug format returns `400` with `VALIDATION_ERROR`.

Verified examples:

- `GET /api/products/aeroguard-magsafe-case`: 200.
- `GET /api/products/not-a-real-product`: 404.
- `GET /api/products/Bad_Slug`: 400.

## Categories API

Implemented `GET /api/categories` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/categories/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`

Current behavior:

- Uses mock catalog data, not Supabase.
- Returns `{ data, error }`.
- Returns active categories sorted by `sortOrder`, then name.

Verified example:

- `GET /api/categories`: 200, 5 categories in the confirmed domain order.

## Cart Validation API

Implemented `POST /api/cart/validate` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/cart/validate/route.ts`
- `caseflow-store/src/lib/validation/cart.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`

Current behavior:

- Request body: `{ "items": [{ "productId": string, "quantity": number }] }`.
- Uses mock catalog data, not Supabase.
- Does not trust client price, subtotal, stock, or product details.
- Aggregates duplicate product IDs before stock checks.
- Recalculates `unitPrice`, `lineTotal`, and `subtotal` on the server.
- Returns `PRODUCT_NOT_FOUND` for stale/unavailable product IDs.
- Returns `OUT_OF_STOCK` when requested quantity exceeds stock.
- Allows empty cart with subtotal 0 for cart refresh; checkout/order creation must still reject empty orders later.

Verified examples:

- Valid cart: 200, subtotal recalculated.
- Duplicate product IDs: 200, quantities aggregated.
- Missing product ID: 404.
- Out of stock: 409.
- Invalid quantity: 400.
- Empty cart: 200, subtotal 0.

## Day 4 API Verification

Completed `D04-T06` on 2026-07-14.

Verified with curl:

- `GET /api/products`: 200, 16 products.
- `GET /api/products?category=chargers&compatibility=iPhone%2015&sort=price-asc`: 200, 3 products.
- `GET /api/products?category=bad-category`: 400, `VALIDATION_ERROR`.
- `GET /api/products/aeroguard-magsafe-case`: 200.
- `GET /api/products/not-a-real-product`: 404, `PRODUCT_NOT_FOUND`.
- `GET /api/categories`: 200, 5 categories.
- `POST /api/cart/validate` valid cart: 200, subtotal 1017000.
- `POST /api/cart/validate` out of stock: 409, `OUT_OF_STOCK`.
- `POST /api/cart/validate` invalid JSON: 400, `VALIDATION_ERROR`.
- `POST /api/cart/validate` invalid payload: 400, `VALIDATION_ERROR`.

Final Day 4 checks:

- `npm run lint`: passed.
- `npm run build`: passed.

## Mock Order Creation API

Implemented `POST /api/orders` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/orders/route.ts`
- `caseflow-store/src/lib/validation/orders.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`

Current behavior:

- Uses mock catalog/order repositories, not Supabase.
- Accepts guest checkout fields and `{ productId, quantity }` items.
- Does not collect payment fields.
- Server re-reads products through cart validation.
- Server recalculates `unitPrice`, `lineTotal`, and `subtotal`.
- Creates `pending` orders with generated order code and order item snapshots.
- Invalid JSON returns 400.
- Invalid order payload, including empty items, returns 400.
- Out-of-stock item returns 409.
- Client-supplied subtotal is ignored.

Verified examples:

- Valid order with fake client `subtotal: 1`: 201; server subtotal 1017000.
- Empty order: 400.
- Out of stock: 409.
- Invalid JSON: 400.

Important limitations:

- Orders are stored in module-level memory and reset when the server process restarts.
- Mock order creation does not decrement stock. Real stock handling must be transactional/RPC-backed during Supabase integration or documented as an MVP limitation.

## Admin Order List API

Implemented `GET /api/admin/orders` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/admin/orders/route.ts`
- `caseflow-store/src/lib/auth/admin.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`
- `caseflow-store/.env.example`

Current behavior:

- Uses mock in-memory orders.
- Requires server-side admin token guard.
- Local development accepts `x-caseflow-admin-token: dev-admin-token` when `CASEFLOW_ADMIN_API_TOKEN` is empty.
- Production requires `CASEFLOW_ADMIN_API_TOKEN`; missing production token returns `ADMIN_AUTH_NOT_CONFIGURED`.
- No token or wrong token returns `UNAUTHORIZED`.

Verified examples:

- `GET /api/admin/orders` without token: 401.
- Create order, then `GET /api/admin/orders` with dev token: 200, list includes pending order.

Important limitation:

- This is temporary mock admin authorization, not final Supabase Auth/RLS. It exists to prevent a public admin API during mock-first development.

## Admin Order Status API

Implemented `PATCH /api/admin/orders/[id]` on 2026-07-14.

Files:

- `caseflow-store/src/app/api/admin/orders/[id]/route.ts`
- `caseflow-store/src/lib/validation/orders.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`

Current behavior:

- Requires server-side admin token guard before updating.
- Validates order id.
- Validates status against the `OrderStatus` enum.
- Updates only `status` and server-side `updatedAt`.
- Does not let clients change subtotal, items, customer data, or order code.
- Missing order returns `ORDER_NOT_FOUND`.

Verified examples:

- Valid admin PATCH to `confirmed`: 200.
- No token: 401, `UNAUTHORIZED`.
- Invalid status: 400, `VALIDATION_ERROR`.
- Missing order: 404, `ORDER_NOT_FOUND`.

Important limitation:

- Status transition rules are not enforced yet; the MVP currently allows any known status value from the enum.

## Standard API Response Shape

Implemented on 2026-07-14.

File:

- `caseflow-store/src/lib/api/response.ts`

Current response shape:

```json
{
  "data": {},
  "error": null,
  "meta": null
}
```

Error response shape:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  },
  "meta": null
}
```

Current behavior:

- All API routes use `apiSuccess` or `apiError`.
- List endpoints include `meta.count`.
- Detail, mutation, and error responses include `meta: null`.

Verified examples:

- Product list: keys `data`, `error`, `meta`; `meta.count` is 16.
- Product detail: keys `data`, `error`, `meta`; `meta` is null.
- Product query error: keys `data`, `error`, `meta`; `meta` is null.
- Order creation: keys `data`, `error`, `meta`; `meta` is null.

## Price And Subtotal Tampering Verification

Completed `D05-T05` on 2026-07-14.

Verified:

- `POST /api/cart/validate` ignored fake client `subtotal`, item `price`, and item `lineTotal`.
- `POST /api/orders` ignored fake client `subtotal`, item `price`, and item `lineTotal`.
- `PATCH /api/admin/orders/[id]` ignored fake `subtotal` and `items` fields, updating only status.

Evidence:

- Tampered cart request returned subtotal 658000, unitPrice 329000, lineTotal 658000.
- Tampered order request returned subtotal 658000, unitPrice 329000, lineTotal 658000.
- Tampered admin PATCH kept subtotal 658000 and item count 1 while changing status to `shipping`.

## Preview Deploy Readiness

Checked `D05-T06` on 2026-07-14.

Actual status:

- `vercel` CLI is not installed.
- `.vercel` project link is missing.
- `VERCEL_TOKEN` is missing in the shell environment.
- `VERCEL_ORG_ID` is missing in the shell environment.
- `VERCEL_PROJECT_ID` is missing in the shell environment.
- Deploy target and user approval are not confirmed.

Result:

- Preview deploy was not attempted.
- `D05-T06` is deferred as an external readiness/deployment task.
- Local work can continue to Day 6.

## Design Token Mapping

Completed `D06-T01` on 2026-07-14.

File:

- `caseflow-store/src/app/globals.css`

Mapped from `DESIGN.md`:

- Colors.
- Radius tokens.
- Spacing tokens.
- Typography size tokens.
- Font family.
- Selection styling.
- Global `focus-visible` outline.

Verification:

- `npm run lint`: passed.
- `npm run build`: passed.
- `rg` confirmed the mapped CSS variables.

## UI Component Primitives

Completed `D06-T02` on 2026-07-15.

Files:

- `caseflow-store/src/lib/utils/cn.ts`
- `caseflow-store/src/components/ui/button.tsx`
- `caseflow-store/src/components/ui/input.tsx`
- `caseflow-store/src/components/ui/badge.tsx`
- `caseflow-store/src/components/ui/container.tsx`
- `caseflow-store/src/components/ui/card.tsx`
- `caseflow-store/src/components/ui/skeleton.tsx`
- `caseflow-store/src/components/ui/error-message.tsx`
- `caseflow-store/src/components/ui/index.ts`
- `caseflow-store/src/app/ui-preview/page.tsx`

Current behavior:

- `Button` supports primary, secondary, destructive, and ghost variants plus sm/md/lg/icon sizing, disabled, loading, and icon slots.
- `Input` requires a visible label and wires helper/error text with `aria-describedby` and `aria-invalid`.
- `Badge` supports neutral, primary, success, warning, and error variants without relying only on color.
- `Container`, `Card`, `Skeleton`, and `ErrorMessage` use the mapped design tokens and responsive-safe `min-w-0` treatment.
- `/ui-preview` renders the primitives for visual QA and is marked `noindex`.

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright screenshots captured at 1440px and 375px from production local server and passed visual review.

Important limitation:

- `/ui-preview` is a QA route, not a storefront feature. Decide before production whether to keep it, hide it behind environment checks, or remove it.

## Layout Shell

Completed `D06-T03` on 2026-07-15.

Files:

- `caseflow-store/src/components/layout/navigation.ts`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/site-footer.tsx`
- `caseflow-store/src/components/layout/index.ts`
- `caseflow-store/src/app/layout.tsx`

Current behavior:

- Root layout now renders `SiteHeader`, page content, and `SiteFooter`.
- Desktop header shows brand, primary nav links, and a cart drawer trigger.
- Mobile header uses a client-side `MobileNavigation` toggle with `aria-expanded`, `aria-controls`, and accessible open/close labels.
- Footer contains compact storefront/support navigation and a short MVP limitation note.
- Navigation links use current-page anchors for planned sections to avoid creating 404 links before product/cart/admin routes exist.

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright/CDP screenshots captured desktop, mobile closed, and mobile menu-open states from a production local server.

Important limitation:

- Header and mobile cart controls open the cart drawer. Quantity boundary validation was added in `D09-T04`; checkout still needs server validation before order creation.

## Layout Verification

Completed `D06-T04` on 2026-07-15.

Verified surfaces:

- `/` at 1440px.
- `/` at 375px.
- `/` at 375px with the mobile menu open.
- `/ui-preview` at 1440px.
- `/ui-preview` at 375px.

Artifacts:

- `caseflow-store/.agent/artifacts/d06-t04-home-1440.png`
- `caseflow-store/.agent/artifacts/d06-t04-home-375.png`
- `caseflow-store/.agent/artifacts/d06-t04-home-375-menu.png`
- `caseflow-store/.agent/artifacts/d06-t04-ui-preview-1440.png`
- `caseflow-store/.agent/artifacts/d06-t04-ui-preview-375.png`
- `caseflow-store/.agent/artifacts/d06-t04-layout-check.json`

Result:

- DOM checks found no horizontal overflow at 375px or 1440px.
- Header and footer were present on checked pages.
- Mobile menu rendered open without layout overflow.

Important limitation:

- This verifies the current Day 6 shell and primitive preview only. Full responsive acceptance still belongs to Day 12 after product, cart, checkout, and admin UI exist.

## Storefront Homepage

Completed `D07-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/lib/format/currency.ts`
- `caseflow-store/src/components/layout/site-footer.tsx`

Current behavior:

- `/` is now a storefront homepage instead of the implementation status page.
- Homepage uses mock catalog data directly for stats, categories, and featured product preview.
- Sections exist for `#categories`, `#products`, `#compatibility`, `#support`, and `#checkout`.
- Product visuals are CSS-built placeholders, not final product photos.
- Visible copy was revised to avoid internal terms like mock APIs, future tasks, or portfolio MVP language.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t01-homepage-1440.png`
- `caseflow-store/.agent/artifacts/d07-t01-homepage-375.png`
- `caseflow-store/.agent/artifacts/d07-t01-homepage-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- DOM checks found no horizontal overflow at 1440px or 375px.

Important limitation:

- Product imagery is still generated with CSS placeholders. Real product image assets remain unresolved and should be addressed before final portfolio acceptance.

## Product Grid

Completed `D07-T02` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-visual.tsx`
- `caseflow-store/src/features/products/product-card.tsx`
- `caseflow-store/src/features/products/product-grid.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/page.tsx`

Current behavior:

- Homepage `#products` now renders all 16 mock products.
- Product grid is responsive: one column on mobile, two columns on small screens, and four columns on large desktop.
- `ProductCard` shows category, stock badge, product name, clamped description, price, and stock count.
- Product cards expose `data-product-card={slug}` for reliable checks.
- Product visuals are centralized in `ProductVisual` and remain CSS placeholders.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t02-product-grid-1440.png`
- `caseflow-store/.agent/artifacts/d07-t02-product-grid-375.png`
- `caseflow-store/.agent/artifacts/d07-t02-product-grid-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- HTML/DOM checks found 16 product cards.
- DOM checks found no horizontal overflow at 1440px or 375px.

Important limitation:

- Product cards do not link to product detail pages yet because `/products/[slug]` is scheduled for Day 8.

## Category Filter

Completed `D07-T03` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-catalog.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/page.tsx`

Current behavior:

- Homepage product section uses `ProductCatalog`, a client component that owns category filter state.
- Filter buttons include `All`, `Phone cases`, `Screen protectors`, `Chargers`, `Cables and adapters`, and `Stands and mounts`.
- Buttons expose `aria-pressed` and `data-category-filter` for accessibility and reliable checks.
- Result count is shown with `data-product-result-count`.
- Product grid updates without page navigation.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t03-category-filter-1440-all.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-375-all.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-1440-chargers.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-375-chargers.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Category interaction checks passed for all expected counts: all 16, phone cases 4, screen protectors 3, chargers 3, cables and adapters 3, stands and mounts 3.
- DOM checks found no horizontal overflow for desktop and mobile checked states.

Important limitation:

- Category state is client-side only and is not synced to URL query parameters.

## Search And Sorting

Completed `D07-T04` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-catalog.tsx`

Current behavior:

- Homepage product catalog now includes a visible `Search products` input.
- Search matches product name, description, and slug, matching the mock API search scope.
- Basic sorting supports `Newest`, `Price: low to high`, `Price: high to low`, and `Name: A to Z`.
- Search, category filter, and sorting are composed in this order: search first, category filter second, sort last.
- Category filter counts update against the current search result set.
- Filter buttons expose `aria-label`, `aria-pressed`, `data-category-filter`, and `data-category-filter-count`.
- A `Clear` action appears only when the search input has content.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t04-search-sort-1440-default.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-375-default.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-1440-charger-price-desc.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-375-charger-price-desc.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- CDP checks verified all sort modes, search for `charger`, search plus category for `glass`, clear search behavior, selected category state, and responsive screenshots.
- DOM checks found no visible horizontal overflow at 1440px or 375px.

Important limitation:

- Search, category, and sort state is client-side only and is not synced to URL query parameters.

## Catalog State UI

Completed `D07-T05` on 2026-07-15.

Files:

- `caseflow-store/src/features/products/product-catalog.tsx`
- `caseflow-store/src/features/products/product-catalog-states.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/catalog-state-preview/page.tsx`
- `caseflow-store/src/app/catalog-state-preview/catalog-state-preview.tsx`

Current behavior:

- Product catalog renders an empty state when the current search/category view has no products.
- Empty state includes a `Reset filters` action that clears search, category, and sort state.
- Product catalog accepts `isLoading` and `errorMessage` props for future API-backed states.
- Loading state disables catalog controls and renders stable product-card skeletons.
- Error state disables catalog controls, shows an error message, and offers a retry page refresh.
- `/catalog-state-preview?state=empty|loading|error` is a noindex visual QA route for these states.

Artifacts:

- `caseflow-store/.agent/artifacts/d07-t05-preview-empty-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-empty-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-loading-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-loading-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-error-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-error-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-catalog-states-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright screenshots passed visual review for empty, loading, and error states at 1440px and 375px.
- HTML selector checks confirmed homepage still renders 16 product cards and each preview state renders exactly one expected state marker.

Important limitation:

- Loading and error are prepared states, not live network states yet. Homepage still uses mock data imported directly; API-backed catalog fetching belongs to a later integration task.

## Product Detail Route

Completed `D08-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/products/product-card.tsx`

Current behavior:

- `/products/[slug]` renders a dynamic product detail page from the mock catalog.
- The route uses `generateStaticParams` to prerender current active mock product slugs.
- Product metadata uses the selected product name and description.
- Unknown product slugs return Next.js 404.
- Product cards on the homepage now link to their detail pages and keep `data-product-card={slug}` selectors.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-1440.png`
- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-375.png`
- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and listed `/products/[slug]` as SSG with 16 generated paths.
- HTTP checks confirmed homepage 200, sample detail 200, missing slug 404, 16 product-card links, and one sample detail marker.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- D08-T01 only establishes the route and link path. Full detail content belongs to `D08-T02`; quantity and add-to-cart feedback belong to `D08-T03`.

## Product Detail Content

Completed `D08-T02` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/page.tsx`

Current behavior:

- Product detail pages now show a stable product visual, product description, formatted VND price, stock state, compatibility labels, and category context.
- Product image area exposes `data-product-detail-image`.
- Product content exposes selectors for description, price, stock, and compatibility labels.
- Stock state uses a success or error badge based on current stock quantity.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-1440.png`
- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-375.png`
- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and preserved the 16 generated SSG product paths.
- HTML content checks confirmed image, price, stock, description, and compatibility markers on the sample product.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- Product visuals are still CSS placeholders because real product image assets are not present. Quantity selection and add-to-cart feedback remain for `D08-T03`.

## Product Detail Purchase Controls

Completed `D08-T03` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`
- `caseflow-store/src/features/products/index.ts`

Current behavior:

- Product detail pages now include a stock-aware quantity selector.
- Quantity decrement is disabled at 1 and increment is disabled at the current product stock.
- The quantity input has a visible label and clamps entered values to the valid stock range.
- The Add to cart button shows an accessible live feedback message after click.
- Stable selectors include `data-product-purchase-controls`, `data-quantity-input`, `data-quantity-decrement`, `data-quantity-increment`, and `data-add-to-cart-feedback`.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-1440.png`
- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-375.png`
- `caseflow-store/.agent/artifacts/d08-t03-add-to-cart-feedback-1440.png`
- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and preserved the 16 generated SSG product paths.
- HTML marker checks confirmed the purchase controls, quantity input, add-to-cart button, and stock text render on the sample product.
- Chrome interaction check confirmed two increment clicks set quantity to `3`, then Add to cart produced `Added 3 x AeroGuard MagSafe Case to cart.` with success feedback.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- D08-T03 feedback is local UI feedback only. Real cart state, header count, cart drawer, and localStorage persistence belong to Day 9 tasks.

## Product Detail Not-Found Behavior

Completed `D08-T04` on 2026-07-15.

Files:

- `caseflow-store/src/app/products/[slug]/not-found.tsx`

Current behavior:

- Unknown product slugs render a product-specific not-found view instead of the generic Next.js 404 UI.
- The not-found response preserves HTTP status `404`.
- The page gives users direct actions back to the product list and homepage.
- Stable selector: `data-product-not-found`.

Artifacts:

- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-1440.png`
- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-375.png`
- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and preserved the 16 generated SSG product paths.
- HTTP check confirmed `/products/not-a-real-product` returns status `404` and includes `data-product-not-found`.
- Desktop/mobile screenshots passed visual review.

## Cart Context

Completed `D09-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/app/providers.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`
- `caseflow-store/src/features/cart/index.ts`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`

Current behavior:

- The app shell is wrapped in `CartProvider`.
- `useCart` exposes `items`, `totalQuantity`, `addItem`, `updateItemQuantity`, `removeItem`, and `clearCart`.
- Cart state is in-memory only at this point.
- The cart stores only `productId` and `quantity`.
- Product detail Add to cart now writes to cart context.
- Desktop header and mobile navigation cart controls read the shared `totalQuantity`.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t01-cart-context-after-add-1440.png`
- `caseflow-store/.agent/artifacts/d09-t01-cart-context-mobile-menu-375.png`
- `caseflow-store/.agent/artifacts/d09-t01-cart-context-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Grep check found no `localStorage`, `sessionStorage`, `price`, or `subtotal` usage in the new cart/client integration.
- Chrome interaction check confirmed adding quantity `3` updates desktop header and mobile menu to `Cart (3)`.

Important limitation:

- Cart state is lost on page reload until `D09-T02` adds versioned localStorage persistence.

## Versioned Cart Persistence

Completed `D09-T02` on 2026-07-15.

Files:

- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`

Current behavior:

- Cart state persists to localStorage key `caseflow-store.cart.v1`.
- Stored payload shape is `{ version: 1, items: [{ productId, quantity }] }`.
- Stored items are parsed defensively and normalized.
- Duplicate stored product IDs are merged.
- Invalid JSON, invalid item shapes, and unsupported storage versions are ignored.
- Desktop header and mobile menu restore cart count after reload.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-after-reload-1440.png`
- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-mobile-menu-375.png`
- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Chrome interaction check confirmed localStorage payload uses top-level keys `items` and `version` only.
- Chrome interaction check confirmed stored item keys are `productId` and `quantity` only.
- Chrome interaction check confirmed the stored payload does not contain price, subtotal, product name, slug, description, or stock fields.
- Chrome interaction check confirmed reload restores `Cart (3)` in desktop header and mobile menu.
- Chrome interaction check confirmed unsupported storage version is ignored and resets the count to `Cart (0)`.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- localStorage cart contents remain untrusted. Checkout must still call server validation before creating orders.

## Cart Drawer

Completed `D09-T03` on 2026-07-15.

Files:

- `caseflow-store/src/app/providers.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`
- `caseflow-store/src/features/cart/index.ts`

Current behavior:

- Header and mobile cart controls open the cart drawer instead of navigating to a placeholder anchor.
- Drawer empty state is explicit.
- Drawer item state maps local cart `productId` values to the mock catalog for display.
- Drawer shows product name, category, stock badge, quantity, unit price, line total, and estimated subtotal.
- Drawer supports item remove and clear cart.
- Drawer supports close button, backdrop click, Escape key close, focus restoration, and a simple focus loop.
- Cart persistence remains `{ version, items: [{ productId, quantity }] }`.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-empty-1440.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-with-item-1440.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-mobile-375.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Chrome interaction check confirmed empty drawer opens with focus on Close.
- Chrome interaction check confirmed quantity `3` renders one product item and estimated subtotal `987.000 d`.
- Chrome interaction check confirmed drawer works at 375px mobile.
- Chrome interaction check confirmed Escape closes the drawer.
- Chrome interaction check confirmed Remove and Clear cart reset count to `Cart (0)` and write an empty items array to localStorage.
- Chrome interaction check confirmed stored cart still does not include price, subtotal, product name, slug, description, or stock fields.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- Drawer totals are still display-only. Checkout must not trust local quantity, line total, subtotal, or stock state from the browser.

## Cart Quantity Boundaries

Completed `D09-T04` on 2026-07-15.

Files:

- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`

Current behavior:

- Cart `addItem` and `updateItemQuantity` accept an optional `maxQuantity` and clamp requested quantities against it.
- Product detail calculates `cartQuantity` and `remainingQuantity` from the local cart for the current product.
- Product detail disables Add to cart when the cart already contains all available stock.
- Product detail shows quantity `0` when no more units can be added, instead of showing a misleading disabled `1`.
- Product detail passes the product stock as the max boundary when adding to cart.
- Drawer item rows now include quantity decrement/increment controls.
- Drawer decrement is disabled at quantity `1`.
- Drawer increment is disabled when the line item quantity reaches product stock.
- Tampered over-stock localStorage remains visible as an invalid state, shows a boundary error, and exposes a Set to max action.
- Cart localStorage still stores only `{ productId, quantity }` items inside `{ version, items }`; product details, prices, stock, and subtotals are not persisted.

Artifacts:

- `caseflow-store/.agent/artifacts/d09-t04-product-boundary-1440.png`
- `caseflow-store/.agent/artifacts/d09-t04-cart-boundary-drawer-1440.png`
- `caseflow-store/.agent/artifacts/d09-t04-cart-boundary-tampered-375.png`
- `caseflow-store/.agent/artifacts/d09-t04-quantity-boundary-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Browser check confirmed adding stock max `18` results in `In cart: 18. Remaining to add: 0.`
- Browser check confirmed product quantity input value is `0` and Add to cart is disabled when remaining quantity is `0`.
- Browser check confirmed cart count is `18` and localStorage stores only `productId` and `quantity`.
- Browser check confirmed drawer increment is disabled at `18`, decrement changes quantity to `17`, and increment returns it to `18`.
- Browser check confirmed tampered localStorage quantity `99` shows a visible boundary error and Set to max fixes storage back to `18`.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- UI quantity boundaries are not authoritative. Checkout must call server-side cart validation before order creation.
- In a tampered over-stock cart state, drawer subtotal reflects the invalid local quantity until the user fixes it. That subtotal must remain display-only and must not feed checkout totals.

## Checkout Route

Completed `D10-T01` on 2026-07-15.

Files:

- `caseflow-store/src/app/checkout/page.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `caseflow-store/src/features/checkout/index.ts`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`

Current behavior:

- `/checkout` exists as a static App Router page that renders a client checkout surface.
- Checkout waits for cart localStorage hydration before deciding whether the cart is empty.
- Empty cart state has a direct action back to the product list.
- Non-empty cart state renders a contact/shipping form with visible labels and customer field validation.
- Payment card fields are intentionally absent.
- The checkout form currently validates details with a `Validate details` action; order submission remains pending.
- Cart review posts local `{ productId, quantity }` items to `/api/cart/validate`.
- Valid cart review renders server-calculated line totals and subtotal.
- Invalid over-stock cart state renders a visible validation error and does not render a subtotal.
- Valid cart review also renders an order summary from server-validated cart data.
- Cart drawer now includes a Checkout link to `/checkout`.
- Cart localStorage remains item-only; no product details, stock, prices, line totals, or subtotal are stored.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t01-checkout-empty-1440.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-with-cart-1440.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-with-cart-375.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-validation-error-375.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-route-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout`.
- Browser check confirmed empty cart state renders when localStorage is empty.
- Browser check confirmed cart quantity `2` validates through `/api/cart/validate` and shows subtotal `658.000 d`.
- Browser check confirmed Place order is disabled for this shell task.
- Browser check confirmed drawer Checkout link navigates to `/checkout`.
- Browser check confirmed stored cart item keys remain only `productId` and `quantity`.
- Browser check confirmed tampered quantity `99` renders `OUT_OF_STOCK` with `Needs fix`.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- Checkout still depends on mock repository validation until Supabase integration replaces mock data.

## Checkout Customer Validation

Completed `D10-T02` on 2026-07-15.

Files:

- `caseflow-store/src/features/checkout/checkout-page.tsx`

Current behavior:

- Customer form state is controlled in the checkout feature module.
- Full name, email, phone, and shipping address reuse the domain Zod schemas from `src/lib/validation/domain.ts`.
- Empty fields show specific inline messages after blur or submit.
- Invalid email and phone formats show specific inline messages.
- Valid customer details clear the field errors and show `Customer details are valid for the next checkout step.`
- Payment card fields remain absent; browser verification found no card, CVV, expiry, or payment-like inputs.
- Cart review still uses `/api/cart/validate` for server-calculated subtotal; customer field validation does not trust cart totals from localStorage.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t02-checkout-invalid-1440.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-valid-1440.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-valid-375.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-validation-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout`.
- `curl -I http://localhost:3001/checkout`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed all four empty fields show required errors.
- Browser check confirmed invalid email and invalid phone show format errors.
- Browser check confirmed valid customer details show success status and no field errors.
- Browser check confirmed no card-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Desktop/mobile screenshots passed visual review.

Important limitation:

- This is client-side checkout UX validation only. Final order creation must still validate the same customer fields on the server through `POST /api/orders`.

## Checkout Order Summary

Completed `D10-T03` on 2026-07-15.

Files:

- `caseflow-store/src/features/checkout/checkout-page.tsx`

Current behavior:

- Checkout renders `Order summary` only after `/api/cart/validate` succeeds.
- Summary item count is derived from validated cart lines, not from local cart display state.
- Subtotal and order total use the server-calculated subtotal from `CartValidationData`.
- Shipping row is explicit as `Not charged in demo`.
- Payment row is explicit as `No payment collected`.
- Summary keeps `data-checkout-subtotal` on the server subtotal for existing checks and adds summary-specific selectors.
- If cart validation fails, the order summary and summary totals do not render, preventing stale local totals from being displayed.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t03-order-summary-1440.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-375.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-error-1440.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout`.
- `curl -I http://localhost:3001/checkout`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed valid cart summary shows `2 items`, subtotal `658.000 d`, shipping `Not charged in demo`, payment `No payment collected`, and total `658.000 d`.
- Browser check confirmed no card-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Browser check confirmed over-stock cart validation returns `OUT_OF_STOCK` and does not render summary totals.
- Desktop/mobile/error screenshots passed visual review.

Important limitation:

- `POST /api/orders` remains the authoritative boundary for validating customer fields and recalculating totals during submission.

## Checkout Success Flow

Completed `D10-T04` on 2026-07-15.

Files:

- `caseflow-store/src/app/checkout/success/page.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `caseflow-store/src/features/checkout/checkout-success-page.tsx`
- `caseflow-store/src/features/checkout/checkout-success-storage.ts`
- `caseflow-store/src/features/checkout/index.ts`

Current behavior:

- Checkout form submit now validates customer fields and requires server cart review success before creating an order.
- The submit action posts item-only cart data plus customer fields to `POST /api/orders`.
- `POST /api/orders` remains responsible for server-side customer validation, cart validation, price recalculation, and order creation.
- Successful submit stores a non-PII success snapshot in sessionStorage under `caseflow-store.checkout.success.v1`.
- The success snapshot stores order code, status, subtotal, item count, created timestamp, and order item names/quantities/line totals.
- The cart is cleared after successful order creation.
- `/checkout/success` renders order code, pending status, server-calculated total, and item summary.
- `/checkout/success?orderCode=...` has a fallback state when browser session success data is missing.
- Payment card fields remain absent.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-1440.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-375.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-fallback-1440.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout/success`.
- `curl -I http://localhost:3001/checkout/success`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed checkout submit button is enabled after cart validation and reads `Place simulated order`.
- Browser check confirmed successful submit navigates to `/checkout/success?orderCode=...`.
- Browser check confirmed order code starts with `CF-`.
- Browser check confirmed success total is `658.000 d` from server-created order data.
- Browser check confirmed success status is `pending`.
- Browser check confirmed localStorage cart is cleared to `{ version: 1, items: [] }`.
- Browser check confirmed no card-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Browser check confirmed direct success URL fallback shows the order code when session snapshot is missing.
- Desktop/mobile/fallback screenshots passed visual review.

Important limitation:

- The success page snapshot is browser-session data, not durable order retrieval. Durable order lookup should wait for Supabase integration or an explicit public order lookup task.
- Mock order storage remains in memory until the Supabase order repository replaces it.

## Checkout Playwright Skeleton

Completed `D10-T05` on 2026-07-15.

Implemented files:

- `caseflow-store/playwright.config.ts`
- `caseflow-store/tests/e2e/checkout.spec.ts`
- `caseflow-store/package.json`
- `caseflow-store/package-lock.json`
- `caseflow-store/.gitignore`

Behavior:

- Installed `@playwright/test` and added `npm run test:e2e`.
- Configured Playwright to run Chromium desktop tests from `tests/e2e`.
- Configured the test web server to use `npm run start -- -p 3001`, with `PLAYWRIGHT_BASE_URL` support for externally managed servers.
- Added a checkout happy-path test that seeds localStorage with only `{ productId, quantity }`, validates server-calculated checkout totals, submits a simulated order, verifies success page order code/status/total, verifies cart clear, verifies the non-PII success snapshot, and checks no card-like inputs exist.
- Added a direct-link success fallback test for `/checkout/success?orderCode=CF-SKELETON`.
- The happy-path test writes a visual artifact to `.agent/artifacts/d10-t05-playwright-checkout-success.png`.

Artifacts:

- `caseflow-store/.agent/artifacts/d10-t05-playwright-checkout-success.png`
- `caseflow-store/playwright-report/index.html`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `npx playwright install chromium`: passed.
- `npm run test:e2e`: passed, 2 tests.
- Visual review of `d10-t05-playwright-checkout-success.png`: passed.

Important notes:

- The first E2E run correctly exposed a test bug: `[data-cart-count]` exists in both desktop and mobile navigation. The test was fixed to assert every cart count instance is zero after successful checkout.
- Playwright emitted a macOS 12 environment warning that its ffmpeg browser is frozen. This did not block Chromium checkout tests, but it is a local environment risk to remember.
- npm still reports 2 moderate vulnerabilities and pending install-script approvals for `sharp` and `unrs-resolver`; do not run `npm audit fix --force` casually.
- `D17-T01` now overlaps with work completed in `D10-T05`. Treat Day 17 as expanding and hardening E2E coverage rather than pretending Playwright was first installed then.

## Admin Login

Completed `D11-T01` on 2026-07-15.

Implemented files:

- `caseflow-store/src/app/admin/login/page.tsx`
- `caseflow-store/src/features/admin/admin-login-page.tsx`
- `caseflow-store/src/features/admin/admin-session.ts`
- `caseflow-store/src/features/admin/index.ts`
- `caseflow-store/src/lib/auth/admin-constants.ts`
- `caseflow-store/src/lib/auth/admin.ts`

Behavior:

- Added `/admin/login` with metadata.
- Added an admin access form that validates a token by calling `GET /api/admin/orders` with the server-required `x-caseflow-admin-token` header.
- Invalid or missing token does not create a saved session.
- Valid token writes a versioned mock admin session to `sessionStorage` under `caseflow-store.admin.session.v1`.
- The saved session stores the token and `verifiedAt` timestamp for this browser tab only.
- Added shared admin session helpers for the next admin UI tasks to read the saved token and construct admin API headers.
- The login UI does not expose `CASEFLOW_ADMIN_API_TOKEN` through any `NEXT_PUBLIC_*` value.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t01-admin-login-1440.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-375.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-success-1440.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/login`.
- `curl -I http://127.0.0.1:3001/admin/login`: returned `HTTP/1.1 200 OK`.
- `curl http://127.0.0.1:3001/api/admin/orders` without token: returned `401 UNAUTHORIZED`.
- `curl -H 'x-caseflow-admin-token: dev-admin-token' http://127.0.0.1:3001/api/admin/orders`: returned `200 OK`.
- `npm run test:e2e`: passed, 2 tests.
- Playwright admin login check confirmed invalid-token error, valid-token success state, saved session version `1`, and no horizontal overflow at 1440px or 375px.
- Desktop/mobile/success screenshots passed visual review.

Important notes:

- The admin login is still a mock-phase token check, not Supabase Auth. Supabase Auth and role-based protection remain Day 15 tasks.
- `sessionStorage` is acceptable only for this mock admin phase. Durable auth must replace it before production.
- The local QA server was started with `CASEFLOW_ADMIN_API_TOKEN=dev-admin-token` so production-mode `next start` could verify the admin guard.

## Admin Order List

Completed `D11-T02` on 2026-07-15.

Implemented files:

- `caseflow-store/src/app/admin/orders/page.tsx`
- `caseflow-store/src/features/admin/admin-orders-page.tsx`
- `caseflow-store/src/features/admin/admin-login-page.tsx`
- `caseflow-store/src/features/admin/index.ts`

Behavior:

- Added `/admin/orders` with metadata.
- Reads the versioned mock admin session from `sessionStorage`.
- Shows an auth-required state when no valid session is present.
- Calls `GET /api/admin/orders` with the saved `x-caseflow-admin-token` header.
- Clears the saved session and returns to auth-required state when the admin API returns `401`.
- Renders loading, error, empty, and list states.
- Renders desktop order table and mobile order cards.
- Summary shows order count, pending count, item count, and server-created order total.
- Order list shows order code, customer name/email, status, total, item count, and created date.
- `/admin/login` now shows a `View orders` link when a session is saved.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-1440.png`
- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-375.png`
- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/orders`.
- `curl -I http://127.0.0.1:3001/admin/orders`: returned `HTTP/1.1 200 OK`.
- Admin API without token returned `401 UNAUTHORIZED`.
- Admin API with `x-caseflow-admin-token: dev-admin-token` returned `200 OK`.
- `npm run test:e2e`: passed, 2 tests.
- Test order was created through `POST /api/orders`; server returned subtotal `1017000`.
- Playwright admin orders check confirmed auth-required state, list selectors, desktop table rows, mobile cards, no horizontal overflow at 1440px or 375px, and QA order presence.
- Desktop and mobile screenshots passed visual review.

Important notes:

- The order list uses the mock in-memory order repository. Restarting the server clears orders.
- Counts and totals can include orders created by checkout E2E during the same server process.
- D11-T03 extends this screen with order detail and status update controls.

## Admin Order Detail And Status Update

Completed `D11-T03` on 2026-07-15.

Implemented files:

- `caseflow-store/src/features/admin/admin-orders-page.tsx`

Behavior:

- `/admin/orders` now selects the newest order by default after loading the guarded admin order list.
- Admin users can select any listed order with visible `View` controls on desktop table rows and mobile cards.
- The detail panel shows order code, current status, created/updated timestamps, customer name, email, phone, shipping address, server-created total, and order items.
- The status form supports the known order statuses from `ORDER_STATUSES`.
- Status updates call `PATCH /api/admin/orders/[id]` with the saved `x-caseflow-admin-token` header and `{ status }` JSON body.
- The UI handles `401` by clearing the mock admin session and returning to the auth-required state.
- Successful PATCH responses update the selected order, list row/card, and summary pending count from the server response.
- No client price, subtotal, item, or customer data is trusted during status update.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-1440.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-status-updated-1440.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-375.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/orders` plus `/api/admin/orders/[id]`.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright admin detail/status QA seeded a test order, verified the seeded order was selected, verified customer/shipping/items in the detail panel, changed status from `pending` to `confirmed`, verified the server returned `confirmed`, and captured desktop/mobile screenshots.
- Overflow checks passed at 1440px and 375px.
- Visual review passed after moving the desktop `View` control into the first visible table column.

Important notes:

- No `GET /api/admin/orders/[id]` route was added for this task. The detail view uses the already-loaded list payload and keeps the mutation path on the existing PATCH route.
- The admin token/session is still mock-phase `sessionStorage`, not Supabase Auth.
- The order repository is still in-memory; restarting `next start` clears orders.
- D11-T04 remains useful because the mobile admin layout works but can still be tightened specifically for repeated mobile operations.

## Admin Mobile Treatment

Completed `D11-T04` on 2026-07-15.

Implemented files:

- `caseflow-store/src/features/admin/admin-orders-page.tsx`

Behavior:

- Mobile summary metrics now use a two-column layout instead of four full-width blocks.
- Mobile and tablet widths below `lg` use order cards instead of the desktop table.
- A compact selected-order bar appears above the mobile/tablet order list with `Orders` and `Detail` actions.
- Mobile order cards are denser and keep order code, status, date, total, item count, customer, email, and visible `View details` action.
- Selecting `View details` on mobile updates selection, scrolls to the detail panel, and focuses the panel.
- The detail/status update flow still uses the guarded PATCH route and server response.

Artifacts:

- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-default-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-detail-focus-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-status-updated-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-tablet-768.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-desktop-regression-1440.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-treatment-check.json`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright admin mobile QA seeded three orders, verified the mobile selected-order bar, verified two-column summary layout, selected a non-default order, confirmed the detail panel focused after mobile selection, changed status to `shipping`, and verified server status was `shipping`.
- Overflow checks passed at 375px, 768px, and 1440px.
- Visual review passed for mobile default, mobile focused detail, mobile status-updated, tablet, and desktop regression screenshots.

Important notes:

- The 768px tablet QA initially found horizontal overflow because the desktop table activated at `md`; this was fixed by keeping cards active until `lg`.
- The sticky site header can appear in full-page screenshots captured after scroll because the QA intentionally verifies the detail-focused scroll position.
- Admin auth and persistence are still mock-phase and remain future Day 15 Supabase work.

## UI Breakpoint Acceptance

Completed `D12-T01` on 2026-07-15.

Scope:

- Viewports: 375px, 768px, 1024px, and 1440px.
- Scenarios: home/catalog, product detail, cart drawer, checkout with cart, checkout success, admin login, and admin orders with data.

Artifacts:

- `caseflow-store/.agent/artifacts/d12-t01-breakpoint-check.json`
- `caseflow-store/.agent/artifacts/d12-t01-home-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-product-detail-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-cart-drawer-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-checkout-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-checkout-success-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-admin-login-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-admin-orders-{375,768,1024,1440}.png`

Verification:

- Breakpoint QA generated 28 screenshots and found 0 horizontal overflow failures.
- The QA seeded cart data, checkout success data, admin session data, and a mock admin order instead of depending on stale browser state.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run test:e2e`: passed, 2 checkout tests.

Important notes:

- No source UI changes were required for D12-T01.
- The QA script itself needed two corrections: the cart button exists in both desktop/mobile markup, and on 375px the visible cart action is inside the mobile menu.
- D12-T02 should now audit keyboard navigation and focus states; it should not repeat the same broad screenshot sweep unless a focus issue requires visual confirmation.

## Keyboard And Focus Acceptance

Completed `D12-T02` on 2026-07-15.

Scope:

- Mobile navigation and cart drawer keyboard behavior at 375px.
- Product detail quantity/add-to-cart keyboard behavior at 1024px.
- Checkout customer fields keyboard order and focus state at 1024px.
- Admin login token input at 768px.
- Mobile admin selected-order detail jump and focused detail panel at 375px.

Artifacts:

- `caseflow-store/.agent/artifacts/d12-t02-keyboard-focus-check.json`
- `caseflow-store/.agent/artifacts/d12-t02-mobile-menu-focus-375.png`
- `caseflow-store/.agent/artifacts/d12-t02-cart-drawer-focus-375.png`
- `caseflow-store/.agent/artifacts/d12-t02-product-detail-focus-1024.png`
- `caseflow-store/.agent/artifacts/d12-t02-checkout-focus-1024.png`
- `caseflow-store/.agent/artifacts/d12-t02-admin-login-focus-768.png`
- `caseflow-store/.agent/artifacts/d12-t02-admin-orders-focus-375.png`

Verification:

- Added `tests/e2e/keyboard-focus.spec.ts`.
- The targeted keyboard/focus spec passed: 3 tests.
- Full `npm run test:e2e` passed: 5 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.

Important notes:

- D12-T02 found a real mobile accessibility defect: after opening the cart drawer from the mobile menu, closing the drawer with Escape could leave focus on `body` because the original cart opener was hidden when the menu closed.
- The fix restores focus to the previous element only when it is still visible, otherwise falling back to a visible cart opener, mobile menu toggle, or home link.
- Playwright webServer now supplies `CASEFLOW_ADMIN_API_TOKEN` for E2E when no external token is configured; this keeps admin E2E deterministic without weakening server-side admin checks.
- D12-T03 should now audit loading, empty, error, and success states. It should focus on state coverage, not repeat broad breakpoint or keyboard sweeps.

## State Acceptance

Completed `D12-T03` on 2026-07-15.

Scope:

- Catalog loading, empty, and error preview states.
- Cart drawer empty state.
- Checkout empty, cart-validation error, and order success states.
- Product not-found fallback.
- Admin orders auth-required, loading, empty, and error states.
- Admin login invalid-token error and valid-token success states.

Artifacts:

- `caseflow-store/.agent/artifacts/d12-t03-state-check.json`
- `caseflow-store/.agent/artifacts/d12-t03-catalog-loading-375.png`
- `caseflow-store/.agent/artifacts/d12-t03-catalog-empty-375.png`
- `caseflow-store/.agent/artifacts/d12-t03-catalog-error-375.png`
- `caseflow-store/.agent/artifacts/d12-t03-cart-empty-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-checkout-empty-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-product-not-found-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-checkout-error-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-checkout-success-1024.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-auth-required-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-loading-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-empty-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-error-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-login-error-768.png`
- `caseflow-store/.agent/artifacts/d12-t03-admin-login-success-768.png`

Verification:

- Added `tests/e2e/ui-states.spec.ts`.
- The targeted state spec passed: 4 tests.
- Full `npm run test:e2e` passed: 9 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.

Important notes:

- D12-T03 did not require production UI changes; it added acceptance coverage and visual artifacts.
- The first full-suite attempt exposed weak test isolation and stale production-server CSS artifacts. The spec was hardened, the production server was restarted after build, and D12-T03 screenshots were regenerated with correct styling.
- D12-T04 is the right next step: run the final Day 12 lint/build verification task before `D12-T05` feature freeze.

## Final Day 12 Verification

Completed `D12-T04` on 2026-07-15.

Scope:

- Run the final Day 12 lint and production build gate before feature freeze.

Verification:

- `npm run lint && npm run build`: passed.
- Next.js production build completed TypeScript, page data collection, and static page generation.
- Static generation count: 31 pages.

Important notes:

- No source code changes were made for D12-T04.
- D12-T05 should now freeze features. After freeze, only fixes and integration work should be allowed unless the roadmap is explicitly changed.

## Feature Freeze

Completed `D12-T05` on 2026-07-15.

Feature freeze is active after Day 12 UI acceptance.

Allowed after freeze:

- Fixes for defects, accessibility issues, responsive regressions, security issues, and test instability.
- Supabase integration work already listed in Phase 4.
- Deployment, E2E expansion, documentation, README, known limitations, and CV summary work already listed in the roadmap.
- Explicitly approved roadmap changes with updated documentation and ADRs when the change is major.

Not allowed after freeze without explicit roadmap change:

- New user-facing storefront features.
- New cart, checkout, admin, or catalog features outside the existing roadmap.
- Scope expansions that make the MVP look larger than a 20-day implementation.

After D12-T05, Phase 4 began with Supabase integration work.

## Supabase Seed Data

Completed `D13-T05` on 2026-07-15.

Scope:

- Create an idempotent seed file for categories and products.
- Keep Supabase catalog rows aligned with the validated mock catalog in `caseflow-store/src/data/mock/catalog.ts`.
- Apply the seed file to the real Supabase project `caseflow-store`.

Files and artifacts:

- `caseflow-store/supabase/seed.sql`
- `caseflow-store/.agent/artifacts/d13-t05-seed-verification.png`

Seed result from Supabase SQL Editor:

```json
{
  "product_count": 16,
  "category_count": 5,
  "active_product_count": 16,
  "active_category_count": 5,
  "featured_product_count": 6,
  "product_counts_by_category": {
    "chargers": 3,
    "phone-cases": 4,
    "stands-mounts": 3,
    "cables-adapters": 3,
    "screen-protectors": 3
  }
}
```

Important notes:

- `seed.sql` is idempotent and uses `on conflict (slug) do update`.
- Category/product UUIDs intentionally match the mock catalog so cart tests and later repository integration can compare stable IDs.
- The SQL Editor query runs as `postgres`; D13-T04 already verified the RLS/public-read surface separately.
- `.env.local` is still missing, so the Next.js app is not connected to Supabase yet.

## Supabase Client Factories

Completed `D14-T01` on 2026-07-15.

Scope:

- Add typed raw Supabase database contracts.
- Add a browser Supabase client factory for Client Components.
- Add a per-request server Supabase client factory for Server Components and Route Handlers.
- Keep service role secrets out of browser-importable code.

Files:

- `caseflow-store/src/types/supabase.ts`
- `caseflow-store/src/lib/supabase/env.ts`
- `caseflow-store/src/lib/supabase/browser.ts`
- `caseflow-store/src/lib/supabase/server.ts`

Verification:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed; static generation count remained 31 pages.

Important notes:

- `createSupabaseServerClient()` is async because Next.js `16.2.10` exposes `cookies()` as a Promise.
- The server client uses the public anon key and RLS. It does not use the service role key.
- A mixed `src/lib/supabase/index.ts` barrel was intentionally not kept because exporting server and browser modules together can let Client Components accidentally import `next/headers`.
- `.env.local` is still missing, so live Supabase reads are not wired into the app yet.

## Supabase Catalog Row Mapping

Completed `D14-T02` on 2026-07-15.

Scope:

- Map Supabase `categories` rows to `Category` domain objects.
- Map Supabase `products` rows to `Product` domain objects.
- Convert database `snake_case` fields to application `camelCase` fields.
- Parse mapped objects through the existing Zod domain schemas so runtime database drift fails explicitly.

File:

- `caseflow-store/src/lib/supabase/mappers.ts`

Verification:

- Runtime mapper check passed for valid category/product rows.
- Product compatibility is copied instead of sharing the raw row array.
- Runtime mapper check confirmed that a negative product price raises a Zod error.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.

Important notes:

- D14-T02 maps catalog rows only because Day 14 owns the product repository. Order row mapping belongs with the Day 15 order persistence flow.
- The mock repository remains active until D14-T03.
- `.env.local` is still missing, so the next task must establish the live app connection before repository replacement can be verified.

Next task: `D14-T03 - Replace mock product repository with Supabase repository`.

## Live Supabase Catalog Repository

Completed `D14-T03` on 2026-07-15.

Scope:

- Configured ignored local public Supabase environment values.
- Added an async Supabase catalog repository for categories, products, product detail, filters/sort, and cart validation.
- Replaced live storefront, product detail, catalog API, cart drawer, and checkout catalog reads with Supabase data.
- Kept the catalog state preview on deterministic mock data because it is an isolated QA fixture.
- Kept mock order persistence only until Day 15 order integration.

Files:

- `caseflow-store/.env.local` (ignored; values not recorded in project docs)
- `caseflow-store/src/lib/repositories/supabase-catalog.ts`
- `caseflow-store/src/types/catalog.ts`
- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/app/api/products/route.ts`
- `caseflow-store/src/app/api/products/[slug]/route.ts`
- `caseflow-store/src/app/api/categories/route.ts`
- `caseflow-store/src/app/api/cart/validate/route.ts`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`

Verification:

- Live category API returned 5 active categories.
- Live product API returned 16 active products and 6 featured products.
- Phone-case filter returned 4 products with ascending price sort verified.
- Product detail returned `aeroguard-magsafe-case`.
- Cart validation returned `658000` VND for quantity 2 of the `329000` VND AeroGuard case.
- API output used domain `imageUrl` and did not expose raw `image_url`.
- Homepage HTML included live Supabase catalog content.
- `.env.local` is ignored by Git.
- No service-role reference exists in `src`.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.

Important notes:

- The public catalog uses the anon key plus RLS and does not require a service-role key.
- Homepage and product detail changed from static generation to request-time rendering because the repository uses the cookie-aware Supabase server client.
- The service-role key remains intentionally unconfigured until the server-only Day 15 order persistence design is implemented.

Next task: `D14-T04 - Retest storefront`.

## Live Storefront Retest

Completed `D14-T04` on 2026-07-15.

Verified on the production build at `http://127.0.0.1:3002`:

- Homepage rendered 5 categories, 16 products, and 6 featured products from Supabase.
- Phone-case filter rendered exactly 4 products.
- AeroGuard product detail rendered current price `329000`, stock `18`, compatibility, and category.
- Adding quantity 2 produced cart count 2 and server-validated subtotal `658000`.
- Checkout review rendered the same product, quantity, category, stock, and recalculated total.
- Focused Playwright storefront/cart/checkout suite passed 7 of 7 tests.

Visual artifacts:

- `caseflow-store/.agent/artifacts/d14-t04-supabase-storefront-1440.png`
- `caseflow-store/.agent/artifacts/d14-t04-supabase-cart-drawer.png`
- `caseflow-store/.agent/artifacts/d14-t04-supabase-checkout.png`

Broader test finding:

- An initial 9-test run passed 7 storefront tests and failed 2 admin tests.
- The failures were caused by production-mode mock admin token behavior, not catalog integration.
- Day 15 must replace mock admin/order behavior and rerun these tests; they are not counted as passed.

Next task: `D15-T01 - Create order and order items safely`.

## Atomic Supabase Order Persistence

Completed `D15-T01` on 2026-07-15.

- Added a server-only admin client whose service-role credential is read only from ignored server environment configuration.
- Added strict trusted-command validation and row-to-domain mapping for orders and order items.
- Added `public.create_order_with_items(...)` as a `security definer` RPC so the order header and all line items commit or roll back together.
- Revoked RPC execution from public, anon, and authenticated roles; granted it only to `service_role`.
- Added explicit service-role table privileges needed for trusted backend operations while preserving direct order-table denial for anon and authenticated roles.
- Kept `POST /api/orders` on the mock repository until D15-T02 so server price and stock recalculation can be activated in one verified change.

Verification:

- Permission check: service role can execute the RPC; anon and authenticated roles cannot.
- Forced database failure left zero orphan orders and zero orphan items.
- Live repository check created one order with one item, validated mapped values, and removed both rows successfully.
- A subtotal inconsistent with line totals was rejected before any write.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t01-service-role-verification.png`.

Next task: `D15-T02 - Recalculate price server-side`.

## Server-Owned Checkout Totals

Completed `D15-T02` on 2026-07-15.

- Replaced `POST /api/orders` mock persistence with live Supabase cart validation and the atomic order RPC.
- The browser contract remains customer fields plus `productId` and `quantity`; unknown client price, product-name, line-total, and subtotal fields are discarded.
- The route reads current active products, checks stock, rebuilds product-name and price snapshots, calculates each line total and subtotal, then passes only that trusted command to persistence.
- Missing products return `PRODUCT_NOT_FOUND` with 404; quantities above current stock return `OUT_OF_STOCK` with 409; internal persistence failures return `ORDER_CREATE_FAILED` without leaking backend details.

Verification:

- A deliberately tampered payload sent unit price and subtotal `1`; the persisted item retained unit price `329000` and the order subtotal was `658000` for quantity 2.
- Persisted product name also came from Supabase instead of the tampered browser field.
- Missing-product and out-of-stock HTTP checks returned 404 and 409 respectively.
- Playwright checkout flow passed 2 of 2 against the live route; all created QA orders were removed afterward.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build` passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t02-live-order-success.png`.

Next task: `D15-T03 - Configure admin account and role`.

## Dedicated Supabase Admin Identity

Completed `D15-T03` on 2026-07-15.

- Created a dedicated synthetic Supabase Auth user for CaseFlow administration instead of reusing the Supabase project owner's identity.
- Confirmed the email through the trusted Admin API and upserted the matching `profiles` row with display name `CaseFlow Admin` and role `admin`.
- Generated a strong random password and stored both test-login values only in ignored `.env.local`; no credential value was printed or added to tracked documentation.
- Restricted `.env.local` permissions to `0600`.

Verification:

- Auth Admin API returned the confirmed dedicated user.
- Password sign-in through the public anon client succeeded.
- The authenticated user could read its own profile through RLS and the returned role was `admin`.
- `.env.local` remains ignored and there are no admin credential references in `src`.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t03-supabase-admin-account.png`.

Next task: `D15-T04 - Protect admin pages and APIs`.

## Supabase Admin Authorization Boundary

Completed `D15-T04` on 2026-07-15.

- Replaced the development header token and browser `sessionStorage` admin secret with a Supabase SSR cookie session created and deleted by `/api/admin/session`.
- Added a Next.js 16 Proxy that refreshes Supabase sessions on admin page/API requests without using Proxy as the authorization decision point.
- Centralized server authorization in `requireAdminRequest()`: validate the user with `auth.getUser()`, read the caller's own profile through RLS, then require role `admin`.
- Protected `/admin/orders` in its Server Component and repeated the same session/role check inside every admin Route Handler.
- Replaced mock admin order list and status updates with server-only service-role repository operations after authorization succeeds.
- Removed the mock token constants and admin session-storage module.
- Fixed a duplicate React footer key found during Chrome console QA.

Verification:

- Anonymous admin API returned 401; anonymous admin page redirected to login.
- Wrong password returned 401 without creating an authorized session.
- The real admin cookie accessed the protected page/API, listed a live order, and persisted a status update.
- Sign-out cleared browser cookies and the next admin API request returned 401.
- The same redirect, login, API, and sign-out checks passed against the production build.
- QA orders were removed; lint, TypeScript, diff check, and production build passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t04-protected-admin-orders.png`.

Next task: `D15-T05 - Test anonymous, normal user, and admin access`.

## Day 15 Access Matrix

Completed `D15-T05` on 2026-07-15.

- Added reusable E2E helpers for admin login, temporary customer provisioning, Supabase SSR session cookies, and deterministic order/user cleanup.
- Added a three-role Playwright matrix covering anonymous, authenticated customer, and admin behavior across Next.js pages/APIs and direct Supabase Data API calls.
- Updated prior keyboard-focus and UI-state tests to use the real email/password login flow instead of mock admin token storage.
- Added cleanup to checkout, UI-state, keyboard, and access tests so synthetic orders and temporary Auth users do not accumulate.
- Loaded `.env.local` into the Playwright process with Next's environment loader without exposing values to browser code.

Verified behavior:

- Anonymous: public catalog 200; admin API 401; admin page redirected; direct orders read denied.
- Customer: own profile role `customer`; admin API 403; admin page redirected; direct orders read denied.
- Admin: protected page/API allowed; live order listed; status update persisted; direct order table remained denied; sign-out restored 401.
- Full production Playwright suite passed 12 of 12 tests.
- Post-suite checks found zero test orders and zero temporary customer users.
- Lint, TypeScript, diff check, and production build passed.
- A scan of 26 client assets found zero service-role or admin-password value leaks; `.env.local` remained mode `0600`.
- Visual artifacts: `caseflow-store/.agent/artifacts/d15-t05-customer-forbidden.png` and `caseflow-store/.agent/artifacts/d15-t05-admin-access-matrix.png`.

Day 15 is complete. Next task: `D16-T01 - Finalize .env.example`.

## Day 16 Environment Contract

Completed `D16-T01` on 2026-07-15.

- `.env.example` now contains exactly the runtime and test-runner variables consumed by current code.
- Runtime public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Runtime server-only: `SUPABASE_SERVICE_ROLE_KEY`.
- Playwright-only: `CASEFLOW_ADMIN_EMAIL`, `CASEFLOW_ADMIN_PASSWORD`.
- Removed the obsolete mock-phase `CASEFLOW_ADMIN_API_TOKEN` and unused `NEXT_PUBLIC_SITE_URL`.
- Kept `PLAYWRIGHT_PORT` and `PLAYWRIGHT_BASE_URL` as commented optional overrides, preventing a copied blank value from overriding Playwright defaults.
- Automated comparison found zero missing keys, zero stale active keys, and zero non-empty template placeholders.

Next task: `D16-T02 - Verify no secret is committed`.

## Day 16 Secret Boundary

Completed `D16-T02` on 2026-07-15.

- Added root `.gitignore` coverage for `.env*`, `.DS_Store`, and the unrelated local `password manager/` directory.
- `.env.local` remains ignored with mode `0600`; `.env.example` remains a commit candidate.
- Scanned all 299 Git commit-candidate files against the local service-role and admin-password values without printing either value.
- Scanned 397 files under `.next/static` and `.next/server` for the same sensitive values.
- Found zero exact secret-value hits and zero common secret-pattern hits.
- The repository has no Git `HEAD`; therefore there is no commit history to scan. Repeat this check before the first D19 commit/push.
- Visual artifact: `caseflow-store/.agent/artifacts/d16-t02-secret-scan.json`.

Next task: `D16-T03 - Add stable API error codes`.

## Stable API Error Contract

Completed `D16-T03` on 2026-07-15.

- Added `src/lib/api/error-codes.ts` as the compile-time source of truth for 13 server error codes.
- Changed `apiError` from accepting an arbitrary `string` code to the `ApiErrorCode` union.
- Added `docs/api-contract.md` with the stable response envelope and HTTP/code mapping; clients must branch on code, not message text.
- Added `tests/e2e/api-errors.spec.ts` for deterministic public and admin error responses.

Verification:

- 8 Route Handlers had zero undeclared literal error codes.
- `npm run lint` and `npx tsc --noEmit` passed.
- `npm run build` passed.
- API contract Playwright checks passed `2/2` against the new production build.

Next task: `D16-T04 - Deploy integration preview`.

## Vercel Integration Preview

Completed `D16-T04` on 2026-07-15.

- Created Vercel Hobby workspace `NVTruong473` and project `caseflow-store`; no paid plan or payment method was added.
- Linked the local app through ignored `.vercel/` metadata.
- Configured only the three application runtime values for Preview: two public Supabase values and the sensitive service-role value.
- Vercel CLI added a local `VERCEL_OIDC_TOKEN` to ignored mode-`0600` `.env.local`; it is not an application runtime variable or part of `.env.example`.
- Added `.vercelignore` to exclude internal docs, tests, SQL, and QA artifacts from uploads.
- The first remote build exposed an overbroad `supabase/` ignore rule; root-anchoring it as `/supabase/` restored `src/lib/supabase` and the second build passed.
- Preview remains behind Vercel Authentication because checkout writes to the live integration database.

Verified preview:

- Deployment status `Ready`; home 200.
- 5 categories and 16 products loaded from Supabase.
- Missing product 404 and anonymous admin 401 returned stable codes.
- Live order creation returned 201 with one item and subtotal `329000`; cleanup deleted the test order.
- Admin login, order list, logout, and post-logout checks returned 200, 200, 200, and 401.
- Browser console returned zero errors/warnings.
- URL: `https://caseflow-store-74nu9i3d7-nvt-ruong473.vercel.app`.
- Visual artifacts: `caseflow-store/.agent/artifacts/d16-t04-vercel-preview.png` and `d16-t04-vercel-preview.json`.

Next task: `D16-T05 - Run npm run lint && npm run build`.

## Day 16 Final Gate

Completed `D16-T05` on 2026-07-15.

- The exact command `npm run lint && npm run build` passed.
- Next.js compiled successfully, completed TypeScript checking, and generated 16 static pages.
- Re-scanned after Vercel linked the project and added a local OIDC token: 3 sensitive values across 307 commit candidates and 397 build files produced zero hits.
- Confirmed 0 D16 preview QA orders remain in Supabase.
- Feature freeze and integration freeze are now active.
- Visual artifact: `caseflow-store/.agent/artifacts/d16-t05-final-gate.json`.

Day 16 is complete.

## Day 17 E2E Hardening

Completed `D17-T01` on 2026-07-16.

- Kept the existing Playwright installation from `D10-T05` and hardened configuration instead of claiming a duplicate installation milestone.
- Added early validation for required E2E environment names, external base URLs, and local ports.
- Preserved one worker because tests mutate a shared live Supabase project.
- Disabled implicit reuse of an existing local server after a 12-hour-old Next server on port 3001 returned a stale admin API response; the same focused suite passed `2/2` on a clean server.
- Lint, TypeScript, 14-test discovery, invalid-port rejection, and Chromium execution passed.
- Evidence: `caseflow-store/.agent/artifacts/d17-t01-playwright-hardening.json`.

Completed `D17-T02` on 2026-07-16.

- Added `tests/e2e/storefront-flow.spec.ts` to exercise the real UI from homepage through product detail, quantity selection, add-to-cart feedback, cart drawer, checkout, and success.
- The test does not seed the cart directly, so it covers the integration boundaries omitted by the early checkout skeleton.
- Verified order API 201, server-calculated subtotal `658000`, pending success state, cleared cart, persisted non-PII success snapshot, and 0 remaining QA orders.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t02-storefront-checkout-success.png`.

Completed `D17-T03` on 2026-07-16.

- Added `tests/e2e/checkout-validation.spec.ts` for empty and malformed customer checkout details.
- Verified all four fields expose `aria-invalid` and an `aria-describedby` reference to the rendered validation error.
- Proved invalid forms remain on checkout and make 0 order-creation requests.
- The first run exposed a test-only text assertion issue because the visual `!` icon is in DOM text but hidden from the accessibility tree; using contained message text fixed the assertion without weakening accessibility checks.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t03-checkout-validation.png`.

Completed `D17-T04` on 2026-07-16.

- Added `tests/e2e/admin-workflow.spec.ts` with a dedicated order and cleanup boundary.
- Logged in through the real admin form, selected the exact order by ID, and updated pending to confirmed through the protected Route Handler.
- Verified response 200, UI success and badge, persisted Supabase status, post-sign-out admin API 401, and 0 remaining QA orders.
- Captured only the selected QA order panel rather than the whole admin list to keep unrelated order details out of the artifact.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t04-admin-status-update.png`.

Completed `D17-T05` on 2026-07-16.

- Ran the exact command `npx playwright test` against a Playwright-managed production server.
- Chromium passed all 17 tests across 8 spec files in 1.3 minutes with 0 failures, flaky tests, or skips.
- Post-suite checks found 0 QA orders and 0 temporary customer users, and confirmed the production test server stopped.
- Visual evidence: `caseflow-store/.agent/artifacts/d17-t05-playwright-report.png`, `caseflow-store/.agent/artifacts/d17-t05-playwright-suite.json`, and `caseflow-store/playwright-report/index.html`.

Day 17 is complete.

## Day 1-17 Release-Readiness Audit

Completed on 2026-07-16 before starting Day 18.

- Fresh `npm run lint && npm run build` passed and generated 16 pages.
- The latest complete Chromium suite passed 17/17 tests.
- Live Supabase checks confirmed 5 categories, 16 products, at least one admin profile, public catalog reads, and denied anonymous order reads.
- The Day 16 Vercel preview remains Ready.
- `D02-T07` and `D05-T06` were conditional early deploy tasks honestly deferred when tooling was unavailable; the verified Day 16 preview superseded their risk without rewriting project history.
- Git commits/remote, Production environment variables, and production deployment are intentionally still open for Day 19.
- `npm audit --omit=dev` reports 2 moderate PostCSS advisories inherited through Next.js. The suggested force fix would downgrade Next.js to 9.3.3, so it is not a rational release fix; the app does not accept user-controlled CSS and the advisory remains documented.
- Evidence: `caseflow-store/.agent/artifacts/day-01-17-release-readiness-audit.json`.

Audit decision: approved to continue.

Completed `D18-T01` on 2026-07-16.

- Added the first release edge-case test with clean cart and checkout storage.
- Verified cart count 0, explicit drawer and checkout empty states, no checkout path from the drawer, no order form on checkout, and 0 order-creation requests.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t01-empty-cart-drawer.png` and `d18-t01-empty-checkout.png`.

Completed `D18-T02` on 2026-07-16.

- Verified stable API `404/PRODUCT_NOT_FOUND` and a matching HTTP 404 storefront fallback.
- Confirmed missing pages render no purchase controls and Browse products returns to the live 16-product catalog.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t02-missing-product.png`.

Completed `D18-T03` on 2026-07-16.

- Verified invalid quantity 0 returns `400/VALIDATION_ERROR` and quantity 19 against stock 18 returns `409/OUT_OF_STOCK`.
- Verified the product UI clamps quantity to 1-18, disables further additions at stock, and the drawer disables increment at 18.
- Verified a tampered local cart quantity 99 shows the checkout stock error and disables order submission.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t03-quantity-max-cart.png` and `d18-t03-out-of-stock-checkout.png`.

Completed `D18-T04` on 2026-07-16.

- The exact production-like chain `npm run build && npm run start` compiled, typechecked, generated 16 pages, and started on port 3000.
- HTTP home/products/categories/missing/admin checks returned 200/200/200/404/401.
- Five representative edge, storefront checkout, and admin workflow tests passed directly against that server.
- QA order cleanup returned 0 and the server stopped cleanly.
- Visual evidence: `caseflow-store/.agent/artifacts/d18-t04-production-local.png` and `d18-t04-production-local.json`.

Completed `D18-T05` on 2026-07-16.

- Initial full-suite attempts exposed test-only localStorage seed races across checkout, keyboard, and UI-state specs. These were fixed at the helper boundary and verified with focused repeat runs.
- The final full Chromium suite passed 20/20 in 1.6 minutes with 0 failed, flaky, or skipped tests.
- Exact secret scan found 0 matches across 327 commit candidates; live QA orders and temporary users were 0.
- Dependency audit has 0 critical/high findings and 2 accepted moderate PostCSS advisories; the unsafe force downgrade was rejected.
- Release candidate `v1.0.0-rc.1` is accepted for production deployment.
- Evidence: `caseflow-store/docs/release-candidate.md`, `.agent/artifacts/d18-t05-release-candidate-report.png`, and `d18-t05-release-candidate.json`.

Day 18 is complete.

Completed `D19-T01` on 2026-07-16.

- Created public repository `https://github.com/NVTruong473/caseflow-store`.
- Initial release-candidate commit `c4e4dfa4a7962057652045134ccbc81b7006fe04` was pushed to `main` and matches the remote branch.
- Pre-push checks covered 331 files / 27,749,663 bytes with 0 exact secret matches; local environment and Vercel link files remained ignored.
- Git 2.37 initially failed the 27 MB HTTP pack; a repository-local 500 MiB post buffer and HTTP/1.1 retry completed the push without changing commit contents.
- Evidence: `caseflow-store/.agent/artifacts/d19-t01-github-push.json`.

Completed `D19-T02` on 2026-07-16.

- Configured `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as sensitive Production variables through stdin.
- Vercel lists all three Production entries as Encrypted and preserves their Preview counterparts.
- Playwright admin credentials were not deployed and no values were printed.
- Evidence: `caseflow-store/.agent/artifacts/d19-t02-production-env.json`.

Completed `D19-T03` on 2026-07-16.

- Preview `dpl_EDqtfK9XuinEoKmCQjMMuY9GDagw` deployed Ready at `https://caseflow-store-oh8lf9ayr-nvt-ruong473.vercel.app`.
- Vercel-protected smoke checks verified home 200, 5 categories, 16 products, stable missing-product 404, anonymous admin 401, and live order 201 with server subtotal `329000`.
- Preview QA orders were cleaned to 0.
- Evidence: `caseflow-store/.agent/artifacts/d19-t03-preview-smoke.json`.

Completed `D19-T04` on 2026-07-16.

- Production deployment `dpl_4Wocg3yqgFoSUSCR76jvN6xL2esu` is Ready.
- The stable public alias is `https://caseflow-store.vercel.app`; alternate Vercel aliases resolve to the same deployment.
- The canonical alias returned HTTP 200 and the full-page browser capture rendered the live 5-category, 16-product storefront correctly.
- Evidence: `caseflow-store/.agent/artifacts/d19-t04-production.json` and `d19-t04-production.png`.

Current task: `D19-T05 - Test storefront, checkout, and admin on production`.

Completed `D19-T05` on 2026-07-16.

- The first production run passed 18/20 and exposed a real admin navigation race: the session succeeded, but paired client `replace`/`refresh` calls could leave the browser on the login route.
- Admin login now performs a full-document replacement after the session cookie is set; lint and the 16-route production build passed before redeployment.
- Production deployment `dpl_D5GLc5s5WbDs4xB3d22kXieyDCpz` is Ready at the canonical alias.
- The final full Chromium suite passed 20/20 against production in 2.8 minutes with 0 failed, flaky, or skipped tests.
- QA cleanup returned 0 orders and 0 temporary users.
- Evidence: `caseflow-store/.agent/artifacts/d19-t05-production-acceptance.json` and `d19-t05-production-report.png`.

Day 19 is complete.

Current task: `D20-T01 - Finalize README`.

Completed `D20-T01` on 2026-07-16.

- Added a repository-root portfolio README and replaced the default application scaffold README with a focused setup guide.
- The documentation covers only verified features, production evidence, stack, structure, setup, commands, environment boundaries, and security posture.
- Simulated checkout and the prohibition on deployed Playwright credentials are explicit.
- Both README files passed whitespace validation and all relative links resolve.
- Evidence: `README.md`, `caseflow-store/README.md`, and `caseflow-store/.agent/artifacts/d20-t01-readme.json`.

Current task: `D20-T02 - Finalize architecture summary and ADR index`.

Completed `D20-T02` on 2026-07-16.

- Replaced planning-era architecture text with an as-built production description covering containers, module boundaries, request flows, data model, security matrix, deployment, and evolution path.
- Production Supabase repositories are distinguished from retained mock-first history.
- The create-order RPC guarantees atomic order/item inserts but does not decrement stock; the limitation is explicit.
- Added a five-record ADR index with each accepted decision and verified implementation outcome.
- Root/app mirrors match; all four files passed whitespace and relative-link checks with 0 missing links.
- Evidence: `docs/architecture.md`, `docs/adr/README.md`, and `caseflow-store/.agent/artifacts/d20-t02-architecture.json`.

Current task: `D20-T03 - Capture desktop/mobile screenshots`.

Completed `D20-T03` on 2026-07-16.

- Captured production storefront and product-detail screenshots at 1440px desktop and 375px mobile widths.
- The desktop storefront and both product views are full-page; the storefront mobile image uses the standard 375x812 viewport to avoid a 12,745px portfolio image while preserving the next-section cue.
- Opened all four files and found 0 blank, crop, or overlap failures.
- Embedded the images in the repository README with descriptive alt text.
- Evidence: `caseflow-store/docs/screenshots/` and `caseflow-store/.agent/artifacts/d20-t03-screenshots.json`.

Current task: `D20-T04 - Document known limitations`.

Completed `D20-T04` on 2026-07-16.

- Documented 8 verified boundaries across commerce, customer/admin scope, catalog management, and production operations.
- Each limitation includes impact, the current control, and a concrete next step; stock validation is not misrepresented as reservation/decrement.
- Recorded the current dependency audit: 0 critical/high/low and 2 moderate PostCSS-via-Next findings; the unsafe force downgrade to Next 9.3.3 remains rejected.
- Root/app documents match, pass whitespace checks, and are linked from the repository README.
- Evidence: `docs/known-limitations.md` and `caseflow-store/.agent/artifacts/d20-t04-known-limitations.json`.

Current task: `D20-T05 - Write CV bullets using only verified evidence`.

Completed `D20-T05` on 2026-07-16.

- Created 3 recommended CV bullets, 6 alternatives grouped by full-stack/security/frontend focus, an interview summary, explicit caveats, and a 9-entry evidence ledger.
- Claims are tied to production URLs, schema, source modules, Playwright specs, and release artifacts.
- The file contains no unverified scale, percentage-improvement, or elapsed-calendar-time claims and explicitly identifies checkout as simulated.
- Root/app mirrors match and pass whitespace checks.
- Evidence: `docs/cv-bullets.md` and `caseflow-store/.agent/artifacts/d20-t05-cv-bullets.json`.

Current task: `D20-T06 - Create release tag v1.0.0`.

Completed `D20-T06` on 2026-07-16.

- Final root/app mirror and staged-diff checks passed; 49 release candidates contained 0 exact or high-confidence secret matches.
- ESLint passed; the production build passed TypeScript and generated 16 routes.
- The final local Chromium suite passed 20/20 in 1.4 minutes with 0 failed, flaky, or skipped tests; the accepted production run remains 20/20 in 2.8 minutes.
- Production smoke returned home 200, 5 categories, 16 products, and anonymous admin 401; QA cleanup returned 0 orders and 0 temporary users.
- Created annotated release tag `v1.0.0` for the production and portfolio release.
- Evidence: `caseflow-store/.agent/artifacts/d20-t06-release.json` and `d20-t06-release-report.png`.

Day 20 and the 20-task implementation phase are complete. The 30 journal entries remain a separate documentation phase and must not be presented as additional development days.

Next recommended task: `Entry 01 - Environment preflight`.

## Domain Model Draft Reference

```ts
type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  compatibility: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
};

type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};
```

## Database Draft

Tables:

- `profiles`
- `categories`
- `products`
- `orders`
- `order_items`

Required constraints:

- `products.slug` unique
- `categories.slug` unique
- `products.price >= 0`
- `products.stock >= 0`
- `order_items.quantity > 0`
- `orders.order_code` unique
- `orders.status` constrained to known values
- order item snapshots store `product_name`, `unit_price`, and `line_total`

Do not create a cart table for this MVP unless the scope changes.

## API Contract Draft

Public:

- `GET /api/products`
- `GET /api/products/[slug]`
- `GET /api/categories`
- `POST /api/cart/validate`
- `POST /api/orders`
- `GET /api/me`

Admin:

- `GET /api/admin/orders`
- `GET /api/admin/orders/[id]`
- `PATCH /api/admin/orders/[id]`

Standard success:

```json
{
  "data": {},
  "error": null
}
```

Standard failure:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ"
  }
}
```

Stable error codes:

- `VALIDATION_ERROR`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_INACTIVE`
- `OUT_OF_STOCK`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `ORDER_CREATE_FAILED`

## Security Rules

- Never trust client price, subtotal, stock, role, or order status.
- Server must read current product data before order creation.
- Server must calculate line totals and subtotal.
- Admin pages and admin APIs must verify session and role.
- RLS should deny by default, then allow only required access.
- Do not put server secrets in `NEXT_PUBLIC_*`.
- Do not log passwords, tokens, full addresses, or full phone numbers.
- Do not collect card data.

## UI Rules

- Read `DESIGN.md` before UI work.
- Mobile baseline: 375px.
- Desktop baseline: 1440px.
- Every form field needs a visible label.
- Interactive controls need focus states.
- Product images need stable dimensions.
- Use accessible names that Playwright can target.
- Avoid animation until the core flow is complete.

## Testing Gates

After code tasks:

```bash
npm run lint
```

After each implementation day:

```bash
npm run lint
npm run build
```

From E2E phase:

```bash
npm run test:e2e
```

Before production:

```bash
npm run lint
npm run build
npm run test:e2e
```

## Schedule Gates

- End Day 2: product domain, app skeleton, and smoke deploy path are clear.
- End Day 5: domain model and API contract are frozen.
- End Day 12: feature freeze.
- End Day 16: integration freeze.
- End Day 18: release candidate.
- End Day 20: production and portfolio acceptance.

## Risk Register

| ID | Risk | Impact | Mitigation |
|---|---|---:|---|
| R-01 | Product domain remains unconfirmed | Closed | Resolved on 2026-07-14; see `docs/domain.md` |
| R-02 | Scope creep | Critical | Freeze features Day 12; cut non-core polish first |
| R-03 | Deploy attempted too late | Critical | Smoke deploy Day 2-3 and preview deploy Day 5/16 |
| R-04 | Supabase issues found too late | High | Proof plan exists; live connection is still blocked by missing credentials |
| R-05 | Mock schema drifts from database schema | Medium | Domain types, Zod schemas, and SQL draft are aligned; mock data must follow them |
| R-06 | Client tampers with price or subtotal | Critical | Server recalculates totals from database |
| R-07 | Order creation is not atomic | Critical | Use transaction/RPC or document stock limitation clearly |
| R-08 | Admin API relies only on UI hiding | Critical | Server session and role check on every admin API |
| R-09 | Secret leaks to client | Critical | Separate public and server-only environment variables |
| R-10 | RLS policy leaks orders | Critical | Deny by default; test anonymous/user/admin |
| R-11 | localStorage cart becomes stale | Medium | Store only productId/quantity; validate before checkout |
| R-12 | UI polish consumes core-flow time | High | Prioritize flow, security, tests, responsive, then polish |
| R-13 | Product images break layout | Medium | Mock image paths exist, but actual image assets still need to be created before UI visual QA |
| R-14 | E2E tests start too late | High | Add testable selectors and skeleton by Day 10 |
| R-15 | Public demo receives spam or real PII | High | Demo notice, validation, honeypot, cleanup plan |
| R-16 | Documentation overgrows the product | Medium | Keep docs useful and short; do not delay implementation |
| R-17 | Project looks like a tutorial clone | High | Add phone-compatibility filter and strong technical evidence |

## Current External Blockers

- Supabase project, app packages, schema, RLS, seed data, local public credentials, and live catalog repository integration are complete.
- Live order persistence, server-owned totals, Supabase admin auth, and the three-role access matrix are complete.
- Vercel account/project permissions are not verified.
- Exact deployment/free-tier constraints must be checked when deployment begins.

## Current Architecture Direction - v1.12.0

- `v1.12.0` adopts a layered architecture boundary for high-risk mutating APIs:
  Route Handler / Controller -> Application Use Case -> Policy/Validation ->
  Repository -> Supabase/PostgreSQL.
- This is not a forced textbook MVC rewrite. The deployed shape remains a
  Next.js modular monolith because that matches the app router, Vercel
  deployment, and current Supabase integration.
- `POST /api/orders` is the first extracted high-risk workflow. The route now
  validates the request DTO and delegates auth/profile/contact checks, cart
  validation, promotion evaluation, signup voucher reservation/rollback,
  trusted total calculation, and order creation to
  `createBookOrderUseCase`.
- Architecture drift is now checked by `npm run verify:architecture`, which
  blocks repository/use-case imports from UI, feature, app-route, and Next
  route APIs and verifies that the order route uses the order use case.
- Local v1.12 regression gates have passed: lint, TypeScript, build, focused
  checkout/API Playwright, full Playwright `20/20`, no-demo copy, public asset
  metadata, QR secret scan, QR production-safety source check, QR demo payment
  flow, and high-severity dependency audit.
- `ARCH-LAYER-T07` shipped `v1.12.0`: runtime commit
  `4fd632b1a6b9f515bc47b766aeedc0b601f3917e`, production deployment
  `dpl_8MCASvEYjndhtQJuvbPJeqkFF1gA`, tag `v1.12.0`, and GitHub Release
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.12.0`.
- Production v1.12 gates passed: Vercel inspect, production smoke, security
  posture, QR production lock with runtime `401`, and full production
  Playwright `20/20`.
- Custom SMTP remains blocked until real Supabase Management API and SMTP
  credentials exist.
