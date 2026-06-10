# Vendor Technical Specification — Orders

## 1. General logic

Orders are created only by clients through the Client checkout.

Vendor processes only orders that belong to the current pharmacy.

Admin can view orders but does not create or edit them.

After client confirms checkout:

- order is created;
- order status becomes `new`;
- ordered medicines are reserved in stock;
- order cannot be deleted;
- prices are fixed in the order.

## 2. Order statuses

| Status       | Color  | Meaning                                  |
| ------------ | ------ | ---------------------------------------- |
| `new`        | Blue   | Order was confirmed by client            |
| `in_work`    | Yellow | Vendor accepted the order for processing |
| `successful` | Green  | Order is completed                       |
| `rejected`   | Red    | Order was rejected by Vendor             |

For `rejected` status, Vendor must provide a required rejection reason.

## 3. Allowed status transitions

Allowed transitions:

```txt
new → in_work
in_work → successful
in_work → rejected
```

Not allowed:

```txt
new → successful
new → rejected
in_work → new
successful → in_work
rejected → in_work
successful → new
rejected → new
successful → rejected
rejected → successful
```

Status changes are final for the first version. Orders cannot be moved back from `successful` or `rejected`.

Every status change must be confirmed in `ConfirmActionModal`.

## 4. Final status modal message

When changing order status to `successful`, show a modal warning:

Title:

```txt
Complete order?
```

Message:

```txt
This action will mark the order as completed and permanently write off the reserved medicines from stock. This status change cannot be reverted.
```

Confirm button:

```txt
Complete order
```

Cancel button:

```txt
Cancel
```

When changing order status to `rejected`, show a modal warning with required rejection reason:

Title:

```txt
Reject order?
```

Message:

```txt
This action will reject the order and return reserved medicines to available stock. This status change cannot be reverted.
```

Textarea label:

```txt
Rejection reason
```

Textarea placeholder:

```txt
Explain why this order is being rejected.
```

Confirm button:

```txt
Reject order
```

The confirm button is disabled until rejection reason is filled.

## 5. Stock reservation rules

When order is created by client:

- medicines are reserved;
- reserved quantity is not available for other orders;
- order status is `new`.

In statuses `new` and `in_work`:

- medicines remain reserved.

When order becomes `successful`:

- reserved medicines are permanently written off from stock;
- order is completed;
- total order amount remains fixed.

When order becomes `rejected`:

- reserved medicines return to available stock;
- items become available for other orders;
- order prices remain unchanged.

If Vendor changes item quantity in `in_work` status:

- reservation is recalculated;
- available stock must be checked.

If Vendor adds a new item in `in_work` status:

- item is reserved;
- current price is fixed at the moment of adding.

If Vendor removes an item in `in_work` status:

- reservation for this item is cancelled.

## 6. Fixed price rules

The order item price is fixed when the item enters the order.

If Vendor changes quantity for an item that already exists in the order, unit price remains the same as the fixed price of that order item.

If Vendor adds a new item that was not previously in the order, current price is fixed at the moment of adding.

Current catalog or Vendor price changes do not affect already created order items.

## 7. Orders table

Route:

```txt
/vendor/orders
```

The table shows only orders of the current pharmacy.

Default sorting:

```txt
createdAt: desc
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

## 8. Orders table filters

Filters must change URL using clean filter routes.

Filter examples:

```txt
/vendor/orders/status-new
/vendor/orders/status-in-work
/vendor/orders/status-successful
/vendor/orders/status-rejected
/vendor/orders/status-successful/delivery-pickup
/vendor/orders/status-in-work/payment-cash
```

Pagination and rows-per-page do not change URL.

Filters:

- date filter;
- client search;
- order number search;
- status select;
- delivery method select;
- payment method select.

Search fields should use debounce before updating URL.

### Date filter

Supports:

- one date;
- date range.

Filters orders by order creation date.

### Status options

```txt
All
New
In work
Successful
Rejected
```

### Delivery options

Must match Client checkout values:

```txt
All
Pickup from pharmacy
Post delivery
```

### Payment options

Must match Client checkout values:

```txt
All
Cash on pickup / delivery
Bank transfer
```

## 9. Orders table columns

Columns:

- Order number;
- Order date;
- client;
- Delivery method;
- Payment method;
- client comment;
- Total quantity;
- Total amount;
- Status.

### Order number

Global across the whole Admin system.

Click opens one order page.

Sortable.

### Order date

Shows order creation date.

Sortable.

Date format must be the same in Client, Vendor, and Admin.

### client

Shows client name.

Click opens client details page.

### Delivery method

Shows current delivery method.

If Vendor changed delivery method in `in_work` status, table shows updated value.

### Payment method

Shows current payment method.

If Vendor changed payment method in `in_work` status, table shows updated value.

### client comment

Show:

```txt
With comment
No comment
```

### Total quantity

Use `totalQuantity`.

### Total amount

Calculated from fixed order prices.

### Status

Show badge/chip:

- New — blue;
- In work — yellow;
- Successful — green;
- Rejected — red.

## 10. Orders table pagination

Pagination uses shared `Pagination`.

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

## 11. Orders table states

Loader:

```txt
Loading orders...
```

Empty state:

```txt
Your pharmacy has no orders yet.
```

Nothing found state:

```txt
No orders found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 12. One order page

Route:

```txt
/vendor/orders/[orderId]
```

Vendor can edit the order only when status is `in_work`.

Readonly statuses:

- `new`;
- `successful`;
- `rejected`.

## 13. Order page top section

Show:

- Breadcrumbs;
- order number;
- creation date;
- current status;
- status select;
- Save changes button.

Title example:

```txt
Order #12345
```

Meta example:

```txt
Created on March 12, 2026
```

## 14. Status select

Select shows only allowed next statuses.

| Current status | Available next status    |
| -------------- | ------------------------ |
| `new`          | `in_work`                |
| `in_work`      | `successful`, `rejected` |
| `successful`   | none                     |
| `rejected`     | none                     |

Selecting status opens confirmation modal immediately.

For `rejected`, modal includes required rejection reason.

## 15. Save changes button

Button label:

```txt
Save changes
```

Enabled only when:

- order status is `in_work`;
- changes were made;
- there are no validation errors;
- order has at least one item;
- request is not running.

On click, open `ConfirmActionModal`.

Success toast:

```txt
Order changes saved successfully.
```

Error toast:

```txt
Could not save changes. Please try again.
```

## 16. Order items section

Use Client cart item styles where possible.

For each item show:

- image;
- name;
- rating and reviews count;
- quantity controls;
- stock quantity;
- fixed price;
- remove button;
- product details link.

Editing items is available only for `in_work` status.

Vendor can:

- increase quantity;
- decrease quantity;
- remove item;
- add a new item from own active medicines.

Rules:

- quantity cannot be less than 1;
- cannot remove the last item;
- if only one item remains, remove button is disabled;
- stock availability must be checked when changing quantity;
- remove action opens `ConfirmActionModal`.

Remove modal text:

```txt
Are you sure you want to remove this item from the order?
```

## 17. Adding item to order

Allowed only in `in_work` status.

Vendor can add only medicines that are:

- active;
- in stock;
- added to the current pharmacy;
- not blocked;
- not removed.

When a new item is added:

- current price is fixed;
- item is reserved;
- order total is recalculated.

## 18. Delivery, payment, and comments

### Delivery method

Editable only in `in_work` status.

Values must match Client checkout:

```txt
Pickup from pharmacy
Post delivery
```

### Payment method

Editable only in `in_work` status.

Values must match Client checkout:

```txt
Cash on pickup / delivery
Bank transfer
```

Bank transfer can be disabled if pharmacy has no bank details.

### client comment

Readonly.

Empty text:

```txt
client did not leave a comment.
```

### Vendor comment

Editable only in `in_work` status.

Use existing `CommentInput` if available.

## 19. Order summary

Show:

- item quantity;
- total amount;
- Add products button.

Button label:

```txt
Add products
```

This button opens the same selection logic as Client `ContinueShoppingModal`, adapted for Vendor context.

Enabled only in `in_work` status.

## 20. One order states

Loader:

```txt
Loading order...
```

Error state:

```txt
Could not load the order. Please try again.
```

Button:

```txt
Try again
```

Not found state:

```txt
Order not found.
```

Vendor must not see orders of other pharmacies.
