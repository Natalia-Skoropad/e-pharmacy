# Stage G5 — API Utils relocation

Input: **`e-pharmacy-14-20-8.zip`** (post-G4 source). This stage completes the planned G1–G5 structural relocations without changing business logic.

## Scope

- `apps/api/src/utils/`: **31** inventoried files; **30** canonical moves; **1** stable file (`utils/validation/working-hours.ts`).
- Destinations are the **exact, immutable** G0 manifest (`docs/architecture/grouping-g0/relocation-plan.json`): `accounts`, `auth`, `catalog`, `database`, `dates`, `documents`, `email`, `http`, `logging`, `pharmacies`, and `validation`.
- No legacy re-export proxies or runtime API signature changes. Relative imports and hard-coded path checks are rewritten to canonical targets.
- Original and canonical source fingerprints are fixed in `source-fingerprints.json`; the relocation does **not** recompute them. The original G0, M1, S1, Transport and G1–G4 baselines remain untouched.
- Five G3 scripts import a moved utility; `approved-g3-after-g5.json` pins their **exact** resulting hashes. G3 accepts these fingerprints *only when all 30 G5 moves are complete*.
- Historical M1 source normalization now resolves the 30 exact new utility targets back to the immutable G0 identities. G1–G4 regression tests recognize an all-or-none completed G5; they do not permit mixed trees.

## Apply

From the repository root, after extracting the only-changed-files patch:

```bash
pnpm grouping:relocate --dry-run --stage G5
pnpm test:grouping-g5
pnpm grouping:relocate --apply --stage G5
pnpm grouping:relocate --check --stage G5
pnpm check:grouping-g5
pnpm test:grouping-g5
```

Expected completed state: `status: PASS`, `manifestEntries: 30`, `completedBeforeRun: 30`, `selectedMoves: 0`, `obsoleteProxyFiles: 0`. `--check` deliberately fails before `--apply`; `--dry-run` performs no writes.

## Compatibility gate

```bash
pnpm check:grouping-g1 && pnpm test:grouping-g1
pnpm check:grouping-g2 && pnpm test:grouping-g2
pnpm check:grouping-g3 && pnpm test:grouping-g3
pnpm check:grouping-g4 && pnpm test:grouping-g4
pnpm check:models-m1 && pnpm test:models-m1
pnpm check:services-s1 && pnpm test:services-s1
pnpm check:transport-c1 && pnpm test:transport-c1
```

Then run the existing full source/lint/type/test/React/integration/build/deploy-artifact gate, locally with `pnpm` dependencies installed. Do **not** execute database migrations or seed operations merely to check a folder relocation.

## Pre-release validation on an isolated copy

- G5 dry-run / apply / completed check: **30/30**, no old utility proxies, **3,494** checked relative imports.
- **162** touched files, **145** text contents with rewritten paths, after applying relocation in the simulation.
- **38/38** architecture regression tests (G1–G5, M1, S1, Transport) pass.
- **75/79** directly executable structural checks pass. Four checks require local TypeScript dependencies not present in the isolated copy (`check:types-unused-exports`, `check:type-contracts`, `check:client-lib-boundaries`, `check:client-lib-unused-exports`). These checks are **not** claimed as passing and must be verified during the local full gate.

This patch adds the relocation tooling and exact permitted compatibility checks. The `--apply` command creates the source relocations on the user's current working tree.
