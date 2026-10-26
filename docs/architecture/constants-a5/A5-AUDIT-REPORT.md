# Stage A5 — Constants Audit Report

**Baseline:** `e-pharmacy-14-20-12.zip` (includes completed G0–G6, A1–A4).  
**Scope:** `apps/api/src/constants/`, with read-only parity checks against `packages/config`.  
**Result:** PASS; production constants not modified.

## Inventory and safety

- Exactly **35 canonical G1 files**: 34 `.ts` and one JSON fixture.
- **147 exported constant declarations**; no duplicate exported symbol ownership among the 35 files.
- Every source is checked against the unchanged G6 `canonical-source-fingerprints.json` raw/normalized hashes.
- No flat pre-G1 proxy sources, no unknown constants in this scope.
- Static parity: `AUTH_APPLICATIONS`, `USER_ROLES`, `PHARMACY_STATUSES` between the API's enum-shaped objects and `packages/config`'s canonical arrays. Three aligned, intentional mirrors.
- Product-category seed slugs fixed to `medicine`, `vitamins`, `beauty`, `hygiene`, `medical_devices`; `Other` is not a real category or accepted kind.
- Auth, admin-access, product-management and product-request error-code groups have distinct static values.
- HTTP status values are unique numeric literals; admin permission matrix resource/action parity is enforced.
- Four AST structural-similarity candidates classified in `A5-DUPLICATE-REPORT.md`.

The G6 dependency check reports **0 API cycles, 0 unresolved relative imports and 0 obsolete API literal paths**. The A5 checker is strictly read-only and includes in-memory failure tests.

## Architecture tooling grouping (additional user-requested scope)

Root `scripts/architecture/` was reorganized separately from the 35 backend constants:

```text
scripts/architecture/
├── audits/       # A1 Controllers, A2 Middlewares, A4 Routes
├── constants/    # A5 checker and tests
├── grouping/
│   ├── g0/ ... g6/
│   └── relocate-api-grouping.mjs
├── maintenance/  # script-layout validator and tests
├── models/       # M1 and A3
├── services/     # S0 and S1
└── transport/    # C1–C6 grouping tool and tests
```

All **32 existing `.mjs` files** were moved to canonical subfolders without forwarding/proxy scripts. The root `package.json` paths, G6 orchestrator's command allowlist, relative ESM imports, test fixtures, historical script references and repo-root resolution were updated. Immutable documentation/manifests from the previous phases remain as historical records.

The migration map and the mandatory deletion list are in `docs/architecture/scripts-reorganization/`. A separate read-only layout checker enforces exact locations and live command targets.
