# Agent Rules

## Current Gate

Implementation is confirmed as of 2026-07-14.

Feature freeze is active as of 2026-07-15 after `D12-T05`.

Integration freeze is active as of 2026-07-15 after `D16-T05`.

Continue the roadmap one task ID at a time. Do not initialize the application, run `create-next-app`, add dependencies, create database resources, deploy, or implement features unless the current roadmap task explicitly requires it and its prerequisites have passed.

After feature freeze, do not add new user-facing features outside the existing roadmap. Only fixes, integration work, deployment work, tests, documentation, and explicitly approved roadmap changes are allowed.

After integration freeze, do not change runtime integration boundaries or the stable API error contract except for verified release-blocking fixes.

## Required Stance

- Think critically. Identify missing data, weak assumptions, hidden bias, and risks in the user's request.
- Be direct, respectful, and constructive.
- Prefer evidence over optimism. Do not mark work as complete without command output, file changes, or verified results.
- Keep the project honest: 20 real implementation days plus 10 retrospective journal entries, not a fake 30-day development history.

## Required Reading Before Any Task

1. `AGENTS.md`
2. `.agent/project-context.md`
3. `.agent/todo-roadmap.md`
4. Latest entry in `.agent/step-results.md`
5. `DESIGN.md` before UI work
6. `docs/architecture.md` before architecture, API, database, auth, or deployment changes
7. Relevant ADR in `docs/adr/` before changing a major decision

The `.agent` files are not absolute truth. Always compare them with the actual files, terminal output, and Git status.

## Execution Rules

- Work on exactly one task ID at a time.
- Do not expand scope without an explicit ADR and user approval.
- Do not change the selected stack unless there is a blocking reason and a new ADR.
- Prefer the existing roadmap, structure, and local conventions.
- Use `rg` or `rg --files` for searching.
- Use `apply_patch` for manual file edits.
- Do not revert user changes unless the user explicitly asks.

## Engineering Rules

- Use a Next.js modular monolith unless an ADR supersedes this decision.
- UI and Route Handlers live in one application.
- Cart is local for the MVP; do not create a cart table unless the roadmap changes.
- Server must recalculate product prices and totals.
- Do not trust price, subtotal, stock, user role, or order status from the browser.
- Admin authorization must be checked on the server/API, not only in the UI.
- Do not put server secrets in `NEXT_PUBLIC_*` variables or Client Components.
- Validate all mutating request bodies on the server.

## Quality Rules

- Every task needs acceptance criteria.
- Run the smallest meaningful verification for the task.
- For code tasks, run `npm run lint`; for larger changes, also run `npm run build`.
- From the E2E phase onward, run Playwright for affected flows.
- Update `.agent/todo-roadmap.md`, `.agent/project-context.md`, and `.agent/step-results.md` after each task when relevant.
