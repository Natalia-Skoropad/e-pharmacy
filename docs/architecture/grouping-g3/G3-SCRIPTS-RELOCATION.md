# Stage G3 — API operational scripts relocation

Source: `e-pharmacy-14-20-6.zip`, after G1 and G2. Do not run historical G0 `--check` on a grouped tree.

## Scope and invariants

- The immutable G0 map declares **14 moves**, no stable files, all under `apps/api/src/scripts/`.
- One canonical implementation per script, no compatibility wrappers, no extra proxy exports, no deletes of migration implementation logic.
- The 14 executable `apps/api/package.json` script commands retain **exact names and options**. Only their paths are rewritten. Roots and BFF wrappers are preserved.
- Historical migration behavior, transaction handling, idempotency, `--apply`/dry-run semantics and logging are unchanged. No database migration, seed or cleanup program is executed by G3.
- `copy-templates.mjs`: after moving into `scripts/build/`, an additional `..` restores the original API root for reading `src/templates` and writing `dist/templates`.
- `seed.ts`: after moving into `scripts/seeds/`, an additional `..` restores the original API `public` asset lookup in both TypeScript and compiled output.
- Stable fixed before/after source fingerprints in `source-fingerprints.json`, no dynamic baseline replacement during user execution.
- Old location references in active source checks and tests are updated, while immutable historical architecture manifests and isolated historical test fixtures remain unchanged.

## Applying

From repository root, with G2 committed:

```bash
pnpm grouping:relocate --dry-run --stage G3
pnpm test:grouping-g3
pnpm grouping:relocate --apply --stage G3
pnpm grouping:relocate --check --stage G3
pnpm check:grouping-g3
pnpm test:grouping-g3
```

Expected completed state: `manifestEntries=14`, `completedBeforeRun=14`, `selectedMoves=0`, `obsoleteProxyFiles=0`, `preservedCommandNames=14`.

Run `check:grouping-g1`, `test:grouping-g1`, `check:grouping-g2`, `test:grouping-g2`, Models M1, Services S1, Transport C1. Then the whole source/lint/typecheck/unit/React/integration/build/deployment gate. Do not run operational migrations or production seeds as verification steps.

## Change isolation

This patch archive contains only the relocation checker/tests, the pinned manifest, root task commands, cross-stage assertion updates and documentation. **Run `--apply` to relocate source files and rewrite the API operational entrypoints in place.** Those generated moves are reviewed using `git status --short`, `git diff --check` and `git diff --cached --name-status` prior to commit.
