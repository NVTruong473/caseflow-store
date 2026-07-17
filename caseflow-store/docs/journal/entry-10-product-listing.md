# Entry 10 - Product Listing

Type: real implementation journal entry.

## Goal

Build a usable product grid with filtering, search, sorting, and non-happy-path states.

## Work Completed

Reusable product visual, card, and grid components were added. The homepage rendered all 16 products in a responsive grid. The catalog then gained category filtering, search, basic sort controls, clear search behavior, and accessible filter count labels.

Loading, empty, and error states were added with a noindex preview route for visual QA. Disabled control behavior was included so unavailable catalog states did not leave misleading interactions active.

## Evidence

- Product grid rendered 16 products.
- Category filter interaction checks passed.
- Search and sorting interaction checks passed.
- Loading, empty, and error screenshots were captured at desktop and mobile widths.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build`: passed.

## Lesson

Product listing quality is mostly about recovery and narrowing, not just cards. Empty states, clear filters, and stable layouts mattered as much as the first successful render.
