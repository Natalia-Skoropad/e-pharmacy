Так. Після звірки з поточним кодом Stage 5 тут виходить доволі чистим: authenticated-admin вже є, AuthUser уже містить name і pictureUrl, а shared UserBadge уже вміє показати фото/initials, ім’я, meta та працювати як зовнішнє посилання. Тобто жодного нового API-запиту за admin profile для Header не потрібно.

Ще одне рішення я б зафіксувала одразу: badge Admin cabinet веде саме на /admin/dashboard, а не Profile. Dashboard уже є canonical entry route з попередніх етапів; Profile буде реалізований значно пізніше. Поки самого Dashboard немає, active admin після переходу побачить нашу branded 404 — і це очікувана тимчасова межа між етапами, без створення фальшивої сторінки.

# ЕТАП 5 — Client header для залогіненого admin

## 1. Мета етапу

На цьому етапі потрібно завершити поведінку **публічного client header** для вже авторизованого admin.

Зараз client application уже правильно розпізнає:

```text
authenticated-client
authenticated-pharmacy
authenticated-admin
```

Але presentation для admin поки тимчасовий:

```text
Use the admin application for account tools.
```

Після Stage 5 ця заглушка зникає.

Для active admin у Header та Mobile Menu показуємо той самий shared:

```text
UserBadge
```

що вже використовується для client/pharmacy.

---

# 2. Очікуваний результат

Поведінка client header стає симетричною:

```text
client user
→ UserBadge
→ Client profile
```

```text
pharmacy user
→ UserBadge
→ Pharmacy cabinet
```

```text
admin user
→ UserBadge
→ Admin cabinet
```

Admin badge містить:

```text
photo / initials
name
Admin cabinet
```

При натисканні:

```text
→ admin application
→ /admin/dashboard
```

---

# 3. Що вже існує і НЕ потрібно створювати

У client уже є:

```text
authenticated-admin
```

у:

```text
public-auth-actions-state.ts
```

і ця role уже покрита тестом.

Тому не створюємо:

```text
authenticated-platform-admin
authenticated-admin-owner
authenticated-employee
```

Поточна coarse-grained auth role:

```text
admin
```

залишається правильною.

---

# 4. `AuthUser` уже містить усе необхідне

Поточний auth user вже має:

```ts
{
  id;
  name;
  email;
  role;
  status;
  phone;
  address?;
  pictureUrl?;
  revision;
}
```

Тому для admin badge уже доступні:

```text
name
pictureUrl
```

без додаткового HTTP request.

---

# 5. Не робимо окремий admin profile request

Для pharmacy header зараз потрібний:

```text
getCurrentPharmacySummary()
```

бо badge представляє **аптеку**:

```text
pharmacy name
pharmacy image
```

Admin badge представляє **користувача**.

Тому неправильно додавати:

```text
GET /admin/profile
GET /api/admin/profile
GET /auth/admin-summary
```

лише для Header.

Використовуємо:

```ts
authState.user.name;
authState.user.pictureUrl;
```

---

# 6. Відсутнє фото — не проблема

Shared `UserBadge` уже підтримує fallback:

```text
pictureUrl exists
→ photo
```

```text
pictureUrl absent / broken
→ initials
```

Тому не створюємо:

```text
default-admin-avatar.png
admin-placeholder.svg
AdminAvatar
```

Initials уже є shared поведінкою.

---

# 7. Shared `UserBadge` не змінюємо

Поточний компонент уже підтримує:

```ts
name;
email;
pictureUrl;
pictureAlt;
fallbackLabel;
href;
variant;
className;
meta;
onClick;
renderLink;
```

Цього достатньо для Stage 5.

Не додаємо до shared UI:

```text
role
cabinetType
adminMode
external
application
```

лише заради admin header.

---

# 8. Admin badge на desktop

Концептуально:

```tsx
<UserBadge
  href={controller.adminDashboardUrl}
  name={authState.user.name}
  pictureUrl={authState.user.pictureUrl}
  meta="Admin cabinet"
  fallbackLabel="Admin"
/>
```

Оскільки це перехід в **інший Next.js application**, використовуємо:

```tsx
renderLink={({ href, className, children, onClick }) => (
  <a className={className} href={href} onClick={onClick}>
    {children}
  </a>
)}
```

Так само, як уже робиться для pharmacy cabinet.

---

# 9. Чому тут `<a>`, а не Next `<Link>`

Client і admin — різні applications/origins.

Наприклад:

```text
client → localhost:3000
admin  → localhost:3001
```

Тому це повноцінний cross-application navigation.

Не використовуємо:

```tsx
<Link href="http://localhost:3001/...">
```

для masquerading internal navigation.

Для зовнішнього application transition достатньо звичайного:

```html
<a></a>
```

---

# 10. Admin badge у Mobile Offcanvas

Той самий `UserBadge`, але:

```text
variant="dark"
```

і:

```tsx
onClick = { onClose };
```

щоб mobile menu закривався при переході.

Це той самий pattern, що pharmacy badge.

---

# 11. Mobile badge

Концептуально:

```tsx
<UserBadge
  href={controller.adminDashboardUrl}
  name={authState.user.name}
  pictureUrl={authState.user.pictureUrl}
  meta="Admin cabinet"
  fallbackLabel="Admin"
  variant="dark"
  onClick={onClose}
  renderLink={...}
/>
```

Не створюємо окремий:

```text
AdminMobileBadge
```

---

# 12. Старий текст видаляємо

Прибираємо з desktop Header:

```text
Use the admin application for account tools.
```

і такий самий блок із:

```text
MobileOffcanvas
```

Після Stage 5 для `authenticated-admin` більше немає informational placeholder.

---

# 13. `accountNotice` не видаляємо

CSS:

```text
.accountNotice
```

ще використовується для:

```text
blocked-account
authenticated-unsupported
```

Тому сам style лишається.

Видаляємо лише admin branch.

---

# 14. Cabinet badge class робимо generic

Зараз у Header є:

```text
pharmacyCabinetBadge
```

А після Stage 5 цей style потрібний і для:

```text
pharmacy
admin
```

Тому я б перейменувала:

```text
pharmacyCabinetBadge
```

у:

```text
cabinetBadge
```

або:

```text
externalCabinetBadge
```

Я б вибрала:

```text
cabinetBadge
```

---

# 15. Чому не створювати `adminCabinetBadge`

Не потрібно:

```text
.pharmacyCabinetBadge
.adminCabinetBadge
```

якщо вони візуально однакові.

Інакше вже на маленькому Header отримаємо дві копії однакових styles.

---

# 16. Те саме для Mobile CSS

Поточний:

```text
.pharmacyCabinetBadge
```

у Mobile Offcanvas також перейменовуємо в:

```text
.cabinetBadge
```

і використовуємо для двох roles.

---

# 17. Візуально pharmacy badge не повинен змінитися

Цей rename — лише semantic cleanup.

Після Stage 5 pharmacy badge має виглядати так само, як до змін.

Тобто Stage 5 не є redesign pharmacy header.

---

# 18. `NEXT_PUBLIC_ADMIN_APP_URL`

До:

```text
apps/client/.env.example
```

додаємо:

```env
# Admin application base URL used for trusted cross-application navigation.
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

Це саме **base URL**.

---

# 19. Не передавати dashboard URL у env

Неправильно:

```env
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001/admin/dashboard
```

Правильно:

```env
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

Route додає application code.

---

# 20. Чому саме base URL

Так ми підтримуємо deployments із base path.

Наприклад:

```env
NEXT_PUBLIC_ADMIN_APP_URL=https://apps.example.com/admin-app
```

повинен дати:

```text
https://apps.example.com/admin-app/admin/dashboard
```

а не ламати path composition.

---

# 21. Canonical admin destination

Stage 5 фіксує:

```text
ADMIN_DASHBOARD_PATH = /admin/dashboard
```

і badge веде на:

```text
ADMIN_APP_BASE + /admin/dashboard
```

---

# 22. Чому Dashboard, а не Profile

Admin Profile буде окремим значно пізнішим етапом.

Canonical entry point admin application уже визначений як:

```text
/admin/dashboard
```

і root:

```text
/
```

також redirect-ить туди.

Тому client header не повинен знати майбутню структуру Profile.

---

# 23. Dashboard ще не існує — це нормально

Після Stage 5:

```text
admin badge
→ /admin/dashboard
→ AdminProtectedRoute
→ active admin allowed
→ branded 404
```

поки Dashboard page не реалізований.

Це очікувано.

---

# 24. Не створюємо fake Dashboard

Не додаємо:

```text
apps/admin/src/app/admin/dashboard/page.tsx
```

із:

```text
Coming soon
```

лише щоб badge мав destination.

Це вже був би наступний business stage.

---

# 25. Не redirect-имо badge на 404 page вручну

Не потрібно:

```text
/admin/dashboard → /
```

або:

```text
/admin/dashboard → client
```

Canonical route уже визначений.

Майбутній Dashboard просто займе це місце.

---

# 26. Admin application configuration

Не можна використовувати env без validation:

```ts
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL!;
```

Потрібний той самий fail-closed принцип, який уже є для pharmacy application.

---

# 27. Development fallback

У development допустимо:

```text
http://localhost:3001
```

як fallback, якщо env не заданий.

Це відповідає локальному port contract admin.

---

# 28. Production — env обов'язковий

У production не повинно бути silent fallback:

```text
NEXT_PUBLIC_ADMIN_APP_URL missing
→ localhost:3001
```

або:

```text
→ client home
```

Configuration має бути визнана invalid.

---

# 29. Production URL — HTTPS

У deployed production:

```text
https://...
```

обов'язковий.

Не приймаємо:

```text
http://admin.example.com
```

---

# 30. Allowed protocols

Підтримуємо лише:

```text
http:
https:
```

Відхиляємо:

```text
javascript:
data:
file:
```

---

# 31. Credentials заборонені

Відхиляємо:

```text
https://user:password@admin.example.com
```

Admin app URL не повинен містити credentials.

---

# 32. Query та hash заборонені в env

Неправильно:

```text
https://admin.example.com?source=client
```

або:

```text
https://admin.example.com#dashboard
```

Env — лише application base.

---

# 33. Client та admin origin не повинні збігатися

Якщо client:

```text
https://client.example.com
```

то:

```text
NEXT_PUBLIC_ADMIN_APP_URL=https://client.example.com
```

має бути configuration error.

Client і admin — окремі applications.

---

# 34. Не приймати готовий dashboard URL як base

Як і pharmacy config, admin config повинен відхиляти:

```text
https://admin.example.com/admin/dashboard
```

як значення:

```text
NEXT_PUBLIC_ADMIN_APP_URL
```

щоб випадково не отримати:

```text
/admin/dashboard/admin/dashboard
```

---

# 35. Base path підтримуємо

Наприклад:

```text
https://apps.example.com/e-pharmacy-admin
```

дає:

```text
base:
https://apps.example.com/e-pharmacy-admin/
```

```text
dashboard:
https://apps.example.com/e-pharmacy-admin/admin/dashboard
```

```text
allowed path prefix:
/e-pharmacy-admin/admin
```

---

# 36. Не копіюємо blindly pharmacy config

У client уже існує повний:

```text
pharmacy-app-config-core.ts
```

із правилами:

```text
URL parsing
HTTPS production
no credentials
no query/hash
different origin
base paths
dashboard path
```

Тепер таких external cabinets уже два:

```text
pharmacy
admin
```

Я б не створювала другу 100%-ву копію цього validator.

---

# 37. Маленький app-local refactor Stage 5

Саме на Stage 5 має сенс винести **тільки спільну URL validation частину** в client-local helper.

Наприклад:

```text
apps/client/src/lib/auth/external-app-config-core.ts
```

Він не є UI refactor із Stage 6.

Це auth/navigation configuration client application.

---

# 38. Що винести в generic helper

Спільні правила:

```text
configured base URL
development fallback
URL parsing
protocol
HTTPS in production
credentials
query/hash
same-origin restriction
base-path normalization
```

---

# 39. Що лишити application-specific

Pharmacy:

```text
development URL = :3002
route prefix = /pharmacy
dashboard = /pharmacy/dashboard
env = NEXT_PUBLIC_PHARMACY_APP_URL
```

Admin:

```text
development URL = :3001
route prefix = /admin
dashboard = /admin/dashboard
env = NEXT_PUBLIC_ADMIN_APP_URL
```

---

# 40. Не виносимо це в shared package зараз

Не потрібно на Stage 5 робити великий refactor:

```text
@e-pharmacy/auth/external-app-config
```

Це зачепить одразу:

```text
client
pharmacy
admin
```

applications.

Для поточної задачі достатньо reuse **всередині client app**.

---

# 41. Існуючий pharmacy behavior зберігаємо

Після винесення common helper усі наявні pharmacy config tests повинні залишитися зеленими.

Stage 5 не має змінити:

```text
NEXT_PUBLIC_PHARMACY_APP_URL
```

semantics.

---

# 42. Admin config файли

Я б зробила:

```text
apps/client/src/lib/auth/admin-app-config-core.ts
apps/client/src/lib/auth/admin-app-config.ts
```

за тим самим public/private pattern, який уже є для pharmacy.

---

# 43. `admin-app-config-core.ts`

Pure function.

Не використовує:

```text
window
process.env
React
Next router
```

Приймає values параметрами.

Це дозволяє нормально unit-test.

---

# 44. `admin-app-config.ts`

Runtime wrapper читає:

```ts
process.env.NEXT_PUBLIC_ADMIN_APP_URL;
process.env.NODE_ENV;
```

і client site URL.

Експортує, наприклад:

```text
getAdminAppConfiguration
requireAdminAppConfiguration
isAdminAppConfigurationError
```

---

# 45. Admin config result

При success:

```ts
{
  baseUrl;
  origin;
  dashboardUrl;
  allowedPathPrefix;
}
```

---

# 46. Dashboard URL helper

Для Header потрібний простий helper:

```ts
getAdminDashboardUrl(): string | null
```

Аналог поточного:

```text
getPharmacyDashboardUrl()
```

---

# 47. Fail closed у Header

Якщо admin config valid:

```text
→ UserBadge
```

Якщо invalid:

```text
→ disabled button
```

із текстом:

```text
Admin cabinet unavailable
```

Не показуємо broken link.

---

# 48. Не показуємо raw configuration error

Header не повинен рендерити:

```text
[MISSING_URL]
NEXT_PUBLIC_ADMIN_APP_URL...
```

користувачу.

Для header достатньо:

```text
Admin cabinet unavailable
```

---

# 49. Header не повинен падати через bad env

Не робимо в render:

```ts
requireAdminAppConfiguration();
```

який throw-не exception.

Для header потрібен safe:

```text
getAdminDashboardUrl()
→ URL | null
```

---

# 50. `usePublicHeaderController`

Зараз controller має:

```text
isClientMode
isPharmacyMode
pharmacyDashboardUrl
pharmacySummary
```

Додаємо:

```text
isAdminMode
adminDashboardUrl
```

---

# 51. `isAdminMode`

```ts
const isAdminMode = authState.mode === 'authenticated-admin';
```

Не визначаємо role повторно:

```ts
authState.user.role === 'admin';
```

Presentation state already normalized.

---

# 52. `adminDashboardUrl`

```ts
const adminDashboardUrl = isAdminMode ? getAdminDashboardUrl() : null;
```

---

# 53. Жодного `adminSummaryState`

Не створюємо:

```text
adminSummaryState
adminUserId
getCurrentAdminSummary
```

Для admin badge auth user уже достатній.

---

# 54. Жодного `useEffect` для admin badge

Pharmacy потребує asynchronous pharmacy summary.

Admin — ні.

Тому Stage 5 не повинен додати ще один:

```tsx
useEffect(() => fetchAdmin...)
```

у Header controller.

---

# 55. Controller return

Після Stage 5:

```text
authState
isClientMode
isPharmacyMode
isAdminMode

pharmacyDashboardUrl
pharmacySummary

adminDashboardUrl

isLogoutPending
logout
```

---

# 56. Logout для admin уже працює

Header already renders:

```tsx
{'logout' in authState ? <LogoutButton ... />}
```

`authenticated-admin` має `logout`.

Тому окремий:

```text
adminLogout()
```

не потрібний.

---

# 57. Logout style

Зараз:

```ts
variant={controller.isPharmacyMode ? 'ghost' : 'secondary'}
```

Для admin desktop це дасть:

```text
secondary
```

Так само, як client.

Я б Stage 5 не використовувала для redesign logout button.

---

# 58. Mobile logout

Там уже generic:

```text
tone="inverse"
```

і працює для всіх authenticated roles.

Без змін.

---

# 59. Cart для admin

Cart показується тільки:

```text
isClientMode
```

Тому admin не бачить Cart action/count.

Це вже правильно.

Не змінюємо.

---

# 60. Pharmacy summary fetch для admin не повинен запускатися

Поточний effect базується на:

```text
pharmacyUserId
```

який існує тільки для:

```text
authenticated-pharmacy
```

Stage 5 має зберегти цю умову.

Admin session не повинна викликати:

```text
getCurrentPharmacySummary()
```

---

# 61. Public auth state не потрібно змінювати

`selectPublicAuthActionsState()` уже має:

```ts
if (auth.user.role === 'admin') {
  return {
    ...authenticatedState,
    mode: 'authenticated-admin',
  };
}
```

Це вже правильний contract.

---

# 62. Existing state test лишається

Уже є test:

```text
admin
→ authenticated-admin
```

Не потрібно переписувати його.

Можна лише залишити як regression coverage.

---

# 63. Admin badge використовує user name

Name:

```tsx
name={authState.user.name}
```

Не:

```text
Administrator
Platform owner
Super admin
```

Тобто Header показує реальне ім'я користувача.

---

# 64. Meta

Другий рядок:

```text
Admin cabinet
```

Не:

```text
Administrator
Administration
Admin profile
```

Це відповідає pharmacy pattern:

```text
Pharmacy cabinet
```

---

# 65. Fallback label

Як fallback для initials:

```text
Admin
```

якщо з якоїсь причини display name відсутній.

Хоча current `AuthUser.name` required.

---

# 66. Email у badge не показуємо

Вимога Stage 5:

```text
photo
name
Admin cabinet
```

Тому не передаємо:

```tsx
email={authState.user.email}
```

бо тоді secondary text може змінитися.

---

# 67. Desktop responsive

Admin badge повинен займати той самий layout slot, що pharmacy badge.

Не повинен:

```text
розтягувати Header
створювати horizontal overflow
ламати Logout
ламати nav
```

на desktop.

---

# 68. Mobile responsive

У MobileOffcanvas:

```text
width: available
dark variant
same cabinet style
```

Без horizontal overflow.

---

# 69. Mobile menu закривається

При натисканні admin badge:

```tsx
onClick = { onClose };
```

обов'язковий.

Це вже є structural/accessibility pattern mobile menu.

---

# 70. Keyboard accessibility

Shared `UserBadge` link уже повинен бути доступний:

```text
Tab
Enter
visible focus
```

Не додаємо:

```text
role="button"
tabIndex
onKeyDown
```

на `<a>`.

---

# 71. External link не відкриваємо в новій вкладці

Не потрібно:

```html
target="_blank"
```

Admin cabinet — це application navigation, а не зовнішня довідка.

---

# 72. Не додаємо `rel="noopener"` без `target`

Не потрібно зайвого link boilerplate.

---

# 73. Stage 5 не змінює auth login flow

Client LoginForm як і раніше працює тільки з account types, які передбачені client login UI.

Не додаємо до client login radio:

```text
I am an admin
```

Admin login буде в admin application.

---

# 74. Жодного Admin Login у client

Категорично не додаємо:

```text
Admin
```

до:

```text
client LoginForm account type
```

Stage 5 працює лише із **вже існуючою admin session**.

---

# 75. Як admin session потрапляє в client

Admin входить через майбутній:

```text
apps/admin /login
```

Після цього shared auth cookies/session можуть бути розпізнані client application відповідно до deployment cookie contract.

Client уже вміє отримати current user:

```text
role = admin
```

Саме цей existing path використовує Stage 5.

---

# 76. Не додаємо admin auth BFF у client

Client already має свій:

```text
/api/auth/current
```

session flow.

Не потрібно:

```text
/api/admin/auth/current
```

---

# 77. Не змінюємо backend

Stage 5 не потребує змін у:

```text
apps/api
```

Admin identity already приходить у shared AuthResponse.

---

# 78. Не змінюємо `apps/admin`

Stage 4 уже підготував:

```text
/admin/dashboard
protected route contract
```

Stage 5 лише формує link з client.

Не потрібно змінювати admin application.

---

# 79. Не змінюємо `apps/pharmacy`

Ніяких змін у pharmacy frontend Stage 5 не потребує.

---

# 80. Не змінюємо `packages/ui`

`UserBadge` уже має весь потрібний контракт.

Це важлива acceptance condition:

```text
reuse existing shared UI
```

а не:

```text
modify shared component because admin appeared
```

---

# 81. Не починаємо Stage 6

Stage 6 буде про:

```text
FullscreenButton
shared user dropdown
nested Cabinet navigation
```

Stage 5 не чіпає:

```text
PharmacyHeader
CabinetTopBar
CabinetSidebar
navigation children
```

---

# 82. Не створюємо Admin Header

Це буде пізніше.

Stage 5 змінює **Client Header**, коли client бачить admin session.

Не плутати з:

```text
AdminHeader
```

---

# 83. Не створюємо Admin User Dropdown

У client header зараз потрібний лише clickable:

```text
UserBadge
```

Без dropdown:

```text
Profile
Website
Logout
```

Shared dropdown буде Stage 6/7.

---

# 84. Не додаємо Admin Profile link

Поки target лише:

```text
/admin/dashboard
```

Profile ще не реалізований.

---

# 85. Чи треба змінювати `resolveLoginDestination`

Для **Stage 5 — ні**.

Його поточна задача:

```text
client Login/Register/route guards
```

А Stage 5 — конкретно:

```text
Client Header presentation for existing admin session
```

Не розширюємо scope без необхідності.

---

# 86. Чи треба змінювати `ClientGuestOnlyRoute`

Також ні.

Це окреме питання про cross-app behavior auth pages, а не Header.

На Stage 5 достатньо, що public client header для admin більше не показує заглушку.

---

# 87. Чому не розширюємо scope

Інакше маленька задача:

```text
show Admin cabinet badge
```

почне міняти:

```text
Login
Register
GuestOnlyRoute
ProtectedRoute
redirect contract
```

Це вже інша auth navigation задача.

Працюємо поступово.

---

# 88. Admin app config tests

Обов'язково перевіряємо:

```text
development missing env
→ localhost:3001
```

```text
production missing env
→ error
```

```text
production HTTP
→ error
```

```text
credentials
→ error
```

```text
query/hash
→ error
```

```text
same client origin
→ error
```

```text
base path
→ preserved
```

```text
dashboard URL instead of base
→ error
```

---

# 89. Приклад base-path test

Input:

```text
https://apps.example.com/admin-app
```

Expected:

```text
dashboardUrl:
https://apps.example.com/admin-app/admin/dashboard
```

```text
allowedPathPrefix:
/admin-app/admin
```

---

# 90. Header contract test

Потрібно зафіксувати, що desktop Header:

```text
authenticated-admin
→ UserBadge
```

і більше не містить:

```text
Use the admin application for account tools.
```

---

# 91. Mobile contract test

Те саме для MobileOffcanvas:

```text
authenticated-admin
→ UserBadge
meta="Admin cabinet"
variant="dark"
onClick={onClose}
```

---

# 92. Shared component contract

Structural test має перевірити, що admin badge імпортується з:

```text
@e-pharmacy/ui/data-display
```

Не створено local:

```text
AdminUserBadge
```

---

# 93. Cross-app link contract

Для admin UserBadge повинен використовувати:

```text
renderLink
<a ...>
```

а не внутрішній Next Link.

---

# 94. Controller test / contract

Перевірити:

```text
authenticated-admin
→ isAdminMode = true
```

```text
authenticated-client
→ isAdminMode = false
```

```text
authenticated-pharmacy
→ isAdminMode = false
```

---

# 95. Не потрібно тестувати `UserBadge` заново

Shared UI вже має власні tests:

```text
picture fallback
initials
broken image handling
```

Stage 5 тестує лише правильну integration.

---

# 96. Новий structural check

Я б додала:

```text
scripts/checks/client/check-client-admin-header.mjs
```

---

# 97. Що перевіряє structural check

Мінімально:

```text
NEXT_PUBLIC_ADMIN_APP_URL documented

admin config files exist

development admin origin = localhost:3001

dashboard route = /admin/dashboard

Header uses shared UserBadge for authenticated-admin

MobileOffcanvas uses shared UserBadge

meta = Admin cabinet

old admin placeholder text absent

controller exposes isAdminMode

controller exposes adminDashboardUrl

admin badge uses auth user name

admin badge uses auth user pictureUrl

mobile badge closes menu

external link uses <a>

no admin profile fetch

no new admin API call

no copied UserBadge
```

---

# 98. Structural check також захищає межі Stage 5

Не повинні з'явитися:

```text
AdminHeader
AdminSidebar
FullscreenButton refactor
nested navigation
admin dashboard page
admin profile page
```

---

# 99. Existing client component a11y check

Можна додати невелику перевірку:

```text
Mobile admin badge closes menu
```

до existing:

```text
check-client-components-a11y
```

але основний Stage 5 contract краще тримати в окремому check.

---

# 100. Root package script

Додати:

```json
"check:client-admin-header":
  "node scripts/checks/client/check-client-admin-header.mjs"
```

---

# 101. `check:client`

Новий check включити до client structural section:

```text
check:client-admin-header
↓
existing client checks
↓
lint
↓
type-check
↓
tests
↓
build
```

Точне місце не критичне, але до lint/build.

---

# 102. `check:before-deploy`

Так само додаємо один раз:

```bash
pnpm check:client-admin-header
```

до structural частини.

Не запускаємо:

```text
pnpm check:client
```

всередині `check:before-deploy`, бо це дублює lint/test/build.

---

# 103. `.env.example`

Stage 5 змінює:

```text
apps/client/.env.example
```

Додаємо:

```env
# Admin application base URL used by authenticated admin accounts
# when moving from the client storefront to the admin cabinet.
# Production: HTTPS base URL, no credentials/query/hash.
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

---

# 104. `apps/client/README.md`

Оновити environment table.

Додати:

```text
NEXT_PUBLIC_ADMIN_APP_URL
```

із призначенням:

```text
admin application base URL used for trusted
cross-application cabinet navigation
```

---

# 105. README має пояснювати base URL

Наприклад:

```text
NEXT_PUBLIC_ADMIN_APP_URL must point to the admin application base URL.
Do not include /admin/dashboard.
```

---

# 106. Root README

Оскільки root README уже містить local environment examples, я б також додала:

```env
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

у client env example.

Це не обов'язково business logic, але документація повинна лишатися source-of-truth.

---

# 107. Нових dependencies не потрібно

Stage 5 використовує вже наявні:

```text
React
Next
@e-pharmacy/auth
@e-pharmacy/types
@e-pharmacy/ui
```

Тому:

```text
pnpm-lock.yaml
```

очікувано не змінюється.

---

# 108. Expected file scope

Приблизно очікую такі зміни.

### Нові

```text
apps/client/src/lib/auth/admin-app-config-core.ts
apps/client/src/lib/auth/admin-app-config.ts
apps/client/src/lib/auth/admin-app-config.test.ts
scripts/checks/client/check-client-admin-header.mjs
```

Якщо робимо маленький common URL refactor:

```text
apps/client/src/lib/auth/external-app-config-core.ts
```

також буде NEW.

---

# 109. Existing files UPDATE

```text
apps/client/src/components/layout/Header/Header.tsx
apps/client/src/components/layout/Header/Header.module.css

apps/client/src/components/layout/MobileOffcanvas/MobileOffcanvas.tsx
apps/client/src/components/layout/MobileOffcanvas/MobileOffcanvas.module.css

apps/client/src/components/layout/hooks/usePublicHeaderController.ts

apps/client/src/lib/auth/index.ts
```

---

# 110. Config/docs UPDATE

```text
apps/client/.env.example
apps/client/README.md
README.md
package.json
```

---

# 111. Можливий pharmacy-config refactor

Якщо common URL validator виноситься:

```text
apps/client/src/lib/auth/pharmacy-app-config-core.ts
```

може отримати невеликий UPDATE.

Це не зміна pharmacy functionality.

Усі його існуючі tests повинні проходити без змін semantics.

---

# 112. Що не очікую змінювати

Stage 5 не потребує змін у:

```text
apps/api
apps/admin
apps/pharmacy

packages/ui
packages/auth
packages/types
packages/validation
packages/next-api
```

---

# 113. Manual check — admin with photo

Session:

```text
role = admin
status = active
pictureUrl exists
```

Desktop header показує:

```text
[photo] Natalia
        Admin cabinet
```

---

# 114. Manual check — admin without photo

Session:

```text
role = admin
status = active
pictureUrl absent
```

Header показує initials:

```text
NS
Natalia Skoropad
Admin cabinet
```

без broken image.

---

# 115. Manual check — desktop navigation

Натиснути:

```text
Admin cabinet
```

Очікуємо transition:

```text
client :3000
→ admin :3001/admin/dashboard
```

---

# 116. Поки Dashboard відсутній

Після auth guard:

```text
active admin
→ branded admin 404
```

Це очікувано.

Не вважаємо це Stage 5 bug.

---

# 117. Manual check — mobile

Відкрити burger menu.

Очікуємо:

```text
dark Admin cabinet badge
```

При натисканні:

```text
menu closes
cross-app navigation starts
```

---

# 118. Manual check — admin config missing у development

Без:

```text
NEXT_PUBLIC_ADMIN_APP_URL
```

development використовує:

```text
http://localhost:3001
```

Badge працює.

---

# 119. Manual check — bad production config

При invalid production admin URL:

Header показує:

```text
Admin cabinet unavailable
```

і не рендерить небезпечний link.

---

# 120. Manual check — pharmacy regression

Увійти як pharmacy.

Переконатися:

```text
Pharmacy cabinet badge
```

виглядає та працює точно як раніше.

---

# 121. Manual check — client regression

Увійти як client.

Переконатися:

```text
Client UserBadge
Cart
Logout
```

працюють як до Stage 5.

---

# 122. Blocked admin

`blocked-account` має й надалі показувати:

```text
Account access is blocked.
```

Не показуємо Admin cabinet badge.

Бо state selector перевіряє blocked **до role mode**.

---

# 123. Auth unavailable

При:

```text
authState.mode = unavailable
```

Header як і раніше показує:

```text
Retry session check
```

Admin badge не рендериться.

---

# 124. Loading

Поки session bootstrap:

```text
authState.mode = loading
```

показуємо існуючий auth skeleton.

Не flashing admin name до завершення auth bootstrap.

---

# 125. Unsupported role

Existing:

```text
authenticated-unsupported
```

залишається без змін.

Stage 5 не прибирає defensive fallback.

---

# 126. Security boundary

Admin UserBadge — лише navigation/presentation.

Він не є authorization layer.

Навіть якщо користувач вручну відкриє:

```text
/admin/dashboard
```

без правильного account:

Stage 4:

```text
AdminProtectedRoute
```

вирішує access.

---

# 127. Не покладаємося на прихований badge

Безпека не повинна будуватися на:

```text
«ми не показали link»
```

Client Header лише підказує правильний cabinet.

Backend + Stage 4 guard лишаються authoritative boundaries.

---

# 128. Commands

Окремо після реалізації:

```bash
pnpm check:client-admin-header
```

```bash
pnpm lint:client
```

```bash
pnpm type-check:client
```

```bash
pnpm --filter @e-pharmacy/client test
```

```bash
pnpm --filter @e-pharmacy/client test:react
```

```bash
pnpm build:client
```

---

# 129. Client complete check

```bash
pnpm check:client
```

---

# 130. Monorepo complete check

```bash
pnpm check:before-deploy
```

---

# 131. Definition of Done

Stage 5 готовий, коли:

```text
authenticated-admin уже не показує placeholder text;

desktop Header показує shared UserBadge;

MobileOffcanvas показує shared UserBadge;

badge використовує authState.user.name;

badge використовує authState.user.pictureUrl;

fallback initials працюють через shared UserBadge;

meta = "Admin cabinet";

desktop badge веде в admin application;

mobile badge веде в admin application;

mobile badge закриває menu;

target = /admin/dashboard;

NEXT_PUBLIC_ADMIN_APP_URL доданий;

env містить base URL, а не dashboard URL;

development fallback = localhost:3001;

production missing URL fail-closed;

production HTTP URL rejected;

credentials/query/hash rejected;

client same-origin config rejected;

base paths підтримуються;

bad config не створює broken/unsafe link;

bad config показує "Admin cabinet unavailable";

pharmacy badge не отримав regression;

client badge не отримав regression;

Cart лишається client-only;

pharmacy summary request не запускається для admin;

admin badge не робить окремого API request;

не створено AdminUserBadge;

packages/ui не змінюється;

apps/api не змінюється;

apps/admin не змінюється;

apps/pharmacy не змінюється;

не створено AdminHeader;

не створено User dropdown;

не реалізовано Stage 6;

не реалізовано Dashboard;

не реалізовано Admin Profile;

не додано admin option у client Login;

structural check проходить;

client lint проходить;

client type-check проходить;

client tests проходять;

client build проходить;

check:before-deploy проходить.
```

---

# 132. Архітектура після Stage 5

Client Header:

```text
session bootstrap
       ↓
PublicAuthActionsState
       ↓
┌──────────────────────────┐
│ role = client            │
│ → Client UserBadge       │
├──────────────────────────┤
│ role = pharmacy          │
│ → Pharmacy UserBadge     │
├──────────────────────────┤
│ role = admin             │
│ → Admin UserBadge        │
└──────────────────────────┘
```

Admin branch:

```text
authenticated-admin
       ↓
authState.user
       ↓
name + pictureUrl
       ↓
shared UserBadge
       ↓
Admin cabinet
       ↓
NEXT_PUBLIC_ADMIN_APP_URL
       +
/admin/dashboard
```

Жодного нового backend request.

---

# 133. Головне правило Stage 5

Після цього client site більше не сприймає admin session як:

> «Так, я знаю, хто ти, але йди кудись в інше місце сам» 😄

Він нормально показує identity користувача і дає один зрозумілий перехід:

```text
Admin cabinet
```

При цьому вся security/access logic лишається там, де їй і місце:

```text
AdminProtectedRoute + backend
```

а `Client Header` займається лише presentation та navigation.

Тобто Stage 5 я б залишила повністю client-side за scope: без змін API, admin application, pharmacy application чи shared UserBadge. І окремий admin profile fetch тут точно зайвий — ім’я та фото вже приходять у AuthUser, тож Header отримує все необхідне «без ще одного маленького запиту, який потім дивним чином стає двадцять першим» 😄

//=====================================================================

Привіт 🙂 Готово. Реалізувала **лише етап 5 з `apps/admin/README-5.md`**, без заходу в етап 6+.

[Завантажити архів з оновленими/доданими файлами Stage 5](sandbox:/mnt/data/e-pharmacy-stage-5-client-admin-header.zip)

У результаті:

- для залогіненого admin у desktop і mobile client header тепер показується shared `UserBadge`: фото/initials, ім’я та `Admin cabinet`;
- перехід веде на canonical `/admin/dashboard` через `NEXT_PUBLIC_ADMIN_APP_URL`;
- додана fail-closed конфігурація admin URL з dev fallback `http://localhost:3001`, HTTPS-вимогою для production, перевірками credentials/query/hash/same-origin і підтримкою base path;
- спільну URL-валідацію pharmacy/admin винесено лише в **client-local helper**, без змін shared packages;
- pharmacy behavior збережений;
- старий текст `Use the admin application for account tools.` прибраний;
- доданий окремий `check:client-admin-header` і включений у `check:client` та `check:before-deploy`;
- документацію та `.env.example` оновлено;
- `apps/admin`, `apps/api`, `apps/pharmacy`, shared packages і `pnpm-lock.yaml` не змінювалися. Усього в архіві **16 файлів: 11 оновлених + 5 нових**.

Перевірки Stage 1–4 для admin проходять, Stage 5 structural/a11y/styles/lib checks проходять, TypeScript для `apps/admin` і `apps/client` проходить, точкові тести — **9/9**. Повний Next build у цьому розпакованому архівному середовищі запустити неможливо через відсутній dependency `@swc/helpers` у вкладеному dependency tree, тобто це обмеження самого наданого архіву, а не помилка Stage 5.

**Коміт:**

```text
feat(client): add admin cabinet navigation to public header
```
