Так 🙂 Після успішного Stage 6 Stage 7 уже можна будувати як **реальний Admin application shell**, але без реалізації бізнесових сторінок наступних етапів.

І я б одразу зафіксувала твоє рішення щодо співробітників: основна сутність — **Employee / Співробітник**, а не Role. Майбутня **«Посада»** буде радше набором/пресетом доступів: наприклад `Бухгалтер`, `Moderator`, `Content manager`, `Support`, `Administrator`. У Stage 7 саму систему посад ще не будуємо — лише не закладаємо архітектуру, яка потім змусить називати співробітника «роллю».

Нижче готовий текст для `apps/admin/README-7.md`.

---

# 11. ЕТАП 7 — Admin Shell

## 1. Мета етапу

Після Stage 6 shared Cabinet UI уже має reusable primitives для:

```text
FullscreenButton
UserDropdown
CabinetSidebar
nested navigation
mobile navigation
```

Тепер можна побудувати application-specific shell для admin:

```text
AdminShell
AdminHeader
AdminSidebar
AdminMobileMenu
```

Основний принцип:

```text
Admin application
        ↓
admin-specific configuration/controllers
        ↓
shared Cabinet UI
```

Не копіюємо:

```text
PharmacyShell
PharmacyHeader
PharmacySidebar
PharmacyMobileMenu
```

Admin використовує ту саму Cabinet architecture, але має:

```text
свої routes
свою navigation config
свої breadcrumbs
свій logout controller
свою auth/session presentation
```

---

# 2. Що вже готово до Stage 7

До початку Stage 7 уже повинні бути готові Stage 1–6.

Зокрема:

```text
Stage 1
Admin application foundation

Stage 2
loading / not-found / error / global-error

Stage 3
admin auth foundation

Stage 4
AdminProtectedRoute

Stage 5
client → Admin cabinet navigation

Stage 6
shared Cabinet UI
```

Stage 7 не дублює їхню логіку.

Особливо важливо зберегти:

```text
/admin/* → AdminProtectedRoute
role === admin
status === active
```

Security/auth boundary уже існує і не переноситься в `AdminShell`.

---

# 3. Scope Stage 7

У Stage 7 реалізуємо:

```text
AdminShell
AdminHeader
AdminSidebar
AdminMobileMenu

ADMIN_NAVIGATION
admin breadcrumbs
admin shell presentation/controller logic
responsive cabinet layout
```

Також:

```text
integration з AdminProtectedRoute
shared Cabinet components composition
logout wiring
website link
admin user presentation
nested navigation config
structural checks
unit / React / integration tests
```

---

# 4. Що НЕ входить у Stage 7

Stage 7 — це **shell**, а не реалізація всіх admin features.

Тому зараз не реалізуємо:

```text
Dashboard business widgets
Pharmacy Owners feature
Pharmacies management
Products management
Product Requests management
Clients management
Orders management
Reviews management
Employees CRUD
Positions CRUD
permissions editor
Site Pages editor
Product Categories CRUD
Admin Profile business form
notifications
support chat
audit log
reports
exports
```

Також не додаємо fake data тільки для того, щоб shell виглядав заповненим.

---

# 5. Цільова структура

Архітектурно:

```text
AdminProtectedRoute
        │
        ▼
AdminShell
├── AdminSidebar
│    └── CabinetSidebar
│
├── AdminHeader
│    └── CabinetTopBar
│         ├── Breadcrumbs
│         ├── FullscreenButton
│         └── UserBadge / UserDropdown
│
├── AdminMobileMenu
│    └── shared Cabinet mobile navigation
│
└── page content
```

Admin-specific компоненти тут переважно є **composition layer**.

Вони не повинні повторно реалізовувати interaction mechanics із `@e-pharmacy/ui`.

---

# 6. AdminShell

`AdminShell` відповідає за загальний layout приватної admin application.

Концептуально:

```tsx
<AdminShell>{children}</AdminShell>
```

Він збирає:

```text
AdminSidebar
AdminHeader
AdminMobileMenu
content area
```

---

# 7. Чого AdminShell не робить

`AdminShell` не повинен:

```text
перевіряти JWT
читати cookies
перевіряти role
перевіряти account status
робити backend requests
завантажувати dashboard
завантажувати profile окремим запитом
визначати permissions backend-side
```

Це не security layer.

Security boundary залишається:

```text
AdminProtectedRoute
```

---

# 8. Інтеграція з protected admin layout

Приватна admin route tree повинна мати один canonical protected boundary.

Концептуально:

```tsx
<AdminProtectedRoute>
  <AdminShell>{children}</AdminShell>
</AdminProtectedRoute>
```

Не потрібно повторювати:

```tsx
<AdminProtectedRoute />
```

на кожній окремій сторінці.

---

# 9. Не ламати Server Component boundaries

Якщо admin route layout зараз може залишатися Server Component — не потрібно робити весь layout:

```ts
'use client';
```

лише тому, що shell має interactive sidebar/header.

Client boundary повинна починатися настільки низько, наскільки це практично можливо.

Наприклад:

```text
admin/layout.tsx        Server Component
        ↓
AdminProtectedRoute / AdminShell client boundary
```

Точну межу потрібно підібрати відповідно до вже існуючої Stage 1–4 architecture.

---

# 10. AdminHeader

Не копіюємо `PharmacyHeader.tsx`.

Створюємо:

```text
AdminHeader
```

як admin-specific composition shared Cabinet components.

Концептуально:

```text
AdminHeader
└── CabinetTopBar
     ├── Breadcrumbs
     ├── FullscreenButton
     └── User area
          ├── UserBadge
          └── UserDropdown
```

---

# 11. Breadcrumbs у Header

AdminHeader повинен отримувати breadcrumbs із окремої admin route/breadcrumb layer.

Не потрібно визначати section через display label.

Наприклад не робимо:

```ts
if (label === 'Orders') ...
```

Route identity повинна походити з:

```text
pathname
+
ADMIN_ROUTES
```

---

# 12. Admin breadcrumbs

Створити canonical admin breadcrumbs resolver.

Наприклад:

```text
apps/admin/src/lib/layout/breadcrumbs.ts
```

Концептуально:

```ts
getAdminBreadcrumbs(pathname);
```

Він повинен знати:

```text
admin route families
breadcrumb labels
nested route relationships
```

Але не повинен:

```text
fetch data
читати auth
перевіряти permissions
```

---

# 13. Breadcrumbs для nested navigation

Наприклад:

```text
Reviews
  Pharmacy reviews
```

може мати:

```text
Reviews / Pharmacy reviews
```

А:

```text
Settings
  Employees
```

може мати:

```text
Settings / Employees
```

Breadcrumb config і navigation config можуть використовувати ті самі canonical route constants.

Не потрібно дублювати raw path strings у кількох компонентах.

---

# 14. FullscreenButton

AdminHeader використовує shared:

```text
@e-pharmacy/ui/cabinet
FullscreenButton
```

Не створюємо:

```text
AdminFullscreenButton
```

Не копіюємо:

```text
fullscreenchange
requestFullscreen
exitFullscreen
event listeners
```

Це вже responsibility shared UI після Stage 6.

---

# 15. Admin user presentation

Header повинен показувати admin identity.

Використовуємо існуючу auth/session information.

Наприклад:

```text
photo
name
Admin cabinet
```

або відповідну final Cabinet presentation, узгоджену зі shared `UserBadge`.

Важливо:

**не робити окремий profile request лише для Header**, якщо ім'я/photo вже доступні в canonical admin session/auth state.

Shell не повинен створювати ще один network request на кожному admin route.

---

# 16. Admin UserDropdown

Admin використовує shared configurable:

```text
UserDropdown
```

Application-level configuration:

```text
Profile
Website
Logout
```

Shared component відповідає за:

```text
open / close
outside click
Escape
focus behavior
item rendering
a11y
```

Admin application відповідає за:

```text
href
logout callback
available actions
```

---

# 17. Profile item

Не потрібно створювати fake Admin Profile page лише для того, щоб dropdown мав пункт `Profile`.

Якщо profile route уже існує у canonical Stage 1–6 route contract — використовуємо його.

Якщо сама profile page належить наступному feature stage, Stage 7 не створює тимчасову сторінку.

Головний принцип:

```text
ніяких placeholder pages
ніякого fake content
```

---

# 18. Website item

Пункт:

```text
Website
```

веде на client application.

URL не хардкодимо в Header.

Використовуємо canonical application URL/config helper відповідно до вже прийнятого pattern між:

```text
client
pharmacy
admin
```

Не дублюємо URL validation.

---

# 19. Logout

Logout залишається admin application concern.

Shared dropdown отримує callback.

Концептуально:

```ts
{
  type: 'action',
  label: 'Log out',
  onSelect: logoutFromAdmin,
}
```

Не переносимо auth logic у:

```text
@e-pharmacy/ui
```

---

# 20. Logout pending state

Поки logout виконується:

```text
Log out
→
Logging out...
```

Action має бути disabled від повторного submit.

Не допускаємо:

```text
double logout request
multiple redirects
multiple toast/error races
```

Якщо такий contract уже існує у pharmacy — admin використовує той самий UX pattern, але не копіює pharmacy controller.

---

# 21. AdminSidebar

Створюємо:

```text
AdminSidebar
```

але його основою є shared:

```text
CabinetSidebar
```

AdminSidebar відповідає в основному за передачу:

```text
ADMIN_NAVIGATION
pathname / active route
application-specific callbacks
```

---

# 22. Canonical admin navigation

Створити один canonical navigation config.

Наприклад:

```text
apps/admin/src/lib/layout/navigation.ts
```

Концептуально:

```ts
export const ADMIN_NAVIGATION = [...]
```

Це source of truth і для:

```text
AdminSidebar
AdminMobileMenu
```

Не створюємо:

```text
ADMIN_DESKTOP_NAVIGATION
ADMIN_MOBILE_NAVIGATION
```

з двома окремими наборами items.

---

# 23. Основні розділи Admin меню

Admin navigation повинна бути підготовлена для таких розділів:

```text
Dashboard

Pharmacy Owners

Pharmacies

Products

Product Requests

Clients

Orders

Reviews
  Pharmacy reviews
  Product reviews

Settings
  Employees
  Site pages
  Product categories
```

Назви мають відповідати final UI language/conventions проєкту.

---

# 24. Reviews — nested group

`Reviews` — navigation group, а не fake link.

Структура:

```text
Reviews
├── Pharmacy reviews
└── Product reviews
```

Використовує shared Stage 6 nested navigation.

Тобто AdminSidebar не реалізує заново:

```text
expanded state
chevron
aria-expanded
active parent
auto-open active group
collapsed flyout
```

---

# 25. Settings — nested group

`Settings`:

```text
Settings
├── Employees
├── Site pages
└── Product categories
```

Так само використовує shared nested navigation.

---

# 26. «Співробітники», а не «Ролі»

Основна admin сутність:

```text
Employee
```

UI section:

```text
Employees
```

або українською:

```text
Співробітники
```

якщо admin UI локалізується українською.

Не називаємо цей розділ:

```text
Roles
```

Користувацька дія — це:

> додати співробітника і визначити, що йому дозволено.

---

# 27. Майбутня «Посада»

У майбутньому employee може мати:

```text
Position
```

Наприклад:

```text
Бухгалтер
Moderator
Content manager
Support
Administrator
```

Але `Position` — це не identity користувача і не заміна `Employee`.

Концептуально:

```text
Employee
├── identity
├── position
└── permissions
```

---

# 28. Що таке Position у майбутньому

`Position` можна буде використовувати як permission preset.

Наприклад:

```text
Position: Accountant

preset permissions:
✓ view orders
✓ view statistics
✓ financial access
✗ content moderation
```

Але конкретному Employee permissions при необхідності можуть бути уточнені окремо.

Це питання наступних stages.

Stage 7 **не реалізує Position CRUD**.

---

# 29. Не вводити Role як головну domain entity

Не будувати зараз API/UI model:

```text
Role → user
```

як єдину основу майбутньої системи співробітників.

Не потрібно створювати:

```text
Roles page
Role dropdown
Role management
ROLE_NAVIGATION
```

у Stage 7.

Поточний admin account:

```text
role === admin
```

залишається auth-level role.

А майбутня:

```text
Position
```

— це business-level сутність для admin employees.

Це різні поняття.

---

# 30. Auth role ≠ employee position

Це важливо закласти вже зараз.

Наприклад:

```text
Auth role:
admin

Employee position:
Accountant
Support
Content manager
```

Не потрібно перевантажувати auth `role` значеннями:

```text
accountant
moderator
support
```

якщо вони фактично є посадами/permission presets всередині Admin Cabinet.

---

# 31. Permissions у Stage 7

Stage 7 не повинен вигадувати permission matrix, якої ще немає.

Тобто зараз не створюємо:

```text
ADMIN_PERMISSION_MAP
canReadOrders
canManagePharmacies
canModerateReviews
...
```

лише «на майбутнє».

Але architecture boundary має бути правильною:

```text
Admin application
→ вирішує, які navigation items доступні

Shared Cabinet UI
→ тільки render отриманих items
```

Коли employee permissions з'являться, filtering відбуватиметься **до** передачі navigation у shared UI.

---

# 32. Shared UI не знає про permissions

Не додаємо в shared package:

```ts
role: 'admin';
```

або:

```ts
permission: 'manage-employees';
```

як hardcoded application concepts.

Shared Cabinet може отримати вже готовий:

```text
visible navigation model
```

але не повинен бути authorization engine.

---

# 33. Navigation не є security layer

Навіть коли в майбутньому menu item буде прихований за permission:

```text
hidden menu item ≠ forbidden route
```

Backend і protected application boundary залишаються authoritative.

Stage 7 не повинен створювати хибну модель:

```text
немає пункту меню
→ значить route захищений
```

---

# 34. Routes

Усі admin links повинні будуватися через canonical:

```text
ADMIN_ROUTES
```

Не хардкодимо raw paths у:

```text
AdminHeader
AdminSidebar
AdminMobileMenu
breadcrumbs
dropdown
```

Наприклад концептуально:

```ts
ADMIN_ROUTES.DASHBOARD
ADMIN_ROUTES.PHARMACIES
ADMIN_ROUTES.ORDERS
...
```

Nested routes також мають бути centralized.

---

# 35. Не створювати route constants без consumer

Якщо route належить feature, який ще навіть не має navigation entry або іншого Stage 7 consumer — не потрібно генерувати десятки speculative constants.

Створюємо лише canonical routes, необхідні для final shell/navigation contract.

---

# 36. Future page routes

Stage 7 може визначити final navigation destinations, але не створює fake page implementations.

Не робимо:

```tsx
export default function ProductsPage() {
  return <div>Coming soon</div>;
}
```

Не робимо:

```text
TODO page
Empty dashboard
Feature coming soon
```

лише для уникнення 404 під час staged development.

Кожна business page з'явиться у своєму етапі.

---

# 37. AdminMobileMenu

Створюємо:

```text
AdminMobileMenu
```

на базі shared Cabinet mobile navigation.

Він отримує той самий:

```text
ADMIN_NAVIGATION
```

що й desktop sidebar.

---

# 38. Mobile nested navigation

На mobile:

```text
Reviews
  Pharmacy reviews
  Product reviews

Settings
  Employees
  Site pages
  Product categories
```

використовує Stage 6 behavior:

```text
expand/collapse
chevron
aria-expanded
active parent
active child
auto-open active group
```

При відкритті group drawer не закривається.

При переході за child link:

```text
navigate
→ mobile menu closes
```

---

# 39. Desktop collapsed sidebar

Admin nested groups мають працювати у collapsed desktop mode через Stage 6 shared flyout/submenu.

Admin не реалізує власний popover.

Очікування:

```text
[Reviews icon]
      ↓
Pharmacy reviews
Product reviews
```

Так само:

```text
[Settings icon]
      ↓
Employees
Site pages
Product categories
```

---

# 40. Sidebar state

Expanded/collapsed state залишається UI state.

Не потрібно:

```text
backend request
user setting API
cookie API
database persistence
```

лише заради Stage 7.

Якщо shared Cabinet already має canonical behavior — AdminShell його використовує.

---

# 41. Header responsive behavior

Зберігаємо UX conventions pharmacy Cabinet:

### Desktop

```text
sidebar
breadcrumbs/title
fullscreen
user badge/dropdown
```

### Tablet

```text
відповідно до shared breakpoints
fullscreen за наявним Cabinet contract
user area
```

### Mobile

```text
burger
compact title/header
user/menu behavior згідно shared Cabinet
```

Не створюємо admin-specific breakpoints без потреби.

---

# 42. Візуальна узгодженість

Admin Cabinet повинен бути стилістично таким самим, як Pharmacy Cabinet.

Тобто використовуємо той самий design system:

```text
spacing
border radii
shadows
typography
focus states
sidebar width
header height
breakpoints
```

Admin-specific styles потрібні лише там, де справді відрізняється composition.

---

# 43. AdminSidebar counters

На Stage 7 не додаємо counters, якщо для них немає вже готового canonical admin API.

Не потрібно робити:

```text
Orders 12
Product requests 7
Reviews 4
```

із mock values або додаткових list requests.

Shell має залишатися дешевим.

Counters можна додати разом із відповідним feature/statistics contract.

---

# 44. Network budget Admin Shell

Сам `AdminShell` повинен бути максимально network-neutral.

Очікування:

```text
FullscreenButton          0 requests
Sidebar                   0 requests
MobileMenu                0 requests
Breadcrumbs               0 requests
navigation                0 requests
```

Header не робить duplicate profile request, якщо admin identity вже є у session/auth state.

---

# 45. AdminHeader loading state

Не потрібно приховувати весь shell через повторний profile loader, якщо auth bootstrap уже завершений.

`AdminProtectedRoute` визначає session/auth lifecycle.

Після дозволеного входу shell повинен мати достатньо інформації для базового render.

---

# 46. Error boundaries

AdminShell не створює власний global error system.

Stage 2 уже має:

```text
error.tsx
global-error.tsx
not-found.tsx
loading.tsx
```

Shell не дублює:

```text
ErrorPage
NotFoundPage
PageLoader
```

---

# 47. Accessibility — Header

Перевірити:

```text
fullscreen accessible label
user dropdown aria-expanded
Escape
outside click
visible focus
links/buttons semantics
```

Stage 7 не повинен регреснути Stage 6 shared behavior.

---

# 48. Accessibility — Sidebar

Desktop navigation:

```text
semantic nav
current route indication
keyboard navigation
visible focus
expandable group button
aria-expanded
aria-controls
```

Active state не повинен визначатися лише кольором.

---

# 49. Accessibility — Mobile menu

Перевірити:

```text
burger accessible name
drawer accessible semantics
focus behavior
Escape
outside close
nested navigation
child links
```

Не створювати другий несумісний mobile interaction pattern для admin.

---

# 50. Active navigation

Flat item:

```text
/admin/orders
→ Orders active
```

Nested child:

```text
.../reviews/pharmacies
→ Pharmacy reviews active
→ Reviews parent active
→ Reviews group open
```

Nested Settings route:

```text
.../settings/employees
→ Employees active
→ Settings active
→ Settings open
```

Це має працювати і після direct refresh.

---

# 51. Breadcrumb state ≠ navigation state

Breadcrumbs і Sidebar можуть використовувати ті самі route constants, але не повинні залежати один від одного через DOM/state.

Не робимо:

```text
Sidebar selected item
→ Header reads sidebar state
→ generates breadcrumb
```

Source of truth:

```text
pathname
```

---

# 52. Admin-specific icons

Для navigation можна використовувати existing icon library/conventions проєкту.

Не додаємо новий icon package.

Icons:

- decorative там, де label уже є;
- `aria-hidden="true"` для декоративних icons.

---

# 53. Proposed file structure

Точна структура має відповідати поточному `apps/admin`, але орієнтовно:

```text
apps/admin/src/
├── components/
│   └── layout/
│       ├── AdminShell.tsx
│       ├── AdminShell.module.css
│       ├── AdminHeader.tsx
│       ├── AdminHeader.module.css
│       ├── AdminSidebar.tsx
│       └── AdminMobileMenu.tsx
│
├── lib/
│   ├── routes.ts
│   └── layout/
│       ├── navigation.ts
│       ├── breadcrumbs.ts
│       └── ...
│
└── app/
    └── admin/
        └── layout.tsx
```

Не потрібно механічно створювати кожен файл із цього дерева, якщо current structure already має canonical location.

---

# 54. Не робити barrel proliferation

Якщо `components/layout` не потребує окремого public API, не потрібно створювати:

```text
index.ts
index.ts
index.ts
```

на кожному рівні.

Public exports потрібні лише там, де вони реально є architectural boundary.

---

# 55. Shared imports

Admin components імпортують shared Cabinet UI через canonical exports:

```ts
import {
  CabinetSidebar,
  CabinetTopBar,
  FullscreenButton,
  UserDropdown,
} from '@e-pharmacy/ui/cabinet';
```

Не використовувати:

```text
@e-pharmacy/ui/src/...
```

---

# 56. Заборонені залежності

`@e-pharmacy/ui` не імпортує:

```text
apps/admin
ADMIN_ROUTES
admin auth
admin permissions
```

Admin application може імпортувати shared packages.

Напрям залежностей:

```text
Admin
  ↓
shared packages
```

Не навпаки.

---

# 57. Не копіювати pharmacy config

Admin не повинен імпортувати:

```text
PHARMACY_NAVIGATION
PHARMACY_ROUTES
pharmacy breadcrumbs
PharmacyHeader
```

Shared UI — спільний.

Application config — окремий.

---

# 58. Application boundaries

Концептуально:

```text
Pharmacy
├── PHARMACY_ROUTES
├── PHARMACY_NAVIGATION
├── pharmacy breadcrumbs
└── pharmacy controllers

Admin
├── ADMIN_ROUTES
├── ADMIN_NAVIGATION
├── admin breadcrumbs
└── admin controllers

Shared UI
├── CabinetSidebar
├── CabinetTopBar
├── FullscreenButton
└── UserDropdown
```

Саме це є цільовою архітектурою.

---

# 59. Structural checker

Для Stage 7 варто додати окремий checker:

```text
check:admin-shell
```

Він має перевіряти ключові architecture contracts.

Наприклад:

```text
AdminShell exists
AdminHeader exists
AdminSidebar exists
AdminMobileMenu exists

Admin uses shared Cabinet components

Admin does not import PharmacyHeader/Sidebar/Shell

ADMIN_NAVIGATION is canonical

desktop/mobile use same navigation config

nested Reviews exists

nested Settings exists

Employees is used instead of Roles

FullscreenButton comes from shared Cabinet UI

UserDropdown comes from shared Cabinet UI

AdminShell does not fetch business data
```

---

# 60. Не робити checker надто brittle

Stage 5 уже показав, що checker не повинен вимагати конкретний string у конкретному файлі, якщо architecture contract реально збережений через shared abstraction.

Тому checker має перевіряти **architecture**, а не випадкову форму implementation.

Наприклад краще:

```text
AdminHeader consumes shared FullscreenButton
```

ніж:

```text
рядок "requestFullscreen" має бути в AdminHeader.tsx
```

Бо друге прямо суперечило б Stage 6.

---

# 61. Unit tests

Pure tests доречні для:

```text
ADMIN_NAVIGATION structure
route uniqueness
breadcrumb resolution
active route mapping
nested group relationships
```

Наприклад:

```text
Dashboard route unique

Reviews has:
- Pharmacy reviews
- Product reviews

Settings has:
- Employees
- Site pages
- Product categories
```

---

# 62. Route tests

Перевірити:

```text
canonical ADMIN_ROUTES
no duplicate paths
no malformed route builders
navigation uses existing route constants
breadcrumb resolver recognizes canonical routes
unknown route does not invent breadcrumb
```

---

# 63. React tests — AdminHeader

Покрити щонайменше:

```text
renders admin identity
renders breadcrumbs
renders FullscreenButton
opens UserDropdown
renders Website action
renders Logout action
logout callback invoked once
pending logout disables repeated action
```

Якщо Profile action ще не має route на цьому stage — не створювати fake assertion на placeholder page.

---

# 64. React tests — AdminSidebar

Перевірити:

```text
flat items render
Reviews group renders
Settings group renders
nested items render
active child marks parent active
active route opens parent
collapsed mode keeps children reachable
```

Не потрібно повторно тестувати всю внутрішню реалізацію shared `CabinetSidebar`, якщо це вже покрито `packages/ui`.

Admin tests мають перевіряти integration/configuration.

---

# 65. React tests — AdminMobileMenu

Перевірити:

```text
same navigation config
nested groups available
group expansion does not close drawer
child navigation closes drawer
active nested route opens correct group
```

---

# 66. Integration tests

Корисні Stage 7 сценарії:

```text
authenticated active admin
→ /admin/dashboard
→ shell renders

unauthenticated
→ protected route behavior from Stage 4

wrong role
→ Stage 4 redirect behavior

blocked admin
→ Stage 4 behavior

direct nested route
→ shell renders
→ correct parent navigation active
→ correct breadcrumbs
```

Не дублювати весь Stage 4 auth test suite.

---

# 67. Regression checks Stage 1–6

Після Stage 7 обов'язково прогнати existing checks:

```text
admin app shell/foundation
admin providers
admin status pages
admin auth foundation
admin protected route

client admin header

shared cabinet UI

UI boundaries
UI styles

pharmacy layout
pharmacy hooks lifecycle
pharmacy shared Cabinet regressions
```

Admin Shell не повинен ламати pharmacy, оскільки обидва application тепер споживають shared Cabinet layer.

---

# 68. TypeScript

Не використовувати:

```ts
any;
```

для navigation/breadcrumb composition.

Не дублювати shared navigation type у `apps/admin`.

Наприклад не потрібно:

```ts
type AdminNavigationItem = {
  ...
}
```

якщо структура вже визначена `@e-pharmacy/ui/cabinet`.

Admin створює **data**, а не другий shared type system.

---

# 69. Styling tests

Перевірити:

```text
desktop expanded sidebar
desktop collapsed sidebar
tablet
mobile
long labels
nested Settings
nested Reviews
user dropdown
breadcrumbs
```

Не повинно бути:

```text
horizontal overflow
clipped flyout
overlapping header controls
broken mobile drawer
text behind icons
layout shift after hydration
```

---

# 70. Manual verification — desktop

Руками перевірити:

```text
Admin login
→ dashboard route
→ shell

sidebar expand/collapse

Reviews expand/collapse

Settings expand/collapse

Fullscreen

User dropdown

Website

Logout

active state

breadcrumbs
```

---

# 71. Manual verification — mobile

Перевірити:

```text
burger opens menu
nested group opens
nested child accessible
child click closes drawer
Escape closes overlays
User menu works
no horizontal overflow
```

---

# 72. Manual verification — refresh/direct URL

Відкрити напряму nested route.

Очікування:

```text
AdminProtectedRoute
→ allows active admin
→ AdminShell renders
→ correct navigation parent active/open
→ correct breadcrumb
```

Не повинно бути залежності від того, чи користувач перед цим клікнув parent item.

---

# 73. Ніякого fake Dashboard у Shell

Stage 7 не повинен повертати рішення Stage 5 типу:

```text
temporary Dashboard
```

Shell просто обгортає:

```tsx
{
  children;
}
```

Контент `/admin/dashboard` реалізується у своєму feature stage.

Якщо Dashboard feature ще не готовий, Stage 7 не вигадує статистику чи mock cards.

---

# 74. Ніяких business fetches

Не додаємо в `AdminShell`:

```ts
getDashboard();
getOrders();
getPharmacies();
getReviews();
getEmployees();
```

Інакше кожна admin page почне платити за unrelated requests.

Shell має залишатися shell.

---

# 75. Ніяких permissions fetches «про запас»

Stage 7 також не повинен робити:

```text
GET /admin/permissions
GET /admin/roles
GET /admin/positions
```

якщо система співробітників ще не реалізована.

Коли вона з'явиться, буде окремий canonical context/contract.

---

# 76. Error handling Header actions

Website URL unavailable:

```text
action не повинна вести на unsafe/fake URL
```

Logout failure:

```text
controlled error handling
session state remains authoritative
```

Не показувати raw backend technical messages.

---

# 77. Empty user image

UserBadge має коректно працювати без photo.

Fallback:

```text
initials / existing shared fallback
```

Не додаємо admin-specific image placeholder, якщо `UserBadge` уже має canonical fallback.

---

# 78. No duplicated outside-click logic

Після Stage 6 `UserDropdown` сам володіє:

```text
outside pointer
Escape
open/close
```

Тому в `AdminHeader` не повинні з'явитися:

```ts
useOutsidePointerDown(...)
document.addEventListener('mousedown', ...)
document.addEventListener('keydown', ...)
```

для тієї самої dropdown interaction.

---

# 79. No duplicated fullscreen logic

Так само `AdminHeader` не повинен містити:

```text
requestFullscreen
exitFullscreen
fullscreenchange
```

Це shared `FullscreenButton`.

---

# 80. No duplicated nested navigation state

`AdminSidebar` не повинен створювати власні:

```text
openReviews
openSettings
```

якщо shared Cabinet navigation уже вирішує цей interaction.

Admin передає:

```text
navigation model
pathname
```

Shared UI визначає presentation state.

---

# 81. Definition of Done

Stage 7 завершений, коли:

- [ ] існує `AdminShell`;
- [ ] існує `AdminHeader`;
- [ ] існує `AdminSidebar`;
- [ ] існує `AdminMobileMenu`;
- [ ] private admin layout використовує `AdminShell`;
- [ ] Stage 4 `AdminProtectedRoute` залишається canonical auth boundary;
- [ ] `AdminHeader` використовує shared `CabinetTopBar`;
- [ ] `AdminHeader` використовує shared `FullscreenButton`;
- [ ] `AdminHeader` використовує shared `UserDropdown`;
- [ ] admin identity береться з canonical auth/session state;
- [ ] Header не робить duplicate profile request;
- [ ] logout залишається application controller;
- [ ] Website використовує canonical client-app URL logic;
- [ ] breadcrumbs мають окремий admin resolver;
- [ ] breadcrumbs будуються від pathname/routes, а не display labels;
- [ ] існує canonical `ADMIN_NAVIGATION`;
- [ ] desktop і mobile використовують один navigation config;
- [ ] Dashboard є top-level item;
- [ ] Pharmacy Owners є top-level item;
- [ ] Pharmacies є top-level item;
- [ ] Products є top-level item;
- [ ] Product Requests є top-level item;
- [ ] Clients є top-level item;
- [ ] Orders є top-level item;
- [ ] Reviews є nested group;
- [ ] Reviews містить Pharmacy reviews;
- [ ] Reviews містить Product reviews;
- [ ] Settings є nested group;
- [ ] Settings містить Employees;
- [ ] Settings містить Site pages;
- [ ] Settings містить Product categories;
- [ ] немає navigation section `Roles`;
- [ ] Employee залишається майбутньою основною entity;
- [ ] Position не реалізується передчасно;
- [ ] permissions system не вигадується у Stage 7;
- [ ] shared UI не містить admin-specific permissions;
- [ ] nested navigation працює desktop expanded;
- [ ] nested navigation працює desktop collapsed;
- [ ] nested navigation працює mobile;
- [ ] active child активує parent;
- [ ] active group auto-opens;
- [ ] mobile menu закривається після navigation;
- [ ] application shell не робить business fetches;
- [ ] немає mock counters;
- [ ] немає placeholder business pages;
- [ ] немає копій Pharmacy components;
- [ ] немає duplicate fullscreen implementation;
- [ ] немає duplicate outside-click implementation;
- [ ] accessibility checks проходять;
- [ ] structural checks проходять;
- [ ] unit tests проходять;
- [ ] React tests проходять;
- [ ] integration tests проходять;
- [ ] Stage 1–6 regression checks проходять;
- [ ] `pnpm lint` проходить;
- [ ] `pnpm type-check` проходить;
- [ ] `pnpm test` проходить;
- [ ] `pnpm test:react` проходить;
- [ ] `pnpm test:integration` проходить;
- [ ] `pnpm build` проходить;
- [ ] `pnpm check:before-deploy` проходить.

---

# 82. Що має бути після Stage 7

Після цього admin application уже має повноцінний structural frame:

```text
Admin auth
      ↓
AdminProtectedRoute
      ↓
AdminShell
├── Header
├── Sidebar
├── MobileMenu
└── content
```

І наступні feature stages просто додають:

```text
pages
feature components
API/BFF integration
business state
```

не перебудовуючи application frame щоразу.

---

# 83. Архітектура після Stage 7

Після цього повинна бути чітка симетрія:

```text
                Shared Cabinet UI
                 ↑             ↑
                 │             │
          Pharmacy App      Admin App
              │                │
      pharmacy config      admin config
      pharmacy routes      admin routes
      pharmacy crumbs      admin crumbs
      pharmacy auth        admin auth
```

Shared:

```text
як це виглядає і поводиться
```

Application:

```text
що саме показуємо і куди воно веде
```

---

# 84. Рішення щодо Employees / Positions

На цьому етапі остаточно фіксуємо terminology:

```text
Employee
= конкретна людина / обліковий запис співробітника

Position
= посада співробітника

Permissions
= конкретні доступи

Position permissions
= майбутній preset доступів
```

Наприклад:

```text
Employee:
Іванов Іван

Position:
Бухгалтер

Permissions:
✓ orders
✓ finance
✓ statistics
✗ review moderation
✗ site content
```

У майбутньому в Settings можна буде окремо додати керування посадами:

```text
Positions
→ create
→ edit
→ configure default permissions
```

Але це **не Stage 7** і зараз жодних тимчасових `Position`/`Role` screens не створюємо.

Це дозволяє вже зараз правильно назвати розділ:

```text
Employees
```

а не:

```text
Roles
```

і при цьому не зачиняє двері для нормальної permission architecture пізніше.

---

## Коміт для Stage 7

Коли будемо реалізовувати саме цей етап, я б використала:

```text
feat(admin): add shared-based application shell
```

Тут я ще трохи жорсткіше відділила **auth role `admin`** від майбутньої **посади співробітника**. Це важливо: `admin` — технічна роль доступу до застосунку, а `Бухгалтер`/`Support`/`Content manager` — уже бізнесова характеристика конкретного Employee з набором дозволів. Інакше через кілька етапів `role` почне означати три різні речі одночасно, а TypeScript тихенько сяде в куточку й заплаче 😄

//==================================================================

Готово 🙂 Stage 7 реалізований поверх твого `e-pharmacy-7.zip` і **без заходу в Stage 8+**.

### 📦 Архів Stage 7

[Завантажити архів з оновленими/доданими файлами Stage 7](sandbox:/mnt/data/e-pharmacy-stage-7-admin-shell.zip)

В архіві **22 файли** — лише ті, що додані або змінені для цього етапу.

Реалізовано:

- `AdminShell`;
- `AdminHeader`;
- `AdminSidebar`;
- `AdminMobileMenu`;
- інтеграцію `AdminProtectedRoute → AdminShell`;
- canonical `ADMIN_NAVIGATION`;
- canonical admin routes для майбутніх розділів;
- breadcrumbs від `pathname`;
- shared `CabinetTopBar`;
- shared `CabinetSidebar`;
- shared `SideMenu`;
- shared `FullscreenButton`;
- shared `UserDropdown`;
- shared `UserBadge`;
- desktop collapsed sidebar;
- nested `Reviews`:
  - `Pharmacy reviews`;
  - `Product reviews`;

- nested `Settings`:
  - `Employees`;
  - `Site pages`;
  - `Product categories`;

- admin-specific logout controller із single-flight protection;
- перехід на client website через уже наявний canonical URL config;
- mobile drawer із тим самим `ADMIN_NAVIGATION`;
- автоматичне закриття mobile menu після route change;
- `check:admin-shell`;
- адаптацію старого `check:admin-protected-route` під нову правильну композицію;
- підтримку `@/` alias для `apps/admin` у TypeScript test resolver.

При цьому **не додавала**:

```text
Dashboard page
Profile page
Pharmacies pages
Products pages
Orders pages
Reviews pages
Employees CRUD
Positions
Permissions
Site Pages CRUD
Categories CRUD
mock counters
Coming soon / placeholder pages
```

Тобто destinations уже зафіксовані для shell/navigation, але бізнесові сторінки залишаються своїм наступним етапам.

Також пункт `Profile` у dropdown зараз не створювала навмисно: profile page ще не існує, а Stage 7 прямо забороняє робити для неї тимчасову сторінку або битий placeholder-link.

### Перевірки

На фінальній версії пройшли:

- Admin TypeScript — ✅
- Admin unit tests — **16/16**
- Admin React/contract tests — **4/4**
- усі admin structural checks Stage 1–7 — ✅
- `check:shared-cabinet-ui` — ✅
- `check:pharmacy-layout` — ✅
- `check:client-admin-header` — ✅
- окремо перевірила накладання готового ZIP на чистий `e-pharmacy-7.zip` — результат відповідає фінальній версії.

Повний Next build у моєму архівному середовищі знову не стартує через неповний dependency tree — відсутній `@swc/helpers`, тобто той самий технічний ліміт розпакованого архіву. Сам Stage 7 до цього місця перевірений.

### Коміт

```text
feat(admin): add shared-based application shell
```

Після розпакування додатково нічого видаляти не потрібно — цього разу ZIP можна просто накласти на поточний проєкт і запускати:

```bash
pnpm check:before-deploy
```

Тепер адмінка вже має справжній «скелет», і, на щастя, не той, що ховають у шафі 😄
