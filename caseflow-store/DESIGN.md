---
name: CaseFlow Store Design System
version: 0.1.0
status: draft
project: CaseFlow Store
purpose: Keep UI decisions stable across AI coding sessions
tokens:
  colors:
    background: "#FBFAF7"
    surface: "#FFFDF8"
    surfaceMuted: "#EEF2EB"
    text: "#1F1B16"
    textMuted: "#6F665C"
    border: "#D8D2C7"
    primary: "#176B5B"
    primaryHover: "#0F5146"
    accent: "#B7791F"
    editorial: "#8F2440"
    editorialMuted: "#F8E6EC"
    discovery: "#176B5B"
    discoveryMuted: "#E4F2ED"
    offer: "#B7791F"
    offerMuted: "#FFF3D6"
    translation: "#B04436"
    translationMuted: "#FBE6DF"
    academic: "#2F5D8C"
    academicMuted: "#E4ECF6"
    trust: "#2D6E62"
    trustMuted: "#E1F0EB"
    arrival: "#6A5D2F"
    arrivalMuted: "#F1ECD8"
    admin: "#243247"
    adminMuted: "#E7EDF3"
    operations: "#364152"
    operationsMuted: "#E8EDF2"
    paper: "#FBFAF7"
    paperDeep: "#EADCC6"
    ink: "#1F1B16"
    success: "#247857"
    warning: "#A16207"
    error: "#B42318"
  radius:
    sm: "4px"
    md: "6px"
    lg: "8px"
  spacing:
    xs: "4px"
    sm: "8px"
    md: "16px"
    lg: "24px"
    xl: "32px"
    "2xl": "48px"
  typography:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    bodySize: "16px"
    smallSize: "14px"
    h1Size: "40px"
    h2Size: "28px"
    h3Size: "20px"
---

# CaseFlow Store Design System

## Design Goal

CaseFlow Books should feel like a practical specialist bookstore and small-business commerce system, not a decorative landing page. The UI should be clear, responsive, fast to scan, and useful for demonstrating full-stack engineering quality.

## Visual Direction

- Clean, commerce-focused, and book-led.
- Mobile-first with a strong desktop layout.
- Book covers, edition metadata, and merchandising shelves are the main visual signal.
- Use a balanced bookstore palette: warm paper/ink foundations, moss/teal for discovery, wine for editorial emphasis, amber for offers, and navy for admin trust surfaces.
- For v1.4 merchandising variety, use role-based accents rather than recoloring one repeated card: clay red for translation pairs, ink blue for academic/classic detail, muted teal for trust and service surfaces, olive for new-arrival/reading-path surfaces, amber only for real offers, and graphite/navy for operations.
- Avoid overly decorative gradients, floating blobs, oversized hero cards, or animation-heavy UI.
- Use restrained polish: consistent spacing, clear hierarchy, good focus states, stable layouts, and visible cover density.
- Avoid one-note blue/slate, beige-only, purple-gradient, or random one-off color systems.

## Layout Rules

- Mobile baseline: `375px`.
- Desktop baseline: `1440px`.
- Main content should use a constrained max width.
- Product grid must not overflow horizontally.
- Book cover containers must use stable cover ratios, preferably `2 / 3`; non-book operational thumbnails may use `1 / 1`.
- Do not place cards inside cards.
- Use cards only for repeated product/order items, modals, and framed tools.
- Admin table on mobile should become compact cards or intentional horizontal scroll.

## Component Rules

### Buttons

- Primary action: moss/teal background, white text.
- Secondary action: white background, border.
- Destructive action: error color.
- Every button must have hover, focus, disabled, and loading states when relevant.
- Icon buttons need accessible labels.

### Inputs

- Every input must have a visible label.
- Error text must be close to the input.
- Invalid fields must be identifiable without relying on color alone.

### Product Cards

- Image first, then name, price, category, and action.
- Product cards must remain stable when loading images.
- Do not put long marketing copy inside product cards.
- Cards should use cover art, language/format chips, price clarity, and one primary action.
- v1.4 card variants must differ by structure and information hierarchy, not only color. Acceptable variants include compact search rows, retail grid cards, editorial feature panels, translation pair comparisons, deal strips, and admin quality cards.

### Cart Drawer

- Must be keyboard usable.
- Must have a clear close button.
- Empty cart state must be explicit.
- Quantity controls must prevent invalid values.

### Admin UI

- Dense but readable.
- Prioritize status, customer, total, and created date.
- Use admin trust colors for operational surfaces, but keep dense tables and task flows more important than decoration.

## Accessibility Rules

- Use semantic buttons and links.
- Use labels for all form fields.
- Use focus-visible styles.
- Do not use color as the only status indicator.
- Prefer Playwright selectors by role, label, or accessible name.

## Implementation Rules

- Map tokens into `src/app/globals.css` when the app exists.
- Components should use shared tokens or Tailwind theme values, not random one-off colors.
- Read this file before changing component colors, typography, radius, spacing, or layout.
- Any new visual polish must preserve existing routes, checkout/auth boundaries, server-side validation, and content provenance guardrails.
