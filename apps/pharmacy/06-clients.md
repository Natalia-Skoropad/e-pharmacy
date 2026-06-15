# Pharmacy Technical Specification — clients

## 1. General logic

Clients are created only through self-registration in the Client part.

Admin can edit clients and change client status.

Pharmacy cannot create, edit, block, delete, or change client status.

Pharmacy can only view clients who created at least one order for the current pharmacy.

Pharmacy cannot see:

- all system clients;
- clients of other pharmacies;
- orders of the same client from other pharmacies.

## 2. client statuses

| Status     | Color | Meaning                                            |
| ---------- | ----- | -------------------------------------------------- |
| `active`   | Green | client can use account and create orders           |
| `blocked` | Red   | client is blocked or temporarily disabled by Admin |

When Admin sets client status to `blocked`, Admin must provide a required blocking reason.

## 3. Active client

Can:

- enter Client cabinet;
- edit own data without moderation;
- create orders;
- view own orders;
- leave reviews.

Can be changed to `inactive` only by Admin.

## 4. Blocked client

Cannot:

- enter Client cabinet;
- create new orders;
- edit own data;
- leave reviews.

Can be changed back to `active` only by Admin.

Login message:

```txt
Your account is temporarily blocked. Please contact administration for details.
```

## 5. Own client definition

A Pharmacy own client is a v who created at least one order for the current pharmacy.

client appears in Pharmacy clients table by the date of the first order created for this pharmacy.

The specification uses only one Pharmacy client date:

```txt
firstOrderAt
```

This date is shown in the clients table and on the client details page.

Do not show client system registration date in Pharmacy UI in the first version.

## 6. clients table

Route:

```txt
/pharmacy/clients
```

The table shows only clients who ordered from the current pharmacy.

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

## 7. clients table filters

Filters must change URL using clean filter routes.

Examples:

```txt
/pharmacy/clients/status-active
/pharmacy/clients/status-blocked
/pharmacy/clients/date-from-2026-01-01/date-to-2026-01-31
```

Pagination and rows-per-page do not change URL.

Filters:

- date filter by `firstOrderAt`;
- search by name;
- search by client ID;
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

This is the date when the client first created an order for the current pharmacy.

### Status options

```txt
All
Active
Inactive
```

## 8. clients table columns

Columns:

- client ID;
- Photo;
- First order date;
- Name;
- Email;
- Phone;
- Address;
- Successful orders count for this pharmacy;
- Successful orders amount for this pharmacy;
- Status.

### client ID

Global across the Admin system.

Sortable.

### Photo

Use shared `AvatarImage`.

If photo is missing, show fallback avatar.

### First order date

Shows when the client first ordered from the current pharmacy.

Field:

```txt
firstOrderAt
```

Sortable.

Date format must be the same in Pharmacy, Client, and Admin.

### Name

Click opens client details page.

### Email, phone, address

Readonly.

If address is missing, show:

```txt
Not specified
```

### Successful orders count

Count only orders of this client for the current pharmacy with status `successful`.

Orders from other pharmacies are not counted.

### Successful orders amount

Sum only successful orders of this client for the current pharmacy.

Use fixed order prices.

### Status

Show badge/chip:

- Active — green;
- Inactive — red.

## 9. clients table pagination

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

## 10. clients table states

Loader:

```txt
Loading clients...
```

Empty state:

```txt
Your pharmacy has no clients yet.
```

Nothing found state:

```txt
No clients found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 11. One client page

Route:

```txt
/pharmacy/clients/[clientId]
```

The page shows client details and client orders for the current pharmacy only.

pharmacy can only view client data.

pharmacy cannot:

- edit client name;
- edit email;
- edit phone;
- edit address;
- edit photo;
- edit status;
- edit password;
- edit personal settings.

If client does not belong to the current pharmacy, show not found or access denied state.

## 12. client page top section

Show:

- Breadcrumbs;
- page title;
- short description.

Title example:

```txt
client: John Smith
```

Description:

```txt
View client information, statistics, and orders for your pharmacy.
```

## 13. client info block

Show:

- photo;
- name;
- first order date;
- client ID;
- email;
- phone;
- address;
- status.

All fields are readonly.

Use `AvatarImage` for photo.

## 14. client statistics

Shows order statistics for this client and current pharmacy only.

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

## 15. client orders table

Shows all orders of this client for the current pharmacy.

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
- client comment;
- Total quantity;
- Total amount;
- Status.

Order number opens one order page.

## 16. client page states

Loader:

```txt
Loading client data...
```

Error state:

```txt
Could not load client data. Please try again.
```

Button:

```txt
Try again
```

Not found state:

```txt
client not found.
```

client orders empty state:

```txt
This client has no orders in your pharmacy yet.
```

This state is a fallback only. Normally such client should not appear in pharmacy clients list.

Nothing found state:

```txt
No orders found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 17. client page technical actions

Toast may be used only for small technical actions, such as copying data.

Examples:

```txt
client email copied.
client phone copied.
client ID copied.
Could not load data. Please try again.
```
