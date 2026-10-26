# A3 — Gate report (isolated source archive)

- Source: **`e-pharmacy-14-20-11.zip`** (latest user-supplied snapshot).
- `node scripts/architecture/check-api-models-a3.mjs --check`: PASS (27 models, 3 tests, 41 schema declarations, 91 explicit indexes, 69 refs, 0 unresolved references).
- `node --test scripts/architecture/check-api-models-a3.test.mjs`: PASS (9/9 tests; includes negative tests for duplicate registration, legacy proxies, unknown refs, missing/duplicate indexes and review validator drift).
- Historical G6 architecture suite: **18/18 commands PASS** (including Models M1, Services S1 and Transport C1–C6).
- M1 immutable historical source validation: PASS (27 registrations, 30 relocations, 91 index declarations, 41 schema declarations, 0 invalid fingerprints); M1 tests PASS (3/3).
- G6 check on the fully extracted latest source archive: PASS (no API relative import cycles or unresolved imports).
- API package boundaries: PASS.
- **Not executed in this isolated environment:** full pnpm workspace Gate (lint, runtime Mongoose tests, full TypeScript build, integration, deployment). The archive contains no installed workspace dependencies. These are required locally for final confirmation.
- No production model files, original M1 manifests or archived data were changed. No Mongo connection, seed or migration performed.

To run locally:

```bash
pnpm check:models-a3
pnpm test:models-a3
pnpm check:models-m1
pnpm test:models-m1
pnpm check:grouping-g6:full
```

See `A3-FIX-PLAN.md` for why schema decomposition is staged behind runtime parity tests rather than combined with this read-only audit.
