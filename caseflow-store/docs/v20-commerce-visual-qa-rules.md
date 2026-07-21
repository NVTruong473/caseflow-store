# V20 Commerce Visual QA Rules

- Task: `UAT-MANUAL-T01` follow-up visual polish
- Status: draft for implementation verification
- Date: 2026-07-21

## Reference Read

This pass uses references as principles, not as templates to clone.

- Fahasa: dense retail navigation, strong red commerce accent, clear category
  entry points, visible price/offer/stock signals.
- Project Gutenberg: book-cover-led shelves, simple library structure,
  straightforward search and category access.
- XCODI: strong brand contrast, compact header actions, decisive primary
  action treatment.

Fahasa browser automation can return anti-bot pages, so visual rules are based
on accessible HTML structure plus previously captured user screenshots rather
than scraping protected runtime assets.

## 0.1% Tester Rules

1. **Cover Cohesion Rule**: real book covers may vary wildly in color, but every
   cover must sit inside a consistent retail shelf/display surface.
2. **Retail Accent Rule**: primary CTAs, header emphasis, search submit, and
   purchase price may use one retail red accent; trust, stock, and admin states
   keep semantic colors.
3. **No Card Soup Rule**: repeated product cards are valid; ordinary section
   copy should use bands, rails, ledgers, or open layout instead of another
   generic card.
4. **Commercial Density Rule**: homepage and catalog must show search,
   category entry, price, stock, language, and checkout path without forcing a
   first-time buyer to infer the next step.
5. **Bilingual Stability Rule**: Vietnamese/English text must not force narrow
   vertical fragments, clipped labels, or overlapping badges at 375px.
6. **Production Honesty Rule**: production must not render QR simulation
   controls or imply real settlement. A locked QR demo is acceptable.
7. **Focus/Keyboard Rule**: every newly emphasized action still needs visible
   focus, semantic link/button behavior, and no hover-only affordance.
8. **Reference Discipline Rule**: do not copy logos, claims, testimonials,
   live product images from protected retailers, or proprietary page structure.

## Render Template

Required screenshots:

- `/` at 1440x950 and 375x812.
- `/catalog` at 1440x950 and 375x812.
- A real-cover product detail page at 1440x950 and 375x812.
- `/account/orders` for the UAT customer at 375x812 when available.

Required assertions:

- No horizontal overflow.
- Header search and primary CTA visible on desktop.
- Mobile menu reachable.
- Catalog result count remains horizontal.
- Detail price does not overflow.
- Real covers load from local `/images/books/gutenberg-covers/` when available.
- Production QR simulate control is absent.

## Current Findings Before Patch

- The old paper/teal palette was coherent with generated covers but too quiet
  for varied real covers.
- Real covers introduced red, black, green, yellow, and purple without a strong
  page-level anchor, making sections feel unrelated.
- Header and hero felt functional but not retail-branded enough.
- Catalog had good filters, but the filter/result panels looked like generic
  form cards instead of a bookstore selling surface.
- Product detail cover and price rail used different moods, especially visible
  with high-saturation Project Gutenberg covers.

## Patch Direction

- Move primary customer-facing commerce accent to restrained retail red.
- Keep green/trust colors for stock, support, and safe-state messaging.
- Use warm paper, ledger, and shelf surfaces to absorb cover color variety.
- Strengthen header/search/CTA as the retail identity anchor.
- Keep all business logic, routes, auth, checkout, and QR production lock
  unchanged.
