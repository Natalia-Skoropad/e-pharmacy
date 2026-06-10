# E-PHARMACY Admin

Planned admin dashboard for the E-PHARMACY ecosystem.

## Current Status

This app is not implemented yet.

The current working parts of the project are:

- `apps/client` — client storefront
- `apps/api` — shared backend API foundation
- `packages/*` — lightweight shared workspace packages

This folder is kept as the planned app boundary for future development.

## Planned Purpose

The admin app will be a private dashboard for platform-level management.

Planned administrators will be able to:

- View dashboard statistics
- Manage orders
- Manage products
- Manage clients
- Manage suppliers
- Use filters, tables, pagination, and modal forms
- Support internal moderation and management workflows

## Planned Tech Stack

The expected frontend stack is aligned with the client app:

- Next.js
- React
- TypeScript
- CSS Modules
- Shared workspace packages where reuse is useful

The admin app should use the same shared backend API from `apps/api`. It should not introduce a separate duplicated backend.

## Planned Structure

The final structure may change during implementation, but the expected direction is:

```txt
apps/admin/
  public/
  src/
    app/
      login/
      dashboard/
      orders/
      products/
      clients/
      suppliers/
    components/
    hooks/
    lib/
    providers/
    services/
    styles/
    types/
```

## Planned Backend Areas

The existing API can later be expanded with admin modules:

- Admin auth/current user
- Dashboard statistics
- Orders management
- Products management
- Clients management
- Suppliers CRUD
- Moderation workflows

## Local Development

There is no runnable admin app package yet, so there is currently no `pnpm dev:admin` script.

When the app is implemented, the expected monorepo flow will be similar to:

```bash
pnpm install
pnpm dev:admin
```

## Note

This README is intentionally short because the app is roadmap-only. Detailed implementation documentation should be added after real code exists.
