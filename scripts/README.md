# Repository scripts

The scripts are grouped by responsibility:

- `checks/boundaries/` — package, hooks, API, and UI dependency boundaries;
- `checks/contracts/` — frontend/backend parity and transport contracts;
- `checks/hooks/` — hooks public entrypoints, consumers, tests, and deep-import policy;
- `checks/routes/` — BFF route and backend-route parity;
- `checks/types/` — public API and unused-export checks for `packages/types`;
- `checks/ui/` — CSS and UI style contracts;
- `test-runners/` — shared Node TypeScript test discovery, extension resolution, and execution;
- `archive/` — clean source-archive staging and archive-policy verification.

Repository-level checks are invoked from the root package scripts. Shared test runners operate from the package that calls them and support production-style extensionless relative TypeScript imports.

## Hooks checks

```bash
pnpm check:hooks-boundaries
pnpm check:hooks-public-api
pnpm check:hooks-lifecycle
```

These checks reject backend imports, deep imports, unexpected root exports, internal UI hooks in the public package, untested public hooks, and public hooks without independent consumers. The lifecycle check additionally guards overlay event ownership, auth-scoped async state, mutation locks, abortable network effects, shared debounce consumers, and the single pharmacy-profile request owner.
All hooks checks are part of `pnpm check:before-deploy`.

## Clean source archives

Prepare a clean source tree before creating an audit or deployment archive:

```bash
pnpm archive:source
```

Verify both the archive policy and the actual staged source-tree content with:

```bash
pnpm check:archive-hygiene
```

The staged source tree is written to `.artifacts/e-pharmacy-source` and intentionally excludes `.artifacts`, `node_modules`, `.turbo`, `.next`, `dist`, `coverage`, logs, TypeScript build info, and nested ZIP archives. The hygiene check builds a temporary source tree and recursively verifies its real contents, so a broken exclusion can no longer pass merely because the policy text looks correct.

## Client component checks

```bash
pnpm check:client-components-boundaries
pnpm check:client-components-public-api
pnpm check:client-components-a11y
pnpm check:client-components-styles
pnpm check:client-content-contracts
```

These checks cover the audited `common`, `home`, `info`, and `layout` layers. They reject cross-layer feature imports, no-op shared re-exports, one-line nested barrels, duplicate or stale CSS, `!important`, invisible desktop modal hiding, missing skip/dialog/rating/pending semantics, invalid revision metadata, generated title anchors, misleading home claims, and placeholder social URLs. Product-details presentation CSS is included where it owns the local order-information card.

## Architecture audit and historical tools

`scripts/architecture/` is deliberately separated by responsibility:

- `audits/`, `models/`, `constants/`, `schemas/`, `scripts/`, `types/`, `utils/` — canonical A1–A9 and M1 checkers/tests;
- `final/` — cross-folder contract audit and parity tests;
- `maintenance/` — grouping/layout contract checks;
- `grouping/g0`–`grouping/g6`, `services/`, `transport/` — historical relocation implementations, baseline verification, and regression tests.

Run the canonical final read-only verification from the repository root:

```bash
pnpm check:architecture:final
```

Do **not** run historic `grouping:relocate`, `services:relocate`, `transport:relocate` or `--apply` actions as routine checks. Relocation implementations are still consumed by the historical Gate and must not be deleted without a tested replacement.

The reviewed inventory and staged deletion criteria are in [`docs/architecture/cleanup-readiness/CLEANUP-READINESS-REPORT.md`](../docs/architecture/cleanup-readiness/CLEANUP-READINESS-REPORT.md). This is a **retention** assessment: no existing architecture scripts are approved for immediate deletion.

### CL2 safety gate

`check:architecture:final`, `check:before-deploy:staged` and `check:before-deploy`
run the read-only CL2 checker and its regression tests before other commands:

```bash
pnpm check:tool-safety-cl2
pnpm test:tool-safety-cl2
```

CL2 checks whether historical write-capable relocation commands are reachable
from protected verification command paths. It does **not** disable manually
invoked migration/relocation actions. The exact scope and limitations are
recorded in [`CL2-TOOL-SAFETY-REPORT.md`](../docs/architecture/cleanup-readiness/CL2-TOOL-SAFETY-REPORT.md).

### CL3 architecture tooling closure

The final dependency review of `e-pharmacy-14-20-19.zip` retained **all 48**
architecture tools (46 original CL1 entries plus two CL2 safety files).
There are **no approved deletion paths**. The locally run
`pnpm check:architecture:final` completed with **G6 30/30 PASS**.

The original 46-path CL1 inventory is a pinned baseline, **not** a list of
files to remove. See
[`CL3-CLOSURE-REPORT.md`](../docs/architecture/cleanup-readiness/CL3-CLOSURE-REPORT.md)
for the final decision and per-file matrix. Historical write-capable relocation
tools must not be run as routine checks.
