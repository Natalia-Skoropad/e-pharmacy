# Vendor Technical Specification — Dashboard

## 1. General logic

Dashboard is the main Vendor page after pharmacy login.

It shows a short overview of the current pharmacy only:

- own order statistics;
- own customer statistics;
- own medicine statistics;
- own medicine request statistics;
- quick actions;
- warnings or info banners based on pharmacy status.

Vendor must not see statistics of other pharmacies.

Admin has a separate dashboard.

## 2. Access by pharmacy status

Dashboard is available for pharmacies with statuses:

- `new`;
- `active`;
- `on_moderation`.

Dashboard is not available for `inactive` pharmacies because inactive pharmacies cannot enter the Vendor cabinet.

### New pharmacy

Dashboard shows limited statistics because the pharmacy cannot yet sell medicines, add medicines, or create medicine requests.

Banner:

```txt
Your pharmacy is not activated yet. After Admin review, you will be able to sell medicines, add products, and create medicine requests.
```

### Active pharmacy

Dashboard shows full statistics.

### Pharmacy on moderation

Dashboard shows full statistics and an additional banner:

```txt
Your changes are under moderation. Until Admin reviews them, Client pages show the previous approved data.
```

## 3. Top section

Show:

- Breadcrumbs;
- page title;
- short description;
- pharmacy status;
- status banner if needed.

Title:

```txt
Dashboard
```

Description:

```txt
View order, customer, medicine, and request statistics for your pharmacy.
```

## 4. Dashboard filters

Year and month filters are shown only above the **Orders statistics** block.

These filters affect only order statistics.

They do not affect:

- customer statistics;
- medicine statistics;
- medicine request statistics;
- total customers;
- total medicines;
- current stock value;
- request counts by status.

### Year filter

The year filter is a select.

It contains only years in which the current pharmacy has orders.

If there are no orders, show the current year.

Sort years from newest to oldest.

Example:

```txt
2026
2025
2024
```

### Month filter

The month filter is a select.

Options:

```txt
All months
January
February
March
April
May
June
July
August
September
October
November
December
```

If year + `All months` is selected, order statistics are calculated for the whole selected year.

If year + specific month is selected, order statistics are calculated only for that month.

Dashboard year/month filters do not change the URL. They are local state of the Dashboard order statistics block.

## 5. Orders statistics

Shows count and total amount of current pharmacy orders for the selected year/month.

The amount is calculated from prices fixed in orders.

Current medicine price changes do not affect already created orders.

Statuses:

| Status | Color | Shows |
|---|---|---|
| New | Blue | count and amount of new orders |
| In work | Yellow | count and amount of orders in processing |
| Successful | Green | count and completed sales amount |
| Rejected | Red | count and rejected order amount for analytics |

Each status card shows:

- status label;
- number of orders;
- total amount;
- color badge/chip;
- icon if available in design.

### Click behavior

Clicking a status card opens the Orders table with the corresponding filter in the URL.

Examples:

```txt
/vendor/orders/status-new
/vendor/orders/status-in-work
/vendor/orders/status-successful
/vendor/orders/status-rejected
```

## 6. Customers statistics

Shows analytics for customers who created at least one order for the current pharmacy.

Customers from other pharmacies are not included.

Recommended cards:

- Total customers;
- Repeat customers;
- Active customers;
- Inactive customers.

Removed from scope:

- New customers by period.

### Click behavior

Examples:

```txt
/vendor/clients
/vendor/clients/status-active
/vendor/clients/status-inactive
```

### Empty state

```txt
Your pharmacy has no customers yet.
```

Additional text:

```txt
Customers will appear after the first orders in your pharmacy.
```

## 7. Medicines statistics

Shows analytics only for medicines added to the current pharmacy.

Global Admin medicines that are not added to the current pharmacy are not included.

Cards:

- Total medicines in pharmacy;
- Active medicines;
- Inactive medicines;
- Medicines in stock;
- Out of stock medicines;
- Reserved medicines.

### Financial cards

Show:

- total stock value;
- reserved stock value;
- available stock value.

Formulas:

```txt
stockValue = stockQuantity * currentPrice
reservedValue = reservedQuantity * currentPrice
availableValue = availableQuantity * currentPrice
```

Removed from scope:

- successful sales amount by selected period;
- rejected order amount by selected period.

### Click behavior

Examples:

```txt
/vendor/medicines
/vendor/medicines/status-active
/vendor/medicines/status-inactive
/vendor/medicines/stock-empty
/vendor/medicines/stock-available
```

### Empty state

```txt
Your pharmacy has no added medicines yet.
```

Button:

```txt
View all medicines
```

## 8. Medicine request statistics

Shows only requests created by the current pharmacy.

Cards by request status:

- Draft;
- New;
- In work;
- Approved;
- Rejected.

Each card shows:

- request count;
- status color;
- short explanation.

### Click behavior

Examples:

```txt
/vendor/medicine-requests/status-draft
/vendor/medicine-requests/status-new
/vendor/medicine-requests/status-in-work
/vendor/medicine-requests/status-approved
/vendor/medicine-requests/status-rejected
```

### Empty state

```txt
Your pharmacy has no medicine creation requests yet.
```

Button:

```txt
Create request
```

## 9. Dashboard loading, error, and empty states

### Loader

Use shared component:

```txt
LoadingSpinner
```

If blocks load separately, show loader or skeleton inside each block instead of blocking the whole dashboard.

### Error state

```txt
Could not load statistics. Please try again.
```

Button:

```txt
Try again
```

### Empty states

Dashboard must not look empty if there is no data.

Show empty states for:

- no orders;
- no customers;
- no added medicines;
- no medicine requests.

## 10. Reusable dashboard components

Dashboard statistic cards should be reusable because similar cards may be needed later in Admin dashboard.

Recommended reusable components:

- `StatCard`;
- `StatusStatCard`;
- `StatGrid`;
- `DashboardSection`;
- `DashboardFilters`.
