# E-PHARMACY Pharmacy Cabinet

Frontend application for the private pharmacy cabinet.

## First run

```bash
pnpm install
pnpm --filter @e-pharmacy/pharmacy dev
```

Local cabinet URL:

```text
http://localhost:3002/pharmacy/dashboard
```

Authentication is shared with the client application. The pharmacy app does not own a separate login page; when authentication is required it opens the shared client login route configured by `NEXT_PUBLIC_CLIENT_APP_URL`.

For the default local setup:

```text
http://localhost:3000/login
```

### Demo access

```text
Email: pharmacy.demo@e-pharmacy.test
Password: Pharmacy123!
```

## Environment

Copy the relevant values from `apps/pharmacy/.env.example`.

Pharmacy-specific runtime values include:

- `NEXT_PUBLIC_API_URL` — public backend origin used when legacy/relative product image URLs need an absolute API base.
- `API_BASE_URL` — server-side backend API origin used by the pharmacy BFF and image rewrites.
- `NEXT_PUBLIC_CLIENT_APP_URL` — shared client application origin used for login, registration and password recovery redirects.
- `BFF_PROXY_SECRET` — server-only secret shared by the Next.js BFF and `apps/api`.
- `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_LEGACY_DOMAINS`, `AUTH_COOKIE_SAME_SITE` — authentication cookie configuration.
- `BFF_TRUSTED_PROXY_PROVIDER` — trusted deployment proxy provider (`none`, `vercel` or `cloudflare`).

Do not expose server-only secrets through `NEXT_PUBLIC_*` variables.

## Checks

Run pharmacy package checks directly:

```bash
pnpm --filter @e-pharmacy/pharmacy lint
pnpm --filter @e-pharmacy/pharmacy type-check
pnpm --filter @e-pharmacy/pharmacy test
pnpm --filter @e-pharmacy/pharmacy test:react
pnpm --filter @e-pharmacy/pharmacy build
```

Or run the pharmacy aggregate check from the repository root:

```bash
pnpm check:pharmacy
```

Before deployment, run the repository-wide verification:

```bash
pnpm check:before-deploy
```

## Source archives

Use the canonical source-archive command instead of manually zipping the working tree:

```bash
pnpm archive:source
```

The source archive excludes generated dependencies, build outputs, caches, local environment files and TypeScript/Next.js generated artifacts.

## Architecture notes

- Auth pages are shared with the client application and are not part of the `/pharmacy` route tree.
- Browser requests use same-origin `/api/*` BFF routes.
- The browser does not read or construct JWT access/refresh tokens.
- Protected pharmacy pages are rendered inside the pharmacy application shell.
- The protected pharmacy layout has no footer.
