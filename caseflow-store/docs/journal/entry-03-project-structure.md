# Entry 03 - Project Structure

Type: real implementation journal entry.

## Goal

Make the nested app maintainable for future AI sessions and for normal project work.

## Work Completed

The root project management files were copied into `caseflow-store/` so future sessions could operate safely from either the repository root or the app directory. The generated app-level `AGENTS.md` was replaced with the project-specific rules, and `CLAUDE.md` remained only as a pointer.

The planned source folders were created under `caseflow-store/src`: `components`, `features`, `lib`, `data`, and `types`. Supporting folders `supabase` and `tests` were also created. `.gitkeep` files preserved empty directories until real implementation files replaced them.

The environment template was added as `.env.example`, while `.env.local` was verified as ignored.

## Evidence

- Root and app-level `AGENTS.md`, `DESIGN.md`, docs, ADRs, and `.agent` files existed.
- `.env.local` was ignored.
- `.env.example` was not ignored.
- Day 2 `npm run lint && npm run build`: passed.

## Lesson

The nested app structure could easily have split the source of truth. Mirroring the project rules early reduced the chance that later sessions would ignore the roadmap, security boundaries, or freeze gates.
