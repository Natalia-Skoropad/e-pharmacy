# Architecture Cleanup — safe execution plan

**Final CL3 decision (2026-10-26):** Retain the 46 CL1-baseline scripts **plus two new CL2 safety files**, and preserve pinned G0–G6/M1/S1/C1 evidence. The user's local final architecture Gate is **PASS (G6 30/30)**. Passing builds are not evidence that historical tools can be removed.

## CL1 — Freeze & classify (completed)

- Inventory every `scripts/architecture/**/*.mjs` file, its direct root `package.json` commands and literal references by architecture peers.
- Classify historical relocation, baseline capture, stage checkers, regression tests, and the final Gate runner.
- Establish that **zero immediate script deletions** are justified by the current archive.

## CL2 — Guard the checked command surface (completed and locally verified)

- **Implemented:** add a read-only dependency-graph checker and 12 negative/positive tests. Prepend them to the final, staged-deploy and legacy pre-deploy commands. Keep all original relocation entrypoints unchanged and unreachable from these protected gates.
- **Verified locally:** CL2 **12/12 tests**, five protected roots and 141 checked commands; final G6 **30/30 PASS**. Decommissioning manual `grouping:relocate`, `services:relocate`, `transport:relocate` / `--apply` entrypoints still requires separate maintainer authorization and replacement behavioral checks.
- If decommissioning interactive relocation is desired, first implement **read-only replacement checkers** preserving *all* historical manifests, integrity checks and negative tests. Do not simply delete the code and weaken G6.
- Remove a root command and its tool only together with its consumers, documentation references and a tested replacement. Never leave proxy re-export files.

## CL3 — Deletion decision (completed: zero approved deletions)

- **CL3 outcome:** all 48 current files remain referenced, including the two CL2 additions; no path meets the deletion-approval criteria. See [`CL3-RETENTION-MATRIX.json`](./CL3-RETENTION-MATRIX.json). Do not create an empty or speculative `DELETE-PATHS.txt`.
- **Only for a separately approved future retirement:** prefer small batches by historical stage with a before/after audit of CLI flags, fingerprints, relative imports, public API and test counts.
- For any future deletion, review `git diff --name-status` and `git diff --check`; run all tests, G6 history and `pnpm check:architecture:final` in the real workspace.
- If any future deletion test fails, restore deleted files; do not bypass historical tests or silently update baseline hashes.

## CL4 — Optional functional debt (independent feature work)

- Confirm 401/403 behavior of no-user controller branches with Express middleware and role/membership integration tests.
- Create DB-backed rollback and idempotency tests for operations requiring transactions.
- Consolidate slug-ID / working-hours implementations only after public-export, behavior and fingerprint review.
- Guard destructive demo seeds and migration invocation with explicit database identity checks and rehearsals.

**Not an approved change in this stage:** deleting historical checks or evidence, weakening `check:architecture:final`, modifying production data or performing `--apply` relocation.
