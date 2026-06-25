# E-PHARMACY Pharmacy Cabinet

Frontend app for the pharmacy cabinet.

## First run

```bash
pnpm install
pnpm --filter @e-pharmacy/pharmacy dev
```

Local URL: `http://localhost:3002/pharmacy/dashboard`.

## Demo access

During local development the pharmacy cabinet can be opened through demo auth from the shared login flow or directly from the pharmacy login page.

```txt
Email: pharmacy.demo@e-pharmacy.test
Password: Pharmacy123!
```

## Checks

```bash
pnpm --filter @e-pharmacy/pharmacy lint
pnpm --filter @e-pharmacy/pharmacy type-check
pnpm --filter @e-pharmacy/pharmacy build
```

## Documentation

The pharmacy documentation is grouped inside `apps/pharmacy/docs`.

### Specification files

1. `docs/specification/00-general-overview.md` — global pharmacy principles, ownership, statuses, filter URL strategy.
2. `docs/specification/01-auth-and-access.md` — shared auth, role redirects, pharmacy registration, blocked access.
3. `docs/specification/02-layout-and-navigation.md` — Header, Sidebar, Mobile menu, Breadcrumbs, layouts.
4. `docs/specification/03-pharmacy-profile.md` — pharmacy profile, statuses, tabs, moderation, reviews.
5. `docs/specification/04-dashboard.md` — Dashboard statistics and dashboard-specific rules.
6. `docs/specification/05-orders.md` — orders table, order details, statuses, stock reservation, fixed prices.
7. `docs/specification/06-clients.md` — clients table, client details, readonly access, first order date.
8. `docs/specification/07-products.md` — products, all products, own products, product card, stock and price logic.
9. `docs/specification/08-product-requests.md` — product creation requests, draft flow, Admin moderation flow.
10. `docs/specification/09-service-pages-loaders-states.md` — error page, 404, loaders, empty states.
11. `docs/specification/10-route-structure.md` — recommended Next.js App Router structure and clean filter routes.

### Task files

- `docs/tasks/pharmacy_tasks.md` — implementation tasks.
- `docs/tasks/pharmacy-tz-full.md` — full pharmacy technical specification.

## Main decisions applied

- Table filters change URL with clean route segments.
- Pagination and rows-per-page stay in local state.
- Dashboard year/month filter applies only to Orders statistics.
- Client pharmacy date is `firstOrderAt` only.
- Order final statuses are irreversible in the first version.
- All products have one global status: `new`, `active`, `blocked`.
- Pharmacy cannot see products with `new` status.
- Product removal from pharmacy is explicitly described.
- Product request flow is strict: Draft → New → In work → Approved/Rejected.
- Auth pages are global, not part of `/pharmacy` route group.
- Protected pharmacy layout has no Footer.
