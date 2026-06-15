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

7. **Products**
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

| Meaning | Color |
|---|---|
| New | Blue |
| In work / On moderation | Yellow |
| Active / Successful / Approved | Green |
| Inactive / Rejected | Red |
| Draft | Gray |

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

Pharmacy UI is written in English. All user-facing texts, buttons, toasts, empty states, and modal messages in this specification are provided in English.

## 8. Reusable components

Pharmacy should reuse existing shared components where possible:

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



---

# Pharmacy Technical Specification — Auth and Access

## 1. General auth strategy

Auth pages are shared global system pages, not a part of the `/pharmacy` route group.

Shared auth routes:

```txt
/register
/login
/password-recovery
```

Pharmacy protected routes start with `/pharmacy`.

After login, a user with the `pharmacy` role is redirected to:

```txt
/pharmacy/dashboard
```

## 2. Account types

The system supports these account roles:

- `client`;
- `pharmacy`;
- `admin`.

Email and phone must be unique across all roles. The same email cannot belong to both a client and a pharmacy/pharmacy account. This allows login without a role selector.

## 3. Register page

The register page allows creating:

- a client account;
- a pharmacy/pharmacy account.

Default selected account type: **Client**.

The page must include an account type selector:

- Client;
- Pharmacy.

Recommended UI pattern:

- radio buttons;
- segmented control;
- tabs-like switch.

### Client registration fields

- name;
- email;
- phone;
- password.

After successful client registration:

- a client account is created;
- client status becomes `active`;
- client can use the Client cabinet and create orders.

### Pharmacy registration fields

- pharmacy name;
- email;
- phone;
- password;
- confirmation documents upload.

After successful pharmacy/pharmacy registration:

- a pharmacy account is created;
- pharmacy status becomes `new`;
- pharmacy can enter the Pharmacy cabinet;
- pharmacy cannot sell products, add products, or create product requests before Admin activation.

## 4. Pharmacy documents upload

The pharmacy registration form must include a required documents upload block.

### Text

Title:

```txt
Confirmation documents
```

Description:

```txt
Upload documents confirming that your pharmacy is allowed to sell products. Admin will review these documents before activating your pharmacy account.
```

The exact list of required legal documents should be clarified separately.

### Supported formats

- PDF;
- JPG;
- PNG;
- WEBP.

### Limits

- max file size: 5 MB per file;
- recommended max number of files: 5.

### UI requirements

Show:

- file name;
- file size;
- remove button before submit;
- wrong format error;
- file too large error;
- upload loading state.

### Validation message

```txt
Upload confirmation documents to register a pharmacy account.
```

## 5. Login page

The login page is shared for clients, pharmacies, and admins.

Fields:

- email;
- password.

After successful login, backend returns the user role.

Redirects:

| Role | Redirect |
|---|---|
| `client` | `/profile` |
| `pharmacy` | `/pharmacy/dashboard` |
| `admin` | `/admin/dashboard` |

## 6. Blocked pharmacy login

If pharmacy status is `blocked`, Pharmacy cabinet access is blocked.

Message:

```txt
Your account is temporarily blocked. Please contact administration for details.
```

## 7. New pharmacy login

If pharmacy status is `new`, login is allowed.

After login, redirect to:

```txt
/pharmacy/dashboard
```

Show banner:

```txt
Your pharmacy is not activated yet. Complete the required information and wait for Admin review.
```

New pharmacy can:

- enter the cabinet;
- view own data;
- edit own data without moderation;
- view all Admin products available to Pharmacy.

New pharmacy cannot:

- sell products;
- add products to own pharmacy;
- create product creation requests.

## 8. Forgot password page

The password recovery page is shared for clients, pharmacies, and admins.

Field:

- email.

Backend determines the account by email.

After submit, show a neutral message:

```txt
If an account with this email exists, we will send password recovery instructions.
```

Do not reveal whether the email exists in the system.

## 9. Redirect for already authenticated users

If an authenticated user opens an auth page, redirect by role:

| Role | Redirect |
|---|---|
| `client` | `/profile` |
| `pharmacy` | `/pharmacy/dashboard` |
| `admin` | `/admin/dashboard` |

## 10. Shared auth components

Use shared components:

- `Button`;
- `NameInput`;
- `EmailInput`;
- `PhoneInput`;
- `PasswordInput`;
- `FileUpload`;
- `LoadingSpinner`;
- `Toast`.

Create reusable account type component:

- `AccountTypeRadioGroup`; or
- `AccountTypeSegmentedControl`.

## 11. Auth messages

Success toasts:

```txt
Account created successfully.
Pharmacy account created. Please wait for Admin review.
You have successfully logged in.
If an account with this email exists, we will send password recovery instructions.
```

Error messages:

```txt
Invalid email or password.
This email is already in use.
This phone number is already in use.
Upload confirmation documents to register a pharmacy account.
The selected file format is not supported.
The selected file is too large.
The server is temporarily unavailable. Please try again later.
Something went wrong. Please try again.
```



---

# Pharmacy Technical Specification — Layout and Navigation

## 1. Pharmacy layout parts

Pharmacy must include:

- Header;
- Sidebar / left navigation;
- Mobile menu;
- Breadcrumbs;
- protected layout for authenticated pharmacies without Footer;
- public layout for auth pages that may reuse the Client auth layout.

Footer is not used in the protected Pharmacy cabinet.

## 2. Protected Pharmacy layout

Protected layout is used for all authenticated Pharmacy cabinet pages.

It includes:

- `PharmacyHeader`;
- `PharmacySidebar` on desktop;
- `PharmacyMobileMenu` on mobile/tablet;
- one visible `main`;
- page content;
- Breadcrumbs inside pages before `h1`;
- no Footer.

Recommended structure:

```tsx
<>
  <PharmacyHeader />
  <div className={css.layout}>
    <PharmacySidebar />
    <main className={css.main}>{children}</main>
  </div>
</>
```

Important: there must be only one visible `<main>` on the page.

## 3. Public auth layout

Public layout is used for:

- `/login`;
- `/register`;
- `/password-recovery`.

It may reuse the Client auth layout.

Sidebar is not shown in public layout.

## 4. Pharmacy Header

Pharmacy Header is similar to Client Header, but with Pharmacy-specific navigation logic.

### Header contains

For unauthenticated users:

- Logo;
- Log in button;
- Register button;
- burger button on mobile/tablet if needed.

For authenticated pharmacies:

- Logo;
- pharmacy badge;
- Log out button;
- burger button on mobile/tablet.

### Header does not contain

- Client desktop navigation;
- cart button;
- cart count;
- links to Client catalog;
- links to Pharmacies.

Pharmacy navigation is located in Sidebar / Mobile menu.

## 5. Pharmacy badge

The pharmacy badge should be similar to the Client `UserBadge`.

Show:

- round pharmacy photo;
- fallback initials if photo is missing;
- pharmacy name;
- link to `/pharmacy/profile`.

Long names must be truncated with `text-overflow: ellipsis`.

Example:

```txt
[photo] Good Pharmacy
```

## 6. Logout

Logout can be shown in:

- Header;
- Sidebar bottom;
- Mobile menu.

On click:

- perform logout;
- clear auth/session state;
- redirect to `/login`;
- show loading state.

Loading text:

```txt
Logging out...
```

## 7. Mobile menu

Mobile menu opens with the burger button and shows the same navigation links as Sidebar.

It must:

- open above the page;
- lock body scroll;
- close on backdrop click;
- close on Escape;
- close on close button;
- close after route change;
- have focus trap;
- have correct `aria-label`, `aria-expanded`, and `aria-controls`.

## 8. Sidebar

Sidebar is the main Pharmacy navigation on desktop.

It is shown only in protected layout for pharmacies with statuses:

- `new`;
- `active`;
- `on_moderation`.

It is not shown for inactive pharmacies because inactive pharmacies cannot enter the cabinet.

### Sidebar links

| Label | Route |
|---|---|
| Dashboard | `/pharmacy/dashboard` |
| Orders | `/pharmacy/orders` |
| Clients | `/pharmacy/clients` |
| Own products | `/pharmacy/products` |
| All products | `/pharmacy/all-products` |
| Product requests | `/pharmacy/product-requests` |
| Pharmacy profile | `/pharmacy/profile` |

### Active state

Active state must work for nested pages.

Examples:

- `/pharmacy/orders` and `/pharmacy/orders/[orderId]` highlight **Orders**;
- `/pharmacy/product-requests`, `/pharmacy/product-requests/new`, `/pharmacy/product-requests/[requestId]`, and `/pharmacy/product-requests/[requestId]/edit` highlight **Product requests**.

## 9. Sidebar content

Sidebar top should show compact pharmacy info:

- photo or fallback avatar;
- pharmacy name;
- email;
- status.

Example:

```txt
[photo]
Good Pharmacy
pharmacy@example.com
Status: New
```

## 10. Breadcrumbs

Pharmacy must reuse the existing Client `Breadcrumbs` component.

Breadcrumbs are shown inside `main`, before `h1`.

Example page structure:

```tsx
<main className={css.page}>
  <section className={css.section} aria-labelledby="page-title">
    <Container>
      <Breadcrumbs items={createBreadcrumbs(PAGE_TITLE)} />
      <h1 id="page-title" className={css.title}>{PAGE_TITLE}</h1>
      <p className={css.text}>{PAGE_DESCRIPTION}</p>
    </Container>
  </section>
</main>
```

### Breadcrumb examples

| Page | Breadcrumbs |
|---|---|
| Dashboard | Home / Dashboard |
| Pharmacy profile | Home / Dashboard / Pharmacy profile |
| Orders | Home / Dashboard / Orders |
| Order details | Home / Dashboard / Orders / Order #12345 |
| Clients | Home / Dashboard / Clients |
| Client details | Home / Dashboard / Clients / Client name |
| Own products | Home / Dashboard / Own products |
| Product details | Home / Dashboard / Own products / Product name |
| All products | Home / Dashboard / All products |
| Product requests | Home / Dashboard / Product requests |
| Request details | Home / Dashboard / Product requests / Request name |

### Breadcrumb accessibility

Breadcrumbs must:

- be wrapped in `nav`;
- have `aria-label="Breadcrumbs"`;
- use `ul/li`;
- mark current page with `aria-current="page"`;
- use decorative separators with `aria-hidden="true"`.



---

# Pharmacy Technical Specification — Pharmacy Profile

## 1. General logic

Pharmacy profile is the Pharmacy page where the pharmacy can view and edit its own data according to current pharmacy status.

The page should be visually close to the Client profile page but with pharmacy-specific content and rules.

Use shared components wherever possible.

## 2. Pharmacy statuses

| Status | Meaning | Who sets it |
|---|---|---|
| `new` | Pharmacy registered but has not passed Admin moderation yet | System after registration |
| `active` | Pharmacy passed moderation and can work | Admin |
| `on_moderation` | Active pharmacy changed important data and waits for Admin review | System after Pharmacy submits changes |
| `blocked` | Pharmacy is blocked or temporarily disabled | Admin |

Pharmacy UI labels and colors:

| Code | UI label | Color |
|---|---|---|
| `new` | Нова | Blue |
| `active` | Активна | Green |
| `on_moderation` | На модерації | Yellow |
| `inactive` | Неактивна | Red |

## 3. Status behavior

### New pharmacy

Can:

- enter Pharmacy cabinet;
- view own data;
- edit own data without moderation;
- view all Pharmacy-visible products from Admin.

Cannot:

- appear in Client;
- sell products;
- add products to own pharmacy;
- create product requests.

Banner:

```txt
Your pharmacy is not activated yet. Complete the required information and wait for Admin review.
```

### Active pharmacy

Can:

- enter Pharmacy cabinet;
- appear in Client;
- sell products;
- add active Admin products to own pharmacy;
- create product requests;
- view all Pharmacy-visible products from Admin;
- edit own data with Admin moderation.

If active pharmacy changes important data, public Client data and approved Pharmacy/Admin data must remain unchanged until Admin approves pending changes.

### Pharmacy on moderation

Can:

- enter Pharmacy cabinet;
- appear in Client with previous approved data;
- sell products;
- add active Admin products to own pharmacy;
- create product requests;
- view all Pharmacy-visible products from Admin;
- view approved data;
- view pending moderation data.

Cannot:

- edit data again until current pending changes are reviewed.

Banner:

```txt
Your changes are under moderation. Until Admin reviews them, Client pages show the previous approved data.
```

### Blocked pharmacy

Cannot:

- enter Pharmacy cabinet;
- appear in Client;
- sell products;
- add products;
- create product requests.

History is preserved:

- orders;
- clients;
- products;
- reviews;
- statistics.

Login message:

```txt
Your account is temporarily blocked. Please contact administration for details.
```

Admin must provide a required blocking reason when setting pharmacy status to `blocked`.

## 4. Approved data and pending data

Do not mix approved and pending data.

For `on_moderation` status:

- show previous approved data in normal profile fields;
- show pending data in separate pending moderation sections;
- each tab shows only its own pending fields.

Pending data by tab:

| Tab | Pending fields |
|---|---|
| Pharmacy data | name, phone, address, working hours |
| About pharmacy | description |
| Payment details | recipient, tax ID, IBAN, bank, payment purpose |

## 5. Page structure

Profile page includes:

- top page section with Breadcrumbs, `h1`, description, and status action;
- left summary sidebar;
- right content card with tabs.

Top title:

```txt
Pharmacy profile
```

Description:

```txt
Manage your pharmacy profile, contact details, payment details, and reviews.
```

For `new` pharmacy show button:

```txt
Send for moderation
```

This button is shown only for `new` status and is enabled only when all required fields across all tabs are completed and a photo is uploaded.

## 6. Left profile summary

Show:

- pharmacy photo;
- photo upload/change/remove controls;
- pharmacy name;
- email;
- rating and reviews count;
- role: Pharmacy;
- pharmacy status;
- status banner for `new`, `on_moderation`, and `inactive`.

Use:

- `ProfilePhotoCard`;
- `RatingSummary`;
- `AvatarImage` where needed.

Photo helper text:

```txt
Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo is saved to your profile right away.
```

## 7. Pharmacy photo rules

Photo is:

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`.

For active pharmacy, photo change requires Admin moderation.

For new pharmacy, photo change does not require moderation.

Supported formats:

- JPG;
- PNG;
- WEBP.

Max size:

- 450 KB.

Component requirements:

- preview after selection;
- loading state while saving;
- error state;
- replace photo;
- remove photo when allowed by status.

Photo component and validation should be shared between Client, Pharmacy, and Admin.

## 8. Email

Email:

- is not editable in Pharmacy profile;
- is shown as readonly;
- is unique across Client, Pharmacy, and Admin;
- is used for login.

## 9. Profile tabs

Use shared `Tabs` component.

Tabs:

1. Pharmacy data;
2. About pharmacy;
3. Payment details;
4. Reviews.

## 10. Tab: Pharmacy data

Fields:

- Name;
- Phone;
- Address;
- Working hours;
- Current password;
- New password.

### Field rules

| Field | Required for `new` | Required for `active` / `on_moderation` | Moderation for active pharmacy |
|---|---:|---:|---:|
| Name | No | Yes | Yes |
| Phone | Yes | Yes | Yes |
| Address | No | Yes | Yes |
| Working hours | No | Yes | Yes |
| Password | By password rules | By password rules | No |

Phone must be unique across Client, Pharmacy, and Admin.

Working hours should use a shared common component:

```txt
WorkingHoursInput
```

Recommended format:

```txt
Mon–Fri: 08:00–20:00, Sat–Sun: 09:00–18:00
```

Password change does not require Admin moderation.

Password success toast:

```txt
Password changed successfully.
```

Password error:

```txt
Could not change password. Please try again.
```

### Save button labels

| Pharmacy status | Button | State |
|---|---|---|
| `new` | Save | Enabled only when changed and valid |
| `active` | Send for moderation | Enabled only when changed and required fields are valid |
| `on_moderation` | Send for moderation | Disabled; fields disabled |
| `inactive` | Not available | Cabinet access blocked |

Every save or send action opens `ConfirmActionModal`.

Success toasts:

```txt
Pharmacy data saved successfully.
Changes sent for moderation.
```

Error toast:

```txt
Could not save changes. Please try again.
```

## 11. Tab: About pharmacy

Field:

- pharmacy description.

Use common component:

```txt
TextEditor
```

Rules:

- optional for `new`;
- required for `active` and `on_moderation`;
- active pharmacy changes require Admin moderation;
- new pharmacy changes save immediately without moderation.

### TextEditor requirements

- max 5000 characters;
- character counter;
- simple formatting;
- paragraphs;
- line breaks;
- simple lists;
- bold text if implementation remains lightweight.

Save button follows the same status rules as the Pharmacy data tab.

## 12. Tab: Payment details

Fields:

- Recipient;
- EDRPOU / Tax ID;
- IBAN;
- Bank;
- Payment purpose.

Rules:

- optional for `new`;
- required for `active` and `on_moderation`;
- active pharmacy changes require Admin moderation;
- new pharmacy changes save immediately without moderation.

Unique fields:

- EDRPOU / Tax ID;
- IBAN.

Create reusable form-field components:

- `RecipientInput`;
- `TaxIdInput`;
- `IbanInput`;
- `BankInput`;
- `PaymentPurposeInput`.

## 13. Tab: Reviews

Pharmacy can only view pharmacy reviews.

Pharmacy cannot:

- create reviews;
- edit reviews;
- delete reviews;
- moderate reviews.

Reviews are moderated in Admin.

Use Client review styles where possible.

Show:

- client name;
- rating;
- date;
- review text;
- empty state.

Load more with:

```txt
LazyLoadButton
```

Empty state:

```txt
This pharmacy has no reviews yet.
```

## 14. Shared profile form rules

Buttons are disabled when:

- form is unchanged;
- validation errors exist;
- request is running;
- pharmacy has `on_moderation` status;
- pharmacy has `blocked` status.

Use disabled state for `on_moderation` fields.

Use `ConfirmActionModal` for:

- saving new pharmacy data;
- sending active pharmacy changes to moderation;
- password change;
- removing photo when the action is important or irreversible.



---

# Pharmacy Technical Specification — Dashboard

## 1. General logic

Dashboard is the main Pharmacy page after pharmacy login.

It shows a short overview of the current pharmacy only:

- own order statistics;
- own client statistics;
- own product statistics;
- own product request statistics;
- quick actions;
- warnings or info banners based on pharmacy status.

Pharmacy must not see statistics of other pharmacies.

Admin has a separate dashboard.

## 2. Access by pharmacy status

Dashboard is available for pharmacies with statuses:

- `new`;
- `active`;
- `on_moderation`.

Dashboard is not available for `blocked` pharmacies because blocked pharmacies cannot enter the Pharmacy cabinet.

### New pharmacy

Dashboard shows limited statistics because the pharmacy cannot yet sell products, add products, or create product requests.

Banner:

```txt
Your pharmacy is not activated yet. After Admin review, you will be able to sell products, add products, and create product requests.
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
View order, client, product, and request statistics for your pharmacy.
```

## 4. Dashboard filters

Year and month filters are shown only above the **Orders statistics** block.

These filters affect only order statistics.

They do not affect:

- client statistics;
- product statistics;
- product request statistics;
- total clients;
- total products;
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

Current product price changes do not affect already created orders.

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
/pharmacy/orders/status-new
/pharmacy/orders/status-in-progress
/pharmacy/orders/status-successful
/pharmacy/orders/status-rejected
```

## 6. Clients statistics

Shows analytics for clients who created at least one order for the current pharmacy.

Clients from other pharmacies are not included.

Recommended cards:

- Total clients;
- Repeat clients;
- Active clients;
- Blocked clients.

Removed from scope:

- New clients by period.

### Click behavior

Examples:

```txt
/pharmacy/clients
/pharmacy/clients/status-active
/pharmacy/clients/status-blocked
```

### Empty state

```txt
Your pharmacy has no clients yet.
```

Additional text:

```txt
Clients will appear after the first orders in your pharmacy.
```

## 7. Products statistics

Shows analytics only for products added to the current pharmacy.

Global Admin products that are not added to the current pharmacy are not included.

Cards:

- Total products in pharmacy;
- Active products;
- Inactive products;
- Products in stock;
- Out of stock products;
- Reserved products.

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
/pharmacy/products
/pharmacy/products/status-active
/pharmacy/products/status-inactive
/pharmacy/products/stock-empty
/pharmacy/products/stock-available
```

### Empty state

```txt
Your pharmacy has no added products yet.
```

Button:

```txt
View all products
```

## 8. Product request statistics

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
/pharmacy/product-requests/status-draft
/pharmacy/product-requests/status-new
/pharmacy/product-requests/status-in-progress
/pharmacy/product-requests/status-approved
/pharmacy/product-requests/status-rejected
```

### Empty state

```txt
Your pharmacy has no product creation requests yet.
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
- no clients;
- no added products;
- no product requests.

## 10. Reusable dashboard components

Dashboard statistic cards should be reusable because similar cards may be needed later in Admin dashboard.

Recommended reusable components:

- `StatCard`;
- `StatusStatCard`;
- `StatGrid`;
- `DashboardSection`;
- `DashboardFilters`.



---

# Pharmacy Technical Specification — Orders

## 1. General logic

Orders are created only by clients through the Client checkout.

Pharmacy processes only orders that belong to the current pharmacy.

Admin can view orders but does not create or edit them.

After client confirms checkout:

- order is created;
- order status becomes `new`;
- ordered products are reserved in stock;
- order cannot be deleted;
- prices are fixed in the order.

## 2. Order statuses

| Status | Color | Meaning |
|---|---|---|
| `new` | Blue | Order was confirmed by client |
| `in_progress` | Yellow | Pharmacy accepted the order for processing |
| `successful` | Green | Order is completed |
| `rejected` | Red | Order was rejected by Pharmacy |

For `rejected` status, Pharmacy must provide a required rejection reason.

## 3. Allowed status transitions

Allowed transitions:

```txt
new → in_progress
in_progress → successful
in_progress → rejected
```

Not allowed:

```txt
new → successful
new → rejected
in_progress → new
successful → in_progress
rejected → in_progress
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
This action will mark the order as completed and permanently write off the reserved products from stock. This status change cannot be reverted.
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
This action will reject the order and return reserved products to available stock. This status change cannot be reverted.
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

- products are reserved;
- reserved quantity is not available for other orders;
- order status is `new`.

In statuses `new` and `in_progress`:

- products remain reserved.

When order becomes `successful`:

- reserved products are permanently written off from stock;
- order is completed;
- total order amount remains fixed.

When order becomes `rejected`:

- reserved products return to available stock;
- items become available for other orders;
- order prices remain unchanged.

If Pharmacy changes item quantity in `in_progress` status:

- reservation is recalculated;
- available stock must be checked.

If Pharmacy adds a new item in `in_progress` status:

- item is reserved;
- current price is fixed at the moment of adding.

If Pharmacy removes an item in `in_progress` status:

- reservation for this item is cancelled.

## 6. Fixed price rules

The order item price is fixed when the item enters the order.

If Pharmacy changes quantity for an item that already exists in the order, unit price remains the same as the fixed price of that order item.

If Pharmacy adds a new item that was not previously in the order, current price is fixed at the moment of adding.

Current catalog or Pharmacy price changes do not affect already created order items.

## 7. Orders table

Route:

```txt
/pharmacy/orders
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
/pharmacy/orders/status-new
/pharmacy/orders/status-in-progress
/pharmacy/orders/status-successful
/pharmacy/orders/status-rejected
/pharmacy/orders/status-successful/delivery-pickup
/pharmacy/orders/status-in-progress/payment-cash
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
- Client;
- Delivery method;
- Payment method;
- Client comment;
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

Date format must be the same in Client, Pharmacy, and Admin.

### Client

Shows client name.

Click opens client details page.

### Delivery method

Shows current delivery method.

If Pharmacy changed delivery method in `in_progress` status, table shows updated value.

### Payment method

Shows current payment method.

If Pharmacy changed payment method in `in_progress` status, table shows updated value.

### Client comment

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
/pharmacy/orders/[orderId]
```

Pharmacy can edit the order only when status is `in_progress`.

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

| Current status | Available next status |
|---|---|
| `new` | `in_progress` |
| `in_progress` | `successful`, `rejected` |
| `successful` | none |
| `rejected` | none |

Selecting status opens confirmation modal immediately.

For `rejected`, modal includes required rejection reason.

## 15. Save changes button

Button label:

```txt
Save changes
```

Enabled only when:

- order status is `in_progress`;
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

Editing items is available only for `in_progress` status.

Pharmacy can:

- increase quantity;
- decrease quantity;
- remove item;
- add a new item from own active products.

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

Allowed only in `in_progress` status.

Pharmacy can add only products that are:

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

Editable only in `in_progress` status.

Values must match Client checkout:

```txt
Pickup from pharmacy
Post delivery
```

### Payment method

Editable only in `in_progress` status.

Values must match Client checkout:

```txt
Cash on pickup / delivery
Bank transfer
```

Bank transfer can be disabled if pharmacy has no bank details.

### Client comment

Readonly.

Empty text:

```txt
Client did not leave a comment.
```

### Pharmacy comment

Editable only in `in_progress` status.

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

This button opens the same selection logic as Client `ContinueShoppingModal`, adapted for Pharmacy context.

Enabled only in `in_progress` status.

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

Pharmacy must not see orders of other pharmacies.



---

# Pharmacy Technical Specification — Clients

## 1. General logic

Clients are created only through self-registration in the Client part.

Admin can edit clients and change client status.

Pharmacy cannot create, edit, block, delete, or change client status.

Pharmacy can only view clients who created at least one order for the current pharmacy.

Pharmacy cannot see:

- all system clients;
- clients of other pharmacies;
- orders of the same client from other pharmacies.

## 2. Client statuses

| Status | Color | Meaning |
|---|---|---|
| `active` | Green | Client can use account and create orders |
| `blocked` | Red | Client is blocked or temporarily disabled by Admin |

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

A Pharmacy own client is a client who created at least one order for the current pharmacy.

Client appears in Pharmacy clients table by the date of the first order created for this pharmacy.

The specification uses only one Pharmacy client date:

```txt
firstOrderAt
```

This date is shown in the clients table and on the client details page.

Do not show client system registration date in Pharmacy UI in the first version.

## 6. Clients table

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

## 7. Clients table filters

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

## 8. Clients table columns

Columns:

- Client ID;
- Photo;
- First order date;
- Name;
- Email;
- Phone;
- Address;
- Successful orders count for this pharmacy;
- Successful orders amount for this pharmacy;
- Status.

### Client ID

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

## 9. Clients table pagination

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

## 10. Clients table states

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

Pharmacy can only view client data.

Pharmacy cannot:

- edit client name;
- edit email;
- edit phone;
- edit address;
- edit photo;
- edit status;
- edit password;
- edit personal settings.

If client does not belong to the current pharmacy, show not found or access denied state.

## 12. Client page top section

Show:

- Breadcrumbs;
- page title;
- short description.

Title example:

```txt
Client: John Smith
```

Description:

```txt
View client information, statistics, and orders for your pharmacy.
```

## 13. Client info block

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

## 14. Client statistics

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

## 15. Client orders table

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
- Client comment;
- Total quantity;
- Total amount;
- Status.

Order number opens one order page.

## 16. Client page states

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
Client not found.
```

Client orders empty state:

```txt
This client has no orders in your pharmacy yet.
```

This state is a fallback only. Normally such client should not appear in Pharmacy clients list.

Nothing found state:

```txt
No orders found for the selected filters.
```

Reset button:

```txt
Reset filters
```

## 17. Client page technical actions

Toast may be used only for small technical actions, such as copying data.

Examples:

```txt
Client email copied.
Client phone copied.
Client ID copied.
Could not load data. Please try again.
```



---

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

| Status | Color | Meaning | Visible to Pharmacy |
|---|---|---|---|
| `new` | Blue | Product created in Admin but not activated yet | No |
| `active` | Green | Product can be added to pharmacies | Yes |
| `inactive` | Red | Product is temporarily or permanently deactivated by Admin | Yes |

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

Readonly in Pharmacy.

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



---

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

| Status | Color | Meaning | Editable by Pharmacy |
|---|---|---|---|
| `draft` | Gray | Pharmacy created request but did not send it to Admin | Yes |
| `new` | Blue | Pharmacy sent request; Admin has not started review | No |
| `in_progress` | Yellow | Admin is checking the request | No |
| `approved` | Green | Admin created product from request | No |
| `rejected` | Red | Admin rejected request | No |

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

| Mode | Route | Description |
|---|---|---|
| Create mode | `/pharmacy/product-requests/new` | Pharmacy creates new request |
| Edit draft mode | `/pharmacy/product-requests/[requestId]/edit` | Pharmacy edits draft request |
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



---

# Pharmacy Technical Specification — Service Pages, Loaders, and States

## 1. General rule

Pharmacy service pages and loaders should reuse the Client implementation as much as possible.

Do not create a separate Pharmacy design if existing Client status pages can be reused.

Reuse:

- `Button`;
- `ButtonLink`;
- `Container`;
- `LoadingSpinner`;
- `status-page.module.css`;
- `loading.module.css` or shared loader styles;
- `/images/home/three-pills.png`.

Protected Pharmacy layout does not show Footer.

Every service page must have one visible `<main>`.

## 2. Error page

Use `error.tsx`.

The page should match Client error page structure, styles, illustration, and responsive behavior.

### Structure

- one visible `main`;
- section with `aria-labelledby`;
- `Container`;
- text block;
- decorative illustration;
- Try again button;
- Back to dashboard link.

### Texts

Eyebrow:

```txt
Page error
```

Title:

```txt
Something went wrong, but your route is still safe
```

Text:

```txt
We could not load this page right now. Try again, or return to a stable section and continue working with your pharmacy cabinet.
```

Buttons:

```txt
Try again
Back to dashboard
```

Back link:

```txt
/pharmacy/dashboard
```

If error page is used inside public auth layout, secondary link may lead to `/login` or `/`.

## 3. 404 page

Use `not-found.tsx`.

The page should match Client 404 page structure, styles, illustration, and responsive behavior.

### Texts

Eyebrow:

```txt
404
```

Title:

```txt
Page not found
```

Text:

```txt
The link may be outdated, moved, or typed with a small typo. Go back to dashboard or open products to continue working with your pharmacy cabinet.
```

Buttons:

```txt
Back to dashboard
View all products
```

Links:

```txt
/pharmacy/dashboard
/pharmacy/all-products
```

## 4. Route loading page

Use the same route loading approach as Client.

Example label:

```txt
Loading page...
```

The route loader should not create layout shifts.

## 5. LoadingSpinner

Use shared `LoadingSpinner` for:

- Dashboard;
- orders table;
- one order page;
- clients table;
- one client page;
- own products table;
- all products table;
- product details page;
- requests table;
- request details page;
- create/edit request page;
- auth actions;
- async tabs.

Component requirements:

- `role="status"`;
- `aria-live="polite"`;
- decorative spinner with `aria-hidden="true"`;
- visible label or `aria-label`;
- optional `className`;
- default label: `Loading...`.

## 6. Loader placement

For full page loading, show loader in page content area.

For table loading, show loader inside the table area, not over the whole page, if only table data is loading.

For tab loading, show loader inside the active tab.

For button actions, show loading state on the button and disable it.

Common loading button texts:

```txt
Saving...
Sending...
Changing...
Loading...
Logging out...
```

## 7. Accessibility rules

Loaders must:

- have `role="status"`;
- use `aria-live="polite"` only where helpful;
- avoid stealing focus;
- avoid excessive live announcements;
- hide decorative spinner from screen readers.

Service pages must:

- have one visible `main`;
- have `h1`;
- connect section with heading through `aria-labelledby`;
- use decorative image with `aria-hidden="true"` and empty `alt`;
- use real buttons for actions;
- use real links for navigation.

## 8. Empty and nothing found states

Use empty state when there is no data at all.

Use nothing found state when data exists but filters return no results.

Common reset button:

```txt
Reset filters
```

Common retry button:

```txt
Try again
```



---

# Pharmacy Technical Specification — Recommended Route Structure

## 1. Global auth routes

Auth routes are global and shared between Client, Pharmacy, and Admin.

```txt
app/login/page.tsx
app/register/page.tsx
app/password-recovery/page.tsx
```

These pages are not under `/pharmacy`.

After login, role `pharmacy` redirects to:

```txt
/pharmacy/dashboard
```

## 2. Pharmacy protected routes

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

app/pharmacy/(protected)/products/page.tsx
app/pharmacy/(protected)/products/[productId]/page.tsx
app/pharmacy/(protected)/products/status-[status]/page.tsx
app/pharmacy/(protected)/products/stock-[stock]/page.tsx
app/pharmacy/(protected)/products/status-[status]/stock-[stock]/page.tsx

app/pharmacy/(protected)/all-products/page.tsx
app/pharmacy/(protected)/all-products/[productId]/page.tsx
app/pharmacy/(protected)/all-products/status-[status]/page.tsx
app/pharmacy/(protected)/all-products/category-[category]/page.tsx

app/pharmacy/(protected)/product-requests/page.tsx
app/pharmacy/(protected)/product-requests/new/page.tsx
app/pharmacy/(protected)/product-requests/[requestId]/page.tsx
app/pharmacy/(protected)/product-requests/[requestId]/edit/page.tsx
app/pharmacy/(protected)/product-requests/status-[status]/page.tsx
```

## 3. Filter route principle

Pharmacy table filters use clean URL route segments.

Examples:

```txt
/pharmacy/orders/status-new
/pharmacy/orders/status-successful/delivery-pickup
/pharmacy/clients/status-active
/pharmacy/products/status-active/stock-empty
/pharmacy/product-requests/status-draft
```

Pagination and rows-per-page are local state and are not represented in route segments.

## 4. Alternative implementation note

If the number of route segment combinations becomes too large, filters may be handled by a single page that parses optional catch-all segments.

Example:

```txt
app/pharmacy/(protected)/orders/[[...filters]]/page.tsx
app/pharmacy/(protected)/clients/[[...filters]]/page.tsx
app/pharmacy/(protected)/products/[[...filters]]/page.tsx
app/pharmacy/(protected)/product-requests/[[...filters]]/page.tsx
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
PHARMACY_PRODUCTS = "/pharmacy/products"
PHARMACY_ALL_PRODUCTS = "/pharmacy/all-products"
PHARMACY_PRODUCT_REQUESTS = "/pharmacy/product-requests"
```

Create builder functions:

```txt
getPharmacyOrderPath(orderId)
getPharmacyClientPath(clientId)
getPharmacyProductPath(productId)
getPharmacyRequestPath(requestId)
getPharmacyOrdersFilterPath(filters)
getPharmacyClientsFilterPath(filters)
getPharmacyProductsFilterPath(filters)
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



---

# Pharmacy Technical Specification — E-PHARMACY

This folder contains the improved Pharmacy technical specification split into global parts.

## Files

1. `00-general-overview.md` — global Pharmacy principles, ownership, statuses, filter URL strategy.
2. `01-auth-and-access.md` — shared auth, role redirects, pharmacy registration, blocked access.
3. `02-layout-and-navigation.md` — Header, Sidebar, Mobile menu, Breadcrumbs, layouts.
4. `03-pharmacy-profile.md` — pharmacy profile, statuses, tabs, moderation, reviews.
5. `04-dashboard.md` — Dashboard statistics and dashboard-specific rules.
6. `05-orders.md` — orders table, order details, statuses, stock reservation, fixed prices.
7. `06-clients.md` — clients table, client details, readonly access, first order date.
8. `07-products.md` — products, all products, own products, product card, stock and price logic.
9. `08-product-requests.md` — product creation requests, draft flow, Admin moderation flow.
10. `09-service-pages-loaders-states.md` — error page, 404, loaders, empty states.
11. `10-route-structure.md` — recommended Next.js App Router structure and clean filter routes.

## Main decisions applied

- Table filters change URL with clean route segments.
- Pagination and rows-per-page stay in local state.
- Dashboard year/month filter applies only to Orders statistics.
- Client Pharmacy date is `firstOrderAt` only.
- Order final statuses are irreversible in the first version.
- All products have one global status: `new`, `active`, `inactive`.
- Pharmacy cannot see products with `new` status.
- Product removal from pharmacy is explicitly described.
- Product request flow is strict: Draft → New → In work → Approved/Rejected.
- Auth pages are global, not part of `/pharmacy` route group.
- Protected Pharmacy layout has no Footer.



---
