# Pharmacy Technical Specification — Products

## 1. General logic

Products are created and edited only in Admin.

Pharmacy cannot create or edit global product data directly.

Pharmacy can add existing active Admin products to the current pharmacy.

Pharmacy works with pharmacy-specific product data:

- stock quantity;
- reserved quantity;
- available quantity;
- current price;
- date added to pharmacy.

Price and stock quantity are not edited manually in Pharmacy. They come from an external pharmacy system through API.

## 2. Global product statuses

All products in the system have one global status, regardless of which table they are shown in.

| Status     | Color | Meaning                                                     | Visible to Pharmacy |
| ---------- | ----- | ----------------------------------------------------------- | ------------------- |
| `new`      | Blue  | Product created in Admin but not activated yet             | No                  |
| `active`   | Green | Product can be added to pharmacies                         | Yes                 |
| `inactive` | Red   | Product is temporarily or permanently deactivated by Admin | Yes                 |

The `new` status is visible only to Admin.

Pharmacy never sees products with status `new`.

## 3. Global product data

Global data belongs to Admin:

- product ID;
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

## 4. Pharmacy product data

A pharmacy product is a relation between pharmacy and global product.

Fields:

- pharmacyProductId;
- productId;
- pharmacyId;
- stockQuantity;
- reservedQuantity;
- availableQuantity;
- currentPrice;
- addedAt;
- updatedAt.

Pharmacy sees and works only with pharmacy product data of the current pharmacy.

## 5. Active products

Active products:

- are visible in Pharmacy all products table;
- can be added to current pharmacy;
- can appear in Client only after being added to at least one active or on-moderation pharmacy;
- can be changed to inactive only by Admin.

Product appears in Client only if:

- product status is `active`;
- pharmacy status is `active` or `on_moderation`;
- product is added to this pharmacy;
- pharmacy product relation is not removed or blocked;
- available quantity allows purchase.

## 6. Inactive products

Inactive products:

- are visible in Pharmacy all products table;
- cannot be added to a pharmacy;
- can be visible in Pharmacy own products if they were previously added;
- do not appear in Client;
- keep order history, statistics, and stock movement history;
- cannot be added to new orders.

If inactive product already exists in old orders, it remains in order history.

Admin must provide a required reason when setting product status to `inactive`.

## 7. Price and stock synchronization

`stockQuantity` and `currentPrice` come from an external pharmacy program through API.

Pharmacy does not manually edit:

- current price;
- stock quantity.

System must also send external API information about:

- sold products;
- reserved products;
- cancelled reservations;
- returned stock after rejected orders.

If external API updates price, the new price applies only to new order items.

Existing order item prices remain fixed.

## 8. Reserved and available quantity

Reserved quantity is quantity included in orders with statuses:

- `new`;
- `in_progress`.

Formula:

```txt
availableQuantity = stockQuantity - reservedQuantity
```

When order becomes `successful`:

- reserved quantity is permanently written off.

When order becomes `rejected`:

- reserved quantity returns to available stock.

## 9. Own products table

Route:

```txt
/pharmacy/products
```

Shows only products added to the current pharmacy.

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

## 10. Own products filters

Filters must change URL using clean filter routes.

Examples:

```txt
/pharmacy/products/status-active
/pharmacy/products/status-inactive
/pharmacy/products/stock-empty
/pharmacy/products/status-active/stock-available
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

## 11. Own products columns

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
pharmacyProduct.addedAt
```

Sortable.

### Article

Field:

```txt
product.article
```

Global and unique across Admin system.

Sortable.

### Name

Field:

```txt
product.name
```

Click opens product details page.

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

If `availableQuantity = 0`, product is not available for new orders and cannot be purchased in Client.

### Current price

Field:

```txt
currentPrice
```

Comes from external API.

Readonly in Pharmacy.

### Status

Shows the global product status:

- Active — green;
- Inactive — red.

## 12. Own products table states

Loader:

```txt
Loading products...
```

Empty state:

```txt
Your pharmacy has no added products yet.
```

Button:

```txt
View all products
```

Nothing found state:

```txt
No products found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 13. All products table

Route:

```txt
/pharmacy/all-products
```

Shows Admin products that Pharmacy can view:

- `active` products;
- `inactive` products.

Does not show `new` products.

Pharmacy can add only `active` products to own pharmacy.

Inactive products are visible but cannot be added.

## 14. All products filters

Same as own products table.

Date filter works by global product creation date in Admin:

```txt
product.createdAt
```

Filter examples:

```txt
/pharmacy/all-products/status-active
/pharmacy/all-products/status-inactive
/pharmacy/all-products/category-antibiotics
```

## 15. All products columns

Columns:

- Created date in Admin;
- Article;
- Name;
- Category;
- Status;
- Added to my pharmacy;
- Action.

## 16. All products actions

For active products not added to current pharmacy:

```txt
Add to pharmacy
```

For active products already added:

```txt
Added to your pharmacy
```

For inactive products:

```txt
Unavailable
```

Adding product opens `ConfirmActionModal`.

Modal text:

```txt
Are you sure you want to add this product to your pharmacy?
```

Success toast:

```txt
Product added to your pharmacy.
```

Error toasts:

```txt
This product is already added to your pharmacy.
Inactive products cannot be added to a pharmacy.
Could not add product. Please try again.
```

## 17. Initial pharmacy product values

When product is added to pharmacy, create pharmacy-product relation.

Initial values may be:

```txt
stockQuantity: 0
reservedQuantity: 0
availableQuantity: 0
currentPrice: null or 0
```

until external API synchronization provides real data.

## 18. Removing product from own pharmacy

This action is available from the All products table.

Pharmacy can remove product from own pharmacy only if:

- product was added to the pharmacy;
- there are no orders with this product;
- `reservedQuantity = 0`;
- `stockQuantity = 0` or data has not yet been synchronized from external API;
- pharmacy status is `active` or `on_moderation`.

Before removal, open `ConfirmActionModal`.

Modal title:

```txt
Remove product from pharmacy?
```

Modal message:

```txt
This product will be removed from your pharmacy list. You can do this only if the product has no orders, no reserved quantity, and no stock quantity.
```

Confirm button:

```txt
Remove product
```

After removal:

- `pharmacyProduct` relation is deleted; or
- `pharmacyProduct` receives `status="removed"`.

If there are any orders with this product, removal is not available.

Disabled explanation:

```txt
This product cannot be removed because it already has order history.
```

## 19. Product details page

Route examples:

```txt
/pharmacy/products/[productId]
/pharmacy/all-products/[productId]
```

The product card is the same regardless of entry point.

If product is added to current pharmacy, show:

- global product data;
- pharmacy-specific data;
- stock;
- reserves;
- current price;
- statistics;
- stock movement;
- related orders;
- characteristics;
- reviews.

If product is not added to current pharmacy, show only global data and Add to pharmacy action if product is active.

## 20. Product details top section

Show:

- Breadcrumbs;
- product name;
- short description.

Description if product is added:

```txt
View product details, stock, reserves, price, and sales statistics for your pharmacy.
```

Description if product is not added:

```txt
View product details and add it to your pharmacy if it is available.
```

## 21. Product summary block

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

If product is not added:

```txt
This product is not added to your pharmacy yet.
```

## 22. Product details tabs

Use shared `Tabs`.

Tabs:

- Statistics;
- Stock movement;
- Related orders;
- Characteristics;
- Reviews.

If product is not added:

- Statistics shows empty state;
- Stock movement shows empty state;
- Related orders shows empty state;
- Characteristics is available;
- Reviews is available.

## 23. Tab: Statistics

Available only for products added to current pharmacy.

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
This product is not added to your pharmacy, so statistics are unavailable.
```

## 24. Tab: Stock movement

Shows history of product quantity and price events.

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
This product is not added to your pharmacy, so stock movement is unavailable.
```

## 25. Tab: Related orders

Shows orders of current pharmacy that include this product.

Columns:

- order number;
- order date;
- client;
- quantity of this product;
- fixed unit price in this order;
- amount for this product;
- order status.

Order number opens order details page.

Empty state:

```txt
There are no orders with this product yet.
```

If not added:

```txt
This product is not added to your pharmacy, so related orders are unavailable.
```

## 26. Tab: Characteristics

Shows characteristics from Admin.

Pharmacy cannot edit them.

Use the same style as Client product details.

Show only existing fields. Do not render empty rows.

Empty state:

```txt
Characteristics for this product have not been added yet.
```

## 27. Tab: Reviews

Pharmacy can only view product reviews.

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
This product has no reviews yet.
```

## 28. Product details states

Loader:

```txt
Loading product data...
```

Error state:

```txt
Could not load product data. Please try again.
```

Button:

```txt
Try again
```

Not found state:

```txt
Product not found.
```

Pharmacy must not see:

- products with status `new`;
- pharmacy-specific product data of other pharmacies.
