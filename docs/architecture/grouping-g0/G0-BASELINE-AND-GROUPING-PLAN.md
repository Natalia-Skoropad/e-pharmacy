# API Source Grouping — G0 Baseline & Inventory

Snapshot source: **`e-pharmacy-14-20-4.zip`** (nested `apps.zip` → `api.zip`).
Scope: **`apps/api/src/{constants,schemas,scripts,types,utils}/`** only.

## Scope and non-goals

G0 is a **read-only inventory and architecture planning stage**. It does not relocate any file, change a source import, alter an endpoint, amend validation, run a migration, or remove a duplicate. Services S1, Models M1, and Transport C1–C6 are already completed in the snapshot; do not relocate them again.

| Folder | Files | Stage | Planned moves | Stable files |
|---|---:|---|---:|---:|
| `constants` | 35 | G1 | 35 | 0 |
| `schemas` | 50 | G2 | 38 | 12 |
| `scripts` | 14 | G3 | 14 | 0 |
| `types` | 23 | G4 | 23 | 0 |
| `utils` | 31 | G5 | 30 | 1 |
| **Total** | **153** | | **140** | **13** |

*Stable files* are the 12 files already under `schemas/{shared,contracts}` and `utils/validation/working-hours.ts`. These paths must not be modified unnecessarily. The existing `schemas/shared/index.ts` is an intentional shared schema API; do not replace it with an empty proxy.

## Versioned artifacts

- `source-inventory.json`: **153** exact files; folder, stage, test/fixture/source classification, byte length, raw SHA-256 and formatting-tolerant SHA-256.
- `relocation-plan.json`: **153** explicit, unique `from → to` records, organized by G1–G5. All 140 moves are proposals, not executed writes.
- `dependency-baseline.json`: full captured import references from the tracked folders and imports to them, relative import diagnostics, literal source-path references, and the actual baseline API import-cycle graph.
- `script-entrypoints.json`: 14 operational command-to-entrypoint references in the API's `package.json`, with existing executable strings retained.
- `source-check-results.json`: checks actually executed on the unpacked current archive.

`relocation-plan.json` is the **proposed routing plan**, not approval to rewrite schemas or modify source code. Confirm domain ownership before each relocation stage; any proposed target change should be reviewed before applying a move and reflected in the stage's testable manifest rather than changed silently.

## Current dependency baseline

Captured by `api-grouping-g0-core.mjs`, with `node:fs`/`node:path` and no application runtime dependencies:

- 2,097 existing code files scanned (baseline excludes the newly introduced G0 checker/test implementation itself).
- 1,111 import occurrences where the importing file or resolved target belongs to the grouping scope.
- **917** imports resolving directly **into** one of the five folders.
- **0** unresolved tracked relative imports.
- 50 explicit source-path string references (e.g. `src/types/...`); available with file/line references in the JSON report.
- 1,706 relative edges in the API import graph; **0** strongly connected cyclic components.
- 14 API command references to files under `src/scripts/`.

This is a baseline of known machine-resolvable references, not a proof that there are no dynamically assembled paths: filesystem paths produced from `dirname`, `process.cwd`, `path.join`, interpolated names, and `new URL` require targeted inspection in G1–G5. Do not treat raw regex reference coverage as a substitute for full unit/integration/build gates.

## Mandatory stage order and rules

1. **G1 Constants:** move only `constants` modules and their tests/fixtures; rewrite *all* consumers including static inspection scripts and UI tests; preserve literal constants, enums, copy, error codes, and values.
2. **G2 Schemas:** relocate schema and co-located contract tests; preserve Zod validation, strict parsing, default/null semantics, shared API and mirrored package validation cases.
3. **G3 Scripts:** relocate execution scripts with explicit command rewrites, maintain public pnpm command names, cwd behavior, `__dirname` resolution and migrations' read-only/dry-run/idempotency; **do not execute migrations in a checking script**.
4. **G4 Types:** relocate API-only types including Express module augmentation; retain TypeScript global declaration inclusion, DTO parity and cross-app static test references.
5. **G5 Utils:** relocate shared helpers while keeping exception behaviors, logging, cookie/token handling and existing public signatures intact.
6. **G6 Final Gate:** entire repository's source checks, lint, type-check, unit, react, integration, build and deployment archive, plus M1/S1/C1–C6 gates.

Each G1–G5 stage must have separate `--dry-run`, `--apply`, and `--check` behavior and be committed independently. A stage must be read-only until explicitly applied, refuse stale/unknown input and collision paths, update all required references, and **never create old-path proxies/barrels**. Existing documented public `index.ts` entrypoints can remain if they own a real public contract.

The G0 read-only checker intentionally targets the **pre-G1 source tree only**. When G1 begins, create a staged relocation gate that validates both canonical-source parity and the new paths; do **not** weaken the G0 checker or rewrite its baseline hashes to make moved files look unchanged. G0 may stop passing *after* legitimate G1 moves; that is expected.

## High-risk references to guard during G1–G5

| Area | Baseline reference / risk | Acceptance requirement |
|---|---|---|
| Script build | `apps/api/src/scripts/copy-templates.mjs`: `apiRoot = resolve(__dirname, '..', '..')` | After moving script one directory deeper, revise its root calculation (and `apps/api/package.json` build entrypoint) so source and `dist/templates` remain correct. |
| Seed | `apps/api/src/scripts/seed.ts`: `path.resolve(__dirname, '..', '..', 'public', ...)` | Preserve seed asset lookup when moving to `scripts/seeds/`. |
| Commands | `apps/api/package.json`: 14 source script references, including the build helper, seed, cleanup, migrations and diagnostics | Retain every existing `pnpm` command name; point each to the corresponding canonical file, without executing migrations or seeding in verification. |
| TS global types | `apps/api/src/types/express.ts` augments Express Request | Keep module augmentation discoverable in `apps/api/tsconfig.json` and rewrite relative type imports. |
| Shared schemas | `apps/api/src/schemas/shared/index.ts` with explicit exports | Preserve legitimate shared schema entrypoint; do not leave empty proxy files. |
| Fixture | `apps/api/src/constants/type-contracts.fixture.json` | Rewrite exact fixture paths in tests/tools and preserve JSON data byte-for-byte. |
| Root checks | `scripts/checks/contracts/check-type-contract-parity.mjs`, `check-next-api-contracts.mjs`, `scripts/checks/pharmacy/*` | Update hard-coded physical file paths and expectations, not contracts/permissions. |
| Cross-app tests | `apps/admin`, `apps/pharmacy` tests use relative filesystem paths into `apps/api/src/` | Rewrite and run all impacted tests, even if the API TypeScript compiler passes. |
| Audit tests | API service/contract tests read `src/schemas`, `src/types`, `src/utils` by literal file paths | Update contract test fixtures after each stage, without weakening assertions. |
| Membership & security | `pharmacyAccess`, auth/session types and schemas, owners and pharmacy scope | Preserve explicit `pharmacyId` authorization and Platform Owner/employee distinction; never merge distinct domain guards just because of similar code. |

## Commands (repository root)

```bash
pnpm check:grouping-g0
pnpm test:grouping-g0

pnpm check:services-s1
pnpm check:models-m1
pnpm test:models-m1
pnpm check:transport-c1
pnpm test:transport-c1
```

G0 commands require Node 22+ and do not start the database. They never write to tracked API source files. The normalized source fingerprint tolerates LF/CRLF and **only** empty lines or full-line decorative `//====`, `//----`, `//****` separators. Meaningful source changes fail the gate, while raw SHA-256 remains available for forensic comparison. The G0 scripts are **not** added to the permanent `check:before-deploy:staged` pipeline since the strictly pre-move gate will (correctly) fail once G1 starts; stage-aware verification replaces it then.

G0 itself is not a duplicate-removal pass. Duplicate consolidations, deep semantic-cycle analysis and dead-code removal belong to the separate **A1–A9 audits** after G6.
