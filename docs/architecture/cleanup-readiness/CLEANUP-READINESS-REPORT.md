# Architecture Cleanup — readiness assessment

**Input:** `e-pharmacy-14-20-18.zip` (the user's latest complete project archive).  
**Evidence:** local `check:architecture:final` completed successfully; the nested `check:grouping-g6:full` reported **30/30 PASS**. The generated deployment source archive contained **2,677 verified entries**.  
**Current decision:** **NO DELETIONS**. This is a dependency and cleanup-readiness stage, not a claim that legacy migration files are already obsolete.

## What was measured

The `scripts/architecture/` tree contains **46 `.mjs` files** in logical subfolders. **45** are referenced by at least one command in the root `package.json`. The remaining file, `grouping/g0/api-grouping-g0-core.mjs`, is a shared implementation referenced from other architecture scripts. No script meets the strict rule "no command or internal references" for an immediate deletion.

Group inventory:

| Subfolder | Files |
| --- | ---: |
| `audits` | 6 |
| `constants` | 2 |
| `final` | 2 |
| `grouping` | 17 |
| `maintenance` | 2 |
| `models` | 4 |
| `schemas` | 2 |
| `scripts` | 2 |
| `services` | 3 |
| `transport` | 2 |
| `types` | 2 |
| `utils` | 2 |
| **Total** | **46** |

The machine-readable per-file inventory is [`SCRIPT-RETENTION-INVENTORY.json`](./SCRIPT-RETENTION-INVENTORY.json). Its `otherArchitectureFileMentions` are **literal basename references**, not a complete dynamic import graph; do not treat those counts as proof of execution or as permission to delete.

## Dependencies that block deleting relocation code

- Historical G1–G5 commands use `relocate-api-grouping-g*.mjs --check`. Their tests intentionally cover dry-run, apply, initial and completed states, immutable hashes, and absence of proxies.
- Historical S1 and Transport C1–C6 check/test commands call their original relocation implementations in check mode. Removing those implementations would break established contracts.
- `grouping/g6/run-api-grouping-g6-gates.mjs` coordinates historical checks and the full 30-command source / lint / typing / tests / build / archive gate.
- Root `check:architecture:final` and `check:before-deploy:staged` depend on canonical A1–A9 and final check/test commands. Reorganizing or deleting those files without explicit path migration breaks deployment.
- `services/snapshot-services-s0.mjs` still has its documented root baseline-check command. Even though it is not on the new daily gate path, it is not orphaned.
- Historical G0–G6 JSON manifests and pinned hashes are evidence artifacts. They are *not* disposable generated cache.

## Safety findings

The historic `grouping:relocate`, `services:relocate`, `transport:relocate` entrypoints are **write-capable**, while the regular `check:*` commands are for read-only verification. Do not execute `--apply` or historical migrations as part of cleanup. There is no reason to touch Mongoose schemas, Mongo data, routes or production utilities in this stage.

The original repository README already warns that seeds and domain migrations may be destructive. Cleanup must never run them.

## Gate for this assessment

- Current full audit and G6 gate: **PASS, evidenced by supplied local log**.
- Inventory completeness: **46/46 files exist** in the user's new source archive.
- Direct root command references: **45/46**; remaining shared core referenced internally.
- Removed or moved source files: **0**.
- Root package scripts or historical hashes changed: **0**.
- This documentation-only delta does not claim a newly run full G6 after it is applied; rerun locally when publishing changes.

## CL3 close-out (2026-10-26)

The later `e-pharmacy-14-20-19.zip` contains all **46** pinned CL1 files and
**two new CL2** checker/test modules, for **48** architecture JavaScript files.
The final local `check:architecture:final` passed (**G6 30/30**, 2,686 deployment
ZIP entries). No legacy file became unreferenced or explicitly authorized for
retirement. The 46-path inventory above is preserved unchanged; current per-file
status and the **NO DELETIONS** decision are recorded in
[`CL3-CLOSURE-REPORT.md`](./CL3-CLOSURE-REPORT.md).
