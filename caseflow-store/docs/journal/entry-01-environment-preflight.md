# Entry 01 - Environment Preflight

Type: real implementation journal entry.

## Goal

Verify that the local machine could support a Next.js build before initializing the application.

## Work Completed

The first preflight found a real blocker: `node`, `npm`, and `npx` were not available in the shell PATH. Git was available as `git version 2.37.1 (Apple Git-137.1)`. Homebrew existed, but `brew install node` was not a clean path on this macOS 12 machine. It attempted large source builds and failed while installing an `llvm` dependency.

The environment was unblocked by downloading the official Node.js LTS binary for `darwin-x64`, verifying it against the Node.js checksum file, extracting it under `/usr/local/lib/nodejs`, and symlinking `node`, `npm`, and `npx` into `/usr/local/bin`.

## Evidence

- Initial `node -v`, `npm -v`, and `npx --version` failed.
- Final `node -v`: `v24.18.0`.
- Final `npm -v` and `npx --version`: `11.16.0`.
- Git remained available throughout.

## Lesson

Environment preflight was not ceremony. It prevented a false start and exposed that Homebrew was risky on this host. The safer future assumption is to reuse the verified official Node.js install unless the user explicitly wants to repair Homebrew.
