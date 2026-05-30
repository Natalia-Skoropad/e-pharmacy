# E-PHARMACY Vendor

Planned pharmacy/vendor cabinet for the E-PHARMACY ecosystem.

## Current Status

This app is not implemented yet.

The current working parts of the project are:

- `apps/client` — customer storefront
- `apps/api` — shared backend API foundation
- `packages/*` — lightweight shared workspace packages

This folder is kept as the planned app boundary for future development.

## Planned Purpose

The vendor app will be a private workspace for pharmacy owners or managers.

Planned users will be able to:

- Create and manage a pharmacy shop profile
- Edit pharmacy contact and business information
- Add, edit, and delete medicines
- Manage product availability and stock
- View pharmacy-specific product lists
- View statistics
- Inspect customer goods/order-related data

## Planned Tech Stack

The expected frontend stack is aligned with the client app:

- Next.js
- React
- TypeScript
- CSS Modules
- Shared workspace packages where reuse is useful

The vendor app should use the same shared backend API from `apps/api`. It should not introduce a separate duplicated backend.

## Planned Structure

The final structure may change during implementation, but the expected direction is:

```txt
apps/vendor/
  public/
  src/
    app/
      login/
      dashboard/
      shop/
      medicines/
      statistics/
    components/
    hooks/
    lib/
    providers/
    services/
    styles/
    types/
```

## Planned Backend Areas

The existing API can later be expanded with vendor modules:

- Vendor auth/current user
- Shop create/read/update
- Vendor-owned product CRUD
- Shop statistics
- Customer goods data
- Vendor order-related data

## Local Development

There is no runnable vendor app package yet, so there is currently no `pnpm dev:vendor` script.

When the app is implemented, the expected monorepo flow will be similar to:

```bash
pnpm install
pnpm dev:vendor
```

## Note

This README is intentionally short because the app is roadmap-only. Detailed implementation documentation should be added after real code exists.
