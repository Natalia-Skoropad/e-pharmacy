# A2 — Verification ledger

Checked in isolated copy of **e-pharmacy-14-20-10.zip** after applying A2 edits:

| Command / check | Observed result |
|---|---|
| `node scripts/architecture/check-api-middlewares-a2.mjs --check` | PASS — 12 production middlewares, 80 preserved handlers, 16 canonical modules, 0 proxy |
| `node --test scripts/architecture/check-api-middlewares-a2.test.mjs` | PASS — 6/6, includes negative tests |
| `node scripts/architecture/check-api-controllers-a1.mjs --check` | PASS — 29 controllers, 157 handler exports, 6 attachments |
| `node --test scripts/architecture/check-api-controllers-a1.test.mjs` | PASS — 6/6 |
| `node scripts/architecture/run-api-grouping-g6-gates.mjs --history` | PASS — 18/18 historical checks/tests G1–G6, M1, S1, Transport C1–C6 |
| `node scripts/checks/boundaries/check-api-package-boundaries.mjs` | PASS |
| `node scripts/checks/pharmacy/check-pharmacy-create-ui.mjs` | PASS |
| `node scripts/checks/product-categories/check-dynamic-product-categories.mjs` | PASS |
| `node scripts/checks/pharmacy/check-pharmacy-location.mjs` | PASS |
| `node scripts/checks/contracts/check-next-api-contracts.mjs` | PASS |
| Selected path-based source contract tests via global `ts-node` | 34 tests passed; one additional test module blocked because isolated copy lacks `mongoose` dependency |
| TypeScript parser + unused-symbol validation for the three controller domains | 0 syntax / unused-symbol diagnostics in a no-resolution check; not a substitute for project type-check |

**Not run in isolated copy:** full 30-step lint/TypeScript/unit/React/integration/build/deploy Gate, because the user project workspace dependencies are not mounted. Run `pnpm check:grouping-g6:full` locally after applying the ZIP. Do not interpret missing dependency as a code regression.

The original G0–G6 baseline source/manifest values are unchanged; A2 import additions are bounded by `approved-import-delta.json` and the exact fingerprints of 80 moved handler bodies.
