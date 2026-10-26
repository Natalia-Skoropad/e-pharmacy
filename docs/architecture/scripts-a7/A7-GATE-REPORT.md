# Stage A7 — Verification Gate

Source tree assembled **only from** `e-pharmacy-14-20-14.zip` plus this changed-files patch. No DB commands, seeds, migrations, cleanup, diagnostic reads or production imports were executed.

| Command | Result |
|---|---|
| `check:scripts-a7` | **PASS**, 14 canonical files and 14 exact operational entrypoints |
| `test:scripts-a7` | **18/18 PASS**, in-memory negative and read-only tests |
| `check:client-components-a11y` | PASS after unused-variable removal |
| `check:client-catalog-a11y` | PASS after unused-variable removal |
| A1, A2, A3, A4, A5, A6 checkers | PASS |
| A1–A6 tests | PASS (6 + 6 + 9 + 12 + 10 + 14 = **57** tests) |
| Architecture layout checker/tests | PASS (**5/5**) |
| API boundaries | PASS (476 API source modules) |
| G6 `--history` | **PASS 18/18** (G1–G6, M1, S1 and Transport C1–C6) |
| Full G6 `--full` with A7 additions | **Not run** in this isolated environment; run on local pnpm/node_modules checkout |

The user-provided full-G6 log from the **pre-A7** source tree ends with `PASS: check:grouping-g6:full` (30/30); this does **not** count as a post-A7 full Gate.

Historical manifests and CLI entrypoint names preserved. Two client accessibility checker edits are assertions-neutral. No `apps/api/src/scripts` production files modified.

To verify after ZIP overlay:

```bash
pnpm check:scripts-a7
pnpm test:scripts-a7
pnpm check:client-components-a11y
pnpm check:client-catalog-a11y
pnpm check:grouping-g6:full
```

Check changed-file scope with `git diff --check` and review before committing. Never run `pnpm seed:api` or `migrate:*` merely to complete the A7 Gate.
