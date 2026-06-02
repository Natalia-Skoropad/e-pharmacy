# Vendor Technical Specification — Customers

## 1. General logic

Customers are created only through self-registration in the Client part.

Admin can edit customers and change customer status.

Vendor cannot create, edit, block, delete, or change customer status.

Vendor can only view customers who created at least one order for the current pharmacy.

Vendor cannot see:

- all system customers;
- customers of other pharmacies;
- orders of the same customer from other pharmacies.

## 2. Customer statuses

| Status | Color | Meaning |
|---|---|---|
| `active` | Green | Customer can use account and create orders |
| `inactive` | Red | Customer is blocked or temporarily disabled by Admin |

When Admin sets customer status to `inactive`, Admin must provide a required blocking reason.

## 3. Active customer

Can:

- enter Client cabinet;
- edit own data without moderation;
- create orders;
- view own orders;
- leave reviews.

Can be changed to `inactive` only by Admin.

## 4. Inactive customer

Cannot:

- enter Client cabinet;
- create new orders;
- edit own data;
- leave reviews.

Can be changed back to `active` only by Admin.

Login message:

```txt
Your account is temporarily inactive. Please contact administration for details.
```

## 5. Own customer definition

A Vendor own customer is a customer who created at least one order for the current pharmacy.

Customer appears in Vendor customers table by the date of the first order created for this pharmacy.

The specification uses only one Vendor customer date:

```txt
firstOrderAt
```

This date is shown in the customers table and on the customer details page.

Do not show customer system registration date in Vendor UI in the first version.

## 6. Customers table

Route:

```txt
/vendor/clients
```

The table shows only customers who ordered from the current pharmacy.

Default sorting:

```txt
firstOrderAt: desc
```

Use shared components:

- `Container`;
- `Breadcrumbs`;
- `Pagination`;
- `LoadingSpinner`;
- `SearchInput`;
- `SelectField`;
- `ResetFiltersButton`;
- `CloseIconButton`.

## 7. Customers table filters

Filters must change URL using clean filter routes.

Examples:

```txt
/vendor/clients/status-active
/vendor/clients/status-inactive
/vendor/clients/date-from-2026-01-01/date-to-2026-01-31
```

Pagination and rows-per-page do not change URL.

Filters:

- date filter by `firstOrderAt`;
- search by name;
- search by customer ID;
- search by email;
- search by phone;
- search by address;
- status select.

Search fields should use debounce before updating URL.

### Date filter

Supports:

- one date;
- date range.

Works by:

```txt
firstOrderAt
```

This is the date when the customer first created an order for the current pharmacy.

### Status options

```txt
All
Active
Inactive
```

## 8. Customers table columns

Columns:

- Customer ID;
- Photo;
- First order date;
- Name;
- Email;
- Phone;
- Address;
- Successful orders count for this pharmacy;
- Successful orders amount for this pharmacy;
- Status.

### Customer ID

Global across the Admin system.

Sortable.

### Photo

Use shared `AvatarImage`.

If photo is missing, show fallback avatar.

### First order date

Shows when the customer first ordered from the current pharmacy.

Field:

```txt
firstOrderAt
```

Sortable.

Date format must be the same in Vendor, Client, and Admin.

### Name

Click opens customer details page.

### Email, phone, address

Readonly.

If address is missing, show:

```txt
Not specified
```

### Successful orders count

Count only orders of this customer for the current pharmacy with status `successful`.

Orders from other pharmacies are not counted.

### Successful orders amount

Sum only successful orders of this customer for the current pharmacy.

Use fixed order prices.

### Status

Show badge/chip:

- Active — green;
- Inactive — red.

## 9. Customers table pagination

Use shared `Pagination`.

Pagination does not affect URL.

Default rows per page:

```txt
20
```

Rows per page options:

```txt
20
50
100
```

Rows-per-page state is local.

## 10. Customers table states

Loader:

```txt
Loading customers...
```

Empty state:

```txt
Your pharmacy has no customers yet.
```

Nothing found state:

```txt
No customers found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 11. One customer page

Route:

```txt
/vendor/clients/[clientId]
```

The page shows customer details and customer orders for the current pharmacy only.

Vendor can only view customer data.

Vendor cannot:

- edit customer name;
- edit email;
- edit phone;
- edit address;
- edit photo;
- edit status;
- edit password;
- edit personal settings.

If customer does not belong to the current pharmacy, show not found or access denied state.

## 12. Customer page top section

Show:

- Breadcrumbs;
- page title;
- short description.

Title example:

```txt
Customer: John Smith
```

Description:

```txt
View customer information, statistics, and orders for your pharmacy.
```

## 13. Customer info block

Show:

- photo;
- name;
- first order date;
- customer ID;
- email;
- phone;
- address;
- status.

All fields are readonly.

Use `AvatarImage` for photo.

## 14. Customer statistics

Shows order statistics for this customer and current pharmacy only.

Statuses:

- New;
- In work;
- Successful;
- Rejected.

For each status show:

- order count;
- order amount.

Rules:

- orders from other pharmacies are not counted;
- amounts use fixed order prices;
- rejected amount is shown for analytics and is not counted as revenue.

## 15. Customer orders table

Shows all orders of this customer for the current pharmacy.

Default sorting:

```txt
createdAt: desc
```

Filters:

- date filter;
- order number search;
- status select;
- delivery method select;
- payment method select.

Filter URLs follow the same clean route strategy as the main Orders table.

Columns:

- Order number;
- Order date;
- Delivery method;
- Payment method;
- Customer comment;
- Total quantity;
- Total amount;
- Status.

Order number opens one order page.

## 16. Customer page states

Loader:

```txt
Loading customer data...
```

Error state:

```txt
Could not load customer data. Please try again.
```

Button:

```txt
Try again
```

Not found state:

```txt
Customer not found.
```

Customer orders empty state:

```txt
This customer has no orders in your pharmacy yet.
```

This state is a fallback only. Normally such customer should not appear in Vendor customers list.

Nothing found state:

```txt
No orders found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 17. Customer page technical actions

Toast may be used only for small technical actions, such as copying data.

Examples:

```txt
Customer email copied.
Customer phone copied.
Customer ID copied.
Could not load data. Please try again.
```
