# Private Bookstore Template Handoff

Date: 2026-07-24
Task: `TEMPLATE-T06`

## Repository Model

| Repository | Purpose | Visibility |
|---|---|---|
| `NVTruong473/caseflow-store` | Public showroom, portfolio history, Production demo, and release evidence | Public |
| `NVTruong473/caseflow-bookstore-template` | Clean bookstore-first source baseline used to start buyer work | Private |
| Future buyer repository | Buyer-specific brand, catalog, infrastructure, integrations, and acceptance evidence | Private, created only for a real buyer |

The model is `2 + N`, not three permanently synchronized copies. No buyer
repository exists yet.

## Published Template

- Local path:
  `/Users/vantruong/Documents/caseflow-bookstore-template`
- Private repository:
  `NVTruong473/caseflow-bookstore-template`
- Template commit:
  `d75c6bcf4411f432fe9ece504f4b0ee2f67fcb24`
- Annotated tag: `template-v1.0.0`
- GitHub Release ID: `359304571`
- Package: `bookstore-commerce-starter@1.0.0`, private and `UNLICENSED`
- Source shape: 272 allowlisted files with a fresh Git history

The template is not deployed. A deployment without buyer-owned catalog,
identity, policies, and infrastructure would create another misleading demo
rather than a buyer product.

## Verified Boundaries

- No showroom Git history, `.agent`, local environment, Vercel metadata,
  Production report, private backup, or downloaded Gutenberg cover directory.
- No showroom Production URL, deployment ID, Supabase project reference,
  mailbox, database URL, or fixed 500-edition storefront claim.
- Payment and external notification providers are disabled by default.
- Store identity can be replaced through environment values without source
  edits.
- A build without Supabase credentials generates the 59 application routes;
  the sitemap emits static routes until buyer Supabase is configured.
- Full Playwright is retained but must run only against an isolated buyer/test
  Supabase project.

## Quality Evidence

| Gate | Result |
|---|---|
| Deterministic export | Two 272-file exports, identical SHA-256 inventory, zero findings |
| Install and dependency audit | 411 packages installed, zero vulnerabilities |
| ESLint and TypeScript | PASS |
| Layer boundary | 218 files, zero findings |
| Storefront configuration | PASS with neutral default and buyer override |
| Notification/provider safety | PASS |
| Admin query safety | PASS |
| Public asset metadata | 6 files, zero findings |
| Production build | 59 routes, PASS without `.env.local` |
| Buyer fixture | Environment-only rebrand, 59-route build, zero tracked source changes |
| Template remote | Private, `main` and peeled tag match `d75c6bc` |

## Buyer Start Procedure

1. Complete `docs/buyer-discovery-questionnaire.md`.
2. Confirm the buyer is a bookstore or estimate a separate domain migration.
3. Sign source license, scope, support, data, and acceptance terms.
4. Create a buyer-owned private repository from `template-v1.0.0`.
5. Create buyer-owned Supabase, deployment, domain, and provider accounts.
6. Replace brand, catalog, covers, contacts, and policies.
7. Apply migrations with backup/rollback and reconcile imported data.
8. Run security, role, checkout, responsive, accessibility, and isolated E2E.
9. Complete customer/staff/admin UAT and obtain buyer sign-off.

## Update Procedure

Shared fixes are released in the private template first. A buyer repository
receives an explicit reviewed merge or cherry-pick from a template tag. Buyer
code is not merged back into the template unless it is generalized and covered
by regression checks.

## Honest Limit

The template models books, editions, authors, translations, ISBN, and book
merchandising. A fashion, electronics, or general-product buyer cannot safely
use it by replacing rows alone.
