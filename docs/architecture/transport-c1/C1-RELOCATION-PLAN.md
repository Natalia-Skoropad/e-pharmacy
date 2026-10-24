# C1 — Automated staged relocation plan for API transport

**Authoritative source:** `e-pharmacy-14-20-2.zip` (including nested `apps.zip → api.zip`). This C1 planning patch is based on that version only. The source files are not moved by the patch.

Read first: `apps/api/README-0.md`, `apps/api/README-1.md`, and the committed Service S1 workflow at `docs/architecture/services-s1/S1-RELOCATION-PLAN.md`.

## Why a revised C1?

The earlier C1 package immediately relocated 48 files and demanded a manual `git rm`. That skipped the safer, faster staged workflow already proven for `services`. **Do not apply the earlier `e-pharmacy-transport-C1-changed-files.zip`.** Apply this new C1 **plan + codemod only**, then apply C2–C6 through the script in separate local commits after gates.

## Scope and inventories

Baseline: **49** flat TS files: **17 controllers, 15 route files, 17 middlewares**. Move **48** to canonical domain directories; retain `apps/api/src/routes/index.ts` as the stable composition root. All original relative paths, lengths and SHA256 hashes are recorded in `transport-inventory.json`; the complete old→new canonical map, five stages and source SHA256s are in `transport-relocation-map.json`.

Stages:

| Stage | Scope | Files |
| --- | --- | ---: |
| C1 | Manifest, test fixtures, read-only checks and dry-run; **no application moves** | 0 |
| C2 | `middlewares/http`, `middlewares/security`, `controllers/health`, `routes/health` | 11 |
| C3 | Authentication / session / trusted BFF `controllers`, `routes`, `middlewares` | 9 |
| C4 | Catalog, cart, clients, orders controller + routes | 13 |
| C5 | Pharmacies and pharmacy owners controller + routes + selected pharmacy middleware | 8 |
| C6 | Admin controllers, routes, permission middleware | 7 |
| **Total relocation** | | **48** |

## Mechanism and safeguards

- `scripts/architecture/relocate-api-transport-c1.mjs` is modeled on the proven `relocate-services-s1.mjs` workflow. Modes: `--check` (read-only), `--dry-run --stage C2` (read-only projection), `--apply --stage C2` (physical move + reference rewrite). Use the same flags for C3–C6; `--apply` requires the stage and respects their order. Running a stage twice is idempotent. `--check --stage C2` passes only when C2 has been applied.
- Preflight requires every original file at **exactly one** canonical or old location. It refuses collisions, unknown top-level `.ts` files, duplicate or unsafe manifest entries, and wrong stage ordering. Old flat files are physically **renamed**, not copied; no compatibility proxies, barrels, or re-export files are created.
- Rewrites relative code import specifiers based on the **caller's and target's updated locations**; adjusts source-path literals used by tests and checks, including split `path.join()` arguments. Preserves extensionless TypeScript module specifiers (and guards against introducing `.ts` imports, fixing the TS5097 class of error encountered in M1).
- Every previously resolved relative module import must still resolve to its projected canonical target. Source-level API mounts and HTTP method registration count/order remain unchanged: **13 mounts** and **159 method registrations**, including their original absolute route literals. Auth, order, validation, permissions and middleware declarations are unchanged beyond path references.
- This is **structure-only**: it does not merge look-alike handlers, alter transaction boundaries, change a model/index, or change the public HTTP contract. See deduplication candidates below.

## How to use

From the monorepo root, **after applying only the C1 planning ZIP**:

```bash
pnpm check:transport-c1
pnpm test:transport-c1
pnpm transport:relocate --dry-run --stage C2
```

The expected starting result is `completedBeforeRun: 0`, `manifestEntries: 48` and `selectedMoves: 11` for the C2 dry-run. Review changes and finish the existing standard local Git checks. After committing the C1 tool/manifest, **in the next stage**:

```bash
pnpm transport:relocate --dry-run --stage C2
pnpm transport:relocate --apply --stage C2
pnpm transport:relocate --check --stage C2
pnpm check:transport-c1
pnpm check:models-m1
pnpm check:services-s1
pnpm check:before-deploy:staged

git diff --check
git add -A
git diff --cached --check
git diff --cached --summary
```

Stage C2 is committed independently once local Gate is green. C3 through C6 use the same commands with their respective stage values, **one stage per commit**. Never run C3 before passing C2. Do not run `git rm`: the script uses `renameSync` and Git can detect renames when staged. Rollback an applied stage through `git revert <stage-commit>` or by restoring its uncommitted tree, not through manually recreated proxy files.

## Duplicate / responsibility audit (candidates only)

- `admin.routes.ts` (large number of registrations) and `admin.controller.ts` (multiple resources) are candidates for a **later** split. Keep per-endpoint role/permission middleware order intact.
- `auth-bff.middleware` and `origin.middleware` both relate to request trust but enforce **different** security properties; do not merge.
- Request rate-limit handling, token/key hashing and Mongo-backed rate-limit state are separate responsibilities; avoid a generic middleware merge.
- `error.middleware` and `notFound.middleware` occupy different positions in Express middleware processing; keep separate.
- `/pharmacy` and `/pharmacies` use an intentional compatibility alias in the composition root; preserve both.

No safe implementation-level duplicate has been proven by the structural move. Future stages **C7 (duplicate logic review)** and **C8 (controlled decomposition of large controllers/routes)** need separate acceptance criteria and their own tests, mirroring `services` S9–S10.

## Verification in isolated project copy

The codemod was tested against a copy extracted from the latest user archive, not an older stage archive. The following ran successfully:

- 48-file baseline inventory and first-stage `--check` / `--dry-run`.
- Stage C2, C3, C4, C5, C6 `--apply` followed by `--check --stage` each; all 48 moves ended at the canonical locations.
- 3 Node fixture tests covering dry-run, stage completion / idempotence, relative-import/source-string rewrites, collision detection and stage ordering.
- Core source checks on the simulated relocated tree (backend package boundaries, backend/Next route parity, Admin audit/permissions, Pharmacy create UI, Owner multi-pharmacy guard).

**Not performed here:** full `pnpm` lint, TypeScript type-check, unit/integration tests, React tests, deployment build and Mongo integration. The extracted archive does not contain installed workspace dependencies or a running Mongo test replica set. Those require local gates **after each physical move stage**. Do not claim they passed on a code tree that has not been tested locally.
