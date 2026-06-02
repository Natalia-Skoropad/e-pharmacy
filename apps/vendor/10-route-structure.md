# Vendor Technical Specification — Recommended Route Structure

## 1. Global auth routes

Auth routes are global and shared between Client, Vendor, and Admin.

```txt
app/auth/login/page.tsx
app/auth/register/page.tsx
app/auth/forgot-password/page.tsx
```

These pages are not under `/vendor`.

After login, role `pharmacy` redirects to:

```txt
/vendor/dashboard
```

## 2. Vendor protected routes

Recommended App Router structure:

```txt
app/vendor/(protected)/layout.tsx
app/vendor/(protected)/loading.tsx
app/vendor/(protected)/error.tsx
app/vendor/(protected)/not-found.tsx

app/vendor/(protected)/dashboard/page.tsx

app/vendor/(protected)/profile/page.tsx

app/vendor/(protected)/orders/page.tsx
app/vendor/(protected)/orders/[orderId]/page.tsx
app/vendor/(protected)/orders/status-[status]/page.tsx
app/vendor/(protected)/orders/status-[status]/delivery-[delivery]/page.tsx
app/vendor/(protected)/orders/status-[status]/payment-[payment]/page.tsx

app/vendor/(protected)/clients/page.tsx
app/vendor/(protected)/clients/[clientId]/page.tsx
app/vendor/(protected)/clients/status-[status]/page.tsx

app/vendor/(protected)/medicines/page.tsx
app/vendor/(protected)/medicines/[medicineId]/page.tsx
app/vendor/(protected)/medicines/status-[status]/page.tsx
app/vendor/(protected)/medicines/stock-[stock]/page.tsx
app/vendor/(protected)/medicines/status-[status]/stock-[stock]/page.tsx

app/vendor/(protected)/all-medicines/page.tsx
app/vendor/(protected)/all-medicines/[medicineId]/page.tsx
app/vendor/(protected)/all-medicines/status-[status]/page.tsx
app/vendor/(protected)/all-medicines/category-[category]/page.tsx

app/vendor/(protected)/medicine-requests/page.tsx
app/vendor/(protected)/medicine-requests/new/page.tsx
app/vendor/(protected)/medicine-requests/[requestId]/page.tsx
app/vendor/(protected)/medicine-requests/[requestId]/edit/page.tsx
app/vendor/(protected)/medicine-requests/status-[status]/page.tsx
```

## 3. Filter route principle

Vendor table filters use clean URL route segments.

Examples:

```txt
/vendor/orders/status-new
/vendor/orders/status-successful/delivery-pickup
/vendor/clients/status-active
/vendor/medicines/status-active/stock-empty
/vendor/medicine-requests/status-draft
```

Pagination and rows-per-page are local state and are not represented in route segments.

## 4. Alternative implementation note

If the number of route segment combinations becomes too large, filters may be handled by a single page that parses optional catch-all segments.

Example:

```txt
app/vendor/(protected)/orders/[[...filters]]/page.tsx
app/vendor/(protected)/clients/[[...filters]]/page.tsx
app/vendor/(protected)/medicines/[[...filters]]/page.tsx
app/vendor/(protected)/medicine-requests/[[...filters]]/page.tsx
```

This keeps clean URLs while avoiding too many physical route files.

## 5. Recommended filter parser

Create shared route utilities:

```txt
packages/config/vendor-routes.ts
packages/utils/parseVendorFilters.ts
packages/utils/buildVendorFilterPath.ts
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
VENDOR_DASHBOARD = "/vendor/dashboard"
VENDOR_PROFILE = "/vendor/profile"
VENDOR_ORDERS = "/vendor/orders"
VENDOR_CLIENTS = "/vendor/clients"
VENDOR_MEDICINES = "/vendor/medicines"
VENDOR_ALL_MEDICINES = "/vendor/all-medicines"
VENDOR_MEDICINE_REQUESTS = "/vendor/medicine-requests"
```

Create builder functions:

```txt
getVendorOrderPath(orderId)
getVendorClientPath(clientId)
getVendorMedicinePath(medicineId)
getVendorRequestPath(requestId)
getVendorOrdersFilterPath(filters)
getVendorClientsFilterPath(filters)
getVendorMedicinesFilterPath(filters)
getVendorRequestsFilterPath(filters)
```

## 7. Metadata and indexing

Vendor protected pages should be `noindex`.

They are private working cabinet pages, not public SEO pages.

Each page must still have:

- meaningful `title`;
- meaningful description for browser/context;
- one `h1`;
- semantic section headings.
