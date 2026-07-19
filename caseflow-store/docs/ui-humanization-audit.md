# UI Humanization Audit

- Task: `UIH-T01`
- Date: 2026-07-19
- Product: CaseFlow Books
- Scope: storefront, catalog, product detail, shared UI primitives, header, footer, and documentation. Admin, auth, payment, checkout, API contracts, and database schema are preserved.
- References reviewed: `https://ytdubbingpro.web.app/`, `https://dub-craft.lovable.app/`, `https://dubbl-wave-vision.lovable.app/`.
- Baseline evidence: `.agent/artifacts/ui-humanization-t01/baseline-home-1440.png`, `.agent/artifacts/ui-humanization-t01/baseline-home-375.png`, `.agent/artifacts/ui-humanization-t01/baseline-catalog-1440.png`, `.agent/artifacts/ui-humanization-t01/baseline-detail-1440.png`.

## Reference Principles Extracted

The FlowSync references show useful patterns: an immediate visual proof near the hero, fewer competing CTAs, a strong signature motif, and section rhythm that alternates dense information with quieter storytelling. They also show patterns CaseFlow should avoid: fabricated usage metrics, oversized SaaS claims, centered hero formulas, generic pill badges, and dark AI-gradient styling that does not match a bookstore.

CaseFlow Books should borrow the principle of a clear product demonstration, not the FlowSync brand, copy, metrics, or visual identity.

## Product Diagnosis

CaseFlow Books is no longer a generic storefront. It is a bilingual bookstore and small-business operations demo with 500 sellable editions, account-gated checkout, QR demo payment controls, order tracking, and admin/staff operations. The interface already has real functionality and a useful book-led palette, but some presentation still feels mechanically generated because many sections use the same bordered-card grammar, similar spacing, and explanatory microcopy that describes implementation rather than customer outcomes.

## Findings

| Priority | Page or Component | File | Current Problem | Why It Feels Generic or Artificial | Impact | Correction |
|---|---|---|---|---|---|---|
| P0 | Homepage hero | `src/app/page.tsx` | Hero uses a badge, title, paragraph, one CTA, three equal stat cards, and a separate boxed product rail. | This resembles a standard generated landing-page composition with perfectly balanced blocks and repeated cards. | The first viewport does not feel like a specific bookstore floor; it feels like a template filled with bookstore words. | Reframe hero as a "reading table": left editorial copy, compact proof strip, and right book stack with selected editions as proof. Remove currency disclosure from hero. |
| P0 | Public navigation | `src/components/layout/navigation.ts`, `src/components/layout/site-header.tsx` | Public header includes `Admin` as a normal customer navigation item and shows "Signed in" as a CTA label. | Real customer storefronts do not usually expose the back office in primary navigation. "Signed in" describes state, not destination. | The header signals portfolio/demo machinery instead of a retail storefront. | Remove admin from public nav, keep `/admin` route accessible directly, and use "My account" / "Tai khoan cua toi" as the account destination. |
| P1 | Catalog intro | `src/app/catalog/page.tsx` | Large framed intro panel and metric boxes repeat the homepage card language. | A full catalog page should behave more like a working shelf table: search, filters, and result context should have editorial hierarchy. | Catalog starts with container-heavy presentation before the user reaches filters. | Use a quieter intro with a left spine rule and inline metadata; keep total/page context but reduce equal boxed cards. |
| P1 | Catalog quick links | `src/app/catalog/page.tsx` | "Popular ways to browse" is useful, but the section is a full bordered panel with six equal button-pills. | It still looks like generic chip navigation and repeats the same tone for every intent. | Important buying paths do not have visual hierarchy. | Make quick links an open shelf strip with one primary browsing path and smaller supporting paths. |
| P1 | Product detail confidence copy | `src/app/products/[slug]/page.tsx` | Detail copy says the store checks account details, stock, VAT, shipping, and payment totals. | This reads like internal implementation evidence instead of customer-facing assurance. | The page sounds technical and less natural, especially near purchase controls. | Rewrite as bookstore service copy: language, format, publisher, stock, and checkout policies are visible before purchase. |
| P1 | Product detail panels | `src/app/products/[slug]/page.tsx` | Several sections use similar rounded bordered blocks: identity, comparison, reason, facts, commerce hints. | The repeated card grammar makes the page look assembled rather than edited. | Section priority is flat; the cover, edition choice, and purchase action should dominate. | Use a ledger-like identity panel and lighter proof notes; keep cards only for interactive edition choices and purchase controls. |
| P1 | Shared cards | `src/components/ui/card.tsx`, `src/features/books/merchandising-layouts.tsx` | Most surfaces combine border, rounded corner, muted background, and sometimes shadow. | Uniform treatment makes unrelated content feel equally important. | Weak hierarchy across shelves, filters, proof notes, and product cards. | Add documented elevation rules; use shadows sparingly and introduce flat editorial surfaces. |
| P2 | Typography and line length | `src/app/page.tsx`, `src/app/catalog/page.tsx` | Several paragraphs use the same body size and line-height across hero, notes, and descriptions. | Generated UIs often treat every paragraph as equivalent. | Reading rhythm is monotonous and mobile copy feels dense. | Use tighter metadata, stronger section headings, and shorter customer-facing sentences. |
| P2 | Footer support card | `src/components/layout/site-footer.tsx` | Footer is useful, but the support box is another bordered card inside a footer column. | It follows the same card grammar as the rest of the site. | Footer feels boxed instead of like stable store information. | Make support details an inline contact ledger with small separators. |
| P2 | Motion and interaction | `src/components/ui/button.tsx`, `src/app/globals.css` | Buttons have hover colors, but no documented active/reduced-motion behavior. | Default hover-only interactions feel framework-like. | Keyboard and reduced-motion support exist but are not fully documented as a system. | Standardize fast transitions, active state, and reduced-motion guardrails. |
| P2 | Design documentation | `DESIGN.md` | Existing system is concise and token-based but lacks detailed rules for humanized composition. | Future patches can reintroduce generic cards, pills, and fake proof. | Design quality may regress after this task. | Add `docs/style-guide.md` with implemented rules, examples, and anti-patterns. |

## Retain

- Warm paper, ink, moss, amber, wine, and admin/navy token direction.
- Book covers as primary visual evidence.
- Local generated cover assets instead of copied commercial covers.
- Account-gated checkout, order tracking, QR demo safety, role boundaries, and server-owned totals.
- Mobile-first constraints and Playwright verifier approach.

## Refine

- Header density and public navigation.
- Hero visual hierarchy.
- Catalog intro and quick-link rhythm.
- Product detail assurance copy.
- Shared button interaction and reduced-motion handling.
- Footer support presentation.

## Consolidate

- Repeated bordered panels into fewer intentional surface patterns.
- Trust/proof copy into customer-facing service notes.
- Equal statistic cards into inline proof strips when the numbers are not marketing evidence.

## Replace

- "Signed in" header label with a real destination label.
- Public `Admin` nav item with direct-route access only.
- Implementation-style confidence copy with customer-facing bookstore language.

## Remove

- Currency-rate disclosure from homepage hero. Currency estimates remain available where price is actually evaluated.
- Generic "everything in a card" presentation where text can be an open editorial note.

## Acceptance Notes

This audit does not authorize new product claims, new integrations, copied testimonials, commercial cover scraping, schema changes, or feature additions. The redesign should make existing functionality feel authored, not make the product look bigger than it is.
