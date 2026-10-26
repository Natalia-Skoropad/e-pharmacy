# Stage A9 — API & Shared Utils Audit

**Input:** `e-pharmacy-14-20-16.zip`, containing the updated A8 scripts and all project files. **Scope:** the 31 immutable G5 entries in `apps/api/src/utils/`, the 25 TypeScript files in `packages/utils/src/` (including tests and public barrels), and an overlap-only comparison with `packages/validation/src/`. `packages/validation` is not relocated.

## Inventory and dependency graph

A9 read-only inspection of the source archive reports:

| Property | Result |
|---|---:|
| G5 canonical API utils | 31 |
| Shared utils modules (including tests and barrels) | 25 |
| Total inspected utils modules | 56 |
| Tests among these modules | 17 |
| Exported functions | 64 |
| Relative imports in the two utils trees | 56 |
| Internal utility import edges | 32 |
| Unresolved imports | 0 |
| Import cycles | 0 |
| Shared `@e-pharmacy/utils` package entrypoints | 7 |
| Unreviewed/legacy flat utils files | 0 |
| Duplicate exported bodies among the two utils trees | 0 |

Counts above are an initial exact-file audit, not a substitute for TypeScript compilation or runtime behavior tests. G5 fingerprint verification still applies to the entire `apps/api/src/utils/` tree. Every new, deleted or relocated module is rejected unless explicitly reviewed in the A9 registry/G5 baseline.

## Architectural boundary review

- `packages/utils` contains reusable formatting, date/time, guards, collections and arithmetic; it should remain browser-importable and must not gain backend services, persistence, secrets, file-system side effects, or business-specific authorization.
- API auth helpers, email sending, document handling and logger are backend-specific. `pharmacyAccess.ts` directly uses a model and a membership service. That is a **boundary concern for a dedicated behavior-preserving follow-up**, not grounds to silently move authorization logic into shared utils.
- Validation belongs primarily to `packages/validation`. The two matching helper names described in the duplicate report warrant parity tests before any consolidation.
- API helper source fingerprints and the seven shared package export paths are guarded. Existing API behavior, routes, DTOs, and externally visible errors are not changed in A9.
- No imports of production utilities are executed by the A9 checker. Static inspection cannot prove absence of all runtime side effects; reviewed code and existing runtime tests remain necessary.

## Updated tooling

- Added a standalone read-only checker `scripts/architecture/utils/check-api-utils-a9.mjs` and 16 negative/positive tests.
- Removed the unused `uniqueSorted` declaration from `scripts/architecture/types/check-api-types-a8.mjs` (VS Code ESLint warning). No TypeScript utility, validation function, or shared public API was changed.
- Added a separately pinned single relative import approval for A9 test discovery to the historical G4/G5 regression checks. G0–G6 manifests and production fingerprints remain immutable.

## End state

**A9 checker PASS**, with two shared-validation overlap candidates explicitly recorded. The complete final cross-folder audit and temporary-tool cleanup are **separate planned stages**.
