# Vendor Technical Specification — українська версія для перевірки

> Цей документ є українською версією Vendor ТЗ для проєкту **E-PHARMACY**.  
> Інтерфейс Vendor-частини має бути англійською мовою, тому всі рекомендовані тексти для кнопок, toast, modal, empty/error states залишені англійською.

---

## Зміст

1. [Загальний опис](#1-загальний-опис)
2. [Auth та доступ](#2-auth-та-доступ)
3. [Layout та навігація](#3-layout-та-навігація)
4. [Особистий кабінет аптеки](#4-особистий-кабінет-аптеки)
5. [Dashboard](#5-dashboard)
6. [Замовлення](#6-замовлення)
7. [Клієнти](#7-клієнти)
8. [Ліки](#8-ліки)
9. [Заявки на створення нових ліків](#9-заявки-на-створення-нових-ліків)
10. [Службові сторінки, loader та states](#10-службові-сторінки-loader-та-states)
11. [Рекомендована структура routes](#11-рекомендована-структура-routes)
12. [Shared packages та reusable logic](#12-shared-packages-та-reusable-logic)

---

# 1. Загальний опис

## 1.1. Призначення Vendor частини

Vendor частина — це особистий кабінет аптеки в екосистемі **E-PHARMACY**. Через Vendor app аптека керує власним профілем, замовленнями, клієнтами, ліками, заявками на створення нових ліків та переглядає статистику.

Vendor працює разом із:

- **Client** — публічна частина для покупців: аптеки, каталог ліків, cart, checkout, orders, reviews.
- **Admin** — адміністративна панель: модерація аптек, глобальні ліки, заявки, клієнти, замовлення, постачальники.
- **API** — спільний backend для всіх частин системи.
- **Shared packages** — спільні типи, UI, config, validation, api-client, utils.

На цьому етапі це ТЗ є основним джерелом правди для майбутньої реалізації Vendor частини. Поточний backend/client можуть відрізнятися, але мають поступово приводитися до цієї логіки.

## 1.2. Глобальні частини Vendor app

Vendor app складається з таких великих блоків:

1. **Auth та доступ**
   - спільні сторінки login/register/forgot-password;
   - реєстрація аптеки;
   - redirect за роллю користувача;
   - обмеження доступу за статусом аптеки.

2. **Layout та navigation**
   - Header;
   - Sidebar;
   - Mobile menu;
   - Breadcrumbs;
   - protected layout для авторизованої аптеки без Footer;
   - public auth layout, який може повторювати Client auth layout.

3. **Dashboard**
   - статус аптеки;
   - статистика замовлень;
   - статистика клієнтів;
   - статистика ліків;
   - статистика заявок;
   - переходи в таблиці з уже застосованими фільтрами.

4. **Pharmacy profile**
   - дані аптеки;
   - опис аптеки;
   - платіжні реквізити;
   - відгуки;
   - pending moderation data.

5. **Orders**
   - таблиця власних замовлень;
   - сторінка одного замовлення;
   - статуси замовлення;
   - резерв товарів;
   - фіксація цін.

6. **Customers**
   - таблиця власних клієнтів;
   - сторінка одного клієнта;
   - readonly дані клієнта;
   - статистика клієнта тільки в межах поточної аптеки.

7. **Medicines**
   - таблиця власних ліків;
   - таблиця всіх ліків;
   - карточка ліків;
   - глобальні дані ліків з Admin;
   - аптечні залишки, резерви та ціна.

8. **Medicine creation requests**
   - таблиця заявок;
   - створення/редагування заявки;
   - карточка заявки;
   - flow модерації через Admin.

9. **Service pages and states**
   - error page;
   - 404 page;
   - loaders;
   - empty states;
   - nothing found states.

## 1.3. Головний принцип доступу

Vendor завжди бачить і змінює тільки дані поточної аптеки.

Vendor не має бачити:

- замовлення інших аптек;
- клієнтів, які ніколи не робили замовлення в цій аптеці;
- замовлення клієнта в інших аптеках;
- аптечні дані ліків інших аптек;
- заявки інших аптек;
- внутрішні Admin-only поля;
- ліки зі статусом `new` / `Нові`.

## 1.4. Власники даних

### Client відповідає за

- реєстрацію клієнта;
- редагування профілю клієнта;
- cart;
- checkout;
- створення замовлення;
- відгуки клієнтів.

### Vendor відповідає за

- редагування власного профілю аптеки за правилами статусу;
- обробку власних замовлень;
- перегляд власних клієнтів;
- керування списком власних ліків;
- створення чернеток і надсилання заявок на нові ліки;
- перегляд власної статистики.

### Admin відповідає за

- модерацію аптек;
- активацію/деактивацію аптек;
- блокування/розблокування клієнтів;
- створення та редагування глобальних ліків;
- модерацію заявок на нові ліки;
- перегляд замовлень;
- глобальні довідники, статуси, службові дані.

## 1.5. Правило URL для фільтрів

Для Vendor-таблиць фільтри мають змінювати URL, а pagination / rowsPerPage — ні.

Рекомендований формат — path segments, а не query params:

```txt
/vendor/orders/status-new
/vendor/orders/status-successful/delivery-pickup
/vendor/clients/status-active
/vendor/medicines/status-active/stock-empty
/vendor/medicine-requests/status-draft
```

Не використовувати для pagination / rowsPerPage:

```txt
/vendor/orders?status=new&page=3&limit=50
```

### У URL зберігаються

- бізнес-фільтри таблиць: status, category, stock, delivery, payment, date, search values;
- фільтри, з якими користувач переходить із Dashboard у таблицю;
- фільтри, які мають відновлюватися після refresh або Back/Forward.

### У URL не зберігаються

- page;
- rowsPerPage;
- limit;
- loading state;
- open/closed state mobile filters;
- temporary UI-only state.

Pagination і rowsPerPage зберігаються локально в state.

---

# 2. Auth та доступ

## 2.1. Загальна логіка Auth

Auth сторінки є спільними глобальними сторінками системи, а не частиною `/vendor` route group.

Рекомендовані routes:

```txt
/auth/register
/auth/login
/auth/forgot-password
```

Vendor protected routes починаються з `/vendor`.

Після login backend повертає роль користувача:

```txt
client | pharmacy | admin
```

Redirect після login:

- `client` → `/profile`;
- `pharmacy` → `/vendor/dashboard`;
- `admin` → `/admin/dashboard`.

## 2.2. Сторінка реєстрації

Сторінка реєстрації дозволяє створити акаунт:

- Client;
- Pharmacy.

За замовчуванням обраний тип акаунта: **Client**.

На сторінці потрібен перемикач типу акаунта:

- `Client`;
- `Pharmacy`.

Рекомендований UI:

- radio buttons;
- segmented control;
- tabs-like switch.

### Client registration

Поля:

- name;
- email;
- phone;
- password.

Після успішної реєстрації створюється Client акаунт зі статусом `active`.

### Pharmacy registration

Поля:

- pharmacy name;
- email;
- phone;
- password;
- supporting documents.

Після успішної реєстрації створюється Pharmacy акаунт зі статусом `new`.

Аптека може зайти в Vendor cabinet, але не може продавати ліки, додавати ліки до себе або створювати заявки, поки Admin не активує аптеку.

### Supporting documents

Для реєстрації аптеки документи є обов’язковими.

Документи мають підтверджувати право аптеки продавати лікарські засоби.

Підтримувані формати:

- PDF;
- JPG;
- PNG;
- WEBP.

Обмеження:

- максимальний розмір одного файлу — 5 MB;
- можна дозволити кілька файлів;
- рекомендована максимальна кількість — 5 файлів.

UI має показувати:

- filename;
- file size;
- remove file button before submit;
- validation error for wrong format;
- validation error for too large file;
- loading state під час upload.

Рекомендовані тексти:

- Block title: `Supporting documents`
- Description: `Upload documents proving that your pharmacy is allowed to sell medicines. Admin will review them before activating your pharmacy account.`
- Error: `Upload supporting documents to register a pharmacy account.`
- Success toast: `Pharmacy account created. Please wait for Admin review.`

Після успішної реєстрації pharmacy redirect:

```txt
/vendor/dashboard
```

## 2.3. Сторінка login

Login сторінка спільна для Client, Vendor і Admin.

Поля:

- email;
- password.

На login не потрібно додавати вибір Client / Pharmacy / Admin. Backend визначає роль за email/password.

### Login inactive pharmacy

Якщо аптека має статус `inactive`, вхід у Vendor cabinet блокується.

Повідомлення:

```txt
Your account is temporarily inactive. Please contact administration for details.
```

### Login new pharmacy

Якщо аптека має статус `new`, login дозволений.

Після входу аптека переходить на `/vendor/dashboard` і бачить banner:

```txt
Your pharmacy is not activated yet. Complete the required information and wait for Admin review.
```

Нова аптека може:

- зайти в кабінет;
- переглядати власні дані;
- редагувати власні дані;
- переглядати всі ліки, доступні Vendor.

Нова аптека не може:

- продавати ліки;
- додавати ліки до себе;
- створювати заявки на нові ліки.

## 2.4. Forgot password

Сторінка спільна для Client, Vendor і Admin.

Користувач вводить email. Backend визначає акаунт і надсилає інструкцію, якщо акаунт існує.

Не потрібно повідомляти, чи email існує в системі.

Нейтральне повідомлення після submit:

```txt
If an account with this email exists, we will send password recovery instructions.
```

## 2.5. Унікальність email та phone

Email має бути унікальним у всій системі:

- Client;
- Vendor;
- Admin.

Один email не може бути одночасно акаунтом клієнта й аптеки.

Phone також унікальний у всій системі:

- Client;
- Vendor;
- Admin.

## 2.6. Auth reusable components

Auth сторінки мають використовувати спільні компоненти:

- `Button`;
- `NameInput`;
- `EmailInput`;
- `PhoneInput`;
- `PasswordInput`;
- `FileUpload`;
- `LoadingSpinner`;
- `Toast`;
- `AccountTypeSegmentedControl` або `AccountTypeRadioGroup`.

---

# 3. Layout та навігація

## 3.1. Глобальна логіка layout

У Vendor частині мають бути:

- Header;
- Sidebar / ліва частина меню;
- Mobile menu;
- Breadcrumbs;
- protected layout для авторизованої аптеки без Footer;
- public layout для auth сторінок, який може повторювати Client auth layout.

Footer у protected Vendor layout не використовується.

На сторінці має бути тільки один видимий `<main>`.

## 3.2. Protected Vendor layout

Protected layout використовується для всіх сторінок Vendor cabinet:

- `/vendor/dashboard`;
- `/vendor/profile`;
- `/vendor/orders`;
- `/vendor/clients`;
- `/vendor/medicines`;
- `/vendor/all-medicines`;
- `/vendor/medicine-requests`.

Базова структура:

```tsx
<>
  <VendorHeader />
  <div className={css.layout}>
    <VendorSidebar />
    <main className={css.main}>{children}</main>
  </div>
</>
```

Breadcrumbs не мають бути в layout напряму. Вони розміщуються всередині сторінок перед `h1`.

## 3.3. Public auth layout

Public layout використовується для:

- `/auth/login`;
- `/auth/register`;
- `/auth/forgot-password`.

Ці сторінки можуть повторювати Client auth layout.

Sidebar у public layout не показується.

## 3.4. Header

Vendor Header схожий на Client Header, але має іншу навігаційну логіку.

У Vendor Header є:

- Logo;
- auth buttons для неавторизованого користувача;
- PharmacyBadge для авторизованої аптеки;
- Logout button;
- Burger button для mobile/tablet.

У Vendor Header немає:

- Client desktop navigation;
- cart button;
- cart count;
- links to Client catalog;
- links to pharmacy stores.

### Header для неавторизованого користувача

Показати:

- Logo;
- `Log in`;
- `Register`.

Links:

```txt
/auth/login
/auth/register
```

### Header для авторизованої аптеки

Показати:

- Logo;
- PharmacyBadge;
- `Log out`;
- Burger button на mobile/tablet.

### PharmacyBadge

Показує:

- pharmacy photo або fallback initials;
- pharmacy name;
- link to `/vendor/profile`.

Якщо назва довга — обрізати через `text-overflow: ellipsis`.

## 3.5. Sidebar

Sidebar — основна desktop-навігація Vendor cabinet.

Показується тільки в protected layout для статусів:

- `new`;
- `active`;
- `on_moderation`.

Для `inactive` аптеки вхід у кабінет заблокований, тому Sidebar не показується.

### Navigation links

```txt
Dashboard              /vendor/dashboard
Orders                 /vendor/orders
Customers              /vendor/clients
Own medicines          /vendor/medicines
All medicines          /vendor/all-medicines
Medicine requests      /vendor/medicine-requests
Pharmacy profile       /vendor/profile
```

### Active state

Active state має працювати для вкладених сторінок.

Приклади:

- `/vendor/orders` і `/vendor/orders/[orderId]` → active `Orders`;
- `/vendor/clients` і `/vendor/clients/[clientId]` → active `Customers`;
- `/vendor/medicine-requests`, `/vendor/medicine-requests/new`, `/vendor/medicine-requests/[requestId]`, `/vendor/medicine-requests/[requestId]/edit` → active `Medicine requests`.

## 3.6. Sidebar для різних статусів аптеки

### New pharmacy

Може відкривати:

- Dashboard;
- Pharmacy profile;
- All medicines.

Не може:

- продавати ліки;
- додавати ліки до аптеки;
- створювати заявки;
- обробляти замовлення.

Сторінки orders/customers/own medicines/requests можуть відкриватися з empty або restricted state.

### Active pharmacy

Має повний доступ до Vendor cabinet.

### On moderation pharmacy

Має майже повний доступ, але не може повторно редагувати profile data, які вже pending moderation.

### Inactive pharmacy

Не може зайти в кабінет.

## 3.7. Mobile menu

Mobile menu відкривається через Burger button.

У mobile menu показати:

- Logo;
- close button;
- pharmacy info, якщо user авторизований;
- Vendor navigation links;
- Logout button.

Mobile menu має:

- відкриватися поверх сторінки;
- блокувати body scroll;
- закриватися по backdrop click;
- закриватися по Escape;
- закриватися після переходу на іншу сторінку;
- мати focus trap;
- мати accessible close button.

Використати ті самі hooks/patterns, що й у Client offcanvas.

## 3.8. Breadcrumbs

Breadcrumbs повністю перевикористовуються з Client.

Показуються всередині `main`, перед `h1`.

Приклад структури:

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

Breadcrumbs мають:

- бути wrapped у `nav`;
- мати `aria-label="Breadcrumbs"`;
- використовувати `ul/li`;
- current page — `aria-current="page"`;
- separators — `aria-hidden="true"`.

---

# 4. Особистий кабінет аптеки

## 4.1. Загальна логіка

Pharmacy profile — це сторінка, де аптека переглядає й редагує власні дані залежно від статусу.

Сторінка має бути стилістично схожа на Client profile.

Потрібно перевикористовувати common/layout/form-field компоненти.

## 4.2. Статуси аптеки

Аптека має один із статусів:

| Статус | Колір | Опис |
|---|---|---|
| `new` | blue | Аптека зареєстрована, але ще не пройшла модерацію |
| `active` | green | Аптека пройшла модерацію і може працювати |
| `on_moderation` | yellow | Активна аптека змінила важливі дані, які очікують перевірку Admin |
| `inactive` | red | Аптека заблокована або тимчасово відключена Admin |

## 4.3. Правила статусів аптеки

### New

Аптека:

- може зайти в кабінет;
- може переглядати власні дані;
- може редагувати власні дані без модерації;
- може переглядати всі ліки, видимі Vendor;
- не відображається у Client;
- не може продавати ліки;
- не може додавати ліки до себе;
- не може створювати заявки;
- має пройти модерацію Admin;
- може бути переведена Admin у `active` або `inactive`.

Banner:

```txt
Your pharmacy is not activated yet. Complete the required information and wait for Admin review.
```

### Active

Аптека:

- може зайти в кабінет;
- відображається у Client;
- може продавати ліки;
- може додавати активні ліки до себе;
- може створювати заявки;
- може переглядати всі ліки, видимі Vendor;
- може редагувати власні дані, але важливі зміни проходять модерацію Admin;
- може бути переведена Admin у `inactive`.

Якщо active pharmacy змінює важливі дані, публічно в Client та в основних даних Vendor/Admin залишаються попередні підтверджені дані, поки Admin не схвалить pending changes.

### On moderation

Аптека:

- може зайти в кабінет;
- відображається у Client;
- може продавати ліки;
- може додавати активні ліки до себе;
- може створювати заявки;
- не може повторно редагувати дані, які вже на модерації;
- бачить approved data;
- бачить pending moderation data;
- може бути переведена Admin у `active` після схвалення або `inactive`.

Banner:

```txt
Your changes are under moderation. Until Admin reviews them, the Client app shows the previously approved data.
```

### Inactive

Аптека:

- не може зайти в кабінет;
- не відображається у Client;
- не може продавати ліки;
- не може додавати ліки;
- не може створювати заявки;
- зберігає історію замовлень, клієнтів, ліків, reviews і статистики;
- може бути переведена Admin назад у `active`.

Login message:

```txt
Your account is temporarily inactive. Please contact administration for details.
```

Admin має вказати причину блокування при переведенні аптеки в `inactive`.

## 4.4. Дані profile сторінки

Profile page складається з:

- top section з breadcrumbs, h1, description;
- left sidebar with pharmacy summary;
- right content card with tabs.

### Left summary

Показати:

- pharmacy photo;
- helper text для фото;
- upload/change/remove photo buttons;
- pharmacy name;
- email;
- rating + reviews count;
- role: `Pharmacy`;
- status;
- status banner для `new`, `on_moderation`, `inactive`.

Photo helper text:

```txt
Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo is saved to your profile right away.
```

### Tabs

- `Pharmacy data`;
- `About pharmacy`;
- `Payment details`;
- `Reviews`.

## 4.5. Photo rules

Photo:

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`;
- change for active pharmacy requires Admin moderation;
- change for new pharmacy does not require moderation.

Requirements:

- JPG, PNG, WEBP;
- max 450 KB;
- preview after selection;
- loading state;
- error state;
- replace photo;
- remove photo if allowed by status.

## 4.6. Email

Email:

- readonly in Vendor profile;
- unique across Client, Vendor and Admin;
- used for login;
- shared component/styles with Client/Admin.

## 4.7. Tab: Pharmacy data

Fields:

- Name;
- Phone;
- Address;
- Working hours;
- Current password;
- New password.

### Name

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`;
- change by active pharmacy requires moderation;
- change by new pharmacy does not require moderation.

### Phone

- always required;
- unique across Client, Vendor and Admin;
- change by active pharmacy requires moderation;
- change by new pharmacy does not require moderation.

### Address

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`;
- change by active pharmacy requires moderation;
- change by new pharmacy does not require moderation.

### Working hours

Component: `WorkingHoursInput`.

Recommended format:

```txt
Mon–Fri: 08:00–20:00, Sat–Sun: 09:00–18:00
```

Rules same as Address.

### Password

Password change does not require Admin moderation.

Success toast:

```txt
Password changed successfully.
```

Error toast:

```txt
Could not change password. Please try again.
```

## 4.8. Tab: About pharmacy

Field: pharmacy description.

Rules:

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`;
- active pharmacy changes require moderation;
- new pharmacy changes are saved immediately.

Component: `TextEditor`.

TextEditor requirements:

- max 5000 characters;
- character counter;
- simple formatting;
- no heavy rich text editor in first stage;
- textarea or lightweight editor-like field;
- paragraphs;
- line breaks;
- simple lists;
- bold text only if it does not complicate implementation.

## 4.9. Tab: Payment details

Fields:

- Recipient;
- EDRPOU / Tax ID;
- IBAN;
- Bank;
- Payment purpose.

Rules:

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`;
- active pharmacy changes require moderation;
- new pharmacy changes are saved immediately.

Unique fields:

- Tax ID;
- IBAN.

Components:

- `RecipientInput`;
- `TaxIdInput`;
- `IbanInput`;
- `BankInput`;
- `PaymentPurposeInput`.

## 4.10. Tab: Reviews

Vendor can only view pharmacy reviews.

Vendor cannot:

- create reviews;
- edit reviews;
- delete reviews;
- moderate reviews.

All reviews are moderated in Admin.

Show:

- customer name;
- rating;
- date;
- text;
- empty state.

Empty state:

```txt
This pharmacy has no reviews yet.
```

Load more component: `LazyLoadButton`.

## 4.11. Profile buttons and states

### For new pharmacy

Button label:

```txt
Save
```

- disabled if no changes;
- saves immediately without moderation.

### For active pharmacy

Button label:

```txt
Send to moderation
```

- disabled if no changes;
- disabled if required fields are missing;
- opens ConfirmActionModal;
- sends changes to Admin moderation.

### For on moderation pharmacy

- fields disabled/readonly;
- button disabled;
- show pending moderation data per tab.

### For inactive pharmacy

- cabinet is unavailable.

Success toasts:

```txt
Pharmacy data saved successfully.
Changes sent to moderation.
```

Error toast:

```txt
Could not save changes. Please try again.
```

## 4.12. Pending moderation data

Approved data and pending data must not be mixed.

For `on_moderation`, show:

- approved data as current main data;
- pending data in a separate section.

Each tab shows only its own pending data:

- Pharmacy data — name, phone, address, working hours;
- About pharmacy — description;
- Payment details — payment fields.

---

# 5. Dashboard

## 5.1. Загальна логіка

Dashboard — головна сторінка Vendor після login.

Dashboard показує тільки статистику поточної аптеки:

- orders statistics;
- customers statistics;
- medicines statistics;
- medicine requests statistics;
- quick actions;
- banners by pharmacy status.

Vendor не бачить статистику інших аптек.

Admin має окремий dashboard.

## 5.2. Доступ до Dashboard за статусом аптеки

Dashboard доступний для:

- `new`;
- `active`;
- `on_moderation`.

Для `inactive` login у Vendor cabinet заблокований, тому Dashboard недоступний.

### New pharmacy

Показує обмежену статистику й пояснює, що продажі/ліки/заявки стануть доступними після активації.

Banner:

```txt
Your pharmacy is not activated yet. After Admin review, you will be able to sell medicines, add products, and create medicine requests.
```

### Active pharmacy

Показує повну статистику.

### On moderation pharmacy

Показує повну статистику + banner:

```txt
Your changes are under moderation. Until Admin reviews them, the Client app shows the previously approved data.
```

## 5.3. Верхня частина Dashboard

Показати:

- Breadcrumbs;
- h1: `Dashboard`;
- description;
- pharmacy status;
- status banner if needed.

Description:

```txt
Track orders, customers, medicines, and requests for your pharmacy.
```

## 5.4. Фільтри Dashboard

Фільтр року й місяця має бути тільки над блоком статистики **Orders**.

Він не впливає на:

- customer statistics;
- medicine statistics;
- medicine request statistics.

Прибрані показники, які залежали від періоду не в orders block:

- “New customers for selected period”;
- “successful sales amount for selected period” in medicines;
- “rejected orders amount for selected period” in medicines.

### Orders year filter

Select містить тільки роки, у яких у поточної аптеки були створені замовлення.

Якщо замовлень немає, показати поточний рік.

Сортування років — від нового до старого.

### Orders month filter

Select values:

- All months;
- January;
- February;
- March;
- April;
- May;
- June;
- July;
- August;
- September;
- October;
- November;
- December.

Якщо обрано year + All months — статистика рахується за весь рік.

Якщо обрано year + month — статистика рахується за конкретний місяць.

Фільтри Dashboard не змінюють URL і можуть зберігатися локально в state.

## 5.5. Orders statistics

Показує кількість і суму замовлень поточної аптеки за обраний рік/місяць.

Статуси:

| Status | Color | Shows |
|---|---|---|
| New | blue | number and amount of new orders |
| In progress | yellow | number and amount of orders in progress |
| Successful | green | number and amount of completed orders |
| Rejected | red | number and amount of rejected orders for analytics |

Суми рахуються з цін, зафіксованих у замовленнях.

### Click behavior

Click on status card opens orders table with URL filter:

```txt
/vendor/orders/status-new
/vendor/orders/status-in-progress
/vendor/orders/status-successful
/vendor/orders/status-rejected
```

## 5.6. Customers statistics

Показує аналітику по клієнтах, які хоча б один раз створили замовлення на поточну аптеку.

Recommended cards:

- Total customers;
- Repeat customers;
- Active customers;
- Inactive customers.

Не показувати “New customers for selected period”.

Click examples:

```txt
/vendor/clients
/vendor/clients/status-active
/vendor/clients/status-inactive
```

Empty state:

```txt
Your pharmacy has no customers yet.
Customers will appear after the first orders in your pharmacy.
```

## 5.7. Medicines statistics

Показує аналітику по ліках, доданих до поточної аптеки.

Recommended cards:

- Total medicines in pharmacy;
- Active medicines;
- Inactive medicines;
- Medicines in stock;
- Out of stock medicines;
- Reserved medicines.

Financial cards:

- total stock value;
- reserved stock value;
- available stock value.

Formulas:

```txt
stockValue = stockQuantity * currentPrice
reservedValue = reservedQuantity * currentPrice
availableValue = availableQuantity * currentPrice
```

Не показувати в цьому блоці sales amount за вибраний період.

Click examples:

```txt
/vendor/medicines
/vendor/medicines/status-active
/vendor/medicines/status-inactive
/vendor/medicines/stock-empty
/vendor/medicines/stock-available
```

Empty state:

```txt
Your pharmacy has no added medicines yet.
```

Button:

```txt
View all medicines
```

## 5.8. Medicine requests statistics

Показує кількість заявок поточної аптеки за статусами:

- Draft;
- New;
- In progress;
- Approved;
- Rejected.

Click examples:

```txt
/vendor/medicine-requests/status-draft
/vendor/medicine-requests/status-new
/vendor/medicine-requests/status-in-progress
/vendor/medicine-requests/status-approved
/vendor/medicine-requests/status-rejected
```

Empty state:

```txt
Your pharmacy has no medicine creation requests yet.
```

Button:

```txt
Create request
```

---

# 6. Замовлення

## 6.1. Загальна логіка

Замовлення створює тільки Client через checkout.

Admin:

- не створює замовлення;
- не редагує замовлення;
- тільки переглядає.

Vendor:

- бачить тільки замовлення своєї аптеки;
- обробляє замовлення;
- змінює статус за дозволеним flow;
- редагує замовлення тільки у статусі `in_progress`.

Після підтвердження клієнтом замовлення не видаляється.

Ціни в order items фіксуються.

## 6.2. Статуси замовлень

| Status | Color | Description |
|---|---|---|
| `new` | blue | Customer confirmed the order |
| `in_progress` | yellow | Vendor accepted the order for processing |
| `successful` | green | Order completed |
| `rejected` | red | Order rejected by Vendor |

Для `rejected` Vendor обов’язково вказує rejection reason.

## 6.3. Дозволені переходи статусів

```txt
new → in_progress
in_progress → successful
in_progress → rejected
```

Повернення зі статусів `successful` або `rejected` назад у `in_progress` на першому етапі не підтримується.

Недоступні переходи:

```txt
new → successful
new → rejected
in_progress → new
successful → new
successful → in_progress
successful → rejected
rejected → new
rejected → in_progress
rejected → successful
```

Для кожної зміни статусу потрібен `ConfirmActionModal`.

У modal потрібно чітко пояснити, що зміна статусу на `successful` або `rejected` є остаточною.

Recommended modal text for successful:

```txt
This action will mark the order as successful and write off reserved medicines from stock. This status change is final and cannot be undone.
```

Recommended modal text for rejected:

```txt
This action will reject the order and return reserved medicines to available stock. This status change is final and cannot be undone.
```

For rejection, modal includes required textarea:

```txt
Rejection reason
```

Confirm button disabled until reason is filled.

## 6.4. Stock reservation

При створенні замовлення клієнтом товари резервуються.

Reserved medicines are unavailable for other orders.

Statuses `new` and `in_progress` keep medicines reserved.

When order becomes `successful`:

- reserved medicines are finally written off from stock;
- order is completed;
- order total is fixed.

When order becomes `rejected`:

- reserved medicines are returned to available stock;
- order remains readonly;
- rejection reason is stored.

If Vendor edits quantities in `in_progress`, reserve must be updated.

If Vendor adds a product in `in_progress`, it is reserved.

If Vendor removes a product in `in_progress`, reserve is cancelled for that product.

## 6.5. Fixed prices

Ціна товару в замовленні фіксується на момент створення замовлення.

Якщо після створення замовлення поточна ціна змінилася, order item price не змінюється.

Якщо Vendor змінює кількість товару, який уже є в замовленні, ціна одиниці залишається такою, яка була зафіксована для цієї order item.

Якщо Vendor додає новий товар, якого раніше не було в замовленні, для нього фіксується поточна ціна на момент додавання.

## 6.6. Orders table

Показує тільки замовлення поточної аптеки.

Default sorting:

```txt
createdAt: desc
```

First row — newest order.

### Filters

Фільтри змінюють URL через path segments.

Examples:

```txt
/vendor/orders/status-new
/vendor/orders/status-successful/delivery-pickup
/vendor/orders/status-in-progress/payment-cash
/vendor/orders/date-2026-06-01_2026-06-30
/vendor/orders/customer-john
/vendor/orders/order-12345
```

Pagination і rowsPerPage не змінюють URL.

Required filters:

- date filter;
- customer search;
- order number search;
- status select;
- delivery method select;
- payment method select.

Date filter supports:

- one date;
- date range.

Search should be case-insensitive and debounced.

### Delivery options

- All;
- Pickup from pharmacy;
- Post delivery.

### Payment options

- All;
- Cash on pickup / delivery;
- Bank transfer.

### Columns

- Order number;
- Order date;
- Customer;
- Delivery method;
- Payment method;
- Customer comment;
- Total quantity;
- Total amount;
- Status.

Order number is global across Admin system.

Click on order number opens order details.

Click on customer opens customer page.

Status badge colors must be the same in Client, Vendor and Admin.

### Pagination

Component: `Pagination`.

Default rows per page: 20.

Rows options:

- 20;
- 50;
- 100.

Rows per page does not affect URL.

### States

Loader:

```txt
Loading orders...
```

Empty state:

```txt
Your pharmacy has no orders yet.
```

Nothing found:

```txt
No orders found for the selected filters.
```

Button:

```txt
Reset filters
```

## 6.7. One order page

Shows detailed order info.

Editable only if status is `in_progress`.

Readonly for:

- `new`;
- `successful`;
- `rejected`.

Top section:

- Breadcrumbs;
- Order number;
- Created date;
- current status badge;
- status select;
- Save changes button.

### Status select

Shows only allowed next statuses.

For `new`:

- In progress.

For `in_progress`:

- Successful;
- Rejected.

For `successful` and `rejected`:

- disabled.

## 6.8. Editing order items

Allowed only for `in_progress`.

Vendor can:

- increase quantity;
- decrease quantity;
- remove item;
- add a new item from own active medicines.

Rules:

- quantity cannot be less than 1;
- cannot remove the last item;
- new item must belong to current pharmacy;
- new item must be active;
- new item must be in stock;
- new item must not be blocked/deleted;
- stock availability must be checked before save.

Remove item requires ConfirmActionModal.

Modal text:

```txt
Are you sure you want to remove this item from the order?
```

## 6.9. Delivery, payment and comments

Editable only in `in_progress`.

### Delivery method

Options same as Client checkout:

- Pickup from pharmacy;
- Post delivery.

### Payment method

Options same as Client checkout:

- Cash on pickup / delivery;
- Bank transfer.

Bank transfer may be disabled if pharmacy has no bank details.

### Customer comment

Readonly.

If empty:

```txt
The customer did not leave a comment.
```

### Vendor comment

Editable only in `in_progress`.

Uses `CommentInput`.

## 6.10. Order summary

Shows:

- items count;
- total amount;
- button to add products.

Button label:

```txt
Add products
```

The old `Continue shopping` label should not be used in Vendor context.

Button opens a product selection modal based on own active medicines.

Button disabled unless order status is `in_progress`.

## 6.11. Order actions toasts

Success:

```txt
Order status updated successfully.
Order changes saved successfully.
Item removed from the order.
```

Error:

```txt
Could not complete the action. Please try again.
```

---

# 7. Клієнти

## 7.1. Загальна логіка

Client створюється тільки через самостійну реєстрацію в Client частині.

Admin може редагувати клієнта.

Vendor не може:

- створювати клієнтів;
- редагувати клієнтів;
- змінювати статус клієнта;
- блокувати клієнта;
- видаляти клієнта;
- бачити замовлення клієнта в інших аптеках.

Vendor може тільки переглядати клієнтів, які хоча б один раз створили замовлення на поточну аптеку.

## 7.2. Статуси клієнтів

| Status | Color | Description |
|---|---|---|
| `active` | green | Customer can use Client cabinet and create orders |
| `inactive` | red | Customer is blocked or disabled by Admin |

For inactive customer, Admin must provide blocking reason.

Inactive customer cannot login, create orders, edit profile or leave reviews.

Vendor can still view order history of inactive customers for current pharmacy.

## 7.3. Vendor customer definition

Власний клієнт Vendor — це клієнт, який хоча б один раз створив замовлення на поточну аптеку.

У Vendor таблиці й карточці клієнта використовується одна дата:

```txt
firstOrderAt
```

`firstOrderAt` — дата створення першого замовлення клієнта на поточну аптеку.

Не використовуємо окремо `client.createdAt`, щоб не ускладнювати таблицю і карточку клієнта.

## 7.4. Customers table

Показує тільки власних клієнтів поточної аптеки.

Default sorting:

```txt
firstOrderAt: desc
```

Першими показуються клієнти, які найпізніше вперше створили замовлення на цю аптеку.

### Filters

Фільтри змінюють URL через path segments.

Examples:

```txt
/vendor/clients/status-active
/vendor/clients/status-inactive
/vendor/clients/date-2026-06-01_2026-06-30
/vendor/clients/name-john
/vendor/clients/email-test-example-com
/vendor/clients/phone-380501234567
/vendor/clients/address-kyiv
```

Date filter works by `firstOrderAt`.

Required filters:

- date filter;
- search by name;
- search by customer ID;
- search by email;
- search by phone;
- search by address;
- status select.

Search should be case-insensitive and debounced.

Phone search should support search by digits regardless of formatting if possible.

### Columns

- Customer ID;
- Customer photo;
- First order date;
- Name;
- Email;
- Phone;
- Address;
- Successful orders count for current pharmacy;
- Successful orders amount for current pharmacy;
- Status.

Address fallback:

```txt
Not specified
```

Successful orders count and amount include only orders with status `successful` for current pharmacy.

Sums use fixed order prices.

### Pagination

Component: `Pagination`.

Default rows per page: 20.

Rows options:

- 20;
- 50;
- 100.

Pagination and rowsPerPage do not affect URL.

### States

Loader:

```txt
Loading customers...
```

Empty:

```txt
Your pharmacy has no customers yet.
```

Nothing found:

```txt
No customers found for the selected filters.
```

Button:

```txt
Reset filters
```

## 7.5. One customer page

Shows detailed readonly customer info and customer orders for current pharmacy.

Accessible only if this customer has at least one order for current pharmacy.

If customer does not belong to current pharmacy, show not found or access denied.

### Top section

- Breadcrumbs;
- h1: `Customer: {customer.name}`;
- description:

```txt
View customer information, statistics, and orders for your pharmacy.
```

### Left info block

Show:

- photo or fallback avatar;
- name;
- first order date;
- customer ID;
- email;
- phone;
- address;
- status.

All fields readonly.

### Customer statistics

Statistics are calculated only for this customer and current pharmacy.

Show by order status:

- New;
- In progress;
- Successful;
- Rejected.

For each status:

- orders count;
- orders amount.

Rejected amount is shown for analytics, not revenue.

### Customer orders table

Shows all customer orders for current pharmacy only.

Filters:

- date;
- order number;
- status;
- delivery method;
- payment method.

Columns:

- Order number;
- Order date;
- Delivery method;
- Payment method;
- Customer comment;
- Total quantity;
- Total amount;
- Status.

States:

```txt
This customer has no orders in your pharmacy yet.
No orders found for the selected filters.
Could not load customer data. Please try again.
Customer not found.
```

The empty state is mainly defensive, because a customer should only appear in Vendor customers after first order.

## 7.6. Customer toasts

Vendor pages for customers are mostly readonly.

Toasts may be used for technical actions:

```txt
Customer email copied.
Customer phone copied.
Customer ID copied.
Could not load data. Please try again.
```

---

# 8. Ліки

## 8.1. Загальна логіка

Ліки створюються і редагуються тільки в Admin.

Vendor не може:

- створювати глобальні ліки напряму;
- редагувати глобальні дані ліків;
- вручну редагувати ціну;
- вручну редагувати кількість на складі.

Vendor може:

- бачити активні й неактивні ліки;
- додати активні ліки до своєї аптеки;
- переглядати власні аптечні дані для доданих ліків;
- створити заявку, якщо потрібних ліків немає в системі.

## 8.2. Статуси ліків

Усі ліки в системі мають три глобальні статуси:

| Status | Color | Description |
|---|---|---|
| `new` | blue | Medicine created in Admin but not activated yet |
| `active` | green | Medicine is active and can be added to a pharmacy |
| `inactive` | red | Medicine is deactivated by Admin |

Статус показує поточний статус конкретних ліків, незалежно від таблиці.

Vendor не бачить ліки зі статусом `new`. Цей статус бачить тільки Admin.

Vendor бачить:

- `active` medicines;
- `inactive` medicines.

Vendor може додати до аптеки тільки `active` medicines.

## 8.3. Global medicine vs pharmacy medicine

### Global medicine

Створює і редагує Admin.

Fields:

- medicineId;
- article;
- name;
- category;
- description;
- image;
- manufacturer;
- dosage;
- package size;
- status;
- createdAt;
- updatedAt.

### Pharmacy medicine

Зв’язок між аптекою та глобальними ліками.

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

Vendor працює саме з pharmacy medicine data, але не редагує global medicine data.

## 8.4. Price and stock

Поточна ціна й кількість не редагуються вручну у Vendor.

Ці дані приходять зі сторонньої програми через API.

External API також має отримувати інформацію про:

- sold medicines;
- reserved medicines;
- cancelled reserves;
- returned stock after rejected orders.

If external API updates price, new price affects only new orders.

Existing order prices do not change.

## 8.5. Reserved and available quantity

Reserved quantity — кількість ліків у замовленнях зі статусами:

- `new`;
- `in_progress`.

Formula:

```txt
availableQuantity = stockQuantity - reservedQuantity
```

If availableQuantity = 0, product is unavailable for new orders and should not be purchasable in Client.

## 8.6. Own medicines table

Показує тільки ліки, додані до поточної аптеки.

Default sorting:

```txt
addedAt: desc
```

### Filters

Фільтри змінюють URL через path segments.

Examples:

```txt
/vendor/medicines/status-active
/vendor/medicines/status-inactive
/vendor/medicines/stock-empty
/vendor/medicines/stock-available
/vendor/medicines/category-antibiotics
/vendor/medicines/name-aspirin
/vendor/medicines/article-abc123
```

Filters:

- date by `addedAt`;
- name;
- article;
- category;
- status;
- stock availability.

### Columns

- Added date;
- Article;
- Name;
- Category;
- Stock quantity;
- Reserved quantity;
- Available quantity;
- Current price;
- Status.

Status is global medicine status: `active` or `inactive`.

Vendor never sees `new` medicines.

### States

Loader:

```txt
Loading medicines...
```

Empty:

```txt
Your pharmacy has no added medicines yet.
```

Button:

```txt
View all medicines
```

Nothing found:

```txt
No medicines found for the selected filters.
```

## 8.7. All medicines table

Показує global medicines з Admin, які Vendor може переглядати:

- active;
- inactive.

Не показує `new`.

### Filters

Same as own medicines, але date filter works by global medicine `createdAt`.

Examples:

```txt
/vendor/all-medicines/status-active
/vendor/all-medicines/status-inactive
/vendor/all-medicines/category-antibiotics
/vendor/all-medicines/article-abc123
```

### Columns

- Created date in Admin;
- Article;
- Name;
- Category;
- Status;
- Added to my pharmacy;
- Action.

### Action

For active medicine not added to current pharmacy:

```txt
Add to pharmacy
```

For active medicine already added:

```txt
Already added
```

For inactive medicine:

```txt
Unavailable
```

Add action opens ConfirmActionModal.

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

## 8.8. Removing medicine from pharmacy

Цю дію можна зробити з таблиці всіх ліків.

Vendor може видалити ліки зі своєї аптеки тільки якщо:

- ліки були додані до аптеки;
- по цих ліках ще не було жодного замовлення;
- `reservedQuantity = 0`;
- `stockQuantity = 0` або дані ще не синхронізовані зі сторонньою програмою;
- аптека має статус `active` або `on_moderation`.

Перед видаленням потрібно відкривати `ConfirmActionModal`.

Modal text:

```txt
Are you sure you want to remove this medicine from your pharmacy?
```

Після видалення `pharmacyMedicine` зв’язок видаляється або отримує `status="removed"`.

Якщо по ліках уже були замовлення, видалення недоступне.

Disabled explanation:

```txt
This medicine cannot be removed because it already has related orders.
```

## 8.9. Medicine card

Одна карточка ліків використовується незалежно від того, звідки Vendor перейшов:

- own medicines;
- all medicines.

If medicine is added to current pharmacy, show:

- global medicine data;
- pharmacy-specific data;
- stock;
- reserved quantity;
- available quantity;
- current price;
- statistics;
- stock movement;
- related orders;
- characteristics;
- reviews.

If medicine is not added, show only global data and action `Add to pharmacy` if status is active.

Vendor cannot edit global medicine data.

Vendor cannot manually edit price and quantity.

### Left block

Show:

- medicine image;
- name;
- current price if added;
- rating + reviews count;
- article;
- category;
- status;
- created date in Admin;
- added date if added.

If not added:

```txt
This medicine is not added to your pharmacy yet.
```

### Tabs

- Statistics;
- Stock movement;
- Related orders;
- Characteristics;
- Reviews.

If medicine is not added:

- Statistics — empty state;
- Stock movement — empty state;
- Related orders — empty state;
- Characteristics — available;
- Reviews — available.

### Statistics tab

Shows data only for current pharmacy.

Show:

- stock quantity + stock value;
- reserved quantity + reserved value;
- available quantity + available value;
- quantity and amount in orders by statuses: New, In progress, Successful, Rejected.

Empty:

```txt
This medicine is not added to your pharmacy, so statistics are unavailable.
```

### Stock movement tab

Shows stock and price history.

Event types:

- stock update from external API;
- price update from external API;
- reservation after order creation;
- reserve update after order editing;
- write-off after successful order;
- return to available stock after rejected order;
- reserve cancellation after removing item from order.

Columns:

- date;
- event type;
- quantity;
- price;
- order number if relevant;
- source;
- comment.

Sources:

- External API;
- Order;
- Vendor action;
- System.

Empty:

```txt
Stock movement history is empty.
```

### Related orders tab

Shows only current pharmacy orders that include this medicine.

Columns:

- order number;
- order date;
- customer;
- quantity of this medicine;
- unit price in this order;
- amount for this medicine;
- order status.

Empty:

```txt
There are no orders with this medicine yet.
```

### Characteristics tab

Shows Admin data.

Vendor cannot edit.

Style should match Client product card characteristics.

If no characteristics:

```txt
Characteristics for this medicine have not been added yet.
```

### Reviews tab

Readonly.

Vendor cannot create/edit/delete/moderate reviews.

Empty:

```txt
This medicine has no reviews yet.
```

---

# 9. Заявки на створення нових ліків

## 9.1. Загальна логіка

Medicine requests потрібні, коли аптека продає ліки, яких ще немає в глобальному Admin catalog.

Vendor не створює global medicine напряму.

Vendor може:

- створити draft request;
- поступово заповнювати дані;
- зберегти чернетку;
- надіслати заявку на модерацію;
- переглядати статус заявки;
- створити нову чернетку на основі відхиленої заявки;
- додати створені ліки до аптеки після approval, якщо medicine active.

Admin:

- бачить тільки submitted requests;
- переводить request у `in_progress`;
- створює medicine на основі request;
- або відхиляє request із причиною.

Client не бачить requests.

## 9.2. Before creating request

Vendor створює request тільки якщо потрібних ліків немає в All medicines table.

Перед створенням request Vendor має перевірити:

- name;
- article;
- category;
- manufacturer, if filter exists.

If medicine already exists and is active, Vendor should add it to pharmacy instead of creating request.

If medicine exists but inactive:

```txt
This medicine already exists in the system, but it is currently inactive. Contact Admin or wait for activation.
```

## 9.3. Request statuses

| Status | Color | Description |
|---|---|---|
| `draft` | gray | Vendor created a draft but did not submit it |
| `new` | blue | Vendor submitted request, Admin has not started review |
| `in_progress` | yellow | Admin is reviewing the request |
| `approved` | green | Admin created medicine based on request |
| `rejected` | red | Admin rejected request |

For rejected request, rejection reason is required.

## 9.4. Request status flow

Allowed flow:

```txt
draft → new → in_progress → approved
draft → new → in_progress → rejected
```

Admin does not approve or reject a request directly from `new`.

Admin first moves it to `in_progress`.

## 9.5. Draft

Draft:

- visible only to Vendor;
- invisible to Admin;
- editable by Vendor;
- can be saved with partial data;
- can be submitted to Admin;
- can be deleted by Vendor if allowed in implementation.

Minimum fields to save draft:

- name;
- article;
- category.

## 9.6. New request

Created when Vendor clicks `Send to moderation`.

Request:

- becomes visible to Admin;
- readonly for Vendor;
- can be moved by Admin to `in_progress`.

## 9.7. In progress request

Admin reviews request.

Admin can:

- verify data;
- fix incomplete/incorrect fields;
- create medicine;
- reject request.

Vendor can only view and wait.

## 9.8. Approved request

After approval:

- global medicine is created;
- request is linked to created medicine;
- request stores link to created medicine;
- Vendor can open created medicine;
- Vendor can add medicine to pharmacy if it is active.

Approval does not automatically add medicine to pharmacy.

## 9.9. Rejected request

Admin must provide rejection reason.

Possible reasons:

- medicine already exists;
- insufficient information;
- incorrect name;
- incorrect article;
- manufacturer not confirmed;
- product does not match platform rules;
- duplicate request;
- other reason.

Vendor sees rejection reason in request card.

## 9.10. Requests table

Shows only requests of current pharmacy.

Default sorting:

```txt
createdAt: desc
```

### Create button

Button:

```txt
Create request
```

Available for pharmacy statuses:

- `active`;
- `on_moderation`.

Disabled for:

- `new`;
- `inactive`.

New pharmacy explanation:

```txt
You will be able to create requests after Admin activates your pharmacy.
```

Inactive pharmacy explanation:

```txt
Your account is temporarily inactive. Request creation is unavailable.
```

### Columns

- Created date;
- Article;
- Name;
- Category;
- Status.

Click on name opens request card.

### Filters

Фільтри змінюють URL через path segments.

Examples:

```txt
/vendor/medicine-requests/status-draft
/vendor/medicine-requests/status-new
/vendor/medicine-requests/status-in-progress
/vendor/medicine-requests/status-approved
/vendor/medicine-requests/status-rejected
/vendor/medicine-requests/category-antibiotics
/vendor/medicine-requests/article-abc123
```

Filters:

- date;
- name;
- article;
- category;
- status.

### States

Empty:

```txt
Your pharmacy has no medicine creation requests yet.
```

Nothing found:

```txt
No requests found for the selected filters.
```

Button:

```txt
Reset filters
```

## 9.11. Create/edit request page

Routes:

```txt
/vendor/medicine-requests/new
/vendor/medicine-requests/[requestId]/edit
```

Modes:

- Create mode;
- Edit draft mode.

Admin may have a separate create medicine mode:

```txt
/admin/medicine-requests/[requestId]/create-medicine
/admin/products/new/request-[requestId]
```

### Fields

Same main fields as Admin create medicine page:

- image;
- name;
- article;
- category;
- manufacturer;
- country of origin;
- dosage;
- package size;
- release form;
- active substance;
- prescription type;
- storage conditions;
- short description;
- full description;
- characteristics;
- Vendor comment;
- additional files/documents if needed.

### Required fields for moderation

To send to moderation:

- name;
- article;
- category;
- manufacturer;
- short description;
- Vendor comment.

If required fields are missing, button should be disabled or errors should appear after click.

### Buttons

```txt
Save draft
Send to moderation
```

Save draft:

- creates or updates draft;
- does not send to Admin;
- shows Toast.

Send to moderation:

- validates required fields;
- opens ConfirmActionModal;
- changes status to `new`;
- makes request visible to Admin;
- shows Toast.

Modal text:

```txt
Are you sure you want to send this request to Admin moderation?
```

Toasts:

```txt
Request draft saved.
Request sent to Admin moderation.
Request updated.
Could not save draft. Please try again.
Could not send request. Please try again.
```

## 9.12. Request card

Route:

```txt
/vendor/medicine-requests/[requestId]
```

Card should look like medicine card.

Show:

- image;
- name;
- article;
- category;
- status;
- short description;
- characteristics;
- Vendor comment;
- created date;
- submitted date if submitted;
- Admin comment;
- rejection reason if rejected;
- link to created medicine if approved.

### Draft card

Show button:

```txt
Edit request
```

Text:

```txt
This request is a draft. It has not been sent to Admin yet.
```

### New / In progress

Readonly.

Texts:

```txt
The request has been sent to Admin. Please wait for review.
Admin is reviewing this request.
```

### Approved

Show block:

```txt
Admin created a medicine based on this request.
```

Actions:

```txt
Open medicine
Add to pharmacy
```

If already added:

```txt
This medicine is already added to your pharmacy.
```

### Rejected

Show rejection reason.

Button:

```txt
Create new request based on this one
```

This button creates a new request with status `draft`.

New draft copies fields from rejected request, but:

- has new `requestId`;
- has new `createdAt`;
- does not have status history of previous request;
- does not have `adminRejectReason`;
- does not have `adminComment`, unless Vendor needs to see it;
- is not automatically sent to moderation.

---

# 10. Службові сторінки, loader та states

## 10.1. Error page

Vendor error page should reuse Client error page structure and styles.

Use:

- `error.tsx`;
- `status-page.module.css`;
- `Button`;
- `ButtonLink`;
- `Container`;
- image `/images/home/three-pills.png`.

Actions:

```txt
Try again
Back to dashboard
```

Back route:

```txt
/vendor/dashboard
```

Accessibility:

- one visible `<main>`;
- h1;
- section with `aria-labelledby`;
- decorative image hidden from screen readers;
- `Try again` is button;
- `Back to dashboard` is link.

## 10.2. 404 page

Vendor 404 should reuse Client 404 styles and layout.

Actions:

```txt
Back to dashboard
View all medicines
```

Routes:

```txt
/vendor/dashboard
/vendor/all-medicines
```

If route exists but entity does not, use local not found state:

- order not found;
- customer not found;
- medicine not found;
- request not found.

If route does not exist, show general Vendor 404.

## 10.3. LoadingSpinner

Use shared `LoadingSpinner`.

Component requirements:

- `role="status"`;
- `aria-live="polite"`;
- visible label;
- decorative spinner with `aria-hidden="true"`;
- optional `className`;
- default label: `Loading...`.

Use for:

- Dashboard;
- tables;
- details pages;
- tabs loaded separately;
- async blocks;
- auth actions;
- buttons.

Context labels:

```txt
Loading...
Loading dashboard...
Loading orders...
Loading order data...
Loading customers...
Loading customer data...
Loading medicines...
Loading requests...
```

## 10.4. Button loading states

During async action, button is disabled and shows loading text.

Examples:

```txt
Saving...
Sending...
Changing...
Loading...
Logging out...
```

## 10.5. Empty and nothing found states

Empty state means no data exists yet.

Nothing found state means data exists, but filters returned nothing.

Every table should have:

- loader;
- empty state;
- nothing found state;
- error state if request fails;
- reset filters button for nothing found.

---

# 11. Рекомендована структура routes

## 11.1. Route principles

- Auth routes are global, not under `/vendor`.
- Vendor protected routes start with `/vendor`.
- Filters use path segments.
- Pagination and rowsPerPage stay in local state.
- Breadcrumbs are built from route data.
- Every page has h1.
- Protected Vendor layout has no Footer.
- Only one visible `<main>` per page.

## 11.2. Suggested App Router structure

```txt
apps/vendor/app/
  (auth)/
    auth/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      layout.tsx

  vendor/
    layout.tsx
    loading.tsx
    error.tsx
    not-found.tsx

    dashboard/
      page.tsx

    profile/
      page.tsx

    orders/
      page.tsx
      [orderId]/page.tsx
      status-[status]/page.tsx
      status-[status]/delivery-[delivery]/page.tsx
      status-[status]/payment-[payment]/page.tsx

    clients/
      page.tsx
      [clientId]/page.tsx
      status-[status]/page.tsx
      date-[dateRange]/page.tsx

    medicines/
      page.tsx
      [medicineId]/page.tsx
      status-[status]/page.tsx
      stock-[stock]/page.tsx
      category-[category]/page.tsx

    all-medicines/
      page.tsx
      [medicineId]/page.tsx
      status-[status]/page.tsx
      category-[category]/page.tsx

    medicine-requests/
      page.tsx
      new/page.tsx
      [requestId]/page.tsx
      [requestId]/edit/page.tsx
      status-[status]/page.tsx
      category-[category]/page.tsx
```

Це приклад. Реальну структуру можна спростити, якщо фільтри будуть парситися з catch-all route.

## 11.3. Alternative catch-all filter routes

Щоб не створювати багато фізичних папок для кожної комбінації фільтрів, можна використати catch-all route:

```txt
/vendor/orders/[[...filters]]
/vendor/clients/[[...filters]]
/vendor/medicines/[[...filters]]
/vendor/all-medicines/[[...filters]]
/vendor/medicine-requests/[[...filters]]
```

Examples:

```txt
/vendor/orders/status-new
/vendor/orders/status-successful/delivery-pickup
/vendor/clients/status-active
/vendor/medicines/status-active/stock-empty
/vendor/medicine-requests/status-draft
```

Recommended approach for implementation: catch-all route + filter parser utility.

---

# 12. Shared packages та reusable logic

## 12.1. packages/types

Store shared domain types:

- UserRole;
- PharmacyStatus;
- CustomerStatus;
- OrderStatus;
- MedicineStatus;
- MedicineRequestStatus;
- DeliveryMethod;
- PaymentMethod;
- Pharmacy;
- Customer;
- Order;
- OrderItem;
- Medicine;
- PharmacyMedicine;
- MedicineRequest;
- PaginationParams;
- Filter params.

## 12.2. packages/config

Store constants:

- route constants;
- status labels;
- status colors;
- navigation links;
- filter segment names;
- date formats;
- rows per page options;
- file upload limits;
- medicine categories if static;
- delivery/payment options.

## 12.3. packages/ui

Reusable UI components:

- Button;
- ButtonLink;
- Container;
- Breadcrumbs;
- Tabs;
- ModalBase;
- ConfirmActionModal;
- Toast;
- LoadingSpinner;
- Pagination;
- SearchInput;
- SelectField;
- DateFilter;
- AvatarImage;
- ProfilePhotoCard;
- RatingSummary;
- LazyLoadButton;
- FileUpload;
- StatusBadge.

## 12.4. packages/validation

Shared validation schemas:

- auth forms;
- email;
- phone;
- password;
- file upload;
- pharmacy profile;
- payment details;
- order editing;
- medicine request draft;
- medicine request submit.

## 12.5. packages/api-client

Shared API clients:

- auth API;
- vendor profile API;
- vendor dashboard API;
- vendor orders API;
- vendor customers API;
- vendor medicines API;
- vendor medicine requests API.

## 12.6. apps/vendor

Vendor-specific logic:

- Vendor pages;
- Vendor layouts;
- Vendor sidebar/mobile menu;
- Vendor feature components;
- Vendor filter parser;
- Vendor table composition;
- Vendor access guards;
- Vendor route metadata.

## 12.7. apps/api

Backend modules needed for Vendor:

- auth/users;
- pharmacies;
- pharmacy moderation;
- vendor dashboard;
- vendor orders;
- vendor customers;
- global medicines;
- pharmacy medicines;
- stock movement;
- medicine requests;
- reviews;
- file uploads;
- external stock/price sync.

---

# Фінальний висновок

Vendor ТЗ логічно ділиться на такі глобальні частини:

- Auth та доступ;
- Layout та navigation;
- Pharmacy profile;
- Dashboard;
- Orders;
- Customers;
- Medicines;
- Medicine requests;
- Service pages/loaders/states;
- Routes/shared packages.

Головні уточнення, внесені в цю версію:

- фільтри таблиць змінюють URL через path segments;
- pagination і rowsPerPage не змінюють URL;
- Dashboard year/month filter застосовується тільки до Orders statistics;
- у клієнтах використовується одна дата — дата першого замовлення на поточну аптеку;
- повернення order status назад не підтримується;
- status changes to successful/rejected є остаточними й підтверджуються modal;
- ціна існуючого order item не змінюється при зміні кількості;
- новий item у замовленні отримує поточну ціну на момент додавання;
- Vendor не бачить medicines зі статусом `new`;
- видалення medicine from pharmacy описано окремо;
- request flow строгий: Draft → New → In progress → Approved/Rejected;
- rejected request can create a new draft based on previous data;
- Auth routes are global, Vendor protected routes start with `/vendor`;
- protected Vendor layout не має Footer.

