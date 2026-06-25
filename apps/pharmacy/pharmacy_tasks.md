# Pharmacy Cabinet — завдання для реалізації

## 0. Загальна мета

Реалізувати окремий фронтовий застосунок `apps/pharmacy` для кабінету аптеки в екосистемі E-PHARMACY.

Pharmacy Cabinet має дозволяти аптеці:

- переглядати dashboard;
- керувати профілем аптеки;
- переглядати й обробляти власні замовлення;
- переглядати власних клієнтів;
- керувати власними товарами;
- переглядати всі доступні товари з глобального каталогу;
- створювати запити на додавання нового товару;
- працювати тільки з даними поточної аптеки.

UI для Pharmacy згідно з ТЗ має бути англійською мовою.

---

# EP-PHARMACY-001 — Ініціалізація окремого frontend app `apps/pharmacy`

## Мета

Створити новий Next.js застосунок для pharmacy-частини в монорепозиторії.

## Завдання

- Створити папку `apps/pharmacy`.
- Налаштувати `package.json` для `@e-pharmacy/pharmacy`.
- Додати залежності за аналогією з `apps/client`:
  - `next`;
  - `react`;
  - `react-dom`;
  - `typescript`;
  - `eslint`;
  - `@e-pharmacy/ui`;
  - `@e-pharmacy/types`;
  - `@e-pharmacy/config`;
  - `@e-pharmacy/auth`;
  - `@e-pharmacy/api-client`;
  - `@e-pharmacy/utils`;
  - `@e-pharmacy/validation`.
- Додати scripts:
  - `dev`;
  - `build`;
  - `start`;
  - `lint`;
  - `type-check`.
- Додати `tsconfig.json`.
- Додати `next.config.ts`.
- Додати `.env.example`.
- Оновити root `package.json`:
  - `dev:pharmacy`;
  - `build:pharmacy`;
  - `lint:pharmacy`;
  - `type-check:pharmacy`;
  - `check:pharmacy`.

## Acceptance Criteria

- `pnpm --filter @e-pharmacy/pharmacy dev` запускає Pharmacy app.
- `pnpm --filter @e-pharmacy/pharmacy build` проходить без помилок.
- `pnpm --filter @e-pharmacy/pharmacy lint` проходить без помилок.
- `pnpm --filter @e-pharmacy/pharmacy type-check` проходить без помилок.

---

# EP-PHARMACY-002 — Базова структура App Router

## Мета

Створити рекомендовану структуру роутів згідно з ТЗ.

## Завдання

Створити структуру:

```txt
apps/pharmacy/src/app/layout.tsx
apps/pharmacy/src/app/page.tsx
apps/pharmacy/src/app/loading.tsx
apps/pharmacy/src/app/error.tsx
apps/pharmacy/src/app/not-found.tsx

apps/pharmacy/src/app/pharmacy/(protected)/layout.tsx
apps/pharmacy/src/app/pharmacy/(protected)/loading.tsx
apps/pharmacy/src/app/pharmacy/(protected)/error.tsx
apps/pharmacy/src/app/pharmacy/(protected)/not-found.tsx

apps/pharmacy/src/app/pharmacy/(protected)/dashboard/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/profile/page.tsx

apps/pharmacy/src/app/pharmacy/(protected)/orders/[[...filters]]/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/orders/[orderId]/page.tsx

apps/pharmacy/src/app/pharmacy/(protected)/clients/[[...filters]]/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/clients/[clientId]/page.tsx

apps/pharmacy/src/app/pharmacy/(protected)/products/[[...filters]]/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/products/[productId]/page.tsx

apps/pharmacy/src/app/pharmacy/(protected)/all-products/[[...filters]]/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/all-products/[productId]/page.tsx

apps/pharmacy/src/app/pharmacy/(protected)/product-requests/[[...filters]]/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/product-requests/new/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/product-requests/[requestId]/page.tsx
apps/pharmacy/src/app/pharmacy/(protected)/product-requests/[requestId]/edit/page.tsx
```

## Важливо

Для таблиць краще використати `[[...filters]]`, а не створювати десятки фізичних route-файлів під кожну комбінацію фільтрів.

## Acceptance Criteria

- Усі базові сторінки відкриваються.
- Для неіснуючих pharmacy-роутів показується pharmacy 404.
- Protected layout не містить Footer.
- На кожній сторінці є один видимий `main`.

---

# EP-PHARMACY-003 — Route constants і filter URL utilities

## Мета

Створити єдину систему маршрутів і clean filter URLs.

## Завдання

Додати route constants:

```txt
PHARMACY_DASHBOARD = "/pharmacy/dashboard"
PHARMACY_PROFILE = "/pharmacy/profile"
PHARMACY_ORDERS = "/pharmacy/orders"
PHARMACY_CLIENTS = "/pharmacy/clients"
PHARMACY_PRODUCTS = "/pharmacy/products"
PHARMACY_ALL_PRODUCTS = "/pharmacy/all-products"
PHARMACY_PRODUCT_REQUESTS = "/pharmacy/product-requests"
```

Створити builder-функції:

- `getPharmacyDashboardPath()`;
- `getPharmacyProfilePath()`;
- `getPharmacyOrderPath(orderId)`;
- `getPharmacyClientPath(clientId)`;
- `getPharmacyProductPath(productId)`;
- `getPharmacyRequestPath(requestId)`;
- `getPharmacyOrdersFilterPath(filters)`;
- `getPharmacyClientsFilterPath(filters)`;
- `getPharmacyProductsFilterPath(filters)`;
- `getPharmacyAllProductsFilterPath(filters)`;
- `getPharmacyRequestsFilterPath(filters)`.

Створити parser-функції:

- `parsePharmacyOrderFilters(segments)`;
- `parsePharmacyClientFilters(segments)`;
- `parsePharmacyProductFilters(segments)`;
- `parsePharmacyAllProductFilters(segments)`;
- `parsePharmacyRequestFilters(segments)`.

## Правила

Фільтри мають формувати clean URLs:

```txt
/pharmacy/orders/status-new
/pharmacy/orders/status-successful/delivery-pickup
/pharmacy/products/status-active/stock-empty
/pharmacy/product-requests/status-draft
```

Pagination і rows per page залишаються в local state.

## Acceptance Criteria

- Dashboard cards ведуть на правильні filtered routes.
- Табличні фільтри змінюють URL.
- Некоректні filter segments обробляються без падіння сторінки.
- Pagination не записується в URL.

---

# EP-PHARMACY-004 — Auth integration і protected routing

## Мета

Підключити авторизацію для ролі `pharmacy`.

## Завдання

- Реалізувати `proxy.ts` для Pharmacy app.
- Дозволити доступ до `/pharmacy/*` тільки авторизованим користувачам з роллю `pharmacy`.
- Якщо користувач не авторизований — redirect на `/login` або `/auth/login` відповідно до фінального auth route рішення.
- Якщо користувач авторизований, але має роль `client` — redirect у client app.
- Якщо користувач авторизований, але має роль `admin` — redirect у admin app.
- Якщо pharmacy має статус `blocked` — не пускати в cabinet, показати повідомлення або redirect на login з повідомленням.
- Після login користувач з роллю `pharmacy` має потрапляти на `/pharmacy/dashboard`.

## Acceptance Criteria

- `client` не може відкрити Pharmacy Cabinet.
- `admin` не може відкрити Pharmacy Cabinet.
- `pharmacy` може відкрити `/pharmacy/dashboard`.
- `blocked pharmacy` не може працювати з cabinet.
- Redirect після login працює відповідно до ролі.

---

# EP-PHARMACY-005 — Pharmacy layout: Header, Sidebar, Mobile menu

## Мета

Реалізувати основний layout для protected pharmacy pages.

## Компоненти

Створити:

```txt
components/layout/PharmacyHeader
components/layout/PharmacySidebar
components/layout/PharmacyMobileMenu
components/layout/PharmacyShell
components/layout/PharmacyBadge
```

## Sidebar links

- Dashboard — `/pharmacy/dashboard`;
- Orders — `/pharmacy/orders`;
- Clients — `/pharmacy/clients`;
- Own products — `/pharmacy/products`;
- All products — `/pharmacy/all-products`;
- Product requests — `/pharmacy/product-requests`;
- Pharmacy profile — `/pharmacy/profile`.

## Header

Header має містити:

- Logo;
- pharmacy badge;
- logout button;
- burger button на mobile/tablet.

Header не має містити:

- cart;
- client catalog links;
- client pharmacies navigation;
- footer navigation.

## Mobile menu

Має:

- відкриватися поверх сторінки;
- закриватися по backdrop;
- закриватися по Escape;
- закриватися після зміни route;
- блокувати scroll body;
- мати focus trap;
- мати коректні `aria-label`, `aria-expanded`, `aria-controls`.

## Acceptance Criteria

- Desktop показує Sidebar.
- Mobile/tablet показує Header + burger menu.
- Active state працює для основних і nested routes.
- Logout доступний із Header, Sidebar і Mobile menu.
- Після logout користувач повертається на login page.

---

# EP-PHARMACY-006 — Breadcrumbs для Pharmacy pages

## Мета

Підключити breadcrumbs для всіх protected pharmacy pages.

## Завдання

- Використати shared `Breadcrumbs`.
- Додати pharmacy breadcrumb config.
- Показувати breadcrumbs всередині сторінки перед `h1`.

## Приклади

```txt
Home / Dashboard
Home / Dashboard / Pharmacy profile
Home / Dashboard / Orders
Home / Dashboard / Orders / Order #12345
Home / Dashboard / Clients / Client name
Home / Dashboard / Own products / Product name
Home / Dashboard / Product requests / Request name
```

## Acceptance Criteria

- Breadcrumbs є на всіх основних pharmacy pages.
- Current page має `aria-current="page"`.
- Breadcrumbs обгорнуті в `nav` з `aria-label="Breadcrumbs"`.

---

# EP-PHARMACY-007 — Shared Pharmacy UI primitives

## Мета

Підготувати компоненти, які повторюються на Dashboard, tables і details pages.

## Компоненти

Створити або адаптувати:

- `StatusBadge`;
- `StatusBanner`;
- `StatsCard`;
- `TableToolbar`;
- `TableEmptyState`;
- `TableNothingFoundState`;
- `DataTable`;
- `DetailsCard`;
- `ReadonlyField`;
- `ActionBar`;
- `PharmacyPageHeader`.

## Status colors

Єдина логіка кольорів:

- New — Blue;
- In work / On moderation — Yellow;
- Active / Successful / Approved — Green;
- Blocked / Rejected — Red;
- Draft — Gray.

## Acceptance Criteria

- Status colors однакові на Dashboard, tables і details pages.
- Компоненти не дублюють уже наявні shared components із `@e-pharmacy/ui`.
- Усі компоненти typed.

---

# EP-PHARMACY-008 — Pharmacy Dashboard page

## Мета

Реалізувати `/pharmacy/dashboard`.

## Блоки

Dashboard має містити:

- page header;
- pharmacy status;
- status banner;
- orders statistics;
- clients statistics;
- products statistics;
- product requests statistics;
- quick actions.

## Orders statistics

Мають бути фільтри:

- year;
- month.

Важливо: ці фільтри впливають тільки на orders statistics і не змінюють URL.

Status cards:

- New;
- In work;
- Successful;
- Rejected.

Клік по card веде на Orders table з відповідним filter URL.

## Other statistics

Clients:

- total clients;
- active clients;
- blocked clients, якщо доступно;
- new clients for current pharmacy.

Products:

- total own products;
- active;
- blocked;
- empty stock;
- current stock value.

Product requests:

- draft;
- on moderation;
- approved;
- rejected.

## Acceptance Criteria

- Dashboard показує тільки статистику поточної аптеки.
- New pharmacy бачить limited dashboard і banner.
- Active pharmacy бачить full dashboard.
- On moderation pharmacy бачить full dashboard + moderation banner.
- Cards ведуть на правильні routes.

---

# EP-PHARMACY-009 — Pharmacy Profile page

## Мета

Реалізувати `/pharmacy/profile`.

## Структура

Сторінка має містити:

- Breadcrumbs;
- `h1` — `Pharmacy profile`;
- description;
- left profile summary;
- right content card with tabs.

## Tabs

- Pharmacy data;
- About pharmacy;
- Payment details;
- Reviews.

## Left summary

Показати:

- pharmacy photo;
- upload/change/remove controls;
- pharmacy name;
- email;
- rating;
- reviews count;
- role: Pharmacy;
- pharmacy status;
- status banner.

## Status rules

`new` pharmacy:

- може редагувати дані без moderation;
- має кнопку `Send for moderation`;
- кнопка активна тільки коли required fields заповнені.

`active` pharmacy:

- може редагувати важливі дані;
- зміни йдуть на moderation;
- public approved data не змінюється до approval.

`on_moderation` pharmacy:

- бачить approved data;
- бачить pending moderation data окремо;
- не може редагувати дані повторно до рішення Admin.

`blocked` pharmacy:

- не має доступу до cabinet.

## Acceptance Criteria

- Tabs працюють.
- Email readonly.
- Photo upload має preview, loading, error state.
- Required fields перевіряються перед `Send for moderation`.
- Pending data не змішується з approved data.

---

# EP-PHARMACY-010 — Orders table

## Мета

Реалізувати `/pharmacy/orders`.

## Функціонал

Таблиця має показувати тільки замовлення поточної аптеки.

## Filters

Фільтри через clean URL:

- status;
- delivery;
- payment;
- date;
- search.

Приклади:

```txt
/pharmacy/orders/status-new
/pharmacy/orders/status-successful/delivery-pickup
/pharmacy/orders/status-rejected/payment-cash
```

## Columns

- Order number;
- Created date;
- Client;
- Total items;
- Total price;
- Payment method;
- Delivery method;
- Status.

## States

- loading;
- empty;
- nothing found;
- error;
- pagination.

## Acceptance Criteria

- Pharmacy не бачить orders інших аптек.
- Клік по order number відкриває details page.
- Filters змінюють URL.
- Pagination не змінює URL.
- Reset filters працює.

---

# EP-PHARMACY-011 — Order details page

## Мета

Реалізувати `/pharmacy/orders/[orderId]`.

## Сторінка має містити

- Breadcrumbs;
- order number;
- status;
- client info;
- delivery info;
- payment info;
- order items;
- total price;
- status history;
- action buttons.

## Status transitions

Дозволені переходи:

```txt
new → in_progress
new → rejected
in_progress → successful
in_progress → rejected
```

Final statuses:

- `successful`;
- `rejected`.

Final statuses irreversible у першій версії.

## Важливо

Ціни в замовленні мають бути fixed order prices. Поточна ціна товару не повинна змінювати старе замовлення.

## Acceptance Criteria

- Pharmacy може змінювати статус тільки для власних orders.
- Для rejected status потрібна причина.
- Для final status action buttons неактивні або приховані.
- Після зміни статусу UI оновлюється.
- Для статусних дій є confirmation modal.

---

# EP-PHARMACY-012 — Clients table

## Мета

Реалізувати `/pharmacy/clients`.

## Функціонал

Pharmacy бачить тільки клієнтів, які хоча б раз зробили замовлення в цій аптеці.

## Columns

- Client name;
- Email;
- Phone;
- First order date;
- Orders count;
- Total spent in this pharmacy;
- Status.

## Filters

- status;
- date;
- search.

## Важливо

`firstOrderAt` — дата першого замовлення саме в поточній аптеці.

## Acceptance Criteria

- Pharmacy не бачить клієнтів інших аптек.
- Pharmacy не бачить orders клієнта з інших аптек.
- Клік по client відкриває client details page.
- Filters працюють через clean URL.
- Pagination local only.

---

# EP-PHARMACY-013 — Client details page

## Мета

Реалізувати `/pharmacy/clients/[clientId]`.

## Сторінка має містити

- Breadcrumbs;
- client name;
- readonly client contacts;
- first order date in current pharmacy;
- orders count in current pharmacy;
- total spent in current pharmacy;
- related orders table.

## Restrictions

Pharmacy не може:

- редагувати client data;
- блокувати client;
- бачити orders з інших аптек.

## Acceptance Criteria

- Всі client fields readonly.
- Related orders містять тільки orders поточної аптеки.
- Є empty state для відсутніх related orders.
- Є link на order details.

---

# EP-PHARMACY-014 — Own products table

## Мета

Реалізувати `/pharmacy/products`.

## Функціонал

Показувати тільки товари, додані до поточної аптеки.

## Filters

- added date;
- name search;
- article search;
- category;
- status;
- stock availability.

Приклади clean URLs:

```txt
/pharmacy/products/status-active
/pharmacy/products/status-blocked
/pharmacy/products/stock-empty
/pharmacy/products/status-active/stock-available
```

## Columns

- Added date;
- Article;
- Name;
- Category;
- Stock quantity;
- Reserved quantity;
- Available quantity;
- Current price;
- Status.

## Acceptance Criteria

- Pharmacy бачить тільки власні product offers.
- Product with global status `new` не показується.
- Клік по product відкриває details page.
- Stock fields відповідають правилу: `totalQuantity = availableQuantity + reservedQuantity`.

---

# EP-PHARMACY-015 — All products table

## Мета

Реалізувати `/pharmacy/all-products`.

## Функціонал

Показувати всі Admin products, доступні для Pharmacy.

## Rules

Pharmacy не бачить products зі статусом `new`.

## Columns

- Created date in Admin;
- Article;
- Name;
- Category;
- Status;
- Added to my pharmacy;
- Action.

## Actions

- Add to my pharmacy;
- View details;
- Disabled state for unavailable actions.

## Acceptance Criteria

- Products зі статусом `new` приховані.
- Active pharmacy може додати product до своєї аптеки.
- New pharmacy не може додати product.
- Blocked pharmacy не має доступу.
- Якщо product вже доданий — показати відповідний state.

---

# EP-PHARMACY-016 — Product details page

## Мета

Реалізувати `/pharmacy/products/[productId]` і `/pharmacy/all-products/[productId]`.

## Сторінка має містити

- Breadcrumbs;
- product name;
- short description;
- product image;
- article;
- category;
- status;
- rating;
- reviews count;
- Admin creation date;
- date added to pharmacy, якщо товар доданий;
- pharmacy-specific price and stock, якщо товар доданий.

## Tabs

- Statistics;
- Stock movement;
- Related orders;
- Characteristics;
- Reviews.

## Acceptance Criteria

- Для product з own products показується global + pharmacy-specific data.
- Для product з all products, який ще не доданий, показуються global data і CTA `Add to my pharmacy`.
- Product with status `new` недоступний для Pharmacy.
- Reviews readonly для Pharmacy.

---

# EP-PHARMACY-017 — Product offer management

## Мета

Дати аптеці можливість налаштовувати власну ціну і stock для доданого товару.

## Функціонал

- Add product to my pharmacy.
- Set initial price.
- Set initial stock quantity.
- Update price.
- Update stock.
- Remove product from own pharmacy, якщо дозволено.

## Remove rules

Product можна видалити, якщо:

- товар доданий до поточної аптеки;
- немає orders з цим товаром;
- `reservedQuantity = 0`;
- `stockQuantity = 0` або ще не синхронізовано із зовнішнім API;
- pharmacy status `active` або `on_moderation`.

## Acceptance Criteria

- Add/update/remove actions мають loading states.
- Усі destructive actions мають confirmation modal.
- Stock invariant не порушується.
- Pharmacy не може змінювати global product data.

---

# EP-PHARMACY-018 — Product requests table

## Мета

Реалізувати `/pharmacy/product-requests`.

## Важливо

ProductRequest у ТЗ позначений як future functionality і наразі не повністю реалізований у backend. Frontend можна реалізувати як UI skeleton + інтеграцію після появи API.

## Columns

- Created date;
- Article;
- Name;
- Category;
- Status.

## Filters

- date;
- search by name;
- search by article;
- category;
- status.

## Statuses

- Draft;
- On moderation;
- Approved;
- Rejected.

## Acceptance Criteria

- Requests table готова до підключення API.
- Empty state: `Your pharmacy has no product creation requests yet.`
- Nothing found state: `No requests found for the selected filters.`
- Create request button disabled для `new` pharmacy.
- Create request button enabled для `active` і `on_moderation`.

---

# EP-PHARMACY-019 — Create/Edit Product Request page

## Мета

Реалізувати UI для створення і редагування product request.

## Routes

```txt
/pharmacy/product-requests/new
/pharmacy/product-requests/[requestId]/edit
```

## Fields

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
- additional files/documents.

## Required for draft

- name;
- article;
- category.

## Required for moderation

- name;
- article;
- category;
- manufacturer;
- short description;
- Pharmacy comment.

## Buttons

- Save draft;
- Send for moderation;
- Cancel.

## Acceptance Criteria

- Draft можна зберегти з мінімальними required fields.
- Send for moderation недоступний, якщо required moderation fields не заповнені.
- Після відправки request стає readonly.
- Для submitted request edit page недоступна.

---

# EP-PHARMACY-020 — Product Request details page

## Мета

Реалізувати `/pharmacy/product-requests/[requestId]`.

## Сторінка має містити

- image;
- name;
- article;
- category;
- request status;
- short description;
- characteristics;
- Pharmacy comment;
- created date;
- sent to moderation date;
- Admin comment;
- rejection reason;
- link to created product if approved.

## States

Draft:

- show edit button;
- show send for moderation action.

On moderation:

- readonly;
- show moderation info.

Approved:

- readonly;
- show link to created product.

Rejected:

- readonly;
- show rejection reason;
- allow create new request based on rejected request.

## Acceptance Criteria

- Draft editable.
- Submitted requests readonly.
- Rejected request can be copied into a new draft.
- Pharmacy cannot access requests of other pharmacies.

---

# EP-PHARMACY-021 — Service pages, loaders, empty states

## Мета

Реалізувати єдині service states для Pharmacy.

## Pages

- `loading.tsx`;
- `error.tsx`;
- `not-found.tsx`.

## Texts

Error page:

```txt
Something went wrong, but your route is still safe
```

404 page:

```txt
Page not found
```

Buttons:

```txt
Try again
Back to dashboard
View all products
```

## Loaders

Використовувати shared `LoadingSpinner` для:

- Dashboard;
- tables;
- details pages;
- tabs;
- buttons;
- auth actions.

## Acceptance Criteria

- Усі loaders мають `role="status"`.
- Decorative spinner має `aria-hidden="true"`.
- Empty state використовується, коли даних немає взагалі.
- Nothing found state використовується, коли фільтри нічого не знайшли.
- Service pages не показують Footer.

---

# EP-PHARMACY-022 — API layer для Pharmacy frontend

## Мета

Створити frontend API layer для pharmacy app.

## Структура

```txt
apps/pharmacy/src/lib/api/browser/pharmacy-dashboard.api.ts
apps/pharmacy/src/lib/api/browser/pharmacy-profile.api.ts
apps/pharmacy/src/lib/api/browser/pharmacy-orders.api.ts
apps/pharmacy/src/lib/api/browser/pharmacy-clients.api.ts
apps/pharmacy/src/lib/api/browser/pharmacy-products.api.ts
apps/pharmacy/src/lib/api/browser/pharmacy-product-requests.api.ts

apps/pharmacy/src/lib/api/server/pharmacy-dashboard.api.ts
apps/pharmacy/src/lib/api/server/pharmacy-profile.api.ts
apps/pharmacy/src/lib/api/server/pharmacy-orders.api.ts
apps/pharmacy/src/lib/api/server/pharmacy-products.api.ts
```

## Завдання

- Повторити proxy/BFF підхід з `apps/client`.
- Створити route handlers у `apps/pharmacy/src/app/api/...`.
- Винести backend route constants.
- Додати typed DTO.
- Додати обробку API errors.

## Acceptance Criteria

- Frontend не звертається напряму до backend з компонентів.
- API calls typed.
- Помилки показуються через user-friendly messages.
- Auth cookies прокидаються через proxy route handlers.

---

# EP-PHARMACY-023 — Backend dependencies для Pharmacy

## Мета

Зафіксувати API, якого не вистачає для повної реалізації Pharmacy Cabinet.

## Потрібні endpoints

Dashboard:

```txt
GET /pharmacy/me/dashboard
```

Profile:

```txt
GET /pharmacy/me/profile
PATCH /pharmacy/me/profile
POST /pharmacy/me/profile/send-for-verification
POST /pharmacy/me/photo
DELETE /pharmacy/me/photo
```

Orders:

```txt
GET /pharmacy/me/orders
GET /pharmacy/me/orders/:orderId
PATCH /pharmacy/me/orders/:orderId/status
```

Clients:

```txt
GET /pharmacy/me/clients
GET /pharmacy/me/clients/:clientId
GET /pharmacy/me/clients/:clientId/orders
```

Products:

```txt
GET /pharmacy/me/products
GET /pharmacy/me/products/:productId
GET /pharmacy/me/all-products
GET /pharmacy/me/all-products/:productId
POST /pharmacy/me/products/:productId/add
PATCH /pharmacy/me/products/:productId/offer
DELETE /pharmacy/me/products/:productId
```

Product requests:

```txt
GET /pharmacy/me/product-requests
POST /pharmacy/me/product-requests
GET /pharmacy/me/product-requests/:requestId
PATCH /pharmacy/me/product-requests/:requestId
POST /pharmacy/me/product-requests/:requestId/send
POST /pharmacy/me/product-requests/:requestId/copy
```

## Acceptance Criteria

- Усі endpoints повертають тільки дані поточної pharmacy.
- Pharmacy не може передати чужий `pharmacyId` і отримати чужі дані.
- Role guard перевіряє `pharmacy`.
- Blocked pharmacy не має доступу.

---

# EP-PHARMACY-024 — Metadata, SEO і noindex

## Мета

Налаштувати metadata для приватних pharmacy pages.

## Завдання

- Додати `noindex` для всіх protected pharmacy pages.
- Додати meaningful `title`.
- Додати meaningful description.
- Перевірити, що кожна сторінка має один `h1`.

## Acceptance Criteria

- Protected pages не індексуються.
- Browser title відповідає сторінці.
- Немає дублювання `h1`.

---

# EP-PHARMACY-025 — Accessibility і responsive QA

## Мета

Перевірити доступність і адаптивність Pharmacy app.

## Завдання

- Keyboard navigation.
- Focus states.
- Focus trap у mobile menu і modals.
- Correct buttons/links semantics.
- Correct table headings.
- Screen-reader friendly loaders.
- Mobile/tablet/desktop layouts.
- No layout shift для loaders і validation messages.

## Acceptance Criteria

- Усі інтерактивні елементи доступні з клавіатури.
- Mobile menu не ламає scroll.
- Modals закриваються по Escape і backdrop.
- Tables читаються структурно коректно.
- Немає горизонтального scroll на mobile.

---

# EP-PHARMACY-026 — Final checks

## Мета

Підготувати Pharmacy app до production-level стану.

## Завдання

Запустити:

```txt
pnpm --filter @e-pharmacy/pharmacy lint
pnpm --filter @e-pharmacy/pharmacy type-check
pnpm --filter @e-pharmacy/pharmacy build
```

Також перевірити root-команди:

```txt
pnpm lint
pnpm type-check
pnpm build
```

## Acceptance Criteria

- Pharmacy app проходить lint.
- Pharmacy app проходить type-check.
- Pharmacy app build успішний.
- Shared packages не зламані.
- Client app не зламаний після додавання Pharmacy app.

---

## Рекомендований порядок реалізації

Починати краще з фундаменту:

1. `EP-PHARMACY-001` — ініціалізація app.
2. `EP-PHARMACY-002` — структура роутів.
3. `EP-PHARMACY-005` — layout, header, sidebar, mobile menu.
4. `EP-PHARMACY-003` — route constants і filter utilities.
5. `EP-PHARMACY-004` — auth і protected routing.
6. `EP-PHARMACY-007` — shared pharmacy UI primitives.
7. `EP-PHARMACY-008` — dashboard.
8. Далі — таблиці, details pages, profile, API інтеграція.

Це дозволить не починати з окремих сторінок, які потім доведеться переробляти під layout, auth і routes.
