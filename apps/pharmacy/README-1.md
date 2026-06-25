# pharmacy Technical Specification — E-PHARMACY

This folder contains the improved pharmacy technical specification split into global parts.

## Files

1. `00-general-overview.md` — global pharmacy principles, ownership, statuses, filter URL strategy.
2. `01-auth-and-access.md` — shared auth, role redirects, pharmacy registration, blocked access.
3. `02-layout-and-navigation.md` — Header, Sidebar, Mobile menu, Breadcrumbs, layouts.
4. `03-pharmacy-profile.md` — pharmacy profile, statuses, tabs, moderation, reviews.
5. `04-dashboard.md` — Dashboard statistics and dashboard-specific rules.
6. `05-orders.md` — orders table, order details, statuses, stock reservation, fixed prices.
7. `06-clients.md` — clients table, client details, readonly access, first order date.
8. `07-products.md` — products, all products, own products, product card, stock and price logic.
9. `08-product-requests.md` — product creation requests, draft flow, Admin moderation flow.
10. `09-service-pages-loaders-states.md` — error page, 404, loaders, empty states.
11. `10-route-structure.md` — recommended Next.js App Router structure and clean filter routes.

## Main decisions applied

- Table filters change URL with clean route segments.
- Pagination and rows-per-page stay in local state.
- Dashboard year/month filter applies only to Orders statistics.
- client pharmacy date is `firstOrderAt` only.
- Order final statuses are irreversible in the first version.
- All products have one global status: `new`, `active`, `blocked`.
- pharmacy cannot see products with `new` status.
- Product removal from pharmacy is explicitly described.
- Product request flow is strict: Draft → New → In work → Approved/Rejected.
- Auth pages are global, not part of `/pharmacy` route group.
- Protected pharmacy layout has no Footer.
