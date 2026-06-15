# Pharmacy Technical Specification — General Overview

## 1. Purpose

The Pharmacy part is the pharmacy cabinet in the E-PHARMACY ecosystem. It allows a pharmacy to manage its own profile, orders, clients, products, product creation requests, and dashboard statistics.

The Pharmacy app works together with:

- **Client** — public storefront where clients browse pharmacies, products, cart, checkout, orders, and reviews.
- **Admin** — back-office where administrators moderate pharmacies, manage global products, review requests, view orders, and manage clients.
- **API** — shared backend for all apps.
- **Shared packages** — reusable UI, types, validation, config, API client, and utilities.

At this stage, this Pharmacy specification is the source of truth for future Pharmacy implementation. Existing backend/client code may need to be gradually aligned with it.

## 2. Main Pharmacy areas

The Pharmacy app consists of the following global parts:

1. **Auth and access**
   - shared login/register/password-recovery pages;
   - pharmacy registration;
   - role-based redirects;
   - access restrictions by pharmacy status.

2. **Layout and navigation**
   - Header;
   - Sidebar;
   - Mobile menu;
   - Breadcrumbs;
   - protected Pharmacy layout without Footer;
   - public auth layout that may reuse the Client auth layout.

3. **Dashboard**
   - pharmacy status banner;
   - order statistics;
   - client statistics;
   - product statistics;
   - product request statistics;
   - quick transitions to filtered tables.

4. **Pharmacy profile**
   - own pharmacy data;
   - pharmacy description;
   - payment details;
   - reviews;
   - pending moderation data.

5. **Orders**
   - own orders table;
   - one order page;
   - status transitions;
   - stock reservation and final stock write-off;
   - fixed order prices.

6. **Clients**
   - own clients table;
   - one client page;
   - readonly client data;
   - client statistics for the current pharmacy only.

7. **products**
   - own products table;
   - all products table;
   - one product card;
   - global product data from Admin;
   - pharmacy-specific product stock and price data.

8. **Product creation requests**
   - requests table;
   - create/edit request page;
   - request details page;
   - request moderation flow through Admin.

9. **Service pages and states**
   - error page;
   - 404 page;
   - loaders;
   - empty states;
   - nothing found states.

## 3. Core access principle

Pharmacy always sees and works only with the data of the current pharmacy.

Pharmacy must not see:

- orders of other pharmacies;
- clients who never ordered from this pharmacy;
- orders of a client from other pharmacies;
- pharmacy-specific product data of other pharmacies;
- product requests of other pharmacies;
- Admin-only internal fields;
- products with the global status `new`.

## 4. Main data ownership rules

### Client owns

- client registration;
- client profile editing;
- cart;
- checkout;
- order creation;
- client reviews.

### Pharmacy owns

- own pharmacy profile editing according to status rules;
- own order processing;
- own client list viewing;
- own products list management;
- product creation request drafts and submissions;
- own dashboard analytics.

### Admin owns

- pharmacy moderation;
- pharmacy activation/deactivation;
- client blocking/unblocking;
- global product creation/editing/status changes;
- product request review;
- review moderation;
- global system overview.

## 5. Status color convention

The same colors must be used consistently across Dashboard, tables, details pages, badges, chips, and Admin views.

| Meaning                        | Color  |
| ------------------------------ | ------ |
| New                            | Blue   |
| In work / On moderation        | Yellow |
| Active / Successful / Approved | Green  |
| Blocked / Rejected            | Red    |
| Draft                          | Gray   |

## 6. Filter URL strategy

Pharmacy table filters must change the URL. Pagination and rows-per-page must not change the URL.

Use clean filter routes instead of query params for table filters.

Recommended examples:

```txt
/pharmacy/orders/status-new
/pharmacy/orders/status-successful/delivery-pickup
/pharmacy/clients/status-active
/pharmacy/products/status-active/stock-empty
/pharmacy/product-requests/status-draft
```

Do not use pagination or rows-per-page in the URL:

```txt
/pharmacy/orders?status=new&page=3&limit=50
```

### URL rules

Pharmacy in URL:

- business filters;
- status filters;
- category filters;
- stock filters;
- delivery filters;
- payment filters;
- date filters;
- search filters after debounce when needed.

Keep in local state:

- current page;
- rows per page;
- mobile filters open/closed state;
- loading state;
- active UI-only controls.

## 7. Shared UI language

pharmacy UI is written in English. All user-facing texts, buttons, toasts, empty states, and modal messages in this specification are provided in English.

## 8. Reusable components

pharmacy should reuse existing shared components where possible:

- `Button`;
- `ButtonLink`;
- `Container`;
- `Breadcrumbs`;
- `Tabs`;
- `ConfirmActionModal`;
- `Toast`;
- `LoadingSpinner`;
- `Pagination`;
- `SearchInput`;
- `SelectField`;
- `AvatarImage`;
- `ProfilePhotoCard`;
- `RatingSummary`;
- existing form-field components.

New common components should be created only when the UI pattern will be reused across Client, Pharmacy, or Admin.
