# Cross-folder Final Architecture Audit — 2026-10-26

## Baseline and scope

**Source archive:** `e-pharmacy-14-20-17.zip`, after successful local Stage A9 and the user's latest A8/A9 logs. The historical `check:grouping-g6:full` run in the supplied log completed **30/30** on that baseline. This final patch adds checks and changes gate wiring, so its own **full** gate must be rerun in the developer's local workspace.

Read-only audit of the **interactions** among API controllers, middleware, models, routes, constants, schemas, operational scripts, DTO/types and utilities, with focused parity between API and `packages/validation`. The API architecture staging entrypoints and immutable historical G0–G6, S1, M1 and transport manifests remain unchanged.

## Cross-folder contracts

| Boundary | Evidence | Result |
| --- | --- | --- |
| Controllers → Routes → Authentication | A1 29 controller modules; A4 190 mounted endpoints across 13 mounts; 22 controller identity early returns all guarded | PASS (static) |
| Routes → middleware/authz | A4 per-endpoint route contract registry, 159 method registrations, role and admin permission guard order | PASS (static) |
| Models → schema/index/reference | A3 27 registrations, 41 schema declarations, 91 explicit indexes and zero unresolved refs; historical M1 | PASS (static + existing M1 tests) |
| Config/constants → shared contracts | A5 35 files, canonical product category seeds (no persisted `Other`) and cross-package status/roles | PASS (static) |
| Zod → shared validation | A6 50 schema files, 70 shared contract cases, no unresolved local imports | PASS (static) |
| Scripts → CLI/data safety | A7 14 approved operational commands and zero diagnostic writes; migrations are **never** executed | PASS (static), risk retained |
| API types → `packages/types` | A8 23 API + 77 shared type files, no unresolved imports/cycles | PASS (static) |
| API utils → shared utils/validation | A9 31 API + 25 shared utility files, no local utility cycles or import failures | PASS (static) |
| Duplicate `buildPublicEntitySlugId` | 11 cases across Cyrillic, punctuation, empty and invalid IDs, tested in isolated VM | PASS (sampled behavior parity) |
| Duplicate `getWorkingHoursValidationIssue` | 25 cases including valid week, missing day, duplicate day, invalid time, reversed time and all closed | PASS (sampled behavior parity) |

The cross-folder checker composes **all A1–A9 source auditors**, validates counts across folder boundaries, checks final deployment wiring, and tests two duplicate pure utility implementations. Its 11 tests include memory-only negative scenarios. It never connects to a database, starts a backend or executes seed/migration commands.

## Conclusions

1. **No newly confirmed high-severity cross-folder defect** in the audited static contracts. No reason to modify production route, model, DTO or validator semantics in this stage.
2. Both utility overlaps behave identically on the tested matrix. Their duplicate ownership is real, but consolidation would change pinned G5/G6 source fingerprints and multiple consumers; this is a separate explicitly reviewed refactor, not an automatic A9 cleanup.
3. Existing limits of static auditing remain: route auth checks do not prove 401/403 responses at runtime, and file counts/TypeScript checks cannot establish transaction rollback semantics under real MongoDB failures.
4. Operational scripts `seed.ts` and historical domain/owner migrations require safety review before any run against a real MongoDB URI. The final audit does not attest production database safety.
5. Large Mongoose model files have intentionally not been split. Their size alone is not a defect; schema/runtime/index parity must be demonstrated before any future split.

## Changes made by this stage

- `scripts/architecture/final/check-api-cross-folder-final.mjs` — composed read-only cross-folder audit, count and wiring constraints, isolated behavioral parity.
- `scripts/architecture/final/check-api-cross-folder-final.test.mjs` — 11 tests, including negative/immutability scenarios.
- Root `package.json` — `check:cross-folder-final`, `test:cross-folder-final`, `check:architecture:final`; ensure all A1–A9 **test suites** and the final audit are part of `check:before-deploy:staged`.
- G4/G5 historical test compatibility — exact-file-and-specifier approval for 10 new ESM relative imports; historic G0–G6 manifests and source hashes untouched.
- This report, the duplicate report, fix plan and gate report.

**No production TS/TSX source changed. No proxies or old-path replacements. No database scripts executed.**
