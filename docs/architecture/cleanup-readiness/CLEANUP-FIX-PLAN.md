# Architecture Cleanup — safe execution plan

**Decision at this checkpoint:** Retain the 46 architecture scripts and pinned G0–G6/M1/S1/C1 evidence. The local full Gate is green, but a green build is not evidence that any specific historical tool is unused in maintenance or CI.

## CL1 — Freeze & classify (completed)

- Inventory every `scripts/architecture/**/*.mjs` file, its direct root `package.json` commands and literal references by architecture peers.
- Classify historical relocation, baseline capture, stage checkers, regression tests, and the final Gate runner.
- Establish that **zero immediate script deletions** are justified by the current archive.

## CL2 — Reduce write-capable surface (future separate change)

- Review `grouping:relocate`, `services:relocate`, `transport:relocate` and historical `--apply` entrypoints with the maintainer.
- If decommissioning interactive relocation is desired, first implement **read-only replacement checkers** preserving *all* historical manifests, integrity checks and negative tests. Do not simply delete the code and weaken G6.
- Remove a root command and its tool only together with its consumers, documentation references and a tested replacement. Never leave proxy re-export files.

## CL3 — Deletion-only changes (only after CL2 Gate passes)

- Prepare a per-path `DELETE-PATHS.txt` **only for paths proven unreachable** from `package.json`, CI, docs and other scripts, or explicitly superseded by accepted replacements.
- Prefer small batches by historical stage with a before/after audit of CLI flags, fingerprints, relative imports, public API and test counts.
- Review `git diff --name-status` and `git diff --check`; run all tests, G6 history and `pnpm check:architecture:final` in the real workspace.
- If any test fails, restore deleted files; do not bypass historical tests or silently update baseline hashes.

## CL4 — Optional functional debt (independent feature work)

- Confirm 401/403 behavior of no-user controller branches with Express middleware and role/membership integration tests.
- Create DB-backed rollback and idempotency tests for operations requiring transactions.
- Consolidate slug-ID / working-hours implementations only after public-export, behavior and fingerprint review.
- Guard destructive demo seeds and migration invocation with explicit database identity checks and rehearsals.

**Not an approved change in this stage:** deleting historical checks or evidence, weakening `check:architecture:final`, modifying production data or performing `--apply` relocation.
