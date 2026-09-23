Привіт) 💙💛
Я переглянула `e-pharmacy.zip` і твоє ТЗ. Тут дуже важливо **не починати з Dashboard або таблиці аптек**. Якщо зараз одразу малювати сторінки admin, ми швидко отримаємо третю копію pharmacy-коду, тільки з іншими назвами. А потім на сцену вийде старий добрий «чому я змінила кнопку в одному місці, а треба ще в чотирьох?» 😄

У проєкті вже є дуже хороший фундамент. `apps/admin` поки фактично порожній — лише `README.md`, зате більшість UI вже винесена в shared packages. Тому admin я б будувала в такій послідовності.

## 1. Що я вже бачу по поточному проєкту

Хороша новина: **дуже багато нового створювати не потрібно**.

У `@e-pharmacy/ui` вже є:

- `UserBadge`;
- `CabinetTopBar`;
- `CabinetSidebar`;
- `SideMenu`;
- `BurgerButton`;
- `DataTable`;
- `SearchInput`;
- `FiltersButton`;
- `FilterDrawer`;
- `RowsPerPageSelect`;
- пагінація;
- `StatsCard` / `StatsGrid`;
- `Tabs`;
- `StatusBadge`;
- всі основні inputs;
- `DocumentUpload`;
- `Comments`;
- `PictureCard`;
- модалки;
- `PageLoader`;
- `ErrorPage`;
- `NotFoundPage`;
- breadcrumbs.

Тобто твоє правило **«не придумуємо велосипед»** тут цілком реально виконати.

Більше того, `UserBadge`, який ти просиш зробити окремим для pharmacy/admin/client header, **вже існує як shared-компонент**:

`packages/ui/src/data-display/UserBadge/UserBadge.tsx`

Його не треба створювати вдруге.

А ось кілька речей справді треба доробити перед admin:

| Що                        | Стан зараз                                    | Що робимо                                 |
| ------------------------- | --------------------------------------------- | ----------------------------------------- |
| User badge                | Уже shared                                    | Просто перевикористовуємо                 |
| Sidebar / TopBar / Burger | Уже shared                                    | Перевикористовуємо                        |
| Fullscreen button         | Зашитий у `PharmacyHeader`                    | Виносимо в shared component               |
| User dropdown у header    | Pharmacy-specific                             | Робимо configurable shared component      |
| Nested menu               | Shared menu поки плоске                       | Додаємо `children` для Reviews/Settings   |
| Auth layout               | Є в client                                    | Виносимо reusable visual layer            |
| Profile                   | Pharmacy-компонент ~дуже великий і монолітний | Розбиваємо на reusable profile blocks     |
| Categories                | Захардкоджені                                 | Треба перевести на DB до адмінського CRUD |
| Permissions               | Є лише `role=admin`                           | Треба нормальний permission layer         |
| Audit history             | Немає                                         | Треба закласти до CRUD admin              |

І ще два важливі моменти з backend.

### Поточний admin auth ще не завершений

`AuthApplication` уже дозволяє:

```ts
'client' | 'pharmacy' | 'admin';
```

але `LoginPayload`, `ForgotPasswordPayload` та backend Zod-схеми зараз дозволяють лише:

```ts
'client' | 'pharmacy';
```

Тобто admin auth був передбачений архітектурно, але ще не підключений.

### У backend зараз є неправильний для нового ТЗ endpoint

Є:

```text
POST /admin/pharmacies
```

який створює pharmacy user + аптеку.

За новими правилами він нам **не потрібен**.

Власник реєструється сам → аптека створюється через pharmacy/client flow → admin тільки переглядає, модерує та керує.

Я б цей legacy-напрямок прибрала ще до реалізації UI admin.

---

# 2. Якою має бути архітектура admin

Я б залишила той самий підхід, який уже добре працює:

```text
Browser
   ↓
apps/admin /api/*
   ↓
same-origin BFF
   ↓
apps/api
   ↓
MongoDB
```

Admin не повинен напряму ходити в backend.

Тобто:

- JWT не читається browser-кодом;
- auth через `HttpOnly`;
- приватні responses — `no-store`;
- authorization — на backend;
- frontend permissions потрібні для UX, але **ніколи не є security boundary**.

Admin працюватиме на `3001` — це, до речі, вже передбачено поточною конфігурацією API через `ADMIN_APP_URL`.

---

# 3. Спочатку треба зафіксувати маршрути

Я б відразу заклала приблизно таку структуру:

```text
apps/admin/src/app/

  login/
  password-recovery/
  reset-password/

  admin/
    layout.tsx

    dashboard/
    profile/

    pharmacy-owners/
      [[...filters]]/
      [ownerId]/

    pharmacies/
      [[...filters]]/
      [pharmacyId]/

    products/
      [[...filters]]/
      new/
      [productId]/
      [productId]/edit/

    product-requests/
      [[...filters]]/
      [requestId]/

    clients/
      [[...filters]]/
      [clientId]/

    orders/
      [[...filters]]/
      [orderId]/

    reviews/
      products/
      pharmacies/

    settings/
      employees/
      employees/[employeeId]/

      site-pages/
      site-pages/[pageKey]/

      categories/

      activity/
```

Останній `activity` — це вже моя пропозиція. Про нього нижче.

Корінь admin:

```text
/
```

просто redirect → `/admin/dashboard`.

---

# 4. ЕТАП 1 — створити сам `apps/admin`

Це перша реальна задача.

Не функціонал. Не Dashboard. Сам application shell.

Треба створити:

- `package.json`;
- `tsconfig.json`;
- `eslint.config.mjs`;
- `next.config.ts`;
- `.env.example`;
- `src/app/layout.tsx`;
- `src/app/page.tsx`;
- `src/app/styles.css`;
- providers;
- базові aliases;
- public assets, якщо вони необхідні.

У root `package.json` додати:

```text
dev:admin
build:admin
lint:admin
type-check:admin
check:admin
```

І admin має потрапити в:

```text
pnpm check:before-deploy
```

Одразу закладаємо ті самі structural checks, які зараз є для pharmacy/client.

### SEO

Admin приватний, тому:

```ts
robots: {
  index: false,
  follow: false,
}
```

І я б обов'язково додала:

```text
apps/admin/src/app/robots.ts
```

з:

```text
Disallow: /
```

**`sitemap.ts` для admin не потрібен взагалі.**

---

# 5. ЕТАП 2 — 404, Error, Global Error, Loading

Їх я б зробила одразу.

Бо це практично безкоштовно: всі компоненти вже shared.

Admin використовує ті самі:

```text
PageLoader
ErrorPage
NotFoundPage
```

Тобто:

```text
loading.tsx
not-found.tsx
error.tsx
global-error.tsx
```

із мінімальною admin-specific copy.

І це важливий плюс для твоєї майбутньої ідеї з «веселішим аптечним loader».

`PageLoader` уже shared.

Отже, коли ми пізніше намалюємо красиву аптечну анімацію, міняємо **один shared-компонент**, а отримують її:

- client;
- pharmacy;
- admin.

Оце саме та архітектура, яку варто закласти зараз.

---

# 6. ЕТАП 3 — завершити shared auth для admin

До сторінки Login треба спочатку завершити контракти.

Змінюємо auth application:

```text
client
pharmacy
admin
```

у:

- shared types;
- validation;
- frontend payloads;
- backend login schema;
- forgot-password schema;
- password reset application routing.

Backend зараз формує reset URL окремо для client/pharmacy. Треба додати:

```text
ADMIN_APP_URL
```

для admin reset-password.

### Login admin

Окремий admin login:

- email/login;
- password;
- Forgot password;
- button;
- image.

**Жодного Register.**

І я б не вводила нову сутність `username/login`. Зараз ідентифікатором користувача є email, і цього достатньо.

Тобто поле можна в UI називати Login або Email, але backend identity лишаємо email.

---

# 7. Важливе питання: звідки береться ПЕРШИЙ admin

Оскільки:

- public registration admin немає;
- employee може бути створений лише з admin;
- але admin ще порожній,

потрібен bootstrap.

Я б зробила окремий development/deployment script на кшталт:

```text
pnpm seed:admin-owner
```

Він створює **першого platform owner**.

Не через публічний API.

Не через приховану сторінку реєстрації.

Не через «тимчасову кнопку, яку потім забудемо прибрати» 😄

Після цього **всі інші співробітники додаються виключно з admin**.

---

# 8. ЕТАП 4 — AdminProtectedRoute

Аналог `PharmacyProtectedRoute`, але:

```text
role === admin
status === active
```

Усі `/admin/*` routes проходять через нього.

Якщо:

- немає session → login;
- client → client app;
- pharmacy → pharmacy app;
- blocked admin → logout/login;
- auth unavailable → shared ErrorPage.

Жодна сторінка admin не повинна самостійно перевіряти role.

---

# 9. ЕТАП 5 — Client header для залогіненого admin

Це я б зробила дуже рано, ще до Dashboard.

У client уже є цікава річ:

```text
authenticated-admin
```

тобто client **вже розпізнає admin session**.

Але зараз показує просто:

> Use the admin application for account tools.

Це треба замінити на нормальний `UserBadge`.

Додати:

```text
NEXT_PUBLIC_ADMIN_APP_URL
```

і в header відображати:

- фото;
- ім'я;
- `Admin cabinet`.

При натисканні → admin dashboard/profile.

Таким чином логіка стане симетричною:

```text
client user    → Client profile badge
pharmacy user  → Pharmacy cabinet badge
admin user     → Admin cabinet badge
```

І використовується той самий `UserBadge`.

---

# 10. ЕТАП 6 — перед Admin Header треба трохи доробити shared Cabinet UI

Ось тут я **не копіювала б `PharmacyHeader.tsx`**.

Спочатку винесла б із нього те, що реально універсальне.

### Fullscreen button

Зараз fullscreen button знаходиться безпосередньо в `PharmacyHeader`.

Ти якраз написала, що якщо він не окремий — зробити окремим.

Так і треба.

Наприклад:

```text
@e-pharmacy/ui/cabinet/FullscreenButton
```

І після цього його використовують:

```text
PharmacyHeader
AdminHeader
```

### User dropdown

Зараз dropdown:

```text
Go to profile
Go to the website
Go to my pharmacy
Log out
```

Його можна зробити shared/configurable.

Pharmacy передає:

```text
Profile
Website
Public pharmacy
Logout
```

Admin:

```text
Profile
Website
Logout
```

Таким чином одна розмітка, один accessibility flow, один outside click, один Escape handler.

### Nested navigation

Оце вже обов'язкова зміна.

Поточний `NavigationItem` має:

```ts
label;
href;
icon;
exact;
disabled;
```

але немає `children`.

Admin потребує:

```text
Reviews
  Pharmacy reviews
  Product reviews

Settings
  Employees
  Site pages
  Product categories
```

Тому shared navigation треба розширити, наприклад:

```ts
children?: NavigationItem[]
```

І додати:

- expand/collapse;
- chevron;
- `aria-expanded`;
- active parent, якщо active child;
- автоматичне відкриття групи активного route;
- нормальну поведінку collapsed desktop sidebar;
- таку саму поведінку mobile menu.

Pharmacy при цьому нічого не втрачає — її меню лишається плоским.

---

# 11. ЕТАП 7 — Admin Shell

Після shared refactor уже робимо:

```text
AdminShell
AdminHeader
AdminSidebar
AdminMobileMenu
```

Але вони мають складатися в основному із shared-компонентів.

Наприклад:

```text
AdminShell
 ├─ CabinetSidebar
 ├─ CabinetTopBar
 │    ├─ Breadcrumbs
 │    ├─ FullscreenButton
 │    └─ UserBadge / UserMenu
 └─ content
```

Admin-specific тут тільки:

- navigation config;
- routes;
- breadcrumbs;
- permissions;
- logout/controller.

### Меню

Я підтримую назву **«Співробітники»**, а не «Ролі».

Бо користувач заходить не «створити роль», а:

> додати людину і визначити, що їй можна.

Ролі можна буде додати як **permission presets** пізніше:

```text
Moderator
Content manager
Support
Administrator
```

але основна сутність — Employee.

---

# 12. ЕТАП 8 — permissions треба зробити ДО CRUD сторінок

Це один із найважливіших архітектурних моментів.

Я б **не робила**:

```text
user.role = pharmacy_moderator
user.role = products_editor
user.role = reviews_moderator
...
```

`User.role` має залишитись coarse-grained:

```text
client
pharmacy
admin
```

А для admin додати окремі permissions.

Наприклад:

```text
pharmacies:
  view
  edit
  moderate

products:
  view
  create
  edit
  delete

productRequests:
  view
  edit
  moderate

clients:
  view

orders:
  view

productReviews:
  view
  moderate

pharmacyReviews:
  view
  moderate

sitePages:
  view
  edit
  publish

categories:
  view
  create
  edit
  delete

employees:
  view
  create
  edit
  managePermissions
  revokeAccess

audit:
  view
```

Frontend може приховати недоступний menu item.

Але backend **на кожній операції** перевіряє permission.

Наприклад:

```text
requireAdminPermission('products', 'edit')
```

Саме backend вирішує, чи можна дію виконати.

---

# 13. Platform Owner

Я б окремо ввела поняття **platform owner**.

Це не ще один `User.role`.

Це admin із максимальними правами.

Owner:

- управляє співробітниками;
- змінює permissions;
- бачить employee documents;
- може змінювати employee identity;
- не може випадково позбавити себе останнього owner access;
- не може бути видалений звичайним employee.

Це значно безпечніше, ніж засунути все в `role`.

І воно потім майже один-в-один переноситься на pharmacy roles.

---

# 14. ЕТАП 9 — Audit log

Я б робила його **до того, як admin почне щось редагувати**.

Бо якщо додати logs наприкінці, половину mutations доведеться переписати.

Наприклад:

```text
AuditLog

actorUserId
actorNameSnapshot

action
entityType
entityId

before
after
changedFields

reason

createdAt
requestId
```

Наприклад:

```text
22 Sep 2026 16:24
Natalia
Pharmacy #123
Status: on_moderation → active
```

або:

```text
Product #XXX
Category: Hygiene → Beauty
Changed by: John Smith
```

Паролі, JWT, cookies, file binary тощо в audit log **ніколи не потрапляють**.

Для критичних mutations audit краще записувати в тій же Mongo transaction.

### Я б додала ще один пункт Settings

```text
Activity history
```

Тобто Settings матиме:

```text
Employees
Site pages
Product categories
Activity history
```

Бо якщо історія змін справді потрібна системно, її треба десь нормально переглядати.

На detail pages при цьому можна показувати відфільтровану історію конкретної сутності.

---

# 15. ЕТАП 10 — Admin Profile

Тільки після auth + shell + permissions.

І тут є ще одна важлива річ.

Поточний:

```text
PharmacyProfilePageContent.tsx
```

дуже великий і містить разом:

- user data;
- pharmacy data;
- about;
- bank;
- documents;
- reviews;
- comments;
- sessions;
- moderation.

Його **не треба копіювати в admin**.

Треба перед цим розбити reusable частини.

Наприклад:

```text
ProfileIdentityCard
ProfilePictureEditor
PersonalDataForm
ChangePasswordForm
DocumentsPanel
PrivateNotesPanel
ActiveSessionsPanel
ProfileTabsLayout
```

Тоді:

```text
PharmacyProfile
```

компонує їх + pharmacy-specific tabs.

А:

```text
AdminProfile
```

компонує ті ж shared blocks.

### Admin profile

Ліва частина:

- photo;
- upload/delete photo;
- name;
- email;
- role;
- status.

Без:

- Pharmacy Profile status;
- Send for moderation.

Tabs:

```text
Personal information
Documents
Comments
Active sessions
```

### Personal information

Regular employee:

- name — readonly;
- email — readonly;
- change password — доступно.

Owner:

- може мати право edit.

Але owner-edit я б реалізувала через **admin employee endpoint**, а не розширювала generic `/auth/current` безконтрольно.

### Documents

Я б **не використовувала PharmacyDocument**.

Це інший domain.

Потрібен окремий:

```text
AdminEmployeeDocument
```

або generic private user document.

Regular employee:

- download own documents.

Owner:

- upload;
- replace;
- delete.

### Comments

Повністю приватні.

Умова backend:

```text
note.ownerUserId === currentUser.id
```

Ніякий інший employee і навіть інший moderator їх не бачить.

UI `Comments` можна перевикористати.

### Sessions

Можна практично напряму перевикористати поточну auth session logic.

---

# 16. ЕТАП 11 — динамічні категорії товарів

Цей пункт я б зробила **раніше Products admin**, хоча в меню він знаходиться в Settings.

Зараз категорії жорстко зашиті:

```ts
medicine;
vitamins;
beauty;
hygiene;
medical_devices;
other;
```

через:

```text
PRODUCT_CATEGORIES
ProductCategory union
validation
```

А ти хочеш:

> додавати та редагувати категорії через admin.

Тобто це вже несумісно зі статичним enum.

Тому потрібна `ProductCategory` collection, наприклад:

```text
id
name
slug
status
sortOrder
image/icon optional
createdAt
updatedAt
createdBy
updatedBy
```

І продукти вже посилаються на category entity.

Існуючі категорії треба просто засіяти як initial categories.

Це відразу підготує твою майбутню функцію:

> кнопка «Каталог товарів» → список категорій → каталог категорії.

Тобто цю майбутню фічу реально варто врахувати **вже зараз**.

---

# 17. ЕТАП 12 — Dashboard

І лише тепер Dashboard 😄

Для admin його задача інша, ніж у pharmacy.

Я б не перевантажувала його графіками просто заради графіків.

Основне:

```text
Pharmacies
Products
Product requests
Clients
Reviews
```

А всередині особливо важливі **action-required** значення.

Наприклад:

```text
Pharmacies
Total             159
On verification    12
On moderation       4
Blocked              2
```

```text
Product requests
New                 19
In progress          7
Approved           221
Rejected             9
```

```text
Reviews
Pending products    17
Pending pharmacies   8
```

Для admin це набагато корисніше, ніж ще один красивий графік, який усі чемно ігнорують.

### API

Я б не робила 10–15 HTTP-запитів.

Краще:

```text
GET /admin/dashboard/summary
```

який одним response повертає всі основні counters.

---

# 18. ЕТАП 13 — «Власники аптек»

Саме цей розділ варто робити до Pharmacies.

### Table

Без Create button.

Колонки я б зробила приблизно:

```text
Photo
Owner
Email
Phone
Pharmacies
Pharmacy status
Account status
Registration date
```

Filters:

```text
Name
Email
Phone
Account status
Pharmacy status
Registration date
```

### Detail page

Тут дуже важливо не змішувати:

```text
Owner account status
```

та:

```text
Pharmacy moderation status
```

Owner може бути:

```text
active
blocked
```

А Pharmacy:

```text
new
on_verification
on_moderation
active
blocked
```

Модерацію аптеки робимо в Pharmacy page.

На Owner page:

- personal data;
- account status;
- registration data;
- **table of linked pharmacies**;
- activity history.

Навіть якщо сьогодні:

```text
1 owner = 1 pharmacy
```

API і UI відразу мають думати:

```text
1 owner → N pharmacies
```

Тоді пункт №7 твого roadmap не змусить переробляти admin.

---

# 19. ЕТАП 14 — «Аптеки»

Table — максимально на базі поточних pharmacy tables.

Без Create.

Detail page я б зробила через tabs:

```text
Overview
Pharmacy data
About
Payment details
Documents
Products
Clients
Orders
Reviews
Activity
```

Але важливе правило:

**не завантажувати всі вкладки одразу.**

Відкрили Products → тоді запит Products.

Відкрили Reviews → тоді Reviews.

Інакше одна сторінка аптеки перетвориться на маленький DDoS власного backend 😄

### Overview

Показувати:

- pharmacy;
- owner;
- status;
- contact;
- creation/activation dates;
- moderation info;
- key counts.

### Products

Таблиця pharmacy offers.

### Clients

Клієнти саме цієї аптеки.

### Orders

Замовлення цієї аптеки.

### Reviews

Відгуки про аптеку.

### Activity

Хто й що міняв.

---

# 20. ЕТАП 15 — «Товари»

Table — той самий pattern.

Admin може:

- create;
- view;
- edit;
- інколи delete.

### Create Product

Я б не копіювала весь pharmacy Product Request form.

Треба виділити reusable поля:

```text
ProductCoreFields
ProductImageField
ProductDescriptionEditor
...
```

Бо у pharmacy request є pharmacy-specific поля на кшталт коментаря аптеки та attachments.

Admin product — це canonical catalog entity.

### Product detail

Я б показувала:

```text
Product information
Image
Article
Category
Manufacturer
Dosage/package/etc.
Status
Created/updated
```

і окремими tabs:

```text
Pharmacies
Reviews
Activity
```

### Pharmacies table

Дуже корисна.

Наприклад:

```text
Pharmacy
Price
Available quantity
Status
Added at
```

Бо global Product ≠ pharmacy stock.

Admin не повинен тут редагувати pharmacy stock.

### Source request

Якщо товар був створений після Product Request:

```text
Created from request #...
```

і link.

Backend це вже частково підтримує — approved request зараз може автоматично створити або прив'язати Product.

### Delete

Тут твоє правило правильне.

Hard delete можливий тільки якщо продукт:

- не був у orders;
- не має meaningful statistics/history;
- немає pharmacy offers;
- немає reviews;
- не має інших business references.

І це вирішує backend.

Інакше:

```text
Archive / deactivate
```

а не delete.

---

# 21. ЕТАП 16 — «Запити на товари»

Admin їх **не створює**.

Table:

```text
Request #
Product
Article
Pharmacy
Category
Status
Created
Updated
```

Filters:

```text
request #
product
article
pharmacy
category
status
dates
```

Detail page максимально повторює pharmacy detail layout.

Але admin має moderation controls:

```text
New
→ In progress
→ Approved

або
→ Rejected
```

Для Reject — reason.

Для Approve:

- link existing product;
- або create product.

Ця backend-логіка в тебе вже частково реалізована.

Тут її треба не переписувати, а дати їй нормальний admin UI.

---

# 22. ЕТАП 17 — «Клієнти»

Admin клієнта не створює.

### Table

Глобальний список клієнтів.

### Detail

Не треба напихати сюди все на світі.

Я б залишила:

```text
Overview
Pharmacies
Orders
Products / purchase history
Reviews
Activity
```

Найважливіша нова вкладка:

### Pharmacies

Таблиця аптек, із якими клієнт реально взаємодіяв.

Не просто favorite pharmacy, а business relation через orders/transactions.

Так ми не створюємо штучний many-to-many зв'язок лише заради UI.

---

# 23. ЕТАП 18 — «Замовлення»

На твоє питання:

> Чи достатньо тільки таблиці?

Я б усе-таки залишила **detail page**, але тільки read-only.

Тому що коли з'явиться:

- support;
- чат;
- скарга;
- неправильний order;
- проблема з аптекою;

admin потрібно зрозуміти, що сталося.

Table-only буде замало.

Але admin **не повинен управляти normal order lifecycle**.

Тобто немає:

```text
Accept
Reject
Successful
...
```

Це відповідальність pharmacy.

Admin order detail:

- client snapshot;
- pharmacy snapshot;
- products;
- price;
- delivery;
- payment;
- comment;
- status;
- status history;
- created/updated timestamps.

Можна максимально перевикористати pharmacy `OrderDetails` у:

```text
mode="readonly"
```

Тобто ще одну сторінку фактично отримуємо майже без нового дизайну.

---

# 24. ЕТАП 19 — Reviews moderation

Тут потрібна backend-зміна.

Відгук не повинен одразу бути public.

Додаємо moderation state:

```text
pending
published
rejected
```

і:

```text
moderatedBy
moderatedAt
rejectionReason
```

Client надсилає:

```text
pending
```

Public API показує тільки:

```text
published
```

Admin бачить усе.

### Product reviews

Окрема table.

### Pharmacy reviews

Окрема table.

Actions:

```text
Publish
Reject
```

Для reject — reason бажано.

І це дуже добре закладається під твою майбутню фічу:

> pharmacy відповідає на review клієнта.

Review уже матиме стабільний lifecycle, і пізніше до нього можна додати reply.

---

# 25. ЕТАП 20 — Site Pages CMS

Тут я дуже раджу **не робити «редактор усього HTML сторінки»**.

Це швидко перетвориться на генератор пригод.

Краще сторінка має структуровані editable fields.

Наприклад Home:

```text
Hero title
Hero text
Hero image
Advantages title
Advantages text
...
SEO title
SEO description
```

Catalog pharmacies:

```text
Heading
Intro
SEO
Banner
```

Information page:

```text
Title
Content
SEO
```

DB:

```text
SitePage
  key
  slug
  draftContent
  publishedContent
  status
  updatedBy
  publishedBy
  updatedAt
  publishedAt
```

Тобто admin може:

```text
Save draft
Publish
```

І це відразу вирішить майбутню **About us**.

Коли додаси About page — вона вже природно стане ще однією CMS page.

---

# 26. ЕТАП 21 — Employees

В UI я б назвала саме:

## Employees

Table містить **усіх, хто має або колись мав admin access**.

Статуси, наприклад:

```text
Invited
Active
Suspended
Revoked
```

Не видаляємо запис людини, яка вже щось робила.

Інакше audit:

> Product edited by [deleted user]

виглядає трохи як кримінальний серіал 😄

### Додавання employee

Я б не створювала пароль за людину.

Owner вводить:

- name;
- email;
- permissions.

Employee отримує одноразове:

```text
Set your password
```

Посилання.

Тобто це invitation flow.

Публічної registration page при цьому **немає**.

### Employee detail

- personal info;
- access status;
- permissions;
- documents;
- activity.

### Permission matrix

Приблизно:

| Розділ     | View | Create | Edit | Moderate | Delete |
| ---------- | ---: | -----: | ---: | -------: | -----: |
| Pharmacies |    ✓ |      — |    ✓ |        ✓ |      — |
| Products   |    ✓ |      ✓ |    ✓ |        — |      ✓ |
| Requests   |    ✓ |      — |    ✓ |        ✓ |      — |
| Clients    |    ✓ |      — |    — |        — |      — |
| Orders     |    ✓ |      — |    — |        — |      — |
| Reviews    |    ✓ |      — |    — |        ✓ |      — |
| Pages      |    ✓ |      — |    ✓ |        ✓ |      — |
| Categories |    ✓ |      ✓ |    ✓ |        — |      ✓ |

Це значно гнучкіше, ніж десятки ролей.

Пізніше можна додати permission presets.

---

# 27. ЕТАП 22 — Categories UI

Після того як categories переведені в DB, ця сторінка вже проста.

Table:

```text
Name
Slug
Products count
Visibility
Sort order
Updated
Updated by
```

Actions:

```text
Add
Edit
Archive
Delete — тільки якщо safe
```

Я б також одразу заклала:

```text
sortOrder
isVisible
```

Бо твій майбутній Header Catalog буде використовувати саме їх.

---

# 28. Що я б НЕ додавала до admin

Щоб admin не роздути, я б зараз не робила:

- створення власників;
- створення аптек;
- створення клієнтів;
- створення Product Requests;
- pharmacy stock management через admin;
- звичайне керування status замовлень;
- cart/checkout;
- pharmacy sales tools;
- supplier section.

До речі, у поточному `apps/admin/README.md` ще згадуються **Suppliers**.

У твоєму актуальному ТЗ Suppliers немає, тому я б прибрала це з README, щоб воно не перетворилось на «чому тут написано, що ми колись планували постачальників?» через пів року.

---

# 29. Що варто додати до admin від мене

Я бачу три речі, які справді виправдані.

### Activity history

Як окремий Settings section.

Це прямо випливає з твоєї вимоги бачити, хто і що змінив.

### Dashboard moderation queues

Не просто «100 аптек», а:

```text
12 pharmacies need verification
8 reviews need moderation
5 requests are new
```

Це робить Dashboard реально робочим інструментом.

### Draft / Publish для CMS

Щоб випадкове редагування Home page не полетіло одразу на production.

---

# 30. Як закласти твої майбутні фічі вже зараз

Я їх зафіксувала як roadmap. І частину з них справді треба врахувати вже в admin architecture.

| Майбутня функція            | Що закладаємо зараз                                                             |
| --------------------------- | ------------------------------------------------------------------------------- |
| About us                    | Site Pages CMS                                                                  |
| Admin ↔ Pharmacy chat       | стабільні User/Pharmacy IDs + permissions                                       |
| Карти аптек                 | не прив'язуємо pharmacy лише до текстової address; передбачаємо geo/coordinates |
| Header Product Catalog      | DB-driven Categories + sort/visibility                                          |
| Новий loader                | один shared `PageLoader`                                                        |
| Pharmacy/Admin roles        | спільна концепція permission layer                                              |
| Кілька аптек одного owner   | `Owner → pharmacies[]`, не one-to-one admin API                                 |
| Тарифні пакети              | **не змішуємо** subscription зі `pharmacy.status`                               |
| Pharmacy replies to reviews | стабільний Review lifecycle/moderation                                          |
| Notification bell           | всі business mutations централізовані, actor IDs збережені                      |
| Promotions                  | майбутня знижка прив'язується до pharmacy `ProductOffer`, а не global Product   |
| Excel/Word/PDF              | filters/API contracts робимо reusable, щоб export використовував ті самі query  |

Особливо важливі тут три речі.

**Тарифи не повинні ставати ще одним pharmacy status.** Moderation status і subscription status — різні domains.

**Акції не повинні жити в global Product.** Ціна та stock уже pharmacy-specific, тому discount логічно буде частиною pharmacy offer/promotion.

**Multiple pharmacies не повинні ламати Owner API.** Уже зараз на Owner detail ми показуємо pharmacies як список, навіть якщо список сьогодні містить один рядок.

---

# 31. Фінальний етап — tests та structural audit

Коли функціонально все завершено, тільки тоді вважаємо admin готовим.

Я б додала:

```text
check:admin-layout
check:admin-auth
check:admin-lib
check:admin-components
check:admin-routes
check:admin-permissions
check:admin-resources
```

і загальний:

```text
pnpm check:admin
```

Перевіряємо обов'язково:

- client не відкриває admin;
- pharmacy не відкриває admin;
- admin без permission не може виконати mutation навіть вручну через API;
- blocked admin не працює;
- admin BFF не прокидає browser-controlled authorization headers;
- private responses `no-store`;
- malformed IDs fail-closed;
- filters URL-driven;
- pagination authoritative;
- inactive tabs не роблять зайві requests;
- loading/error/empty не маскуються під реальні `0`;
- audit створюється для mutations;
- employee permissions перевіряються backend;
- немає Create Owner/Pharmacy/Client/Request endpoint;
- admin не потрапляє в sitemap;
- весь admin `noindex, nofollow`.

---

# 32. Отже, фактичний порядок робіт

Якщо звести весь план до послідовності реалізації, я б ішла **саме так**:

1. **Очистити та зафіксувати admin architecture**: routes, entities, permissions; прибрати legacy admin pharmacy creation та старий Suppliers scope.
2. **Створити runnable `apps/admin`**: package/config/env/scripts/layout/status pages/robots.
3. **Завершити shared auth для `application: admin`** та зробити bootstrap першого owner.
4. **Login → Password Recovery → Reset Password → AdminProtectedRoute.**
5. **Доробити client header для admin session.**
6. **Refactor shared Cabinet UI**: FullscreenButton, user dropdown, nested navigation, reusable shell pieces.
7. **Admin Header + Sidebar + Mobile menu + Breadcrumbs.**
8. **Закласти RBAC/permissions.**
9. **Закласти Audit Log.**
10. **Розбити pharmacy Profile на reusable blocks і зробити Admin Profile.**
11. **Перевести Product Categories зі static enum у DB-driven model.**
12. **Dashboard.**
13. **Pharmacy Owners.**
14. **Pharmacies.**
15. **Products + Create + Detail + Edit.**
16. **Product Requests + moderation.**
17. **Clients.**
18. **Orders: global table + read-only detail.**
19. **Product Reviews moderation.**
20. **Pharmacy Reviews moderation.**
21. **Site Pages CMS.**
22. **Employees UI + invitations + permissions management.**
23. **Categories UI.**
24. **Global Activity History.**
25. **Tests, structural checks, security/permissions audit, performance audit і фінальний cleanup.**

І найголовніше: **перший шматок роботи я б не починала з жодної business-сторінки**. Перший практичний milestone має закінчитися тим, що ми вже можемо відкрити `localhost:3001`, зайти під admin, побачити правильний shared shell, перейти в Profile, вийти, відновити пароль і побачити admin badge на client-сайті. Після цього Dashboard, Pharmacies, Products та решта будуть уже не новим застосунком, а просто новими domain modules усередині готового каркаса. Це буде значно чистіше і майже без дублювання.
