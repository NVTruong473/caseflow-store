# CaseFlow Books Style Guide

- Task: `UIH-T01`, extended by `V18-T01`
- Status: implemented guidance for the UI humanization and modern editorial bookstore pass
- Product: CaseFlow Books

## 1. Overview

CaseFlow Books should feel like a practical bilingual bookstore with a small-business operations layer behind it. The design direction is editorial, practical, calm, precise, and approachable.

Target audience:

- Readers in Vietnam choosing between English originals and Vietnamese editions.
- Customers who need clear VND pricing, COD or bank-transfer expectations, and order tracking.
- Hiring reviewers evaluating a realistic full-stack e-commerce portfolio.
- Small-business operators reviewing catalog, stock, order, and promotion workflows.

Signature visual idea: the reading table and spine rail. Book covers, spine-like side rules, edition ledgers, and shelf rows should create the brand character. Do not use generic glowing orbs, AI gradients, floating blobs, or fake metrics as identity.

V18 extension: discovery should feel search-first and inventory-aware. Header
search, category access, cover provenance, and restrained product motion are now
part of the core storefront identity.

Hierarchy strategy:

- Put real book covers and sellable editions before abstract claims.
- Use one dominant action per page.
- Use open editorial layouts for explanatory content.
- Use cards only for independent objects such as products, orders, forms, or interactive choices.

Intentional asymmetry:

- The homepage hero can place editorial copy in a narrower left column and the book stack in a wider proof column.
- Catalog can use a narrow spine metadata column beside a broader filter/result area.
- Product detail can use a cover column, purchase rail, and edition ledger with different visual weights.
- Asymmetry must still align to the grid and must not rely on random rotations or arbitrary offsets.

## 2. Color Palette

| Token | Value | Role | Use | Avoid | Contrast Notes |
|---|---:|---|---|---|---|
| `--background` | `#FBFAF7` | Page paper | Body background and quiet sections | Do not put low-contrast muted text on it below small size | Good with `--foreground` |
| `--surface` | `#FFFDF8` | Elevated paper | Forms, product cards, purchase panels | Do not nest surface cards inside other cards | Good with `--foreground` |
| `--surface-muted` | `#EEF2EB` | Quiet muted surface | Secondary nav hover, low-emphasis panels | Do not use for dense text blocks without enough contrast | Good with `--foreground` |
| `--foreground` | `#1F1B16` | Primary text | Headings, labels, prices | Do not use as decorative fill everywhere | Strong contrast |
| `--text-muted` | `#6F665C` | Secondary text | Body descriptions, captions, metadata | Do not use for critical errors or small low-contrast text on tinted backgrounds | Check small text on tinted surfaces |
| `--border` | `#D8D2C7` | Default rule | Separators and low-emphasis borders | Do not wrap every section in it | Works as quiet structure |
| `--primary` | `#176B5B` | Primary action/discovery | Main CTA, focus ring, active links | Do not recolor every badge primary | White text passes |
| `--primary-hover` | `#0F5146` | Primary hover | Button hover and strong active states | Do not use for muted backgrounds | White text passes |
| `--accent` | `#B7791F` | Offer/accent | Discounts and sale notes | Do not use for unrelated decoration | Use with dark text on pale offer surfaces |
| `--editorial` | `#8F2440` | Editorial shelf | Curated picks and reading notes | Do not overuse as alert color | Pair with `--editorial-muted` |
| `--translation` | `#B04436` | Translation pairs | EN/VI comparison and language switching context | Do not use for errors | Pair with `--translation-muted` |
| `--academic` | `#2F5D8C` | Classic/reference | Academic or classic literature shelves | Do not use as default link color | Pair with `--academic-muted` |
| `--trust` | `#2D6E62` | Service trust | Shipping, account, support, privacy notes | Do not use to imply unverified security claims | Pair with `--trust-muted` |
| `--arrival` | `#6A5D2F` | New/reading path | New arrivals and path sequencing | Avoid large all-over backgrounds | Pair with `--arrival-muted` |
| `--admin` | `#243247` | Admin surface | Back-office navigation and operations | Do not use on public retail hero | Strong with white |
| `--success` | `#247857` | Success | Success badges and paid states | Do not rely on color only | Pair with text |
| `--warning` | `#A16207` | Warning | Low stock and pending states | Do not use for offers unless it is a real promotion | Pair with label |
| `--error` | `#B42318` | Error | Validation and destructive actions | Do not use for marketing emphasis | Pair with clear error text |
| `--focus-ring` | `#176B5B` | Focus | Keyboard focus outline | Never remove without replacement | Must remain visible |

## 3. Typography

Font family: `Inter, ui-sans-serif, system-ui, sans-serif`.

Use no more than this single family unless a future ADR adds a bookish serif for covers or editorial headings. Current generated covers already carry their own visual type treatment.

| Style | Size | Line Height | Weight | Usage |
|---|---:|---:|---:|---|
| Display heading | `40px` desktop, no viewport scaling | `1.1-1.15` | `600-700` | Homepage hero and page-defining headings |
| Page heading | `32-40px` | `1.15` | `600` | Catalog/detail page titles |
| Section heading | `28px` | `1.2` | `600` | Major shelves and content groups |
| Card heading | `18-20px` | `1.3` | `600` | Product cards and independent panels |
| Body | `16px` | `1.55-1.7` | `400` | Main explanatory copy |
| Small body | `14px` | `1.45-1.6` | `400` | Metadata and captions |
| Label | `13-14px` | `1.2-1.4` | `500-600` | Form labels, table labels, metadata labels |
| Button | `14-16px` | `1.2` | `500-600` | Actions |
| Price/numeric | `18-28px` | `1.15` | `600-700` | Prices, totals, dashboard metrics |

Rules:

- Do not scale font size with viewport width.
- Keep letter spacing normal except tiny uppercase operational labels, and even there avoid negative spacing.
- Body paragraphs should generally stay under `72ch`; narrow editorial notes should stay under `56ch`.
- Prefer shorter copy over smaller text.

## 4. Spacing System

Base tokens:

- `--case-space-xs`: `4px`
- `--case-space-sm`: `8px`
- `--case-space-md`: `16px`
- `--case-space-lg`: `24px`
- `--case-space-xl`: `32px`
- `--case-space-2xl`: `48px`

Use dense layouts for filters, admin tables, order cards, and metadata ledgers. Use spacious layouts for hero, major shelves, and checkout decision steps. Intentional exceptions must support reading sequence, not visual randomness.

## 5. Layout System

Widths:

- Reading content: `max-w-3xl`.
- Storefront content: `max-w-6xl`.
- Wide retail floor: `max-w-7xl`.
- Full bleed only for page bands, never for dense text.

Grid rules:

- Use asymmetrical grids where content has different importance.
- Avoid repeated `3 equal cards` as a default.
- Product grids are acceptable because products are repeated objects.
- Do not place cards inside cards.
- Maintain `2 / 3` book cover ratio.

Breakpoints:

- `320-375px`: single-column, touch-first, no clipped text.
- `768px`: two-column where content remains readable.
- `1024px`: introduce side rails.
- `1280-1440px`: use asymmetry and richer proof visuals.

## 6. Component Styles

Header:

- Customer-facing navigation should show shopping, discovery, tracking, account, language, and cart.
- Desktop storefront navigation includes a search form for title, author, or
  ISBN, and the form submits to `/catalog` with a URL-backed `q` parameter.
- Desktop category navigation uses real active category data in a compact menu.
- Back-office routes must not look like customer navigation.
- Active and hover states should be quiet and visible.

Navigation:

- Use text links with small focus outlines.
- Do not turn every nav item into a bordered pill.

Mobile navigation:

- Use a semantic button.
- Keep account, language, and cart reachable.
- Include mobile search and the top active categories so product discovery is
  not hidden behind homepage-only sections.
- Close menu after link activation.

Buttons:

- Primary: moss fill, white text.
- Secondary: paper fill, quiet border.
- Ghost: no border unless needed for hit-area recognition.
- Active state may shift by `1px`; disable under reduced motion.

Text links:

- Use underline or color shift where reading context matters.
- Keep focus visible.

Cards:

- Product card: image, title, author, language/format, stock, price, action.
- Form card: allowed when it groups a real transaction or search task.
- Editorial note: prefer open text with a spine rule.
- Proof note: compact ledger or inline list before another full card.

Badges:

- Use badges for state, language, format, offer, or curation.
- Do not begin every section with a badge.
- Do not use pill shapes by default.

Feature sections:

- Use shelf, rail, ledger, and comparison patterns.
- Avoid equal card grids for concepts of unequal importance.

Product demonstrations:

- Use actual book covers, current UI screenshots, or realistic in-app panels.
- Do not hotlink external images.
- Cover assets must be backed by `assets/book-covers/sources.json`. Project
  generated covers are acceptable when marked as synthetic; missing or fallback
  covers must say that the cover is being updated.

Forms and inputs:

- Visible labels are required.
- Error text sits near the field.
- Invalid state cannot rely on color alone.

Footer:

- Use support/contact/policy details that are useful to a customer.
- Avoid placeholder social links and empty columns.

Empty, error, loading states:

- State what happened and the next action.
- Do not expose stack traces or implementation internals.

## 7. Shadows and Elevation

Elevation levels:

- Level 0: border or rule only.
- Level 1: subtle surface for cards and forms.
- Level 2: purchase rail, menu overlay, cart drawer, assistant panel.

Use shadows sparingly:

- Product covers may use `--case-shadow-cover`.
- Major purchase or hero proof panels may use `--case-shadow-soft`.
- Do not apply the same shadow to every section.

## 8. Animations and Transitions

Default duration: `150-200ms`.

Runtime motion tokens:

- `--case-duration-instant`: `80ms`
- `--case-duration-fast`: `150ms`
- `--case-duration-normal`: `220ms`
- `--case-duration-slow`: `320ms`
- `--case-ease-standard`: `cubic-bezier(0.2, 0, 0, 1)`
- `--case-ease-out`: `cubic-bezier(0, 0, 0.2, 1)`

Use transitions for:

- Button hover/active/focus.
- Link hover.
- Product cover emphasis.
- Menu open/close visibility.
- Product cards may use the `case-product-card-motion` helper for a small
  hover lift and border/surface feedback.
- Long pages may use the bottom-left back-to-top control; it must not overlap
  the assistant button or checkout controls.

Avoid:

- Continuous floating.
- Scroll-jacking.
- Large entrance animations.
- Bouncing.
- Cursor-following effects.

Reduced motion:

- Disable non-essential transitions and transforms under `prefers-reduced-motion`.

## 9. Border Radius

Radius scale:

- Small `4px`: badges, language segments, metadata chips.
- Medium `6px`: buttons, inputs, compact cards.
- Large `8px`: product cards, purchase panels, modal shells.
- Fully rounded: only circular icon/avatar controls or small assistant launcher.

Do not make every component pill-shaped.

## 10. Opacity and Transparency

- Muted text uses semantic muted color, not arbitrary opacity.
- Borders can use `/20` to reduce emphasis on tinted surfaces.
- Disabled controls can use `opacity-60` with disabled cursor.
- Avoid glassmorphism except sticky header blur, where it improves context while scrolling.

## 11. Common Tailwind CSS Usage

Preferred patterns:

- `gap-case-*` for spacing between children.
- `rounded-md` or `rounded-lg` from token scale.
- `text-small`, `text-body`, `text-heading-*` from tokens.
- `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.
- `motion-reduce:transition-none` when transforms or hover movement are used.

Discouraged:

- Raw hex values in runtime components.
- Repeated `rounded-lg border bg-surface p-case-lg shadow` on every section.
- Arbitrary width/height values unless they stabilize a fixed-format element.
- Negative letter spacing.
- Viewport-based font scaling.

Extract a component when the same class cluster appears across independent pages and carries semantic meaning.

## 12. UX Writing and Microcopy

Voice:

- Specific, calm, direct, bookstore-aware.
- Use concrete outcomes: choose edition, compare language, see stock, track order.
- Avoid inflated startup phrases and fake intimacy.

CTA rules:

- Use "Browse books", "View edition", "Add to cart", "Track order", "Continue to payment".
- Avoid "Get started" when a clearer action exists.

Trust rules:

- State only what the product actually does.
- Use transparent limitations when needed.
- Do not fabricate ratings, customer logos, awards, install counts, or usage numbers.

Error messages:

- Explain what happened.
- Give the next action.
- Do not expose stack traces, SQL, service names, or secrets.

## 13. Accessibility

- Maintain visible focus styles.
- Use semantic buttons and links.
- Inputs need visible labels.
- Touch targets should be at least `40px` high where practical.
- Do not rely on color as the only state indicator.
- Product covers need useful alt text.
- Mobile navigation must be keyboard usable.
- Reduced motion must be respected.
- Heading order should follow page structure.

## 14. Example Component Reference Code

Primary button:

- File: `src/components/ui/button.tsx`
- Uses semantic `<button>`, disabled and loading states, focus-visible outline, token colors, and reduced-motion-safe active state.

Content/feature component:

- File: `src/features/books/merchandising-layouts.tsx`
- `EditorialFeatureShelf` gives one selected book stronger visual weight, then places supporting editions in compact tiles.

Asymmetrical section:

- File: `src/app/page.tsx`
- Homepage hero uses an editorial column beside a proof column of actual book covers and sellable editions.

Responsive component:

- File: `src/app/catalog/page.tsx`
- Catalog filters stack on mobile and become dense columns on desktop without horizontal overflow.

Interaction:

- File: `src/components/layout/mobile-navigation.tsx`
- Semantic menu button, accessible labels, close-on-navigation behavior, keyboard focus styles.

Discovery/header interaction:

- File: `src/components/layout/site-header.tsx`
- Search-first desktop header, data-backed category menu, and utility links for
  support/tracking without exposing admin as public retail navigation.

Long-page helper:

- File: `src/components/layout/back-to-top-button.tsx`
- Appears only after scroll, has a clear accessible name, and respects reduced
  motion when scrolling back to the top.

## 15. Anti-Patterns

Do not use:

- Centered sections by default.
- Three identical feature cards for every idea.
- Gradient text as brand identity.
- Glowing blobs or generic AI backgrounds.
- Glassmorphism except restrained sticky-header context.
- Pill-shaped everything.
- Oversized rounded rectangles.
- Icon circles for every small label.
- Giant empty hero areas.
- Generic startup claims.
- Fake social proof.
- Excessive animation.
- Arbitrary rotations.
- Random spacing values.
- New dependencies for simple visual polish.
- Duplicated utility clusters when a shared component exists.
- Public UI copy that exposes implementation details.
- Unverified external cover URLs, scraped commercial covers, or generated
  covers presented as official publisher artwork.
