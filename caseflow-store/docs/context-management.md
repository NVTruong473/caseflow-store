# Context Management Protocol

## Purpose

This project is intended to be continued across multiple AI sessions. Context must be stored in files, not only in chat history.

## Source Of Truth Hierarchy

1. Actual repository files
2. Git status and Git diff
3. Terminal output from executed commands
4. `.agent/step-results.md`
5. `.agent/todo-roadmap.md`
6. `.agent/project-context.md`
7. Prior chat summaries

The `.agent` files guide the work, but they can be stale. Always verify against the repository.

## Required Files

### `.agent/todo-roadmap.md`

Tracks:

- Current phase
- Current day
- Current task
- 20-day roadmap
- Task statuses
- Commands
- Acceptance criteria
- 30 journal entries

### `.agent/project-context.md`

Tracks:

- Scope
- Stack
- Architecture
- Domain model
- API contract
- Security rules
- UI rules
- Testing gates
- Risks
- Current structure

### `.agent/step-results.md`

Tracks evidence:

- Commands actually run
- Files created/changed
- Test results
- Errors
- Decisions
- Remaining blockers
- Next task

## Before Every Task

1. Read `AGENTS.md`.
2. Read `.agent/project-context.md`.
3. Read `.agent/todo-roadmap.md`.
4. Read the latest entry in `.agent/step-results.md`.
5. Check `git status --short`.
6. Check actual files with `rg --files`.
7. Confirm the active task ID.

## During Every Task

- Work on one task ID only.
- Keep changes scoped.
- Do not silently change stack or scope.
- Prefer small verifiable steps.
- Record commands as they are run.

## After Every Task

Update:

- `.agent/todo-roadmap.md` for status changes.
- `.agent/project-context.md` if scope, structure, API, database, or rules changed.
- `.agent/step-results.md` with evidence.

Do not mark `[x]` unless the acceptance criteria were actually checked.

## Context Drift Checks

If a mismatch appears:

- File says endpoint exists but code does not: mark the task incomplete.
- File says test passed but no output exists: mark evidence missing.
- Roadmap says a task is current but Git diff shows unrelated work: stop and reconcile.
- User changes files during the task: work with those changes, do not revert them.

## Next Task Rule

Every session should end with exactly one next task. Avoid offering multiple competing next steps unless the user explicitly asks to choose direction.
