# E-PHARMACY

E-PHARMACY is a monorepo for an online pharmacy ecosystem.

## Apps

- `apps/client` — public customer storefront
- `apps/vendor` — private pharmacy/vendor cabinet
- `apps/admin` — private admin dashboard
- `apps/api` — shared backend API

## Packages

- `packages/ui` — shared UI components
- `packages/types` — shared TypeScript types
- `packages/api-client` — shared API client
- `packages/validation` — shared validation schemas
- `packages/config` — shared configuration constants
- `packages/utils` — shared utilities

## First deliverable

The first complete deliverable is `apps/client`: the public customer storefront.

## Current status before deploy

- `apps/client` is the current deploy target and contains the finished customer storefront flow.
- `apps/api` is the shared backend used by the client and already keeps future vendor/admin modules in mind.
- `apps/vendor` and `apps/admin` are placeholders for the next stage; they are intentionally not finished in this release.
- Private/customer-only routes are excluded from sitemap/robots: cart, checkout, profile, auth pages, vendor, and admin.

## Local environment checklist

Use these values for local development:

```env
AUTH_COOKIE_SAME_SITE=lax
CLIENT_ORIGINS=http://localhost:3000
CLIENT_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Before final deploy, run:

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm check:before-deploy
```

