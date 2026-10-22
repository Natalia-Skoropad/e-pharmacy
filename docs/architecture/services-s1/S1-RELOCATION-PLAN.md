# S1 — canonical service map and import/path guard

**Source of truth:** `e-pharmacy-14-19-1.zip` (the archive after S0 changes). This phase deliberately **does not move application services**. S2–S8 relocate one domain at a time, under separate QA gates; S9–S10 handle deduplication/decomposition later. No proxy modules, no reexports under old names, no runtime authorization changes.

## Inventory and canonical paths

`service-relocation-map.json` explicitly maps **144 source files** from their current flat `apps/api/src/services/` paths to the intended canonical domain paths. This comprises **49 implementation/helper files and 95 tests**. The earlier S0 inventory has 143 files (48 + 95); the current archive adds `pharmacy-integration-actors.helper.ts` as a Mongo test fixture. It is mapped to `services/__tests__/fixtures/`, not treated as a runtime service.

| Move stage | Domains | Files (including tests) |
|---|---|---:|
| S2 | `infrastructure/`, `migrations/`, `__tests__/fixtures/` | 12 |
| S3 | `catalog/`, `inventory/` | 20 |
| S4 | `cart/`, `clients/` | 16 |
| S5 | `pharmacies/`, `owners/` | 40 |
| S6 | `orders/` | 16 |
| S7 | `admin/access/`, `admin/audit/`, `admin/employees/`, `admin/platform-owners/`, `admin/pharmacies/`, `admin/owners/`, `admin/settings/` | 34 |
| S8 | `auth/` | 6 |

Tests are allocated to the owning domain and moved in the same stage; cross-domain tests remain in the domain whose behavior they primarily verify. `admin-owner.service.ts` is Platform Owner functionality, not Pharmacy Owner. Preserve the original filenames and exported symbol names, including `stockMovement.service.ts`. The old S0 inventory and snapshots in `docs/architecture/services-s0/` are historical evidence and **must not be regenerated to match new paths**. `pnpm check:services-s0-baseline` can fail even on this updated archive because the 144th S0 integration helper was added after the historical snapshot; do not use that immutable snapshot as a post-S1 gate.

## Automated rewrite, no proxy paths

`node scripts/architecture/relocate-services-s1.mjs` loads the manifest and walks source under `apps/`, `packages/`, `scripts/`, ignoring generated trees. It can relocate one stage only. For each planned stage it recalculates **relative specifiers against both the caller's new location and the target's new location**; it also updates source-path literals in contract tests and architecture checks (`apps/api/src/services/x.ts`, `src/services/x.ts`, `services/x.ts`, relative `./x`, `../models`, and split `path.join('src','services','x.ts')` forms). It checks that previous-stage paths remain canonical.

For each known previously resolvable relative import, it checks that its projected destination is exactly the expected file and **fails before writing on a resolution mismatch**. It rejects unknown top-level services, duplicate source/destination entries, collisions, missing source or target, stale references to migrated source filenames, and a target path that has both an old file and a proxy. It never edits the S0 JSON files and never writes old-name facade files. `--check` is read-only; `--dry-run` computes the projected changes without writing.

**At S1 (read-only checks):**

```bash
pnpm test:services-s1
pnpm check:services-s1
pnpm services:relocate --dry-run --stage S2
```

**During S2, only after confirming the previous S0 baseline has been committed and branch is clean:**

```bash
pnpm services:relocate --dry-run --stage S2
pnpm services:relocate --apply --stage S2
pnpm services:relocate --check --stage S2
```

Proceed similarly for S3–S8, one stage **at a time**. Each stage requires source checks, lint, type-check, unit/React/integration tests relevant to that domain, and a build before commit. Mongo integration must run on an isolated test replica set, never production data. `pnpm check:before-deploy` now includes the generic S1 path guard, but is **not a substitute** for domain QA.

**Rollback:** `--dry-run` modifies nothing. For an applied stage, commit the stage as a single reversible change (or use `git revert <stage-commit>`); avoid manually copying old-name modules back. Check `git status` and compare the stage manifest before applying.

## Verified in the S1 authoring environment

- Manifest coverage: **144/144** currently flat TS files, no duplicate target paths.
- S1 `--check` passes without relocating production files.
- Dry-runs for S2 and S5 pass with planned transformations.
- In an **isolated copy** of the supplied archive, applied S2, S3, S4, S5, S6, S7, S8 in order; `--check --stage` passed **after each stage**, ending at **144/144** relocated with no old proxy files.
- Projected import resolution: **2,864** previously resolvable relative imports verified by the codemod on each simulation step.
- Node source checks on the S2 simulation: Admin audit, Admin permissions, Pharmacy location, Owner multi-pharmacy foundation, Auth contracts and Client lib contracts **PASS**.
- Codemod fixture regression: `node --test scripts/architecture/relocate-services-s1.test.mjs` **PASS** (read-only plan, dry-run, apply, relative imports, path literals, split path segments, no proxy, idempotence, historical S0 data untouched).

**Not claimed:** full pnpm dependency-backed lint/type-check/unit/React/Mongo/production build of a relocated tree. The archive here lacks `node_modules` and an isolated test MongoDB. Apply only the S1 tooling today and run local S1 checks; subsequent stage relocations require their own full gate. The S0 production baseline files were not altered at S1.
