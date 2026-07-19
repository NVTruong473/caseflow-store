# CaseFlow Store - Step Results

## Current Snapshot

| Field | Value |
|---|---|
| Current mode | v1.4.0 released |
| Current gate | `V14-T13` complete |
| Implementation started | Yes |
| Next implementation task | No active implementation task |
| App initialized | Yes, in `caseflow-store` |
| Local server verified | Yes, V14-T12 full Playwright `20/20` passed on a production-style local server at `http://127.0.0.1:3001`; V14 visual QA passed on local `next start` at `http://127.0.0.1:3000` |
| Lint verified | Yes, V14-T13 pre-release lint passed |
| Build verified | Yes, V14-T13 local and Vercel production builds generated 48 App Router routes plus proxy |
| Database connected | Yes; live catalog, orders, Auth, role checks, and admin status updates use Supabase |
| Deployed | Yes, v1.4 production deployment `dpl_7S279YwsGzB4D6H11PiauzG9GvDL` is aliased to `https://caseflow-store.vercel.app` |
| Last updated | 2026-07-19 |

## Result Index

| Entry | Date | Task | Status | Summary |
|---|---|---|---|---|
| SR-001 | 2026-07-14 | DOC-001 | completed | Created project guidance, context management, architecture, risk, ADR, design, and skill docs |
| SR-002 | 2026-07-14 | DOC-006 | completed | Reviewed remaining gaps and recorded mitigation before implementation |
| SR-003 | 2026-07-14 | D01-T01 | blocked | User confirmed implementation start, but environment preflight found `node`, `npm`, and `npx` missing from shell PATH; user-approved Homebrew Node install failed before Node was installed |
| SR-004 | 2026-07-14 | D01-T01..D01-T04 | completed | Installed official Node LTS binary, initialized Next.js app, verified dev server, lint, build, and Git status |
| SR-005 | 2026-07-14 | D02-T01 | completed | Copied project management docs into the nested app and reconciled the app-level AGENTS.md |
| SR-006 | 2026-07-14 | D02-T02 | completed | Created planned source, Supabase, and test folders with `.gitkeep` placeholders |
| SR-007 | 2026-07-14 | D02-T03 | completed | Created `.env.example`, allowed it in `.gitignore`, and verified `.env.local` remains ignored |
| SR-008 | 2026-07-14 | D02-T04 | completed | Replaced the default Next.js page with a CaseFlow status page and verified lint, build, and HTTP content |
| SR-009 | 2026-07-14 | D02-T05 | completed | Verified root and app-level AGENTS, DESIGN, and ADR files |
| SR-010 | 2026-07-14 | D02-T06 | completed | Ran `npm run lint && npm run build`; both passed |
| SR-011 | 2026-07-14 | D03-T01 | completed | Selected phone accessories as the domain, documented categories and compatibility filtering, and advanced roadmap to D03-T02 |
| SR-012 | 2026-07-14 | D03-T02 | completed | Added TypeScript domain types and constants in `src/types/domain.ts`; lint passed |
| SR-013 | 2026-07-14 | D04-T01 | completed early | Installed Zod early because D03-T03 depends on it; lint passed |
| SR-014 | 2026-07-14 | D03-T03 | completed | Added Zod domain schemas in `src/lib/validation/domain.ts`; lint and TypeScript checks passed |
| SR-015 | 2026-07-14 | D03-T04 | completed | Added Supabase schema draft with tables, constraints, indexes, triggers, and RLS defaults |
| SR-016 | 2026-07-14 | D03-T05 | completed | Added Zod-validated mock catalog with 5 categories and 16 products |
| SR-017 | 2026-07-14 | D03-T06 | completed | Added Supabase proof-of-connection plan; no live connection attempted because credentials are unavailable |
| SR-018 | 2026-07-14 | D04-T02 | completed | Implemented `GET /api/products` with mock repository, query validation, and HTTP verification |
| SR-019 | 2026-07-14 | D04-T03 | completed | Implemented `GET /api/products/[slug]` with validation, 404 handling, and HTTP verification |
| SR-020 | 2026-07-14 | D04-T04 | completed | Implemented `GET /api/categories` with active-category sorting and HTTP verification |
| SR-021 | 2026-07-14 | D04-T05 | completed | Implemented `POST /api/cart/validate` with server-side price/subtotal recalculation and HTTP verification |
| SR-022 | 2026-07-14 | D04-T06 | completed | Verified Day 4 APIs with curl and reran lint/build successfully |
| SR-023 | 2026-07-14 | D05-T01 | completed | Implemented `POST /api/orders` with server-side total recalculation and HTTP verification |
| SR-024 | 2026-07-14 | D05-T02 | completed | Implemented guarded `GET /api/admin/orders` with mock admin token and HTTP verification |
| SR-025 | 2026-07-14 | D05-T03 | completed | Implemented guarded `PATCH /api/admin/orders/[id]` with status validation and HTTP verification |
| SR-026 | 2026-07-14 | D05-T04 | completed | Standardized API responses as `{ data, error, meta }` and verified response keys |
| SR-027 | 2026-07-14 | D05-T05 | completed | Verified cart, order, and admin APIs ignore client-supplied price/subtotal fields |
| SR-028 | 2026-07-14 | D05-T06 | deferred | Preview deploy not attempted because Vercel CLI/project/env/approval are missing |
| SR-029 | 2026-07-14 | D06-T01 | completed | Mapped design tokens into global CSS/Tailwind and verified lint/build |
| SR-030 | 2026-07-15 | D06-T02 | completed | Created shared UI primitives and verified them with lint, TypeScript, build, and screenshots |
| SR-031 | 2026-07-15 | D06-T03 | completed | Added header, footer, mobile navigation, and verified desktop/mobile states |
| SR-032 | 2026-07-15 | D06-T04 | completed | Verified 375px and 1440px layouts with screenshots and overflow checks |
| SR-033 | 2026-07-15 | D07-T01 | completed | Built the storefront homepage from mock catalog data and verified responsive screenshots |
| SR-034 | 2026-07-15 | D07-T02 | completed | Added product visuals, cards, and responsive product grid with 16 mock products |
| SR-035 | 2026-07-15 | D07-T03 | completed | Added category filtering and verified interaction checks |
| SR-036 | 2026-07-15 | D07-T04 | completed | Added search and basic sorting with interaction checks and screenshots |
| SR-037 | 2026-07-15 | D07-T05 | completed | Added loading, empty, and error catalog states with preview screenshots |
| SR-038 | 2026-07-15 | D08-T01 | completed | Built `/products/[slug]`, linked product cards, and verified SSG paths |
| SR-039 | 2026-07-15 | D08-T02 | completed | Added product detail image, price, stock, compatibility, and description content |
| SR-040 | 2026-07-15 | D08-T03 | completed | Added quantity selector and add-to-cart feedback with interaction verification |
| SR-041 | 2026-07-15 | D08-T04 | completed | Added product-specific not-found UI and verified real 404 status |
| SR-042 | 2026-07-15 | D09-T01 | completed | Implemented in-memory Cart Context and verified cart count updates |
| SR-043 | 2026-07-15 | D09-T02 | completed | Added versioned localStorage cart persistence and verified reload behavior |
| SR-044 | 2026-07-15 | D09-T03 | completed | Built cart drawer with empty/item states and interaction verification |
| SR-045 | 2026-07-15 | D09-T04 | completed | Added quantity boundary validation for product add-to-cart, cart drawer controls, and tampered localStorage recovery |
| SR-046 | 2026-07-15 | D10-T01 | completed | Built `/checkout` route with empty state, form shell, server-validated cart review, and drawer navigation |
| SR-047 | 2026-07-15 | D10-T02 | completed | Added checkout customer validation for name, email, phone, and shipping address |
| SR-048 | 2026-07-15 | D10-T03 | completed | Added checkout order summary from server-validated cart totals |
| SR-049 | 2026-07-15 | D10-T04 | completed | Added checkout success page and simulated order submission flow |
| SR-050 | 2026-07-15 | D10-T05 | completed | Added Playwright config and checkout E2E skeleton |
| SR-051 | 2026-07-15 | D11-T01 | completed | Built `/admin/login` with server-verified mock admin token session |
| SR-052 | 2026-07-15 | D11-T02 | completed | Built `/admin/orders` with guarded admin order list table and mobile cards |
| SR-053 | 2026-07-15 | D11-T03 | completed | Added admin order detail panel and guarded status update UI |
| SR-054 | 2026-07-15 | D11-T04 | completed | Added mobile/tablet admin treatment and fixed 768px overflow |
| SR-055 | 2026-07-15 | D12-T01 | completed | Tested core UI at 375/768/1024/1440 with no overflow failures |
| SR-056 | 2026-07-15 | D12-T02 | completed | Checked keyboard navigation and focus states with Playwright coverage |
| SR-057 | 2026-07-15 | D12-T03 | completed | Checked loading, empty, error, and success states with Playwright coverage |
| SR-058 | 2026-07-15 | D12-T04 | completed | Final Day 12 lint and production build verification passed |
| SR-059 | 2026-07-15 | D12-T05 | completed | Activated feature freeze and advanced the roadmap to Supabase integration |
| SR-060 | 2026-07-15 | D13-T01 | completed | Created and verified Supabase project `caseflow-store`; local env/schema integration remains for later tasks |
| SR-061 | 2026-07-15 | D13-T02 | completed | Installed Supabase app packages and verified lint/typecheck |
| SR-062 | 2026-07-15 | D13-T03 | completed | Applied Supabase schema SQL and verified expected tables, no cart table, enum, triggers, policies, and RLS flags |
| SR-063 | 2026-07-15 | D13-T04 | completed | Enabled and verified RLS grants, policies, anon catalog visibility, and blocked direct order access |
| SR-064 | 2026-07-15 | D13-T05 | completed | Seeded 5 categories and 16 products into Supabase and verified catalog counts |
| SR-065 | 2026-07-15 | D14-T01 | completed | Added typed Supabase browser/server client factories and verified lint, typecheck, and build |
| SR-066 | 2026-07-15 | D14-T02 | completed | Added validated category/product row-to-domain mapping and verified runtime rejection of invalid data |
| SR-067 | 2026-07-15 | D14-T03 | completed | Replaced live mock catalog reads with Supabase and verified APIs, cart totals, homepage, lint, and build |
| SR-068 | 2026-07-15 | D14-T04 | completed | Retested production storefront against Supabase with 7/7 focused Playwright checks and visual evidence |
| SR-069 | 2026-07-15 | D15-T01 | completed | Added and live-tested atomic server-only Supabase order persistence |
| SR-070 | 2026-07-15 | D15-T02 | completed | Recalculated product snapshots and totals server-side before live order creation |
| SR-071 | 2026-07-15 | D15-T03 | completed | Configured a dedicated confirmed Supabase admin identity and profile role |
| SR-072 | 2026-07-15 | D15-T04 | completed | Replaced mock admin tokens with protected Supabase cookie sessions and live admin APIs |
| SR-073 | 2026-07-15 | D15-T05 | completed | Passed the three-role access matrix and full 12/12 production Playwright suite |
| SR-074 | 2026-07-15 | D16-T01 | completed | Finalized the runtime/E2E environment contract with no stale keys or populated placeholders |
| SR-075 | 2026-07-15 | D16-T02 | completed | Excluded local secrets and found no sensitive values in commit candidates or build output |
| SR-076 | 2026-07-15 | D16-T03 | completed | Locked 13 API error codes and passed production contract tests |
| SR-077 | 2026-07-15 | D16-T04 | completed | Deployed and smoke-tested the protected Vercel integration preview |
| SR-078 | 2026-07-15 | D16-T05 | completed | Passed final lint/build and activated integration freeze |
| SR-109 | 2026-07-16 | D23-T03 | completed | Applied and verified the CaseFlow Books schema migration in Supabase with backup/export evidence, RLS/access checks, app regression, and production smoke |
| SR-110 | 2026-07-16 | D24-T01 | completed | Created and verified the 100-edition CaseFlow Books seed dataset with balanced English/Vietnamese editions and self-written summaries |
| SR-111 | 2026-07-16 | D24-T02 | completed | Created the safe cover strategy, internal placeholder asset, stable cover mapping, and visual smoke evidence |
| SR-112 | 2026-07-16 | D24-T03 | completed | Seeded CaseFlow Books data into Supabase deterministically and verified counts, language distribution, legacy catalog preservation, and public book smoke |
| SR-113 | 2026-07-16 | D25-T01 | completed | Implemented validated book row mappers and Supabase book repositories with runtime mapper/repository smoke evidence |
| SR-114 | 2026-07-16 | D25-T02 | completed | Replaced public catalog APIs with validated CaseFlow Books category/list/detail responses and curl-verified stable envelopes |
| SR-115 | 2026-07-16 | D25-T03 | completed | Accepted the CaseFlow Books data/domain/API freeze with documented risks and freeze artifact evidence |
| SR-116 | 2026-07-16 | D26-T01 | completed | Rebranded active UI and README references to CaseFlow Books with text search and desktop/mobile screenshot evidence |
| SR-117 | 2026-07-16 | D26-T02 | completed | Added cookie-backed Vietnamese/English language mode with header switcher, localized core UI labels, and Playwright screenshot evidence |
| SR-118 | 2026-07-16 | D26-T03 | completed | Added server-owned VND-to-USD display rules with configurable VAT/fee assumptions, English-mode estimates, and runtime/visual verification |
| SR-148 | 2026-07-17 | D39-T02 | completed | Added bookstore SEO metadata, robots/sitemap routes, private-page noindex handling, and book JSON-LD with production canonical verification |
| SR-149 | 2026-07-17 | D39-T03 | completed | Verified accessibility/mobile/performance, fixed assistant overlay on form surfaces, and captured 375px/1440px visual evidence |
| SR-150 | 2026-07-17 | D40-T01 | completed | Migrated E2E suite to CaseFlow Books, passed local quality gates, verified cleanup, and documented moderate dependency audit risk |
| SR-151 | 2026-07-17 | D40-T02 | completed | Deployed v1.1 to Vercel production and passed production smoke, assistant, Playwright subset, cleanup, and secret scan checks |
| SR-152 | 2026-07-17 | D40-T03 | completed | Updated v1.1 portfolio docs and screenshots, passed mirror/link/screenshot/stale-claim verification, typecheck, lint, and diff checks |
| SR-153 | 2026-07-17 | D40-T04 | completed | Accepted the release tree for annotated tag v1.1.0 after local, production, docs, audit, cleanup, and secret gates passed |
| SR-169 | 2026-07-18 | V12-T16 | completed | Integrated accepted v1.2 catalog content across search, assistant, SEO/social metadata, cart/order snapshots, CSV export, legacy recovery, and docs with production-style runtime evidence |
| SR-170 | 2026-07-18 | V12-T17 | completed | Passed the full v1.2 local quality gate with type/lint/build, Playwright 20/20, aggregate content/asset/runtime reports, cleanup, secret scan, and documented dependency/performance residuals |
| SR-171 | 2026-07-18 | V12-T18 | completed | Deployed v1.2.0 to Vercel production, passed production smoke and full production Playwright 20/20, refreshed release docs/evidence, cleaned verification data, and created the release commit/tag |
| SR-172 | 2026-07-18 | V13-T01 | completed | Accepted ADR-0008 and the v1.3 visual merchandising roadmap, bounding polish to richer tokens, cover-led merchandising, visual QA, and no new commerce/integration scope |
| SR-173 | 2026-07-18 | V13-T02 | completed | Captured Hallmark-informed visual baseline screenshots for six surfaces at mobile/desktop, confirmed zero overflow, and mapped six ranked findings to V13 tasks |
| SR-174 | 2026-07-18 | V13-T03 | completed | Expanded bookstore design tokens into paper/ink, moss discovery, wine editorial, amber offer, and admin trust palette with CSS/theme/docs verification |
| SR-175 | 2026-07-18 | V13-T04 | completed | Added reusable local-cover merchandising frame, stack, shelf, and display helpers with static contract, type, lint, and diff verification |
| SR-176 | 2026-07-18 | V13-T05 | completed | Upgraded homepage hero and product cards with cover-led merchandising, preserved released counts/flows, and passed V13/V12 homepage visual gates |
| SR-177 | 2026-07-18 | V13-T06 | completed | Polished catalog cards and discovery surfaces with shared cover frames and token accents while preserving pagination, filters, and V12 discovery gates |
| SR-178 | 2026-07-18 | V13-T07 | completed | Polished book detail hierarchy with shared cover frames, compact mobile commerce, and V13 visual gates while preserving cart, SEO, and edition comparison behavior |
| SR-179 | 2026-07-18 | V13-T08 | completed | Polished admin operations surfaces with admin trust tokens, fixed staff catalog PATCH source-review default detection, and passed visual/admin/static gates |
| SR-180 | 2026-07-18 | V13-T09 | completed | Passed the full v1.3 local visual/documentation QA gate, added release notes, verified cleanup/stale/secret scans, and left deploy/tag pending explicit instruction |
| SR-181 | 2026-07-18 | V13-T10 | completed | Deployed v1.3.0 to Vercel production, passed production smoke, refreshed release docs/evidence, and created the release commit/tag |
| SR-182 | 2026-07-18 | QA-FINAL-T01 | completed | Passed final post-release tester audit for v1.3.0 with production smoke, full Playwright 20/20, accessibility/mobile/performance, cleanup, static gates, and no P0/P1 findings |
| SR-183 | 2026-07-19 | V14-T12 | completed | Passed the full local v1.4 quality gate with TypeScript, lint, build, Playwright 20/20, V14 visual QA, cleanup, high/critical audit, targeted secret scan, release-readiness report, and no deploy/tag/release |
| SR-184 | 2026-07-19 | V14-T13 | completed | Deployed v1.4.0 to Vercel production, passed production smoke, refreshed release docs/evidence, fixed localized-title smoke verification, and prepared GitHub tag/release publication |

---

## SR-001 - DOC-001: Package Project Knowledge Into Markdown

- Date: 2026-07-14
- Status: completed
- Phase: Pre-implementation

### Objective

Convert the useful knowledge from the referenced planning conversation into persistent repository Markdown files so future AI sessions can continue without rereading the entire chat.

### Files Created

- `AGENTS.md`
- `DESIGN.md`
- `SKILL.md`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/context-management.md`
- `docs/architecture.md`
- `docs/pre-implementation-review.md`
- `docs/diagrams/system-context.md`
- `docs/diagrams/container-diagram.md`
- `docs/adr/0001-use-nextjs-modular-monolith.md`
- `docs/adr/0002-use-supabase.md`
- `docs/adr/0003-use-mock-first-development.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`

### Commands Executed

```bash
pwd
rg --files -g '*.md' -g 'AGENTS.md' -g 'DESIGN.md' -g 'SKILL.md' -g '.agent/**' -g 'docs/**'
find . -maxdepth 3 -type d | sort
git status --short
mkdir -p .agent docs/adr docs/diagrams
```

### Tests Executed

No application tests were run because the application has not been initialized.

### Actual Result

Project documentation and agent context files were created. App implementation remains blocked until the user confirms.

### Technical Decisions Captured

- Use a Next.js modular monolith.
- Use Supabase for PostgreSQL and Auth.
- Build mock-first before database integration.
- Store guest cart locally with `productId` and `quantity`.
- Use simulated checkout only.
- Add `DESIGN.md` to stabilize UI decisions.
- Use ADRs for major technical choices.

---

## SR-002 - DOC-006: Pre-Implementation Gap Review

- Date: 2026-07-14
- Status: completed
- Phase: Pre-implementation

### Objective

Review the plan for missing assumptions, hidden risks, and implementation blockers before starting from zero.

### Findings

1. Product domain is still assumed, not confirmed.
2. Local environment versions are not verified.
3. Vercel/Supabase access is not verified.
4. External free-tier behavior may change and must be checked during deployment planning.
5. Stock decrement and transaction complexity may exceed the MVP if handled too ambitiously.
6. Documentation can become overbuilt if it delays the working product.
7. The project can look like a generic tutorial unless it includes domain-specific behavior and strong test/security evidence.

### Mitigations Added

- Do not begin implementation until the user confirms.
- Day 1 starts with environment preflight.
- Day 3 confirms product domain before schema work.
- Day 3 includes Supabase proof-of-connection planning.
- Day 12 feature freeze and Day 16 integration freeze limit scope creep.
- Order creation must either use an atomic transaction/RPC or clearly document stock limitations.
- Phone compatibility filter is the default domain-specific feature.
- `docs/pre-implementation-review.md` records readiness, feasibility, outcomes, and final gaps.

### Remaining Blockers

- Waiting for user confirmation.
- Need real terminal output for Node.js, npm, npx, and Git.
- Need final product-domain confirmation.

### Next Task

`CONFIRM-001 - User confirms implementation start`

---

## SR-003 - D01-T01: Environment Preflight

- Date: 2026-07-14
- Status: completed
- Phase: Day 1 - Local Environment And Project Skeleton

### Objective

Verify that Node.js, npm, npx, and Git are available before initializing the Next.js application.

### Gate Update

The user explicitly confirmed implementation can begin on 2026-07-14. `CONFIRM-001` is complete.

### Commands Executed

```bash
node -v
npm -v
npx --version
git --version
command -v node npm npx brew nvm fnm volta asdf
printf '%s\n' "$PATH"
brew --version
brew list --versions node npm
/Users/vantruong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node -v
ls /Users/vantruong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin
find /Users/vantruong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node -maxdepth 4 -type f -name npm -o -name npx -o -name corepack
find /Users/vantruong/.cache/codex-runtimes/codex-primary-runtime/dependencies -maxdepth 4 -type f -name npm -o -name npx -o -name corepack
```

### Actual Output Summary

- `node -v`: `zsh:1: command not found: node`
- `npm -v`: `zsh:1: command not found: npm`
- `npx --version`: `zsh:1: command not found: npx`
- `git --version`: `git version 2.37.1 (Apple Git-137.1)`
- `command -v ...`: only `/usr/local/bin/brew` was found among the checked tools.
- `brew --version`: `Homebrew 6.0.6`
- Codex bundled Node: `v24.14.0`
- Codex bundled node bin directory contains only `node`.
- Bundled `npm`, `npx`, and `corepack` were not found in the checked runtime paths.

### Result

`D01-T01` did not pass. The machine shell does not currently provide the Node.js/npm/npx toolchain required by the planned `create-next-app` command.

### Remaining Blockers

- Install or expose a usable local Node.js toolchain that includes `node`, `npm`, and `npx`.
- Rerun `D01-T01`.
- Do not run `D01-T02` until `D01-T01` passes.

### Next Task

Unblock and rerun `D01-T01 - Environment preflight`.

### Follow-Up Attempt: Homebrew Node Install

The user approved running `brew install node` on 2026-07-14.

Observed Homebrew facts:

- Homebrew warned that macOS 12 is a Tier 3 configuration.
- Homebrew planned to install Node plus many dependencies and upgrades.
- `openssl@3` built from source and installed successfully after about 28 minutes.
- `cmake` built from source and installed successfully after about 34 minutes.
- `python@3.14` built successfully after about 15 minutes but did not link cleanly due conflicts with existing Python 3.13/3.12 files in `/usr/local`.
- Homebrew then failed while installing the `llvm` dependency for `ada-url`.

Failure:

```text
Error: An exception occurred within a child process:
  Errno::ENOENT: No such file or directory @ rb_sysopen - /Users/vantruong/Library/Caches/Homebrew/downloads/373708817c634b56c0b875aba22b6d707aa53a17bb24ea9850a44bf2e00907a5--1381ad497b9a6d3da630cbef53cbfa9ddf117bb6...40a8c7c0ff3f688b690e4c74db734de67f0f89e9.diff
```

Post-failure verification:

```bash
node -v
npm -v
npx --version
git --version
brew list --versions node llvm ada-url python@3.14 cmake openssl@3
```

Output summary:

- `node -v`: `zsh:1: command not found: node`
- `npm -v`: `zsh:1: command not found: npm`
- `npx --version`: `zsh:1: command not found: npx`
- `git --version`: `git version 2.37.1 (Apple Git-137.1)`
- `brew list --versions ...`: showed `cmake 4.4.0 4.3.2`, `openssl@3 3.6.3 3.6.2`, and `python@3.14 3.14.6`; it did not show `node`, `llvm`, or `ada-url`.

Result: `D01-T01` remains blocked. Do not run `D01-T02`.

---

## SR-004 - D01-T01..D01-T04: Day 1 Baseline

- Date: 2026-07-14
- Status: completed
- Phase: Day 1 - Local Environment And Project Skeleton

### Objective

Unblock the local JavaScript toolchain, initialize the Next.js application, run it locally, and complete baseline checks.

### Node Toolchain Resolution

Homebrew was not viable for this machine during this session:

- `brew install node` warned that macOS 12 is Tier 3.
- Homebrew attempted source builds for large dependencies.
- The install failed at `llvm` with a missing cached patch file.

Resolution used:

- Downloaded official Node.js LTS `v24.18.0` for `darwin-x64`.
- Verified `node-v24.18.0-darwin-x64.tar.xz` against `SHASUMS256.txt`.
- Extracted to `/usr/local/lib/nodejs/node-v24.18.0-darwin-x64`.
- Symlinked `node`, `npm`, and `npx` into `/usr/local/bin`.

### Commands Executed

```bash
node -v
npm -v
npx --version
git --version
npx create-next-app@latest --help
npx create-next-app@latest caseflow-store --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes --disable-git
cd caseflow-store
npm run dev
curl -I http://localhost:3000
npm run lint
npm run build
git status --short --branch
```

### Actual Output Summary

- `node -v`: `v24.18.0`
- `npm -v`: `11.16.0`
- `npx --version`: `11.16.0`
- `git --version`: `git version 2.37.1 (Apple Git-137.1)`
- `create-next-app`: created `caseflow-store` with Next.js `16.2.10`, React `19.2.4`, TypeScript, Tailwind CSS, ESLint, App Router, and `src/`.
- `npm run dev`: started Next.js at `http://localhost:3000`.
- `curl -I http://localhost:3000`: returned `HTTP/1.1 200 OK`.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git status --short --branch`: root repository has no commits yet; documentation and `caseflow-store/` are untracked.

### Notes And Risks

- The actual `create-next-app` command added `--yes --disable-git`; this avoids interactive prompts and avoids creating a nested Git repository inside the existing root Git repo.
- `npm install` reported 2 moderate severity vulnerabilities. This is recorded but not auto-fixed because `npm audit fix --force` can introduce breaking changes.
- npm warned that `unrs-resolver` and `sharp` install scripts are pending approval.
- `create-next-app` generated `caseflow-store/AGENTS.md` and `caseflow-store/CLAUDE.md`; these must be reconciled with the root project rules during Day 2.
- The dev server is currently running in this Codex session on `http://localhost:3000`.

### Next Task

`D02-T01 - Move or copy project management docs into the app repository if the app is nested`

---

## SR-005 - D02-T01: Copy Project Management Docs Into Nested App

- Date: 2026-07-14
- Status: completed
- Phase: Day 2 - Project structure, agent files, and smoke deploy

### Objective

Make sure the nested `caseflow-store` app has the project management and agent context files needed for future work from inside the app folder.

### Commands Executed

```bash
find . -maxdepth 3 -type f \( -path './.agent/*' -o -path './docs/*' -o -name 'AGENTS.md' -o -name 'DESIGN.md' -o -name 'SKILL.md' \) | sort
find caseflow-store -maxdepth 2 -type f \( -name 'AGENTS.md' -o -name 'CLAUDE.md' -o -name 'README.md' -o -name 'package.json' \) -print | sort
sed -n '1,80p' caseflow-store/AGENTS.md
sed -n '1,80p' caseflow-store/CLAUDE.md
mkdir -p caseflow-store/.agent caseflow-store/docs
cp AGENTS.md caseflow-store/AGENTS.md
cp DESIGN.md SKILL.md caseflow-store/
cp .agent/project-context.md .agent/todo-roadmap.md .agent/step-results.md caseflow-store/.agent/
cp -R docs/adr docs/diagrams caseflow-store/docs/
cp docs/architecture.md docs/context-management.md docs/pre-implementation-review.md caseflow-store/docs/
```

### Files Copied Or Updated

- `caseflow-store/AGENTS.md`
- `caseflow-store/DESIGN.md`
- `caseflow-store/SKILL.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/architecture.md`
- `caseflow-store/docs/context-management.md`
- `caseflow-store/docs/pre-implementation-review.md`
- `caseflow-store/docs/adr/`
- `caseflow-store/docs/diagrams/`

### Result

`D02-T01` is complete. The scaffolded app-level `AGENTS.md` was replaced by the project rules, then amended with a Next.js `16.2.10` version note. `caseflow-store/CLAUDE.md` remains a pointer to `AGENTS.md`.

### Next Task

`D02-T02 - Create folders: components, features, lib, data, types, supabase, and tests`

---

## SR-006 - D02-T02: Create Project Folders

- Date: 2026-07-14
- Status: completed
- Phase: Day 2 - Project structure, agent files, and smoke deploy

### Objective

Create the planned top-level application folders for components, features, shared libraries, data, types, Supabase files, and tests.

### Commands Executed

```bash
mkdir -p caseflow-store/src/components caseflow-store/src/features caseflow-store/src/lib caseflow-store/src/data caseflow-store/src/types caseflow-store/supabase caseflow-store/tests
find caseflow-store/src caseflow-store/supabase caseflow-store/tests -maxdepth 2 -type d | sort
find caseflow-store/src caseflow-store/supabase caseflow-store/tests -name .gitkeep -print | sort
git status --short --branch
```

### Files Created

- `caseflow-store/src/components/.gitkeep`
- `caseflow-store/src/features/.gitkeep`
- `caseflow-store/src/lib/.gitkeep`
- `caseflow-store/src/data/.gitkeep`
- `caseflow-store/src/types/.gitkeep`
- `caseflow-store/supabase/.gitkeep`
- `caseflow-store/tests/.gitkeep`

### Actual Result

The planned folders exist:

- `caseflow-store/src/components`
- `caseflow-store/src/features`
- `caseflow-store/src/lib`
- `caseflow-store/src/data`
- `caseflow-store/src/types`
- `caseflow-store/supabase`
- `caseflow-store/tests`

### Next Task

`D02-T03 - Create .env.example and verify .env.local is ignored`

---

## SR-007 - D02-T03: Environment Example And Ignore Check

- Date: 2026-07-14
- Status: completed
- Phase: Day 2 - Project structure, agent files, and smoke deploy

### Objective

Create a safe `.env.example` and verify that real local environment files remain ignored.

### Files Changed

- `caseflow-store/.env.example`
- `caseflow-store/.gitignore`

### Commands Executed

```bash
sed -n '1,220p' caseflow-store/.gitignore
git -C caseflow-store check-ignore -v .env.local
git -C caseflow-store check-ignore -v .env.example
git -C caseflow-store check-ignore -q .env.local
git -C caseflow-store check-ignore -q .env.example
git -C caseflow-store status --short --untracked-files=all | rg '\.env|\.gitignore'
git status --short --branch
```

### Actual Result

- `.env.local` is ignored by `caseflow-store/.gitignore`.
- `.env.example` is not ignored and appears in Git status.
- `.env.example` contains placeholders only; no real secrets were added.

### Next Task

`D02-T04 - Replace default page with a simple CaseFlow status page`

---

## SR-008 - D02-T04: CaseFlow Status Page

- Date: 2026-07-14
- Status: completed
- Phase: Day 2 - Project structure, agent files, and smoke deploy

### Objective

Replace the default Next.js template page with a simple CaseFlow Store status page suitable for the local baseline.

### Required Reading

- `DESIGN.md`

### Files Changed

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/app/globals.css`

### Commands Executed

```bash
sed -n '1,260p' DESIGN.md
sed -n '1,240p' caseflow-store/src/app/page.tsx
sed -n '1,240p' caseflow-store/src/app/globals.css
sed -n '1,200p' caseflow-store/src/app/layout.tsx
npm run lint
curl -s http://localhost:3000 | rg -n "CaseFlow Store|Local baseline ready|Implementation Status"
npm run build
```

### Actual Result

- The default scaffold page was removed.
- The new page displays CaseFlow Store baseline status, verified stack, and next focus.
- Metadata now uses `CaseFlow Store`.
- Global CSS uses `DESIGN.md` color and font tokens.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- HTTP content check found expected page text.

### Limitation

No browser screenshot tool was available in this turn, so visual QA was limited to code inspection, successful render output, lint, and production build.

### Next Task

`D02-T05 - Create or verify AGENTS.md, DESIGN.md, and docs/adr`

---

## SR-009 - D02-T05: Verify Agent And ADR Files

- Date: 2026-07-14
- Status: completed
- Phase: Day 2 - Project structure, agent files, and smoke deploy

### Objective

Verify that `AGENTS.md`, `DESIGN.md`, and ADR files exist at the root and inside the nested app.

### Commands Executed

```bash
test -f AGENTS.md && test -f DESIGN.md && test -d docs/adr && find docs/adr -maxdepth 1 -type f -name '*.md' | sort
test -f caseflow-store/AGENTS.md && test -f caseflow-store/DESIGN.md && test -d caseflow-store/docs/adr && find caseflow-store/docs/adr -maxdepth 1 -type f -name '*.md' | sort
sed -n '1,80p' caseflow-store/AGENTS.md
git status --short --branch
```

### Actual Result

Verified:

- Root `AGENTS.md`
- Root `DESIGN.md`
- Root `docs/adr/` with 5 ADR files
- App-level `caseflow-store/AGENTS.md`
- App-level `caseflow-store/DESIGN.md`
- App-level `caseflow-store/docs/adr/` with 5 ADR files

### Next Task

`D02-T06 - Run npm run lint && npm run build`

---

## SR-010 - D02-T06: Day 2 Baseline Checks

- Date: 2026-07-14
- Status: completed
- Phase: Day 2 - Project structure, agent files, and smoke deploy

### Objective

Run the Day 2 baseline checks after app structure, env example, and status page changes.

### Commands Executed

```bash
npm run lint && npm run build
```

### Actual Result

- `npm run lint`: passed.
- `npm run build`: passed.
- Build output showed static routes `/` and `/_not-found`.

### Deferred Optional Task

`D02-T07` optional Vercel smoke deploy was not attempted because Vercel access and deployment target are not verified. Do not deploy without explicit user approval and environment clarity.

### Next Task

`D03-T01 - Confirm final product domain, categories, and domain-specific feature`

---

## SR-011 - D03-T01: Domain Decision

- Date: 2026-07-14
- Status: completed
- Phase: Day 3 - Domain model and database draft

### Objective

Confirm the final product domain, categories, and domain-specific feature before defining TypeScript domain types, schemas, mock data, or database tables.

### Decision

- Domain: phone accessories.
- Categories: phone cases, screen protectors, chargers, cables and adapters, stands and mounts.
- Domain-specific feature: compatibility filtering by phone model.
- Initial seed target: 16 demo products.

This was accepted by user-delegated selection: the user asked the agent to propose the best suitable option and continue.

### Files Changed

- `docs/domain.md`
- `docs/pre-implementation-review.md`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `caseflow-store/docs/domain.md`
- `caseflow-store/docs/pre-implementation-review.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`

### Commands Executed

```bash
test -f docs/domain.md && test -f caseflow-store/docs/domain.md
rg -n "D03-T01|D03-T02|Confirmed Product Domain|phone accessories|compatibility filtering|R-01|docs/domain.md|Product domain confirmed" .agent docs caseflow-store/.agent caseflow-store/docs
diff -u docs/domain.md caseflow-store/docs/domain.md
git status --short --branch
```

### Actual Result

- Root and app-level domain docs exist.
- Root and app-level domain docs match.
- Roadmap now points to `D03-T02`.
- Risk `R-01` is closed in the current project context.

### Verification

Docs-only task. The smallest meaningful verification was file existence, content search, root/app domain doc diff, and Git status.

### Next Task

`D03-T02 - Define Category, Product, CartItem, Order, and OrderItem`

---

## SR-012 - D03-T02: Domain Types

- Date: 2026-07-14
- Status: completed
- Phase: Day 3 - Domain model and database draft

### Objective

Define the TypeScript domain contracts for categories, products, cart items, orders, and order items.

### Files Changed

- `caseflow-store/src/types/domain.ts`
- `caseflow-store/src/types/.gitkeep`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
sed -n '1,240p' src/types/domain.ts
npm run lint
```

### Actual Result

- Added category slug, compatibility label, and order status constants.
- Added `Category`, `Product`, `CartItem`, `Order`, and `OrderItem`.
- Added `MoneyAmount`, `StockQuantity`, and `Quantity` aliases to make runtime validation constraints explicit for the next task.
- Removed the now-unneeded `src/types/.gitkeep`.

### Verification

- `npm run lint`: passed.

### Next Task

`D03-T03 - Create Zod schemas`

---

## SR-013 - D04-T01: Install Zod

- Date: 2026-07-14
- Status: completed early
- Phase: Day 4 - Product APIs, pulled forward as a prerequisite for Day 3 schemas

### Objective

Install Zod before creating `D03-T03` runtime schemas.

### Reason For Pulling This Task Forward

The roadmap listed `D03-T03 - Create Zod schemas` before `D04-T01 - Install Zod`. Creating schemas without the dependency would leave imports unresolved, so `D04-T01` was completed early and documented.

### Files Changed

- `caseflow-store/package.json`
- `caseflow-store/package-lock.json`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm install zod
rg -n '"zod"|zod@' package.json package-lock.json
npm run lint
git status --short --branch
```

### Actual Result

- `zod` is listed in `caseflow-store/package.json` as `^4.4.3`.
- `npm run lint` passed.
- npm still reports 2 moderate severity vulnerabilities.
- npm still warns that install scripts for `sharp` and `unrs-resolver` are pending approval.

### Verification

- `npm run lint`: passed.

### Next Task

`D03-T03 - Create Zod schemas`

---

## SR-014 - D03-T03: Zod Schemas

- Date: 2026-07-14
- Status: completed
- Phase: Day 3 - Domain model and database draft

### Objective

Create runtime Zod schemas matching the TypeScript domain model.

### Files Changed

- `caseflow-store/src/lib/validation/domain.ts`
- `caseflow-store/src/lib/.gitkeep`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
sed -n '1,280p' src/lib/validation/domain.ts
npm run lint
npx tsc --noEmit
```

### Actual Result

- Added schemas for category, product, cart item, order, and order item.
- Added reusable schemas for slugs, IDs, ISO timestamps, money amounts, stock, quantity, image paths, compatibility labels, customer fields, and order codes.
- Added a line-total refinement so order item snapshots must match `unitPrice * quantity`.
- Removed the now-unneeded `src/lib/.gitkeep`.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.

### Limitation

Schemas are not wired into API route handlers yet. That is intentionally deferred to the API implementation tasks.

### Next Task

`D03-T04 - Create supabase/schema.sql draft`

---

## SR-015 - D03-T04: Supabase Schema Draft

- Date: 2026-07-14
- Status: completed
- Phase: Day 3 - Domain model and database draft

### Objective

Create a draft Supabase PostgreSQL schema aligned with the domain types and Zod schemas.

### Required Reading

- `docs/architecture.md`
- `docs/adr/0001-use-nextjs-modular-monolith.md`
- `docs/adr/0002-use-supabase.md`
- `docs/adr/0003-use-mock-first-development.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`

### Files Changed

- `caseflow-store/supabase/schema.sql`
- `caseflow-store/supabase/.gitkeep`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
sed -n '1,280p' supabase/schema.sql
rg -n "create table|create policy|enable row level security|products_price_nonnegative|order_items_line_total_matches|No cart table|text_array_is_unique|categories_slug_allowed|order_items_order_product_unique" supabase/schema.sql
psql --version || true
supabase --version || true
```

### Actual Result

- Added `profiles`, `categories`, `products`, `orders`, and `order_items`.
- Added constraints for category slugs, product price and stock, compatibility labels, order status, customer fields, and order item line totals.
- Added indexes for active categories, product listing filters, order sorting/status, and order item lookup.
- Added `updated_at` triggers.
- Enabled RLS on all drafted tables.
- Added public read policies for active categories and active products.
- Deliberately did not add a cart table.
- Deliberately did not add direct public order insert/update policies.

### Verification

- File inspection passed.
- Constraint/policy search passed.
- `psql` is not installed.
- Supabase CLI is not installed.

### Limitation

The SQL draft has not been executed against PostgreSQL. D13 must apply and verify it in Supabase before treating it as production-ready.

### Next Task

`D03-T05 - Create 12-20 mock products`

---

## SR-016 - D03-T05: Mock Catalog

- Date: 2026-07-14
- Status: completed
- Phase: Day 3 - Domain model and database draft

### Objective

Create 12-20 mock products for the confirmed phone-accessory domain.

### Files Changed

- `caseflow-store/src/data/mock/catalog.ts`
- `caseflow-store/src/data/.gitkeep`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
rg -n "mockCategories|mockProducts|categoryId:|compatibility:|imageUrl:" src/data/mock/catalog.ts
npx --yes tsx -e "import { mockCategories, mockProducts } from './src/data/mock/catalog.ts'; console.log(JSON.stringify({ categories: mockCategories.length, products: mockProducts.length, featured: mockProducts.filter((product) => product.isFeatured).length }))"
```

### Actual Result

- Added 5 mock categories.
- Added 16 mock products.
- Product distribution matches `docs/domain.md`.
- Mock data is parsed with Zod schemas at module import time.
- Runtime import reported 5 categories, 16 products, and 6 featured products.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Runtime import via `npx --yes tsx`: passed.

### Limitation

Product image paths are planned root-relative paths under `/images/products/`; the actual files do not exist yet. UI work must add or replace real assets before visual acceptance.

### Next Task

`D03-T06 - Create Supabase proof-of-connection plan or project if credentials are available`

---

## SR-017 - D03-T06: Supabase Proof Plan

- Date: 2026-07-14
- Status: completed
- Phase: Day 3 - Domain model and database draft

### Objective

Create a Supabase proof-of-connection plan or create/connect a project if credentials are available.

### Actual Credential State

- `.env.local`: missing.
- `NEXT_PUBLIC_SUPABASE_URL`: missing.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: missing.
- `SUPABASE_SERVICE_ROLE_KEY`: missing.
- Supabase CLI: not installed.
- `psql`: not installed.

### Files Changed

- `docs/supabase-proof-of-connection.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
test -f .env.local && printf '.env.local exists\n' || printf '.env.local missing\n'
bash -lc 'for name in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do if [ -n "${!name}" ]; then printf "%s=set\n" "$name"; else printf "%s=missing\n" "$name"; fi; done'
sed -n '1,120p' .env.example
diff -u docs/supabase-proof-of-connection.md caseflow-store/docs/supabase-proof-of-connection.md
rg -n 'Status|Required Credentials|Proof Steps|Minimum Acceptance Evidence|Current Blockers|SUPABASE|RLS|orders' docs/supabase-proof-of-connection.md caseflow-store/docs/supabase-proof-of-connection.md
git check-ignore -v caseflow-store/.env.local || true
```

### Actual Result

- Created a proof-of-connection plan.
- Did not create a Supabase project.
- Did not attempt a live connection.
- Verified root and app-level plan files match.
- Verified `.env.local` is ignored by Git.

### Limitation

The plan is not proof of a live Supabase connection. A real proof still requires credentials, SQL execution, RLS checks, and command output from a Supabase project.

### Next Task

`D04-T02 - Implement GET /api/products`

---

## SR-018 - D04-T02: Product List API

- Date: 2026-07-14
- Status: completed
- Phase: Day 4 - Product APIs

### Objective

Implement `GET /api/products` against the mock catalog.

### Files Changed

- `caseflow-store/src/app/api/products/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`
- `caseflow-store/src/lib/validation/products.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/caseflow-products.json -w '%{http_code}' 'http://localhost:3000/api/products'
curl -s -o /tmp/caseflow-products-filter.json -w '%{http_code}' 'http://localhost:3000/api/products?category=chargers&compatibility=iPhone%2015&sort=price-asc'
curl -s -o /tmp/caseflow-products-invalid.json -w '%{http_code}' 'http://localhost:3000/api/products?category=bad-category'
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-products.json','utf8')); console.log(JSON.stringify({ total: body.data.length, error: body.error, first: body.data[0]?.slug }))"
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-products-filter.json','utf8')); console.log(JSON.stringify({ total: body.data.length, slugs: body.data.map((product)=>product.slug), prices: body.data.map((product)=>product.price) }))"
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-products-invalid.json','utf8')); console.log(JSON.stringify(body))"
```

### Actual Result

- `GET /api/products` returns 16 products with `{ data, error }`.
- Category, compatibility, search, featured, and sort query validation is implemented.
- Invalid query values return `400` with `VALIDATION_ERROR`.
- Compatibility filtering treats `Universal` products as compatible with specific phone-model filters.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `GET /api/products`: 200, 16 products.
- Charger + iPhone 15 filter: 200, 3 products sorted by ascending price.
- Invalid category filter: 400 with `VALIDATION_ERROR`.

### Limitation

The endpoint uses mock data. Supabase integration remains deferred.

### Next Task

`D04-T03 - Implement GET /api/products/[slug]`

---

## SR-019 - D04-T03: Product Detail API

- Date: 2026-07-14
- Status: completed
- Phase: Day 4 - Product APIs

### Objective

Implement `GET /api/products/[slug]` against the mock catalog.

### Files Changed

- `caseflow-store/src/app/api/products/[slug]/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/caseflow-product-detail.json -w '%{http_code}' 'http://localhost:3000/api/products/aeroguard-magsafe-case'
curl -s -o /tmp/caseflow-product-missing.json -w '%{http_code}' 'http://localhost:3000/api/products/not-a-real-product'
curl -s -o /tmp/caseflow-product-invalid.json -w '%{http_code}' 'http://localhost:3000/api/products/Bad_Slug'
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-product-detail.json','utf8')); console.log(JSON.stringify({ slug: body.data?.slug, name: body.data?.name, error: body.error }))"
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-product-missing.json','utf8')); console.log(JSON.stringify(body))"
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-product-invalid.json','utf8')); console.log(JSON.stringify(body))"
```

### Actual Result

- Added a dynamic product detail route.
- Added active product lookup by slug to the mock catalog repository.
- Valid product slug returns the product.
- Missing product returns `PRODUCT_NOT_FOUND`.
- Invalid slug format returns `VALIDATION_ERROR`.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `GET /api/products/aeroguard-magsafe-case`: 200.
- `GET /api/products/not-a-real-product`: 404.
- `GET /api/products/Bad_Slug`: 400.

### Limitation

The endpoint uses mock data. Supabase integration remains deferred.

### Next Task

`D04-T04 - Implement GET /api/categories`

---

## SR-020 - D04-T04: Categories API

- Date: 2026-07-14
- Status: completed
- Phase: Day 4 - Product APIs

### Objective

Implement `GET /api/categories` against the mock catalog.

### Files Changed

- `caseflow-store/src/app/api/categories/route.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
curl -s -o /tmp/caseflow-categories.json -w '%{http_code}' 'http://localhost:3000/api/categories'
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/caseflow-categories.json','utf8')); console.log(JSON.stringify({ total: body.data.length, slugs: body.data.map((category)=>category.slug), error: body.error }))"
```

### Actual Result

- Added categories route.
- Added active category listing to the mock catalog repository.
- Endpoint returns active categories sorted by `sortOrder`, then name.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `GET /api/categories`: 200, 5 categories.

### Limitation

The endpoint uses mock data. Supabase integration remains deferred.

### Next Task

`D04-T05 - Implement POST /api/cart/validate`

---

## SR-021 - D04-T05: Cart Validation API

- Date: 2026-07-14
- Status: completed
- Phase: Day 4 - Product APIs

### Objective

Implement `POST /api/cart/validate` against the mock catalog.

### Files Changed

- `caseflow-store/src/app/api/cart/validate/route.ts`
- `caseflow-store/src/lib/validation/cart.ts`
- `caseflow-store/src/lib/repositories/mock-catalog.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/caseflow-cart-valid.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":2},{"productId":"10000000-0000-4000-8000-000000000008","quantity":1}]}'
curl -s -o /tmp/caseflow-cart-duplicate.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":2},{"productId":"10000000-0000-4000-8000-000000000001","quantity":3}]}'
curl -s -o /tmp/caseflow-cart-stock.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000016","quantity":9}]}'
curl -s -o /tmp/caseflow-cart-invalid.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":0}]}'
curl -s -o /tmp/caseflow-cart-missing.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"missing-product-id","quantity":1}]}'
curl -s -o /tmp/caseflow-cart-empty.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[]}'
```

### Actual Result

- Valid cart returned recalculated lines and subtotal.
- Duplicate product IDs were aggregated before subtotal calculation.
- Missing product returned `PRODUCT_NOT_FOUND`.
- Out-of-stock request returned `OUT_OF_STOCK`.
- Invalid quantity returned `VALIDATION_ERROR`.
- Empty cart returned 200 with subtotal 0.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Valid cart: 200.
- Duplicate product IDs: 200, aggregated quantity.
- Missing product: 404.
- Out of stock: 409.
- Invalid quantity: 400.
- Empty cart: 200.

### Limitation

This validates cart state for UI refresh and pre-checkout. Final order creation must still re-read products and reject empty or invalid checkout payloads.

### Next Task

`D04-T06 - Test APIs with curl`

---

## SR-022 - D04-T06: Day 4 API Curl Verification

- Date: 2026-07-14
- Status: completed
- Phase: Day 4 - Product APIs

### Objective

Test Day 4 APIs with curl and run end-of-day checks.

### Commands Executed

```bash
curl -s -o /tmp/d04-products.json -w '%{http_code}' 'http://localhost:3000/api/products'
curl -s -o /tmp/d04-products-filter.json -w '%{http_code}' 'http://localhost:3000/api/products?category=chargers&compatibility=iPhone%2015&sort=price-asc'
curl -s -o /tmp/d04-products-invalid.json -w '%{http_code}' 'http://localhost:3000/api/products?category=bad-category'
curl -s -o /tmp/d04-product-detail.json -w '%{http_code}' 'http://localhost:3000/api/products/aeroguard-magsafe-case'
curl -s -o /tmp/d04-product-missing.json -w '%{http_code}' 'http://localhost:3000/api/products/not-a-real-product'
curl -s -o /tmp/d04-categories.json -w '%{http_code}' 'http://localhost:3000/api/categories'
curl -s -o /tmp/d04-cart-valid.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":2},{"productId":"10000000-0000-4000-8000-000000000008","quantity":1}]}'
curl -s -o /tmp/d04-cart-stock.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000016","quantity":9}]}'
curl -s -o /tmp/d04-cart-invalid-json.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{bad-json'
curl -s -o /tmp/d04-cart-invalid-payload.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":0}]}'
node -e "const fs=require('fs'); const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8')); console.log(JSON.stringify({ products: read('/tmp/d04-products.json').data.length, filtered: read('/tmp/d04-products-filter.json').data.map((p)=>p.slug), invalidProducts: read('/tmp/d04-products-invalid.json').error.code, productDetail: read('/tmp/d04-product-detail.json').data.slug, missingProduct: read('/tmp/d04-product-missing.json').error.code, categories: read('/tmp/d04-categories.json').data.length, cartSubtotal: read('/tmp/d04-cart-valid.json').data.subtotal, cartStockError: read('/tmp/d04-cart-stock.json').error.code, cartJsonError: read('/tmp/d04-cart-invalid-json.json').error.code, cartPayloadError: read('/tmp/d04-cart-invalid-payload.json').error.code }))"
npm run lint
npm run build
```

### Actual Result

- Product list, filters, detail, categories, and cart validation endpoints responded correctly.
- Failure paths returned expected error codes.
- End-of-day lint/build passed.

### Verification Summary

- `GET /api/products`: 200, 16 products.
- Filtered product list: 200, 3 products.
- Invalid product query: 400, `VALIDATION_ERROR`.
- Product detail: 200.
- Missing product: 404, `PRODUCT_NOT_FOUND`.
- Categories: 200, 5 categories.
- Valid cart validation: 200, subtotal 1017000.
- Out-of-stock cart: 409, `OUT_OF_STOCK`.
- Invalid JSON: 400, `VALIDATION_ERROR`.
- Invalid cart payload: 400, `VALIDATION_ERROR`.
- `npm run lint`: passed.
- `npm run build`: passed.

### Next Task

`D05-T01 - Implement POST /api/orders against mock repository`

---

## SR-023 - D05-T01: Mock Order Creation API

- Date: 2026-07-14
- Status: completed
- Phase: Day 5 - Orders API and preview API deploy

### Objective

Implement `POST /api/orders` against the mock repository.

### Files Changed

- `caseflow-store/src/app/api/orders/route.ts`
- `caseflow-store/src/lib/validation/orders.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/d05-order-valid.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Van Truong","customerEmail":"van@example.com","customerPhone":"+84 912 345 678","shippingAddress":"123 Demo Street, Ho Chi Minh City","subtotal":1,"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":2},{"productId":"10000000-0000-4000-8000-000000000008","quantity":1}]}'
curl -s -o /tmp/d05-order-empty.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Van Truong","customerEmail":"van@example.com","customerPhone":"+84 912 345 678","shippingAddress":"123 Demo Street, Ho Chi Minh City","items":[]}'
curl -s -o /tmp/d05-order-stock.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Van Truong","customerEmail":"van@example.com","customerPhone":"+84 912 345 678","shippingAddress":"123 Demo Street, Ho Chi Minh City","items":[{"productId":"10000000-0000-4000-8000-000000000016","quantity":9}]}'
curl -s -o /tmp/d05-order-invalid-json.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{bad-json'
node -e "const fs=require('fs'); const body=JSON.parse(fs.readFileSync('/tmp/d05-order-valid.json','utf8')); console.log(JSON.stringify({ orderCode: body.data.order.orderCode, status: body.data.order.status, subtotal: body.data.order.subtotal, itemCount: body.data.items.length, lineTotals: body.data.items.map((item)=>item.lineTotal), error: body.error }))"
```

### Actual Result

- Added `POST /api/orders`.
- Added guest order request validation.
- Added mock in-memory order creation.
- Server ignores client-supplied subtotal and recalculates totals from current product data.
- Orders are created with status `pending` and order item snapshots.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Valid order: 201, server subtotal 1017000 despite client sending `subtotal: 1`.
- Empty order: 400.
- Out-of-stock order: 409.
- Invalid JSON: 400.

### Limitations

- Mock orders are stored in module-level memory only.
- Mock order creation does not decrement stock.
- Supabase integration must use a transaction/RPC or document stock decrement as an MVP limitation.

### Next Task

`D05-T02 - Implement GET /api/admin/orders`

---

## SR-024 - D05-T02: Admin Order List API

- Date: 2026-07-14
- Status: completed
- Phase: Day 5 - Orders API and preview API deploy

### Objective

Implement `GET /api/admin/orders` with server-side admin authorization.

### Files Changed

- `caseflow-store/src/app/api/admin/orders/route.ts`
- `caseflow-store/src/lib/auth/admin.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`
- `caseflow-store/.env.example`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/d05-admin-orders-unauthorized.json -w '%{http_code}' 'http://localhost:3000/api/admin/orders'
curl -s -o /tmp/d05-admin-create-order.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Admin Check","customerEmail":"admin-check@example.com","customerPhone":"+84 900 000 001","shippingAddress":"456 Admin Test Street","items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":1}]}'
curl -s -o /tmp/d05-admin-orders-authorized.json -w '%{http_code}' 'http://localhost:3000/api/admin/orders' -H 'x-caseflow-admin-token: dev-admin-token'
```

### Actual Result

- Added server-side mock admin guard.
- Added admin order list route.
- Added `CASEFLOW_ADMIN_API_TOKEN` placeholder to `.env.example`.
- Unauthorized requests are rejected before reading orders.
- Authorized local-dev request returns mock orders.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- No token: 401, `UNAUTHORIZED`.
- Dev token after order creation: 200, 1 pending order returned.

### Limitation

This is temporary mock admin authorization. Supabase Auth and RLS remain required before production.

### Next Task

`D05-T03 - Implement PATCH /api/admin/orders/[id]`

---

## SR-025 - D05-T03: Admin Order Status API

- Date: 2026-07-14
- Status: completed
- Phase: Day 5 - Orders API and preview API deploy

### Objective

Implement `PATCH /api/admin/orders/[id]` with server-side admin authorization.

### Files Changed

- `caseflow-store/src/app/api/admin/orders/[id]/route.ts`
- `caseflow-store/src/lib/validation/orders.ts`
- `caseflow-store/src/lib/repositories/mock-orders.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/d05-patch-create-order.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Patch Check","customerEmail":"patch-check@example.com","customerPhone":"+84 900 000 002","shippingAddress":"789 Patch Test Street","items":[{"productId":"10000000-0000-4000-8000-000000000008","quantity":1}]}'
curl -s -o /tmp/d05-patch-valid.json -w '%{http_code}' -X PATCH 'http://localhost:3000/api/admin/orders/73aaf1fa-ca9f-4537-84bc-d68641622207' -H 'content-type: application/json' -H 'x-caseflow-admin-token: dev-admin-token' --data '{"status":"confirmed"}'
curl -s -o /tmp/d05-patch-unauthorized.json -w '%{http_code}' -X PATCH 'http://localhost:3000/api/admin/orders/73aaf1fa-ca9f-4537-84bc-d68641622207' -H 'content-type: application/json' --data '{"status":"shipping"}'
curl -s -o /tmp/d05-patch-invalid-status.json -w '%{http_code}' -X PATCH 'http://localhost:3000/api/admin/orders/73aaf1fa-ca9f-4537-84bc-d68641622207' -H 'content-type: application/json' -H 'x-caseflow-admin-token: dev-admin-token' --data '{"status":"paid"}'
curl -s -o /tmp/d05-patch-missing.json -w '%{http_code}' -X PATCH 'http://localhost:3000/api/admin/orders/missing-order-id' -H 'content-type: application/json' -H 'x-caseflow-admin-token: dev-admin-token' --data '{"status":"confirmed"}'
```

### Actual Result

- Added guarded admin order status update route.
- Added order status update schema.
- Added mock repository update function.
- Status updates mutate only status and server-side updatedAt.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Valid admin PATCH to `confirmed`: 200.
- No token: 401.
- Invalid status: 400.
- Missing order: 404.

### Limitation

Status transition rules are not enforced yet; any known status enum value is currently accepted for mock admin updates.

### Next Task

`D05-T04 - Standardize { data, error, meta } response shape`

---

## SR-026 - D05-T04: API Response Shape

- Date: 2026-07-14
- Status: completed
- Phase: Day 5 - Orders API and preview API deploy

### Objective

Standardize API responses as `{ data, error, meta }`.

### Files Changed

- `caseflow-store/src/lib/api/response.ts`
- `caseflow-store/src/app/api/products/route.ts`
- `caseflow-store/src/app/api/products/[slug]/route.ts`
- `caseflow-store/src/app/api/categories/route.ts`
- `caseflow-store/src/app/api/cart/validate/route.ts`
- `caseflow-store/src/app/api/orders/route.ts`
- `caseflow-store/src/app/api/admin/orders/route.ts`
- `caseflow-store/src/app/api/admin/orders/[id]/route.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -s -o /tmp/d05-meta-products.json -w '%{http_code}' 'http://localhost:3000/api/products'
curl -s -o /tmp/d05-meta-detail.json -w '%{http_code}' 'http://localhost:3000/api/products/aeroguard-magsafe-case'
curl -s -o /tmp/d05-meta-error.json -w '%{http_code}' 'http://localhost:3000/api/products?category=bad-category'
curl -s -o /tmp/d05-meta-order.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Meta Check","customerEmail":"meta-check@example.com","customerPhone":"+84 900 000 003","shippingAddress":"Meta Test Street","items":[{"productId":"10000000-0000-4000-8000-000000000008","quantity":1}]}'
node -e "const fs=require('fs'); const files=['/tmp/d05-meta-products.json','/tmp/d05-meta-detail.json','/tmp/d05-meta-error.json','/tmp/d05-meta-order.json']; const out=files.map((file)=>{ const body=JSON.parse(fs.readFileSync(file,'utf8')); return { file: file.split('/').pop(), keys: Object.keys(body), meta: body.meta, error: body.error?.code ?? null, dataType: Array.isArray(body.data) ? 'array' : body.data === null ? 'null' : 'object' }; }); console.log(JSON.stringify(out))"
```

### Actual Result

- Added response helper functions.
- Refactored all current API routes to use the shared response helper.
- List endpoints return `meta.count`.
- Non-list success responses and error responses return `meta: null`.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Product list, product detail, product error, and order creation responses all contained `data`, `error`, and `meta`.

### Next Task

`D05-T05 - Verify server never trusts client price/subtotal`

---

## SR-027 - D05-T05: Price And Subtotal Tampering Verification

- Date: 2026-07-14
- Status: completed
- Phase: Day 5 - Orders API and preview API deploy

### Objective

Verify the server never trusts client price, line total, subtotal, or item snapshots.

### Commands Executed

```bash
curl -s -o /tmp/d05-tamper-cart.json -w '%{http_code}' -X POST 'http://localhost:3000/api/cart/validate' -H 'content-type: application/json' --data '{"subtotal":1,"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":2,"price":1,"lineTotal":2}]}'
curl -s -o /tmp/d05-tamper-order.json -w '%{http_code}' -X POST 'http://localhost:3000/api/orders' -H 'content-type: application/json' --data '{"customerName":"Tamper Check","customerEmail":"tamper-check@example.com","customerPhone":"+84 900 000 004","shippingAddress":"Tamper Test Street","subtotal":1,"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":2,"price":1,"lineTotal":2}]}'
curl -s -o /tmp/d05-tamper-admin-patch.json -w '%{http_code}' -X PATCH 'http://localhost:3000/api/admin/orders/1d26f1a3-40f5-48dc-9857-df18d66bbc02' -H 'content-type: application/json' -H 'x-caseflow-admin-token: dev-admin-token' --data '{"status":"shipping","subtotal":1,"items":[]}'
```

### Actual Result

- Tampered cart request returned server subtotal 658000, unit price 329000, and line total 658000.
- Tampered order request returned server subtotal 658000, unit price 329000, and line total 658000.
- Tampered admin PATCH changed only status to `shipping`; subtotal stayed 658000 and item count stayed 1.

### Verification

- Cart tampering check: passed.
- Order tampering check: passed.
- Admin status tampering check: passed.

### Next Task

`D05-T06 - Preview deploy mock API if Vercel is ready`

---

## SR-028 - D05-T06: Preview Deploy Readiness

- Date: 2026-07-14
- Status: deferred
- Phase: Day 5 - Orders API and preview API deploy

### Objective

Preview deploy the mock API if Vercel is ready.

### Commands Executed

```bash
vercel --version || true
test -d .vercel && find .vercel -maxdepth 2 -type f -print || printf '.vercel missing\n'
bash -lc 'for name in VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID; do if [ -n "${!name}" ]; then printf "%s=set\n" "$name"; else printf "%s=missing\n" "$name"; fi; done'
git status --short --branch
```

### Actual Result

- `vercel`: command not found.
- `.vercel`: missing.
- `VERCEL_TOKEN`: missing.
- `VERCEL_ORG_ID`: missing.
- `VERCEL_PROJECT_ID`: missing.
- Deploy target and approval are not confirmed.

### Decision

Preview deploy was not attempted. This is an external readiness blocker, not a local implementation blocker.

### Next Task

`D06-T01 - Map DESIGN.md tokens into global CSS/Tailwind`

---

## SR-029 - D06-T01: Design Token Mapping

- Date: 2026-07-14
- Status: completed
- Phase: Day 6 - Design system and layout

### Objective

Map `DESIGN.md` tokens into global CSS and Tailwind theme variables.

### Required Reading

- `DESIGN.md`

### Files Changed

- `caseflow-store/src/app/globals.css`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
sed -n '1,260p' DESIGN.md
sed -n '1,260p' src/app/globals.css
npm run lint
npm run build
rg -n -- '--case-|--color-text|--radius-|--spacing-case-|--text-heading|focus-visible|::selection' src/app/globals.css
```

### Actual Result

- Added `--case-*` root variables for radius, spacing, and typography.
- Exposed design tokens through Tailwind v4 `@theme inline`.
- Added global box sizing, minimum html height, selection color, and focus-visible outline.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Token search found expected CSS variables.

### Next Task

`D06-T02 - Create Button, Input, Badge, Container, Card, Skeleton, and ErrorMessage`

---

## SR-030 - D06-T02: UI Component Primitives

- Date: 2026-07-15
- Status: completed
- Phase: Day 6 - Design system and layout

### Objective

Create shared Button, Input, Badge, Container, Card, Skeleton, and ErrorMessage primitives.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

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
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,1400 --full-page http://localhost:3001/ui-preview .agent/artifacts/d06-t02-ui-preview-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,1800 --full-page http://localhost:3001/ui-preview .agent/artifacts/d06-t02-ui-preview-375.png
```

### Actual Result

- Added shared UI primitives with token-based styling and responsive-safe `min-w-0` treatment.
- Added `cn` helper to avoid adding a classnames dependency.
- Added `/ui-preview` as a noindex QA route to visually inspect primitives.
- First mobile screenshot exposed horizontal clipping when captured through raw Chrome headless; Playwright viewport screenshots confirmed the corrected layout at 375px.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d06-t02-ui-preview-1440.png`
- `caseflow-store/.agent/artifacts/d06-t02-ui-preview-375.png`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Playwright screenshots at 1440px and 375px passed visual review.

### Limitation

- `/ui-preview` is a QA route, not a storefront feature. It should be kept intentionally, hidden behind an environment check, or removed before production acceptance.

### Next Task

`D06-T03 - Create Header, Footer, and mobile navigation`

---

## SR-031 - D06-T03: Header, Footer, And Mobile Navigation

- Date: 2026-07-15
- Status: completed
- Phase: Day 6 - Design system and layout

### Objective

Create the shared storefront header, footer, and mobile navigation shell.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/components/layout/navigation.ts`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/site-footer.tsx`
- `caseflow-store/src/components/layout/index.ts`
- `caseflow-store/src/app/layout.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,1200 --full-page http://localhost:3001/ .agent/artifacts/d06-t03-layout-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,1200 --full-page http://localhost:3001/ .agent/artifacts/d06-t03-layout-375-closed.png
python3 - <<'PY'
# CDP script clicked the mobile menu button and captured d06-t03-layout-375-menu.png.
PY
```

### Actual Result

- Added a token-aligned `SiteHeader`, `SiteFooter`, `MobileNavigation`, and shared navigation config.
- Wired the layout shell into `src/app/layout.tsx`.
- Mobile menu opens via a client-side toggle with `aria-expanded`, `aria-controls`, and explicit accessible labels.
- Desktop cart action was changed from a dead button to a `/#cart` anchor placeholder.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d06-t03-layout-1440.png`
- `caseflow-store/.agent/artifacts/d06-t03-layout-375-closed.png`
- `caseflow-store/.agent/artifacts/d06-t03-layout-375-menu.png`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Desktop, mobile closed, and mobile menu-open screenshots passed visual review.

### Limitation

- Header cart links to `/#cart` until the Day 9 cart drawer exists. This avoids a dead button and avoids a 404 route, but it is still a placeholder.

### Next Task

`D06-T04 - Verify 375px and 1440px layouts`

---

## SR-032 - D06-T04: 375px And 1440px Layout Verification

- Date: 2026-07-15
- Status: completed
- Phase: Day 6 - Design system and layout

### Objective

Verify the current Day 6 layout at 375px and 1440px.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run start -- -p 3001
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,1200 --full-page http://localhost:3001/ .agent/artifacts/d06-t04-home-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,1200 --full-page http://localhost:3001/ .agent/artifacts/d06-t04-home-375.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,1400 --full-page http://localhost:3001/ui-preview .agent/artifacts/d06-t04-ui-preview-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,1800 --full-page http://localhost:3001/ui-preview .agent/artifacts/d06-t04-ui-preview-375.png
python3 - <<'PY'
# CDP script checked scrollWidth/overflow and captured d06-t04-home-375-menu.png.
PY
```

### Actual Result

- Verified `/`, `/ui-preview`, and mobile menu-open state.
- DOM checks reported no horizontal overflow.
- Header and footer were present on checked pages.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d06-t04-home-1440.png`
- `caseflow-store/.agent/artifacts/d06-t04-home-375.png`
- `caseflow-store/.agent/artifacts/d06-t04-home-375-menu.png`
- `caseflow-store/.agent/artifacts/d06-t04-ui-preview-1440.png`
- `caseflow-store/.agent/artifacts/d06-t04-ui-preview-375.png`
- `caseflow-store/.agent/artifacts/d06-t04-layout-check.json`

### Verification

- `home-1440`: passed.
- `home-375`: passed.
- `home-375-menu`: passed.
- `ui-preview-1440`: passed.
- `ui-preview-375`: passed.

### Limitation

- This is not final responsive acceptance. Day 12 must repeat responsive and accessibility checks after product, cart, checkout, and admin UI exist.

### Next Task

`D07-T01 - Build homepage`

---

## SR-033 - D07-T01: Storefront Homepage

- Date: 2026-07-15
- Status: completed
- Phase: Day 7 - Homepage and product listing

### Objective

Replace the implementation status page with a real storefront homepage.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/lib/format/currency.ts`
- `caseflow-store/src/components/layout/site-footer.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start -- -p 3001
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,1600 --full-page http://localhost:3001/ .agent/artifacts/d07-t01-homepage-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,2200 --full-page http://localhost:3001/ .agent/artifacts/d07-t01-homepage-375.png
python3 - <<'PY'
# CDP script checked homepage sections and horizontal overflow at 1440px and 375px.
PY
```

### Actual Result

- Replaced the status page with a customer-facing storefront homepage.
- Added hero, category shortcuts, featured preview, compatibility labels, and support cards.
- Added `formatVnd` helper for VND display.
- Revised visible copy to avoid internal implementation language.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d07-t01-homepage-1440.png`
- `caseflow-store/.agent/artifacts/d07-t01-homepage-375.png`
- `caseflow-store/.agent/artifacts/d07-t01-homepage-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- DOM overflow checks at 1440px and 375px: passed.

### Limitation

- Product visuals are CSS placeholders. Real product images are still missing and should be addressed before final portfolio acceptance.

### Next Task

`D07-T02 - Build product grid`

---

## SR-034 - D07-T02: Product Grid

- Date: 2026-07-15
- Status: completed
- Phase: Day 7 - Homepage and product listing

### Objective

Build a reusable product grid and render the current mock catalog.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/features/products/product-visual.tsx`
- `caseflow-store/src/features/products/product-card.tsx`
- `caseflow-store/src/features/products/product-grid.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start -- -p 3001
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,2600 --full-page http://localhost:3001/ .agent/artifacts/d07-t02-product-grid-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,3600 --full-page http://localhost:3001/ .agent/artifacts/d07-t02-product-grid-375.png
curl -s http://localhost:3001/ | rg -o 'data-product-card=' | wc -l
python3 - <<'PY'
# CDP script checked product-card count and horizontal overflow at 1440px and 375px.
PY
```

### Actual Result

- Created reusable product visual, product card, and product grid components.
- Rendered all 16 mock products in the homepage product section.
- Added `data-product-card` selectors for reliable product count checks.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d07-t02-product-grid-1440.png`
- `caseflow-store/.agent/artifacts/d07-t02-product-grid-375.png`
- `caseflow-store/.agent/artifacts/d07-t02-product-grid-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Product card count: 16.
- DOM overflow checks at 1440px and 375px: passed.

### Limitation

- Product cards are not linked to detail pages yet because `D08-T01` owns `/products/[slug]`.

### Next Task

`D07-T03 - Add category filter`

---

## SR-035 - D07-T03: Category Filter

- Date: 2026-07-15
- Status: completed
- Phase: Day 7 - Homepage and product listing

### Objective

Add a category filter to the homepage product grid.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/features/products/product-catalog.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start -- -p 3001
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,2600 --full-page http://localhost:3001/ .agent/artifacts/d07-t03-category-filter-1440-all.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,3600 --full-page http://localhost:3001/ .agent/artifacts/d07-t03-category-filter-375-all.png
python3 - <<'PY'
# CDP script clicked every category filter, checked counts/overflow, and captured chargers desktop/mobile screenshots.
PY
```

### Actual Result

- Added `ProductCatalog` as a client component for category filter state.
- Added accessible filter buttons with `aria-pressed`, visible counts, and stable `data-category-filter` selectors.
- Product grid now updates to show only products in the selected category.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d07-t03-category-filter-1440-all.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-375-all.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-1440-chargers.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-375-chargers.png`
- `caseflow-store/.agent/artifacts/d07-t03-category-filter-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- All category counts matched expected values.
- Desktop/mobile selected-filter screenshots passed visual review.
- DOM overflow checks passed.

### Limitation

- Filter state is client-side only and is not synced to URL query parameters. Search and sorting remain for `D07-T04`.

### Next Task

`D07-T04 - Add search and basic sorting`

---

## SR-036 - D07-T04: Search And Basic Sorting

- Date: 2026-07-15
- Status: completed
- Phase: Day 7 - Homepage and product listing

### Objective

Add product search and basic sorting to the homepage product catalog.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/features/products/product-catalog.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start -- -p 3001
node - <<'NODE'
# CDP script verified all sort modes, search, search plus category, clear search, screenshots, and visible overflow.
NODE
```

### Actual Result

- Added visible `Search products` input to `ProductCatalog`.
- Added basic sort control with `Newest`, `Price: low to high`, `Price: high to low`, and `Name: A to Z`.
- Search matches product name, description, and slug.
- Product catalog now composes search, category filter, and sorting in a single client-side flow.
- Category counts update after search, and filter buttons now expose explicit `aria-label` plus `data-category-filter-count`.
- Clear search action appears only when there is a query.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d07-t04-search-sort-1440-default.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-375-default.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-1440-charger-price-desc.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-375-charger-price-desc.png`
- `caseflow-store/.agent/artifacts/d07-t04-search-sort-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- CDP interaction checks passed for all sort modes.
- Search for `charger` returned 2 products and price-desc sorted `GaN Duo 65W Charger` before `VoltMini 30W USB-C Charger`.
- Search for `glass` combined with `Screen protectors` returned the expected 2 products.
- Clear search restored all 16 products.
- Visible horizontal overflow checks passed at 1440px and 375px.

### Limitation

- Search/category/sort state is client-side only and is not synced to URL query parameters.
- Loading, empty, and error states remain intentionally out of scope for this task and belong to `D07-T05`.

### Next Task

`D07-T05 - Add loading, empty, and error states`

---

## SR-037 - D07-T05: Loading, Empty, And Error States

- Date: 2026-07-15
- Status: completed
- Phase: Day 7 - Homepage and product listing

### Objective

Add loading, empty, and error states to the product catalog.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/features/products/product-catalog.tsx`
- `caseflow-store/src/features/products/product-catalog-states.tsx`
- `caseflow-store/src/features/products/index.ts`
- `caseflow-store/src/app/catalog-state-preview/page.tsx`
- `caseflow-store/src/app/catalog-state-preview/catalog-state-preview.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start -- -p 3001
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,2600 --full-page --wait-for-selector '[data-product-empty-state]' 'http://localhost:3001/catalog-state-preview?state=empty' .agent/artifacts/d07-t05-preview-empty-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,3600 --full-page --wait-for-selector '[data-product-empty-state]' 'http://localhost:3001/catalog-state-preview?state=empty' .agent/artifacts/d07-t05-preview-empty-375.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,2600 --full-page --wait-for-selector '[data-product-loading-state]' 'http://localhost:3001/catalog-state-preview?state=loading' .agent/artifacts/d07-t05-preview-loading-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,3600 --full-page --wait-for-selector '[data-product-loading-state]' 'http://localhost:3001/catalog-state-preview?state=loading' .agent/artifacts/d07-t05-preview-loading-375.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,2600 --full-page --wait-for-selector '[data-product-error-state]' 'http://localhost:3001/catalog-state-preview?state=error' .agent/artifacts/d07-t05-preview-error-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,3600 --full-page --wait-for-selector '[data-product-error-state]' 'http://localhost:3001/catalog-state-preview?state=error' .agent/artifacts/d07-t05-preview-error-375.png
node - <<'NODE'
# HTML selector smoke checked homepage product cards and preview state markers.
NODE
git diff --check
```

### Actual Result

- Added reusable product catalog state components for grid skeleton, empty state, and error state.
- Product catalog now renders an empty state when search/category filters produce zero products.
- Empty state has a `Reset filters` action that clears search, category, and sort state.
- Product catalog accepts `isLoading` and `errorMessage` props for future API-backed catalog states.
- Loading/error states disable search, sort, and category controls.
- Added noindex `/catalog-state-preview?state=empty|loading|error` route for visual QA.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d07-t05-preview-empty-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-empty-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-loading-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-loading-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-error-1440.png`
- `caseflow-store/.agent/artifacts/d07-t05-preview-error-375.png`
- `caseflow-store/.agent/artifacts/d07-t05-catalog-states-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Playwright screenshots captured empty, loading, and error states at 1440px and 375px.
- Visual review found no obvious overlap or horizontal overflow in checked states.
- HTML selector check confirmed homepage still renders 16 product cards.
- HTML selector check confirmed empty, loading, and error preview URLs each render exactly one expected state marker.

### Limitation

- Loading and error states are prepared UI states, not live network states yet. Homepage still reads mock data directly.

### Next Task

`D08-T01 - Build /products/[slug]`

---

## SR-038 - D08-T01: Product Detail Route

- Date: 2026-07-15
- Status: completed
- Phase: Day 8 - Product detail

### Objective

Build `/products/[slug]` and link product cards to the detail route.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/products/product-card.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
node - <<'NODE'
# HTTP checks verified homepage, detail page, missing slug, link count, and detail marker.
NODE
npx --yes playwright@latest screenshot --channel chrome --viewport-size=1440,1800 --full-page --wait-for-selector '[data-product-detail="aeroguard-magsafe-case"]' http://localhost:3001/products/aeroguard-magsafe-case .agent/artifacts/d08-t01-product-detail-route-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,1600 --full-page --wait-for-selector '[data-product-detail="aeroguard-magsafe-case"]' http://localhost:3001/products/aeroguard-magsafe-case .agent/artifacts/d08-t01-product-detail-route-375.png
```

### Actual Result

- Added `/products/[slug]` dynamic route backed by the mock catalog.
- Added `generateStaticParams` so the 16 active mock products are prerendered.
- Added product-specific metadata.
- Unknown product slugs return 404 through `notFound()`.
- Product cards now link to `/products/{slug}` while retaining `data-product-card` selectors.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-1440.png`
- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-375.png`
- `caseflow-store/.agent/artifacts/d08-t01-product-detail-route-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed; build output listed `/products/[slug]` as SSG with 16 generated product paths.
- HTTP checks confirmed homepage 200, sample detail 200, missing slug 404, 16 product-card links, and one sample detail marker.
- Desktop/mobile screenshots passed visual review.

### Limitation

- This task establishes the route and link path only. Full detail content belongs to `D08-T02`; quantity and add-to-cart feedback belong to `D08-T03`.

### Next Task

`D08-T02 - Show image, price, stock, compatibility, and description`

---

## SR-039 - D08-T02: Product Detail Content

- Date: 2026-07-15
- Status: completed
- Phase: Day 8 - Product detail

### Objective

Show image, price, stock, compatibility, and description on product detail pages.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`

### Files Changed

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
node - <<'NODE'
# HTML content checks verified image, price, stock, description, and compatibility markers.
NODE
npx --yes playwright@latest screenshot --channel chrome --timeout 15000 --viewport-size=1440,1900 --full-page --wait-for-selector '[data-product-detail-price]' http://localhost:3001/products/aeroguard-magsafe-case .agent/artifacts/d08-t02-product-detail-content-1440.png
npx --yes playwright@latest screenshot --channel chrome --viewport-size=375,1800 --full-page --wait-for-selector '[data-product-detail-price]' http://localhost:3001/products/aeroguard-magsafe-case .agent/artifacts/d08-t02-product-detail-content-375.png
```

### Actual Result

- Product detail pages now show a stable product visual, product description, formatted VND price, stock quantity, compatibility labels, category badge, stock badge, and category context.
- Added reliable detail selectors for image, description, price, stock, and compatibility labels.
- Preserved the D08-T01 route behavior and SSG product paths.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-1440.png`
- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-375.png`
- `caseflow-store/.agent/artifacts/d08-t02-product-detail-content-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and preserved 16 generated SSG product paths.
- HTML content checks confirmed the sample product contains image, price, stock, description, and compatibility markers.
- Desktop/mobile screenshots passed visual review.

### Limitation

- Product visuals remain CSS placeholders because real product image assets are not present.
- Quantity selection and add-to-cart feedback remain for `D08-T03`.

### Next Task

`D08-T03 - Add quantity selector and add-to-cart feedback`

---

## SR-040 - D08-T03: Quantity Selector And Add-To-Cart Feedback

- Date: 2026-07-15
- Status: completed
- Phase: Day 8 - Product detail

### Objective

Add a quantity selector and add-to-cart feedback to product detail pages.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`
- `caseflow-store/src/features/products/index.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
curl -s http://localhost:3001/products/aeroguard-magsafe-case | rg -o 'data-product-purchase-controls|data-quantity-input|data-add-to-cart-button|Available stock: 18'
npx --yes playwright@latest screenshot --channel chrome --timeout 15000 --viewport-size=1440,1900 --full-page --wait-for-selector '[data-product-purchase-controls]' http://localhost:3001/products/aeroguard-magsafe-case .agent/artifacts/d08-t03-product-purchase-controls-1440.png
npx --yes playwright@latest screenshot --channel chrome --timeout 15000 --viewport-size=375,1900 --full-page --wait-for-selector '[data-product-purchase-controls]' http://localhost:3001/products/aeroguard-magsafe-case .agent/artifacts/d08-t03-product-purchase-controls-375.png
node --input-type=module <<'NODE'
# Chrome DevTools interaction check clicked quantity increment twice and Add to cart.
NODE
```

### Actual Result

- Added `ProductPurchaseControls` as a client component for product detail purchase UI.
- Quantity controls clamp values to the current product stock.
- Decrement is disabled at quantity `1`; increment is disabled at current stock.
- Add to cart shows accessible live feedback after click.
- Product detail page now renders the purchase controls below price and availability.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-1440.png`
- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-375.png`
- `caseflow-store/.agent/artifacts/d08-t03-add-to-cart-feedback-1440.png`
- `caseflow-store/.agent/artifacts/d08-t03-product-purchase-controls-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and preserved 16 generated SSG product paths.
- HTML marker check confirmed purchase controls, quantity input, add-to-cart button, and stock text render.
- Chrome interaction check confirmed quantity changed to `3` and success feedback rendered after Add to cart.
- Desktop/mobile screenshots passed visual review.

### Limitation

- This is local UI feedback only. Real cart state, cart count, cart drawer, and localStorage persistence belong to Day 9.

### Next Task

`D08-T04 - Add not-found behavior`

---

## SR-041 - D08-T04: Product Not-Found Behavior

- Date: 2026-07-15
- Status: completed
- Phase: Day 8 - Product detail

### Objective

Add product-specific not-found behavior for unknown product detail slugs.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/products/[slug]/not-found.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
node --input-type=module <<'NODE'
# HTTP check confirmed status 404 and product not-found marker.
NODE
npx --yes playwright@latest screenshot --channel chrome --timeout 15000 --viewport-size=1440,1200 --full-page --wait-for-selector '[data-product-not-found]' http://localhost:3001/products/not-a-real-product .agent/artifacts/d08-t04-product-not-found-1440.png
npx --yes playwright@latest screenshot --channel chrome --timeout 15000 --viewport-size=375,1100 --full-page --wait-for-selector '[data-product-not-found]' http://localhost:3001/products/not-a-real-product .agent/artifacts/d08-t04-product-not-found-375.png
```

### Actual Result

- Added a product-specific not-found page under `/products/[slug]`.
- Unknown product detail slugs now render customer-facing recovery actions.
- The route preserves HTTP `404` status.
- Added `data-product-not-found` for visual and HTTP checks.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-1440.png`
- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-375.png`
- `caseflow-store/.agent/artifacts/d08-t04-product-not-found-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and preserved 16 generated SSG product paths.
- HTTP check confirmed `/products/not-a-real-product` returned status `404` and included `data-product-not-found`.
- Desktop/mobile screenshots passed visual review.

### Next Task

`D09-T01 - Implement Cart Context`

---

## SR-042 - D09-T01: Cart Context

- Date: 2026-07-15
- Status: completed
- Phase: Day 9 - Cart

### Objective

Implement Cart Context for local guest cart state.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/layout.tsx`
- `caseflow-store/src/app/providers.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-summary-link.tsx`
- `caseflow-store/src/features/cart/index.ts`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
rg -n "localStorage|sessionStorage|price|subtotal" src/features/cart src/features/products/product-purchase-controls.tsx src/app/providers.tsx src/components/layout
node --input-type=module <<'NODE'
# Chrome DevTools interaction check added quantity 3 and verified cart count in desktop header and mobile menu.
NODE
```

### Actual Result

- Added `CartProvider` and `useCart`.
- Added cart reducer actions for add, update, remove, and clear.
- Wrapped the app shell in `AppProviders`.
- Added `CartSummaryLink` for desktop header and mobile navigation.
- Product detail Add to cart now writes `{ productId, quantity }` to in-memory cart context.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d09-t01-cart-context-after-add-1440.png`
- `caseflow-store/.agent/artifacts/d09-t01-cart-context-mobile-menu-375.png`
- `caseflow-store/.agent/artifacts/d09-t01-cart-context-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Grep check found no `localStorage`, `sessionStorage`, `price`, or `subtotal` usage in the new cart/client integration.
- Chrome interaction check confirmed adding quantity `3` shows `Cart (3)` in desktop header and mobile menu.

### Limitation

- Cart state is in-memory only and does not survive reload until `D09-T02`.

### Next Task

`D09-T02 - Persist only { productId, quantity } in localStorage with a version`

---

## SR-043 - D09-T02: Versioned localStorage Cart Persistence

- Date: 2026-07-15
- Status: completed
- Phase: Day 9 - Cart

### Objective

Persist only `{ productId, quantity }` cart items in localStorage with a version.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-summary-link.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
node --input-type=module <<'NODE'
# Chrome DevTools persistence check verified storage schema, reload restore, mobile count, and invalid-version handling.
NODE
rg -n "price|subtotal|productName|slug|description|stock" src/features/cart
```

### Actual Result

- Added `CART_STORAGE_KEY` as `caseflow-store.cart.v1`.
- Added `CART_STORAGE_VERSION` as `1`.
- Cart state now persists to localStorage after storage hydration.
- Storage reads ignore invalid JSON, invalid item shapes, and unsupported versions.
- Stored items are normalized and duplicate product IDs are merged.
- Cart count restores after reload in desktop header and mobile menu.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-after-reload-1440.png`
- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-mobile-menu-375.png`
- `caseflow-store/.agent/artifacts/d09-t02-cart-persistence-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Chrome persistence check confirmed localStorage payload is `{"version":1,"items":[{"productId":"10000000-0000-4000-8000-000000000001","quantity":3}]}` after adding quantity `3`.
- Chrome persistence check confirmed top-level keys are only `items` and `version`.
- Chrome persistence check confirmed item keys are only `productId` and `quantity`.
- Chrome persistence check confirmed the payload contains no price, subtotal, product name, slug, description, or stock fields.
- Chrome persistence check confirmed reload restores `Cart (3)` in desktop header and mobile menu.
- Chrome persistence check confirmed unsupported storage version is ignored.
- Desktop/mobile screenshots passed visual review.

### Limitation

- localStorage remains untrusted input; checkout must still validate product IDs, quantities, prices, and stock on the server.

### Next Task

`D09-T03 - Build cart drawer`

---

## SR-044 - D09-T03: Cart Drawer

- Date: 2026-07-15
- Status: completed
- Phase: Day 9 - Cart

### Objective

Build a keyboard-usable cart drawer for the local guest cart.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/providers.tsx`
- `caseflow-store/src/components/layout/site-header.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/cart/cart-summary-button.tsx`
- `caseflow-store/src/features/cart/cart-summary-link.tsx`
- `caseflow-store/src/features/cart/index.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
node --input-type=module <<'NODE'
# Chrome DevTools drawer check verified empty, item, mobile, Escape, remove, clear, and localStorage payload behavior.
NODE
```

### Actual Result

- Added `CartDrawer` and rendered it under `AppProviders`.
- Added `isCartOpen`, `openCart`, and `closeCart` to Cart Context.
- Replaced the cart placeholder link behavior with a drawer trigger button.
- Added empty drawer state.
- Added item drawer state with product/category/stock display from the mock catalog.
- Added estimated subtotal display.
- Added Remove and Clear cart actions.
- Added close button, backdrop close, Escape close, focus restoration, and focus loop.
- Renamed the cart trigger component to `CartSummaryButton` because it now opens a drawer rather than navigating as a link.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-empty-1440.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-with-item-1440.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-mobile-375.png`
- `caseflow-store/.agent/artifacts/d09-t03-cart-drawer-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Chrome interaction check confirmed empty drawer opens with focus on Close.
- Chrome interaction check confirmed adding quantity `3` shows one cart item and estimated subtotal `987.000 d`.
- Chrome interaction check confirmed mobile drawer renders at 375px.
- Chrome interaction check confirmed Escape closes the drawer.
- Chrome interaction check confirmed Remove resets count to `Cart (0)` and localStorage to an empty items array.
- Chrome interaction check confirmed Clear cart resets count to `Cart (0)` and localStorage to an empty items array.
- Chrome interaction check confirmed stored cart still contains no price, subtotal, product name, slug, description, or stock fields.
- Desktop/mobile screenshots passed visual review.

### Limitation

- Drawer does not yet expose quantity controls. Quantity boundary validation remains for `D09-T04`.
- Estimated subtotal is display-only and must still be recalculated by the server during checkout.

### Next Task

`D09-T04 - Validate quantity boundaries`

---

## SR-045 - D09-T04: Cart Quantity Boundaries

- Date: 2026-07-15
- Status: completed
- Phase: Day 9 - Cart

### Objective

Validate quantity boundaries for add-to-cart and cart drawer quantity changes.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/features/products/product-purchase-controls.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
# Codex in-app browser interaction check verified stock max, drawer controls, tampered localStorage, screenshots, and JSON artifact.
```

### Actual Result

- Added optional `maxQuantity` boundaries to cart add/update actions.
- Product detail now computes `cartQuantity` and `remainingQuantity` for the current product.
- Product detail disables Add to cart when remaining quantity is `0`.
- Product detail shows quantity `0` when the cart already contains all available stock.
- Drawer quantity controls now decrement/increment local cart items.
- Drawer increment is disabled at product stock max.
- Drawer detects over-stock cart state from tampered localStorage and shows a boundary error.
- Drawer Set to max action reduces an invalid over-stock line item back to current stock.
- localStorage still stores only `productId` and `quantity` per item.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d09-t04-product-boundary-1440.png`
- `caseflow-store/.agent/artifacts/d09-t04-cart-boundary-drawer-1440.png`
- `caseflow-store/.agent/artifacts/d09-t04-cart-boundary-tampered-375.png`
- `caseflow-store/.agent/artifacts/d09-t04-quantity-boundary-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Browser check confirmed adding quantity `18` to AeroGuard results in `In cart: 18. Remaining to add: 0.`
- Browser check confirmed product quantity input value is `0` and Add to cart is disabled at stock max.
- Browser check confirmed cart count is `18`.
- Browser check confirmed localStorage payload is still `{ "version": 1, "items": [{ "productId": "...", "quantity": 18 }] }`.
- Browser check confirmed drawer quantity is `18`, increment is disabled, and decrement is enabled.
- Browser check confirmed decrement changes drawer quantity to `17`, then increment returns it to `18`.
- Browser check confirmed tampered localStorage quantity `99` shows a visible boundary error and Set to max fixes storage quantity back to `18`.
- Desktop/mobile screenshots passed visual review.

### Limitation

- localStorage remains untrusted input; checkout must still validate product IDs, quantities, stock, prices, line totals, and subtotal on the server.
- In a tampered over-stock drawer state, the estimated subtotal reflects the invalid local quantity until the user fixes it. It must stay display-only.

### Next Task

`D10-T01 - Build /checkout`

---

## SR-046 - D10-T01: Checkout Route

- Date: 2026-07-15
- Status: completed
- Phase: Day 10 - Checkout

### Objective

Build the initial `/checkout` route.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/checkout/page.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `caseflow-store/src/features/checkout/index.ts`
- `caseflow-store/src/features/cart/cart-context.tsx`
- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
# Codex in-app browser checkout check verified empty state, validated cart state, drawer navigation, mobile layout, over-stock error, screenshots, and JSON artifact.
```

### Actual Result

- Added `/checkout` route with page metadata.
- Added a checkout feature module.
- Exposed `hasLoadedStorage` from Cart Context so checkout does not show an empty cart before localStorage hydration.
- Added empty cart state with a product-list action.
- Added contact and shipping form shell with visible field labels.
- Kept payment card fields out of the UI.
- Kept Place order disabled because customer validation, order summary, and submission are later tasks.
- Added server-validated cart review using `/api/cart/validate`.
- Added validation error state for stale/tampered cart quantities.
- Added Checkout link from cart drawer to `/checkout`.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d10-t01-checkout-empty-1440.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-with-cart-1440.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-with-cart-375.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-validation-error-375.png`
- `caseflow-store/.agent/artifacts/d10-t01-checkout-route-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout` as a static route.
- Browser check confirmed empty cart state renders when storage is empty.
- Browser check confirmed cart quantity `2` validates through `/api/cart/validate` and shows subtotal `658.000 d`.
- Browser check confirmed Place order is disabled for this shell task.
- Browser check confirmed cart drawer Checkout link navigates to `/checkout`.
- Browser check confirmed localStorage item keys remain only `productId` and `quantity`.
- Browser check confirmed tampered quantity `99` renders `OUT_OF_STOCK` and a `Needs fix` badge.
- Desktop/mobile screenshots passed visual review.

### Limitation

- Customer field validation is intentionally not implemented yet; that is `D10-T02`.
- Full order summary and order submission are intentionally not implemented yet; those are `D10-T03` and `D10-T04`.
- Checkout validates against the mock catalog until Supabase integration replaces the repository.

### Next Task

`D10-T02 - Validate customer name, email, phone, and shipping address`

---

## SR-047 - D10-T02: Checkout Customer Validation

- Date: 2026-07-15
- Status: completed
- Phase: Day 10 - Checkout

### Objective

Validate customer name, email, phone, and shipping address on the checkout page.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
curl -I http://localhost:3001/checkout
# Codex in-app browser checkout check verified empty field errors, invalid email/phone errors, valid details, no card-like inputs, mobile overflow, screenshots, and JSON artifact.
```

### Actual Result

- Reused the domain Zod schemas for checkout customer field validation.
- Added controlled state for full name, email, phone, and shipping address.
- Added validation on blur and submit.
- Added required-field messages for all four fields.
- Added format validation messages for email and phone.
- Replaced the disabled order placeholder with a `Validate details` submit action.
- Added a success status when customer details are valid.
- Kept payment card fields out of the checkout UI.
- Kept cart validation and totals delegated to `/api/cart/validate`.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d10-t02-checkout-invalid-1440.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-valid-1440.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-valid-375.png`
- `caseflow-store/.agent/artifacts/d10-t02-checkout-validation-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout` as a static route.
- `curl -I http://localhost:3001/checkout`: returned `HTTP/1.1 200 OK`.
- Browser check used localStorage key `caseflow-store.cart.v1` with one item-only test cart line.
- Browser check confirmed all four empty fields show required errors.
- Browser check confirmed invalid email and invalid phone show format errors.
- Browser check confirmed valid details clear field errors and show success status.
- Browser check confirmed no card, CVV, expiry, or payment-like inputs exist.
- Browser check confirmed cart review still shows server-calculated subtotal `658.000 d`.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Desktop/mobile screenshots passed visual review.

### Limitation

- This task only adds client-side checkout form validation. `POST /api/orders` must remain the authoritative server validation boundary.
- Order summary is not built yet; that is `D10-T03`.
- Order success/submission flow is not built yet; that is `D10-T04`.

### Next Task

`D10-T03 - Build order summary`

---

## SR-048 - D10-T03: Checkout Order Summary

- Date: 2026-07-15
- Status: completed
- Phase: Day 10 - Checkout

### Objective

Build an order summary on `/checkout`.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
curl -I http://localhost:3001/checkout
# Codex in-app browser checkout check verified valid summary, mobile summary, over-stock suppression, no card-like inputs, screenshots, and JSON artifact.
```

### Actual Result

- Added a dedicated `Order summary` section under checkout cart review.
- Summary renders only after `/api/cart/validate` succeeds.
- Summary item count is derived from server-validated cart lines.
- Summary subtotal and order total use the server-calculated subtotal.
- Added explicit demo rows for shipping and payment.
- Kept the existing `data-checkout-subtotal` selector on the server subtotal and added summary-specific selectors.
- Hid the order summary when server cart validation fails.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d10-t03-order-summary-1440.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-375.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-error-1440.png`
- `caseflow-store/.agent/artifacts/d10-t03-order-summary-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout` as a static route.
- `curl -I http://localhost:3001/checkout`: returned `HTTP/1.1 200 OK`.
- Browser check used localStorage key `caseflow-store.cart.v1` with one item-only test cart line.
- Browser check confirmed summary shows `2 items`.
- Browser check confirmed summary subtotal and order total both show `658.000 d` from server validation.
- Browser check confirmed shipping shows `Not charged in demo`.
- Browser check confirmed payment shows `No payment collected`.
- Browser check confirmed no card, CVV, expiry, or payment-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Browser check confirmed over-stock cart validation returns `OUT_OF_STOCK` and summary totals do not render.
- Desktop/mobile/error screenshots passed visual review.

### Limitation

- This task does not submit orders or navigate to a success page. That remains `D10-T04`.
- `POST /api/orders` must remain the authoritative server validation and total recalculation boundary during submission.

### Next Task

`D10-T04 - Build order success page`

---

## SR-049 - D10-T04: Checkout Success Flow

- Date: 2026-07-15
- Status: completed
- Phase: Day 10 - Checkout

### Objective

Build the checkout order success page.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/checkout/success/page.tsx`
- `caseflow-store/src/features/checkout/checkout-page.tsx`
- `caseflow-store/src/features/checkout/checkout-success-page.tsx`
- `caseflow-store/src/features/checkout/checkout-success-storage.ts`
- `caseflow-store/src/features/checkout/index.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run start -- -p 3001
curl -I http://localhost:3001/checkout/success
# Codex in-app browser checkout check verified submit to success, order code, server total, cart clear, no card-like inputs, fallback state, screenshots, and JSON artifact.
```

### Actual Result

- Added `/checkout/success` route with page metadata.
- Added checkout success page UI for simulated order confirmation.
- Checkout submit now posts to `POST /api/orders` after local field validation and successful cart review.
- The order API remains responsible for server-side validation and total recalculation.
- Added a success snapshot helper with versioned sessionStorage key `caseflow-store.checkout.success.v1`.
- Success snapshot excludes customer PII and stores order code, status, subtotal, item count, timestamp, and item summary.
- Successful order submit clears the local cart.
- Success page shows order code, pending status, server-created total, item summary, and next steps.
- Success page includes a direct-URL fallback when session snapshot data is missing.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-1440.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-375.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-fallback-1440.png`
- `caseflow-store/.agent/artifacts/d10-t04-checkout-success-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout/success` as a static route.
- `curl -I http://localhost:3001/checkout/success`: returned `HTTP/1.1 200 OK`.
- Browser check confirmed the submit button reads `Place simulated order` and is enabled after cart validation.
- Browser check confirmed successful submit navigates to `/checkout/success?orderCode=...`.
- Browser check confirmed order code starts with `CF-`.
- Browser check confirmed success status is `pending`.
- Browser check confirmed total is `658.000 d` from the server-created order.
- Browser check confirmed item summary includes `AeroGuard MagSafe Case` and quantity `2`.
- Browser check confirmed cart count changes to `Cart (0)` and localStorage cart becomes `{ "version": 1, "items": [] }`.
- Browser check confirmed success snapshot uses version `1`, subtotal `658000`, and item count `2`.
- Browser check confirmed no card, CVV, expiry, or payment-like inputs exist.
- Browser check confirmed mobile 375px has no horizontal overflow.
- Browser check confirmed fallback state renders when session snapshot is missing.
- Desktop/mobile/fallback screenshots passed visual review.

### Limitation

- Success details are sessionStorage-backed for the mock phase. Durable order lookup should wait for Supabase integration or an explicit public order lookup task.
- Mock order storage remains in memory until the Supabase order repository replaces it.

### Next Task

`D10-T05 - Create Playwright test skeleton`

---

## SR-050 - D10-T05: Playwright Test Skeleton

- Date: 2026-07-15
- Status: completed
- Phase: Day 10 - Checkout

### Objective

Create the first Playwright test skeleton for the checkout flow.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0004-use-local-cart.md`
- `docs/adr/0005-use-simulated-checkout.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/.gitignore`
- `caseflow-store/package.json`
- `caseflow-store/package-lock.json`
- `caseflow-store/playwright.config.ts`
- `caseflow-store/tests/e2e/checkout.spec.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm install -D @playwright/test
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npx playwright install chromium
npm run test:e2e
```

### Actual Result

- Installed `@playwright/test`.
- Added `npm run test:e2e`.
- Added `playwright.config.ts` with Chromium desktop, `tests/e2e`, HTML report, failure artifacts, and a `next start` web server on port `3001`.
- Added `PLAYWRIGHT_BASE_URL` support for running tests against an externally managed app server.
- Added checkout happy-path E2E coverage:
  - Seeds localStorage using only `{ productId, quantity }`.
  - Waits for server-validated checkout summary.
  - Verifies server-calculated `658.000 d` total for two AeroGuard MagSafe Case units.
  - Verifies no card-like inputs exist.
  - Submits the simulated order.
  - Verifies success URL, order code, pending status, server total, cleared cart, and non-PII session snapshot.
  - Captures a screenshot artifact.
- Added checkout success direct-link fallback coverage.
- Updated `.gitignore` for Playwright report and test-result folders.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d10-t05-playwright-checkout-success.png`
- `caseflow-store/playwright-report/index.html`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/checkout` plus `/checkout/success`.
- `npx playwright install chromium`: passed.
- First `npm run test:e2e`: failed because `[data-cart-count]` has both desktop and mobile instances; this exposed a test-selector assumption, not an app failure.
- Test was corrected to assert every cart count instance is `Cart (0)` with `data-cart-count="0"`.
- Final `npm run test:e2e`: passed, 2 tests.
- Visual review of `d10-t05-playwright-checkout-success.png`: passed.

### Limitation

- This is a skeleton, not full Day 17 coverage. It covers checkout happy path and success fallback only.
- Admin flows, checkout validation failures, empty cart, invalid quantity, and production deployment checks remain future tasks.
- Playwright emitted a macOS 12 warning about frozen ffmpeg browser support; Chromium tests still passed.
- npm still reports 2 moderate vulnerabilities and pending install-script approvals for `sharp` and `unrs-resolver`; no forced audit fix was run.
- `D17-T01` now overlaps with this completed task. Treat Day 17 as E2E expansion/hardening, not as a fake fresh Playwright install.

### Next Task

`D11-T01 - Build /admin/login`

---

## SR-051 - D11-T01: Admin Login

- Date: 2026-07-15
- Status: completed
- Phase: Day 11 - Admin UI

### Objective

Build `/admin/login`.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0001-use-nextjs-modular-monolith.md`
- `docs/adr/0002-use-supabase.md`
- `docs/adr/0003-use-mock-first-development.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/admin/login/page.tsx`
- `caseflow-store/src/features/admin/admin-login-page.tsx`
- `caseflow-store/src/features/admin/admin-session.ts`
- `caseflow-store/src/features/admin/index.ts`
- `caseflow-store/src/lib/auth/admin-constants.ts`
- `caseflow-store/src/lib/auth/admin.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
CASEFLOW_ADMIN_API_TOKEN=dev-admin-token npm run start -- -p 3001
curl -I http://127.0.0.1:3001/admin/login
curl -s -i http://127.0.0.1:3001/api/admin/orders
curl -s -i -H 'x-caseflow-admin-token: dev-admin-token' http://127.0.0.1:3001/api/admin/orders
npm run test:e2e
# Playwright interaction check captured desktop/mobile/success screenshots and JSON artifact.
```

### Actual Result

- Added `/admin/login` route with metadata.
- Added `AdminLoginPage` client component with token input, submit state, invalid-token error state, saved-session state, and clear action.
- Added shared `ADMIN_TOKEN_HEADER` constant so client login and server guard use the same header name.
- Added mock admin session helper:
  - Storage key: `caseflow-store.admin.session.v1`
  - Version: `1`
  - Data: token and `verifiedAt`
  - Storage scope: `sessionStorage`
- Login submission verifies the token through `GET /api/admin/orders`.
- Failed verification clears any saved admin session.
- Successful verification stores the session for the current browser tab.
- No `NEXT_PUBLIC_*` admin token or server secret was introduced.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d11-t01-admin-login-1440.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-375.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-success-1440.png`
- `caseflow-store/.agent/artifacts/d11-t01-admin-login-check.json`

### Verification

- `npm run lint`: passed after replacing a synchronous `useEffect` state update with a guarded lazy state initializer.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/login`.
- `curl -I http://127.0.0.1:3001/admin/login`: returned `HTTP/1.1 200 OK`.
- Admin API without token returned `401 UNAUTHORIZED`.
- Admin API with `x-caseflow-admin-token: dev-admin-token` returned `200 OK`.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright interaction check confirmed required selectors, invalid-token error, valid-token success state, sessionStorage version `1`, and no desktop/mobile horizontal overflow.
- Desktop, mobile, and success screenshots passed visual review.

### Limitation

- This is mock-phase admin login. It is not Supabase Auth and must not be described as production auth.
- The browser stores the admin token in sessionStorage for local admin UI continuity only. This should be replaced by Supabase Auth/session handling during Day 15.
- `/admin/orders` is not built yet, so successful login intentionally stays on `/admin/login` instead of redirecting to a missing route.
- A mock order count can reflect orders created during the current in-memory server process.

### Next Task

`D11-T02 - Build admin order list`

---

## SR-052 - D11-T02: Admin Order List

- Date: 2026-07-15
- Status: completed
- Phase: Day 11 - Admin UI

### Objective

Build the admin order list.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0001-use-nextjs-modular-monolith.md`
- `docs/adr/0002-use-supabase.md`
- `docs/adr/0003-use-mock-first-development.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/app/admin/orders/page.tsx`
- `caseflow-store/src/features/admin/admin-orders-page.tsx`
- `caseflow-store/src/features/admin/admin-login-page.tsx`
- `caseflow-store/src/features/admin/index.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
CASEFLOW_ADMIN_API_TOKEN=dev-admin-token npm run start -- -p 3001
curl -I http://127.0.0.1:3001/admin/orders
curl -s -i http://127.0.0.1:3001/api/admin/orders
curl -s -i -H 'x-caseflow-admin-token: dev-admin-token' http://127.0.0.1:3001/api/admin/orders
npm run test:e2e
# Test order was created through POST /api/orders for visual QA.
# Playwright admin orders check captured desktop/mobile screenshots and JSON artifact.
```

### Actual Result

- Added `/admin/orders` route with metadata.
- Added `AdminOrdersPage` client component.
- Reads mock admin session from `sessionStorage` key `caseflow-store.admin.session.v1`.
- Shows auth-required state when no valid admin session exists.
- Calls `GET /api/admin/orders` with the saved admin token header.
- Clears saved session when admin API returns `401`.
- Shows loading, error, empty, and populated list states.
- Shows summary metrics for orders, pending orders, item count, and server-created total.
- Shows desktop table with order code, customer, status, total, item count, and created date.
- Shows mobile order cards instead of forcing a cramped table on 375px.
- Added a `View orders` link on `/admin/login` when a mock admin session is saved.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-1440.png`
- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-375.png`
- `caseflow-store/.agent/artifacts/d11-t02-admin-orders-check.json`

### Verification

- `npm run lint`: passed after deferring initial admin order fetch to avoid synchronous state updates inside `useEffect`.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/orders`.
- `curl -I http://127.0.0.1:3001/admin/orders`: returned `HTTP/1.1 200 OK`.
- Admin API without token returned `401 UNAUTHORIZED`.
- Admin API with `x-caseflow-admin-token: dev-admin-token` returned `200 OK`.
- `npm run test:e2e`: passed, 2 checkout tests.
- QA order creation through `POST /api/orders` returned `201` with subtotal `1017000`.
- Playwright admin orders check confirmed auth-required state, required list selectors, desktop rows, mobile cards, QA order presence, and no horizontal overflow at 1440px or 375px.
- Desktop and mobile screenshots passed visual review.

### Limitation

- This is a read-only order list. Order detail and status update controls remain `D11-T03`.
- The list uses mock in-memory orders. Restarting `next start` clears the mock order list.
- Counts/totals in screenshots can include orders created by checkout E2E during the same server process.
- Admin session is still mock-phase `sessionStorage`, not Supabase Auth.

### Next Task

`D11-T03 - Build order detail and status update UI`

---

## SR-053 - D11-T03: Admin Order Detail And Status Update UI

- Date: 2026-07-15
- Status: completed
- Phase: Day 11 - Admin UI

### Objective

Build order detail and status update UI.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/adr/0001-use-nextjs-modular-monolith.md`
- `docs/adr/0002-use-supabase.md`
- `docs/adr/0003-use-mock-first-development.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/admin/admin-orders-page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
CASEFLOW_ADMIN_API_TOKEN=dev-admin-token npm run start -- -p 3001
npm run test:e2e
# Playwright admin detail/status QA seeded an order, selected it, patched status, verified server status, checked overflow, and captured screenshots.
```

### Actual Result

- Extended `/admin/orders` with selected-order state and a detail panel.
- Default selection uses the newest order returned by `GET /api/admin/orders`.
- Added visible `View` controls on desktop table rows and mobile cards.
- Detail panel shows order code, current status, customer contact, shipping address, created/updated dates, server total, and order items.
- Status form supports the known `ORDER_STATUSES`.
- Status submission calls guarded `PATCH /api/admin/orders/[id]` with the saved `x-caseflow-admin-token` header.
- `401` responses clear the mock admin session and return to auth-required state.
- Successful PATCH responses update the selected order, list row/card, and pending summary count from server data.
- Desktop `View` control was moved into the first table column after visual QA showed the separate action column was easy to miss inside the scrollable table.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-1440.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-status-updated-1440.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-375.png`
- `caseflow-store/.agent/artifacts/d11-t03-admin-order-detail-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed and listed `/admin/orders` and `/api/admin/orders/[id]`.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright admin detail/status QA created order `CF-MRLRQ9SZ-0BCF3FCB`, verified it was selected in detail, verified detail content, changed status from `pending` to `confirmed`, and confirmed server status was `confirmed`.
- Overflow checks passed at 1440px and 375px.
- Desktop and mobile screenshots passed visual review.

### Limitation

- No `GET /api/admin/orders/[id]` route was added. The detail panel uses the already-loaded admin order list payload, while mutation stays on the existing PATCH route.
- The admin session remains mock-phase `sessionStorage`, not Supabase Auth.
- The order repository is still in-memory. Restarting `next start` clears orders.
- Mobile layout is functional, but D11-T04 should still tighten repeated mobile admin use rather than pretending this pass is final mobile treatment.

### Next Task

`D11-T04 - Build mobile admin treatment`

---

## SR-054 - D11-T04: Admin Mobile Treatment

- Date: 2026-07-15
- Status: completed
- Phase: Day 11 - Admin UI

### Objective

Build mobile admin treatment.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/admin/admin-orders-page.tsx`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
CASEFLOW_ADMIN_API_TOKEN=dev-admin-token npm run start -- -p 3001
npm run test:e2e
# Playwright mobile admin QA seeded orders, checked 375/768/1440 overflow, focused detail on mobile selection, patched status, and captured screenshots.
```

### Actual Result

- Reduced mobile admin summary height with a two-column metric layout.
- Added a mobile/tablet selected-order bar above the order list.
- Kept card layout active below `lg`, preventing the desktop table from activating too early at 768px.
- Made order cards denser while preserving order code, status, created date, total, item count, customer, email, and `View details`.
- Mobile `View details` now selects the order, scrolls to the detail panel, and focuses it.
- Status update still goes through guarded `PATCH /api/admin/orders/[id]` and updates from the server response.
- Desktop table/detail layout remains in place at 1440px.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-default-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-detail-focus-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-status-updated-375.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-tablet-768.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-desktop-regression-1440.png`
- `caseflow-store/.agent/artifacts/d11-t04-admin-mobile-treatment-check.json`

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 2 checkout tests.
- Playwright QA seeded orders `CF-MRLS5FH2-9F78AF43`, `CF-MRLS5FHN-59491AC6`, and `CF-MRLS5FI1-D154EE1E`.
- QA selected `CF-MRLS5FHN-59491AC6` on mobile, verified the detail panel focused after selection, changed status to `shipping`, and verified server status was `shipping`.
- Overflow checks passed at 375px, 768px, and 1440px.
- Visual review passed for mobile default, mobile focused detail, mobile status-updated, tablet 768px, and desktop regression screenshots.

### Limitation

- Admin auth is still mock-phase `sessionStorage`, not Supabase Auth.
- Orders are still stored in the in-memory mock repository and clear on server restart.
- Full-page screenshots after scroll can show the sticky site header mid-page; that is an artifact of screenshot capture while verifying focus/scroll behavior.

### Next Task

`D12-T01 - Test 375px, 768px, 1024px, and 1440px`

---

## SR-055 - D12-T01: Breakpoint Acceptance Test

- Date: 2026-07-15
- Status: completed
- Phase: Day 12 - UI acceptance and feature freeze

### Objective

Test 375px, 768px, 1024px, and 1440px layouts.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

No source UI files were changed.

### Commands Executed

```bash
# Playwright breakpoint QA against the running production server on port 3001.
# The script generated 28 screenshots and d12-t01-breakpoint-check.json.
npm run lint
npx tsc --noEmit
git diff --check
npm run test:e2e
```

### Actual Result

- Tested 4 viewport widths: 375px, 768px, 1024px, and 1440px.
- Tested 7 scenarios at every viewport:
  - home/catalog
  - product detail
  - cart drawer
  - checkout with cart
  - checkout success with session snapshot
  - admin login
  - admin orders with a seeded mock order
- Generated 28 screenshot artifacts.
- Generated `caseflow-store/.agent/artifacts/d12-t01-breakpoint-check.json`.
- No horizontal overflow failures were found.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d12-t01-breakpoint-check.json`
- `caseflow-store/.agent/artifacts/d12-t01-home-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-product-detail-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-cart-drawer-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-checkout-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-checkout-success-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-admin-login-{375,768,1024,1440}.png`
- `caseflow-store/.agent/artifacts/d12-t01-admin-orders-{375,768,1024,1440}.png`

### Verification

- Breakpoint QA result count: 28.
- Breakpoint QA failures: 0.
- Seeded admin order code: `CF-MRLSGGTM-94A2BD66`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run test:e2e`: passed, 2 checkout tests.
- Representative screenshots were visually reviewed.

### Limitation

- D12-T01 checks responsive layout and horizontal overflow. It does not replace D12-T02 keyboard/focus audit or D12-T03 state audit.
- The QA script needed to account for duplicate desktop/mobile cart buttons and the closed mobile menu; those were script issues, not app regressions.
- Mock admin orders in screenshots include orders created by prior QA runs in the same in-memory server process.

### Next Task

`D12-T02 - Check keyboard navigation and focus states`

---

## SR-056 - D12-T02: Keyboard And Focus Acceptance Test

- Date: 2026-07-15
- Status: completed
- Phase: Day 12 - UI acceptance and feature freeze

### Objective

Check keyboard navigation and focus states.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/src/features/cart/cart-drawer.tsx`
- `caseflow-store/src/components/layout/mobile-navigation.tsx`
- `caseflow-store/playwright.config.ts`
- `caseflow-store/tests/e2e/keyboard-focus.spec.ts`
- `caseflow-store/.agent/artifacts/d12-t02-keyboard-focus-check.json`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Commands Executed

```bash
npx playwright test tests/e2e/keyboard-focus.spec.ts
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run test:e2e
```

### Actual Result

- Added Playwright keyboard/focus coverage for mobile navigation, cart drawer, product detail, checkout, admin login, and mobile admin order detail.
- Found and fixed a real mobile focus bug: closing the cart drawer after opening it from the mobile menu could leave focus on `body` because the original cart opener became hidden.
- Cart drawer close now restores focus to the previous visible element or falls back to a visible cart opener, mobile menu toggle, or home link.
- Added a stable `data-mobile-navigation-toggle` selector for focus return and E2E coverage.
- Updated Playwright webServer config to supply `CASEFLOW_ADMIN_API_TOKEN` for deterministic admin E2E when no external token is configured.
- Generated 6 screenshot artifacts plus `d12-t02-keyboard-focus-check.json`.

### Visual Artifacts

- `caseflow-store/.agent/artifacts/d12-t02-keyboard-focus-check.json`
- `caseflow-store/.agent/artifacts/d12-t02-mobile-menu-focus-375.png`
- `caseflow-store/.agent/artifacts/d12-t02-cart-drawer-focus-375.png`
- `caseflow-store/.agent/artifacts/d12-t02-product-detail-focus-1024.png`
- `caseflow-store/.agent/artifacts/d12-t02-checkout-focus-1024.png`
- `caseflow-store/.agent/artifacts/d12-t02-admin-login-focus-768.png`
- `caseflow-store/.agent/artifacts/d12-t02-admin-orders-focus-375.png`

### Verification

- Targeted keyboard/focus Playwright spec: passed, 3 tests.
- Full `npm run test:e2e`: passed, 5 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Visual review passed for cart drawer focused close button, checkout focused field, and admin mobile focused detail panel.

### Limitation

- This is keyboard/focus acceptance only. It does not replace D12-T03 state audit.
- Admin auth is still mock-phase and uses the configured admin API token for E2E.
- Full-page screenshots after focus jumps can show the sticky site header mid-page; this reflects the verified scroll/focus position.

### Next Task

`D12-T03 - Check loading, empty, error, and success states`

---

## SR-057 - D12-T03: State Acceptance Test

- Date: 2026-07-15
- Status: completed
- Phase: Day 12 - UI acceptance and feature freeze

### Objective

Check loading, empty, error, and success states.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `DESIGN.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/tests/e2e/ui-states.spec.ts`
- `caseflow-store/.agent/artifacts/d12-t03-state-check.json`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

No production UI source files were changed.

### Commands Executed

```bash
npx playwright test tests/e2e/ui-states.spec.ts
npm run lint
npx tsc --noEmit
git diff --check
npm run build
npm run test:e2e
CASEFLOW_ADMIN_API_TOKEN=dev-admin-token npm run start -- -p 3001
npx playwright test tests/e2e/ui-states.spec.ts
```

### Actual Result

- Added `tests/e2e/ui-states.spec.ts`.
- Covered catalog loading, empty, and error preview states.
- Covered cart drawer empty state.
- Covered checkout empty, over-stock validation error, and simulated order success states.
- Covered product not-found fallback.
- Covered admin orders auth-required, loading, empty, and error states.
- Covered admin login invalid-token error and valid-token success states.
- Generated 14 visual screenshot artifacts plus `d12-t03-state-check.json`.

### Visual Artifacts

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

### Verification

- Targeted state Playwright spec: passed, 4 tests.
- Full `npm run test:e2e`: passed, 9 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Visual review passed after restarting production server from the latest build and regenerating D12-T03 screenshots.

### Limitation

- D12-T03 added state acceptance coverage but did not add new user-facing features.
- Admin loading/error/empty states are tested with Playwright route interception because the mock order store is in-memory and not externally resettable.
- The first full-suite attempt failed because the new spec was not isolated enough and the running production server had stale CSS assets after a build. The spec was hardened and artifacts were regenerated from a fresh production server.

### Next Task

`D12-T04 - Run npm run lint && npm run build`

---

## SR-058 - D12-T04: Final Day 12 Lint And Build Verification

- Date: 2026-07-15
- Status: completed
- Phase: Day 12 - UI acceptance and feature freeze

### Objective

Run `npm run lint && npm run build`.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

No production source files were changed.

### Commands Executed

```bash
npm run lint && npm run build
```

### Actual Result

- ESLint completed successfully.
- Next.js production build completed successfully.
- Build completed TypeScript, page data collection, and static page generation.
- Static generation count: 31 pages.

### Verification

- `npm run lint && npm run build`: passed.

### Limitation

- D12-T04 is a verification gate only. It does not replace the broader D12-T01 breakpoint, D12-T02 keyboard/focus, or D12-T03 state acceptance evidence.

### Next Task

`D12-T05 - Freeze features; after this point only fixes and integration work are allowed`

---

## SR-059 - D12-T05: Feature Freeze

- Date: 2026-07-15
- Status: completed
- Phase: Day 12 - UI acceptance and feature freeze

### Objective

Freeze features; after this point only fixes and integration work are allowed.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `AGENTS.md`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/AGENTS.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

No production source files were changed.

### Actual Result

- Feature freeze is active after Day 12 UI acceptance.
- Future work is limited to fixes, integration work, deployment work, tests, documentation, and explicitly approved roadmap changes.
- New user-facing features outside the existing roadmap are not allowed without an explicit roadmap update and, for major changes, an ADR.
- The roadmap now points to `D13-T01 - Create Supabase project`.

### Verification

- Feature freeze rule was written into root and app `AGENTS.md`.
- Root and app `.agent` files were updated to the same state.

### Limitation

- Feature freeze is a process gate, not a code or visual UI change.
- Supabase credentials and project access are not yet verified; `D13-T01` may require user-provided access or confirmation.

### Next Task

`D13-T01 - Create Supabase project`

---

## SR-060 - D13-T01: Create Supabase Project

- Date: 2026-07-15
- Status: completed
- Phase: Day 13 - Supabase project and schema

### Objective

Create a real Supabase project for CaseFlow Store.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0002-use-supabase.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`

No production source files were changed.

### Commands Executed

```bash
git status --short
command -v supabase && supabase --version || true
npx --no-install supabase --version || true
test -d "$HOME/.supabase" && find "$HOME/.supabase" -maxdepth 2 -type f -print | sed "s#$HOME#~#" || true
env | awk -F= '/SUPABASE|NEXT_PUBLIC_SUPABASE|DATABASE|POSTGRES|VERCEL/ { printf "%s=<set:%d chars>\n", $1, length($0)-length($1)-1 }' | sort
for file in caseflow-store/.env.local caseflow-store/.env.example .env.local .env.example; do if [ -f "$file" ]; then echo "$file: exists"; awk -F= 'NF && $1 !~ /^#/ { printf "  %s=<%s>\n", $1, ($2 == "" ? "empty" : "set") }' "$file"; else echo "$file: missing"; fi; done
command -v psql && psql --version || true
command -v vercel && vercel --version || true
```

### Actual Result

- Initial local/CLI checks were blocked until the user signed in and created the project through Supabase Dashboard.
- Supabase CLI is not installed.
- A local Supabase package is not installed; `npx --no-install supabase --version` reported it would need to download `supabase@2.109.1`.
- No `~/.supabase` session/config files were found.
- No Supabase, database, Postgres, or Vercel environment variables were set in the shell output.
- `caseflow-store/.env.local` is missing.
- `caseflow-store/.env.example` exists and contains empty Supabase placeholders.
- `psql` and Vercel CLI are not installed.
- Follow-up unblock attempt opened Supabase Dashboard in both the in-app browser and Chrome; both showed the Supabase sign-in screen.
- User then signed in and created the Supabase project in Chrome.
- Verified project `caseflow-store` in `NVTruong473's Org`.
- Verified project ref `fcsuldrerhbynwotcvyn`.
- Verified public project URL `https://fcsuldrerhbynwotcvyn.supabase.co`.
- Saved visual artifact `caseflow-store/.agent/artifacts/d13-t01-supabase-project-dashboard.png`.
- No service role key or database password was printed or stored.

### Verification

- Access and credential checks were run without printing secret values.
- Browser dashboard verification confirmed the project exists.
- The roadmap and proof-of-connection docs now record the project metadata and remaining integration work.

### Limitation

This task created the project only. `.env.local`, schema application, RLS verification, seed data, and repository integration remain incomplete and must be handled by the following roadmap tasks.

### Next Task

`D13-T02 - Install Supabase packages`

---

## SR-061 - D13-T02: Install Supabase Packages

- Date: 2026-07-15
- Status: completed
- Phase: Day 13 - Supabase project and schema

### Objective

Install Supabase packages required for the Next.js App Router integration.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `caseflow-store/AGENTS.md`

### Files Changed

- `caseflow-store/package.json`
- `caseflow-store/package-lock.json`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`

### Commands Executed

```bash
npm install @supabase/supabase-js @supabase/ssr
npm ls @supabase/supabase-js @supabase/ssr
npm audit --json
npm run lint
npx tsc --noEmit
git diff --check
```

### Actual Result

- Installed `@supabase/supabase-js` `^2.110.5`.
- Installed `@supabase/ssr` `^0.12.3`.
- Updated `caseflow-store/package.json` and `caseflow-store/package-lock.json`.
- Did not install the Supabase CLI package.

### Verification

- `npm ls @supabase/supabase-js @supabase/ssr`: passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

### Limitation

- `npm audit --json` still reports 2 moderate findings through Next.js bundled PostCSS. The suggested `npm audit fix --force` path would downgrade Next.js to `9.3.3`, so it was not run.
- `.env.local` is still missing.
- Schema SQL has not been applied.
- RLS and seed data are not verified yet.

### Next Task

`D13-T03 - Apply schema SQL`

---

## SR-062 - D13-T03: Apply Schema SQL

- Date: 2026-07-15
- Status: completed
- Phase: Day 13 - Supabase project and schema

### Objective

Apply `caseflow-store/supabase/schema.sql` to the Supabase project.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0002-use-supabase.md`
- `caseflow-store/AGENTS.md`
- `caseflow-store/supabase/schema.sql`

### Files Changed

- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`

No production source files were changed.

### Commands And Actions Executed

```bash
sed -n '1,260p' caseflow-store/supabase/schema.sql
rg -n "create table|alter table|policy|row level|enable row|cart|service_role|anon|auth|order|product|category|profile" caseflow-store/supabase/schema.sql
```

Browser action:

- Opened Supabase SQL Editor for project `fcsuldrerhbynwotcvyn`.
- Pasted `caseflow-store/supabase/schema.sql`.
- Ran the schema SQL.
- Ran a verification SQL query against `information_schema`, `pg_type`, `pg_class`, `pg_trigger`, and `pg_policies`.

### Actual Result

- Supabase SQL Editor returned `Success. No rows returned` for schema application.
- Created or verified enum type `public.order_status`.
- Created or verified public tables: `profiles`, `categories`, `products`, `orders`, and `order_items`.
- Created or verified expected updated-at triggers.
- Created or verified public read policies for active categories/products and own-profile reads.
- No cart table was created.

### Verification

Verification query returned:

```json
{
  "rls_enabled": {
    "orders": true,
    "products": true,
    "profiles": true,
    "categories": true,
    "order_items": true
  },
  "policy_count": 3,
  "trigger_count": 4,
  "expected_tables": ["categories", "order_items", "orders", "products", "profiles"],
  "cart_table_count": 0,
  "expected_table_count": 5,
  "order_status_type_count": 1
}
```

Visual artifact:

- `caseflow-store/.agent/artifacts/d13-t03-schema-verification.png`

### Limitation

- D13-T03 applied the schema and ran a first verification query. D13-T04 should still perform dedicated RLS/policy acceptance because it is a separate roadmap task.
- `.env.local` is still missing.
- Seed data has not been inserted yet.
- The app still uses mock repositories.

### Next Task

`D13-T04 - Enable RLS`

---

## SR-063 - D13-T04: Enable RLS

- Date: 2026-07-15
- Status: completed
- Phase: Day 13 - Supabase project and schema

### Objective

Enable and verify RLS for the Supabase schema.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0002-use-supabase.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/AGENTS.md`
- `caseflow-store/supabase/schema.sql`

### Files Changed

- `caseflow-store/supabase/schema.sql`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`

### Commands And Actions Executed

```bash
sed -n '192,232p' caseflow-store/supabase/schema.sql
```

Browser action:

- Applied explicit RLS enable statements plus Data API grants/revokes in Supabase SQL Editor.
- Ran a metadata query over `pg_class`, `pg_policies`, and `has_table_privilege`.
- Ran a rollback behavior test under role `anon`.
- Ran a rollback cleanup check after the behavior test.

### Actual Result

- RLS is enabled for `profiles`, `categories`, `products`, `orders`, and `order_items`.
- `caseflow-store/supabase/schema.sql` now contains explicit grants/revokes:
  - `anon` and `authenticated` can select `categories` and `products`.
  - `authenticated` can select `profiles`.
  - `anon` cannot select `profiles`.
  - `anon` and `authenticated` cannot directly select or insert `orders` or `order_items`.
- Policy surface remains three SELECT policies:
  - `Public can read active categories`.
  - `Public can read active products`.
  - `Users can read own profile`.

### Verification

Metadata query returned:

```json
{
  "rls_enabled": {
    "orders": true,
    "products": true,
    "profiles": true,
    "categories": true,
    "order_items": true
  },
  "direct_role_privileges": {
    "anon.categories.select": true,
    "anon.products.select": true,
    "anon.profiles.select": false,
    "anon.orders.select": false,
    "anon.orders.insert": false,
    "anon.order_items.select": false,
    "anon.order_items.insert": false,
    "authenticated.categories.select": true,
    "authenticated.products.select": true,
    "authenticated.profiles.select": true,
    "authenticated.orders.select": false,
    "authenticated.orders.insert": false,
    "authenticated.order_items.select": false,
    "authenticated.order_items.insert": false
  }
}
```

Rollback behavior query returned:

```json
{
  "current_user": "anon",
  "visible_category_slugs": ["phone-cases"],
  "visible_product_slugs": ["rls-t04-visible-product"],
  "anon_orders_select_privilege": false,
  "anon_orders_insert_privilege": false,
  "anon_order_items_select_privilege": false,
  "anon_order_items_insert_privilege": false
}
```

Final rollback cleanup returned:

```json
{
  "rls_t04_order_rows_after_rollback": 0,
  "rls_t04_product_rows_after_rollback": 0,
  "rls_t04_order_item_rows_after_rollback": 0
}
```

Visual artifact:

- `caseflow-store/.agent/artifacts/d13-t04-rls-behavior-check.png`

### Limitation

- `.env.local` is still missing.
- Seed data has not been inserted yet.
- The app still uses mock repositories.
- Admin role policies are not implemented yet; Day 15 must handle Supabase Auth/admin authorization.

### Next Task

`D13-T05 - Seed categories and products`

---

## SR-064 - D13-T05: Seed categories and products

- Date: 2026-07-15
- Status: completed
- Phase: Day 13 - Supabase project and schema

### Objective

Seed the real Supabase catalog with the CaseFlow Store categories and products.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0002-use-supabase.md`
- `caseflow-store/AGENTS.md`
- `caseflow-store/src/data/mock/catalog.ts`
- `caseflow-store/src/types/domain.ts`
- `caseflow-store/supabase/schema.sql`

### Files Changed

- `caseflow-store/supabase/seed.sql`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`

### Commands And Actions Executed

```bash
npx --yes tsx -e "import { mockCategories, mockProducts } from './src/data/mock/catalog'; console.log(JSON.stringify({ categories: mockCategories.length, products: mockProducts.length }, null, 2))"
sed -n '1,260p' caseflow-store/supabase/seed.sql
git diff --check
```

Browser action:

- Pasted `caseflow-store/supabase/seed.sql` into Supabase SQL Editor for project `fcsuldrerhbynwotcvyn`.
- Ran the seed SQL.
- Read the returned `seed_check` result.
- Captured a visual verification screenshot.

### Actual Result

- Created `caseflow-store/supabase/seed.sql`.
- Seed SQL is idempotent and uses `on conflict (slug) do update`.
- Seed SQL inserted or updated 5 categories and 16 products from `src/data/mock/catalog.ts`.
- Category and product UUIDs are deterministic and aligned with the mock catalog.

### Verification

Supabase SQL Editor returned:

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

Visual artifact:

- `caseflow-store/.agent/artifacts/d13-t05-seed-verification.png`

### Limitation

- `.env.local` is still missing, so the Next.js app cannot use Supabase yet.
- D13-T05 verifies seed insertion through SQL Editor as role `postgres`; RLS public-read behavior was verified separately in D13-T04.
- The app still uses mock repositories until Day 14 repository integration.

### Next Task

`D14-T01 - Create Supabase server and browser clients`

---

## SR-065 - D14-T01: Create Supabase server and browser clients

- Date: 2026-07-15
- Status: completed
- Phase: Day 14 - Product repository

### Objective

Create browser and server Supabase client factories for the Next.js app.

### Required Reading

- `AGENTS.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`
- Latest `.agent/step-results.md`
- `docs/architecture.md`
- `docs/adr/0002-use-supabase.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/AGENTS.md`
- `caseflow-store/supabase/schema.sql`
- `node_modules/@supabase/ssr/README.md`
- `node_modules/@supabase/ssr/dist/main/createBrowserClient.d.ts`
- `node_modules/@supabase/ssr/dist/main/createServerClient.d.ts`
- `node_modules/@supabase/ssr/dist/main/types.d.ts`
- `node_modules/next/dist/server/request/cookies.d.ts`

### Files Changed

- `caseflow-store/src/types/supabase.ts`
- `caseflow-store/src/lib/supabase/env.ts`
- `caseflow-store/src/lib/supabase/browser.ts`
- `caseflow-store/src/lib/supabase/server.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `docs/supabase-proof-of-connection.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`
- `caseflow-store/docs/supabase-proof-of-connection.md`

### Commands Executed

```bash
npm run lint
npx tsc --noEmit
git diff --check
npm run build
```

### Actual Result

- Added generated-style raw Supabase `Database` types aligned with `supabase/schema.sql`.
- Added `getSupabasePublicEnv()` for public Supabase URL and anon key checks.
- Added `createSupabaseBrowserClient()` in a `"use client"` module.
- Added async `createSupabaseServerClient()` using Next.js `cookies()` and `@supabase/ssr`.
- Removed the mixed server/browser barrel export to avoid Client Components accidentally importing `next/headers`.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Production build generated 31 static pages and compiled dynamic API routes successfully.

### Limitation

- `.env.local` is still missing, so live Supabase reads are not available in the app yet.
- The app still uses mock repositories until `D14-T03`.
- The server client uses anon key plus RLS. Service role usage is intentionally not introduced in this task.

### Next Task

`D14-T02 - Implement row-to-domain mapping`

---

## SR-066 - D14-T02: Implement row-to-domain mapping

- Date: 2026-07-15
- Status: completed
- Phase: Day 14 - Product repository

### Objective

Convert raw Supabase catalog rows into the camelCase domain objects consumed by the application.

### Files Changed

- `caseflow-store/src/lib/supabase/mappers.ts`
- `.agent/todo-roadmap.md`
- `.agent/project-context.md`
- `.agent/step-results.md`
- `caseflow-store/.agent/todo-roadmap.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/step-results.md`

### Actual Result

- Added `mapCategoryRowToDomain()` for `categories` rows.
- Added `mapProductRowToDomain()` for `products` rows.
- Converted raw database fields from snake_case to domain camelCase.
- Parsed both mapped objects through existing Zod schemas.
- Copied product compatibility arrays to avoid sharing mutable raw-row state.

### Verification

- Runtime check mapped valid category/product rows.
- Runtime check confirmed camelCase output and a copied compatibility array.
- Runtime check confirmed a negative product price is rejected with a Zod error.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed; 31 routes/pages generated successfully.

### Scope Note

- Only catalog rows were mapped because Day 14 owns the product repository. Order mapping remains part of the Day 15 persistence work.
- The app still uses mock repositories until D14-T03.

### Next Task

`D14-T03 - Replace mock product repository with Supabase repository`

---

## SR-067 - D14-T03: Replace mock product repository with Supabase repository

- Date: 2026-07-15
- Status: completed
- Phase: Day 14 - Product repository

### Objective

Connect the live storefront catalog flow to the seeded Supabase project while preserving domain validation and RLS boundaries.

### Actual Result

- Configured ignored local public Supabase environment values.
- Added async Supabase category/product/detail/filter/cart-validation repository functions.
- Replaced live homepage, product detail, catalog APIs, cart drawer, and checkout catalog reads.
- Returned mapped and Zod-validated domain objects instead of raw database rows.
- Kept only the isolated catalog-state preview and Day 15 order mock on mock data.

### Verification

- Live APIs returned 5 categories, 16 products, 6 featured products, and 4 phone-case products.
- Product detail, ascending sort, and homepage rendering passed.
- Cart validation recalculated two `329000` VND products to `658000` VND from database data.
- API output did not expose raw snake_case product fields.
- `.env.local` remains ignored and no service-role reference exists in `src`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed; homepage and product detail are now dynamic routes.

### Next Task

`D14-T04 - Retest storefront`

---

## SR-068 - D14-T04: Retest storefront

- Date: 2026-07-15
- Status: completed
- Phase: Day 14 - Product repository

### Objective

Verify the production storefront after replacing live mock catalog reads with Supabase.

### Verification

- Production homepage showed 5 categories, 16 products, and 6 featured products.
- Category filter showed 4 phone-case products.
- Product detail showed the seeded AeroGuard product with current price and stock.
- Cart and checkout both showed quantity 2 and subtotal `658000` VND.
- Focused Playwright storefront/cart/checkout run passed `7/7`.
- Three Chrome visual artifacts were captured for storefront, cart drawer, and checkout.

### Honest Test Note

- The first broader run passed 7 tests and failed 2 admin tests because production-mode mock admin token behavior did not satisfy the old test setup.
- These failures are scheduled for Day 15 auth/order replacement and were not counted as storefront passes.

### Next Task

`D15-T01 - Create order and order items safely`

---

## SR-069 - D15-T01: Create order and order items safely

- Date: 2026-07-15
- Status: completed
- Phase: Day 15 - Orders and admin auth

### Objective

Persist an order header and its line items atomically through a server-only Supabase boundary.

### Actual Result

- Added strict trusted order-command validation and order/order-item row mappers.
- Added a server-only Supabase admin client with an ignored service-role credential.
- Added a `security definer` RPC that inserts the order and all items in one transaction.
- Restricted RPC execution to `service_role` and kept direct order access denied to anon and authenticated roles.
- Added explicit service-role privileges for trusted backend persistence and administration.

### Verification

- Live role checks confirmed only `service_role` can execute the RPC.
- A forced item constraint failure rolled back the order and left zero orphan rows.
- Live repository verification created one order and one item, then deleted both successfully.
- An inconsistent subtotal was rejected before a database write.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t01-service-role-verification.png`.

### Scope Note

- `POST /api/orders` remains on the mock repository until D15-T02 activates live persistence together with server-side price and stock recalculation.

### Next Task

`D15-T02 - Recalculate price server-side`

---

## SR-070 - D15-T02: Recalculate price server-side

- Date: 2026-07-15
- Status: completed
- Phase: Day 15 - Orders and admin auth

### Objective

Make the order API ignore browser-owned commerce values and persist totals rebuilt from current Supabase catalog data.

### Actual Result

- Replaced mock order creation with live cart validation and atomic Supabase persistence.
- Rebuilt product names, unit prices, line totals, stock decisions, and subtotal on the server.
- Preserved stable 404, 409, and 500 error behavior without exposing backend details.

### Verification

- A payload with forged unit price and subtotal `1` persisted unit price `329000` and subtotal `658000` for quantity 2.
- Persisted product name came from Supabase, not the browser payload.
- Missing product returned 404 and excess stock returned 409.
- Playwright checkout suite passed `2/2` against the live order route.
- All HTTP and Playwright QA orders were removed from Supabase.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t02-live-order-success.png`.

### Next Task

`D15-T03 - Configure admin account and role`

---

## SR-071 - D15-T03: Configure admin account and role

- Date: 2026-07-15
- Status: completed
- Phase: Day 15 - Orders and admin auth

### Objective

Provision a dedicated Supabase Auth identity whose database profile is explicitly assigned the admin role.

### Actual Result

- Created and email-confirmed a dedicated synthetic CaseFlow admin user.
- Upserted its `profiles` row with display name `CaseFlow Admin` and role `admin`.
- Stored the generated login values only in ignored `.env.local` without printing the password.
- Restricted `.env.local` permissions to `0600`.

### Verification

- Public password sign-in succeeded for the dedicated user.
- The authenticated session read its own profile through RLS and received role `admin`.
- `.env.local` remains ignored and admin credentials are not referenced from `src`.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t03-supabase-admin-account.png`.

### Next Task

`D15-T04 - Protect admin pages and APIs`

---

## SR-072 - D15-T04: Protect admin pages and APIs

- Date: 2026-07-15
- Status: completed
- Phase: Day 15 - Orders and admin auth

### Objective

Replace mock admin authorization with verified Supabase sessions and role checks at every server boundary.

### Actual Result

- Added validated Supabase cookie login/logout and Next.js 16 session-refresh Proxy.
- Added centralized `auth.getUser()` plus own-profile `admin` role verification.
- Protected the admin Server Component and both admin order Route Handlers.
- Moved admin order list and status update operations to the live server-only Supabase repository.
- Removed mock admin token/sessionStorage code.
- Fixed a duplicate footer React key exposed by visual QA.

### Verification

- Anonymous API: 401; anonymous page: redirect to login.
- Wrong password: 401.
- Admin cookie: protected page/API 200, live order visible, status persisted.
- Sign-out: cookies cleared and subsequent API request returned 401.
- Production build repeated redirect, cookie auth, and sign-out successfully.
- All QA orders were removed.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build`: passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d15-t04-protected-admin-orders.png`.

### Next Task

`D15-T05 - Test anonymous, normal user, and admin access`

---

## SR-073 - D15-T05: Test anonymous, normal user, and admin access

- Date: 2026-07-15
- Status: completed
- Phase: Day 15 - Orders and admin auth

### Objective

Prove the final order/admin authorization model with real Supabase identities, cookies, RLS, protected Next.js routes, and production E2E flows.

### Actual Result

- Added a real three-role Playwright access matrix.
- Added temporary customer provisioning and automatic Auth/order cleanup helpers.
- Migrated prior admin focus/state tests from mock tokens to real Supabase login.
- Added cleanup to all E2E tests that create live orders.

### Verification

- Anonymous: catalog allowed; admin page/API and direct order reads denied.
- Customer: own profile readable; admin page/API and direct order reads denied with 403 at the app role boundary.
- Admin: protected page/API allowed, live order listed, status update persisted, sign-out restored 401.
- Focused access suite: `3/3` passed.
- Full production Playwright suite: `12/12` passed.
- Cleanup: 0 test orders and 0 temporary customers remained.
- Security scan: 26 client assets scanned, 0 service/admin secret value leaks, `.env.local` mode `0600`.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `npm run build`: passed.
- Visual artifacts: `caseflow-store/.agent/artifacts/d15-t05-customer-forbidden.png` and `d15-t05-admin-access-matrix.png`.

### Next Task

`D16-T01 - Finalize .env.example`

---

## SR-074 - D16-T01: Finalize `.env.example`

- Date: 2026-07-15
- Status: completed
- Phase: Day 16 - Environment, errors, and integration freeze

### Objective

Make the checked-in environment template an exact, sanitized contract for current application runtime and E2E configuration.

### Actual Result

- Documented the two browser-safe Supabase variables and the server-only service-role variable.
- Documented admin email/password as Playwright-only values, not deployed application runtime configuration.
- Removed the obsolete mock admin token and the unused public site URL.
- Left optional Playwright port/base URL overrides commented so copying the file does not set an empty override.

### Verification

- Automated source/template comparison found 5 used keys and the same 5 active template keys.
- Missing keys: 0; stale active keys: 0; populated placeholders: 0.
- Root and app Supabase credential guidance were synchronized.

### Next Task

`D16-T02 - Verify no secret is committed`

---

## SR-075 - D16-T02: Verify no secret is committed

- Date: 2026-07-15
- Status: completed
- Phase: Day 16 - Environment, errors, and integration freeze

### Objective

Prevent local credentials and unrelated sensitive files from entering Git, then scan commit candidates and build output for leaked secret values.

### Actual Result

- Added root ignore rules for environment files, OS metadata, and the unrelated local `password manager/` directory.
- Confirmed `.env.local` is ignored and remains mode `0600`.
- Preserved `.env.example` as a commit candidate.

### Verification

- 299 commit-candidate files: 0 exact service-role/admin-password hits and 0 common secret-pattern hits.
- 397 `.next/static` and `.next/server` files: 0 exact sensitive-value hits.
- Visual artifact: `caseflow-store/.agent/artifacts/d16-t02-secret-scan.json`.

### Limitation

No Git `HEAD` exists yet, so there is no committed history to scan. The same scan must run before D19 creates and pushes the first commit.

### Next Task

`D16-T03 - Add stable API error codes`

---

## SR-076 - D16-T03: Add stable API error codes

- Date: 2026-07-15
- Status: completed
- Phase: Day 16 - Environment, errors, and integration freeze

### Objective

Make server error codes a compile-time and documented compatibility contract instead of arbitrary strings.

### Actual Result

- Added a 13-code source of truth and constrained `apiError` to its generated union.
- Documented the envelope, HTTP mapping, and client compatibility rule.
- Added Playwright coverage for stable public and admin error responses.

### Verification

- 8 Route Handlers: 0 undeclared literal codes.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build`: passed.
- Production API contract suite: `2/2` passed.
- Visual contract: `caseflow-store/docs/api-contract.md`.

### Next Task

`D16-T04 - Deploy integration preview`

---

## SR-077 - D16-T04: Deploy integration preview

- Date: 2026-07-15
- Status: completed
- Phase: Day 16 - Environment, errors, and integration freeze

### Objective

Deploy a real Vercel preview with live Supabase runtime configuration and prove the integrated application behavior.

### Actual Result

- Created a free Vercel workspace/project and configured three Preview runtime variables without logging values.
- Added a deployment ignore boundary and corrected its initial overbroad Supabase directory match.
- Deployed a Vercel-authenticated preview in Ready state.

### Verification

- Home 200; categories/products 5/16; stable missing-product 404; anonymous admin 401.
- Live order 201 with subtotal `329000`, followed by cleanup 1/1.
- Admin login/list/logout/post-logout: 200/200/200/401.
- Browser console errors/warnings: 0.
- Preview: `https://caseflow-store-74nu9i3d7-nvt-ruong473.vercel.app`.
- Visual artifacts: `caseflow-store/.agent/artifacts/d16-t04-vercel-preview.png` and `d16-t04-vercel-preview.json`.

### Next Task

`D16-T05 - Run npm run lint && npm run build`

---

## SR-078 - D16-T05: Run `npm run lint && npm run build`

- Date: 2026-07-15
- Status: completed
- Phase: Day 16 - Environment, errors, and integration freeze

### Objective

Run the final Day 16 local quality gate after environment, security, API contract, and preview deployment work.

### Verification

- Exact command `npm run lint && npm run build`: passed.
- Next.js compile and TypeScript checks: passed.
- Static pages generated: 16.
- Post-Vercel sensitive values checked: service role, admin password, and OIDC token.
- 307 pre-report commit candidates and 397 build files: 0 exact sensitive-value hits.
- Remaining D16 preview QA orders: 0.
- Visual artifact: `caseflow-store/.agent/artifacts/d16-t05-final-gate.json`.

### Result

Day 16 is complete. Feature freeze and integration freeze are active.

### Next Task

`D17-T01 - Reassess and harden the existing Playwright configuration`

---

## SR-079 - D17-T01: Reassess and harden Playwright configuration

- Date: 2026-07-16
- Status: completed
- Phase: Day 17 - E2E happy path

### Objective

Turn the early Playwright skeleton into a deterministic, fail-fast E2E configuration without pretending to reinstall completed tooling.

### Actual Result

- Added strict CI boolean, base URL, and port parsing plus global validation for required E2E environment variables.
- Added bounded action and navigation timeouts and retained one worker for the shared live Supabase backend.
- Disabled local server reuse after proving that a stale 12-hour-old server could return obsolete API behavior.

### Verification

- `npm run lint` and `npx tsc --noEmit`: passed.
- Discovery: 14 tests in 5 files.
- Invalid `PLAYWRIGHT_PORT`: rejected before test execution.
- Focused Chromium production API suite on clean port: `2/2` passed.
- Visual artifact: `caseflow-store/.agent/artifacts/d17-t01-playwright-hardening.json`.

### Next Task

`D17-T02 - Test homepage to product to cart to checkout to success`

---

## SR-080 - D17-T02: Test storefront checkout happy path

- Date: 2026-07-16
- Status: completed
- Phase: Day 17 - E2E happy path

### Objective

Prove the complete customer purchase journey through real browser interactions rather than direct cart storage seeding.

### Actual Result

- Added a focused UI flow from homepage to product detail, quantity 2, add-to-cart feedback, cart drawer, checkout, and success.
- Asserted the order API response and server-calculated subtotal as well as cart and success storage state.

### Verification

- `npm run lint` and `npx tsc --noEmit`: passed.
- Focused Chromium test: passed.
- Order response: 201 with subtotal `658000`.
- Remaining QA orders after cleanup: 0.
- Visual artifact: `caseflow-store/.agent/artifacts/d17-t02-storefront-checkout-success.png`.

### Next Task

`D17-T03 - Test checkout validation failure`

---

## SR-081 - D17-T03: Test checkout validation failure

- Date: 2026-07-16
- Status: completed
- Phase: Day 17 - E2E happy path

### Objective

Prove invalid customer details are visible, accessible, and blocked before any order mutation reaches the server.

### Actual Result

- Added empty-field and malformed or over-limit coverage for name, email, phone, and shipping address.
- Asserted `aria-invalid`, linked error descriptions, idle form state, and no navigation away from checkout.

### Verification

- `npm run lint` and `npx tsc --noEmit`: passed.
- Focused Chromium test: `1/1` passed.
- Invalid-form `POST /api/orders` count: 0.
- Visual artifact: `caseflow-store/.agent/artifacts/d17-t03-checkout-validation.png`.

### Next Task

`D17-T04 - Test admin login and status update`

---

## SR-082 - D17-T04: Test admin login and status update

- Date: 2026-07-16
- Status: completed
- Phase: Day 17 - E2E happy path

### Objective

Prove an authenticated admin can update one exact live order and that UI state agrees with persisted backend state.

### Actual Result

- Added a dedicated admin login and pending-to-confirmed workflow with isolated QA data.
- Verified the protected PATCH response, status success UI, row badge, Supabase row, sign-out redirect, and post-sign-out 401.

### Verification

- `npm run lint` and `npx tsc --noEmit`: passed.
- Focused Chromium test: `1/1` passed.
- Remaining QA orders after cleanup: 0.
- Visual artifact: `caseflow-store/.agent/artifacts/d17-t04-admin-status-update.png`.

### Next Task

`D17-T05 - Run npx playwright test`

---

## SR-083 - D17-T05: Run the complete Playwright suite

- Date: 2026-07-16
- Status: completed
- Phase: Day 17 - E2E happy path

### Objective

Run the complete E2E gate on a deterministic production server and leave no live test data behind.

### Verification

- Exact command `npx playwright test`: passed.
- Chromium: 17/17 passed across 8 spec files in 1.3 minutes.
- Failed, flaky, and skipped tests: 0.
- Remaining QA orders: 0.
- Remaining temporary customer users: 0.
- Playwright production server stopped cleanly.
- Visual artifacts: `caseflow-store/.agent/artifacts/d17-t05-playwright-report.png`, `d17-t05-playwright-suite.json`, and `caseflow-store/playwright-report/index.html`.

### Result

Day 17 is complete. Feature and integration freeze remain active.

### Next Task

`D18-T01 - Test empty cart`

---

## SR-084 - D18-T01: Test empty cart

- Date: 2026-07-16
- Status: completed
- Phase: Day 18 - Edge cases and release candidate

### Verification

- Focused Chromium test: `1/1` passed.
- Cart count: 0.
- Drawer and checkout empty states: visible.
- Checkout action and order form: absent.
- Invalid order creation requests: 0.
- Visual artifacts: `d18-t01-empty-cart-drawer.png` and `d18-t01-empty-checkout.png`.

### Next Task

`D18-T02 - Test missing product`

---

## SR-085 - D18-T02: Test missing product

- Date: 2026-07-16
- Status: completed
- Phase: Day 18 - Edge cases and release candidate

### Verification

- Product API: `404/PRODUCT_NOT_FOUND` with stable envelope.
- Product route: HTTP 404 with visible fallback.
- Purchase controls: absent.
- Browse products: returned to the 16-product catalog.
- Focused Chromium test: `1/1` passed.
- Visual artifact: `d18-t02-missing-product.png`.

### Next Task

`D18-T03 - Test out-of-stock or invalid quantity`

---

## SR-086 - D18-T03: Test out-of-stock and invalid quantity

- Date: 2026-07-16
- Status: completed
- Phase: Day 18 - Edge cases and release candidate

### Verification

- API quantity 0: `400/VALIDATION_ERROR`.
- API quantity 19 against stock 18: `409/OUT_OF_STOCK`.
- Product and drawer UI bounds: 1-18 with disabled max increment.
- Tampered local quantity 99: checkout error visible and submit disabled.
- Focused Chromium test: `1/1` passed.
- Visual artifacts: `d18-t03-quantity-max-cart.png` and `d18-t03-out-of-stock-checkout.png`.

### Next Task

`D18-T04 - Run production-like local test with npm run build && npm run start`

---

## SR-087 - D18-T04: Production-like local test

- Date: 2026-07-16
- Status: completed
- Phase: Day 18 - Edge cases and release candidate

### Verification

- Exact `npm run build && npm run start`: passed and Ready.
- Generated pages: 16.
- HTTP checks: 200/200/200/404/401 as expected.
- Representative Playwright flows: `5/5` passed.
- Remaining QA orders: 0.
- Production server: stopped cleanly.
- Visual artifacts: `d18-t04-production-local.png` and `d18-t04-production-local.json`.

### Next Task

`D18-T05 - Mark release candidate only if blockers are closed`

---

## SR-088 - D18-T05: Accept release candidate

- Date: 2026-07-16
- Status: completed
- Phase: Day 18 - Edge cases and release candidate

### Result

Release candidate `v1.0.0-rc.1` is accepted for production deployment.

### Verification

- Lint and TypeScript: passed.
- Production build/start: passed.
- Final Chromium suite: 20/20 passed in 1.6 minutes.
- Failed/flaky/skipped: 0/0/0.
- Commit candidates/exact secret matches: 327/0.
- Remaining QA orders/temporary users: 0/0.
- Dependency audit critical/high: 0/0; accepted moderate: 2.
- Evidence: `docs/release-candidate.md`, `d18-t05-release-candidate-report.png`, and `d18-t05-release-candidate.json`.

### Next Task

`D19-T01 - Push repository`

---

## SR-089 - D19-T01: Push repository

- Date: 2026-07-16
- Status: completed
- Phase: Day 19 - Production deployment

### Verification

- Public repository: `https://github.com/NVTruong473/caseflow-store`.
- Branch: `main`.
- Local/remote commit: `c4e4dfa4a7962057652045134ccbc81b7006fe04`.
- Pre-push exact secret matches: 0 across 331 files.
- `.env.local` and `.vercel`: ignored.

### Next Task

`D19-T02 - Configure production environment variables`

---

## SR-090 - D19-T02: Configure production environment variables

- Date: 2026-07-16
- Status: completed
- Phase: Day 19 - Production deployment

### Verification

- Required Production variables: 3/3 configured.
- Vercel storage: Encrypted.
- Preview variables preserved: 3/3.
- Playwright credentials deployed: no.
- Secret values logged: no.

### Next Task

`D19-T03 - Deploy preview and smoke test`

---

## SR-091 - D19-T03: Deploy preview and smoke test

- Date: 2026-07-16
- Status: completed
- Phase: Day 19 - Production deployment

### Verification

- Deployment: `dpl_EDqtfK9XuinEoKmCQjMMuY9GDagw`, Ready.
- Home/categories/products: 200 / 5 / 16.
- Missing product: `404/PRODUCT_NOT_FOUND`.
- Anonymous admin: `401/UNAUTHORIZED`.
- Order: 201 with server subtotal `329000`.
- QA cleanup: 0.

### Next Task

`D19-T04 - Deploy production`

---

## SR-092 - D19-T04: Deploy production

- Date: 2026-07-16
- Status: completed
- Phase: Day 19 - Production deployment

### Verification

- Deployment: `dpl_4Wocg3yqgFoSUSCR76jvN6xL2esu`, Ready.
- Canonical alias: `https://caseflow-store.vercel.app`.
- Canonical alias HTTP status: 200.
- Visual check: full 5-category, 16-product storefront rendered without layout failures.

### Next Task

`D19-T05 - Test storefront, checkout, and admin on production`

---

## SR-093 - D19-T05: Test storefront, checkout, and admin on production

- Date: 2026-07-16
- Status: completed
- Phase: Day 19 - Production deployment

### Verification

- Initial production suite: 18/20; exposed and fixed an admin post-login navigation race.
- Replacement deployment: `dpl_D5GLc5s5WbDs4xB3d22kXieyDCpz`, Ready.
- Lint/build: passed; 16 routes generated.
- Final production suite: 20 passed, 0 failed/flaky/skipped in 2.8 minutes.
- QA cleanup: 0 orders, 0 temporary users.

### Next Task

`D20-T01 - Finalize README`

---

## SR-094 - D20-T01: Finalize README

- Date: 2026-07-16
- Status: completed
- Phase: Day 20 - Acceptance and portfolio packaging

### Verification

- Repository README: portfolio overview, production URL, verified scope, stack, architecture, setup, commands, and release evidence.
- Application README: focused local setup and quality gates.
- Relative link check: 0 missing across 2 README files.
- Whitespace check: passed.
- Secret values: none documented.

### Next Task

`D20-T02 - Finalize architecture summary and ADR index`

---

## SR-095 - D20-T02: Finalize architecture summary and ADR index

- Date: 2026-07-16
- Status: completed
- Phase: Day 20 - Acceptance and portfolio packaging

### Verification

- As-built architecture: production containers, boundaries, flows, data, security, deployment, and limitations documented.
- ADR index: 5 accepted decisions with production outcomes.
- Root/application mirrors: identical.
- Relative link check: 0 missing across 4 files.
- Whitespace check: passed.

### Next Task

`D20-T03 - Capture desktop/mobile screenshots`

---

## SR-096 - D20-T03: Capture desktop/mobile screenshots

- Date: 2026-07-16
- Status: completed
- Phase: Day 20 - Acceptance and portfolio packaging

### Verification

- Production screenshots: 4 PNG files.
- Widths: 1440px desktop and 375px mobile.
- Visual inspection: 0 blank, crop, or overlap failures.
- README embedding: complete with descriptive alt text.

### Next Task

`D20-T04 - Document known limitations`

---

## SR-097 - D20-T04: Document known limitations

- Date: 2026-07-16
- Status: completed
- Phase: Day 20 - Acceptance and portfolio packaging

### Verification

- Verified limitations documented: 8.
- Each item includes impact, current control, and next step.
- Dependency audit: 0 critical/high/low, 2 moderate.
- Root/application mirrors: identical; whitespace check passed.
- README link: present.

### Next Task

`D20-T05 - Write CV bullets using only verified evidence`

---

## SR-098 - D20-T05: Write CV bullets using only verified evidence

- Date: 2026-07-16
- Status: completed
- Phase: Day 20 - Acceptance and portfolio packaging

### Verification

- Recommended CV bullets: 3.
- Focus-specific alternatives: 6.
- Evidence ledger entries: 9.
- Unverified scale/percentage/elapsed-time claims: 0.
- Root/application mirrors: identical; whitespace check passed.

### Next Task

`D20-T06 - Create release tag v1.0.0`

---

## SR-099 - D20-T06: Create release tag v1.0.0

- Date: 2026-07-16
- Status: completed
- Phase: Day 20 - Acceptance and portfolio packaging

### Verification

- Mirror/diff/secret checks: passed; 49 candidates, 0 exact/high-confidence secret matches.
- Lint/build: passed; 16 routes generated.
- Local Playwright: 20 passed, 0 failed/flaky/skipped in 1.4 minutes.
- Production Playwright: 20 passed, 0 failed/flaky/skipped in 2.8 minutes.
- Production smoke: home 200, categories/products 5/16, anonymous admin 401.
- QA cleanup: 0 orders, 0 temporary users.
- Release tag: annotated `v1.0.0` created.

### Next Task

`Entry 01 - Environment preflight`

---

## SR-100 - Journal Entries 01-30

- Date: 2026-07-16
- Status: completed
- Phase: Journal documentation

### Objective

Create the 30 project journal entries after the `v1.0.0` release without misrepresenting the timeline.

### Actual Result

- Created `docs/journal/README.md`.
- Created Entries 01-20 as real implementation journal entries.
- Created Entries 21-30 as retrospective notes explicitly marked as not additional development days.
- Updated the roadmap to mark all journal entries complete.
- Updated project context with journal status and the post-`v1.0.0` planning direction that must be formalized by ADR before Day 21 implementation.

### Verification

- Journal file count: 31 Markdown files including the index.
- Root/app journal mirrors match.
- Root/app `.agent` tracker mirrors match.
- Entries 21-30 include retrospective labels.

### Next Task

Create the post-MVP ADR and Day 21-40 roadmap for `CaseFlow Books` before any Day 21 implementation.

---

## SR-101 - D21-T01: Create post-MVP ADR for CaseFlow Books

- Date: 2026-07-16
- Status: completed
- Phase: Day 21 - Post-MVP planning gate

### Objective

Formalize the CaseFlow Books `v1.1` pivot before any runtime implementation.

### Actual Result

- Created `docs/adr/0006-pivot-to-caseflow-books.md`.
- Updated `docs/adr/README.md` with ADR-0006.
- Mirrored ADR files into `caseflow-store/docs/adr/`.
- Updated root/app `.agent` trackers and project context.

### Decision Summary

- `v1.1` product identity is `CaseFlow Books`.
- Market is Vietnam-first, with English mode as a secondary language experience.
- Existing Next.js modular monolith, Supabase, mock-first discipline, local cart, and simulated checkout decisions remain in force.
- Catalog direction is about 100 book editions, with careful handling of real book metadata, covers, descriptions, and translations.
- Checkout remains simulated but can represent COD, bank transfer, MoMo, ZaloPay, and VNPay-style flows.
- Checkout requires a customer account and required contact/shipping information.
- Roles expand toward admin, staff/operator, and customer.
- Business-management scope includes product, category, stock, promotion, customer, order, sales, and inventory visibility.
- A rule-based bookstore assistant is accepted before any AI chatbot integration.

### Critical Guardrails

- Do not copy copyrighted book covers or descriptions without permission or a clearly permitted source.
- Do not claim real payment success for simulated flows.
- Do not claim phone verification without a real provider.
- Treat VAT, FX rates, and international payment fees as configurable estimates, not legal facts.
- Do not implement runtime changes before the Day 21-40 roadmap is accepted.

### Verification

- ADR exists in root/app mirrors.
- ADR index includes ADR-0006 in root/app mirrors.
- Root/app `.agent` tracker mirrors match.
- `git diff --check`: passed.

### Next Task

`D21-T02 - Create Day 21-40 roadmap for CaseFlow Books`

---

## SR-102 - D21-T02: Create Day 21-40 roadmap for CaseFlow Books

- Date: 2026-07-16
- Status: completed
- Phase: Day 21 - Post-MVP planning gate

### Objective

Create a concrete Day 21-40 roadmap for CaseFlow Books with task IDs,
acceptance criteria, verification, freeze gates, and out-of-scope boundaries.

### Actual Result

- Created `docs/v1.1-caseflow-books-roadmap.md`.
- Mirrored the roadmap to `caseflow-store/docs/v1.1-caseflow-books-roadmap.md`.
- Updated `.agent/todo-roadmap.md` with Day 22-40 task IDs and current task
  `D22-T01`.
- Updated `.agent/project-context.md` with the accepted roadmap source and
  freeze-gate targets.

### Scope Captured

- Book domain and content policy.
- Book schema, migration, seed data, safe cover strategy, repositories, and
  catalog APIs.
- CaseFlow Books branding, Vietnamese/English mode, and currency display rules.
- Bookstore homepage, catalog, filters, detail pages, edition selection, and
  cart.
- Customer account, account-gated checkout, payment simulation, shipping/tax/FX
  estimates, customer order history, and guarded order tracking.
- Admin/staff roles, catalog management, inventory adjustment, promotions,
  customer management, order operations, dashboard metrics, and CSV export.
- Rule-based assistant, SEO, accessibility, performance, deployment, docs, and
  `v1.1.0` release tagging.

### Verification

- Root/app roadmap mirrors match.
- Roadmap links resolve.
- Root/app `.agent` tracker mirrors match.
- Trailing-whitespace check passes.
- `git diff --check`: passed.

### Next Task

`D22-T01 - Create Book Domain And Content Policy`

---

## SR-103 - D22-T01: Create Book Domain And Content Policy

- Date: 2026-07-16
- Status: completed
- Phase: Day 22 - Book domain and content policy

### Objective

Replace the old active phone-accessory domain source of truth with a CaseFlow
Books domain and content policy before type, schema, data, UI, or admin
implementation begins.

### Actual Result

- Replaced `docs/domain.md` with the CaseFlow Books `v1.1` domain policy.
- Mirrored the domain document to `caseflow-store/docs/domain.md`.
- Updated `.agent/project-context.md` so books are the active `v1.1` domain and
  phone accessories are clearly historical `v1.0.0` release context.
- Updated `.agent/todo-roadmap.md` to advance the current task to `D22-T02`.

### Domain Scope Captured

- Book works and sellable book editions.
- Authors, translators, publishers, categories, genres, languages, formats, and
  ISBN fields.
- Inventory status, VND pricing, approximate USD display boundaries, summaries,
  account-gated checkout, simulated payment methods, roles, admin operations,
  and rule-based assistant boundaries.

### Content Policy Captured

- Factual metadata is lower-risk but should have source notes where practical.
- Publisher blurbs, retailer descriptions, reviews, long excerpts, commercial
  covers, and copied bios are higher-risk and must not be copied without a
  clearly permitted source.
- Summaries/descriptions should be project-written unless the source clearly
  permits reuse.
- Cover assets should default to placeholder, generated, or internal safe
  assets when rights are unclear.

### Verification

- Root/app domain docs match.
- Search confirms `docs/domain.md` no longer describes phone accessories as the
  active product domain.
- Root/app `.agent` tracker mirrors match.
- No runtime source files changed.
- Trailing-whitespace check passed.
- `git diff --check`: passed.

### Next Task

`D22-T02 - Define Book TypeScript Domain Contracts`

---

## SR-104 - D22-T02: Define Book TypeScript Domain Contracts

- Date: 2026-07-16
- Status: completed
- Phase: Day 22 - Book domain and content policy

### Objective

Add CaseFlow Books TypeScript domain contracts while preserving current
`v1.0.0` runtime type compatibility until later roadmap tasks replace the
storefront, API, and database behavior.

### Actual Result

- Updated `caseflow-store/src/types/domain.ts`.
- Added constants for book categories, edition languages, book formats,
  inventory statuses, user roles, payment methods, payment statuses, shipping
  methods, cover asset sources, and required customer profile fields.
- Added types for localized text, source notes, book categories, authors,
  translators, publishers, cover assets, book works, book editions, book cart
  items, shipping addresses, customer/staff profiles, profile completeness,
  tax/fee/FX estimates, book orders, book order items, promotions, and
  inventory adjustments.
- Preserved legacy `Category`, `Product`, `CartItem`, `Order`, and `OrderItem`
  exports used by the current production runtime.

### Guardrails Preserved

- VND is the authoritative stored currency.
- USD exists only as an approximate display estimate type.
- Cart/order safety remains represented by edition IDs plus quantities and
  server-owned order totals.
- No runtime UI/API behavior was changed in this task.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- Export search confirmed new book contracts are discoverable from
  `@/types/domain`.
- VND/USD search confirmed VND source-of-truth fields and no `priceUsd` or
  `usdPrice` source-of-truth field.
- `git diff --check`: passed.

### Next Task

`D22-T03 - Create Book Zod Schemas`

---

## SR-105 - D22-T03: Create Book Zod Schemas

- Date: 2026-07-16
- Status: completed
- Phase: Day 22 - Book domain and content policy

### Objective

Add runtime Zod schemas for the CaseFlow Books domain contracts and close Day
22 if validation quality is high enough.

### Actual Result

- Updated `caseflow-store/src/lib/validation/domain.ts`.
- Added CaseFlow Books schemas for book categories, authors, translators,
  publishers, cover assets, works, editions, cart items, shipping addresses,
  customer profiles, staff profiles, profile completeness, tax estimates, fee
  estimates, FX display estimates, book order totals, book orders, book order
  items, promotions, inventory adjustments, checkout requests, and customer
  profile update requests.
- Kept existing `v1.0.0` product/accessory validation schemas intact.
- Added strict mutating request schemas for book checkout and customer profile
  updates.

### Guardrails Preserved

- Book summary, ISBN, language, price, stock, role, and payment method
  constraints are explicit.
- Book checkout request validation rejects browser-supplied trusted fields such
  as `role`, `status`, and `totals`.
- VND remains the authoritative currency in order total schemas.
- USD is represented only as an approximate display estimate.

### Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Focused runtime schema checks passed:
  - valid book edition accepted.
  - invalid negative price rejected.
  - invalid negative stock rejected.
  - invalid role rejected.
  - invalid payment method rejected.
  - valid book checkout request accepted.
  - checkout request with `role`, `status`, and `totals` rejected.
- `npm run build`: passed and generated 16 routes.
- Export search confirmed key schemas are discoverable.
- `git diff --check`: passed.

### Day 22 Result

Day 22 is complete. CaseFlow Books now has accepted domain documentation,
TypeScript domain contracts, and runtime validation schemas.

### Next Task

`D23-T01 - Draft CaseFlow Books Schema Migration`

---

## SR-106 - D23-T01: Draft CaseFlow Books Schema Migration

- Date: 2026-07-16
- Status: completed
- Phase: Day 23 - Database and migration plan

### Objective

Draft the CaseFlow Books v1.1 database migration without applying SQL, while
preserving the released v1.0.0 schema until a migration and rollback plan exists.

### Actual Result

- Created `caseflow-store/supabase/migrations/0006_caseflow_books_schema_draft.sql`.
- Drafted bookstore tables for book categories, authors, translators,
  publishers, cover assets, works, work-author joins, work-category joins,
  editions, edition-translator joins, customer addresses, promotions, and
  inventory adjustments.
- Extended `profiles` to support `customer`, `staff`, and `admin` roles plus
  customer contact/address profile fields.
- Extended `orders` with v1.1 customer, shipping, payment method, payment
  status, currency, discount, shipping fee, tax, payment fee, tax/fee estimate,
  display estimate, promotion, and generated total fields.
- Extended `order_items` with book edition/work snapshot fields while keeping
  legacy v1.0.0 product snapshot columns available during migration.
- Added a draft service-role-only `create_book_order_with_items` RPC for
  account-gated book checkout snapshots.

### Guardrails Preserved

- No SQL was applied to Supabase in D23-T01.
- Existing v1.0.0 catalog and order tables were expanded, not removed.
- RLS remains enabled and public/authenticated users receive only read access
  to active catalog data.
- No direct public insert/update/delete policy exists for `orders` or
  `order_items`.
- Operational writes remain service-role only and must be reached through
  server-side Route Handlers after authorization and validation.

### Verification

- SQL inspection found expected tables, constraints, indexes, triggers, RLS
  flags, grants, and the service-role-only book order RPC.
- SQL inspection found no `create policy` for direct public order/order item
  insert, update, or delete.
- `rg` confirmed `SUPABASE_SERVICE_ROLE_KEY` remains in server/lib Supabase
  modules and is not referenced from app UI/features/components.
- `git diff --check`: passed.
- `psql --version`: not installed locally, so PostgreSQL dry-run verification
  is deferred to D23-T03.

### Next Task

`D23-T02 - Plan Production Data Migration And Rollback`

---

## SR-107 - D23-T02: Plan Production Data Migration And Rollback

- Date: 2026-07-16
- Status: completed
- Phase: Day 23 - Database and migration plan

### Objective

Create a production migration and rollback plan before applying the CaseFlow
Books v1.1 schema to Supabase.

### Actual Result

- Created `docs/v1.1-production-data-migration-rollback-plan.md`.
- Mirrored the plan to
  `caseflow-store/docs/v1.1-production-data-migration-rollback-plan.md`.
- Defined an expand-and-contract strategy for D23.
- Preserved v1.0.0 phone-accessory `categories`, `products`, `profiles`,
  `orders`, and `order_items` in place.
- Stated that phone-accessory data is not converted into book data.
- Required backup/export evidence before D23-T03 can apply SQL.
- Listed pre-migration SQL checks, post-migration database checks,
  post-migration application checks, stop conditions, and evidence artifacts.
- Defined rollback paths for SQL failure before commit, additive schema success,
  app breakage after schema application, and data corruption or missing
  production data.

### Guardrails Preserved

- No SQL was applied to Supabase.
- No destructive database operation was performed.
- Book seed data remains scoped to Day 24.
- v1.0.0 production data remains the rollback baseline.
- `D23-T03` is blocked unless backup/export evidence exists.

### Verification

- Root/app migration plan mirrors match.
- Required plan sections are present:
  - backup/export evidence.
  - pre-migration checks.
  - post-migration database checks.
  - post-migration application checks.
  - rollback decision tree.
  - D23 rollback SQL shape.
  - stop conditions.
- Search confirms the plan explicitly states that no phone-accessory data is
  converted into book data.
- Search confirms the plan explicitly states D23-T02 must not apply SQL or run
  destructive database operations.
- `git diff --check`: passed.

### Next Task

`D23-T03 - Apply And Verify Book Schema In Supabase`

---

## SR-108 - D23-T03: Apply And Verify Book Schema In Supabase

- Date: 2026-07-16
- Status: blocked
- Phase: Day 23 - Database and migration plan

### Objective

Apply and verify the CaseFlow Books schema migration in the Supabase project
only after D23-T02 backup/export requirements are satisfied.

### Actual Result

D23-T03 did not apply SQL. The task stopped during preflight because the
accepted D23-T02 migration plan requires backup/export evidence before applying
schema changes, and that evidence is not currently available.

### Evidence Collected

- Confirmed Chrome dashboard access to Supabase project `caseflow-store`
  (`fcsuldrerhbynwotcvyn`).
- Opened the Supabase dashboard backup page for the project.
- Observed dashboard text stating that the Free Plan does not include project
  backups.
- Saved screenshot evidence:
  `caseflow-store/.agent/artifacts/d23-t03/backup-page-free-plan.png`.
- Created blocker artifact:
  `caseflow-store/.agent/artifacts/d23-t03/preflight-blocked.md`.
- Created backup manifest showing no backup/export was created:
  `caseflow-store/.agent/artifacts/d23-t03-backup/manifest.md`.

### Tooling Findings

- `psql`: not installed locally.
- Supabase CLI via `npx --yes supabase --version`: available as `2.109.1`.
- `npx --yes supabase projects list`: blocked without
  `SUPABASE_ACCESS_TOKEN`.
- `npx --yes supabase db dump --dry-run --linked`: blocked because the local
  repository is not linked to a Supabase project.
- `.env.local` contains the public Supabase URL, anon key, service-role key,
  site URL, Playwright admin credentials, and Vercel OIDC token, but no
  PostgreSQL database URL or Supabase access token.

### Guardrails Preserved

- No migration SQL was submitted, pasted into SQL Editor, or executed.
- No destructive database operation was performed.
- No secret values were printed or committed.
- The D23-T02 stop condition was followed.

### Required Unblock

Retry D23-T03 only after one of these is available:

- Supabase DB connection string/password usable for `pg_dump` or
  `supabase db dump --db-url`.
- Supabase access token plus linked project configuration.
- User-created backup/export evidence from Supabase dashboard plus an approved
  SQL Editor apply path.
- Enabled provider backup capability.

### Next Task

Still blocked on `D23-T03 - Apply And Verify Book Schema In Supabase`.

---

## SR-109 - D23-T03: Apply And Verify Book Schema In Supabase Retry

- Date: 2026-07-16
- Status: completed
- Phase: Day 23 - Database and migration plan

### Objective

Retry D23-T03 after `SUPABASE_DB_URL` became available, create required
backup/export evidence, apply the CaseFlow Books schema migration, and verify
database security plus v1.0.0 app regression behavior.

### Actual Result

- Verified `SUPABASE_DB_URL` exists and points to Supabase project
  `fcsuldrerhbynwotcvyn` without printing the secret value.
- Added a targeted `.gitignore` rule so D23-T03 SQL backup exports cannot be
  committed accidentally.
- Created pre-migration `public` schema and data export artifacts under
  `caseflow-store/.agent/artifacts/d23-t03-backup/`.
- Applied `caseflow-store/supabase/migrations/0006_caseflow_books_schema_draft.sql`
  to Supabase through a verified direct PostgreSQL transaction path.
- Verified expected CaseFlow Books tables, v1.1 order/order item columns, RLS
  flags, policies, grants, constraints, triggers, and
  `create_book_order_with_items`.
- Verified anon and authenticated roles cannot directly read protected
  order/admin tables through Supabase client checks and have no direct write
  privileges on those protected tables.
- Verified v1.0.0 catalog/profile counts were preserved and direct book orders
  remain `0`.

### Evidence

- Backup manifest:
  `caseflow-store/.agent/artifacts/d23-t03-backup/manifest.md`
- Pre-migration checks:
  `caseflow-store/.agent/artifacts/d23-t03/pre-migration-checks.json`
- Migration apply result:
  `caseflow-store/.agent/artifacts/d23-t03/migration-apply.json`
- Post-migration DB checks:
  `caseflow-store/.agent/artifacts/d23-t03/post-migration-db-checks.json`
- Post-migration access-control checks:
  `caseflow-store/.agent/artifacts/d23-t03/post-migration-access-control-checks.json`
- Verification summary:
  `caseflow-store/.agent/artifacts/d23-t03/verification-summary.md`

### Guardrails Preserved

- No secrets were printed or committed.
- SQL backup files are ignored because the data export may contain app/customer
  PII.
- No book catalog data was seeded in D23-T03.
- Existing v1.0.0 phone-accessory data was preserved.
- Protected order/admin tables remain inaccessible to anon/authenticated direct
  table access.

### Verification

- Pre-migration DB checks: passed.
- Post-migration DB checks: passed.
- Access-control checks: passed.
- Pre-migration `npm run lint`: passed.
- Pre-migration `npm run build`: passed.
- Post-migration `npm run lint`: passed.
- Post-migration `npm run build`: passed.
- Post-migration `npm run test:e2e`: passed, `20/20`.
- Production smoke passed:
  - `/`: `200`
  - `/api/categories`: `200`, count `5`
  - `/api/products`: `200`, count `16`
  - `/api/admin/orders` without auth: `401`
- Post-E2E DB state check passed:
  - `orders`: `0`
  - `order_items`: `0`
  - `direct_book_orders`: `0`

### Day 23 Result

Day 23 is complete. The production Supabase schema is ready for Day 24 catalog
data work.

### Next Task

`D24-T01 - Build 100-Edition Book Seed Dataset`

---

## SR-110 - D24-T01: Build 100-Edition Book Seed Dataset

- Date: 2026-07-16
- Status: completed
- Phase: Day 24 - Catalog data and safe book assets

### Objective

Create the CaseFlow Books seed dataset with about 100 sellable editions,
English/Vietnamese edition relationships, required commerce fields, and
project-written summaries without copying publisher blurbs.

### Actual Result

- Created `caseflow-store/src/data/books/seed.ts`.
- Added 50 real public-domain/classic works as bibliographic anchors.
- Generated 100 sellable CaseFlow Books demo editions.
- Every work has one English edition and one Vietnamese edition.
- Added 11 active categories, 41 authors, and 1 internal demo publisher.
- Each edition includes title, work/category/author relationship, language,
  format, VND price, stock, publication year where safe, and a self-written
  short summary.
- ISBNs remain `null` to avoid fabricating real identifiers.
- Cover references remain `null` because safe cover strategy is D24-T02 scope.

### Guardrails Preserved

- No commercial cover URLs were used.
- No copied publisher blurbs were used.
- No real ISBNs were fabricated.
- No Supabase seed was run in D24-T01.
- Existing v1.0.0 runtime behavior was not changed.

### Verification

- Runtime seed import/count check passed:
  - categories: `11`
  - authors: `41`
  - works: `50`
  - editions: `100`
  - English editions: `50`
  - Vietnamese editions: `50`
- Content scan passed:
  - no copied-blurb markers.
  - no long summary violations.
  - no duplicate long summaries.
  - no commercial cover references.
  - no fabricated ISBNs.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- `git diff --check`: passed.
- Evidence: `caseflow-store/.agent/artifacts/d24-t01/seed-summary.json`.

### Next Task

`D24-T02 - Create Safe Cover Asset Strategy`

---

## SR-111 - D24-T02: Create Safe Cover Asset Strategy

- Date: 2026-07-16
- Status: completed
- Phase: Day 24 - Catalog data and safe book assets

### Objective

Define a safe cover asset strategy for CaseFlow Books, ensure every seed
edition has a stable image reference or placeholder mapping, and avoid
unlicensed commercial cover usage.

### Actual Result

- Created `docs/v1.1-safe-cover-asset-strategy.md`.
- Mirrored the strategy to
  `caseflow-store/docs/v1.1-safe-cover-asset-strategy.md`.
- Added internal placeholder SVG:
  `caseflow-store/public/images/books/placeholders/book-cover-placeholder.svg`.
- Updated `caseflow-store/src/data/books/seed.ts` with one internal
  `BookCoverAsset`.
- Mapped all 100 seed editions to the stable placeholder cover ID.

### Guardrails Preserved

- No commercial cover URLs were used.
- No publisher cover files were copied.
- No marketplace or image-search hotlinks were used.
- Placeholder is explicitly internal and does not pretend to be a real edition
  cover.

### Verification

- Cover strategy check passed:
  `caseflow-store/.agent/artifacts/d24-t02/cover-strategy-check.json`.
- Playwright visual smoke screenshot rendered:
  `caseflow-store/.agent/artifacts/d24-t02/cover-placeholder-smoke.png`.
- Verified local cover path exists.
- Verified SVG has accessible title metadata.
- Verified SVG contains no external `href/src`.
- Verified 100/100 editions map to a stable cover ID.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- `git diff --check`: passed.

### Next Task

`D24-T03 - Seed Book Data Into Supabase`

---

## SR-112 - D24-T03: Seed Book Data Into Supabase

- Date: 2026-07-16
- Status: completed
- Phase: Day 24 - Catalog data and safe book assets

### Objective

Insert or upsert the CaseFlow Books category, work, author, cover, and edition
seed data into Supabase deterministically without duplicating rows on rerun or
mixing the old phone-accessory catalog into bookstore results.

### Actual Result

- Created deterministic seed script:
  `caseflow-store/scripts/seed-books.ts`.
- Ran dry-run before mutation and confirmed expected payload counts.
- Applied Supabase upserts with stable IDs and `onConflict` rules.
- Reran the apply path successfully, proving the seed can be rerun without
  duplicate rows.
- Seeded:
  - 11 book categories.
  - 41 authors.
  - 1 publisher.
  - 1 internal cover asset.
  - 50 works.
  - 51 work-author joins.
  - 100 work-category joins.
  - 100 editions.
  - 0 edition-translator joins.
- Verified active edition language distribution: 50 English and 50 Vietnamese.
- Verified legacy phone-accessory `categories` and `products` remain at 5 and
  16.
- Public Supabase smoke returned 100 active `book_editions` and sampled
  bookstore rows only.

### Guardrails Preserved

- No phone-accessory data was converted into book data.
- No old `products` rows were deleted or mixed into book tables.
- No commercial cover URLs were seeded.
- No fabricated ISBNs were seeded.
- No order or customer data was created.
- Service-role key was used only locally and was not printed.

### Verification

- Dry-run artifact:
  `caseflow-store/.agent/artifacts/d24-t03/seed-books-dry-run.json`
- Apply/verification artifact:
  `caseflow-store/.agent/artifacts/d24-t03/seed-books-apply.json`
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- `git diff --check`: passed.

### Day 24 Result

Day 24 is complete. CaseFlow Books now has safe catalog seed data, safe
placeholder cover assets, and verified Supabase book rows.

### Next Task

`D25-T01 - Implement Book Row Mappers And Repositories`

---

## SR-113 - D25-T01: Implement Book Row Mappers And Repositories

- Date: 2026-07-16
- Status: completed
- Phase: Day 25 - Book repositories and catalog APIs

### Objective

Create the CaseFlow Books row-mapping and repository layer so Supabase book
rows are converted into validated domain objects before API/UI use, while the
released phone-accessory repositories remain available until the explicit
catalog API cutover.

### Actual Result

- Added v1.1 book catalog table coverage to the Supabase database TypeScript
  contract.
- Added book row mappers:
  `caseflow-store/src/lib/supabase/book-mappers.ts`.
- Added book repository functions:
  `caseflow-store/src/lib/repositories/supabase-books.ts`.
- Repository support now includes:
  - category listing.
  - catalog listing.
  - category, language, format, author, price, search, featured, and
    availability filtering.
  - sort and pagination.
  - edition detail lookup by slug.
  - related edition lookup by work.
- Added runtime verification script:
  `caseflow-store/scripts/verify-book-repository.ts`.

### Guardrails Preserved

- Existing phone-accessory `supabase-catalog` repository and product APIs were
  not replaced in this task.
- Invalid book rows are rejected through Zod domain parsing before repository
  results reach UI/API callers.
- Public storefront repository verification used the Supabase anon client and
  RLS-readable book tables.
- No service-role key, database URL, or secret values were printed.

### Verification

- Runtime verification artifact:
  `caseflow-store/.agent/artifacts/d25-t01/book-repository-check.json`
- Runtime mapper checks accepted valid rows and rejected invalid price,
  language, and stock rows.
- Repository smoke returned 100 book records, 50 English editions, 50
  Vietnamese editions, 11 categories, joined detail data, and the related
  Vietnamese sibling edition for `pride-and-prejudice-english-special-edition`.
- Legacy phone products remained readable at count 16.
- `npx tsx scripts/verify-book-repository.ts`: passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- `git diff --check`: passed.

### Next Task

`D25-T02 - Replace Product APIs With Book Catalog APIs`

---

## SR-114 - D25-T02: Replace Product APIs With Book Catalog APIs

- Date: 2026-07-16
- Status: completed
- Phase: Day 25 - Book repositories and catalog APIs

### Objective

Cut public catalog APIs over from the legacy phone-accessory product response
shape to CaseFlow Books category, edition list, and edition detail responses
while preserving the stable `{ data, error, meta }` API envelope.

### Actual Result

- Added book catalog query validation:
  `caseflow-store/src/lib/validation/books.ts`.
- Added public book DTO serialization:
  `caseflow-store/src/lib/api/book-catalog.ts`.
- Updated `GET /api/categories` to return book categories.
- Updated `GET /api/products` to return book edition list data with count,
  total, limit, offset, and has-more metadata.
- Updated `GET /api/products/[slug]` to return book edition detail with related
  editions.
- Added `BOOK_EDITION_NOT_FOUND` to the stable API error contract.
- Updated `docs/api-contract.md` and the app mirror contract document.

### Guardrails Preserved

- Response envelopes remain `{ data, error, meta }`.
- `PRODUCT_NOT_FOUND` remains available for legacy cart/product flows that have
  not migrated yet.
- The old phone-accessory repository remains available for storefront UI/cart
  pages until the roadmap reaches the UI and cart pivot tasks.
- No service-role key, database URL, or secret values were printed.

### Verification

- API smoke artifact:
  `caseflow-store/.agent/artifacts/d25-t02/api-curl-checks.json`
- Curl/API checks covered:
  - book categories.
  - default book edition list.
  - language and author filter.
  - category, format, price, and availability filter.
  - search.
  - pagination.
  - invalid language query.
  - invalid price range.
  - book detail.
  - missing book detail.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- `git diff --check`: passed.

### Temporary Boundary

The storefront UI pages still render the legacy phone-accessory experience.
That is intentional at this roadmap point; Day 26-30 tasks own the UI and cart
pivot to CaseFlow Books.

### Next Task

`D25-T03 - Accept Data/Domain Freeze`

---

## SR-115 - D25-T03: Accept Data/Domain Freeze

- Date: 2026-07-16
- Status: completed
- Phase: Day 25 - Book repositories and catalog APIs

### Objective

Accept the Day 25 data/domain freeze only after verifying the book schema, seed
strategy, repositories, and public catalog APIs, and document remaining
schema/API risks before Day 26 storefront work expands.

### Actual Result

- Created freeze documentation:
  - `docs/v1.1-data-domain-freeze.md`
  - `caseflow-store/docs/v1.1-data-domain-freeze.md`
- Recorded the frozen foundation:
  - book domain contracts.
  - Zod schemas and book query validation.
  - Supabase book schema migration.
  - safe 100-edition seed strategy.
  - safe cover strategy.
  - row mappers and repositories.
  - public catalog API DTOs and routes.
  - stable `{ data, error, meta }` envelope.
- Documented remaining risks before storefront expansion, including the
  temporary `/api/products` book DTO path, legacy phone UI still active,
  old v1.0 release API tests no longer matching the D25 catalog API, in-memory
  filtering at 100-edition scale, placeholder-only covers, no translator rows,
  and book checkout not yet wired.

### Guardrails Preserved

- No runtime feature was added in this freeze task.
- Future changes to book schema, domain enums/field names, seed licensing
  policy, public catalog API envelope, or public query semantics now require
  explicit review.
- The freeze is a data/domain/API freeze, not a storefront, checkout, account,
  admin operations, SEO, assistant, or deployment freeze.

### Verification

- Freeze artifact:
  `caseflow-store/.agent/artifacts/d25-t03/data-domain-freeze-check.json`
- Freeze artifact verified required evidence files, previous API artifact
  status, and local API smoke for list/detail/missing-detail responses.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

### Day 25 Result

Day 25 is complete. The CaseFlow Books data/domain/API foundation is frozen for
Day 26 storefront expansion.

### Next Task

`D26-T01 - Rebrand UI To CaseFlow Books`

---

## SR-116 - D26-T01: Rebrand UI To CaseFlow Books

- Date: 2026-07-16
- Status: completed
- Phase: Day 26 - Branding and bilingual foundation

### Objective

Change the visible application identity from CaseFlow Store to CaseFlow Books,
align metadata/header/footer/README and production-facing copy with bookstore
positioning, and remove old phone-accessory marketing copy from active
user-facing pages.

### Actual Result

- Updated layout metadata, header, footer, and navigation to CaseFlow Books.
- Rebuilt the active homepage around CaseFlow Books using the verified book
  catalog repository and safe placeholder cover assets.
- Updated `/products/[slug]` to render a minimal book edition detail page with
  book cover, authors, categories, language, format, price, stock, work context,
  and related editions.
- Updated the product not-found route to book-edition copy.
- Updated checkout/admin/internal-preview metadata and checkout-visible copy
  where it referenced the old store identity or old product shopping copy.
- Updated root and app README references to the CaseFlow Books `v1.1` direction
  while preserving the truth that screenshots/release evidence still describe
  the accepted `v1.0.0` release until the Day 40 portfolio pass.

### Guardrails Preserved

- This was a rebrand and minimal visible pivot, not the full catalog/listing,
  filter, cart, checkout, or bilingual implementation.
- The data/domain/API freeze remained intact.
- The route path `/products/[slug]` remains temporarily in place even though
  visible copy is book-oriented.

### Verification

- Text/visual artifact:
  `caseflow-store/.agent/artifacts/d26-t01/rebrand-visual-text-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d26-t01/home-desktop.png`
  - `caseflow-store/.agent/artifacts/d26-t01/home-mobile.png`
- Text search over active UI/README found no old phone-accessory marketing copy.
- Playwright desktop/mobile screenshot checks passed with required CaseFlow
  Books text present and forbidden old copy absent.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 16 routes.
- `git diff --check`: passed.

### Next Task

`D26-T02 - Implement Vietnamese/English Language Mode`

---

## SR-117 - D26-T02: Implement Vietnamese/English Language Mode

- Date: 2026-07-16
- Status: completed
- Phase: Day 26 - Branding and bilingual foundation

### Objective

Add a Vietnamese/English language mode that users can switch from the header,
keep the switch accessible and mobile-friendly, and translate core visible
labels across the active storefront, cart, checkout, and admin surfaces where
implemented.

### Actual Result

- Added shared language helpers:
  - `caseflow-store/src/lib/i18n/language.ts`
  - `caseflow-store/src/lib/i18n/server.ts`
- Added a validated `POST /api/preferences/language` route that sets the
  `caseflow-books.language` cookie server-side.
- Added `LanguageSwitcher` with compact VI/EN flag-style controls for desktop
  header and mobile navigation.
- Updated root layout to read the selected language and set `html lang`.
- Localized header, mobile navigation, footer, homepage, book detail,
  book-edition not-found, cart drawer, checkout, checkout success, admin login,
  and admin orders core labels.
- Homepage and book detail now prefer localized book/category fields from the
  catalog data.

### Guardrails Preserved

- No book schema, domain enum, public catalog API envelope, or catalog query
  semantics changed.
- The new language preference route validates the mutating request body and
  does not expose secrets.
- VND remains the only displayed currency in this task; USD/VAT/fee display is
  explicitly left for `D26-T03`.
- Known limitation recorded: seeded Vietnamese book/category content still has
  some unaccented text, so content polish remains necessary before claiming a
  fully polished Vietnamese catalog.

### Verification

- Language-mode artifact:
  `caseflow-store/.agent/artifacts/d26-t02/language-mode-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d26-t02/header-en-desktop.png`
  - `caseflow-store/.agent/artifacts/d26-t02/header-vi-desktop.png`
  - `caseflow-store/.agent/artifacts/d26-t02/header-en-mobile.png`
  - `caseflow-store/.agent/artifacts/d26-t02/header-vi-mobile.png`
- Playwright verified:
  - English and Vietnamese text changes at 1440px.
  - English and Vietnamese mobile menu/header states at 375px.
  - No horizontal overflow at both viewport sizes.
  - Language preference API accepts `vi` and returns the expected envelope.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 17 app routes.
- `git diff --check`: passed.

### Next Task

`D26-T03 - Add Currency Display Rules`

---

## SR-118 - D26-T03: Add Currency Display Rules

- Date: 2026-07-16
- Status: completed
- Phase: Day 26 - Branding and bilingual foundation

### Objective

Add currency display rules that preserve VND as the authoritative source price
while allowing English mode to show approximate USD with exchange-rate source,
quoted timestamp, and configurable VAT/international payment fee assumptions.

### Actual Result

- Added USD formatting alongside existing VND formatting.
- Added pure currency estimate helpers:
  `caseflow-store/src/lib/format/currency-display.ts`.
- Added server-owned, Zod-validated currency rules:
  `caseflow-store/src/lib/format/currency-display.server.ts`.
- Added `CurrencyAmount` and `CurrencyEstimateDisclosure` UI:
  `caseflow-store/src/components/currency/currency-amount.tsx`.
- Updated homepage and book detail price surfaces:
  - VND remains the primary visible price.
  - English mode adds approximate USD estimates.
  - Vietnamese mode hides USD estimates.
- Added server override examples to `.env.example`.
- Added runtime verification script:
  `caseflow-store/scripts/verify-currency-display-rules.ts`.

### Guardrails Preserved

- No stored product price, order subtotal, database schema, or public catalog API
  semantics changed.
- USD values are derived display estimates only.
- The default estimate uses HSBC Vietnam telegraphic selling rate `26,400
  VND/USD`, quoted `2026-07-16T08:35:00+07:00`, with configurable `1000` VAT
  basis points and `300` international payment fee basis points.
- UI copy says "estimate" and "approx."; it avoids legal/tax certainty.
- The configuration can be overridden server-side through non-`NEXT_PUBLIC`
  environment variables.

### Verification

- Runtime currency artifact:
  `caseflow-store/.agent/artifacts/d26-t03/currency-display-rules-check.json`
- Visual currency artifact:
  `caseflow-store/.agent/artifacts/d26-t03/currency-display-visual-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d26-t03/currency-en-home.png`
  - `caseflow-store/.agent/artifacts/d26-t03/currency-vi-home.png`
- Runtime check verified:
  - source currency remains VND.
  - display currency is USD only for estimates.
  - source amount remains unchanged.
  - VAT and international fee estimates are derived from basis points.
  - USD amount is derived from the VND display base and exchange rate.
  - source URL and timestamp are present.
- Playwright verified English mode shows approximate USD and source/timestamp
  assumptions, Vietnamese mode hides the approximate USD estimate, and both
  modes avoid horizontal overflow.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npx tsx scripts/verify-currency-display-rules.ts`: passed.
- `npm run build`: passed and generated 17 app routes.
- `git diff --check`: passed.

### Follow-up Risk

Next dev reported an above-the-fold LCP warning for the placeholder cover image.
This is not a currency-rule blocker, but it should be handled during Day 27
homepage work or later SEO/performance tasks.

### Day 26 Result

Day 26 is complete. Branding, bilingual mode, and currency display rules are
ready for Day 27 storefront homepage work.

### Next Task

`D27-T01 - Build CaseFlow Books Homepage`

---

## SR-119 - D27-T01: Build CaseFlow Books Homepage

- Date: 2026-07-16
- Status: completed
- Phase: Day 27 - Bookstore homepage

### Objective

Replace the early CaseFlow Books homepage with a realistic curated bookstore
storefront that presents categories, featured books, new arrivals, translated
edition pairs, Vietnamese recommendations, and trust/shipping signals without
rendering all 100 editions at once.

### Actual Result

- Rebuilt `caseflow-store/src/app/page.tsx` into a curated bilingual bookstore
  homepage.
- Added sections for:
  - bookstore categories.
  - featured books.
  - new arrivals.
  - English/Vietnamese translated edition pairs.
  - Vietnamese recommendations.
  - trust and shipping signals.
- Preserved VND as the primary price and English-mode USD estimates through
  the D26 currency display component.
- Added scoped Vietnamese accent polish for homepage category labels and a few
  curated Vietnamese title surfaces without changing the frozen seed/data/API
  contract.
- Added `caseflow-store/scripts/verify-homepage-sections.ts` to verify curated
  homepage counts, section presence, detail links, language-specific text, and
  desktop/mobile overflow.
- Changed the global footer from explicit demo/simulation wording to a
  no-card/no-wallet-credential disclosure so the public storefront reads less
  like a project note while still not claiming real payment processing.

### Guardrails Preserved

- No database schema, domain enum, seed contract, public catalog API envelope,
  or catalog query semantics changed.
- The homepage reads the 100-edition catalog but renders a curated subset only.
- Book cards link to existing valid detail routes instead of adding placeholder
  or dead links.
- Full catalog route creation remains owned by `D28-T01`.
- No card number, CVV, expiry, wallet credential, or real payment-provider
  credential collection was added.

### Verification

- Homepage verification artifact:
  `caseflow-store/.agent/artifacts/d27-t01/homepage-sections-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d27-t01/home-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d27-t01/home-mobile-vi.png`
- `npx tsx scripts/verify-homepage-sections.ts` passed with:
  - total catalog editions: `100`.
  - curated unique editions rendered: `14`.
  - visible book cards: `12`.
  - category cards: `8`.
  - featured cards: `4`.
  - new arrival cards: `4`.
  - translated groups: `3`.
  - translated edition links: `6`.
  - Vietnamese recommendation cards: `4`.
  - trust cards: `4`.
  - desktop/mobile horizontal overflow: `false`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 17 app routes.
- `git diff --check`: passed.

### Next Task

`D27-T02 - Add Book Category And Discovery Navigation`

---

## SR-120 - D27-T02: Add Book Category And Discovery Navigation

- Date: 2026-07-16
- Status: completed
- Phase: Day 27 - Bookstore homepage

### Objective

Update CaseFlow Books navigation so users can move between bookstore
categories, featured books, edition browsing, offers, order support, and admin
entry points without hitting dead anchors or unclear recovery paths.

### Actual Result

- Updated global navigation to remove stale `#books`, `#reading-path`, and
  `#checkout` anchors.
- Desktop header now stays focused on primary routes/anchors: home,
  categories, featured books, edition pairs, support, and admin.
- Mobile menu now includes a separate Discovery group for new arrivals, current
  offers, and Vietnamese recommendations.
- Footer navigation now links to valid shop/help destinations and the admin
  console entry point.
- Product detail pages now show a Home / Books / current-edition breadcrumb.
- Product not-found and checkout recovery links now return to `/#featured`.
- Added `caseflow-store/scripts/verify-discovery-navigation.ts` for focused
  browser verification of desktop/mobile navigation, footer target validity,
  admin entry behavior, detail breadcrumb recovery, and not-found recovery.

### Guardrails Preserved

- No new customer account, public order tracking, deals, or promotion engine
  routes were created before their accepted roadmap days.
- Navigation does not point to placeholder or dead pages.
- Admin entry remains protected by the existing admin auth flow.
- Header density was reduced after visual review so the CaseFlow Books brand no
  longer truncates at the 1440px desktop baseline.

### Verification

- Navigation verification artifact:
  `caseflow-store/.agent/artifacts/d27-t02/discovery-navigation-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d27-t02/navigation-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d27-t02/navigation-mobile-vi-open.png`
- `npx tsx scripts/verify-discovery-navigation.ts` passed with:
  - all desktop primary links clicked.
  - all home anchors present.
  - admin entry point redirects to admin login/orders as expected.
  - footer links target valid current anchors/routes.
  - mobile Vietnamese primary and discovery links visible.
  - detail breadcrumb and not-found recovery links valid.
  - desktop/mobile horizontal overflow: `false`.
- Source anchor scan found no active stale `#books`, `#reading-path`, or
  `#checkout` navigation references.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 17 app routes.
- `git diff --check`: passed.

### Day 27 Result

Day 27 is complete. Homepage and discovery navigation are ready for Day 28
catalog page work.

### Next Task

`D28-T01 - Build Full Book Catalog Page`

---

## SR-121 - D28-T01: Build Full Book Catalog Page

- Date: 2026-07-16
- Status: completed
- Phase: Day 28 - Catalog listing, search, and filters

### Objective

Create a real CaseFlow Books catalog route that lists the seeded bookstore
editions without rendering all 100 cards at once, while showing card metadata,
result counts, active view state, and pagination.

### Actual Result

- Added `caseflow-store/src/app/catalog/page.tsx`.
- Added `/catalog` as the full catalog route.
- Catalog renders 24 cards per page across 5 pages for the 100-edition seed.
- Cards show cover/placeholder, title, author, category, edition language,
  format, VND price with English-mode USD estimate, stock state/quantity, sale
  state, and detail link.
- Result count and active view chips are visible.
- Header/footer navigation now include the `/catalog` route.
- Added `caseflow-store/scripts/verify-catalog-page.ts`.
- Updated `caseflow-store/scripts/verify-discovery-navigation.ts` to understand
  the new catalog route.

### Guardrails Preserved

- No database schema, domain enum, seed contract, public catalog API envelope,
  or repository query semantics changed.
- Initial catalog render shows 24 cards, not all 100 editions.
- D28-T01 only adds the paginated catalog shell. Book-specific filters and
  richer sorting remain owned by D28-T02.

### Verification

- Catalog verification artifact:
  `caseflow-store/.agent/artifacts/d28-t01/catalog-page-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d28-t01/catalog-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d28-t01/catalog-mobile-vi-page-2.png`
- `npx tsx scripts/verify-catalog-page.ts` passed with:
  - total catalog editions: `100`.
  - desktop initial rendered cards: `24`.
  - mobile page 2 rendered cards: `24`.
  - total pages: `5`.
  - result counts visible.
  - active view chips visible.
  - first card metadata includes image, language, format, stock, sale state,
    author, price, and detail link.
  - pagination to page 2 works.
  - desktop/mobile horizontal overflow: `false`.
- Updated `npx tsx scripts/verify-discovery-navigation.ts`: passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Next Task

`D28-T02 - Add Book-Specific Filters And Sorting`

---

## SR-122 - D28-T02: Add Book-Specific Filters And Sorting

- Date: 2026-07-16
- Status: completed
- Phase: Day 28 - Catalog listing, search, and filters

### Objective

Add URL-backed book-specific filtering and sorting to the `/catalog` page while
preserving the existing public catalog API contract and proving that UI result
counts agree with the API for representative supported filters.

### Actual Result

- Updated `caseflow-store/src/app/catalog/page.tsx`.
- Added a GET form with visible labels for:
  - search.
  - category/genre.
  - language.
  - format.
  - author.
  - min/max VND price range.
  - availability.
  - featured-shelf promotion state.
  - sort.
- Added URL search-param parsing that ignores invalid values safely.
- Added stable pagination links that preserve active filters and sort state.
- Added UI sorting for relevance/default, newest, price ascending/descending,
  title A-Z, and author A-Z.
- Added `caseflow-store/scripts/verify-catalog-filters.ts`.

### Guardrails Preserved

- No database schema, domain enum, seed contract, repository filter semantics,
  or public `/api/products` response envelope changed.
- UI-only sorts `relevance` and `author-asc` did not expand the frozen public
  `/api/products` sort contract.
- The featured-shelf promotion filter uses existing `isFeatured` data; no fake
  coupon/promotion engine was introduced before D37.

### Verification

- Catalog filter verification artifact:
  `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d28-t02/catalog-invalid-mobile-vi.png`
- `npx tsx scripts/verify-catalog-filters.ts` passed with:
  - combined form-driven filters applied: search, category, language, format,
    availability, featured shelf, and price sorting.
  - UI result total and `/api/products` meta total both equal `3` for the
    representative combined filter.
  - price ascending sort verified from rendered card attributes.
  - author A-Z sort verified from rendered card attributes.
  - clear filters returned to `100` result total and `24` rendered cards.
  - invalid query params loaded without crashing and fell back to `100` result
    total and `24` rendered cards.
  - desktop/mobile horizontal overflow: `false`.
- `npx tsx scripts/verify-catalog-page.ts`: passed after the filter changes.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Next Task

`D28-T03 - Add Empty, Loading, And Error Catalog States`

---

## SR-123 - D28-T03: Add Empty, Loading, And Error Catalog States

- Date: 2026-07-16
- Status: completed
- Phase: Day 28 - Catalog listing, search, and filters

### Objective

Add polished bilingual loading, empty, and error states for the CaseFlow Books
catalog so users have clear recovery paths and internal implementation details
are not exposed.

### Actual Result

- Added shared bookstore catalog state components in
  `caseflow-store/src/features/books/catalog-states.tsx`.
- Wired `/catalog` empty results to the shared empty state.
- Added `caseflow-store/src/app/catalog/loading.tsx` for the catalog loading
  route state.
- Added `caseflow-store/src/app/catalog/error.tsx` for customer-safe runtime
  catalog failures.
- Rebuilt `caseflow-store/src/app/catalog-state-preview/page.tsx` as a
  bilingual catalog-state QA route for `loading`, `empty`, and `error`.
- Added `caseflow-store/scripts/verify-catalog-states.ts`.

### Guardrails Preserved

- No database schema, seed data, repository semantics, or public catalog API
  contract changed.
- Error UI avoids stack traces, exception names, SQL fragments, environment
  values, and implementation details.
- The preview route is a QA surface only; it does not add customer-facing
  commerce features outside the Day 28 roadmap.

### Verification

- Catalog-state verification artifact:
  `caseflow-store/.agent/artifacts/d28-t03/catalog-states-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-loading.png`
  - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-empty.png`
  - `caseflow-store/.agent/artifacts/d28-t03/desktop-en-error.png`
  - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-loading.png`
  - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-empty.png`
  - `caseflow-store/.agent/artifacts/d28-t03/mobile-vi-error.png`
- `npx tsx scripts/verify-catalog-states.ts` passed with:
  - all English desktop states visible.
  - all Vietnamese mobile states visible.
  - empty state recovery actions present.
  - error state does not leak internals.
  - desktop/mobile horizontal overflow: `false`.
- `npx tsx scripts/verify-catalog-page.ts`: passed after the state changes.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Day 28 Result

Day 28 is complete. Catalog listing, filtering, sorting, pagination, and
catalog recovery states are ready for Day 29 book detail work.

### Next Task

`D29-T01 - Build Book Detail Page`

---

## SR-124 - D29-T01: Build Book Detail Page

- Date: 2026-07-16
- Status: completed
- Phase: Day 29 - Book detail and edition choice

### Objective

Build a bookstore-specific detail page that shows edition metadata, links
English/Vietnamese editions where available, and ensures add-to-cart targets a
specific sellable book edition.

### Actual Result

- Updated `caseflow-store/src/app/products/[slug]/page.tsx`.
- Added `caseflow-store/src/features/books/book-edition-purchase-controls.tsx`.
- Detail pages now show cover/placeholder, title, author, categories, language,
  format, price, stock, summary, publisher, translator, ISBN, original title,
  original language, publication era, shipping/totals hints, payment-method
  hints, and related editions.
- Format and stock enum values are displayed as localized user-facing labels
  instead of raw technical values.
- Breadcrumb recovery now points back to `/catalog`.
- Add-to-cart writes the specific book edition id and quantity through the
  existing local cart context.
- Added `caseflow-store/scripts/verify-book-detail-page.ts`.

### Guardrails Preserved

- No database schema, seed data, repository contract, or public detail API
  envelope changed.
- Missing ISBN/translator data is shown as unspecified instead of fabricated.
- Client-side add-to-cart does not make price, title, stock, or totals trusted.
- Full cart validation and drawer adaptation to book-edition semantics remain
  owned by `D30-T01`.

### Verification

- Book detail verification artifact:
  `caseflow-store/.agent/artifacts/d29-t01/book-detail-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d29-t01/book-detail-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d29-t01/book-detail-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d29-t01/book-detail-not-found.png`
- `npx tsx scripts/verify-book-detail-page.ts` passed with:
  - valid detail API returned resource `book-edition`.
  - detail page shows cover, title, author, summary, price, stock, edition
    details, commerce hints, and related edition links.
  - Vietnamese mobile detail labels are visible.
  - add-to-cart localStorage item targets edition id
    `00000000-0000-4000-8000-000000003027`.
  - missing detail route returns `404` with recovery links.
  - desktop/mobile/404 horizontal overflow: `false`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Next Task

`D29-T02 - Add Related Books And Buying Confidence Content`

---

## SR-125 - D29-T02: Add Related Books And Buying Confidence Content

- Date: 2026-07-16
- Status: completed
- Phase: Day 29 - Book detail and edition choice

### Objective

Strengthen the book detail page with related recommendations and bilingual
buying-confidence content without adding wishlist/reviews or changing the
catalog API.

### Actual Result

- Updated `caseflow-store/src/app/products/[slug]/page.tsx`.
- Added related recommendation cards based on existing author, category, and
  language data.
- Recommendation cards show reason badges and link to valid detail routes.
- Expanded buying-confidence content to include shipping/totals, payment
  options, and return support in English and Vietnamese.
- Added `caseflow-store/scripts/verify-book-detail-confidence.ts`.

### Guardrails Preserved

- No database schema, seed data, repository contract, or public API envelope
  changed.
- Recommendations are deterministic from existing catalog data; no AI or
  external recommendation service was introduced.
- Buying-confidence copy avoids claiming real payment processing or real carrier
  integration.
- The detail page/book purchase source no longer contains old phone-accessory
  compatibility copy.

### Verification

- Buying-confidence verification artifact:
  `caseflow-store/.agent/artifacts/d29-t02/book-confidence-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d29-t02/book-confidence-mobile-vi.png`
- `npx tsx scripts/verify-book-detail-confidence.ts` passed with:
  - related recommendation cards visible on desktop and mobile.
  - recommendation reason badges visible in English and Vietnamese.
  - four recommendation links returned HTTP `200`.
  - shipping/totals, payment, and return-support copy visible in both
    languages.
  - old accessory copy absent from active detail/book purchase sources.
  - desktop/mobile horizontal overflow: `false`.
- Regression `npx tsx scripts/verify-book-detail-page.ts`: passed.
- Focused source search for old accessory copy: no matches.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Day 29 Result

Day 29 is complete. Book detail, edition choice, related recommendations, and
buying-confidence content are ready for Day 30 cart work.

### Next Task

`D30-T01 - Adapt Cart To Book Editions`

---

## SR-126 - D30-T01: Adapt Cart To Book Editions

- Date: 2026-07-16
- Status: completed
- Phase: Day 30 - Book cart and storefront freeze

### Objective

Adapt the cart validation and cart UI from legacy phone products to CaseFlow
Books sellable editions while preserving the localStorage rule: only id and
quantity are persisted.

### Actual Result

- Updated `caseflow-store/src/types/catalog.ts`.
- Added book-edition cart validation to
  `caseflow-store/src/lib/repositories/supabase-books.ts`.
- Updated `caseflow-store/src/app/api/cart/validate/route.ts` to validate
  book edition ids.
- Updated `caseflow-store/src/features/cart/cart-drawer.tsx` to show book
  cover, title, author, category, language, format, stock, price, quantity,
  line total, and subtotal.
- Updated `caseflow-store/src/features/checkout/checkout-page.tsx` cart review
  to consume the same book-edition validation shape.
- Added `caseflow-store/scripts/verify-book-cart.ts`.

### Guardrails Preserved

- Local cart storage still contains only `{ productId, quantity }`; in v1.1
  `productId` is the book edition id.
- Browser-supplied price, title, stock, line total, and subtotal are ignored.
- Server validation reloads current book catalog data and recalculates totals.
- Account-gated checkout and v1.1 order creation remain later roadmap work.

### Verification

- Book cart verification artifact:
  `caseflow-store/.agent/artifacts/d30-t01/book-cart-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d30-t01/book-cart-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d30-t01/book-cart-mobile-vi.png`
  - `caseflow-store/.agent/artifacts/d30-t01/book-cart-tampered-storage.png`
- `npx tsx scripts/verify-book-cart.ts` passed with:
  - English and Vietnamese editions added through product-detail UI.
  - cart drawer rendered 2 book-edition line items on desktop and mobile.
  - cart line items show language, format, VND price, stock, quantity, and line
    totals.
  - localStorage root keys are only `items` and `version`.
  - each stored item contains only `productId` and `quantity`.
  - direct API validation ignored fake client price/title/stock/line totals.
  - tampered localStorage produced safe validation recovery and did not display
    fake client text.
  - desktop/mobile/tampered horizontal overflow: `false`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Next Task

`D30-T02 - Accept Storefront Feature Freeze`

---

## SR-127 - D30-T02: Accept Storefront Feature Freeze

- Date: 2026-07-16
- Status: completed
- Phase: Day 30 - Book cart and storefront freeze

### Objective

Freeze the v1.1 storefront after verifying homepage, catalog, detail, language
mode, and cart entry across desktop and mobile.

### Actual Result

- Added `caseflow-store/scripts/verify-storefront-freeze.ts`.
- Verified homepage, catalog, detail, cart drawer, and language switch on a
  production build served locally.
- Captured desktop and mobile screenshots for homepage, catalog, detail, and
  cart.
- Confirmed the storefront has no known blocker in product discovery or cart
  entry.
- Activated storefront feature freeze. New storefront discovery/catalog/detail,
  language, or cart-entry features now require explicit roadmap approval.

### Guardrails Preserved

- No new storefront feature was added in this freeze task.
- Data/domain/API freeze remains active.
- Checkout/auth work remains next; D30 does not claim account-gated checkout or
  v1.1 order creation is complete.

### Verification

- Storefront freeze verification artifact:
  `caseflow-store/.agent/artifacts/d30-t02/storefront-freeze-check.json`
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
- `npx tsx scripts/verify-storefront-freeze.ts` passed with:
  - homepage total editions `100` and curated editions `14` on desktop/mobile.
  - catalog rendered `24` cards from `100` results on desktop/mobile.
  - detail page and purchase controls visible on desktop/mobile.
  - cart drawer rendered `2` book-edition items on desktop/mobile.
  - language switch changed the storefront to Vietnamese.
  - no horizontal overflow across checked storefront states.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 18 app routes.
- `git diff --check`: passed.

### Day 30 Result

Day 30 is complete. Storefront feature freeze is active.

### Next Task

`D31-T01 - Implement Customer Auth Pages`

---

## SR-128 - D31-T01: Implement Customer Auth Pages

- Date: 2026-07-16
- Status: completed
- Phase: Day 31 - Customer accounts

### Objective

Add customer-facing sign-up, login, logout, and account-state UI for CaseFlow
Books without weakening the existing admin authorization boundary.

### Actual Result

- Added `/account` customer auth page.
- Added `POST` and `DELETE` `/api/customer/session`.
- Added customer auth validation schemas.
- Added server-side customer auth helper for reading Supabase session state and
  creating/backfilling customer profile rows.
- Added header and mobile auth-state entry points.
- Added `docs/v1.1-auth-access-expectations.md`.
- Added `caseflow-store/scripts/verify-customer-auth.ts`.

### Guardrails Preserved

- Browser payloads cannot set `role`; role injection is rejected by strict Zod
  validation.
- Customer auth does not grant admin access. Admin/staff permissions still
  depend on server-side `profiles.role` checks.
- No phone verification is claimed.
- Storefront feature freeze remains active; this task changed account/auth UI,
  not catalog, detail, language, or cart-entry behavior.
- D31-T01 does not claim profile/address completion or account-gated checkout;
  those remain D31-T02 and Day 32 work.

### Verification

- Customer auth verification artifact:
  `caseflow-store/.agent/artifacts/d31-t01/customer-auth-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signed-out-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signed-in-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t01/customer-account-signup-mobile-vi.png`
- `npx tsx scripts/verify-customer-auth.ts` passed with:
  - anonymous account state visible.
  - customer login/logout flow working through Supabase session cookies.
  - header auth state changing from signed out to signed in and back.
  - API rejects role injection with `VALIDATION_ERROR`.
  - invalid login returns `UNAUTHORIZED`.
  - no horizontal overflow.
  - no phone-verification claim.
- Supabase Auth email sign-up was provider rate-limited during the final
  verification run. The app now returns a clear `429` with
  `CUSTOMER_AUTH_FAILED`, and the verification uses a verified customer test
  user as the configured local equivalent for login/logout.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 20 app routes.
- Focused source search for phone-verification claims: no active false claim.
- `git diff --check`: passed.

### Next Task

`D31-T02 - Add Customer Profile And Address Requirements`

---

## SR-129 - D31-T02: Add Customer Profile And Address Requirements

- Date: 2026-07-16
- Status: completed
- Phase: Day 31 - Customer accounts

### Objective

Add required customer profile and default shipping address support, then block
signed-in customer checkout until required profile/contact fields are present.

### Actual Result

- Added `PATCH /api/customer/profile`.
- Extended customer auth identity with full name, phone, default shipping
  address, and checkout completeness.
- Added customer profile form on `/account`.
- Updated checkout to prefill signed-in customer contact/shipping fields when
  profile data exists.
- Updated checkout to block signed-in customer submit when profile fields are
  incomplete and link back to `/account?next=/checkout`.
- Added `caseflow-store/scripts/verify-customer-profile.ts`.

### Guardrails Preserved

- Browser payloads cannot set `role`.
- Profile writes require a Supabase session and server-side service-role
  persistence.
- No phone verification is claimed.
- D31-T02 does not claim full account-gated checkout. Anonymous checkout still
  uses the existing contact/shipping collection form until D32-T01.
- Checkout still does not collect card, wallet, or provider credentials.

### Verification

- Customer profile verification artifact:
  `caseflow-store/.agent/artifacts/d31-t02/customer-profile-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d31-t02/checkout-profile-blocked-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-complete-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t02/checkout-profile-ready-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d31-t02/customer-profile-validation-mobile-vi.png`
- `npx tsx scripts/verify-customer-profile.ts` passed with:
  - Zod profile validation rejects missing fields and invalid phone values.
  - incomplete customer profile blocks signed-in checkout submit.
  - saved profile becomes complete.
  - completed profile prefills checkout name, phone, and shipping address.
  - Vietnamese validation errors appear for required profile fields.
  - no horizontal overflow.
  - no phone-verification claim.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 21 app routes.
- Focused source search for phone-verification claims: no active false claim.
- `git diff --check`: passed.

### Day 31 Result

Day 31 is complete. Customer auth, profile, and address requirements are ready
for Day 32 account-gated checkout.

### Next Task

`D32-T01 - Gate Checkout Behind Customer Login`

---

## SR-130 - D32-T01: Gate Checkout Behind Customer Login

- Date: 2026-07-16
- Status: completed
- Phase: Day 32 - Account-gated checkout

### Objective

Require customer login before starting checkout while preserving anonymous
browsing, anonymous add-to-cart, and local cart continuity through login.

### Actual Result

- Updated `/checkout` server route to redirect anonymous and non-customer
  sessions to `/account?next=/checkout`.
- Adjusted account signed-in actions so admin/staff sessions do not receive a
  continue-to-checkout link.
- Added `caseflow-store/scripts/verify-checkout-login-gate.ts`.

### Guardrails Preserved

- Anonymous users can still browse and add books to cart.
- Cart remains localStorage-based and stores only edition id plus quantity.
- Checkout route enforces the login gate server-side, not only through UI.
- D32-T01 does not rebuild checkout steps or create v1.1 book orders; that
  remains D32-T02 and later work.

### Verification

- Checkout login gate artifact:
  `caseflow-store/.agent/artifacts/d32-t01/checkout-login-gate-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d32-t01/checkout-login-redirect-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d32-t01/checkout-after-login-desktop-en.png`
- `npx tsx scripts/verify-checkout-login-gate.ts` passed with:
  - anonymous add-to-cart works from book detail.
  - anonymous checkout redirects to `/account?next=/checkout`.
  - cart localStorage survives redirect.
  - customer login returns to checkout.
  - cart item remains visible after login.
  - no horizontal overflow.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 21 app routes.
- `git diff --check`: passed.

### Next Task

`D32-T02 - Rebuild Checkout Steps For Books`

---

## SR-131 - D32-T02: Rebuild Checkout Steps For Books

- Date: 2026-07-16
- Status: completed
- Phase: Day 32 - Account-gated checkout

### Objective

Rebuild checkout around the CaseFlow Books account-gated flow: cart review,
customer/contact confirmation, shipping method, payment method, total review,
and final submit.

### Actual Result

- Updated `POST /api/orders` to require a customer session and create v1.1 book
  order snapshots through `create_book_order_with_items`.
- Added server-side book checkout total calculation in
  `caseflow-store/src/lib/checkout/book-totals.ts`.
- Rebuilt checkout UI into clear steps with read-only account contact
  confirmation, shipping/payment choices, and final total review.
- Updated legacy order mappers so book order snapshots can still feed the
  existing success/admin-compatible order shape.
- Added `caseflow-store/scripts/verify-book-checkout-steps.ts`.

### Guardrails Preserved

- Browser totals, prices, line totals, item names, stock, role, and status are
  not trusted.
- Local cart still stores only book edition id plus quantity.
- Account checkout uses customer profile data and structured shipping address.
- No card number, CVV, expiry, wallet credential, or provider login fields are
  collected.
- Checkout/success UI does not expose simulated/demo wording. Documentation and
  ADRs still state the payment limitation truthfully.
- The D32 totals policy is an interim server-owned estimate; full VAT/FX/payment
  fee assumptions remain owned by D33-T02.

### Verification

- Checkout steps artifact:
  `caseflow-store/.agent/artifacts/d32-t02/book-checkout-steps-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-steps-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d32-t02/book-checkout-success-desktop-en.png`
- `npx tsx scripts/verify-book-checkout-steps.ts` passed with:
  - missing contact returns 400.
  - invalid phone/email returns 400.
  - empty cart returns 400.
  - out-of-stock quantity returns 409.
  - browser-supplied tampered totals are ignored; submitted `totalVnd = 1`
    returned the server-calculated total `182300`.
  - browser checkout shows all required steps, creates an order, reaches success,
    clears the cart, and has no horizontal overflow.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 21 app routes.
- UI source search for simulated/demo checkout wording in `src`: clean except
  non-UI seed/mock data names.
- `git diff --check`: passed.

### Day 32 Result

Day 32 is complete. Account-gated CaseFlow Books checkout now creates book order
snapshots with server-calculated totals.

### Next Task

`D33-T01 - Add Vietnam Payment Method Simulation`

---

## SR-132 - D33-T01: Add Vietnam Payment Method Simulation

- Date: 2026-07-16
- Status: completed
- Phase: Day 33 - Payment simulation and order totals

### Objective

Represent Vietnam-first payment choices in checkout and success state without
collecting real payment credentials.

### Actual Result

- Checkout supports COD, bank transfer, MoMo, ZaloPay, and VNPay-style choices.
- Order success snapshots now store `paymentMethod` and `paymentStatus`.
- Success UI displays payment method and payment status.
- Legacy order mapping now exposes payment/shipping fields for v1.1 snapshots.
- Added `caseflow-store/scripts/verify-payment-methods.ts`.
- Updated API contract wording so `FORBIDDEN` means missing required role, not
  only missing admin role.

### Guardrails Preserved

- No card number, CVV, expiry, wallet credential, bank credential, or provider
  login fields are collected.
- Unknown payment methods are rejected by API validation.
- Payment statuses represent pending or awaiting confirmation only; the app does
  not claim a real provider processed payment.
- D33-T01 does not finalize VAT/FX/payment-fee assumptions; that remains D33-T02.

### Verification

- Payment methods artifact:
  `caseflow-store/.agent/artifacts/d33-t01/payment-methods-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d33-t01/payment-cod-success-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d33-t01/payment-vnpay-success-desktop-en.png`
- `npx tsx scripts/verify-payment-methods.ts` passed with:
  - COD reaches `Pending`.
  - bank transfer reaches `Awaiting bank transfer`.
  - MoMo, ZaloPay, and VNPay reach `Awaiting provider confirmation`.
  - unknown payment method returns 400.
  - no horizontal overflow.
- Targeted input source search for card/CVV/expiry/wallet/provider credential
  fields returned no real payment inputs.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 21 app routes.
- `git diff --check`: passed.

### Next Task

`D33-T02 - Add Shipping, VAT, And FX Estimate Engine`

---

## SR-133 - D33-T02: Add Shipping, VAT, And FX Estimate Engine

- Date: 2026-07-16
- Status: completed
- Phase: Day 33 - Payment simulation and order totals

### Objective

Make shipping fee, VAT, USD display estimate, and international payment fee
assumptions server-owned/configured while keeping VND totals authoritative.

### Actual Result

- Extended `calculateBookCheckoutTotals` to use configured VAT rules and to
  optionally attach a USD display estimate.
- Updated currency display estimation so order totals do not add VAT twice.
- Updated `POST /api/orders` to calculate totals from server-side cart
  validation and request language/currency rules.
- Updated checkout UI to show English-mode approximate USD total with source,
  rate, timestamp, international payment fee assumption, and VND-authoritative
  copy.
- Added `caseflow-store/scripts/verify-order-totals-engine.ts`.

### Guardrails Preserved

- VND remains the persisted checkout currency and authoritative order total.
- Browser-supplied shipping, tax, payment fee, total, and USD display values are
  ignored.
- USD conversion is an estimate with source/timestamp/assumptions, not a legal
  or payment-provider claim.
- No real payment credentials are collected.

### Verification

- Totals engine artifact:
  `caseflow-store/.agent/artifacts/d33-t02/order-totals-engine-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d33-t02/checkout-usd-estimate-desktop-en.png`
- `npx tsx scripts/verify-order-totals-engine.ts` passed with:
  - domestic VND total has no USD display estimate.
  - VAT uses configured basis points.
  - English checkout displays an approximate USD total.
  - source, rate, timestamp, fee assumption, and VND-authoritative copy are
    visible.
  - tampered shipping, tax, payment fee, total, and USD estimate values are
    ignored by the server.
- Current default FX rule verified against HSBC Vietnam: `26,400 VND/USD`
  telegraphic selling rate.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 21 app routes.
- `git diff --check`: passed.

### Day 33 Result

Day 33 is complete. Payment choices, payment status representation, server-owned
order totals, and English USD estimates are ready for customer order history.

### Next Task

`D34-T01 - Add Customer Order History`

---

## SR-134 - D34-T01: Add Customer Order History

- Date: 2026-07-16
- Status: completed
- Phase: Day 34 - Customer orders and tracking

### Objective

Allow logged-in customers to see their own order history and order detail while
preventing access to another customer's orders.

### Actual Result

- Added customer-scoped order repository reads filtered by `customer_id`.
- Added `GET /api/customer/orders` and
  `GET /api/customer/orders/[orderCode]`.
- Added `/account/orders`.
- Added a customer account link to order history.
- Added `caseflow-store/scripts/verify-customer-order-history.ts`.

### Guardrails Preserved

- Customer order APIs require authenticated customer role.
- Cross-customer detail lookup returns `ORDER_NOT_FOUND`.
- The browser never chooses the customer id to query.
- Order history displays order snapshots, not live book catalog values.
- D34-T01 does not add public order tracking; D34-T02 owns guarded public
  lookup.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d34-t01/customer-order-history-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d34-t01/customer-order-history-desktop-en.png`
- `npx tsx scripts/verify-customer-order-history.ts` passed with:
  - customer A can list and detail own order.
  - customer B receives 404 for customer A order detail.
  - customer B list does not include customer A order.
  - order history shows payment method, payment status, order status, total,
    and item snapshot.
  - no horizontal overflow.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 23 app routes.
- `git diff --check`: passed.

### Next Task

`D34-T02 - Add Public Order Tracking With Guarded Lookup`

---

## SR-135 - D34-T02: Add Public Order Tracking With Guarded Lookup

- Date: 2026-07-16
- Status: completed
- Phase: Day 34 - Customer orders and tracking

### Objective

Allow public order tracking by order code plus matching checkout contact while
avoiding order-existence leaks for another customer's order.

### Actual Result

- Added `POST /api/orders/track`.
- Added `/orders/track`.
- Added guarded public order tracking repository read.
- Added public tracking request validation for order code plus email or phone.
- Added order tracking navigation/footer links.
- Updated API contract and known limitations for guarded public lookup.
- Added `caseflow-store/scripts/verify-public-order-tracking.ts`.

### Guardrails Preserved

- Order code alone is not enough to view tracking data.
- Wrong-contact and missing-order lookups return the same `ORDER_NOT_FOUND`
  response.
- Public tracking responses exclude customer email, phone, shipping address, and
  item detail.
- The endpoint returns a tracking-safe snapshot: order code, order status,
  payment method/status, shipping method, total, item count, and timestamps.
- No real payment credentials are collected or displayed.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d34-t02/public-order-tracking-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d34-t02/public-tracking-success-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d34-t02/public-tracking-error-mobile-vi.png`
- `npx tsx scripts/verify-public-order-tracking.ts` passed with:
  - valid email lookup returns the order.
  - valid normalized phone lookup returns the order.
  - wrong contact returns 404 `ORDER_NOT_FOUND`.
  - missing order returns the same 404 `ORDER_NOT_FOUND` response.
  - invalid order code returns 400 `VALIDATION_ERROR`.
  - public payload does not include customer email, phone, or shipping address.
  - English success and Vietnamese error tracking screenshots have no horizontal
    overflow.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 25 app routes.
- `git diff --check`: passed.

### Next Task

`D34-T03 - Accept Checkout/Auth Freeze`

---

## SR-136 - D34-T03: Accept Checkout/Auth Freeze

- Date: 2026-07-16
- Status: completed
- Phase: Day 34 - Customer orders and tracking

### Objective

Accept the checkout/auth freeze only after account-gated checkout, payment
simulation, customer order history, public order tracking, and remaining risks
are verified and documented.

### Actual Result

- Added `docs/v1.1-checkout-auth-freeze.md`.
- Added app mirror `caseflow-store/docs/v1.1-checkout-auth-freeze.md`.
- Added `caseflow-store/scripts/verify-checkout-auth-freeze.ts`.
- Checkout/auth freeze is now active before Day 35 admin/staff work.

### Guardrails Preserved

- Anonymous checkout remains blocked by redirect and API 401.
- Authenticated customer checkout requires a complete customer profile.
- Server-owned totals remain authoritative.
- Payment stays simulated and collects no real payment credentials.
- Customer order history remains customer-scoped.
- Public tracking still requires order code plus matching contact.
- Remaining production risks are documented before admin operations expand.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-anonymous-gate.png`
  - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-order-history-en.png`
  - `caseflow-store/.agent/artifacts/d34-t03/checkout-auth-freeze-public-tracking-en.png`
- `npx tsx scripts/verify-checkout-auth-freeze.ts` passed with:
  - anonymous `/checkout` redirects to `/account?next=/checkout`.
  - anonymous `POST /api/orders` returns 401 `UNAUTHORIZED`.
  - authenticated customer checkout shell is available with profile state
    `ready`.
  - VNPay express order creates with total `202300`.
  - persisted order row has `payment_method = vnpay`,
    `payment_status = awaiting-provider-confirmation`,
    `shipping_method = express`, and `total_vnd = 202300`.
  - customer order history shows the order, item snapshot, payment method,
    payment status, and total without overflow.
  - public tracking shows payment/shipping state and total without overflow.
  - source search found no real payment credential input fields.
  - freeze documentation contains allowed changes, guarded tracking boundary,
    and remaining risks.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 25 app routes.
- `git diff --check`: passed.

### Day 34 Result

Day 34 is complete. Checkout/auth freeze is accepted; Day 35 can start staff
and admin shell work without weakening the frozen customer checkout contracts.

### Next Task

`D35-T01 - Add Staff/Operator Role`

---

## SR-137 - D35-T01: Add Staff/Operator Role

- Date: 2026-07-16
- Status: completed
- Phase: Day 35 - Roles and admin shell

### Objective

Add a verified staff/operator role model that distinguishes staff operations
from admin-only settings while preserving customer and anonymous denial.

### Actual Result

- Added server-side admin/staff permission policy in
  `caseflow-store/src/lib/auth/admin.ts`.
- Allowed staff and admin sessions through the operations login for order work.
- Updated protected order APIs to require explicit permissions.
- Added admin-only `GET /api/admin/settings` as the high-risk settings boundary.
- Updated operations UI wording and role badge for admin/staff sessions.
- Added `docs/v1.1-role-access-policy.md` and app mirror.
- Updated API contract with admin/staff endpoint permissions.
- Added `caseflow-store/scripts/verify-staff-role-access.ts`.

### Guardrails Preserved

- Anonymous calls to admin/staff APIs return `UNAUTHORIZED`.
- Customer calls to admin/staff APIs return `FORBIDDEN`.
- Staff can read/update orders but cannot access admin-only settings.
- Admin can read/update orders and access settings.
- Role and permission checks run in server pages and Route Handlers.
- Checkout/auth freeze boundaries remain unchanged.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d35-t01/staff-role-access-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d35-t01/staff-operations-orders-page-en.png`
- `npx tsx scripts/verify-staff-role-access.ts` passed with:
  - anonymous orders/settings APIs return 401 `UNAUTHORIZED`.
  - customer orders/settings/status-update APIs return 403 `FORBIDDEN`.
  - staff orders API returns 200, settings API returns 403, status update
    returns 200, and operations page reports role `staff`.
  - admin orders/settings/status-update APIs return 200 and operations page
    reports role `admin`.
  - order status reaches `shipping` after staff/admin updates.
  - role policy doc contains permission matrix and staff boundary.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 26 app routes.
- `git diff --check`: passed.

### Next Task

`D35-T02 - Rebuild Admin Navigation For Book Operations`

---

## SR-138 - D35-T02: Rebuild Admin Navigation For Book Operations

- Date: 2026-07-16
- Status: completed
- Phase: Day 35 - Roles and admin shell

### Objective

Create a role-aware admin/staff operations shell for CaseFlow Books so Day 36
and later management work has a professional, navigable foundation without
weakening server-side authorization.

### Actual Result

- Added shared admin operations navigation in
  `caseflow-store/src/features/admin/admin-navigation.tsx`.
- Added shared admin shell/dashboard presentation in
  `caseflow-store/src/features/admin/admin-shell-page.tsx`.
- Added `/admin` as the operations dashboard.
- Added shell routes for `/admin/catalog`, `/admin/inventory`,
  `/admin/promotions`, `/admin/customers`, and `/admin/settings`.
- Updated `/admin/orders` to include the shared operations navigation.
- Updated the main site admin link and operations login redirect to `/admin`.
- Added `caseflow-store/scripts/verify-admin-navigation.ts`.

### Guardrails Preserved

- Staff sees dashboard, orders, catalog, inventory, promotions, and customers,
  but settings is hidden from the staff navigation.
- Direct staff access to `/admin/settings` renders an access-denied state.
- Admin can see and open settings.
- Server-side checks remain authoritative; UI hiding is not treated as the
  security boundary.
- D35-T02 only creates navigation shells. Real catalog, inventory, promotion,
  customer, and dashboard operations remain Day 36-Day 38 work.
- Checkout/auth freeze boundaries remain unchanged.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d35-t02/admin-navigation-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d35-t02/admin-navigation-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d35-t02/staff-admin-navigation-mobile-en.png`
- `npx tsx scripts/verify-admin-navigation.ts` passed with:
  - staff mobile navigation visible for in-scope operations.
  - staff settings navigation hidden.
  - direct staff settings page denied.
  - admin desktop navigation includes settings.
  - admin settings shell is accessible.
  - desktop and mobile navigation checks report no horizontal overflow.
- Screenshot dimensions verified:
  - desktop: `1440x1000`.
  - mobile: `390x1830`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 32 app routes.
- `git diff --check`: passed.

### Day 35 Result

Day 35 is complete. Staff/operator permissions and the role-aware operations
shell are ready for Day 36 catalog management work.

### Next Task

`D36-T01 - Add Admin Book Catalog Management`

---

## SR-139 - D36-T01: Add Admin Book Catalog Management

- Date: 2026-07-17
- Status: completed
- Phase: Day 36 - Catalog and inventory management

### Objective

Add real admin/staff management for sellable CaseFlow Books editions while
preserving the frozen public catalog contract and server-side authorization.

### Actual Result

- Added `catalog:manage` permission for admin and staff.
- Added admin book catalog API mapping in
  `caseflow-store/src/lib/api/admin-book-catalog.ts`.
- Added admin create/update validation schemas in
  `caseflow-store/src/lib/validation/books.ts`.
- Added service-role-backed admin catalog repository mutations in
  `caseflow-store/src/lib/repositories/supabase-books.ts`.
- Added admin catalog APIs:
  - `GET /api/admin/books/editions`
  - `POST /api/admin/books/editions`
  - `PATCH /api/admin/books/editions/[id]`
- Replaced `/admin/catalog` placeholder with a role-aware management UI for
  listing, searching, creating, editing, activating, and deactivating book
  editions.
- Added `caseflow-store/scripts/verify-admin-book-catalog.ts`.

### Guardrails Preserved

- Anonymous catalog admin API access returns `UNAUTHORIZED`.
- Customer catalog admin API access returns `FORBIDDEN`.
- Mutations run only after `catalog:manage` is verified on the server.
- Browser payloads cannot bypass Zod validation for price, stock, slug,
  language, format, active state, or summaries.
- Public catalog reads continue to exclude inactive editions.
- D36-T01 manages sellable editions only; it does not expand schema/domain
  contracts to create new works, authors, categories, publishers, or media.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-desktop-en.png`
- `npx tsx scripts/verify-admin-book-catalog.ts` passed with:
  - anonymous admin catalog API returns 401 `UNAUTHORIZED`.
  - customer admin catalog API returns 403 `FORBIDDEN`.
  - invalid staff catalog payload returns 400 `VALIDATION_ERROR`.
  - staff UI creates a QA book edition.
  - staff UI edits the edition title.
  - staff UI deactivates the edition and public detail returns 404.
  - staff UI reactivates the edition and public detail returns 200.
  - QA edition row is cleaned up.
  - admin catalog page reports no horizontal overflow.
- Screenshot dimensions verified: `1440x11109`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 33 app routes.
- `git diff --check`: passed.

### Next Task

`D36-T02 - Add Inventory Adjustment Workflow`

---

## SR-140 - D36-T02: Add Inventory Adjustment Workflow

- Date: 2026-07-17
- Status: completed
- Phase: Day 36 - Catalog and inventory management

### Objective

Add staff/admin inventory adjustment with required reasons and audit records,
while keeping public purchase boundaries aligned with current stock.

### Actual Result

- Added `inventory:adjust` permission for admin and staff.
- Added `book_inventory_adjustments` to TypeScript Supabase table types.
- Added inventory adjustment mapper and validation.
- Added inventory repository functions to read audit rows and adjust stock.
- Added admin inventory APIs:
  - `GET /api/admin/inventory`
  - `POST /api/admin/inventory/adjustments`
- Replaced `/admin/inventory` placeholder with a stock list, search, adjustment
  form, low/out-of-stock visibility, and recent adjustment audit list.
- Added `caseflow-store/scripts/verify-inventory-adjustments.ts`.

### Guardrails Preserved

- Anonymous inventory API access returns `UNAUTHORIZED`.
- Customer inventory API access returns `FORBIDDEN`.
- Only sessions with `inventory:adjust` can submit adjustments.
- Adjustment payloads require non-zero integer deltas and a reason.
- Negative adjustments that would make stock below zero are rejected.
- Every successful adjustment writes an audit row.
- Public catalog and cart validation use the adjusted stock/status.
- D36-T02 does not claim checkout stock reservation or automatic stock decrement.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d36-t02/inventory-adjustments-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d36-t02/inventory-adjustments-desktop-en.png`
- `npx tsx scripts/verify-inventory-adjustments.ts` passed with:
  - anonymous inventory API returns 401 `UNAUTHORIZED`.
  - customer inventory API returns 403 `FORBIDDEN`.
  - zero adjustment returns 400 `VALIDATION_ERROR`.
  - over-negative adjustment returns 409 `OUT_OF_STOCK`.
  - staff UI positive adjustment changes stock from 2 to 7.
  - staff UI negative adjustment changes stock from 7 to 1.
  - low-stock state is visible through public detail data.
  - final sell-through changes stock to 0 and public status to `out-of-stock`.
  - cart validation rejects the out-of-stock edition with 409 `OUT_OF_STOCK`.
  - audit trail stores +5, -6, and -1 rows.
  - cleanup removes 3 adjustment rows and 1 QA edition row.
  - inventory page reports no horizontal overflow.
- Screenshot dimensions verified: `1440x1639`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 35 app routes.
- `git diff --check`: passed.

### Day 36 Result

Day 36 is complete. Book catalog management and inventory adjustment workflows
are verified and ready for Day 37 promotions, customers, and order operations.

### Next Task

`D37-T01 - Add Promotion Management`

---

## SR-141 - D37-T01: Add Promotion Management

- Date: 2026-07-17
- Status: completed
- Phase: Day 37 - Promotions, customers, and order operations

### Objective

Add admin-only promotion management and connect promotion-code application to
server-owned checkout totals without trusting browser-supplied discounts.

### Actual Result

- Added `promotions:manage` permission for admin only.
- Updated admin navigation so staff no longer sees Promotions.
- Added `book_promotions` TypeScript table typing and row mapper.
- Added promotion validation schemas for admin create/update and checkout
  promotion-code input.
- Added service-role-backed promotion repository functions for listing,
  creating, updating, and evaluating promotions.
- Added admin promotion APIs:
  - `GET /api/admin/promotions`
  - `POST /api/admin/promotions`
  - `PATCH /api/admin/promotions/[id]`
- Replaced `/admin/promotions` placeholder with a management UI for listing,
  searching, creating, editing, activating, and deactivating promotion codes.
- Added optional checkout promotion-code input.
- Updated checkout order creation so the server evaluates active/expired/
  inactive/invalid promotion codes, clamps discount to subtotal, recalculates
  VAT/total, and persists the promotion snapshot.
- Added `caseflow-store/scripts/verify-promotion-management.ts`.
- Updated `caseflow-store/scripts/verify-admin-navigation.ts` to reflect the
  admin-only promotion boundary.

### Guardrails Preserved

- Anonymous promotion API access returns `UNAUTHORIZED`.
- Customer and staff promotion API access returns `FORBIDDEN`.
- Promotion discounts are not trusted from the browser.
- Invalid, expired, inactive, and over-limit promotions are rejected.
- Server totals remain authoritative for discount, VAT, shipping, payment fee,
  display estimate, and order total.
- No real payment processing or card fields were introduced.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d37-t01/promotion-management-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d37-t01/admin-promotions-desktop-en.png`
- `npx tsx scripts/verify-promotion-management.ts` passed with:
  - anonymous promotion API returns 401 `UNAUTHORIZED`.
  - customer and staff promotion API access returns 403 `FORBIDDEN`.
  - admin UI creates, deactivates, and reactivates a fixed-VND promotion.
  - over-limit percentage promotion returns 400 `VALIDATION_ERROR`.
  - checkout applies a valid promotion and persists `promotion_code`,
    `discount_total_vnd`, and recalculated `total_vnd`.
  - expired, inactive, and invalid promotion codes return 400
    `PROMOTION_INVALID`.
  - tampered client discount/total fields are ignored.
  - QA promotions and order are cleaned up.
  - admin promotions page reports no horizontal overflow.
- Updated `npx tsx scripts/verify-admin-navigation.ts` passed with staff
  promotions hidden and admin promotions visible.
- Screenshot dimensions verified: `1440x1783`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 36 app routes.
- `git diff --check`: passed.

### Next Task

`D37-T02 - Add Customer Management`

---

## SR-142 - D37-T02: Add Customer Management

- Date: 2026-07-17
- Status: completed
- Phase: Day 37 - Promotions, customers, and order operations

### Objective

Add read-only customer management for admin/staff users while keeping customer
contact and address data minimized.

### Actual Result

- Added a service-role-backed customer operations repository that lists customer
  profiles and aggregates linked order metrics by `customer_id`.
- Added admin customer API mapping and `GET /api/admin/customers`.
- Replaced the `/admin/customers` placeholder with customer search, customer
  list, profile-readiness metrics, and a detail panel.
- Exposed customer email, profile state, masked phone last-four, shipping
  district/province summary, order count, total spend, and last order metadata.
- Added `caseflow-store/scripts/verify-admin-customers.ts`.

### Guardrails Preserved

- Anonymous customer-management API access returns `UNAUTHORIZED`.
- Customer-session access returns `FORBIDDEN`.
- Admin and staff access is server-checked through the existing `orders:read`
  permission.
- The API does not expose full default shipping address lines or raw phone
  numbers.
- D37-T02 is read-only; it does not let staff/admin mutate customer profiles or
  impersonate customers.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d37-t02/admin-customers-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d37-t02/admin-customers-desktop-en.png`
- `npx tsx scripts/verify-admin-customers.ts` passed with:
  - anonymous access blocked with 401.
  - customer access blocked with 403.
  - admin/staff customer reads succeed.
  - complete and incomplete customer states render correctly.
  - full address line is not exposed, while district/province summary is visible.
  - order count and last-order metrics are shown.
  - QA order cleanup is verified.
  - admin customers page reports no horizontal overflow.
- Screenshot dimensions verified: `1440x1930`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 37 app routes.
- `git diff --check`: passed.

### Next Task

`D37-T03 - Upgrade Order Operations`

---

## SR-143 - D37-T03: Upgrade Order Operations

- Date: 2026-07-17
- Status: completed
- Phase: Day 37 - Promotions, customers, and order operations

### Objective

Upgrade admin/staff order operations so operators can filter orders, inspect
details, update order/payment/shipping status within allowed transitions, and
save internal notes.

### Actual Result

- Added additive Supabase migration
  `caseflow-store/supabase/migrations/0007_order_operations_fields.sql` for:
  - `orders.shipping_status`
  - `orders.internal_notes`
  - shipping status constraint
  - internal notes length constraint
  - shipping status index
- Added `ShippingStatus` constants/schema and TypeScript Supabase table types.
- Added shared order/payment/shipping transition rules in
  `caseflow-store/src/lib/orders/status-transitions.ts`.
- Added admin order filters for `q`, `status`, `paymentStatus`, and
  `shippingStatus`.
- Updated `GET /api/admin/orders` to apply validated server-side filters.
- Updated `PATCH /api/admin/orders/[id]` to update order status, payment
  status, shipping status, and internal notes.
- Added server-side transition rejection with `ORDER_INVALID_TRANSITION`.
- Rebuilt the admin orders UI with filter controls, operation status display,
  a combined operations form, and internal notes editing.
- Added `caseflow-store/scripts/verify-admin-order-operations.ts`.
- Updated API contract and role access policy docs plus app mirrors.

### Guardrails Preserved

- Anonymous order operations API access returns `UNAUTHORIZED`.
- Customer access returns `FORBIDDEN`.
- Staff/admin access still requires `orders:read` for list and
  `orders:update-status` for updates.
- Internal notes are stored only in the admin order operations payload and are
  not added to customer/public order mappers.
- Browser-supplied status transitions are validated on the server; UI options
  are guidance only.
- No real payment/shipping provider integration was claimed.

### Verification

- Supabase migration was applied and checked against the live DB:
  `shipping_status`, `internal_notes`, both constraints, and
  `orders_shipping_status_idx` exist.
- Artifact:
  `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-check.json`
- Screenshot:
  `caseflow-store/.agent/artifacts/d37-t03/admin-order-operations-desktop-en.png`
- `npx tsx scripts/verify-admin-order-operations.ts` passed with:
  - anonymous access blocked with 401 `UNAUTHORIZED`.
  - customer access blocked with 403 `FORBIDDEN`.
  - staff filtered read returns the QA order.
  - invalid order and shipping transitions return 409
    `ORDER_INVALID_TRANSITION`.
  - valid API update moves order to confirmed/payment confirmed/shipping
    preparing.
  - UI filter locates the order, updates order status to shipping, shipping
    status to shipped, and saves internal notes.
  - final DB row persists the expected order/payment/shipping/notes state.
  - QA order cleanup removes the created order.
  - admin orders page reports no horizontal overflow.
- Screenshot dimensions verified: `1440x2294`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 37 app routes.
- `git diff --check`: passed.

### Day 37 Result

Day 37 is complete. Promotions, customer management, and order operations are
verified and ready for Day 38 dashboard/reporting work.

### Next Task

`D38-T01 - Add Sales And Inventory Dashboard`

---

## SR-144 - D38-T01: Add Sales And Inventory Dashboard

- Date: 2026-07-17
- Status: completed
- Phase: Day 38 - Business dashboard and operations freeze

### Objective

Replace the operations dashboard placeholder with server-backed sales,
payment, order, inventory, top-book, and recent-order metrics.

### Actual Result

- Added dashboard query validation with `7d`, `30d`, `all`, and custom
  `from/to` range support.
- Added `caseflow-store/src/lib/repositories/supabase-dashboard.ts` to query
  Supabase orders, order items, and book editions server-side.
- Added `GET /api/admin/dashboard`, protected by `orders:read`.
- Replaced `/admin` placeholder content with `AdminDashboardPage`.
- Dashboard now shows:
  - revenue estimate.
  - order count.
  - average order value.
  - active edition count.
  - payment status summary.
  - order status summary.
  - top books.
  - low-stock/out-of-stock inventory risk.
  - recent orders.
  - empty order range state.
- Added `caseflow-store/scripts/verify-admin-dashboard.ts`.
- Updated API contract and role access policy docs plus app mirrors for the
  dashboard endpoint.

### Guardrails Preserved

- Anonymous dashboard API access returns `UNAUTHORIZED`.
- Customer access returns `FORBIDDEN`.
- Staff/admin access requires `orders:read`.
- Metrics are calculated in server/repository code from Supabase data, not from
  browser-guessed totals.
- Revenue is labeled as an estimate; no accounting-grade revenue or real payment
  settlement is claimed.
- Empty-state verification uses a future custom date range so real data is not
  deleted or hidden.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-empty-mobile-en.png`
- `npx tsx scripts/verify-admin-dashboard.ts` passed with:
  - anonymous access blocked with 401 `UNAUTHORIZED`.
  - customer access blocked with 403 `FORBIDDEN`.
  - staff API metrics exactly match seeded QA data:
    - order count `3`.
    - revenue estimate `500000`.
    - top book quantity `3`.
    - top book revenue `500000`.
    - cancelled payment count `1`.
    - QA low-stock edition appears.
  - dashboard UI shows revenue, top book, low-stock item, and recent orders.
  - future empty range shows empty order state and zero revenue.
  - desktop and mobile dashboard views report no horizontal overflow.
  - QA orders, QA edition, and QA work are cleaned up.
- Screenshot dimensions verified:
  - dashboard desktop: `1440x2264`.
  - empty mobile: `390x3621`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 38 app routes.
- `git diff --check`: passed.

### Next Task

`D38-T02 - Add CSV Export For Orders Or Inventory`

---

## SR-145 - D38-T02: Add CSV Export For Orders Or Inventory

- Date: 2026-07-17
- Status: completed
- Phase: Day 38 - Business dashboard and operations freeze

### Objective

Add a protected server-generated CSV export for operational order data.

### Actual Result

- Added `GET /api/admin/exports/orders`, protected by `orders:read`.
- Added `caseflow-store/src/lib/repositories/supabase-order-exports.ts` to
  generate CSV from Supabase order rows and item quantities.
- Export query supports the dashboard date-window shape: `range=7d|30d|all`
  or paired `from/to` custom dates.
- Added an order CSV export link to the admin dashboard range controls.
- Added `caseflow-store/scripts/verify-admin-orders-csv-export.ts`.
- Updated API contract and role access policy docs plus app mirrors.
- Fixed the D38-T01 dashboard verification fixture so temporary active QA books
  include valid author/category relationships before public catalog mappers can
  see them.

### Guardrails Preserved

- Anonymous export access returns `UNAUTHORIZED`.
- Customer export access returns `FORBIDDEN`.
- Staff/admin export access requires `orders:read`.
- CSV is generated server-side and does not trust browser-provided totals.
- The CSV intentionally excludes customer email, phone, full shipping address,
  customer id, and internal notes.
- Payment data remains simulated; no real settlement export is implied.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d38-t02/admin-orders-csv-export-check.json`
- `npx tsx scripts/verify-admin-orders-csv-export.ts` passed with:
  - anonymous access blocked with 401 `UNAUTHORIZED`.
  - customer access blocked with 403 `FORBIDDEN`.
  - staff export returned `text/csv` and attachment filename headers.
  - representative order row includes order code, item count `2`, subtotal
    `440000`, and total `440000`.
  - customer email, phone, address, and internal note sentinel are excluded.
  - dashboard export link preserves the custom date range.
  - QA order cleanup removes the created order.
- `npx tsx scripts/verify-admin-dashboard.ts` was rerun after the fixture fix
  and passed, including cleanup of QA orders, edition, author/category links,
  work, and author.
- Public `/api/products` returned 200 with catalog data after the dashboard
  fixture rerun.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 39 app routes.
- `git diff --check`: passed.

### Next Task

`D38-T03 - Accept Operations Freeze`

---

## SR-146 - D38-T03: Accept Operations Freeze

- Date: 2026-07-17
- Status: completed
- Phase: Day 38 - Business dashboard and operations freeze

### Objective

Accept the Day 38 operations freeze after verifying admin/staff operations,
dashboard, inventory, promotions, customers, order workflows, CSV export, role
boundaries, and QA cleanup.

### Actual Result

- Added `docs/v1.1-operations-freeze.md` and app mirror.
- Added `caseflow-store/scripts/verify-operations-freeze.ts`.
- The freeze document records frozen behavior, evidence, allowed post-freeze
  changes, changes requiring review, and remaining risks.
- Operations freeze is now active for admin/staff navigation, catalog,
  inventory, promotions, customers, orders, dashboard, CSV export, and role
  boundaries.

### Guardrails Preserved

- UI visibility is not treated as authorization.
- Anonymous admin/staff API access returns `UNAUTHORIZED`.
- Customer admin/staff API access returns `FORBIDDEN`.
- Staff remains blocked from promotion management and admin settings APIs.
- Admin retains promotion and settings access.
- No new operations feature is allowed after this task without explicit review,
  except release-blocking fixes or security fixes that preserve the permission
  model.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-staff-dashboard.png`
  - `caseflow-store/.agent/artifacts/d38-t03/operations-freeze-admin-settings.png`
- `npx tsx scripts/verify-operations-freeze.ts` passed with:
  - admin endpoints and privileged pages available.
  - staff endpoints available for dashboard, CSV, orders, catalog, inventory,
    and customers.
  - staff promotion/settings APIs denied with 403 `FORBIDDEN`.
  - anonymous all protected endpoints denied with 401 `UNAUTHORIZED`.
  - customer all protected endpoints denied with 403 `FORBIDDEN`.
  - all required D35-D38 artifacts exist and report `ok: true`.
  - QA cleanup scan found 0 operation orders, profiles, QA editions, QA
    authors, QA promotions, and QA inventory adjustments.
  - freeze doc contains allowed changes, review boundaries, remaining risks,
    CSV PII boundary, and server-side authorization language.
- Screenshot dimensions verified:
  - staff dashboard: `1440x1100`.
  - admin settings: `1440x1100`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 39 app routes.
- `git diff --check`: passed.

### Day 38 Result

Day 38 is complete. Operations freeze is active.

### Next Task

`D39-T01 - Add Rule-Based Bookstore Assistant`

---

## SR-147 - D39-T01: Add Rule-Based Bookstore Assistant

- Date: 2026-07-17
- Status: completed
- Phase: Day 39 - Assistant, SEO, accessibility, and performance

### Objective

Add a non-AI, rule-based bookstore assistant that helps customers find books
and understand buying steps without bypassing checkout/account validation.

### Actual Result

- Added `caseflow-store/src/features/assistant/bookstore-assistant.tsx`.
- Mounted the assistant through `caseflow-store/src/app/providers.tsx`.
- Assistant supports:
  - title/search prompts.
  - category keywords.
  - edition language hints.
  - format hints.
  - VND price range hints.
  - suggested messages.
  - result cards with book detail links.
  - catalog result links.
  - no-result recovery links.
  - checkout guidance with cart/account/checkout links.
- Added `caseflow-store/scripts/verify-bookstore-assistant.ts`.

### Guardrails Preserved

- No external AI API is used.
- Assistant reads the public catalog API only.
- Assistant does not add cart items, create orders, write checkout data, or
  bypass account/profile/cart/server validation.
- Checkout guidance opens the cart or links to account/checkout only.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d39-t01/bookstore-assistant-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d39-t01/assistant-find-book-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t01/assistant-no-result-mobile-en.png`
  - `caseflow-store/.agent/artifacts/d39-t01/assistant-checkout-guidance-desktop-en.png`
- `npx tsx scripts/verify-bookstore-assistant.ts` passed with:
  - title search for `Pride and Prejudice` returned 2 result links.
  - first detail link returned HTTP 200.
  - catalog result link returned HTTP 200.
  - language/format/price prompt produced
    `/catalog?language=en&format=paperback&maxPriceVnd=200000`.
  - no-result prompt displayed recovery and a valid catalog link.
  - checkout prompt showed cart/account/checkout guidance, opened the cart, and
    made 0 `POST /api/orders` requests.
  - source scan found no external AI endpoint/API-key references.
- Screenshot dimensions verified:
  - find-book desktop: `1440x1000`.
  - no-result mobile: `390x920`.
  - checkout guidance desktop: `1440x1000`.
- Screenshot visual review found no incoherent overlap or horizontal overflow.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and generated 39 app routes.
- `git diff --check`: passed.

### Next Task

`D39-T02 - Add SEO And Metadata For Bookstore`

---

## SR-148 - D39-T02: Add SEO And Metadata For Bookstore

- Date: 2026-07-17
- Status: completed
- Phase: Day 39 - Assistant, SEO, accessibility, and performance

### Objective

Add bookstore-specific SEO metadata for the public CaseFlow Books surfaces and
verify robots, sitemap, canonical URLs, and structured book data.

### Actual Result

- Added `caseflow-store/src/lib/seo/metadata.ts` for consistent site URL,
  canonical URL, Open Graph, Twitter, and description truncation behavior.
- Added dynamic metadata for homepage, catalog, book detail, order tracking,
  checkout, checkout success, account, and account orders pages.
- Added noindex/nofollow metadata for account and checkout surfaces.
- Added `caseflow-store/src/app/robots.ts`.
- Added `caseflow-store/src/app/sitemap.ts`.
- Added book detail JSON-LD with `Book` and `Offer` data when record quality is
  sufficient.
- Added optional `NEXT_PUBLIC_SITE_URL` documentation in `.env.example`.
- Added `caseflow-store/scripts/verify-seo-metadata.ts`.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d39-t02/seo-metadata-check.json`
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`:
  passed and generated 41 app routes.
- `SEO_METADATA_BASE_URL=http://127.0.0.1:3006 npx tsx scripts/verify-seo-metadata.ts`
  passed with:
  - account noindex canonical check.
  - catalog metadata check.
  - book detail metadata check.
  - bilingual homepage metadata check.
  - robots disallow/allow and sitemap reference check.
  - sitemap public-route inclusion and private-route exclusion check.
  - book JSON-LD `Book`/`Offer` VND check.
  - public order tracking metadata check.
- `git diff --check`: passed.

### Notes

- Local `.env.local` currently sets `NEXT_PUBLIC_SITE_URL=http://localhost:3000`;
  the SEO verification intentionally rebuilt and started the app with
  `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app` to verify production
  canonical output without modifying local secrets/config.

### Next Task

`D39-T03 - Run Accessibility, Mobile, And Performance Pass`

---

## SR-149 - D39-T03: Run Accessibility, Mobile, And Performance Pass

- Date: 2026-07-17
- Status: completed
- Phase: Day 39 - Assistant, SEO, accessibility, and performance

### Objective

Verify core customer and admin pages at mobile/desktop sizes, confirm focus
targets remain usable, and check the 100-edition catalog is rendered with
controlled page size.

### Actual Result

- Added `caseflow-store/scripts/verify-accessibility-mobile-performance.ts`.
- Verified public home, catalog, book detail, checkout, admin dashboard, and
  admin orders surfaces at representative 375px and 1440px widths.
- Verified focus targets for:
  - language switch.
  - assistant toggle.
  - cart button.
  - checkout customer name.
  - checkout payment option.
  - checkout submit.
  - admin orders navigation.
  - admin dashboard range.
  - admin CSV export.
- Verified catalog performance guard:
  - `100` total editions.
  - `24` rendered cards.
  - pagination visible.
  - local production navigation around `596ms` in the final artifact.
- Fixed a real mobile overlap found during visual review:
  - assistant no longer renders on checkout/account/admin form or operations
    surfaces.
  - assistant toggle is compact on mobile storefront pages.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`
- Screenshots:
  - `caseflow-store/.agent/artifacts/d39-t03/home-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/home-mobile-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/catalog-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/catalog-mobile-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/product-detail-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/product-detail-mobile-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/checkout-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/checkout-mobile-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/admin-dashboard-desktop-en.png`
  - `caseflow-store/.agent/artifacts/d39-t03/admin-orders-mobile-en.png`
- `ACCESSIBILITY_MOBILE_BASE_URL=http://127.0.0.1:3006 npx tsx scripts/verify-accessibility-mobile-performance.ts`
  passed with admin controls, catalog performance, checkout controls,
  focus states, overflow, and screenshot checks all true.
- `BOOKSTORE_ASSISTANT_BASE_URL=http://127.0.0.1:3006 npx tsx scripts/verify-bookstore-assistant.ts`
  passed after the assistant overlay fix.
- Screenshot visual review confirmed checkout mobile no longer has the fixed
  assistant button covering form fields, and the storefront mobile assistant
  toggle is compact.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`:
  passed and generated 41 app routes.
- `git diff --check`: passed.

### Day 39 Result

Day 39 is complete. Assistant, SEO, accessibility, mobile, and catalog
performance checks are verified.

### Next Task

`D40-T01 - Run Full Local Quality Gate`

---

## SR-150 - D40-T01: Run Full Local Quality Gate

- Date: 2026-07-17
- Status: completed
- Phase: Day 40 - v1.1 release candidate and portfolio update

### Objective

Run the full local release gate for CaseFlow Books `v1.1`, including lint,
TypeScript, production build, full Playwright, cleanup checks, and dependency
audit review.

### Actual Result

- Migrated stale E2E tests away from legacy phone-accessory, guest-checkout,
  and `PRODUCT_NOT_FOUND` assumptions.
- Updated E2E helpers to create complete customer profiles, use authenticated
  customer checkout, find live available book editions dynamically, and seed
  cart data with current book edition IDs.
- Fixed a real tablet header overflow at `768px` by moving desktop header
  navigation/actions from the `md` breakpoint to `lg`.
- Added `caseflow-store/scripts/verify-release-cleanup.ts`.
- Added release audit notes:
  - `docs/v1.1-release-audit.md`
  - `caseflow-store/docs/v1.1-release-audit.md`

### Verification

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`:
  passed and generated 41 app routes.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3006 npx playwright test`: passed with
  `20 passed`.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with `totalMatches: 0`.
- `git diff --check`: passed.

### Audit Review

- Artifact: `caseflow-store/.agent/artifacts/d40-t01/npm-audit.json`.
- `npm audit --audit-level=moderate` found `0` high, `0` critical, and `2`
  moderate findings through `next@16.2.10 -> postcss@8.4.31`.
- `npm view next version` reported `16.2.10`; no newer stable Next.js version
  was available during this check.
- `npm audit fix --force` proposes a breaking downgrade to `next@9.3.3`, so it
  was not applied. The moderate transitive risk is documented in
  `docs/v1.1-release-audit.md`.

### Next Task

`D40-T02 - Deploy And Smoke Test v1.1`

---

## SR-151 - D40-T02: Deploy And Smoke Test v1.1

- Date: 2026-07-17
- Status: completed
- Phase: Day 40 - v1.1 release candidate and portfolio update

### Objective

Deploy the CaseFlow Books `v1.1` release candidate to production and verify the
public app, core APIs, protected admin boundaries, assistant, cleanup state, and
secret hygiene.

### Actual Result

- Deployed to Vercel production.
- Canonical production alias:
  `https://caseflow-store.vercel.app`.
- Deployment URL:
  `https://caseflow-store-7gf7ugxka-nvt-ruong473.vercel.app`.
- Deployment ID:
  `dpl_BkiJt9gDCh5d2cHwAhpFDbLotoAy`.
- Deployment inspector:
  `https://vercel.com/nvt-ruong473/caseflow-store/BkiJt9gDCh5d2cHwAhpFDbLotoAy`.
- Vercel production environment variables were checked before deployment:
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `NEXT_PUBLIC_SUPABASE_URL` exist as encrypted production values.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d40-t02/deployment.json`.
- Artifact:
  `caseflow-store/.agent/artifacts/d40-t02/production-smoke-check.json`.
- Artifact:
  `caseflow-store/.agent/artifacts/d40-t02/secret-scan.txt`.
- Vercel production build completed with 41 app routes.
- `PRODUCTION_SMOKE_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-production-smoke.ts`
  passed for home, catalog, book detail, account, order tracking, products API,
  admin unauthorized boundary, robots, and sitemap.
- `BOOKSTORE_ASSISTANT_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-bookstore-assistant.ts`
  passed against production.
- `PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app npx playwright test tests/e2e/storefront-flow.spec.ts tests/e2e/admin-workflow.spec.ts tests/e2e/admin-access.spec.ts`
  passed with `5 passed`.
- `npx tsx scripts/verify-release-cleanup.ts` passed after production smoke with
  zero stale legacy matches.
- Secret scan passed with no committed database URL, service role key, admin
  password, or JWT-like value matches outside ignored local/build artifacts.

### Next Task

`D40-T03 - Update Portfolio Documentation`

---

## SR-152 - D40-T03: Update Portfolio Documentation

- Date: 2026-07-17
- Status: completed
- Phase: Day 40 - v1.1 release candidate and portfolio update

### Objective

Update portfolio-facing documentation so CaseFlow Books `v1.1` is represented
accurately, with honest limitations, release evidence, screenshots, and CV
language.

### Actual Result

- Updated:
  - `README.md`
  - `caseflow-store/README.md`
  - `docs/architecture.md`
  - `caseflow-store/docs/architecture.md`
  - `docs/known-limitations.md`
  - `caseflow-store/docs/known-limitations.md`
  - `docs/cv-bullets.md`
  - `caseflow-store/docs/cv-bullets.md`
  - `docs/release-candidate.md`
  - `caseflow-store/docs/release-candidate.md`
  - `docs/adr/README.md`
  - `caseflow-store/docs/adr/README.md`
- Replaced stable docs screenshots with verified CaseFlow Books `v1.1`
  screenshot assets:
  - `caseflow-store/docs/screenshots/storefront-desktop.png`
  - `caseflow-store/docs/screenshots/storefront-mobile.png`
  - `caseflow-store/docs/screenshots/catalog-desktop.png`
  - `caseflow-store/docs/screenshots/catalog-mobile.png`
  - `caseflow-store/docs/screenshots/product-desktop.png`
  - `caseflow-store/docs/screenshots/product-mobile.png`
  - `caseflow-store/docs/screenshots/checkout-mobile.png`
  - `caseflow-store/docs/screenshots/admin-dashboard-desktop.png`
  - `caseflow-store/docs/screenshots/admin-orders-mobile.png`
- Added `caseflow-store/scripts/verify-portfolio-documentation.ts`.

### Guardrails Preserved

- Documentation says payments are simulated and no real card, wallet, bank, or
  provider credentials are collected.
- Documentation says phone/email fields are not truly verified through SMS/OTP
  or a real email-verification provider.
- Documentation identifies shipping, VAT, FX, and payment-fee values as
  configurable estimates.
- Documentation states the book catalog uses factual demo metadata,
  self-written summaries, and safe placeholder cover assets rather than copied
  publisher blurbs or commercial cover hotlinks.
- CV bullets avoid claims about real revenue, real payment processing,
  commercial scale, legal compliance, or verified phone numbers.

### Verification

- Artifact:
  `caseflow-store/.agent/artifacts/d40-t03/portfolio-documentation-check.json`.
- `npx tsx scripts/verify-portfolio-documentation.ts`: passed with:
  - `brokenLinks: 0`.
  - `missingRequiredClaims: 0`.
  - `staleMatches: 0`.
  - `screenshots: 9`.
  - `ok: true`.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Representative screenshot visual review passed for storefront desktop,
  checkout mobile, and admin dashboard desktop.

### Next Task

`D40-T04 - Tag v1.1.0 Only If Release Gates Pass`

---

## SR-153 - D40-T04: Tag v1.1.0 Only If Release Gates Pass

- Date: 2026-07-17
- Status: completed
- Phase: Day 40 - v1.1 release candidate and portfolio update

### Objective

Create the CaseFlow Books `v1.1.0` release tag only after local quality,
production smoke, documentation, known limitation, and secret gates are
verified.

### Actual Result

- All Day 40 release gates are accepted for the final `v1.1.0` release tree.
- Release tag target: `v1.1.0`.
- Production alias:
  `https://caseflow-store.vercel.app`.
- Production deployment ID:
  `dpl_BkiJt9gDCh5d2cHwAhpFDbLotoAy`.
- Release documentation now identifies the release as `v1.1.0`.

### Verification

- D40-T01 local full quality gate passed:
  - `npx tsc --noEmit`.
  - `npm run lint`.
  - production build with 41 app routes.
  - full local Playwright with `20 passed`.
  - release cleanup with zero stale matches.
  - dependency audit reviewed and documented.
- D40-T02 production deploy/smoke passed:
  - Vercel production deployment ready.
  - production smoke script passed.
  - production assistant smoke passed.
  - production Playwright subset passed with `5 passed`.
  - post-smoke cleanup check passed.
  - secret scan clean.
- D40-T03 portfolio documentation passed:
  - docs mirror check.
  - local Markdown link check.
  - screenshot load/nonblank check.
  - stale-claim scan.
  - TypeScript, lint, and diff checks.
- Known non-blockers are documented:
  - simulated payment methods.
  - no real SMS/OTP or email-verification provider.
  - configurable VAT/FX/payment-fee assumptions.
  - safe placeholder cover strategy and curated demo metadata.
  - moderate transitive Next/PostCSS advisory with unsafe force fix rejected.

### Next Task

Post-release audit

---

## SR-154 - V12-T01: Create v1.2 Content And Merchandising ADR

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 content and merchandising planning

### Objective

Define the accepted scope, content truth model, asset rights policy,
merchandising boundaries, and release-quality expectations before any v1.2
runtime implementation.

### Actual Result

- Added accepted `ADR-0007: Realistic Bookstore Content And Merchandising
  Upgrade For v1.2` in root/app mirrors.
- Kept the released v1.1 architecture, commerce boundaries, role model, stable
  API errors, and server-owned calculations unchanged.
- Defined a provenance-first policy for factual metadata, project-written
  summaries, ISBN/edition matching, image rights, attribution, and review
  status.
- Required edition-specific safe cover assets for the 100-edition release and
  retained the generic placeholder only as an error fallback.
- Required truthful, data-backed shelves and rejected fake ratings, copied
  reviews, fabricated sold counts, unsupported bestseller labels, and invented
  publisher or market claims.
- Bounded v1.2 away from e-book fulfillment, DRM, AI recommendations, wishlist,
  customer reviews, marketplace behavior, and a general-purpose CMS.

### Verification

- Root/app ADR-0007 files match byte-for-byte.
- Root/app ADR index files match and link ADR-0007.
- Searches confirm the ADR contains the planning gate, API/copyright
  distinction, merchandising truth rules, and `V12-T02` handoff.
- `git diff --check`: passed.

### Next Task

`V12-T02 - Create v1.2 Content And Merchandising Roadmap`

---

## SR-155 - V12-T02: Create v1.2 Content And Merchandising Roadmap

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 content and merchandising planning

### Objective

Translate ADR-0007 into an ordered, testable, reversible implementation and
release plan without presenting v1.2 as fabricated Day 41+ history.

### Actual Result

- Added accepted
  `docs/v1.2-realistic-bookstore-content-merchandising-roadmap.md` in root/app
  mirrors.
- Defined `V12-T01` through `V12-T18` for planning, baseline audit,
  provenance contracts, canonical 100-edition content, cover pipeline and
  portfolio, bilingual copy, merchandising storage, reversible migration,
  Supabase application, homepage/catalog/detail/admin work, integration, local
  release acceptance, production deployment, documentation, and tagging.
- Added planning, provenance, content, data, experience, release-candidate, and
  production release gates.
- Added explicit rollback rules for Git, database data, IDs/slugs, assets,
  migrations, operations data, and Vercel deployment.
- Preserved the v1.1 architecture, security, checkout, payment, and role
  boundaries and blocked runtime work pending user confirmation of V12-T03.

### Verification

- Root/app roadmap files match byte-for-byte.
- Root/app `.agent` tracker, context, and result mirrors match.
- ADR-0007 and local roadmap links resolve.
- Exactly 18 unique task headings exist from `V12-T01` through `V12-T18`.
- All 18 tasks have acceptance criteria and verification sections.
- Trailing-whitespace check: passed.
- `git diff --check`: passed.

### Next Task

`V12-T03 - Audit v1.1 Catalog Realism Baseline`, pending explicit user
confirmation.

---

## SR-156 - V12-T03: Audit v1.1 Catalog Realism Baseline

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 provenance and baseline

### Objective

Establish a deterministic, read-only catalog, visual, accessibility,
performance, and schema baseline before realistic content or merchandising
implementation changes the v1.1 evidence.

### Actual Result

- Added `caseflow-store/scripts/audit-v12-catalog-baseline.ts` and generated
  JSON/Markdown evidence under
  `caseflow-store/.agent/artifacts/v12-t03/`.
- Confirmed exact seed/Supabase parity at 50 works, 100 active editions, 11
  active categories, 50 English editions, and 50 Vietnamese editions.
- Confirmed one primary cover asset is shared by all 100 editions, all 100 use
  a demo publisher and lack ISBN/page-count/translator credit, and 98
  Vietnamese summaries lack diacritics.
- Reviewed homepage, catalog, product detail, and authenticated admin catalog at
  375px and 1440px using 8 full-page and 8 first-viewport screenshots.
- Found zero public-page horizontal overflow and a 195px mobile overflow on
  authenticated `/admin/catalog`.
- Recorded the 41-route production build, transfer/resource observations,
  deterministic image bytes, DOM accessibility heuristics, observed zero CLS,
  and the LCP measurement limitation.
- Accepted `additive-schema-required`: define provenance contracts in
  `V12-T04`, defer minimum merchandising storage to `V12-T09`, and make no
  destructive migration.
- Added `docs/v1.2-catalog-realism-baseline.md` in root/app mirrors and updated
  the roadmap and agent context to hand off to `V12-T04`.

### Release Blockers

- `V12-B01`: all active editions share the generic placeholder.
- `V12-B02`: demo publisher plus missing ISBN/page-count facts.
- `V12-B03`: 98/100 Vietnamese summaries lack diacritics.
- `V12-B04`: provenance and merchandising cannot be represented completely.
- `V12-B05`: generic TBC/not-specified/placeholder storefront paths remain.
- `V12-B06`: bilingual pairs exist without translator records.
- `V12-B07`: admin catalog mobile layout overflows by 195px.

### Guardrails Preserved

- Supabase access used only table `select` operations; no inserts, updates,
  deletes, RPC calls, migrations, or production runtime changes were made.
- Supabase contains zero audit/test/QA catalog rows after verification.
- v1.1 IDs, slugs, data, assets, release tag, API contracts, security
  boundaries, and Vercel production behavior remain unchanged.
- Browser login was used only to read and capture the existing admin catalog;
  no admin form mutation was submitted.

### Changed Files

- Added the read-only baseline audit script.
- Added task artifacts and representative screenshots under `v12-t03`.
- Added the root/app catalog realism baseline report.
- Updated the root/app v1.2 roadmap and `.agent` mirrors.

### Verification

- `npx tsx scripts/audit-v12-catalog-baseline.ts`: passed; Supabase status
  `ok`, seed parity exact, QA rows `0`, writes `0`.
- Local production build: passed with 41 routes in 46.04 seconds.
- In-app Browser audit: 8 page/breakpoint baselines; final console warning/error
  count `0`; screenshots visually reviewed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- Root/app mirrors and JSON artifacts: verified.
- `git diff --check`: passed.

### Residual Risks

- LCP was not captured because the observer was not installed before page
  navigation; measure it in the v1.2 local release gate.
- The unnamed-control counts are a DOM heuristic and require axe-core and
  assistive-technology confirmation before being treated as defects.
- Real bibliographic values and image rights are not solved by this audit; they
  remain gated by provenance contracts and the canonical manifest.

### Next Task

`V12-T04 - Define Provenance And Content Quality Contracts`, pending explicit
user confirmation.

---

## SR-157 - V12-T04: Define Provenance And Content Quality Contracts

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 provenance gate

### Objective

Define strict catalog provenance, edition-matching, content-quality, and public
serialization contracts before curating or persisting the v1.2 catalog.

### Actual Result

- Added `CatalogProvenanceRecord` without changing the legacy v1.1
  `SourceNote` used by estimates and existing seed records.
- Defined entity, source URL, checked date, content kind, rights basis, rights
  note, license, attribution, review state, reviewer note, review timestamp,
  source-edition key, and edition-match confidence fields.
- Added Zod rules for internal, generated, licensed, public-domain,
  project-written, and bibliographic records.
- Added `EditionProvenanceSet`, which rejects duplicate fields, mismatched
  targets, and facts from different source editions.
- Added blocking and optional content-quality requirements. Only `verified`
  evidence backed by a provenance record ID receives quality credit, and every
  blocking requirement must pass for `releaseReady`.
- Added an approved-only public provenance serializer that allowlists safe
  fields and omits reviewer notes, rights-analysis notes, source-edition keys,
  entity IDs, field keys, and internal review timestamps.
- Documented that an additive database migration is required but correctly
  deferred exact SQL to `V12-T10` after the content and merchandising shapes
  are frozen.

### Changed Files

- Added `src/types/content-provenance.ts`.
- Added `src/lib/validation/content-provenance.ts`.
- Added `src/lib/content/content-quality.ts`.
- Added `src/lib/api/content-provenance.ts`.
- Added `scripts/verify-v12-content-provenance.ts`.
- Added `docs/v1.2-provenance-content-quality-contracts.md` in root/app
  mirrors and updated architecture, roadmap, and agent mirrors.
- Added
  `caseflow-store/.agent/artifacts/v12-t04/provenance-content-quality-check.json`.

### Guardrails Preserved

- No Supabase resource, migration, table, row, RLS policy, or generated
  Supabase type was changed.
- No public catalog envelope, API error code, checkout calculation, auth rule,
  role permission, storefront behavior, or production deployment was changed.
- Public serializers use explicit allowlists; internal review notes are not
  spread into public payloads.
- Existing v1.1 seed data and the `v1.1.0` release tag remain untouched.

### Verification

- `npx tsx scripts/verify-v12-content-provenance.ts`: 21/21 focused
  assertions passed.
- Valid internal, generated, licensed, public-domain, and edition-fact records
  were accepted.
- Incomplete/contradictory rights and review records plus mixed source editions
  were rejected.
- Unverified facts received zero credit; all blocking requirements were needed
  for release readiness.
- New and existing public serializers omitted the internal sentinel note.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Root/app documentation and agent mirrors: byte-identical.
- `git diff --check`: passed.

### Residual Risks

- Provenance IDs are contract-level references until the additive migration
  adds database foreign keys and RLS.
- Rights records prove the documented review state, not legal clearance; source
  availability and terms must be rechecked during catalog curation.
- The exact persistence model remains intentionally open until `V12-T05`
  through `V12-T09` freeze the content and merchandising requirements.

### Next Task

`V12-T05 - Curate The Canonical 100-Edition Catalog Manifest`, pending
explicit user confirmation.

---

## SR-158 - V12-T05: Curate The Canonical 100-Edition Catalog Manifest

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 canonical catalog

### Objective

Freeze exactly 100 source-reviewed real-book editions with deliberate bilingual
pairing, project-written copy, explicit store-owned merchandising data, and
safe compatibility for existing IDs and slugs.

### Actual Result

- Added a canonical catalog contract and Zod schema separating bibliographic
  facts from CaseFlow store offers.
- Added a source-research script and froze 50 real works as 100 reciprocal
  English/Vietnamese edition pairs.
- Added project-written Vietnamese titles and summaries with complete
  diacritics plus bilingual merchandising rationales for every edition.
- Preserved 98 existing edition IDs/slugs. Retired `The Elements of Style` and
  its two editions without redirect, then added new IDs for `The Old Man and
  the Sea` / `Ông già và biển cả`.
- Added field-level same-edition provenance for every retained source fact.
  Missing optional publisher, translator, ISBN, date, page, binding, dimension,
  and weight values remain null.
- Explicitly marked price, compare-at price, stock, threshold, promotion,
  availability, featured state, and planned SKU format as CaseFlow Books
  merchandising decisions rather than market claims.
- Corrected the inherited inventory threshold mismatch by aligning the
  canonical low-stock threshold at 10 units and verifying status consistency.

### Evidence

- `caseflow-store/src/data/books/v1.2-canonical-manifest.json`
- `caseflow-store/docs/v1.2-canonical-catalog-manifest.md`
- `caseflow-store/.agent/artifacts/v12-t05/open-library-edition-candidates.json`
- `caseflow-store/.agent/artifacts/v12-t05/canonical-manifest-check.json`
- `caseflow-store/.agent/artifacts/v12-t05/canonical-manifest-check.md`

### Verification

- Manifest build repeated with identical SHA-256
  `358a6ab29d4a3fee4ebd635dbf31511098a8fd7f4173a3f61afec9fa8c068f76`.
- Deterministic report passed for 50 works, 100 editions, 50 EN/50 VI, 50
  reciprocal pairs, 100 source reviews, and 98 preserved edition IDs/slugs.
- ISBN coverage: 74 ISBN-13 and 65 ISBN-10 values; checksum, shape, and duplicate
  checks passed with no invented identifiers.
- Field coverage: 65 publishers, 12 translator records, 94 publication years,
  83 page counts, 5 source physical formats, and null unsupported dimensions/
  weights.
- Zero duplicate IDs/slugs/ISBNs, broken pairs, unsupported facts, mixed source
  editions, bilingual gaps, missing Vietnamese diacritics, prohibited copy,
  store-ownership ambiguity, inventory mismatch, or compatibility issues.
- `npx tsx scripts/verify-v12-content-provenance.ts`: all 21 contract regression
  assertions passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed after removing the only unused-import warning.
- Root/app documentation and `.agent` mirrors: verified.
- `git diff --check`: passed.

### Guardrails Preserved

- No Supabase schema, row, RLS policy, generated database type, or runtime seed
  was changed.
- No storefront, checkout, admin, API, auth, role, deployment, or release-tag
  behavior was changed.
- No retailer description, protected excerpt, market price, market stock claim,
  or cover image was copied into the manifest.
- Cover selection and rights remain gated by `V12-T06` and `V12-T07`.

### Residual Risks

- `store.format` is a planned CaseFlow SKU configuration. Only the separate
  source physical-format field is a publisher/source-backed binding claim, and
  its current coverage is low.
- Source review does not prove supplier availability or legal clearance for
  cover art. Those require later procurement and cover-rights work.
- The manifest is not the runtime source of truth until reversible migration
  and Supabase verification in `V12-T10` and `V12-T11`.

### Next Task

`V12-T06 - Build The Edition-Specific Cover Asset Pipeline`, pending explicit
user confirmation.

---

## SR-159 - V12-T06: Build The Edition-Specific Cover Asset Pipeline

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 cover assets

### Objective

Create a safe, deterministic, edition-specific cover pipeline that can produce
reviewable assets without copying commercial covers, while proving the output
with a representative pilot before full 100-cover production.

### Actual Result

- Added cover pipeline TypeScript contracts and Zod schemas for dimensions,
  aspect ratio, checksum, file size, contrast, deterministic typography,
  bilingual alt text, source notes, approved media provenance, and explicit
  rejection of commercial cover references.
- Added `scripts/build-v12-cover-pilot.ts` to read the canonical v1.2 manifest
  and generate project-created SVG covers with localized edition titles,
  author text, visual concept keys, and rights/provenance metadata.
- Added `scripts/verify-v12-cover-pipeline.ts` to validate schema, asset files,
  checksums, dimensions, file-size budget, absence of external image
  references, rendered title/author text, language/category coverage, paired
  art families, and static desktop/mobile preview behavior.
- Produced a 10-cover pilot across five works and five English/Vietnamese
  pairs: `Pride and Prejudice`, `The Adventures of Sherlock Holmes`, `The War
  of the Worlds`, `Alice's Adventures in Wonderland`, and `The Old Man and the
  Sea`.
- Added a contact sheet, static card/detail preview HTML, and reviewed
  desktop/mobile preview screenshots.
- Documented the pipeline, rights boundary, size budget, verification commands,
  and residual T07 risks in root/app mirrors.

### Evidence

- `caseflow-store/src/types/cover-assets.ts`
- `caseflow-store/src/lib/validation/cover-assets.ts`
- `caseflow-store/scripts/build-v12-cover-pilot.ts`
- `caseflow-store/scripts/verify-v12-cover-pipeline.ts`
- `caseflow-store/src/data/books/v1.2-cover-pilot-manifest.json`
- `caseflow-store/public/images/books/v12-pilot/`
- `docs/v1.2-cover-asset-pipeline.md`
- `caseflow-store/docs/v1.2-cover-asset-pipeline.md`
- `caseflow-store/.agent/artifacts/v12-t06/cover-pipeline-check.json`
- `caseflow-store/.agent/artifacts/v12-t06/cover-pipeline-check.md`
- `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-contact-sheet.svg`
- `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-preview.html`
- `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-preview-desktop.png`
- `caseflow-store/.agent/artifacts/v12-t06/cover-pilot-preview-mobile.png`

### Verification

- `npx tsx scripts/build-v12-cover-pilot.ts`: generated 10 assets, 5 concepts,
  manifest, contact sheet, and preview HTML.
- `npx tsx scripts/verify-v12-cover-pipeline.ts`: passed with 10 assets, 5
  concepts, max SVG size 3,168 bytes, desktop/mobile preview screenshots, and
  no external image references.
- Manual visual review found the first text-wrap pass too tight for card-size
  covers; the pipeline was adjusted and regenerated before acceptance.
- Final visual review of desktop and mobile preview screenshots passed with no
  obvious clipped titles, blank images, or layout overflow.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed and generated 41 routes.

### Guardrails Preserved

- No Supabase schema, row, RLS policy, generated database type, or runtime seed
  was changed.
- No storefront, checkout, admin, API, auth, role, deployment, or release-tag
  behavior was changed.
- No commercial cover, publisher mark, retailer image, marketplace image,
  copied layout, or external image reference was used.
- The generic placeholder remains the runtime catalog image until the full
  portfolio, migration, and Supabase import tasks are accepted.

### Residual Risks

- The pilot covers 10 representative editions, not all 100 active editions.
- Project-created illustrative covers are not publisher covers and must remain
  described as CaseFlow-generated/internal assets unless later licensed or
  public-domain source evidence is added.
- Full duplicate/concept review, placeholder-zero checks, and runtime asset
  integration remain gated by `V12-T07` and later import/storefront tasks.

### Next Task

`V12-T07 - Produce And Review The 100-Cover Portfolio`.

---

## SR-160 - V12-T07: Produce And Review The 100-Cover Portfolio

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 cover assets

### Objective

Expand the accepted `V12-T06` cover pipeline from a representative pilot into a
complete, reviewable 100-cover portfolio for the canonical v1.2 edition
manifest, while preserving the project-created media rights boundary.

### Actual Result

- Extended the cover manifest schema to support both pilot and full portfolio
  outputs while preserving the T06 pilot contract.
- Added `scripts/build-v12-cover-portfolio.ts` to generate 100 local SVG cover
  assets from the canonical v1.2 manifest.
- Added `scripts/verify-v12-cover-portfolio.ts` to verify exact edition
  coverage, language balance, pair families, placeholder references, checksums,
  file sizes, dimensions, external image references, protected mark patterns,
  duplicate hashes, title/author rendering, source records, contact sheets, and
  responsive preview behavior.
- Produced 100 approved project-created SVG covers under
  `public/images/books/v12-covers/`.
- Produced all-cover, English-only, and Vietnamese-only contact sheets plus
  representative desktop/mobile card/detail preview screenshots.
- Documented the portfolio result, rights boundary, verification commands, and
  remaining runtime integration risk in root/app mirrors.

### Evidence

- `caseflow-store/scripts/build-v12-cover-portfolio.ts`
- `caseflow-store/scripts/verify-v12-cover-portfolio.ts`
- `caseflow-store/src/data/books/v1.2-cover-portfolio-manifest.json`
- `caseflow-store/public/images/books/v12-covers/`
- `docs/v1.2-cover-portfolio.md`
- `caseflow-store/docs/v1.2-cover-portfolio.md`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-check.json`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-check.md`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-all.svg`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-en.svg`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-vi.svg`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-contact-sheet-all.png`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-preview-desktop.png`
- `caseflow-store/.agent/artifacts/v12-t07/cover-portfolio-preview-mobile.png`

### Verification

- `npx tsx scripts/build-v12-cover-portfolio.ts`: generated 100 assets, 50 work
  families, 50 concept keys, and max SVG size 3,077 bytes.
- `npx tsx scripts/verify-v12-cover-portfolio.ts`: passed with 100 assets,
  50 EN/50 VI, 50 pairs, 50 art families, 0 duplicate hashes, 0 placeholder
  references, approved source records, and desktop/mobile preview screenshots.
- `npx tsx scripts/verify-v12-cover-pipeline.ts`: T06 pilot regression passed.
- Contact sheet visual review passed for all 100 covers. The portfolio is
  intentionally systematic, but no obvious blank, clipped, wrong-language, or
  duplicate-hash asset was accepted.
- Representative desktop/mobile preview screenshots passed visual review with
  no blank images or horizontal overflow.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed and generated 41 routes.

### Guardrails Preserved

- No Supabase schema, row, RLS policy, generated database type, or runtime seed
  was changed.
- No storefront, checkout, admin, API, auth, role, deployment, or release-tag
  behavior was changed.
- No commercial cover, publisher mark, retailer image, marketplace image,
  copied layout, external image reference, or generated-image reference was
  used.
- The portfolio remains an import input; the v1.1 runtime placeholder is not
  replaced until the later migration/import and storefront tasks pass.

### Residual Risks

- These are CaseFlow illustrative covers, not licensed publisher covers.
- The visual system is intentionally templated for consistency and rights
  safety; it is credible for a portfolio bookstore but not equivalent to a
  manually art-directed publishing catalog.
- Runtime placeholder-zero proof is still blocked until `V12-T10`/`V12-T11`
  import the catalog and later storefront tasks render the accepted assets.

### Next Task

`V12-T08 - Complete Bilingual Metadata And Editorial Copy`.

---

## SR-161 - V12-T08: Complete Bilingual Metadata And Editorial Copy

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 editorial metadata

### Objective

Create display-safe bilingual metadata for all 100 canonical editions by joining
the accepted catalog manifest and 100-cover portfolio without copying
commercial descriptions or rendering unknown optional facts as fake values.

### Actual Result

- Added editorial metadata TypeScript contracts and Zod validation.
- Added `scripts/build-v12-editorial-metadata.ts` to generate a public
  metadata manifest from the canonical catalog and cover portfolio.
- Added `scripts/verify-v12-editorial-metadata.ts` to check exact coverage,
  bilingual completeness, Vietnamese copy diacritics where meaningful,
  prohibited public-copy phrases, duplicate copy outside paired editions,
  internal pair consistency, content-quality release readiness, and graceful
  optional-fact omissions.
- Generated `src/data/books/v1.2-editorial-metadata-manifest.json` with 100
  edition records, bilingual summaries, reason-to-read notes, cover alt text,
  334 display-safe optional facts, omitted optional fact keys, and quality
  evidence.
- Documented the editorial metadata boundary and verification commands in
  root/app mirrors.

### Evidence

- `caseflow-store/src/types/editorial-metadata.ts`
- `caseflow-store/src/lib/validation/editorial-metadata.ts`
- `caseflow-store/scripts/build-v12-editorial-metadata.ts`
- `caseflow-store/scripts/verify-v12-editorial-metadata.ts`
- `caseflow-store/src/data/books/v1.2-editorial-metadata-manifest.json`
- `docs/v1.2-editorial-metadata.md`
- `caseflow-store/docs/v1.2-editorial-metadata.md`
- `caseflow-store/.agent/artifacts/v12-t08/editorial-metadata-check.json`
- `caseflow-store/.agent/artifacts/v12-t08/editorial-metadata-check.md`

### Verification

- `npx tsx scripts/build-v12-editorial-metadata.ts`: generated 100 metadata
  records and reported blocking content-quality release readiness.
- `npx tsx scripts/verify-v12-editorial-metadata.ts`: passed with 100
  editions, 334 display facts, 100 release-ready content assessments, and 0
  prohibited public-copy findings.
- The verifier initially over-required Vietnamese diacritics in titles such as
  `Jane Eyre` and `Oliver Twist`; the rule was corrected to require diacritics
  in Vietnamese summaries, reason copy, and alt text while allowing proper
  noun titles to remain unchanged.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed and generated 41 routes.

### Guardrails Preserved

- No Supabase schema, row, RLS policy, generated database type, or runtime seed
  was changed.
- No storefront, checkout, admin, API, auth, role, deployment, or release-tag
  behavior was changed.
- No publisher blurb, retailer copy, customer review, protected excerpt,
  fabricated rating, sold count, bestseller claim, `TBC`, `demo`,
  `placeholder`, `seed`, or `debug` public copy was introduced.
- Unknown optional facts are omitted in the editorial manifest rather than
  shown as fake values.

### Residual Risks

- Editorial metadata is import-ready but not yet the runtime catalog source.
- Merchandising shelf rules and storage remain undefined until `V12-T09`.
- Supabase import, storefront rendering, assistant/search integration, and
  production proof remain gated by later roadmap tasks.

### Next Task

`V12-T09 - Define Merchandising Rules And Minimal Storage`.

---

## SR-162 - V12-T09: Define Merchandising Rules And Minimal Storage

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 merchandising data and migration

### Objective

Freeze truthful merchandising shelf rules and the minimum storage contract
needed for v1.2 before drafting the reversible catalog migration.

### Actual Result

- Added merchandising TypeScript contracts for shelf types, source kinds,
  inclusion rules, manual slots, fallback behavior, order-derived rules,
  mutation actors, and resolved shelf output.
- Added Zod validation for localized labels, date windows, manual ordering,
  duplicate positions, missing fallback targets, order-derived guardrails, and
  required `merchandising:manage` permission.
- Added a pure shelf resolver that deterministically resolves manual,
  catalog-filter, promotion, inventory, paired-edition, and inactive
  order-derived shelves with stable fallbacks.
- Added deterministic build and verification scripts for the v1.2 merchandising
  manifest.
- Generated `src/data/books/v1.2-merchandising-rules-manifest.json` with 9
  shelves, 8 active shelves, and 1 inactive order-derived shelf.
- Documented the minimal additive storage contract for
  `book_merchandising_shelves` and `book_merchandising_shelf_items` without
  applying a database migration in this task.

### Evidence

- `caseflow-store/src/types/merchandising.ts`
- `caseflow-store/src/lib/validation/merchandising.ts`
- `caseflow-store/src/lib/merchandising/shelves.ts`
- `caseflow-store/scripts/build-v12-merchandising-rules.ts`
- `caseflow-store/scripts/verify-v12-merchandising-rules.ts`
- `caseflow-store/src/data/books/v1.2-merchandising-rules-manifest.json`
- `docs/v1.2-merchandising-rules-storage.md`
- `caseflow-store/docs/v1.2-merchandising-rules-storage.md`
- `caseflow-store/.agent/artifacts/v12-t09/merchandising-rules-check.json`
- `caseflow-store/.agent/artifacts/v12-t09/merchandising-rules-check.md`

### Verification

- `npx tsx scripts/verify-v12-merchandising-rules.ts`: passed with 9 shelves,
  8 active shelves, 1 order-derived shelf, valid references, negative contract
  cases, permission checks, deterministic resolution, and storage-contract
  evidence.
- `npx tsc --noEmit`: passed.
- `npm run lint`: initially reported 2 unused-import warnings; removed the
  stale imports and reran successfully with no output.
- `npm run build`: passed and generated 41 routes.
- Root/app mirrors for docs and `.agent` files match.
- `git diff --check`: passed.

### Guardrails Preserved

- No Supabase schema, row, RLS policy, generated database type, production
  data, runtime API, checkout, auth, role, or deployment behavior was changed.
- Sales-derived labels remain disabled unless backed by a first-party order
  query, time window, and minimum-order rule.
- Editorial shelves are distinguishable from order-derived shelves by
  `sourceKind`.
- Admin/staff merchandising changes require a server-checkable
  `merchandising:manage` permission; UI navigation is not treated as an
  authorization boundary.

### Residual Risks

- The storage contract is documented and verified but not yet implemented as
  SQL; `V12-T10` must draft the reversible migration and rollback plan.
- The runtime storefront still uses v1.1 data until `V12-T10`/`V12-T11` import
  and verify the approved catalog, cover, editorial, and merchandising data.
- Order-derived merchandising remains intentionally inactive until real
  first-party order evidence exists.

### Next Task

`V12-T10 - Build A Reversible v1.2 Catalog Migration`.

---

## SR-163 - V12-T10: Build A Reversible v1.2 Catalog Migration

- Date: 2026-07-17
- Status: completed
- Phase: CaseFlow Books v1.2 merchandising data and migration

### Objective

Prepare a reversible, audited v1.2 catalog migration plan before any Supabase
production data write.

### Actual Result

- Added additive migration SQL for v1.2 edition metadata, catalog provenance,
  content-quality checks, catalog compatibility, merchandising shelves, and
  merchandising shelf items.
- Added deterministic migration planner and verifier scripts.
- Generated a v1.2 manifest checksum snapshot, 100-cover asset manifest,
  dry-run migration plan, count-only live Supabase pre-migration report,
  SQL count template, and migration verification report.
- Added rollback documentation and private backup ignore rules.
- Dry-run result preserves 49 existing works and 98 existing editions, inserts
  1 work and 2 editions for `The Old Man and the Sea`, deactivates 1 work and
  2 editions for `The Elements of Style`, and plans zero deletes.
- Corrected migration-source hygiene before import: `893...` retailer/product
  codes are no longer stored/displayed as ISBN-13, and malformed publisher
  display values such as `vh` were replaced or normalized.

### Evidence

- `caseflow-store/supabase/migrations/0008_v12_catalog_merchandising.sql`
- `caseflow-store/scripts/plan-v12-catalog-migration.ts`
- `caseflow-store/scripts/verify-v12-catalog-migration-plan.ts`
- `docs/v1.2-catalog-migration-rollback-plan.md`
- `caseflow-store/docs/v1.2-catalog-migration-rollback-plan.md`
- `caseflow-store/.agent/artifacts/v12-t10/v12-catalog-migration-plan.json`
- `caseflow-store/.agent/artifacts/v12-t10/v12-catalog-migration-check.json`
- `caseflow-store/.agent/artifacts/v12-t10/v12-migration-input-snapshot.json`
- `caseflow-store/.agent/artifacts/v12-t10/v12-asset-manifest.json`
- `caseflow-store/.agent/artifacts/v12-t10/pre-migration-counts.sql`
- `caseflow-store/.agent/artifacts/v12-t10/pre-migration-counts-live.json`

### Verification

- `npx tsx scripts/build-v12-canonical-manifest.ts`: regenerated the canonical
  manifest after source hygiene corrections.
- `npx tsx scripts/verify-v12-canonical-manifest.ts`: passed with 50 works,
  100 editions, 50 English editions, 50 Vietnamese editions, 72 valid ISBN-13
  values, 100 source-reviewed editions, and 0 unsupported facts.
- `npx tsx scripts/build-v12-editorial-metadata.ts`: regenerated 100
  editorial metadata records.
- `npx tsx scripts/verify-v12-editorial-metadata.ts`: passed with 100 editions,
  334 display facts, 100 release-ready content assessments, and 0 prohibited
  public-copy findings.
- Supplemental data hygiene check: 0 invalid ISBN display values, 0 invalid
  canonical ISBN-13 values, and 0 `vh`/malformed publisher display values.
- `npx tsx scripts/build-v12-merchandising-rules.ts`: regenerated 9 shelves,
  8 active shelves, and 1 order-derived shelf.
- `npx tsx scripts/verify-v12-merchandising-rules.ts`: passed.
- `npx tsx scripts/plan-v12-catalog-migration.ts --capture-live-counts`:
  passed and captured count-only Supabase state without row export.
- `npx tsx scripts/verify-v12-catalog-migration-plan.ts`: passed with
  destructive SQL checks, expected ID plan, RLS/grant checks, backup ignore
  verification, and live count evidence.
- `npx tsc --noEmit`: passed.
- `npm run lint`: initially found two unused imports in the planner; imports
  were removed and lint then passed with no output.
- `npm run build`: passed and generated 41 routes.
- Root/app mirrors match.
- `git diff --check`: passed.

### Guardrails Preserved

- No Supabase SQL or data write was applied in this task.
- No production deploy, release tag, runtime API, checkout, auth, order,
  profile, promotion, inventory, or phone catalog behavior was changed.
- Private backup/export location is ignored by Git.
- The migration SQL contains no `drop table`, `truncate`, row delete, dropped
  column, or order/profile table alteration.
- `V12-T11` remains the first production data-write task and requires explicit
  user confirmation before applying SQL/upserts.

### Residual Risks

- The T10 plan does not replace a provider-level Supabase backup; `V12-T11`
  still needs confirmed backup/export evidence before applying production SQL.
- The accepted SQL and dry-run plan are not yet applied to Supabase.
- Data upsert execution and post-migration RLS/API smoke remain gated by
  `V12-T11`.
- Publisher labels are source-derived and normalized only for obvious display
  defects; future merchandising polish may still consolidate publisher
  variants for operator usability.

### Next Task

`V12-T11 - Apply And Verify The v1.2 Catalog In Supabase`, pending explicit
production data-write confirmation.

---

## SR-164 - V12-T11: Apply And Verify The v1.2 Catalog In Supabase

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 production data freeze

### Objective

Apply the approved v1.2 additive schema and deterministic catalog data to
Supabase production after explicit user approval, while preserving rollback
evidence and verifying public/RLS/API behavior.

### Actual Result

- Created a private production export before schema/data writes and a public
  manifest containing only counts, path, byte size, SHA-256, and pass/fail
  status.
- Applied `0008_v12_catalog_merchandising.sql` to Supabase production through a
  direct temporary `pg` SQL client after the Supabase CLI direct-query path
  failed and `supabase db dump` required unavailable Docker.
- Added scripts for pre-migration backup, deterministic v1.2 data apply, and
  post-migration Supabase verification.
- Applied the deterministic catalog upsert twice successfully to prove
  idempotent row counts.
- Updated the Supabase TypeScript snapshot for v1.2 edition columns and the
  new provenance, content-quality, compatibility, and merchandising tables.
- Supabase production now has 50 active works, 100 active editions, 50 English
  editions, 50 Vietnamese editions, and 0 active primary placeholder cover
  references.
- Supabase production now has 100 v1.2 cover assets, 602 provenance records,
  2,000 content-quality checks, 3 compatibility records, 9 merchandising
  shelves, and 20 manual shelf items.
- `The Elements of Style` work and its two editions are inactive; order,
  profile, phone catalog, promotion, and inventory-adjustment counts are
  preserved.

### Evidence

- `caseflow-store/scripts/backup-v12-pre-migration.ts`
- `caseflow-store/scripts/apply-v12-catalog-data.ts`
- `caseflow-store/scripts/verify-v12-supabase-import.ts`
- `caseflow-store/src/types/supabase.ts`
- `caseflow-store/.agent/artifacts/v12-t11/pre-migration-backup-manifest.json`
- `caseflow-store/.agent/artifacts/v12-t11/schema-apply.json`
- `caseflow-store/.agent/artifacts/v12-t11/catalog-upsert-apply.json`
- `caseflow-store/.agent/artifacts/v12-t11/post-migration-supabase-check.json`
- `caseflow-store/.agent/artifacts/v12-t11/post-migration-db-inspection.json`
- `caseflow-store/.agent/artifacts/v12-t11/local-api-smoke.json`

### Verification

- `npx tsx scripts/verify-v12-catalog-migration-plan.ts`: passed.
- `npx tsx scripts/backup-v12-pre-migration.ts`: passed with ignored private
  backup and public manifest only.
- Direct `pg` SQL connection smoke: passed without exposing the connection
  string.
- Direct `pg` schema apply: passed and confirmed the 5 v1.2 tables exist.
- `npx tsx scripts/apply-v12-catalog-data.ts --apply`: passed.
- Idempotent rerun of `npx tsx scripts/apply-v12-catalog-data.ts --apply`:
  passed with unchanged active catalog counts.
- `npx tsx scripts/verify-v12-supabase-import.ts`: passed with active catalog,
  retired Elements, cover, provenance, quality, merchandising, relationship,
  pair, hygiene, unchanged-table, anonymous RLS, and internal-table boundary
  checks.
- SQL DB inspection captured column, constraint, index, RLS, policy, and grant
  reports.
- `npx tsx scripts/verify-book-repository.ts`: passed and returned v1.2 cover
  paths through the repository.
- Local API smoke passed: public catalog/detail returned 200 with v1.2 covers,
  retired Elements detail returned 404, and unauthenticated admin dashboard
  returned 401.
- `npx tsc --noEmit`: passed after updating the DB type snapshot and verifier
  fixture rows.

### Guardrails Preserved

- No customer order, profile, phone product, promotion, inventory adjustment,
  auth, payment, checkout, deployment, or release-tag behavior was changed.
- No production connection string, service key, or private backup row content
  was printed in logs or committed.
- Rollback backup remains in the ignored private backup directory.
- The migration remains additive; no table drop, truncate, row delete, order
  table alteration, profile table alteration, or release retag was performed.

### Residual Risks

- The UI is still the v1.1 layout using newly imported data; homepage,
  catalog-card, detail, and admin merchandising polish starts at `V12-T12`.
- The private export is not a provider-managed Supabase PITR backup; it is a
  project-level row export sufficient for the accepted V12-T10 rollback plan.
- Publisher labels remain source-derived and may need operator-friendly
  grouping in later merchandising/admin tasks without changing sourced facts.

### Next Task

`V12-T12 - Upgrade Homepage Merchandising`.

## SR-165 - V12-T12: Upgrade Homepage Merchandising

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 storefront merchandising implementation

### Objective

Upgrade the CaseFlow Books homepage so it uses the approved v1.2 production
merchandising shelves, presents real book covers and bilingual edition choices
clearly, and verifies the customer entry flows without adding unsupported
marketplace claims.

### Actual Result

- Added a Supabase merchandising repository that reads public active shelves
  and shelf items, validates them with the existing v1.2 Zod contracts, and
  resolves homepage records from the production catalog.
- Updated the homepage to use `editor-picks`, `weekend-starter-set`,
  `vietnamese-editions`, `english-editions`, `promotion-ready`, and
  `paired-edition-comparison` shelves instead of hard-coded storefront picks.
- Reduced the hero to one clear browse action and made the first viewport show
  CaseFlow Books, three above-the-fold book covers, catalog stats, and a hint of
  the category band at 375px, tablet, and 1440px.
- Added homepage rails for editor picks, weekend reading, bilingual pairs,
  Vietnamese editions, English editions, promotion-ready editions, and trust
  signals without fake ratings, sold counts, urgency, or delivery promises.
- Fixed paired-edition resolution so the `paired-editions` rule returns
  complete English/Vietnamese work pairs before applying shelf limits.
- Marked hero cover images as eager to address the Next.js dev LCP warning for
  above-the-fold book covers.
- Added focused data and UI verification scripts for v1.2 homepage
  merchandising, including screenshot capture after warming lazy-loaded cover
  images.

### Evidence

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/src/lib/repositories/supabase-merchandising.ts`
- `caseflow-store/src/lib/merchandising/shelves.ts`
- `caseflow-store/scripts/verify-v12-homepage-merchandising.ts`
- `caseflow-store/scripts/verify-v12-homepage-ui.ts`
- `caseflow-store/.agent/artifacts/v12-t12/homepage-merchandising-check.json`
- `caseflow-store/.agent/artifacts/v12-t12/homepage-ui-check.json`
- `caseflow-store/.agent/artifacts/v12-t12/home-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v12-t12/home-tablet-en.png`
- `caseflow-store/.agent/artifacts/v12-t12/home-desktop-en.png`

### Verification

- `npm exec tsx scripts/verify-v12-homepage-merchandising.ts`: passed with
  100 catalog records, publicly readable active shelves, manual shelf order,
  language shelf, promotion shelf, paired shelf, non-placeholder selected cover,
  and no order-derived claim checks.
- `npm exec tsx scripts/verify-v12-merchandising-rules.ts`: passed after the
  paired-edition resolver fix.
- `HOMEPAGE_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-v12-homepage-ui.ts`:
  passed at 375px, tablet, and 1440px, including no overflow, first-viewport
  merchandising, hero covers, language switch route preservation, browse,
  detail entry, add-to-cart, and keyboard focus checks.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No production database writes were made in this task.
- No checkout, payment, account, order, profile, promotion, inventory,
  deployment, or release-tag behavior was changed.
- No fake ratings, fake sold counts, fake urgency, marketplace claims, copied
  publisher blurbs, or external commercial cover images were introduced.
- Homepage rendering now depends on the approved merchandising shelf contract
  rather than unreviewed UI-local sort assumptions.

### Residual Risks

- Catalog cards, product detail, assistant/SEO integration, and admin
  merchandising operations still need v1.2 UI integration in `V12-T13` through
  `V12-T16`.
- The v1.2 cover assets are project-created and rights-safe, but still stylized
  rather than real publisher covers; this is intentional until a licensed cover
  ingestion policy exists.

### Next Task

`V12-T13 - Upgrade Catalog Cards And Discovery Results`.

## SR-166 - V12-T13: Upgrade Catalog Cards And Discovery Results

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 storefront discovery implementation

### Objective

Upgrade the catalog cards and discovery results so the 100-edition catalog is
easier to scan, keeps v1.1 URL-backed filter behavior, and distinguishes
editorial merchandising, real offers, sort state, paired editions, and
availability without unsupported marketplace claims.

### Actual Result

- Updated `/catalog` to read the same public Supabase merchandising shelves used
  by the homepage and build per-edition merchandising labels for catalog cards.
- Reworked catalog cards so mobile uses compact horizontal cards while tablet
  and desktop keep cover-led cards with stable image dimensions.
- Cards now expose cover, title, author, category, language, format, current
  VND price, optional compare-at offer price, stock state, editorial shelf,
  bilingual-pair, and detail entry without fake ratings, sold counts, or
  urgency.
- Renamed the old `featured=true` UI from promotion language to curation /
  editor-pick language while preserving the existing URL parameter and backend
  filter behavior.
- Added result signal badges for sort, availability, visible offer labels, and
  shelf-backed editorial labels.
- Made default catalog sorting explicit: `/catalog` defaults to title A-Z,
  while search without an explicit sort defaults to relevance.
- Updated existing catalog page/filter verifiers for the new copy and added a
  focused v1.2 catalog discovery verifier with warmed screenshots.

### Evidence

- `caseflow-store/src/app/catalog/page.tsx`
- `caseflow-store/scripts/verify-catalog-page.ts`
- `caseflow-store/scripts/verify-catalog-filters.ts`
- `caseflow-store/scripts/verify-v12-catalog-discovery.ts`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-discovery-check.json`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-desktop-en.png`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-mobile-vi-page-2.png`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-filtered-desktop-en.png`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-long-title-mobile-en.png`

### Verification

- `CATALOG_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-catalog-page.ts`:
  passed with 100 total editions, 24 rendered cards, 5 pages, result count,
  card metadata, pagination, and no-overflow checks.
- `CATALOG_FILTER_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-catalog-filters.ts`:
  passed with URL state, API/UI count agreement, clear filters, invalid params,
  price sort, author sort, and no-overflow checks.
- `CATALOG_STATES_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-catalog-states.ts`:
  passed for English desktop and Vietnamese mobile loading, empty, and error
  states.
- `CATALOG_V12_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-v12-catalog-discovery.ts`:
  passed default discovery, mobile compactness, filter URL state, long-title,
  low-stock, out-of-stock empty state, no unsupported text, offer/no-offer,
  paired, editorial, and warmed image checks.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed before documentation updates.

### Guardrails Preserved

- No production database writes were made.
- No checkout, payment, account, order, profile, promotion mutation,
  inventory mutation, deployment, or release-tag behavior was changed.
- No ratings, reviews, sold counts, bestseller claims, delivery promises,
  external commercial covers, or copied publisher copy were introduced.
- Existing catalog URL parameters, pagination, invalid-param handling, and
  public products API agreement remain verified.

### Residual Risks

- Production data currently has 8 low-stock editions and 0 out-of-stock active
  editions; V12-T13 verifies low-stock cards and the out-of-stock empty state
  rather than fabricating unavailable products.
- Product detail and edition comparison still need the v1.2 presentation work
  in `V12-T14`.

### Next Task

`V12-T14 - Upgrade Book Detail And Edition Comparison`.

## SR-167 - V12-T14: Upgrade Book Detail And Edition Comparison

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 storefront detail implementation

### Objective

Upgrade the book detail page so the v1.2 100-edition catalog has credible
edition identity, English/Vietnamese switching, verified bibliographic facts,
buying confidence, and preserved cart/SEO behavior without adding unsupported
reviews, samples, marketplace claims, or production data writes.

### Actual Result

- Extended the public book domain/API mapping to expose v1.2 `pairId`,
  `pairedEditionId`, `reasonToRead`, `displayFacts`,
  `omittedOptionalFactKeys`, `sourceEditionKey`, and `sourceReviewStatus`.
- Reworked `/products/[slug]` around cover, title, author, VND price, stock,
  compact add-to-cart controls, and edition comparison near the first-screen
  purchase decision.
- Replaced placeholder edition facts with source-reviewed `displayFacts`; pages
  with no display-safe optional facts now omit those facts instead of showing
  `TBC`, `Not specified`, `null`, or `undefined`.
- Added bilingual reason-to-read, work context, more-by-author and related-book
  sections while keeping recommendation labels deterministic and non-AI.
- Preserved JSON-LD/canonical behavior, local-cart boundaries, server-owned
  checkout validation, not-found handling, and shipping/payment/return
  confidence copy.
- Added a focused V12 detail verifier with desktop/mobile screenshots for a
  paired offer-backed edition and a missing-facts edition.

### Evidence

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/features/books/book-edition-purchase-controls.tsx`
- `caseflow-store/src/types/domain.ts`
- `caseflow-store/src/lib/validation/domain.ts`
- `caseflow-store/src/lib/supabase/book-mappers.ts`
- `caseflow-store/src/lib/api/book-catalog.ts`
- `caseflow-store/scripts/verify-book-detail-page.ts`
- `caseflow-store/scripts/verify-seo-metadata.ts`
- `caseflow-store/scripts/verify-v12-book-detail-edition-comparison.ts`
- `caseflow-store/.agent/artifacts/v12-t14/book-detail-edition-comparison-check.json`
- `caseflow-store/.agent/artifacts/v12-t14/detail-desktop-en.png`
- `caseflow-store/.agent/artifacts/v12-t14/detail-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v12-t14/detail-missing-facts-mobile-vi.png`

### Verification

- `V12_BOOK_DETAIL_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-v12-book-detail-edition-comparison.ts`:
  passed first-screen hierarchy, edition comparison, sourced facts, missing-fact
  omission, cart targeting, no-overflow, structured data, unsupported-copy, and
  bilingual screenshot checks.
- `BOOK_DETAIL_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-book-detail-page.ts`:
  passed detail/API/not-found/cart-entry checks.
- `BOOK_CONFIDENCE_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-book-detail-confidence.ts`:
  passed confidence, old-accessory-copy, no-overflow, and recommendation checks.
- `BOOK_CART_VERIFY_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-book-cart.ts`:
  passed local-cart and server cart validation checks.
- `SEO_EXPECTED_ORIGIN=http://localhost:3000 SEO_METADATA_BASE_URL=http://localhost:3000 npm exec tsx scripts/verify-seo-metadata.ts`:
  passed local canonical/robots/sitemap/JSON-LD metadata checks; production
  verifier default remains `https://caseflow-store.vercel.app`.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed before documentation updates.

### Guardrails Preserved

- No production database writes, schema migration, checkout/payment/profile/
  order/admin mutation, deployment, or release-tag change was made.
- No external commercial covers, copied publisher descriptions, copyrighted
  samples, fake ratings, fake reviews, sold counts, bestseller claims, urgency,
  or delivery-speed promises were introduced.
- VND remains the authoritative price and cart/checkout validation still reloads
  server-side edition data.

### Residual Risks

- Active production data still has no out-of-stock active editions; V12-T14
  verifies missing display facts and available/low-stock purchase behavior
  without fabricating unavailable catalog records.
- The local dev screenshot includes the Next.js dev assistant bubble; production
  build passed and will not use the dev overlay.

### Next Task

`V12-T15 - Add Admin Content Quality And Merchandising Operations`.

## SR-168 - V12-T15: Add Admin Content Quality And Merchandising Operations

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 admin content operations implementation

### Objective

Add a practical admin/staff operations layer for v1.2 content quality and
merchandising so CaseFlow Books can be reviewed and operated like a focused
bookstore catalog, without exposing internal provenance notes or trusting
browser-supplied role/source state.

### Actual Result

- Added `merchandising:manage` to runtime admin/staff permissions so the
  accepted v1.2 merchandising mutation permission is enforced by server auth.
- Enriched admin catalog API/page records with server-derived content quality,
  cover status, shelf membership, source review status, and v1.2 edition
  fields.
- Added admin catalog filters for completeness, source review, cover status,
  language, active state, and shelf membership.
- Added editable bilingual `reasonToRead` fields as allowed project-written
  content fixes through existing validated book edition APIs.
- Added an admin-only source guard: source/provenance fields are rejected for
  staff, and admin attempts to set `sourceReviewStatus: "approved"` require a
  source edition key, approved display-fact provenance, and verified
  `source-review`, `edition-facts-consistent`, and `rights-complete` checks.
- Added protected `/api/admin/merchandising/shelves` for approved shelf
  active-state and sort-order operations, with Zod validation and
  admin/staff permission checks.
- Added a dense responsive merchandising operations panel with explicit
  success, error, loading, warning, and empty states.
- Fixed mobile overflow from native select intrinsic width by constraining
  select/textarea controls with `w-full` and `min-w-0`.

### Evidence

- `caseflow-store/src/features/admin/admin-catalog-page.tsx`
- `caseflow-store/src/app/admin/catalog/page.tsx`
- `caseflow-store/src/app/api/admin/books/editions/route.ts`
- `caseflow-store/src/app/api/admin/books/editions/[id]/route.ts`
- `caseflow-store/src/app/api/admin/merchandising/shelves/route.ts`
- `caseflow-store/src/lib/api/admin-book-catalog.ts`
- `caseflow-store/src/lib/api/admin-merchandising.ts`
- `caseflow-store/src/lib/auth/admin.ts`
- `caseflow-store/src/lib/repositories/supabase-books.ts`
- `caseflow-store/src/lib/repositories/supabase-content-operations.ts`
- `caseflow-store/src/lib/repositories/supabase-merchandising.ts`
- `caseflow-store/src/lib/validation/books.ts`
- `caseflow-store/src/lib/validation/merchandising.ts`
- `caseflow-store/scripts/verify-v12-admin-content-operations.ts`
- `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-check.json`
- `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-desktop-en.png`
- `caseflow-store/.agent/artifacts/v12-t15/admin-content-operations-mobile-vi.png`

### Verification

- `npx tsx scripts/verify-v12-admin-content-operations.ts`: passed anonymous,
  customer, staff, and admin API/page role checks; admin source approval guard;
  staff source tamper rejection; invalid merchandising mutation rejection;
  catalog filters; no internal reviewer-note leakage; repository state checks;
  desktop and mobile no-overflow screenshots.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Temporary verifier auth/profile users were cleaned up; a follow-up prefix scan
  reported `remainingTemporaryProfiles: 0`.

### Guardrails Preserved

- No schema migration, release tag, deployment, checkout/payment/profile/order/
  promotion/inventory flow, public products API, or customer storefront buying
  behavior was changed.
- Public/customer access to the new merchandising admin API is denied.
- Internal provenance reviewer notes and content-quality notes are not exposed
  by the new admin API serializers.
- No fake ratings, reviews, sold counts, bestseller claims, delivery promises,
  external commercial covers, or copied publisher descriptions were introduced.
- Production catalog/merchandising data was not intentionally changed; verifier
  mutation checks used denied/invalid/tampered requests and temporary users.

### Residual Risks

- The merchandising operation scope is deliberately limited to approved shelf
  active state and sort order; full rule/manual-slot editing remains a separate
  higher-risk admin feature and should not be added without a new acceptance
  gate.
- Admin source approval is now guarded for edition-level source fields, but
  broader provenance record editing is still not exposed as a UI workflow.

### Next Task

`V12-T16 - Integrate Catalog Content Across Search, Assistant, SEO, And Docs`.

## SR-169 - V12-T16: Integrate Catalog Content Across Search, Assistant, SEO, And Docs

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 integration and release preparation

### Objective

Integrate the accepted v1.2 catalog content across remaining public and
operational surfaces so search, assistant, SEO, cart, checkout, historical
orders, admin exports, retired links, and documentation no longer depend on
stale placeholder/demo assumptions.

### Actual Result

- Removed internal `sourceEditionKey` and `sourceReviewStatus` from public
  catalog/detail API serialization while preserving protected admin
  source-review operations.
- Removed public source-review status UI from product detail; verified display
  facts remain customer-facing.
- Expanded catalog search with v1.2 reason-to-read copy, display facts, ISBN,
  publisher, translator, language, format, and accent-insensitive token
  matching for natural queries.
- Added valid local v1.2 cover images to product social metadata and JSON-LD
  without exposing internal source-review fields.
- Updated cart validation, customer order snapshots, and admin CSV export paths
  to consume server-owned v1.2 book snapshot fields; CSV exports now include
  item language, format, and item summary while excluding customer PII and
  internal notes.
- Verified retired v1.1 public slugs recover safely to catalog and historical
  legacy order snapshots still map through fallback fields.
- Updated architecture, cover portfolio, known limitations, roadmap, and agent
  context docs to describe the implemented post-`V12-T16` runtime honestly.

### Evidence

- `caseflow-store/src/lib/api/book-catalog.ts`
- `caseflow-store/src/lib/repositories/supabase-books.ts`
- `caseflow-store/src/lib/repositories/supabase-order-exports.ts`
- `caseflow-store/src/lib/seo/metadata.ts`
- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/src/app/products/[slug]/not-found.tsx`
- `caseflow-store/scripts/verify-admin-orders-csv-export.ts`
- `caseflow-store/scripts/verify-v12-book-detail-edition-comparison.ts`
- `caseflow-store/scripts/verify-v12-catalog-runtime-integration.ts`
- `caseflow-store/.agent/artifacts/v12-t16/catalog-runtime-integration-check.json`
- `caseflow-store/.agent/artifacts/v12-t16/assistant-result-desktop-en.png`
- `caseflow-store/.agent/artifacts/v12-t16/checkout-gate-mobile-en.png`
- `caseflow-store/.agent/artifacts/v12-t16/seo-detail-desktop-en.png`

### Verification

- `V12_CATALOG_INTEGRATION_BASE_URL=http://127.0.0.1:3001 npx tsx scripts/verify-v12-catalog-runtime-integration.ts`:
  passed public catalog, assistant, SEO, cart, checkout gate, order/export,
  legacy-link, and docs checks on a fresh production build.
- `npm run lint`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `git diff --check`: passed before the final tracker update.
- Temporary Supabase auth/profile/order rows created by the verifier were
  cleaned up; the production-style server on port `3001` was stopped after
  verification.

### Guardrails Preserved

- No schema migration, release tag, deployment, payment-provider integration,
  real payment credential collection, external commercial covers, copied
  publisher blurbs, ratings, reviews, sold counts, bestseller claims, or
  delivery-speed promises were introduced.
- Public storefront and public API serializers do not expose internal source
  keys or source-review status.
- VND remains authoritative, and cart/order validation still reloads trusted
  server-side edition data instead of trusting browser totals.

### Residual Risks

- `V12-T16` is a focused integration gate, not the full release gate; visual,
  accessibility, performance, dependency, secret, cleanup, and schema-drift
  checks remain consolidated under `V12-T17`.
- CSV export enrichment is intentionally conservative; full analytics-grade
  merchandising reports remain out of scope until a later accepted task.

### Next Task

`V12-T17 - Run The Full v1.2 Local Quality Gate`.

## SR-170 - V12-T17: Run The Full v1.2 Local Quality Gate

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 release-candidate local quality gate

### Objective

Run the complete local release-candidate gate before any Vercel deploy or
`v1.2.0` tag, covering build quality, Playwright regression, v1.2 catalog
content/asset/runtime reports, mobile performance baseline, dependency and
secret checks, cleanup, schema/rollback evidence, and documentation state.

### Actual Result

- Rebuilt the production app successfully with Next.js `16.2.10`; the build
  generated 42 App Router routes plus proxy.
- Served the release candidate via `next start` on
  `http://127.0.0.1:3001` and ran the full Playwright suite against that
  production-style server.
- Stabilized E2E reliability without changing user-facing product behavior:
  Supabase auth helpers now seed session cookies directly, click/fill helpers
  avoid Playwright action-layer timeouts, and fragile full-page screenshots
  were narrowed to viewport artifact captures where assertions already prove
  the underlying flow.
- Added `scripts/verify-v12-local-quality-gate.ts`, an aggregate verifier for
  static V12 reports, mobile performance medians, dependency audit status,
  secret scanning, and release-candidate artifact output.
- Redacted an old credential-shaped Supabase DB URL example in the D23 retry
  artifact so the release secret scan has zero findings.
- Confirmed aggregate quality gate `ok: true`: static reports pass,
  high/critical dependency audit is clean, the known moderate Next/PostCSS risk
  is documented, mobile performance baseline passes, and secret scan checked
  595 text files with 0 findings.

### Evidence

- `caseflow-store/scripts/verify-v12-local-quality-gate.ts`
- `caseflow-store/.agent/artifacts/v12-t17/local-quality-gate-check.json`
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
- `caseflow-store/tests/e2e/helpers/supabase.ts`
- `caseflow-store/tests/e2e/admin-access.spec.ts`
- `caseflow-store/tests/e2e/admin-workflow.spec.ts`
- `caseflow-store/tests/e2e/checkout-validation.spec.ts`
- `caseflow-store/tests/e2e/checkout.spec.ts`
- `caseflow-store/tests/e2e/release-edge-cases.spec.ts`
- `caseflow-store/tests/e2e/storefront-flow.spec.ts`
- `caseflow-store/tests/e2e/ui-states.spec.ts`

### Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 42 App Router routes plus proxy.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 node ./node_modules/@playwright/test/cli.js test --reporter=list --workers=1`:
  passed `20/20`.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 node scripts/verify-v12-local-quality-gate.ts`:
  passed `ok: true`; home/catalog/detail mobile median load times were below
  the accepted thresholds and total blocking time medians were `0`.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- `git diff --check`: passed.

### Guardrails Preserved

- No deployment, release tag, production schema migration, payment-provider
  integration, real payment credential collection, new storefront feature,
  marketplace behavior, fake ratings/reviews/sold counts, copied publisher
  blurbs, or external commercial cover images were introduced.
- Temporary auth/profile/order rows created by verification were cleaned up.
- VND remains authoritative; server-side cart/order validation remains the
  trusted source for totals.

### Residual Risks

- Lighthouse CLI could not be used because `npm exec lighthouse@13.4.0`
  did not complete package installation/version checks in this local
  environment. The accepted fallback is the stricter Playwright mobile baseline
  recorded in `v12-t17/local-quality-gate-check.json`.
- `npm audit` still reports 2 moderate Next/PostCSS vulnerabilities. This is
  documented as non-blocking for V12-T17 because high/critical counts are zero,
  the installed Next version is already `16.2.10`, and the automatic audit fix
  would force a breaking downgrade to `next@9.3.3`.
- V12-T17 is local only; production deployment, production smoke, final release
  docs, cleanup-after-deploy, and annotated tag creation are still V12-T18.

### Next Task

`V12-T18 - Deploy, Smoke Test, Document, And Tag v1.2.0`.

## SR-171 - V12-T18: Deploy, Smoke Test, Document, And Tag v1.2.0

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.2 production release

### Objective

Deploy the accepted v1.2 release candidate to Vercel production, verify the
production alias with public/user/admin smoke checks, refresh release evidence,
confirm cleanup and release gates, then create the `v1.2.0` release commit and
annotated tag.

### Actual Result

- Deployed production build to Vercel; deployment
  `dpl_7Y2Qsf4VJRBuzaMGXZMi81Rq5pKQ` reached `READY` and was aliased to
  `https://caseflow-store.vercel.app`.
- Added `scripts/verify-v12-production-release.ts` to check public production
  pages/APIs, canonical alias, robots, sitemap, language mode, cart/checkout
  account boundary, customer boundary, admin boundary, assistant behavior,
  catalog quality, and representative detail pages.
- Production smoke passed with `ok: true`; catalog quality reported 100 active
  editions, 100 cover responses, 50 English editions, 50 Vietnamese editions,
  100 content metadata records, zero active primary placeholder covers, zero
  broken cover responses, and zero public source-review leakage.
- Ran the full Playwright suite against `https://caseflow-store.vercel.app`;
  production Playwright passed `20/20`.
- Refreshed release screenshots, README evidence, architecture notes, known
  limitations, release-candidate notes, CV bullets, ADR index, and v1.2 release
  audit docs.
- Verified release cleanup after production checks with `totalMatches: 0`.
- Created the release commit and annotated `v1.2.0` tag.

### Evidence

- `caseflow-store/scripts/verify-v12-production-release.ts`
- `caseflow-store/.agent/artifacts/v12-t18/deployment.json`
- `caseflow-store/.agent/artifacts/v12-t18/vercel-inspect.json`
- `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json`
- `caseflow-store/.agent/artifacts/v12-t18/production-playwright-summary.json`
- `caseflow-store/.agent/artifacts/v12-t18/npm-audit.json`
- `caseflow-store/.agent/artifacts/v12-t18/secret-scan.json`
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
- `caseflow-store/docs/v1.2-release-audit.md`
- `docs/v1.2-release-audit.md`
- `caseflow-store/docs/screenshots/`

### Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 42 App Router routes plus proxy.
- `npx vercel --prod --yes`: passed; deployment reached `READY`.
- `V12_PRODUCTION_BASE_URL=https://caseflow-store.vercel.app node scripts/verify-v12-production-release.ts`:
  passed `ok: true`.
- `PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app node ./node_modules/@playwright/test/cli.js test --reporter=list --workers=1`:
  passed `20/20`.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- `npm audit --audit-level=high`: passed with no high or critical findings.
- Release secret scan: passed with zero committed secret findings.
- Stale v1.1 release-doc checks and `git diff --check`: passed.
- `git tag --points-at HEAD`: includes `v1.2.0`.

### Guardrails Preserved

- No unapproved schema migration, real payment-provider integration, real
  payment credential collection, marketplace behavior, fake ratings/reviews/
  sold counts, copied publisher blurbs, external commercial cover images, or
  licensed metadata/feed claim was introduced during release.
- Server-side cart/order validation remains authoritative for totals.
- Admin/staff/customer access boundaries are still enforced by server checks,
  not just UI hiding.
- Production secrets and private backup rows remain uncommitted.

### Residual Risks

- Payment flows remain simulated and do not process real COD/bank/wallet/card
  payments.
- Phone/email checkout readiness is profile-data based, not real SMS/OTP or
  email-provider verification.
- Shipping, VAT, FX, and international payment fees are estimates, not live
  carrier/bank/tax integrations.
- The known moderate Next/PostCSS dependency advisory remains documented as a
  non-blocker because high/critical counts are zero and the automated force
  fix would require a breaking downgrade.

### Next Task

No active task after `v1.2.0`; future changes should start from a new accepted
task ID or ADR.

## SR-172 - V13-T01: Create Visual Merchandising ADR And Roadmap

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Create the governing ADR and roadmap needed to apply the user's requested
visual merchandising improvements automatically while preserving the released
e-commerce architecture, product scope, and content/provenance guardrails.

### Actual Result

- Added ADR-0008 for a bounded `v1.3` Visual Merchandising & Brand Polish
  phase.
- Added the v1.3 roadmap with task IDs `V13-T01` through `V13-T09`,
  acceptance criteria, verification expectations, and final gate rules.
- Updated ADR indexes and `.agent` trackers to make v1.3 the active polish
  phase.
- Documented that Hallmark is used as audit inspiration only, not as a runtime
  dependency or permission to rebuild/delete route trees.

### Evidence

- `docs/adr/0008-visual-merchandising-brand-polish.md`
- `caseflow-store/docs/adr/0008-visual-merchandising-brand-polish.md`
- `docs/v1.3-visual-merchandising-brand-polish-roadmap.md`
- `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-roadmap.md`
- `docs/adr/README.md`
- `caseflow-store/docs/adr/README.md`

### Verification

- Root/app ADR mirrors: passed.
- Root/app roadmap mirrors: passed.
- ADR index mirror: passed.
- ADR/reference search: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No runtime files, database schema, production data, deployment, payment,
  shipping, auth, or API integration boundary changed in this task.
- The final v1.3 tag/deploy remains out of scope until the final gate passes
  and the user approves it.

### Next Task

`V13-T02 - Run Hallmark-Informed Visual Audit Baseline`.

## SR-173 - V13-T02: Run Hallmark-Informed Visual Audit Baseline

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Capture a visual baseline before runtime polish, audit the released surfaces
against Hallmark-informed anti-generic design principles, and map concrete
issues to the accepted V13 task plan without changing the storefront/admin UI.

### Actual Result

- Added `scripts/verify-v13-visual-audit.ts` for reproducible visual baseline
  capture.
- Captured mobile and desktop screenshots for homepage, catalog, book detail,
  checkout/account boundary, admin dashboard, and admin catalog.
- Confirmed all audited surfaces render their expected selector and have zero
  horizontal overflow at `375px` and `1440px`.
- Produced a ranked punch list with 6 findings mapped to `V13-T03` through
  `V13-T09`.

### Evidence

- `caseflow-store/scripts/verify-v13-visual-audit.ts`
- `caseflow-store/.agent/artifacts/v13-t02/visual-audit-baseline.json`
- `caseflow-store/.agent/artifacts/v13-t02/visual-audit-baseline.md`
- `caseflow-store/.agent/artifacts/v13-t02/homepage-mobile.png`
- `caseflow-store/.agent/artifacts/v13-t02/homepage-desktop.png`
- `caseflow-store/.agent/artifacts/v13-t02/catalog-mobile.png`
- `caseflow-store/.agent/artifacts/v13-t02/catalog-desktop.png`
- `caseflow-store/.agent/artifacts/v13-t02/book-detail-mobile.png`
- `caseflow-store/.agent/artifacts/v13-t02/book-detail-desktop.png`
- `caseflow-store/.agent/artifacts/v13-t02/checkout-account-boundary-mobile.png`
- `caseflow-store/.agent/artifacts/v13-t02/checkout-account-boundary-desktop.png`
- `caseflow-store/.agent/artifacts/v13-t02/admin-dashboard-mobile.png`
- `caseflow-store/.agent/artifacts/v13-t02/admin-dashboard-desktop.png`
- `caseflow-store/.agent/artifacts/v13-t02/admin-catalog-mobile.png`
- `caseflow-store/.agent/artifacts/v13-t02/admin-catalog-desktop.png`

### Verification

- `npx tsx scripts/verify-v13-visual-audit.ts`: passed with `ok: true`.
- Baseline artifacts inspected: passed.
- No UI runtime files changed by the audit.
- `git diff --check`: passed.

### Guardrails Preserved

- No UI implementation, schema migration, production data, external media,
  payment/shipping/verification integration, API contract, deployment, tag, or
  runtime route behavior changed in this task.

### Next Task

`V13-T03 - Expand Bookstore Design Tokens`.

## SR-174 - V13-T03: Expand Bookstore Design Tokens

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Replace the MVP blue/slate visual foundation with a richer bookstore token
system that can support the later merchandising polish without random page-level
colors or a one-note palette.

### Actual Result

- Updated root and app `DESIGN.md` files to describe CaseFlow Books as a
  specialist bookstore and small-business commerce system.
- Added paper/ink, moss/teal discovery, wine editorial, amber offer, and admin
  trust tokens.
- Updated `src/app/globals.css` with matching CSS variables, Tailwind theme
  aliases, tighter radius tokens, and selection/focus compatibility.
- Added a reproducible token verifier that confirms the CSS, root design doc,
  and app design doc stay aligned.
- Cleaned the two lint warnings in the V13 visual audit script.

### Evidence

- `DESIGN.md`
- `caseflow-store/DESIGN.md`
- `caseflow-store/src/app/globals.css`
- `caseflow-store/scripts/verify-v13-design-tokens.ts`
- `caseflow-store/.agent/artifacts/v13-t03/design-token-check.json`
- `caseflow-store/scripts/verify-v13-visual-audit.ts`

### Verification

- `npx tsx scripts/verify-v13-design-tokens.ts`: passed with `ok: true`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed with zero warnings after cleanup.
- `git diff --check`: passed.

### Guardrails Preserved

- No route, schema, production data, external media, payment/shipping/auth
  integration, API contract, deployment, or tag changed in this task.
- The change is limited to design tokens, design docs, verifier artifacts, and
  cleanup of the V13 audit script warnings.

### Next Task

`V13-T04 - Build Cover-Led Merchandising Components`.

## SR-175 - V13-T04: Build Cover-Led Merchandising Components

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Create reusable cover-led merchandising components that can make homepage,
catalog, and detail pages feel more like a real bookstore while staying within
the accepted local-cover and content provenance policy.

### Actual Result

- Added `BookCoverFrame`, `BookCoverStack`, and `BookCoverShelf` for stable
  local-cover display.
- Added shared display helpers for edition title, cover alt text, local cover
  path fallback, author line, and format label.
- Enforced local `/images/books/` cover paths with a placeholder fallback.
- Used stable `2/3` cover aspect ratios and shared V13 token colors for badges
  and cover shadow.
- Added a static verifier to check required exports, local-cover guardrails,
  forbidden external URLs, and deterministic component behavior.

### Evidence

- `caseflow-store/src/features/books/cover-merchandising.tsx`
- `caseflow-store/scripts/verify-v13-cover-merchandising.ts`
- `caseflow-store/.agent/artifacts/v13-t04/cover-merchandising-check.json`

### Verification

- `npx tsx scripts/verify-v13-cover-merchandising.ts`: passed with `ok: true`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No route, schema, production data, external media, new dependency, payment,
  shipping, auth, API contract, deployment, or tag changed in this task.
- Components are available for later page integration but do not change page
  behavior by themselves.

### Next Task

`V13-T05 - Upgrade Homepage Visual Merchandising`.

## SR-176 - V13-T05: Upgrade Homepage Visual Merchandising

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Upgrade the homepage so it feels less like a generic commerce grid and more
like a real bookstore, while preserving released merchandising rules, counts,
links, language behavior, cart entry, and content guardrails.

### Actual Result

- Reworked the hero with the V13 paper/discovery palette, desktop cover stack,
  and compact mobile/tablet cover-led cards.
- Replaced homepage cover image rendering with reusable `BookCoverFrame`
  instances for hero, featured, compact shelf, and translated-edition cards.
- Improved the post-hero spacing so the next section remains visible in the
  first viewport across mobile, tablet, and desktop verification sizes.
- Updated the homepage sections verifier from older "new arrivals" copy/counts
  to the current v1.2 shelf model: weekend, Vietnamese, English, promotion,
  translated editions, and trust sections.
- Added a V13 homepage visual verifier with mobile/desktop screenshots,
  overflow checks, local-image checks, cover-frame checks, and hero-count
  preservation.

### Evidence

- `caseflow-store/src/app/page.tsx`
- `caseflow-store/scripts/verify-v13-homepage-visual-merchandising.ts`
- `caseflow-store/scripts/verify-homepage-sections.ts`
- `caseflow-store/.agent/artifacts/v13-t05/homepage-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t05/home-v13-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v13-t05/home-v13-desktop-en.png`
- `caseflow-store/.agent/artifacts/v12-t12/homepage-ui-check.json`
- `caseflow-store/.agent/artifacts/d27-t01/homepage-sections-check.json`

### Verification

- `HOMEPAGE_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v13-homepage-visual-merchandising.ts`:
  passed with `ok: true`.
- `HOMEPAGE_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v12-homepage-ui.ts`:
  passed with `ok: true`.
- `HOMEPAGE_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-homepage-sections.ts`:
  passed with `ok: true`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Mobile and desktop V13 screenshots were inspected visually.

### Guardrails Preserved

- No route, schema, production data, external image source, payment/shipping/
  auth integration, API contract, deployment, or tag changed in this task.
- No fake reviews, sales counts, bestseller claims, or commercial cover assets
  were introduced.

### Next Task

`V13-T06 - Polish Catalog Cards And Discovery`.

## SR-177 - V13-T06: Polish Catalog Cards And Discovery

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Polish catalog cards and discovery surfaces so browsing feels more like a real
bookstore catalog, while preserving the released filter, sort, pagination,
search, product-link, and merchandising-label behavior.

### Actual Result

- Replaced catalog card image rendering with the shared `BookCoverFrame`.
- Added V13 discovery/editorial/offer token accents to the catalog intro,
  filter panel, card hover state, and merchandising badges.
- Added a V13 catalog visual verifier with mobile/desktop screenshots, local
  image checks, cover aspect checks, product-link preservation, and overflow
  checks.
- Improved the V13 catalog verifier screenshot warm-up so lazy images below
  the fold are scrolled into view before screenshot capture.
- Hardened the V12 catalog discovery verifier against duplicate transient
  `data-catalog-page` and `data-catalog-result-signals` nodes by selecting the
  first matched summary node.

### Evidence

- `caseflow-store/src/app/catalog/page.tsx`
- `caseflow-store/scripts/verify-v13-catalog-visual-merchandising.ts`
- `caseflow-store/scripts/verify-v12-catalog-discovery.ts`
- `caseflow-store/.agent/artifacts/v13-t06/catalog-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t06/catalog-v13-mobile-vi-page-2.png`
- `caseflow-store/.agent/artifacts/v13-t06/catalog-v13-desktop-en.png`
- `caseflow-store/.agent/artifacts/d28-t01/catalog-page-check.json`
- `caseflow-store/.agent/artifacts/d28-t02/catalog-filters-check.json`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-discovery-check.json`

### Verification

- `CATALOG_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v13-catalog-visual-merchandising.ts`:
  passed with `ok: true`.
- `CATALOG_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-catalog-page.ts`:
  passed with `ok: true`.
- `CATALOG_FILTER_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-catalog-filters.ts`:
  passed with `ok: true`.
- `CATALOG_V12_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v12-catalog-discovery.ts`:
  passed with `ok: true`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- V13 catalog mobile and desktop screenshots were inspected visually.

### Guardrails Preserved

- No route, schema, production data, external image source, payment/shipping/
  auth integration, API contract, deployment, or tag changed in this task.
- No fake ratings, sales velocity, bestseller claims, or commercial cover
  assets were introduced.

### Next Task

`V13-T07 - Polish Book Detail Visual Hierarchy`.

## SR-178 - V13-T07: Polish Book Detail Visual Hierarchy

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Polish the book detail page hierarchy so the cover, title, price, stock,
edition comparison, reason/facts, purchase controls, and confidence sections
feel more coherent and bookstore-specific without changing commerce behavior.

### Actual Result

- Replaced the main detail cover, edition comparison covers, and recommendation
  covers with the shared `BookCoverFrame`.
- Applied V13 discovery, offer, editorial, paper, and admin trust accents to
  category badges, price/stock panel, edition comparison, reason/facts, work
  context, and confidence sections.
- Kept mobile commerce compact enough for the add-to-cart button to remain in
  the first viewport for the V12 hierarchy gate.
- Reduced mobile price/stock/format typography to avoid cramped value overlap.
- Added a V13 detail visual verifier with mobile/desktop screenshots, cover
  frame checks, local image checks, commerce visibility, comparison visibility,
  and overflow checks.
- Improved V13 detail screenshot warm-up so lazy cover images are scrolled and
  decoded before screenshot capture.

### Evidence

- `caseflow-store/src/app/products/[slug]/page.tsx`
- `caseflow-store/scripts/verify-v13-book-detail-visual-hierarchy.ts`
- `caseflow-store/.agent/artifacts/v13-t07/book-detail-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t07/book-detail-v13-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v13-t07/book-detail-v13-desktop-en.png`
- `caseflow-store/.agent/artifacts/d29-t01/book-detail-check.json`
- `caseflow-store/.agent/artifacts/v12-t14/book-detail-edition-comparison-check.json`

### Verification

- `BOOK_DETAIL_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v13-book-detail-visual-hierarchy.ts`:
  passed with `ok: true`.
- `BOOK_DETAIL_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-book-detail-page.ts`:
  passed with `ok: true`.
- `V12_BOOK_DETAIL_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v12-book-detail-edition-comparison.ts`:
  passed with `ok: true`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- V13 detail mobile screenshot was inspected visually after fixing the mobile
  price/stock/format spacing.

### Guardrails Preserved

- No route, schema, production data, external image source, payment/shipping/
  auth integration, API contract, deployment, or tag changed in this task.
- Add-to-cart still targets the current edition; SEO Book structured data still
  uses VND offer data; unsupported sales/rating/shipping claims remain absent.

### Next Task

`V13-T08 - Polish Admin Operations Visual System`.

## SR-179 - V13-T08: Polish Admin Operations Visual System

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Polish admin dashboard and catalog operations so they feel like a coherent
operations workspace while preserving server-side permissions, API contracts,
catalog management behavior, and existing regression coverage.

### Actual Result

- Applied the V13 admin trust palette to the admin shell, operations
  navigation, dashboard metrics/panels, catalog list/form, content-quality
  signals, and merchandising operations.
- Adjusted the admin shell badge after screenshot review so the workspace
  label has readable contrast.
- Added a V13 admin visual verifier for dashboard and catalog at mobile and
  desktop sizes.
- Hardened admin dashboard/catalog verifier sign-in helpers to use the app's
  session APIs directly, reducing flaky form-submission waits without changing
  runtime behavior.
- Fixed a real staff catalog PATCH regression: source-review schema defaults
  were being treated as explicit source-review edits even when the request body
  only changed operational fields such as `isActive`.

### Evidence

- `caseflow-store/src/features/admin/admin-shell-page.tsx`
- `caseflow-store/src/features/admin/admin-navigation.tsx`
- `caseflow-store/src/features/admin/admin-dashboard-page.tsx`
- `caseflow-store/src/features/admin/admin-catalog-page.tsx`
- `caseflow-store/src/app/api/admin/books/editions/[id]/route.ts`
- `caseflow-store/scripts/verify-v13-admin-visual-system.ts`
- `caseflow-store/scripts/verify-admin-dashboard.ts`
- `caseflow-store/scripts/verify-admin-book-catalog.ts`
- `caseflow-store/.agent/artifacts/v13-t08/admin-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t08/admin-dashboard-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v13-t08/admin-dashboard-desktop-en.png`
- `caseflow-store/.agent/artifacts/v13-t08/admin-catalog-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v13-t08/admin-catalog-desktop-en.png`
- `caseflow-store/.agent/artifacts/d38-t01/admin-dashboard-check.json`
- `caseflow-store/.agent/artifacts/d36-t01/admin-book-catalog-check.json`

### Verification

- `ADMIN_VISUAL_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-v13-admin-visual-system.ts`:
  passed with `ok: true`.
- `ADMIN_DASHBOARD_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-admin-dashboard.ts`:
  passed with `ok: true`.
- `ADMIN_BOOK_CATALOG_VERIFY_BASE_URL=http://localhost:3000 npx tsx scripts/verify-admin-book-catalog.ts`:
  passed with `ok: true`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Admin desktop screenshot was inspected visually after contrast correction.

### Guardrails Preserved

- No schema migration, production data write, external imagery, payment,
  shipping, auth-provider, deployment, or tag was introduced.
- Server still blocks non-admin source-review mutations; the fix only checks
  source-review permissions against keys actually present in the PATCH body.

### Next Task

`V13-T09 - Run Full Visual QA And Documentation Gate`.

## SR-180 - V13-T09: Run Full Visual QA And Documentation Gate

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 visual merchandising and brand polish

### Objective

Run the final local gate for the v1.3 visual merchandising polish phase,
refresh representative evidence, document what changed and did not change, and
avoid claiming a deployment or release tag that has not happened.

### Actual Result

- Refreshed V13 visual audit and focused homepage, catalog, detail, and admin
  visual artifacts after the final homepage cover-loading polish.
- Added mirrored v1.3 release notes documenting that local QA passed and that
  production deployment/tagging was deferred to explicit user approval in
  `V13-T10`.
- Hardened affected visual/regression verifiers for lazy-loaded full-page
  screenshots and transient duplicate dev-server nodes.
- Confirmed cleanup, stale release/deploy claim scan, release-notes mirror
  check, and secret-like pattern scan.

### Evidence

- `docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
- `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
- `caseflow-store/.agent/artifacts/v13-t02/visual-audit-baseline.json`
- `caseflow-store/.agent/artifacts/v13-t05/homepage-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t06/catalog-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t07/book-detail-visual-check.json`
- `caseflow-store/.agent/artifacts/v13-t08/admin-visual-check.json`
- `caseflow-store/.agent/artifacts/v12-t12/homepage-ui-check.json`
- `caseflow-store/.agent/artifacts/v12-t13/catalog-discovery-check.json`
- `caseflow-store/.agent/artifacts/v12-t14/book-detail-edition-comparison-check.json`
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`

### Verification

- V13 audit: passed with `ok: true` across homepage, catalog, book detail,
  checkout/account boundary, admin dashboard, and admin catalog at mobile and
  desktop sizes.
- V13 focused checks passed: design tokens, cover merchandising components,
  homepage visual merchandising, catalog visual merchandising, book detail
  visual hierarchy, and admin visual system.
- Affected regressions passed: homepage UI, homepage sections, catalog page,
  catalog filters, V12 catalog discovery, book detail page, V12 edition
  comparison, admin dashboard, and admin catalog CRUD.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- v1.3 release-notes mirror check: passed.
- Stale v1.3 release/deploy claim scan: no matches.
- Secret-like pattern scan: no matches.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed; Next.js generated 42 app routes plus proxy.
- `git diff --check`: passed.
- Final homepage mobile, catalog desktop, detail mobile, and admin desktop
  screenshots were inspected visually.

### Guardrails Preserved

- No database schema migration, production data import, real payment/shipping/
  verification provider, external commercial cover imagery, fake reviews, or
  fake sold counts was introduced.
- Production deployment, release commit, and tagging were intentionally
  deferred until explicit user approval in `V13-T10`.

### Next Task

`V13-T10 - Deploy, Smoke Test, Document, And Tag v1.3.0`.

## SR-181 - V13-T10: Deploy, Smoke Test, Document, And Tag v1.3.0

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 production release

### Objective

Deploy the verified v1.3 visual merchandising release to production, smoke
test the live site, update release documentation/evidence, and create the
annotated `v1.3.0` tag only after production smoke passes.

### Actual Result

- Created release-prep commit `79347b7`.
- Deployed Vercel production deployment `dpl_6in3zn6CsXKtj3mR2xjGVh4X3q59`.
- Confirmed the production alias `https://caseflow-store.vercel.app`.
- Passed production smoke with 100 active editions, 100 cover responses, 50
  English editions, 50 Vietnamese editions, and all public, account, admin,
  cart/checkout, assistant, language, detail, robots, and sitemap checks
  passing.
- Refreshed release notes, roadmap, `.agent` trackers, and production smoke
  screenshots before final release commit/tag.

### Evidence

- `docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
- `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-release-notes.md`
- `docs/v1.3-visual-merchandising-brand-polish-roadmap.md`
- `caseflow-store/docs/v1.3-visual-merchandising-brand-polish-roadmap.md`
- `caseflow-store/.agent/artifacts/v13-t10/production-release-smoke.json`
- `caseflow-store/.agent/artifacts/v13-t10/production-home-desktop-en.png`
- `caseflow-store/.agent/artifacts/v13-t10/production-catalog-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v13-t10/production-detail-desktop-en.png`
- `caseflow-store/.agent/artifacts/v13-t10/production-detail-mobile-vi.png`
- `caseflow-store/.agent/artifacts/v13-t10/production-admin-boundary-mobile-en.png`

### Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed; Next.js generated 42 app routes plus proxy.
- `npx vercel --prod --yes`: deployed and aliased production deployment
  `dpl_6in3zn6CsXKtj3mR2xjGVh4X3q59`.
- `PRODUCTION_RELEASE_TASK_ID=v13-t10 PRODUCTION_RELEASE_BASE_URL=https://caseflow-store.vercel.app PRODUCTION_RELEASE_DEPLOYMENT_ID=dpl_6in3zn6CsXKtj3mR2xjGVh4X3q59 PRODUCTION_RELEASE_DEPLOYMENT_URL=https://caseflow-store-p5iqu2u3r-nvt-ruong473.vercel.app PRODUCTION_RELEASE_INSPECTOR_URL=https://vercel.com/nvt-ruong473/caseflow-store/6in3zn6CsXKtj3mR2xjGVh4X3q59 npx tsx scripts/verify-v12-production-release.ts`:
  passed with `ok: true`.
- `git diff --check`: passed before deploy.

### Guardrails Preserved

- No database schema migration, production data import, real payment/shipping/
  verification provider, external commercial cover imagery, fake reviews,
  fake sold counts, or marketplace behavior was introduced in v1.3.
- Payment/account verification remain simulated and must not be represented as
  real payment processing or real OTP/email verification.

### Next Task

No active implementation task.

## SR-182 - QA-FINAL-T01: Final Post-Release Tester Audit For v1.3.0

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3 final post-release QA

### Objective

Verify the released `v1.3.0` web app from a tester perspective: live
production smoke, full production-style E2E, UI/UX behavior, access
boundaries, content safety, cleanup, and release hygiene before deciding any
next work.

### Actual Result

- Added a dedicated final QA verifier for non-mutating production tester
  checks across homepage, catalog discovery, product detail, cart, checkout
  boundary, account/admin boundaries, order tracking, assistant, state
  previews, public payload safety, and no-overflow screenshots.
- Fixed false-positive QA oracles during verifier development: `null` optional
  JSON values are not private-field leakage, catalog search now uses a real
  target term, and catalog state preview checks each state URL separately.
- Production final QA audit passed with no findings.
- Production release smoke passed with 100 active editions, 100 cover
  responses, 50 English editions, 50 Vietnamese editions, and all critical
  public/protected boundary checks passing.
- Full Playwright E2E passed `20/20` on a production-style local server.
- Accessibility/mobile/performance audit passed.
- Screenshot evidence was manually inspected for homepage, catalog mobile,
  book detail, checkout/account boundary, and admin boundary.
- Cleanup passed with `totalMatches: 0`.
- The architecture doc was updated to reference the current `v1.3.0`
  deployment while preserving that v1.3 did not change runtime architecture.

### Evidence

- `docs/v1.3-final-post-release-qa-audit.md`
- `caseflow-store/docs/v1.3-final-post-release-qa-audit.md`
- `caseflow-store/scripts/verify-final-post-release-qa.ts`
- `caseflow-store/.agent/artifacts/qa-final-t01/final-post-release-qa.json`
- `caseflow-store/.agent/artifacts/qa-final-t01/final-post-release-qa.md`
- `caseflow-store/.agent/artifacts/qa-final-t01/production-release-smoke.json`
- `caseflow-store/.agent/artifacts/qa-final-t01/qa-home-desktop-en.png`
- `caseflow-store/.agent/artifacts/qa-final-t01/qa-catalog-mobile-vi-page-2.png`
- `caseflow-store/.agent/artifacts/qa-final-t01/qa-detail-desktop-en.png`
- `caseflow-store/.agent/artifacts/qa-final-t01/qa-checkout-boundary-mobile-en.png`
- `caseflow-store/.agent/artifacts/qa-final-t01/qa-admin-boundary-mobile-en.png`
- `caseflow-store/.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`

### Verification

- `FINAL_QA_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-final-post-release-qa.ts`:
  passed with `ok: true` and no findings.
- `PLAYWRIGHT_PORT=3002 npm run test:e2e`: passed `20/20`.
- `PRODUCTION_RELEASE_TASK_ID=qa-final-t01 PRODUCTION_RELEASE_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-v12-production-release.ts`:
  passed with `ok: true`.
- `ACCESSIBILITY_MOBILE_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-accessibility-mobile-performance.ts`:
  passed with `ok: true`.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- `npm audit --audit-level=high`: passed; moderate Next/PostCSS advisory
  remains documented as a non-blocking residual.
- Secret-like scan: passed with no matches.
- Stale v1.3 release-claim scan: passed with no matches.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; Next.js generated 42 app routes plus proxy.
- `git diff --check`: passed.

### Guardrails Preserved

- No runtime feature, database schema, production data import, payment/shipping
  provider, OTP/email provider, external cover source, fake review/sales
  signal, marketplace behavior, or stable API contract change was introduced.
- QA-generated users/orders were cleaned up.

### Next Task

No active implementation task. The practical next step is to push the local
commits and tags if the user wants the Git remote to preserve `v1.3.0` and the
QA audit evidence.

---

## HOTFIX-V13-T01 - Fix Compact Cover Card Layout Overlap

- Date: 2026-07-18
- Status: completed
- Phase: CaseFlow Books v1.3.1 compact-card visual hotfix

### Objective

Fix the user-reported UI defect where related-book recommendation cards could
overlap cover art, badges, title, author, and price text, then verify the same
layout risk across nearby compact-cover storefront cards before creating the
next patch release.

### Actual Result

- Fixed product-detail related-book cards by matching grid columns to the
  responsive `BookCoverFrame size="compact"` width: 80px at base and 96px at
  `sm+`.
- Fixed homepage compact shelf cards and desktop hero compact cards that shared
  the same fixed-column risk.
- Added `scripts/verify-hotfix-compact-card-overlap.ts`, a Playwright verifier
  that checks cover/content bounding boxes across mobile, tablet, and desktop
  viewports.
- Production deploy `dpl_CtyPPR1cExwXQWctsh7to98Vg3yb` was aliased to
  `https://caseflow-store.vercel.app`.
- Production overlap verification passed on the live alias.
- Production release smoke passed on retry with 100 active editions, 100 cover
  responses, 50 English editions, 50 Vietnamese editions, and all public,
  language, assistant, cart/checkout, customer boundary, admin boundary, detail,
  robots, sitemap, and catalog-quality checks passing.

### Evidence

- `caseflow-store/scripts/verify-hotfix-compact-card-overlap.ts`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/compact-card-overlap-check.json`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/detail-mobile-vi.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/detail-tablet-vi.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/detail-desktop-en.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/home-mobile-vi.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/home-tablet-vi.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/home-desktop-en.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/production-release-smoke.json`
- `caseflow-store/docs/v1.3.1-compact-card-layout-hotfix-release-notes.md`

### Verification

- `HOTFIX_CARD_LAYOUT_BASE_URL=http://127.0.0.1:3003 npx tsx scripts/verify-hotfix-compact-card-overlap.ts`:
  passed with `ok: true`.
- `HOTFIX_CARD_LAYOUT_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-hotfix-compact-card-overlap.ts`:
  passed with `ok: true`.
- `BOOK_DETAIL_VERIFY_BASE_URL=http://127.0.0.1:3003 npx tsx scripts/verify-v13-book-detail-visual-hierarchy.ts`:
  passed with `ok: true`.
- `HOME_VISUAL_VERIFY_BASE_URL=http://127.0.0.1:3003 npx tsx scripts/verify-v13-homepage-visual-merchandising.ts`:
  passed with `ok: true`.
- `PRODUCTION_RELEASE_TASK_ID=hotfix-v13-t01 PRODUCTION_RELEASE_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-v12-production-release.ts`:
  passed with `ok: true` on retry.
- Direct production cart probe after the first broad smoke timeout confirmed
  seeded localStorage, `data-cart-count="1"`, and no console/page errors.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; Next.js generated 42 app routes plus proxy.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- `npm audit --audit-level=high`: passed; the known moderate Next/PostCSS
  advisory remains documented as non-blocking.
- Targeted secret-value scan: passed with no matches.
- `git diff --check`: passed.

### Guardrails Preserved

- No feature expansion, schema migration, production data import, external
  provider integration, commercial cover source, fake review/sales signal,
  marketplace behavior, or stable API contract change was introduced.
- The existing `v1.3.0` tag and GitHub Release history were not rewritten; this
  runtime hotfix should be tagged and released as `v1.3.1`.

### Next Task

`v1.3.1` was tagged, pushed, released on GitHub, and verified after this
hotfix. The next work item became `CLOSEOUT-T01`, a documentation-only
portfolio handoff task.

---

## CLOSEOUT-T01 - Final Project Closeout And Portfolio Handoff

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books portfolio handoff after `v1.3.1`

### Objective

Close out the project as a portfolio-ready release by correcting stale release
claims, making the latest `v1.3.1` state visible from the public README, and
creating a concise handoff packet for recruiters, interviewers, and future
maintenance sessions.

### Actual Result

- Updated the public repository README so the visible portfolio entry point
  references the latest `v1.3.1` GitHub Release, production deployment,
  production smoke, final QA, hotfix verifier, and handoff documents.
- Updated the app README so local technical readers no longer see release
  evidence stopping at `v1.2`.
- Created `docs/portfolio-handoff.md` with a public demo script, private demo
  flow, feature matrix, architecture summary, evidence ledger, interview
  narrative, honest boundaries, and strong next steps if the project continues.
- Updated `docs/cv-bullets.md` and `docs/known-limitations.md` so supporting
  portfolio material reflects `v1.3.1` without claiming real payments, real
  OTP/email verification, commercial cover licenses, marketplace scale,
  revenue, or unmeasured production SLOs.
- Returned `.agent` trackers to "no active implementation task" after the
  documentation-only closeout.

### Evidence

- `README.md`
- `caseflow-store/README.md`
- `caseflow-store/docs/portfolio-handoff.md`
- `caseflow-store/docs/cv-bullets.md`
- `caseflow-store/docs/known-limitations.md`
- `caseflow-store/.agent/project-context.md`
- `caseflow-store/.agent/todo-roadmap.md`

### Verification

- Markdown link/path sanity scan across README and handoff docs: passed with
  `ok: true`.
- Stale latest-release claim scan: passed after removing the old hotfix next
  task wording.
- Targeted secret-value scan: passed with no matches.
- `git diff --check`: passed.

### Guardrails Preserved

- No runtime feature, schema change, deployment, external provider integration,
  new dependency, release tag, or GitHub Release was added in this task.
- Portfolio claims remain evidence-backed and explicitly document simulated
  payment, verification, shipping, data-source, media-license, and operations
  boundaries.

### Next Task

No active implementation task. The project is portfolio-ready at `v1.3.1`
unless a new defect or a clearly scoped post-portfolio roadmap is approved.

---

## CLOSEOUT-T02 - Final Repository Hygiene And Release Verification

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books final repository hygiene audit after `v1.3.1`

### Objective

Do one final safe audit after portfolio closeout: verify Git/GitHub release
state, production availability, documentation claims, secret hygiene, static
quality gates, production smoke, cleanup, and the compact-card visual hotfix
without changing runtime behavior.

### Actual Result

- Verified `main` and `origin/main` were synchronized before recording this
  audit task, then recorded the audit-only tracker updates.
- Verified GitHub Release `v1.3.1` is published, non-draft, non-prerelease, and
  latest.
- Verified `https://caseflow-store.vercel.app` returned `HTTP/2 200`.
- Verified README/handoff Markdown links resolve to existing local files where
  applicable.
- Verified stale latest-release claim scan and targeted secret-value scan have
  no matches.
- Verified static quality gates: TypeScript, ESLint, production build, and
  `git diff --check`.
- Verified production smoke against the live alias with all public, language,
  assistant, cart/checkout, customer boundary, admin boundary, detail, robots,
  sitemap, and catalog-quality checks passing.
- Re-ran the compact-card overlap verifier on production; the previous
  user-reported visual collision remains fixed.
- Re-ran release cleanup; total stale QA/test matches remains zero.

### Evidence

- `caseflow-store/.agent/artifacts/closeout-t02/production-release-smoke.json`
- `caseflow-store/.agent/artifacts/closeout-t02/production-home-desktop-en.png`
- `caseflow-store/.agent/artifacts/closeout-t02/production-catalog-mobile-vi.png`
- `caseflow-store/.agent/artifacts/closeout-t02/production-detail-desktop-en.png`
- `caseflow-store/.agent/artifacts/closeout-t02/production-detail-mobile-vi.png`
- `caseflow-store/.agent/artifacts/closeout-t02/production-admin-boundary-mobile-en.png`
- `caseflow-store/.agent/artifacts/hotfix-v13-t01/compact-card-overlap-check.json`
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`

### Verification

- `git status --short --branch`: main was synchronized with origin before
  audit-only tracker updates.
- `gh release view v1.3.1 --json ...`: passed; release is published,
  non-draft, and non-prerelease.
- `gh api repos/NVTruong473/caseflow-store/releases/latest`: passed; latest
  release is `v1.3.1`.
- `curl -I https://caseflow-store.vercel.app`: returned `HTTP/2 200`.
- Markdown link/path sanity scan: passed with `ok: true`.
- Stale latest-release claim scan: passed with no stale matches after task
  completion.
- Targeted secret-value scan: passed with no matches.
- `npm audit --audit-level=high`: passed; the known moderate Next/PostCSS
  advisory remains documented as non-blocking.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; Next.js generated 42 app routes plus proxy.
- `PRODUCTION_RELEASE_TASK_ID=closeout-t02 PRODUCTION_RELEASE_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-v12-production-release.ts`:
  passed with `ok: true`.
- `HOTFIX_CARD_LAYOUT_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-hotfix-compact-card-overlap.ts`:
  passed with `ok: true`.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- `git diff --check`: passed.

### Guardrails Preserved

- No runtime feature, schema migration, production data mutation, dependency
  addition, deployment, tag, or GitHub Release was created in this task.
- The audit reinforced that the project should remain closed at `v1.3.1`
  unless a new defect or explicitly scoped post-portfolio roadmap is approved.

### Next Task

No active implementation task. The project is closed out and portfolio-ready at
`v1.3.1`.

---

## V14-T01 - Real Commerce + Visual Merchandising ADR

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Create the governing ADR and detailed post-`v1.3.1` roadmap for making
CaseFlow Books feel more like a real operating bookstore while also resolving
the user's critique that many tabs, shelves, smaller pages, and book cards look
too visually uniform.

### Actual Result

- Added `ADR-0009: Real Commerce And Visual Merchandising Upgrade For v1.4`.
- Added `docs/v1.4-real-commerce-visual-merchandising-roadmap.md` with
  `V14-T02` through `V14-T12`, acceptance criteria, and verification for each
  task.
- Updated the ADR index and agent trackers to reflect the accepted phase and
  next task.
- Preserved the explicit boundary that v1.4 may improve runtime commercial
  wording and visual merchandising, but may not fake reviews, fake sold counts,
  copy commercial covers, add real payment/shipping/SMS/email/AI integrations,
  mutate production data, deploy, tag, or release unless a later task
  explicitly authorizes it.

### Evidence

- `docs/adr/0009-real-commerce-visual-merchandising-upgrade.md`
- `docs/v1.4-real-commerce-visual-merchandising-roadmap.md`
- `docs/adr/README.md`
- `.agent/project-context.md`
- `.agent/todo-roadmap.md`

### Verification

- File inspection: completed during patch review.
- `git diff --check`: to run with the first V14 verification pass.

### Guardrails Preserved

- No runtime feature, schema migration, production data mutation, dependency,
  deployment, tag, or GitHub Release was introduced by this planning task.
- Work remains one V14 task at a time; `V14-T02` is the next implementation
  task.

### Next Task

`V14-T02 - Runtime No-Demo Copy Audit And Commercial Language Pass`.

---

## V14-T02 - Runtime No-Demo Copy Audit And Commercial Language Pass

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Remove customer-facing runtime copy that made the live web feel like a demo,
mock, implementation artifact, or portfolio explanation, while keeping honest
limitations in documentation and preserving all commerce/auth/API behavior.

### Actual Result

- Added `scripts/verify-v14-no-demo-runtime-copy.ts`, which scans runtime UI
  files under `src/app`, `src/components`, and `src/features` for prohibited
  demo/internal phrases.
- Replaced homepage merchandising copy that mentioned fake sales or review
  signals with customer-facing bookstore language.
- Replaced footer payment caveat copy with commercial checkout/payment
  expectation copy.
- Replaced checkout and checkout-success phrases such as "No payment
  collected", "display-only", "represented without collecting", and admin/server
  review wording with customer-facing order confirmation, payment pending, and
  bookstore confirmation wording.
- Replaced assistant implementation disclaimer copy with bookstore guidance
  language.

### Evidence

- `scripts/verify-v14-no-demo-runtime-copy.ts`
- `.agent/artifacts/v14-t02/no-demo-runtime-copy-check.json`
- `src/app/page.tsx`
- `src/components/layout/site-footer.tsx`
- `src/features/checkout/checkout-page.tsx`
- `src/features/checkout/checkout-success-page.tsx`
- `src/features/assistant/bookstore-assistant.tsx`

### Verification

- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with `ok: true`,
  `scannedFiles: 101`, and zero findings.
- `npm run lint`: passed.
- Targeted runtime phrase scan: no prohibited matches in `src/app`,
  `src/features`, or `src/components`.
- `git diff --check`: passed.

### Guardrails Preserved

- No auth, API, database, payment-provider, shipping-provider, production data,
  dependency, deployment, tag, or release behavior changed.
- Documentation may still explain project boundaries; runtime customer-facing
  UI now uses commercial language.

### Next Task

`V14-T03 - Expand Commerce Visual Tokens`.

---

## V14-T03 - Expand Commerce Visual Tokens

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Extend the design system with token-backed commerce roles so later V14 visual
work can become structurally and chromatically richer without random one-off
colors or a simple recolor of the old card system.

### Actual Result

- Added `translation`, `academic`, `trust`, `arrival`, and `operations` color
  roles plus muted variants to `DESIGN.md`.
- Added matching CSS variables and Tailwind theme aliases to
  `src/app/globals.css`.
- Added `scripts/verify-v14-visual-tokens.ts` to check required token presence
  and fail on raw hex colors inside runtime UI files.
- Updated design guidance to require v1.4 card variants to differ by structure
  and information hierarchy, not only color.

### Evidence

- `DESIGN.md`
- `src/app/globals.css`
- `scripts/verify-v14-visual-tokens.ts`
- `.agent/artifacts/v14-t03/visual-token-check.json`

### Verification

- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed with all required
  roles present and zero runtime raw-hex findings.
- `npm run lint`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No runtime flow, auth, API, database, external integration, dependency,
  deployment, tag, or release change was introduced.
- New color usage is token-backed and ready for later V14 UI work.

### Next Task

`V14-T04 - Build Merchandising Layout Library`.

---

## V14-T04 - Build Merchandising Layout Library

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Add reusable layout primitives that make merchandising surfaces structurally
different rather than just differently colored, while preserving existing data,
routes, cover assets, and commerce boundaries.

### Actual Result

- Added `src/features/books/merchandising-layouts.tsx`.
- Added additive components for:
  - editorial feature shelves;
  - deal strips;
  - English/Vietnamese translation pair shelves;
  - category spine rails;
  - reading-path shelves;
  - compact retail tiles.
- Components use existing `SupabaseBookCatalogRecord` data, existing
  project-created cover assets, `CurrencyAmount`, `Badge`, and token-backed
  color roles.
- No homepage/catalog/detail route was rewired in this task; the library is
  ready for `V14-T05` and later tasks.

### Evidence

- `src/features/books/merchandising-layouts.tsx`
- `.agent/artifacts/v14-t02/no-demo-runtime-copy-check.json`
- `.agent/artifacts/v14-t03/visual-token-check.json`

### Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 102` and zero findings.
- `git diff --check`: passed.

### Guardrails Preserved

- No new dependency, route rewrite, database/schema/data migration, external
  integration, payment/shipping/AI provider, deploy, tag, or release change was
  introduced.
- The layout library is additive and uses existing cover/content provenance.

### Next Task

`V14-T05 - Homepage Retail Floor Redesign`.

---

## V14-T05 - Homepage Retail Floor Redesign

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Rebuild homepage merchandising rhythm so the page no longer feels like a single
repeated card system, while preserving the existing catalog data, language
mode, currency display, hero entry point, local covers, and route behavior.

### Actual Result

- Replaced the old category card grid with a V14 category spine rail.
- Replaced the old featured product grid with an editorial feature shelf.
- Replaced the weekend compact grid with a reading-path shelf.
- Replaced translated-edition cards with a V14 translation-pair shelf.
- Replaced the repeated promotion rail with a V14 offer/deal strip.
- Preserved hero cards, product links, support/trust signals, language shelves,
  VND/USD display, local cover assets, and existing homepage section anchors.
- Removed the duplicated category heading found during visual review.
- Removed unused homepage card components left behind by the redesign.

### Evidence

- `src/app/page.tsx`
- `src/features/books/merchandising-layouts.tsx`
- `scripts/verify-v14-homepage-visual-merchandising.ts`
- `.agent/artifacts/v14-t05/homepage-visual-check.json`
- `.agent/artifacts/v14-t05/home-v14-mobile-vi.png`
- `.agent/artifacts/v14-t05/home-v14-tablet-en.png`
- `.agent/artifacts/v14-t05/home-v14-desktop-en.png`

### Verification

- `HOMEPAGE_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-homepage-visual-merchandising.ts`:
  passed with layout variety, local images, cover aspect ratios, no overflow,
  product links, hero count, and next-section visibility all true.
- Visual screenshot review: passed after removing the duplicated category
  heading.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 102` and zero findings.
- `git diff --check`: passed.

### Guardrails Preserved

- No database/schema/data migration, auth/API behavior change, external
  integration, fake proof signal, commercial cover source, dependency, deploy,
  tag, or release was introduced.
- Homepage changes are structural presentation changes over existing catalog
  and merchandising data.

### Next Task

`V14-T06 - Catalog Discovery And Card System V2`.

---

## V14-T06 - Catalog Discovery And Card System V2

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Make catalog browsing less monotonous and easier to scan, especially on
mobile, by adding quick discovery entry points, clearer active-filter state,
and structurally/tone-distinct catalog cards.

### Actual Result

- Added quick discovery links for under-150k pricing, Vietnamese editions,
  English originals, in-stock records, editor picks, and paperback editions.
- Reframed the active-filter area as a visible current-selection summary.
- Added catalog card variants via `data-catalog-card-variant` and token-backed
  cover surfaces for offer, translation, editorial, academic, trust, and
  standard result records.
- Preserved URL-backed filters, pagination, result counts, 24-card page size,
  local covers, product links, and existing catalog data boundaries.
- Added `scripts/verify-v14-catalog-discovery.ts`.

### Evidence

- `src/app/catalog/page.tsx`
- `scripts/verify-v14-catalog-discovery.ts`
- `.agent/artifacts/v14-t06/catalog-discovery-check.json`
- `.agent/artifacts/v14-t06/catalog-v14-mobile-vi-page-2.png`
- `.agent/artifacts/v14-t06/catalog-v14-desktop-en.png`
- `.agent/artifacts/v14-t06/catalog-v14-filtered-desktop-en.png`

### Verification

- `CATALOG_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-catalog-discovery.ts`:
  passed with quick links, active-filter summary, card variant variety, cover
  aspect ratio, filter panel, local images, no overflow, product links, and
  card counts all true.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-catalog-filters.ts`:
  passed with API/UI count agreement, combined filters, clear filters, invalid
  params, price sort, author sort, and no overflow.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-catalog-page.ts`:
  passed with result counts, pagination, metadata, mobile/desktop no overflow,
  and 100 total editions.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with zero
  findings.
- `git diff --check`: passed.

### Guardrails Preserved

- No schema/data migration, API/auth behavior change, external integration,
  fake proof signal, commercial cover source, dependency, deploy, tag, or
  release was introduced.
- Quick links use existing URL-backed filter semantics.

### Next Task

`V14-T07 - Product Detail Commercial Trust And Recommendation Redesign`.

---

## V14-T07 - Product Detail Commercial Trust And Recommendation Redesign

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Make book detail pages feel closer to a working bookstore by improving
commercial trust, edition identity, and related-book presentation without
inventing operational proof or changing commerce/auth boundaries.

### Actual Result

- Added bilingual product-detail copy for account checkout, inventory
  re-check, trusted checkout totals, purchase confidence, and edition identity.
- Added a token-backed edition identity panel using existing fields: language,
  format, publisher, catalog status, and ISBN when available.
- Added side-panel commerce proof cards below purchase controls for account
  checkout, inventory check, and trusted totals.
- Reworked shipping/payment/return confidence content into varied token-backed
  cards.
- Replaced same-looking related-book cards with recommendation tiles whose
  visual tone follows author/category/language recommendation reasons.
- Preserved purchase controls, server-trusted checkout boundaries, edition
  comparison, structured data, local covers, and existing catalog records.
- Added `scripts/verify-v14-book-detail-commercial-trust.ts`.

### Evidence

- `src/app/products/[slug]/page.tsx`
- `scripts/verify-v14-book-detail-commercial-trust.ts`
- `.agent/artifacts/v14-t07/book-detail-commercial-trust-check.json`
- `.agent/artifacts/v14-t07/book-detail-v14-mobile-vi.png`
- `.agent/artifacts/v14-t07/book-detail-v14-tablet-vi.png`
- `.agent/artifacts/v14-t07/book-detail-v14-desktop-en.png`

### Verification

- `BOOK_DETAIL_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-book-detail-commercial-trust.ts`:
  passed with commercial proof, edition identity, confidence sections, cover
  aspect ratio, local images, recommendations, no card collision, no right
  overflow, and no page overflow all true.
- `HOTFIX_CARD_LAYOUT_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-hotfix-compact-card-overlap.ts`:
  passed with detail/home recommendation and compact card overlap checks all
  true.
- Visual screenshot review: passed for mobile, tablet, and desktop detail
  layouts; one follow-up candidate remains for a later sitewide polish task:
  mobile assistant floating button placement can sit close to purchase controls.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 102` and zero findings.
- `git diff --check`: passed.

### Guardrails Preserved

- No schema/data migration, API/auth behavior change, external integration,
  fake review, fake SLA, commercial cover source, dependency, deploy, tag, or
  release was introduced.
- Commercial copy uses verifiable system behavior and existing catalog fields
  rather than fabricated business proof.

### Next Task

`V14-T08 - Trust, Policy, And Footer Pages`.

---

## V14-T08 - Trust, Policy, And Footer Pages

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Add customer-facing policy and trust pages expected from a working online
bookstore, while avoiding legal overclaiming and unsupported provider claims.

### Actual Result

- Added a shared bookstore policy data contract for contact, shipping,
  payment, returns, privacy, and terms pages.
- Added route-language-aware pages at `/contact`, `/shipping`, `/payment`,
  `/returns`, `/privacy`, and `/terms`, each with metadata and bilingual copy.
- Added `BookstorePolicyPage` with policy hero, highlights, details, policy
  navigation, and contact rows where relevant.
- Updated footer navigation into customer-facing shop, help, and store-policy
  groups; removed admin from footer links.
- Added support window and support-channel information to the footer without
  inventing an email/domain or external support provider.
- Added policy routes to sitemap and robots allow-list.
- Added `scripts/verify-v14-policy-pages.ts`.

### Evidence

- `src/lib/policies/bookstore-policies.ts`
- `src/features/policies/bookstore-policy-page.tsx`
- `src/app/contact/page.tsx`
- `src/app/shipping/page.tsx`
- `src/app/payment/page.tsx`
- `src/app/returns/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/components/layout/navigation.ts`
- `src/components/layout/site-footer.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `scripts/verify-v14-policy-pages.ts`
- `.agent/artifacts/v14-t08/policy-pages-check.json`
- `.agent/artifacts/v14-t08/policy-contact-mobile-vi.png`
- `.agent/artifacts/v14-t08/policy-privacy-desktop-en.png`

### Verification

- `POLICY_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-policy-pages.ts`:
  passed with all bilingual policy routes rendering, footer local routes
  resolving, required policy links present, no horizontal overflow, screenshots
  captured, and sitemap/robots policy routes present.
- Visual screenshot review: passed for mobile Vietnamese contact page and
  desktop English privacy page; assistant floating-button placement remains a
  sitewide polish candidate for `V14-T10`.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with policy routes included in route summary.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 109` and zero findings.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No schema/data migration, API/auth behavior change, payment provider,
  shipping-carrier integration, support-provider integration, new dependency,
  deploy, tag, or release was introduced.
- Contact/support copy uses app-backed account and order-tracking surfaces
  rather than fabricated support channels.

### Next Task

`V14-T09 - Checkout Commercial Reality Pass`.

---

## V14-T09 - Checkout Commercial Reality Pass

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Make checkout read and behave closer to a real customer-facing bookstore
checkout while preserving account-gated checkout and server-owned totals.

### Actual Result

- Updated checkout metadata and runtime copy so customer-facing language
  references store-recalculated totals rather than internal/server phrasing.
- Added a checkout confidence strip for account/contact checks, trusted
  recalculation, and available shipping/payment/returns policies.
- Presented COD and bank transfer as priority payment choices with distinct
  badges and tone classes.
- Kept MoMo, ZaloPay, and VNPay-style choices in awaiting-confirmation language
  without claiming credential collection or settlement.
- Added checkout policy links to `/shipping`, `/payment`, and `/returns`.
- Clarified English USD estimate wording: VND remains the checkout currency and
  USD is an estimate for comparison.
- Added `scripts/verify-v14-checkout-commercial-reality.ts`, including
  authenticated checkout rendering, policy-link checks, payment priority
  checks, USD/VND wording, no-overflow checks, and a real submit-to-success
  flow with cleanup.
- Added `allowedDevOrigins: ["127.0.0.1"]` in `next.config.ts` after Next 16
  dev logs showed blocked HMR resources for 127.0.0.1; this fixed checkout
  hydration for local verifier URLs.
- Updated `scripts/verify-book-checkout-steps.ts` to use API session login,
  avoiding form-hydration timing flake while preserving checkout API/order
  verification.

### Evidence

- `src/app/checkout/page.tsx`
- `src/features/checkout/checkout-page.tsx`
- `next.config.ts`
- `scripts/verify-v14-checkout-commercial-reality.ts`
- `scripts/verify-book-checkout-steps.ts`
- `.agent/artifacts/v14-t09/checkout-commercial-reality-check.json`
- `.agent/artifacts/v14-t09/checkout-v14-desktop-en.png`
- `.agent/artifacts/v14-t09/checkout-v14-mobile-vi.png`
- `.agent/artifacts/v14-t09/checkout-v14-desktop-en-success.png`

### Verification

- `CHECKOUT_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-checkout-commercial-reality.ts`:
  passed with assurance strip, COD/bank priority, five payment methods,
  policy links, primary badges, English USD/VND estimate clarity, no horizontal
  overflow, and submit-to-success flow all true.
- `BOOK_CHECKOUT_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-book-checkout-steps.ts`:
  passed with API tamper validation, browser order creation, checkout steps,
  validation cases, and no-overflow checks all true.
- Visual screenshot review: passed for desktop English checkout, mobile
  Vietnamese checkout, and desktop English success page. Next dev overlay
  appeared in screenshots only during local compilation and is not app UI.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 109` and zero findings.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No schema/data migration, payment-provider integration, shipping-carrier
  integration, auth boundary change, order API contract change, deploy, tag, or
  release was introduced.
- Browser-submitted totals remain ignored by the order API and server-owned
  recalculation is still verified.

### Next Task

`V14-T10 - Customer, Tracking, Assistant, And Account Surface Polish`.

---

## V14-T10 - Customer, Tracking, Assistant, And Account Surface Polish

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Make customer account, profile, public tracking, and assistant surfaces feel
like real bookstore operations while preserving account-gated checkout, minimal
public tracking data, and role-safe behavior.

### Actual Result

- Replaced remaining customer-facing Supabase/project implementation copy in
  account creation and profile email hints with CaseFlow Books account language.
- Updated signed-in account/profile surface treatment to use the V14
  trust/operations visual roles.
- Added a visible privacy guard on public order tracking explaining that lookup
  requires both order code and matching contact and does not reveal customer
  profile, address, or account details.
- Kept public tracking payload minimal; email, phone, and street address remain
  absent from the public result.
- Moved the assistant launcher to the mobile right side and verified purchase
  guidance actions remain visible without submitting `/api/orders`.
- Added `scripts/verify-v14-customer-surfaces.ts` for account, tracking, and
  assistant checks with Supabase test-user/order cleanup.
- Stabilized customer profile and public tracking verifiers by switching their
  login helper to the existing API session route instead of timing-sensitive UI
  form login.
- Updated customer/profile, public-tracking, assistant, and V14 screenshot
  helpers to use `caret: "initial"` so Playwright screenshots do not inject
  caret-hiding inline styles that trigger misleading Next dev hydration issue
  overlays.

### Evidence

- `src/features/customer/customer-auth-page.tsx`
- `src/features/customer/customer-profile-form.tsx`
- `src/features/orders/order-tracking-page.tsx`
- `src/features/assistant/bookstore-assistant.tsx`
- `scripts/verify-v14-customer-surfaces.ts`
- `scripts/verify-customer-profile.ts`
- `scripts/verify-public-order-tracking.ts`
- `scripts/verify-bookstore-assistant.ts`
- `.agent/artifacts/v14-t10/customer-surfaces-check.json`
- `.agent/artifacts/v14-t10/account-surface-desktop-en.png`
- `.agent/artifacts/v14-t10/tracking-surface-mobile-vi.png`
- `.agent/artifacts/v14-t10/assistant-surface-mobile-en.png`

### Verification

- `CUSTOMER_SURFACES_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-customer-surfaces.ts`:
  passed with account surface, tracking privacy, and assistant surface all true.
- `CUSTOMER_PROFILE_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-customer-profile.ts`:
  passed with profile completion, checkout gate, prefill, bilingual validation,
  no overflow, and no phone-verification claim all true.
- `PUBLIC_ORDER_TRACKING_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-public-order-tracking.ts`:
  passed with API guards, minimal public payload, tracking data, desktop
  English success UI, and mobile Vietnamese error UI all true.
- `BOOKSTORE_ASSISTANT_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-bookstore-assistant.ts`:
  passed with find-book, filter, no-result, purchase-guidance, and source-boundary
  checks all true.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 109` and zero findings.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No schema migration, catalog data mutation, production write beyond temporary
  test orders/users with cleanup, external assistant provider, payment-provider
  integration, deploy, tag, or release was introduced.
- Public tracking still requires both order code and matching contact, and does
  not expose private profile or shipping-address data.

### Next Task

`V14-T11 - Admin Operations Visual Upgrade`.

---

## V14-T11 - Admin Operations Visual Upgrade

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Make admin read more like a small-business operations console while preserving
server-side authorization, role boundaries, existing API contracts, and the
current database shape.

### Actual Result

- Added reusable `AdminOperationsRail` with active surface, role, permission
  scope, and visible-signal context across `AdminShellPage` surfaces.
- Reused the operations rail on the custom admin orders page so orders no
  longer visually diverge from dashboard/catalog/inventory/customers.
- Upgraded admin metric cards with dense operational stripe treatment.
- Added dashboard payment/order status rails while preserving existing summary
  data and totals.
- Fixed dashboard mobile horizontal overflow by applying `min-w-0` to grid
  dashboard sections, so wide recent-order table content scrolls internally
  instead of expanding the document.
- Replaced dashboard mobile recent-orders table rendering with compact order
  cards; desktop/tablet still use the table.
- Updated orders, inventory, and customers panels to use admin/operations
  visual roles without changing state machines, API calls, permissions, schema,
  or data mutations.
- Stabilized several older admin verification scripts by switching form-login
  helpers to existing API session routes for customer/admin/staff test users.

### Evidence

- `src/features/admin/admin-shell-page.tsx`
- `src/features/admin/admin-dashboard-page.tsx`
- `src/features/admin/admin-orders-page.tsx`
- `src/features/admin/admin-inventory-page.tsx`
- `src/features/admin/admin-customers-page.tsx`
- `scripts/verify-v14-admin-operations-visual.ts`
- `scripts/verify-staff-role-access.ts`
- `scripts/verify-admin-order-operations.ts`
- `scripts/verify-inventory-adjustments.ts`
- `scripts/verify-admin-customers.ts`
- `scripts/verify-admin-navigation.ts`
- `scripts/verify-admin-orders-csv-export.ts`
- `.agent/artifacts/v14-t11/admin-operations-visual-check.json`
- `.agent/artifacts/v14-t11/admin-v14-dashboard-mobile-vi.png`
- `.agent/artifacts/v14-t11/admin-v14-dashboard-desktop-en.png`
- `.agent/artifacts/v14-t11/admin-v14-orders-mobile-vi.png`
- `.agent/artifacts/v14-t11/admin-v14-orders-desktop-en.png`
- `.agent/artifacts/v14-t11/admin-v14-catalog-mobile-vi.png`
- `.agent/artifacts/v14-t11/admin-v14-catalog-desktop-en.png`
- `.agent/artifacts/v14-t11/admin-v14-inventory-mobile-vi.png`
- `.agent/artifacts/v14-t11/admin-v14-inventory-desktop-en.png`
- `.agent/artifacts/v14-t11/admin-v14-customers-mobile-vi.png`
- `.agent/artifacts/v14-t11/admin-v14-customers-desktop-en.png`

### Verification

- `ADMIN_OPERATIONS_VISUAL_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-admin-operations-visual.ts`:
  passed for dashboard, orders, catalog, inventory, and customers at mobile
  Vietnamese and desktop English viewports with admin palette, operations rail,
  role boundary, task panels, and no horizontal overflow all true.
- `STAFF_ROLE_ACCESS_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-staff-role-access.ts`:
  passed for anonymous, customer, staff, admin, order update, and role policy
  documentation checks.
- `ADMIN_ORDER_OPS_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-admin-order-operations.ts`:
  passed with access control, API transitions, UI workflow, persistence, and
  cleanup true.
- `ADMIN_BOOK_CATALOG_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-admin-book-catalog.ts`:
  passed with anonymous/customer denial, invalid payload rejection, staff CRUD,
  public active-state reflection, UI health, and cleanup true.
- `INVENTORY_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-inventory-adjustments.ts`:
  passed with anonymous/customer denial, invalid adjustment rejection, audit
  trail storage, low-stock visibility, out-of-stock boundary, staff UI flow, and
  cleanup true.
- `ADMIN_CUSTOMERS_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-admin-customers.ts`:
  passed with access control, admin/staff read, minimized customer data, staff
  UI health, and cleanup true.
- `ADMIN_DASHBOARD_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-admin-dashboard.ts`:
  passed with access control, API metrics, UI metrics, empty state, and cleanup
  true.
- `ADMIN_NAVIGATION_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-admin-navigation.ts`:
  passed for staff and admin navigation.
- `ADMIN_ORDERS_CSV_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-admin-orders-csv-export.ts`:
  passed with access control, CSV headers/rows, sensitive-field exclusion,
  dashboard link, and cleanup true.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 109` and zero findings.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed.
- `git diff --check`: passed.

### Guardrails Preserved

- No schema migration, permission expansion, production data import, external
  service, payment/shipping integration, deploy, tag, or release was introduced.
- Admin/staff/customer role checks remain server-owned; UI polish did not
  weaken API authorization.

### Next Task

`V14-T12 - Full Local Quality Gate And Release Readiness Report`.

---

## V14-T12 - Full Local Quality Gate And Release Readiness Report

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising upgrade

### Objective

Verify the complete local `v1.4.0` candidate before any deploy, tag, or GitHub
Release decision.

### Actual Result

- Created `docs/v1.4-release-readiness-report.md`.
- Accepted the local `v1.4.0` candidate as release-ready for a later explicit
  release task.
- Verified the V14 runtime copy, visual-token system, home/catalog/detail/
  policy/checkout/customer/admin visual QA, full E2E suite, cleanup, high/
  critical dependency audit, targeted secret scan, and whitespace gate.
- Fixed a verifier-only screenshot timeout in
  `scripts/verify-accessibility-mobile-performance.ts` by disabling animation
  and caret side effects during screenshot capture and increasing the
  screenshot timeout to 60 seconds; the rerun passed.
- Recorded the user-provided Project Gutenberg, Standard Ebooks, and
  Vietnamese ebook/PDF sources as future cover-source candidates only; no
  external cover import or runtime catalog mutation was performed.

### Evidence

- `docs/v1.4-release-readiness-report.md`
- `scripts/verify-accessibility-mobile-performance.ts`
- `.agent/artifacts/v14-t05/homepage-visual-check.json`
- `.agent/artifacts/v14-t06/catalog-discovery-check.json`
- `.agent/artifacts/v14-t07/book-detail-commercial-trust-check.json`
- `.agent/artifacts/v14-t08/policy-pages-check.json`
- `.agent/artifacts/v14-t09/checkout-commercial-reality-check.json`
- `.agent/artifacts/v14-t10/customer-surfaces-check.json`
- `.agent/artifacts/v14-t11/admin-operations-visual-check.json`
- `.agent/artifacts/d39-t03/accessibility-mobile-performance-check.json`
- `.agent/artifacts/d40-t01/release-cleanup-check.json`

### Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 48 App Router routes generated.
- `npm run test:e2e`: passed `20/20` against `next start` on port `3001`.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 109` and zero findings.
- `npx tsx scripts/verify-v14-visual-tokens.ts`: passed with all required V14
  roles present and zero runtime raw-hex findings.
- `HOMEPAGE_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-homepage-visual-merchandising.ts`:
  passed.
- `CATALOG_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-catalog-discovery.ts`:
  passed.
- `BOOK_DETAIL_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-book-detail-commercial-trust.ts`:
  passed.
- `POLICY_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-policy-pages.ts`:
  passed.
- `CHECKOUT_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-checkout-commercial-reality.ts`:
  passed.
- `CUSTOMER_SURFACES_VERIFY_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-customer-surfaces.ts`:
  passed.
- `ADMIN_OPERATIONS_VISUAL_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-v14-admin-operations-visual.ts`:
  passed.
- `ACCESSIBILITY_MOBILE_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/verify-accessibility-mobile-performance.ts`:
  passed with admin controls, catalog performance, checkout controls, focus
  states, no overflow, and screenshots all true.
- `npx tsx scripts/verify-release-cleanup.ts`: passed with
  `totalMatches: 0`.
- `npm audit --audit-level=high`: passed; two known moderate PostCSS advisories
  remain through Next.js and are documented as non-blocking.
- Targeted candidate-file secret scan: passed across 1058 files with zero
  findings and without printing secret values.
- `git diff --check`: passed after the final V14-T12 documentation update.

### Guardrails Preserved

- No deploy, tag, GitHub Release, schema migration, production catalog
  mutation, payment-provider integration, shipping-carrier integration, SMS/
  email provider integration, external AI service, or external cover import was
  performed.
- Admin/staff/customer authorization remains server-owned.
- Server-owned price, stock, VAT, shipping, payment-fee, promotion, and total
  calculation boundaries remain unchanged.

### Next Task

Await explicit approval for optional `v1.4.0` deploy, smoke test, commit, tag,
push, and GitHub Release.

---

## V14-T13 - Deploy, Smoke Test, Commit, Tag, Push, And Create GitHub Release v1.4.0

- Date: 2026-07-19
- Status: completed
- Phase: CaseFlow Books v1.4 real commerce and visual merchandising release

### Objective

Release the locally gated `v1.4.0` candidate to production, verify production
behavior, commit/tag/push the release state, and create a professional GitHub
Release.

### Actual Result

- Confirmed GitHub CLI auth, Vercel project link, no existing local/remote
  `v1.4.0` tag, no existing GitHub Release `v1.4.0`, and no local
  Playwright/Next/Vercel process conflict.
- Ran release-prep gates: `npm run lint`, `npm run build`, V14 runtime
  no-demo-copy scan, targeted secret scan, and `git diff --check`.
- Created release-prep commit `3f20bc6` with the V14 implementation, docs,
  verification scripts, and visual evidence.
- Deployed production Vercel deployment
  `dpl_7S279YwsGzB4D6H11PiauzG9GvDL`, aliased to
  `https://caseflow-store.vercel.app`.
- Production release smoke passed with public pages, language mode,
  cart/checkout boundary, customer boundary, admin boundary, assistant,
  representative detail pages, canonical alias, 100 active editions, 100 cover
  responses, 50 English editions, and 50 Vietnamese editions.
- Fixed the older short production smoke verifier to accept localized
  English/Vietnamese detail titles, then reran it successfully.
- Added `docs/v1.4-real-commerce-visual-merchandising-release-notes.md` and
  updated latest-release claims in README, app README, architecture, known
  limitations, CV bullets, portfolio handoff, and agent trackers.

### Evidence

- `docs/v1.4-real-commerce-visual-merchandising-release-notes.md`
- `docs/v1.4-release-readiness-report.md`
- `.agent/artifacts/v14-t13/deployment.json`
- `.agent/artifacts/v14-t13/production-release-smoke.json`
- `.agent/artifacts/v14-t13/production-home-desktop-en.png`
- `.agent/artifacts/v14-t13/production-catalog-mobile-vi.png`
- `.agent/artifacts/v14-t13/production-detail-desktop-en.png`
- `.agent/artifacts/v14-t13/production-detail-mobile-vi.png`
- `.agent/artifacts/v14-t13/production-admin-boundary-mobile-en.png`
- `.agent/artifacts/d40-t02/production-smoke-check.json`

### Verification

- `gh auth status`: passed for account `NVTruong473`.
- `npx vercel --version`: passed with Vercel CLI `56.3.2`.
- `git ls-remote --tags origin 'refs/tags/v1.4.0'`: no existing remote tag.
- `gh release view v1.4.0 --json tagName,name,url,isDraft,isPrerelease`: no
  existing release before publication.
- `npm run lint`: passed.
- `npm run build`: passed locally with 48 App Router routes plus proxy.
- `npx tsx scripts/verify-v14-no-demo-runtime-copy.ts`: passed with
  `scannedFiles: 109` and zero findings.
- Targeted candidate-file secret scan: passed across 1059 files with zero
  findings and without printing secret values.
- `git diff --check`: passed before release-prep commit.
- `npx vercel --prod --yes`: passed; deployment
  `dpl_7S279YwsGzB4D6H11PiauzG9GvDL` reached `READY` and was aliased to
  `https://caseflow-store.vercel.app`.
- `npx vercel inspect https://caseflow-store-8x2gdsk6j-nvt-ruong473.vercel.app`:
  passed; status `Ready`, target `production`, alias includes
  `https://caseflow-store.vercel.app`.
- `PRODUCTION_RELEASE_TASK_ID=v14-t13 ... npx tsx scripts/verify-v12-production-release.ts`:
  passed with `ok: true`.
- `PRODUCTION_SMOKE_BASE_URL=https://caseflow-store.vercel.app npx tsx scripts/verify-production-smoke.ts`:
  passed after localized-title verifier fix.

### Guardrails Preserved

- No schema migration, production catalog mutation, external cover import,
  payment-provider integration, shipping-carrier integration, SMS/email
  provider integration, or external AI integration was introduced.
- Server-owned price, stock, VAT, shipping, payment-fee, promotion, total, and
  authorization boundaries remain unchanged.

### Next Task

No active implementation task after remote push, tag, and GitHub Release
verification complete.
