# Root architecture scripts — canonical directory relocation

This is a separate structure-only refactor performed together with Stage A5. Unlike backend G1, it changes the **repository root** tooling (`scripts/architecture/`), not `apps/api/src/scripts`.

- `relocation-map.json`: exact 32 old-to-new paths.
- `DELETE-PATHS.txt`: old tracked paths which **must** be removed after overlaying the ZIP.
- `approved-relative-imports.json`: exactly two new test-only relative ESM imports, checked in G4 and G5 without changing their historical source manifests.

## Applying the changed-files-only ZIP (Git Bash, from repo root)

1. Extract ZIP **with folder paths preserved**, replacing `package.json` and changed files.
2. Verify all new source files from the ZIP exist.
3. Remove only the relocated legacy tracked files:

```bash
while IFS= read -r file; do
  git rm -- "$file"
done < docs/architecture/scripts-reorganization/DELETE-PATHS.txt
```

4. Run:

```bash
pnpm check:architecture-layout
pnpm test:architecture-layout
pnpm check:constants-a5
pnpm test:constants-a5
pnpm check:grouping-g6:history
pnpm check:grouping-g6:full
```

5. Inspect `git status --short` and `git diff --check` before committing. Git should report old paths as deletions or renames, not new proxy scripts. **Never run `--apply` or migrations** to check this tooling relocation.

Note: earlier README files and baseline JSON preserve the pre-move script paths as historical facts. They are intentionally not rewritten. Live commands, validation scripts, relative imports and the orchestrator point only to new paths.
