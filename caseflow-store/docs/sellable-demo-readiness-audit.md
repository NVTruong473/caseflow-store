# Sellable Demo Readiness Audit

Date: 2026-07-24
Task: `PRODUCTIZE-T01`

## Position

CaseFlow Books is a strong reference implementation and portfolio product. It
is not a turnkey operating bookstore. The correct sales proposition is
“reviewed source and a working reference deployment, customized with the
buyer,” not “buy today and accept real orders without further work.”

## Baseline Findings

| Priority | Finding | Evidence | Impact | Correction |
|---|---|---|---|---|
| P1 | Public identity is hard-coded across layout, header, footer, SEO, policies, and payment fallback. | `src/app/layout.tsx`, `src/components/layout/site-header.tsx`, `src/components/layout/site-footer.tsx`, `src/lib/seo/metadata.ts`, `src/lib/payments/config.ts` | Rebranding requires error-prone search-and-replace. | Add typed centralized public store configuration. |
| P1 | The footer publishes an invented hotline and unconfigured support mailboxes. | `src/components/layout/site-footer.tsx` | A prospect may treat unreachable details as real support commitments. | Make phone/email optional and omit them by default. |
| P1 | Root and app README still describe `v1.13.0` as latest after `v1.13.1`. | `README.md`, `caseflow-store/README.md` | Weakens release credibility and handoff accuracy. | Update from verified tag/deployment evidence and add a stale-release gate. |
| P1 | No buyer discovery or acceptance contract defines what must be supplied before launch. | Existing handoff docs | Hidden scope appears only after a sale. | Add buyer questionnaire and commercial-boundary checklist. |
| P2 | Existing operational handoff is project-version oriented, not buyer customization oriented. | `docs/v1.11-final-operational-handoff.md` | Technical material exists but does not answer rebrand/data migration questions. | Add a focused buyer customization and catalog handoff guide. |
| P2 | No automated gate prevents placeholder contact data or hard-coded identity from returning. | `package.json`, `scripts/` | Future polish can silently regress productization. | Add a productization verifier with release-scoped evidence. |
| P2 | Catalog replacement is proven for the reference dataset but not specified as a buyer mapping contract. | catalog manifests, migrations, import scripts | “Replace products” may be underestimated. | Document required fields, mapping, provenance, backups, dry-run, import, and rollback. |
| P3 | Current public request latency can include 2–3 second cold responses. | Production spot check on 2026-07-24 | Acceptable for a demo, but not evidence of sustained buyer traffic performance. | Document load testing as buyer-specific acceptance work; do not fabricate a scale claim. |

## Adversarial Questions

1. Can a buyer change the brand without searching dozens of source files?
2. Which displayed phone, email, legal entity, and policy statements are
   actually owned and monitored?
3. If the buyer supplies 20,000 products, what mapping, image rights, indexing,
   pagination, and load tests become mandatory?
4. Can old orders retain correct title, price, tax, and item snapshots after a
   catalog migration?
5. Who owns the cover images and descriptions after handoff, and where is that
   provenance recorded?
6. What fails closed when payment, email, SMS, or shipping credentials are
   absent or wrong?
7. Can staff access owner-only settings, customer PII, provider secrets, or
   another customer's orders?
8. How are test users, test orders, vouchers, notification rows, and stock
   mutations removed before buyer acceptance?
9. What is included in the source sale, and what requires a separate provider,
   legal review, migration, or service fee?
10. Can the buyer reproduce build, deployment, rollback, backup, and smoke
    verification without relying on the original developer's machine?
11. Does the demo prove real provider delivery, settlement, fulfillment, or
    legal compliance, or only application behavior?
12. What objective evidence must pass before anyone changes the wording from
    “reference demo” to “live business”?

## Retain

- Next.js modular monolith and layered high-risk mutations.
- Supabase Auth/PostgreSQL, RLS, server-owned totals, role checks, and order
  idempotency.
- Bilingual storefront, 500-edition reference catalog, account history,
  operations dashboard, in-app notifications, and simulated transfer flow.
- Production mock-payment lock and disabled external providers.
- Existing browser, security, accessibility, SEO, secret, and cleanup gates.

## Do Not Build Now

- Tenant provisioning, reseller billing, theme builder, arbitrary CSV wizard,
  custom-domain automation, provider marketplace, or buyer self-service
  deployment.
- Real payment/email/SMS/logistics without a named buyer and approved
  credentials.
- Fake testimonials, sales counts, hotline, company registration, delivery
  promise, or legal-compliance badge.

## Baseline Decision

Proceed with bounded productization. The application needs configuration and
handoff discipline, not another feature expansion.
