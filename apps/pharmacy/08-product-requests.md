# Pharmacy Technical Specification — Product Creation Requests

## 1. General logic

Product creation requests are used when a pharmacy sells or plans to sell a product that does not yet exist in the global Admin product catalog.

Examples:

- new product;
- imported product;
- rare product;
- product already in pharmacy stock but missing in the system;
- product that must be added to the global E-PHARMACY catalog.

Pharmacy cannot create global products directly.

Pharmacy can:

- create request draft;
- save draft;
- edit draft later;
- send request to Admin moderation.

Admin can:

- view submitted requests;
- move request to In work;
- complete or correct data;
- create global product from request;
- reject request with reason.

Client does not see product requests.

## 2. Request status flow

Allowed flow:

```txt
Draft → New → In work → Approved
Draft → New → In work → Rejected
```

Admin cannot approve or reject request directly from `new` status.

Admin must first move request to `in_progress`.

## 3. Request statuses

| Status     | Color  | Meaning                                               | Editable by Pharmacy |
| ---------- | ------ | ----------------------------------------------------- | -------------------- |
| `draft`    | Gray   | Pharmacy created request but did not send it to Admin | Yes                  |
| `new`      | Blue   | Pharmacy sent request; Admin has not started review   | No                   |
| `in_progress`  | Yellow | Admin is checking the request                         | No                   |
| `approved` | Green  | Admin created product from request                   | No                   |
| `rejected` | Red    | Admin rejected request                                | No                   |

For `rejected` status, Admin must provide rejection reason.

## 4. Access rules

Pharmacy sees only own requests.

Admin sees only requests submitted to moderation:

- `new`;
- `in_progress`;
- `approved`;
- `rejected`.

Admin does not see Pharmacy drafts.

Pharmacy cannot see requests of other pharmacies.

## 5. Before creating a request

Pharmacy should create a request only if the needed product does not exist in All products table.

Before creating a request, Pharmacy should check All products by:

- name;
- article;
- category;
- manufacturer if such filter exists.

If product exists and is active, Pharmacy should add it to own pharmacy instead of creating a request.

If product exists but is inactive, Pharmacy must not create a duplicate.

Message:

```txt
This product already exists in the system but is currently inactive. Please contact Admin or wait for activation.
```

## 6. Create request button

Shown above requests table.

Button label:

```txt
Create request
```

Route:

```txt
/pharmacy/product-requests/new
```

Available for pharmacy statuses:

- `active`;
- `on_moderation`.

Disabled for:

- `new`;
- `inactive`.

Disabled explanation for `new`:

```txt
You will be able to create requests after Admin activates your pharmacy.
```

Disabled explanation for `inactive`:

```txt
Your account is temporarily blocked. Creating requests is unavailable.
```

## 7. Requests table

Route:

```txt
/pharmacy/product-requests
```

Shows only requests of current pharmacy.

Default sorting:

```txt
createdAt: desc
```

The table should be visually close to All products table.

Columns:

- Created date;
- Article;
- Name;
- Category;
- Status.

Clicking request name opens request details page.

Route:

```txt
/pharmacy/product-requests/[requestId]
```

## 8. Requests table filters

Filters must change URL using clean filter routes.

Examples:

```txt
/pharmacy/product-requests/status-draft
/pharmacy/product-requests/status-new
/pharmacy/product-requests/status-in-progress
/pharmacy/product-requests/status-approved
/pharmacy/product-requests/status-rejected
```

Pagination and rows-per-page do not change URL.

Filters:

- date filter;
- search by name;
- search by article;
- category select;
- status select.

Status options:

```txt
All
Draft
New
In work
Approved
Rejected
```

## 9. Requests table pagination and states

Use shared `Pagination`.

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

Empty state:

```txt
Your pharmacy has no product creation requests yet.
```

Empty state button:

```txt
Create request
```

Nothing found state:

```txt
No requests found for the selected filters.
```

Reset button:

```txt
Reset filters
```

Loader:

```txt
Loading requests...
```

## 10. Create/edit request page

Routes:

```txt
/pharmacy/product-requests/new
/pharmacy/product-requests/[requestId]/edit
```

The page should be the same or very close to Admin create product page.

This allows Admin to use the same structure when creating product from request.

Modes:

| Mode                       | Route                                                                                                 | Description                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Create mode                | `/pharmacy/product-requests/new`                                                                     | Pharmacy creates new request        |
| Edit draft mode            | `/pharmacy/product-requests/[requestId]/edit`                                                        | Pharmacy edits draft request        |
| Admin create product mode | `/admin/product-requests/[requestId]/create-product` or `/admin/products/new?requestId={requestId}` | Admin creates product from request |

## 11. Request form fields

Fields:

- product image;
- name;
- article;
- category;
- manufacturer;
- country of origin;
- dosage;
- package size;
- form;
- active substance;
- prescription type;
- storage conditions;
- short description;
- full description;
- characteristics;
- Pharmacy comment;
- additional files/documents if needed.

## 12. Required fields for draft

To save draft, require only:

- name;
- article;
- category.

Pharmacy can save draft with partially filled data.

## 13. Required fields for moderation submission

To send request to moderation, require:

- name;
- article;
- category;
- manufacturer;
- short description;
- Pharmacy comment.

If required fields are missing:

- disable Send for moderation button; or
- show validation errors under fields after click.

## 14. Pharmacy request buttons

Buttons:

```txt
Save draft
Send for moderation
```

### Save draft

Creates or updates request with status `draft`.

Does not send request to Admin.

Success toast:

```txt
Request draft saved.
```

Error toast:

```txt
Could not save draft. Please try again.
```

### Send for moderation

Validates required fields and opens `ConfirmActionModal`.

After confirmation:

- request status changes to `new`;
- request becomes visible to Admin;
- Pharmacy can no longer edit it.

Modal title:

```txt
Send request for moderation?
```

Modal message:

```txt
After sending, you will not be able to edit this request until Admin reviews it.
```

Confirm button:

```txt
Send for moderation
```

Success toast:

```txt
Request sent for Admin moderation.
```

Error toast:

```txt
Could not send request. Please try again.
```

## 15. Admin request actions

Admin actions are described here only to clarify Pharmacy flow.

In Admin, request processing should include:

- Move to In work;
- Create product;
- Reject request;
- Save changes.

Admin can complete or correct data before creating product.

When Admin clicks Create product:

- global product is created;
- request status becomes `approved`;
- request links to the created product;
- Pharmacy sees link to created product.

When Admin rejects request:

- request status becomes `rejected`;
- rejection reason is required;
- Pharmacy sees rejection reason.

## 16. Request details page

Route:

```txt
/pharmacy/product-requests/[requestId]
```

Request card should look like a product card.

Show:

- image;
- name;
- article;
- category;
- request status;
- short description;
- characteristics;
- Pharmacy comment;
- created date;
- sent to moderation date if submitted;
- Admin comment;
- rejection reason if rejected;
- link to created product if approved.

## 17. Draft request details

If request status is `draft`, show button:

```txt
Edit request
```

Route:

```txt
/pharmacy/product-requests/[requestId]/edit
```

Info text:

```txt
This is a draft request. It has not been sent to Admin yet.
```

## 18. New or In work request details

Pharmacy cannot edit submitted requests.

For `new`, show:

```txt
The request has been sent to Admin. Please wait for review.
```

For `in_progress`, show:

```txt
Admin is reviewing this request.
```

Do not show Edit request button.

## 19. Approved request details

Show block:

```txt
Admin created a product based on this request.
```

Actions:

```txt
View product
Add to pharmacy
```

`Add to pharmacy` is shown only if created product is active and not yet added to current pharmacy.

If already added:

```txt
This product is already added to your pharmacy.
```

## 20. Rejected request details

Show rejection reason.

Example:

```txt
Rejection reason: This product already exists in the system.
```

Show optional button:

```txt
Create new request based on this one
```

## 21. Creating new request based on rejected request

The button creates a new request with status `draft`.

The new draft copies fields from the rejected request, but:

- has a new `requestId`;
- has a new `createdAt`;
- does not have previous status history;
- does not have `adminRejectReason`;
- does not have `adminComment` unless it should be visible to Pharmacy;
- is not automatically sent to moderation.

Success toast:

```txt
New draft created from rejected request.
```

## 22. Request readonly rules

Pharmacy can edit request only while status is `draft`.

Readonly statuses:

- `new`;
- `in_progress`;
- `approved`;
- `rejected`.

## 23. Disabled states

Buttons are disabled when:

- request is running;
- form has validation errors;
- required moderation fields are missing;
- pharmacy status is `new`;
- pharmacy status is `blocked`;
- request is already submitted;
- action is not allowed for current status.

## 24. Request toasts

```txt
Request draft saved.
Request updated.
Request sent for Admin moderation.
Could not save draft. Please try again.
Could not send request. Please try again.
New draft created from rejected request.
Product created based on request.
```
