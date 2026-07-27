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
