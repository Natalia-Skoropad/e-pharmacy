# Architecture Cleanup CL2 — read-only Gate reachability safety

**Input:** latest complete project archive `e-pharmacy-14-20-18.zip`, overlaid with both CL1 README/inventory updates.
**Scope:** architecture tooling only. No production source, DB, Mongoose, API contracts, immutable manifests or deployment payloads are modified.

## Implemented

- New `scripts/architecture/maintenance/check-tool-safety-cl2.mjs` accepts **only** `--check`, reads the root scripts registry, the CL1 inventory and G6 runner, and does not invoke the operations it inspects.
- The checker traverses the command dependency graph from **five roots**: `check:architecture:final`, `check:before-deploy:staged`, `check:before-deploy`, `check:grouping-g6:history`, `check:grouping-g6:full`.
- The G6 `HISTORY` (18 entries) and `FULL_GATE` (12 entries) declarations are parsed as reviewed, static lists. Their commands are visited as dependencies; a changed or unrecognized dispatcher shape fails closed.
- The three write-capable historical entrypoints (`grouping:relocate`, `services:relocate`, `transport:relocate`) must still have their original canonical command definitions; **none may become reachable from a protected Gate**.
- The protected commands must not invoke historical relocation implementations without explicit read-only `--check`, invoke an `--apply`/`--write` flag, or introduce command dependency cycles. Each of the three top-level final/deployment commands must run the CL2 check and tests **first**.
- A 12-test suite uses in-memory mutation cases for lost guards, transitive relocation invocation, changed G6 lists, changed CLI flags, broken inventories and cycles.
- The one additional peer import in the CL2 test has a precise approval; historical G0–G6 fingerprints and manifests remain untouched.

## Important limitation

This is a **Gate-call graph safety check**, not a sandbox or an operating-system policy. It does **not** disable manual use of the three historical `:relocate` commands or block someone from directly running `node ... --apply` outside a protected Gate. Subcommands delegated to the existing workspace source/build/test gates are validated by their established checks; CL2 does not prove the absence of arbitrary side effects inside those programs. In particular, it neither runs nor certifies the safety of database migrations or destructive demo seeds.

All **46 existing** architecture files are retained (the two CL2 files are additional, not replacements). The CL1 inventory remains an immutable snapshot of those 46 historical files.

## Run

```bash
pnpm check:tool-safety-cl2
pnpm test:tool-safety-cl2
pnpm check:architecture:final
```

The last command now starts with the two CL2 checks and then executes the established A1–A9 and G6 full gates. Staged and legacy pre-deploy commands also start with the same preflight.
