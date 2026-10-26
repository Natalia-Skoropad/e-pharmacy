# Stage A5 — Gate Report

Executed against a copy of `e-pharmacy-14-20-12.zip` with the A5 additions and architecture-tooling relocation applied.

| Gate | Result |
|---|---|
| `check:constants-a5` | PASS, 35 files, 147 exports, no contract errors |
| `test:constants-a5` | PASS, **10/10** read-only/in-memory tests |
| `check:architecture-layout` | PASS, 32 relocations; old scripts absent in verification copy |
| `test:architecture-layout` | PASS, **5/5** tests |
| G6 `--history` | PASS **18/18** historical commands (G1–G6, M1, Services S1, Transport C1) |
| A1 and A2 checker/tests | PASS |
| A3 and A4 checker/tests | PASS |
| `check-api-package-boundaries.mjs` | PASS (476 backend source files) |
| `check-next-api-routes.mjs` | PASS (89 BFF routes, 110 handlers) |
| `check-config-contracts.mjs` | PASS |
| Full 30-command G6 (`check:grouping-g6:full`) | **Not run in this container**; must be run locally after applying and deleting the old scripts |

**Immutable contracts:** G0–G6, M1, S1 and Transport manifests and the canonical backend constant source hashes were not rebased. Two new test imports are enumerated separately in `docs/architecture/scripts-reorganization/approved-relative-imports.json` and verified by the historical tests.

**Required installation detail:** a ZIP overlay cannot delete moved source files. Once new canonical files are extracted, delete the 32 original files enumerated in `docs/architecture/scripts-reorganization/DELETE-PATHS.txt` using `git rm`, then run the layout checker. Failure to delete them will intentionally fail `check:architecture-layout`.
