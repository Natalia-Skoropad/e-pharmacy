# CL2 — verification and gate handoff

**Verification environment:** Node.js v22.16.0, unpacked current archive and CL1 patches, no live database and no relocation execution.

| Check | Observed result |
| --- | --- |
| `node scripts/architecture/maintenance/check-tool-safety-cl2.mjs --check` | **PASS**; 5 protected roots, 141 root script dependencies visited, 3 historical write entrypoints retained |
| `node scripts/architecture/maintenance/check-tool-safety-cl2.test.mjs` | **12/12 PASS** |
| Historical `g4` and `g5` test modules | **14/14 PASS** (post-CL2 one-import approval) |
| `node scripts/architecture/grouping/g6/run-api-grouping-g6-gates.mjs --history` | **18/18 PASS** |
| Full `pnpm check:architecture:final` including G6's 30-command gate | **PASS on the user's Windows machine**; 30/30 nested G6 gates and 2,686 archive entries, per the subsequently supplied CL2 log (`Вставлений текст(20261026-202412).txt`) |

No historical manifest or pinned source hash was regenerated. No production module, schema, migration, seed, or database record was modified.

## Local acceptance

1. Overlay this change-only archive into the repository root, keeping CL1 files.
2. Run `pnpm check:tool-safety-cl2`, `pnpm test:tool-safety-cl2`, then `pnpm check:architecture:final`.
3. Verify `git diff --check` and inspect staged file paths. A new `CL2-APPROVED-IMPORTS.json` is an exact, narrow acknowledgement of **one** test import; it does not allow any other historical drift.
4. Do **not** run `pnpm grouping:relocate -- --apply`, `pnpm services:relocate -- --apply`, or `pnpm transport:relocate -- --apply` as part of this check.

**Decision update (CL3, 2026-10-26):** The subsequent full local Gate **PASSED**. CL2 is accepted; CL3 found no approved deletion candidates. See [`CL3-CLOSURE-REPORT.md`](./CL3-CLOSURE-REPORT.md). Historical relocation binaries remain retained unless individually superseded with reviewed replacements.
