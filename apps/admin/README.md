# E-PHARMACY Admin

Private administration application on **http://localhost:3001**.

**Status:** application shell and shared status fallbacks implemented; auth and business modules pending.

## Local development

From the repository root:

```bash
pnpm install
pnpm dev:admin
```

Use `.env.example` as the source for an optional local `.env.local`.
The shared backend remains `apps/api`. Future browser requests will use
same-origin `/api/*` BFF routes; `API_BASE_URL` is server-only.
Public admin registration is not planned.

## Stage 1 scope

- Server Component root layout and shared `@e-pharmacy/ui` global styles.
- Client `AdminProviders` boundary with the shared `ToastProvider`.
- Server redirect from `/` to the app-local `/admin/dashboard` route constant.
- `noindex, nofollow` metadata and `robots.txt` with `Disallow: /`.
- No sitemap, deliberately. These crawler rules do not provide authorization.

## Stage 2 scope

- Root `loading.tsx` uses the shared `PageLoader`.
- Root `not-found.tsx` uses the shared branded `NotFoundPage`.
- Route `error.tsx` uses the shared `ErrorPage` and the Next.js `reset` callback.
- `global-error.tsx` renders its own document, imports the shared style baseline,
  and preserves `noindex, nofollow` without depending on root providers.
- Status pages reuse the local `/images/status/status-pills.png` illustration.
- Render-error diagnostics expose only the application, category, boundary
  context and optional Next.js digest; raw error messages and stacks are not logged.
- `check:admin-status-pages` protects the Stage 2 boundary contract.

The dashboard destination still returns the branded 404 because Dashboard is not
implemented in this stage. Auth, BFF routes, cabinet navigation and business
modules remain intentionally out of scope.

## Validation

```bash
pnpm check:admin-status-pages
pnpm check:admin
pnpm check:before-deploy
```

`check:admin` runs the Stage 1 and Stage 2 structural checks, lint, type checking,
available tests and the production build. The admin test commands explicitly
allow an empty test set only when no matching tests exist; Stage 2 now adds focused
render-error tests. Next generates `next-env.d.ts` during type generation/build;
do not add application declarations to that generated file.
