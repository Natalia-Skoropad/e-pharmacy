# Repository scripts

The scripts are grouped by responsibility:

- `checks/boundaries/` — package and UI dependency boundaries;
- `checks/contracts/` — frontend/backend parity and transport contracts;
- `checks/routes/` — BFF route and backend-route parity;
- `checks/types/` — public API and unused-export checks for `packages/types`;
- `checks/ui/` — CSS and UI style contracts;
- `test-runners/` — shared Node/tsx test discovery and execution;
- `archive/` — clean source-archive staging without dependencies, caches, build outputs, logs, or nested ZIP files.

Repository-level checks are invoked from the root package scripts. Shared test runners operate from the package that calls them.


Prepare a clean source tree before creating an audit/deployment archive:

```bash
pnpm archive:source
```

The result is written to `.artifacts/e-pharmacy-source` and intentionally excludes `node_modules`, `.turbo`, `.next`, `dist`, `coverage`, logs, TypeScript build info, and nested ZIP archives.
