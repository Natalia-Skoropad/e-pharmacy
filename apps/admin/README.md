# E-PHARMACY Admin

Private administration application on **http://localhost:3001**.

**Status:** application shell implemented; business modules pending.

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

The dashboard destination currently returns 404. This is expected at this stage.
Custom error/loading pages, auth, BFF routes, cabinet navigation and business
modules belong to later stages.

## Validation

```bash
pnpm check:admin
pnpm check:before-deploy
```

`check:admin` runs structural checks, lint, type checking, available tests and
production build. The admin test commands explicitly allow an empty test set
until tests are introduced; other applications retain the default strict behavior.
Next generates `next-env.d.ts` during type generation/build;
do not add application declarations to that generated file.
