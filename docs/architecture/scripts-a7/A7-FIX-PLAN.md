# Stage A7 — Fix Plan (prioritized)

## Critical

None can be confirmed as an **active production incident** from static files alone. Do not treat a passed static audit as approval to execute data migrations.

## High

1. **Demo seed target protection:** add a fail-closed check on the actual target MongoDB environment/identity (not just `NODE_ENV`), plus explicit operator opt-in for destructive reset. Implement in a separately reviewed change with a staging DB and regression tests. Historical `seed:api` behavior is intentionally unchanged in this A7 patch.
2. **Domain migration replay and backups:** on realistic legacy fixtures, prove identical outcomes on run 1/run 2 and recovery from partial interruption; verify `dropIndex`, duplicate cart merge, indexes, and legacy review identifiers. Fix any unstable review IDs using an explicit reconciliation strategy, with data-migration approval; do **not** run the migration as a test on the user's database.
3. **Owner foundation password/target review:** ensure the legacy demo-account migration cannot be misapplied to live owners. Verify seeded credentials are rotated or accounts blocked until credential reset where applicable.

## Medium

4. Add service-level transaction/retry tests for owner-document migration and dry-run side-effect checks against an isolated fixture DB; preserve owner provenance safeguards.
5. Capture migration run metadata (input snapshot/target, run identifier, affected row counts, and verified rollback instructions) without logging secrets or documents.

## Low

6. Consider extracting repeated connect/disconnect boilerplate only if it preserves each entrypoint's distinct safety semantics, error handling and G3 migration contracts.
7. Monitor `seed.ts` and `migrate-domain-entities.ts` size; decomposing solely to shorten files is not an A7 acceptance criterion.

## Unrelated ESLint items resolved in this patch

`check-client-components-a11y.mjs` and `check-client-catalog-a11y.mjs`: removed the unused `pharmacyHero` binding **and its unused Promise.all input**. Assertions and remaining source checks pass. cSpell flags on ARIA terms are dictionary false positives, not execution failures; no term was renamed.
