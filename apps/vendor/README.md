# Vendor Technical Specification — E-PHARMACY

This folder contains the improved Vendor technical specification split into global parts.

## Files

1. `00-general-overview.md` — global Vendor principles, ownership, statuses, filter URL strategy.
2. `01-auth-and-access.md` — shared auth, role redirects, pharmacy registration, inactive access.
3. `02-layout-and-navigation.md` — Header, Sidebar, Mobile menu, Breadcrumbs, layouts.
4. `03-pharmacy-profile.md` — pharmacy profile, statuses, tabs, moderation, reviews.
5. `04-dashboard.md` — Dashboard statistics and dashboard-specific rules.
6. `05-orders.md` — orders table, order details, statuses, stock reservation, fixed prices.
7. `06-customers.md` — customers table, customer details, readonly access, first order date.
8. `07-medicines.md` — medicines, all medicines, own medicines, medicine card, stock and price logic.
9. `08-medicine-requests.md` — medicine creation requests, draft flow, Admin moderation flow.
10. `09-service-pages-loaders-states.md` — error page, 404, loaders, empty states.
11. `10-route-structure.md` — recommended Next.js App Router structure and clean filter routes.

## Main decisions applied

- Table filters change URL with clean route segments.
- Pagination and rows-per-page stay in local state.
- Dashboard year/month filter applies only to Orders statistics.
- Customer Vendor date is `firstOrderAt` only.
- Order final statuses are irreversible in the first version.
- All medicines have one global status: `new`, `active`, `inactive`.
- Vendor cannot see medicines with `new` status.
- Medicine removal from pharmacy is explicitly described.
- Medicine request flow is strict: Draft → New → In work → Approved/Rejected.
- Auth pages are global, not part of `/vendor` route group.
- Protected Vendor layout has no Footer.
