# A1 — Gate & Reproducibility Report

## Baseline

Input `e-pharmacy-14-20-9.zip` plus official `e-pharmacy-14-20-9-G6-final-architecture-verification-only-changed-files.zip` patch. Comparisons for the downloadable A1 patch were made against that **combined post-G6 baseline**.

## Confirmed in this extracted test workspace

| Command | Result |
|---|---|
| `node scripts/architecture/check-api-controllers-a1.mjs --check` | **PASS** — 16 controllers, 157 exports, 6 download headers, 0 unreferenced route identifiers, 0 direct persistence imports |
| `node --test scripts/architecture/check-api-controllers-a1.test.mjs` | **PASS — 6/6**; includes invalid flags, altered exports, unexpected model imports, inline-encoder regression and runtime helper output parity |
| `node scripts/architecture/check-api-grouping-g6.mjs --check` | **PASS** — 0 unresolved imports / 0 cycles |
| `node scripts/architecture/relocate-api-transport-c1.mjs --check` | **PASS** — 13 mounts, 159 HTTP registrations |
| `node scripts/architecture/check-models-m1.mjs` | **PASS** |
| `node scripts/architecture/relocate-services-s1.mjs --check` | **PASS** |
| G1–G5 `--check` | **5/5 PASS** — 35, 38, 14, 23, 30 relocated files |
| `node scripts/architecture/run-api-grouping-g6-gates.mjs --history` | **PASS — 18/18** historical commands after A1 |
| `node scripts/checks/boundaries/check-api-package-boundaries.mjs` | **PASS** |
| `node scripts/checks/product-categories/check-dynamic-product-categories.mjs` | **PASS** |
| `node scripts/checks/pharmacy/check-pharmacy-location.mjs` | **PASS** |

The historical G4/G5 tests retain the original 3,494-import baseline and validate the exact **six** additions declared in `approved-import-delta.json`. No legacy baseline hashes were replaced.

## Required on user's fully installed monorepo

From the repository root, after applying the changed-files ZIP:

```bash
pnpm check:controllers-a1
pnpm test:controllers-a1
pnpm check:grouping-g6
pnpm check:transport-c1
pnpm check:models-m1
pnpm check:services-s1
pnpm check:source:api
pnpm check:source:shared
pnpm check:source:client
pnpm check:source:pharmacy
pnpm check:source:admin
pnpm check:lint:serial
pnpm check:type-check:serial
pnpm check:test:serial
pnpm check:react:serial
pnpm check:integration:serial
pnpm check:build:serial
pnpm check:deploy-artifact
```

Full lint, TypeScript, API unit/integration, React, build and deploy-artifact were **not run here**, because the extracted archive does not contain installed `node_modules`/`pnpm`. The old G6 user logs validate only the **pre-A1** baseline, not this new patch.

Do not run migrations or seed for this audit.
