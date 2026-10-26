# CL3 — Architecture Cleanup closure (NO DELETIONS)

**Input:** `e-pharmacy-14-20-19.zip` — the latest archive supplied after CL2.
**Local evidence:** `Вставлений текст(20261026-202412).txt`, supplied alongside that archive.
**Decision:** **CLOSE CL1–CL3 WITHOUT DELETING OR MOVING ANY SCRIPT.** No separate approval or equivalent replacement for historical relocation tests was provided, and the dependency audit does not identify an orphaned tool.

## Current source state (confirmed against the supplied ZIP)

| Invariant | Verified |
| --- | ---: |
| Pinned CL1 historical scripts | 46/46 present |
| CL2 added checker and test | 2/2 present |
| Current `scripts/architecture/**/*.mjs` files | **48** |
| Current files named directly by root `package.json` scripts | **47** |
| Remaining module used internally (G0 shared core) | **1** |
| Approved old file deletions | **0** |
| New flat proxies or staged file relocations | **0** |

The original 46-file CL1 inventory (`SCRIPT-RETENTION-INVENTORY.json`) is intentionally **not rebased**. The added CL2 pair has its own lifecycle. A per-path classification for all 48 files is in [`CL3-RETENTION-MATRIX.json`](./CL3-RETENTION-MATRIX.json). A direct command reference or importer proves a dependency exists; it does **not** mean no future alternative design could replace the file.

## Local gate confirmation

The supplied full log ends with `PASS: check:architecture:final` and contains **30 `G6 PASS:` records, zero `G6 FAIL:` records**. It also reports:

- CL2: **PASS**, five protected roots, **141** inspected command dependencies and three historical write-capable relocation entrypoints; **12/12** CL2 tests passed.
- Cross-folder Final: **PASS** with nine audited areas and **11/11** final tests passed.
- A1–A9 and architecture-layout checks/tests: **PASS** within the full final command.
- G6 source, lint, type-check, tests, integration, builds and deployment-source-archive pipeline: **30/30 PASS**.
- Deployment source ZIP: **2,686 verified entries**.

These are results from the **user's local workspace before this documentation-only CL3 patch**. The current turn does not claim a new full local Gate run.

## Explicit retention decision

**KEEP:** audit and domain checkers, regression tests, G6 runner, immutable manifests, snapshot tool, historical relocation implementations and their negative `--apply`/`--dry-run` tests. They remain referenced by root commands, imports or historical CI/Gate evidence. The three write-capable CLI entrypoints are protected against *Gate reachability* by CL2; this does **not** disable manual invocation.

**DELETE:** nothing. No `DELETE-PATHS.txt` is created. Do not remove the 46 baseline files, the two CL2 files or any manifest based solely on their age or on passing builds. This is the final closure of the requested **architecture tooling cleanup**, not authorization to remove history.

## Deferred independent work (not blocking closure)

1. To retire an original relocator, propose a per-path replacement that retains identical historical fingerprints, CLI contracts, read-only verification and negative regression coverage; request separate approval, then re-run the complete local gate before deletion.
2. Improve safety of demo seed and data migrations using explicit DB identity guards, backups and replay/rollback rehearsals. Do not invoke them as audit tests.
3. Review overlapping slug-ID and working-hours helpers only with behavioral parity and public API compatibility tests.
4. Test transaction and role/membership behavior with database-backed integration scenarios, independently of static architectural checks.

**Patch scope:** documentation only. No source, CLI command, migration, Mongoose schema, controller, immutable test baseline or production behavior is modified.
