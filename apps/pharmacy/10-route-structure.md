# pharmacy Technical Specification — Recommended Route Structure

## 1. Global auth routes

Auth routes are global and shared between Client, pharmacy, and Admin.

```txt
app/auth/login/page.tsx
app/auth/register/page.tsx
app/auth/forgot-password/page.tsx
```

These pages are not under `/pharmacy`.

After login, role `pharmacy` redirects to:

```txt
/pharmacy/dashboard
```

## 2. pharmacy protected routes

Recommended App Router structure:

```txt
app/pharmacy/(protected)/layout.tsx
app/pharmacy/(protected)/loading.tsx
app/pharmacy/(protected)/error.tsx
app/pharmacy/(protected)/not-found.tsx

app/pharmacy/(protected)/dashboard/page.tsx

app/pharmacy/(protected)/profile/page.tsx

app/pharmacy/(protected)/orders/page.tsx
app/pharmacy/(protected)/orders/[orderId]/page.tsx
app/pharmacy/(protected)/orders/status-[status]/page.tsx
app/pharmacy/(protected)/orders/status-[status]/delivery-[delivery]/page.tsx
app/pharmacy/(protected)/orders/status-[status]/payment-[payment]/page.tsx

app/pharmacy/(protected)/clients/page.tsx
app/pharmacy/(protected)/clients/[clientId]/page.tsx
app/pharmacy/(protected)/clients/status-[status]/page.tsx

app/pharmacy/(protected)/medicines/page.tsx
app/pharmacy/(protected)/medicines/[medicineId]/page.tsx
app/pharmacy/(protected)/medicines/status-[status]/page.tsx
app/pharmacy/(protected)/medicines/stock-[stock]/page.tsx
app/pharmacy/(protected)/medicines/status-[status]/stock-[stock]/page.tsx

app/pharmacy/(protected)/all-medicines/page.tsx
app/pharmacy/(protected)/all-medicines/[medicineId]/page.tsx
app/pharmacy/(protected)/all-medicines/status-[status]/page.tsx
app/pharmacy/(protected)/all-medicines/category-[category]/page.tsx

app/pharmacy/(protected)/medicine-requests/page.tsx
app/pharmacy/(protected)/medicine-requests/new/page.tsx
app/pharmacy/(protected)/medicine-requests/[requestId]/page.tsx
app/pharmacy/(protected)/medicine-requests/[requestId]/edit/page.tsx
app/pharmacy/(protected)/medicine-requests/status-[status]/page.tsx
```

## 3. Filter route principle

pharmacy table filters use clean URL route segments.

Examples:

```txt
/pharmacy/orders/status-new
/pharmacy/orders/status-successful/delivery-pickup
/pharmacy/clients/status-active
/pharmacy/medicines/status-active/stock-empty
/pharmacy/medicine-requests/status-draft
```

Pagination and rows-per-page are local state and are not represented in route segments.

## 4. Alternative implementation note

If the number of route segment combinations becomes too large, filters may be handled by a single page that parses optional catch-all segments.

Example:

```txt
app/pharmacy/(protected)/orders/[[...filters]]/page.tsx
app/pharmacy/(protected)/clients/[[...filters]]/page.tsx
app/pharmacy/(protected)/medicines/[[...filters]]/page.tsx
app/pharmacy/(protected)/medicine-requests/[[...filters]]/page.tsx
```

This keeps clean URLs while avoiding too many physical route files.

## 5. Recommended filter parser

Create shared route utilities:

```txt
packages/config/pharmacy-routes.ts
packages/utils/parsePharmacyFilters.ts
packages/utils/buildPharmacyFilterPath.ts
```

Responsibilities:

- build URLs from filter objects;
- parse URL segments into filter objects;
- validate supported filter values;
- provide fallback for invalid filters;
- keep filter slugs consistent across Dashboard and tables.

## 6. Route constants

Create constants for all base routes:

```txt
PHARMACY_DASHBOARD = "/pharmacy/dashboard"
PHARMACY_PROFILE = "/pharmacy/profile"
PHARMACY_ORDERS = "/pharmacy/orders"
PHARMACY_CLIENTS = "/pharmacy/clients"
PHARMACY_MEDICINES = "/pharmacy/medicines"
PHARMACY_ALL_MEDICINES = "/pharmacy/all-medicines"
PHARMACY_MEDICINE_REQUESTS = "/pharmacy/medicine-requests"
```

Create builder functions:

```txt
getPharmacyOrderPath(orderId)
getPharmacyClientPath(clientId)
getPharmacyMedicinePath(medicineId)
getPharmacyRequestPath(requestId)
getPharmacyOrdersFilterPath(filters)
getPharmacyClientsFilterPath(filters)
getPharmacyMedicinesFilterPath(filters)
getPharmacyRequestsFilterPath(filters)
```

## 7. Metadata and indexing

Pharmacy protected pages should be `noindex`.

They are private working cabinet pages, not public SEO pages.

Each page must still have:

- meaningful `title`;
- meaningful description for browser/context;
- one `h1`;
- semantic section headings.
