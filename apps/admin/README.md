# E-PHARMACY Admin

Private administration application on **http://localhost:3001**.

**Status:** application shell, shared status fallbacks, shared/backend admin auth foundation, and centralized protected-route session boundary implemented; admin auth UI and business modules pending.

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


## Stage 3 scope

- Shared login and password-recovery payloads now support `application: 'admin'` alongside client and pharmacy.
- Backend login and forgot-password validation accepts the same three applications while public registration still rejects `role: 'admin'`.
- Admin password-reset links resolve through `ADMIN_APP_URL`; development/test can use the canonical `http://localhost:3001` fallback, while production does not fall back to the client application.
- The first admin is created only through the trusted one-time `pnpm seed:admin-owner` script using temporary `ADMIN_OWNER_*` environment values.
- Re-running the bootstrap with the same admin is a no-op; it never rewrites the password. A different existing admin or an email/phone conflict fails closed.
- Stage 3 intentionally does not add Login, Password Recovery, Reset Password, BFF auth routes, `AdminProtectedRoute`, permissions, employees, or cabinet shell UI.
- `check:admin-auth-foundation` protects these boundaries.

## Validation

```bash
pnpm check:admin-status-pages
pnpm check:admin-auth-foundation
pnpm check:admin-protected-route
pnpm check:admin
pnpm check:before-deploy
```

`check:admin` runs the Stage 1–4 structural checks, lint, type checking,
available tests and the production build. The admin test commands explicitly
allow an empty test set only when no matching tests exist; Stage 2 now adds focused
render-error tests. Next generates `next-env.d.ts` during type generation/build;
do not add application declarations to that generated file.

## Stage 4 scope

- `AdminProviders` now adds a thin shared `AuthProviderCore` wrapper with
  `bootstrapMode="always"`, `getCurrentUser`, and `logout` only.
- Browser session bootstrap uses same-origin `GET /api/auth/me`; logout uses
  same-origin `POST /api/auth/logout`. Tokens and backend origins remain hidden
  from browser code.
- `apps/admin/src/app/admin/layout.tsx` protects every future `/admin/*` route
  through one `AdminProtectedRoute` boundary.
- Access requires an authenticated user with `role: 'admin'` and
  `status: 'active'`.
- Unauthenticated sessions are routed to `/login` with the requested local
  destination preserved. The Login page itself is intentionally not implemented
  in Stage 4 yet.
- Active client accounts are returned to the configured client application;
  active pharmacy accounts are returned to the configured pharmacy dashboard.
- Cross-application destinations are validated and allowlisted. Missing or
  unsafe production configuration fails closed with shared status UI instead of
  creating redirect loops.
- Authentication-service outages render the shared recoverable `ErrorPage` and
  retry through `retryAuthBootstrap` rather than treating an unknown session as
  a guest.
- Blocked sessions remain owned by the existing backend/BFF auth lifecycle:
  `AUTH_USER_BLOCKED` invalidates the browser auth cookies and the guard then
  routes the unauthenticated state to Login. No second logout request is added.
- Stage 4 does not add Login/Recovery/Reset UI, admin cabinet shell/navigation,
  Dashboard, permissions, employees, or any business module.
- `check:admin-protected-route` protects the Stage 4 boundary contract.
