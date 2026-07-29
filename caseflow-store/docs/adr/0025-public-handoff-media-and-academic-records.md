# ADR-0025: Public Handoff, Introductory Media, And Academic Records

- Status: Accepted
- Date: 2026-07-29
- Decision owner: CaseFlow Books
- Release target: post-`v1.17.0` handoff

## Context

The verified `v1.17.0` showroom already has a four-minute production
walkthrough and a separate academic report package. The next handoff needs
three outputs with different audiences and disclosure boundaries:

1. a lightweight introductory video entry point on the storefront;
2. a clean, runnable public source export;
3. printable academic report and worklog files.

Putting all three into one repository would expose internal working material,
make the public source unnecessarily large, and contradict the requirement
that the public export contain exactly one Markdown document.

## Decision

### Storefront media

The existing local H.264/AAC walkthrough will be copied into a runtime media
directory and opened from the homepage introduction through an accessible,
user-initiated dialog. It will not autoplay. The player will use a poster,
native controls, a Vietnamese WebVTT caption track, focus management, Escape
handling, reduced-motion-safe styling, and responsive geometry.

The video is not embedded into the Word or PDF report. The printable report may
refer to the deployed storefront, but its evidence remains static text,
diagrams, and selected screenshots.

### Public export

`dist-public/` is a generated sibling of the development application. It is
not a replacement for, or destructive cleanup of, the working repository.
The export uses an allowlist and contains only runnable source, runtime assets,
database schema/migrations/seed, build configuration, dependency manifests,
safe environment template, `LICENSE`, and `README.md`.

`README.md` is the only Markdown file in the export. Internal roadmaps, ADRs,
agent state, portfolio evidence, tests, prompts, notes, local environments,
credentials, caches, build artifacts, and machine-specific paths are excluded.

### Academic records

The report and four-week worklog remain under
`project-documentation-output/final/`, outside `dist-public/`. The worklog
covers 01/07/2026 through 28/07/2026 as four consecutive seven-day periods,
excludes Sundays, includes Saturdays, and records 24 days at five hours per
day. This preserves the 120-hour total without claiming 24 feature-development
days: implementation, QA, documentation, and handoff are distinguished.

Final DOCX files must retain editable OOXML equations, standard page geometry,
the provided TDTU visual identity, and signature placeholders or supplied
signature assets. Final PDFs are rendered from the checked DOCX files.
Incidental application metadata is normalized without removing required
student identity from visible report content.

## Guardrails

- No working-repository file is removed to create the public export.
- No local secret or `.env.local` value is copied.
- No AI, prompt, agent, or internal-process file appears in `dist-public/`.
- No unsupported company, payment, shipping, revenue, customer, or operational
  claim is added to the report or README.
- The public license remains proprietary unless the owner explicitly chooses a
  different license.
- Video playback is opt-in and must not delay first-page interaction.
- Report validation and application validation are separate gates.

## Verification

- Homepage video dialog: desktop/mobile Playwright, keyboard, focus, captions,
  media response, overflow, console, lint, typecheck, and production build.
- Academic files: OOXML parse, equation count, metadata audit, DOCX render,
  PDF render, page/image inspection, date/hour reconciliation, and placeholder
  scan.
- Public export: clean install, lint, typecheck, production build, file allowlist,
  Markdown count, secret/path scan, and clean-environment startup smoke.
- Docker is reported as not applicable when the repository has no Dockerfile
  or Compose configuration; it is not fabricated for this handoff.
