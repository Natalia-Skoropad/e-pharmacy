# Cross-folder Final Gate — verification record

**Input:** `e-pharmacy-14-20-17.zip` + this final audit delta.

| Gate | Result in isolated source workspace |
| --- | --- |
| `node scripts/architecture/final/check-api-cross-folder-final.mjs --check` | PASS — nine independent source auditors composed; 36 utility parity cases |
| `node scripts/architecture/final/check-api-cross-folder-final.test.mjs` | PASS — 11/11 tests; memory-only negative scenarios |
| G4 + G5 history tests after exact reviewed ESM import additions | PASS — 14/14 |
| `node scripts/architecture/grouping/g6/run-api-grouping-g6-gates.mjs --history` | PASS — 18/18 historical commands, no baseline updates |
| Full G6 source/lint/type/unit/React/integration/build/deployment (after final patch) | **NOT run in isolated workspace** — must be run locally with complete `pnpm` workspace dependencies |

**Baseline local evidence supplied before this patch:** A9 16/16, A8 14/14 and `check:grouping-g6:full` 30/30. Those results verify the source archive **before** this final patch; do not confuse them with running the new final gate.

**Local verification, from repository root:**

```bash
pnpm check:cross-folder-final
pnpm test:cross-folder-final
pnpm check:architecture:final

git diff --check
```

`check:architecture:final` includes all nine A1–A9 test commands, architecture-layout check/test and the existing full G6 (30) gate. The staged deployment chain also includes the new cross-folder checker/test and the previously omitted A5–A9 tests; no operational seed or DB migration command was added.

**Archive delivery:** changed/new files only. Do not delete any existing file as part of this stage.
