# Pharmacy Technical Specification — Medicines

## 1. General logic

Medicines are created and edited only in Admin.

Pharmacy cannot create or edit global medicine data directly.

Pharmacy can add existing active Admin medicines to the current pharmacy.

Pharmacy works with pharmacy-specific medicine data:

- stock quantity;
- reserved quantity;
- available quantity;
- current price;
- date added to pharmacy.

Price and stock quantity are not edited manually in Pharmacy. They come from an external pharmacy system through API.

## 2. Global medicine statuses

All medicines in the system have one global status, regardless of which table they are shown in.

| Status     | Color | Meaning                                                     | Visible to Pharmacy |
| ---------- | ----- | ----------------------------------------------------------- | ------------------- |
| `new`      | Blue  | Medicine created in Admin but not activated yet             | No                  |
| `active`   | Green | Medicine can be added to pharmacies                         | Yes                 |
| `inactive` | Red   | Medicine is temporarily or permanently deactivated by Admin | Yes                 |

The `new` status is visible only to Admin.

Pharmacy never sees medicines with status `new`.

## 3. Global medicine data

Global data belongs to Admin:

- medicine ID;
- article;
- name;
- category;
- description;
- image;
- manufacturer;
- dosage;
- package size;
- active substance;
- form;
- prescription type;
- storage conditions;
- country of origin;
- status;
- createdAt;
- updatedAt.

Pharmacy cannot edit these fields.

## 4. Pharmacy medicine data

A pharmacy medicine is a relation between pharmacy and global medicine.

Fields:

- pharmacyMedicineId;
- medicineId;
- pharmacyId;
- stockQuantity;
- reservedQuantity;
- availableQuantity;
- currentPrice;
- addedAt;
- updatedAt.

Pharmacy sees and works only with pharmacy medicine data of the current pharmacy.

## 5. Active medicines

Active medicines:

- are visible in Pharmacy all medicines table;
- can be added to current pharmacy;
- can appear in Client only after being added to at least one active or on-moderation pharmacy;
- can be changed to inactive only by Admin.

Medicine appears in Client only if:

- medicine status is `active`;
- pharmacy status is `active` or `on_moderation`;
- medicine is added to this pharmacy;
- pharmacy medicine relation is not removed or blocked;
- available quantity allows purchase.

## 6. Inactive medicines

Inactive medicines:

- are visible in Pharmacy all medicines table;
- cannot be added to a pharmacy;
- can be visible in Pharmacy own medicines if they were previously added;
- do not appear in Client;
- keep order history, statistics, and stock movement history;
- cannot be added to new orders.

If inactive medicine already exists in old orders, it remains in order history.

Admin must provide a required reason when setting medicine status to `inactive`.

## 7. Price and stock synchronization

`stockQuantity` and `currentPrice` come from an external pharmacy program through API.

Pharmacy does not manually edit:

- current price;
- stock quantity.

System must also send external API information about:

- sold medicines;
- reserved medicines;
- cancelled reservations;
- returned stock after rejected orders.

If external API updates price, the new price applies only to new order items.

Existing order item prices remain fixed.

## 8. Reserved and available quantity

Reserved quantity is quantity included in orders with statuses:

- `new`;
- `in_work`.

Formula:

```txt
availableQuantity = stockQuantity - reservedQuantity
```

When order becomes `successful`:

- reserved quantity is permanently written off.

When order becomes `rejected`:

- reserved quantity returns to available stock.

## 9. Own medicines table

Route:

```txt
/pharmacy/medicines
```

Shows only medicines added to the current pharmacy.

Default sorting:

```txt
addedAt: desc
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

## 10. Own medicines filters

Filters must change URL using clean filter routes.

Examples:

```txt
/pharmacy/medicines/status-active
/pharmacy/medicines/status-inactive
/pharmacy/medicines/stock-empty
/pharmacy/medicines/status-active/stock-available
```

Pagination and rows-per-page do not change URL.

Filters:

- date filter by `addedAt`;
- search by name;
- search by article;
- category select;
- status select;
- stock availability select.

Status options:

```txt
All
Active
Inactive
```

## 11. Own medicines columns

Columns:

- Added date;
- Article;
- Name;
- Category;
- Stock quantity;
- Reserved quantity;
- Available quantity;
- Current price;
- Status.

### Added date

Field:

```txt
pharmacyMedicine.addedAt
```

Sortable.

### Article

Field:

```txt
medicine.article
```

Global and unique across Admin system.

Sortable.

### Name

Field:

```txt
medicine.name
```

Click opens medicine details page.

### Stock quantity

Field:

```txt
stockQuantity
```

Comes from external API.

Readonly in pharmacy.

### Reserved quantity

Field:

```txt
reservedQuantity
```

Updated by order creation, order editing, and order status changes.

### Available quantity

Formula:

```txt
availableQuantity = stockQuantity - reservedQuantity
```

If `availableQuantity = 0`, medicine is not available for new orders and cannot be purchased in Client.

### Current price

Field:

```txt
currentPrice
```

Comes from external API.

Readonly in Pharmacy.

### Status

Shows the global medicine status:

- Active — green;
- Inactive — red.

## 12. Own medicines table states

Loader:

```txt
Loading medicines...
```

Empty state:

```txt
Your pharmacy has no added medicines yet.
```

Button:

```txt
View all medicines
```

Nothing found state:

```txt
No medicines found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 13. All medicines table

Route:

```txt
/pharmacy/all-medicines
```

Shows Admin medicines that Pharmacy can view:

- `active` medicines;
- `inactive` medicines.

Does not show `new` medicines.

Pharmacy can add only `active` medicines to own pharmacy.

Inactive medicines are visible but cannot be added.

## 14. All medicines filters

Same as own medicines table.

Date filter works by global medicine creation date in Admin:

```txt
medicine.createdAt
```

Filter examples:

```txt
/pharmacy/all-medicines/status-active
/pharmacy/all-medicines/status-inactive
/pharmacy/all-medicines/category-antibiotics
```

## 15. All medicines columns

Columns:

- Created date in Admin;
- Article;
- Name;
- Category;
- Status;
- Added to my pharmacy;
- Action.

## 16. All medicines actions

For active medicines not added to current pharmacy:

```txt
Add to pharmacy
```

For active medicines already added:

```txt
Added to your pharmacy
```

For inactive medicines:

```txt
Unavailable
```

Adding medicine opens `ConfirmActionModal`.

Modal text:

```txt
Are you sure you want to add this medicine to your pharmacy?
```

Success toast:

```txt
Medicine added to your pharmacy.
```

Error toasts:

```txt
This medicine is already added to your pharmacy.
Inactive medicines cannot be added to a pharmacy.
Could not add medicine. Please try again.
```

## 17. Initial pharmacy medicine values

When medicine is added to pharmacy, create pharmacy-medicine relation.

Initial values may be:

```txt
stockQuantity: 0
reservedQuantity: 0
availableQuantity: 0
currentPrice: null or 0
```

until external API synchronization provides real data.

## 18. Removing medicine from own pharmacy

This action is available from the All medicines table.

Pharmacy can remove medicine from own pharmacy only if:

- medicine was added to the pharmacy;
- there are no orders with this medicine;
- `reservedQuantity = 0`;
- `stockQuantity = 0` or data has not yet been synchronized from external API;
- pharmacy status is `active` or `on_moderation`.

Before removal, open `ConfirmActionModal`.

Modal title:

```txt
Remove medicine from pharmacy?
```

Modal message:

```txt
This medicine will be removed from your pharmacy list. You can do this only if the medicine has no orders, no reserved quantity, and no stock quantity.
```

Confirm button:

```txt
Remove medicine
```

After removal:

- `pharmacyMedicine` relation is deleted; or
- `pharmacyMedicine` receives `status="removed"`.

If there are any orders with this medicine, removal is not available.

Disabled explanation:

```txt
This medicine cannot be removed because it already has order history.
```

## 19. Medicine details page

Route examples:

```txt
/pharmacy/medicines/[medicineId]
/pharmacy/all-medicines/[medicineId]
```

The medicine card is the same regardless of entry point.

If medicine is added to current pharmacy, show:

- global medicine data;
- pharmacy-specific data;
- stock;
- reserves;
- current price;
- statistics;
- stock movement;
- related orders;
- characteristics;
- reviews.

If medicine is not added to current pharmacy, show only global data and Add to pharmacy action if medicine is active.

## 20. Medicine details top section

Show:

- Breadcrumbs;
- medicine name;
- short description.

Description if medicine is added:

```txt
View medicine details, stock, reserves, price, and sales statistics for your pharmacy.
```

Description if medicine is not added:

```txt
View medicine details and add it to your pharmacy if it is available.
```

## 21. Medicine summary block

Show:

- image;
- name;
- current price if added;
- rating and reviews count;
- article;
- category;
- status;
- Admin creation date;
- date added to pharmacy if added.

If medicine is not added:

```txt
This medicine is not added to your pharmacy yet.
```

## 22. Medicine details tabs

Use shared `Tabs`.

Tabs:

- Statistics;
- Stock movement;
- Related orders;
- Characteristics;
- Reviews.

If medicine is not added:

- Statistics shows empty state;
- Stock movement shows empty state;
- Related orders shows empty state;
- Characteristics is available;
- Reviews is available.

## 23. Tab: Statistics

Available only for medicines added to current pharmacy.

Show:

- stock quantity + value;
- reserved quantity + value;
- available quantity + value;
- quantity and amount in orders with status New;
- quantity and amount in orders with status In work;
- quantity and amount in orders with status Successful;
- quantity and amount in orders with status Rejected.

Data is counted only for current pharmacy.

Empty state if not added:

```txt
This medicine is not added to your pharmacy, so statistics are unavailable.
```

## 24. Tab: Stock movement

Shows history of medicine quantity and price events.

Event types:

- stock update from external API;
- price update from external API;
- reservation after order creation;
- reservation update after order editing;
- write-off after successful order;
- return to available stock after rejected order;
- reservation cancellation after item removal from order.

Recommended columns:

- date;
- event type;
- quantity;
- price;
- order number if related;
- source;
- comment.

Sources:

```txt
External API
Order
Pharmacy action
System
```

Empty state:

```txt
Stock movement history is empty.
```

If not added:

```txt
This medicine is not added to your pharmacy, so stock movement is unavailable.
```

## 25. Tab: Related orders

Shows orders of current pharmacy that include this medicine.

Columns:

- order number;
- order date;
- client;
- quantity of this medicine;
- fixed unit price in this order;
- amount for this medicine;
- order status.

Order number opens order details page.

Empty state:

```txt
There are no orders with this medicine yet.
```

If not added:

```txt
This medicine is not added to your pharmacy, so related orders are unavailable.
```

## 26. Tab: Characteristics

Shows characteristics from Admin.

Pharmacy cannot edit them.

Use the same style as Client product details.

Show only existing fields. Do not render empty rows.

Empty state:

```txt
Characteristics for this medicine have not been added yet.
```

## 27. Tab: Reviews

Pharmacy can only view medicine reviews.

Pharmacy cannot:

- create reviews;
- edit reviews;
- delete reviews;
- moderate reviews.

Show:

- client name;
- rating;
- date;
- review text.

Load more with `LazyLoadButton`.

Empty state:

```txt
This medicine has no reviews yet.
```

## 28. Medicine details states

Loader:

```txt
Loading medicine data...
```

Error state:

```txt
Could not load medicine data. Please try again.
```

Button:

```txt
Try again
```

Not found state:

```txt
Medicine not found.
```

Pharmacy must not see:

- medicines with status `new`;
- pharmacy-specific medicine data of other pharmacies.
