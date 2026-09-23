Так, тут Stage 6 варто зробити окремим підготовчим shared-етапом, щоб у Stage 7 Admin Header і Admin Navigation вже складалися з готових універсальних блоків, а не копіювали pharmacy-код. Нижче — варіант у тому самому форматі й рівні деталізації, що попередні етапи.

# 10. ЕТАП 6 — Shared Cabinet UI перед Admin Header

## 1. Мета етапу

Перед реалізацією `AdminHeader` і повноцінної admin navigation потрібно доробити існуючий shared Cabinet UI.

На цьому етапі **не створюємо Admin Header і не збираємо Admin Shell**.

Завдання Stage 6 — підготувати універсальні компоненти, які однаково зможуть використовувати:

```text
apps/pharmacy
apps/admin
```

Після цього:

- `PharmacyHeader` перестає містити власну реалізацію fullscreen button;
- user dropdown перестає бути pharmacy-specific layout;
- shared Cabinet navigation починає підтримувати вкладені пункти;
- pharmacy продовжує працювати з плоским меню без UX-регресій;
- admin у наступному етапі зможе використати ті самі primitives без копіювання `PharmacyHeader.tsx`.

Головний принцип:

```text
Stage 6 = shared Cabinet primitives
Stage 7+ = конкретний Admin Header / Admin Shell
```

Тобто зараз створюємо **архітектурну основу**, але не майбутній admin UI наперед.

---

# 2. Що вже є і що треба зберегти

У проєкті вже є shared Cabinet UI, який використовується pharmacy application.

Не потрібно створювати другий паралельний набір компонентів типу:

```text
AdminFullscreenButton
AdminUserDropdown
AdminNavigationItem
AdminSideMenu
```

Так само не потрібно переносити pharmacy-specific business logic у `@e-pharmacy/ui`.

Shared layer має знати лише про:

- presentation;
- interaction;
- accessibility;
- generic navigation structure;
- callbacks;
- links;
- icons;
- active state.

Shared layer **не повинен знати** про:

```text
pharmacy
admin
profile API
auth API
logout API
pharmacy slug/id
moderation
permissions
```

Це залишаються responsibilities конкретних applications.

---

# 3. Scope Stage 6

У Stage 6 входять три основні частини:

```text
1. FullscreenButton
2. Configurable UserDropdown
3. Nested Cabinet Navigation
```

Також входять:

- адаптація існуючого `PharmacyHeader` до нових shared primitives;
- regression checks для pharmacy;
- accessibility contracts;
- structural checks shared Cabinet UI;
- unit/React tests для нової поведінки.

---

# 4. FullscreenButton

## 4.1. Поточна проблема

Зараз fullscreen button реалізований безпосередньо всередині:

```text
PharmacyHeader
```

Але fullscreen — це не pharmacy feature.

Це generic Cabinet UI behavior, який однаково потрібен:

```text
PharmacyHeader
AdminHeader
```

Тому копіювати реалізацію в майбутній `AdminHeader` не потрібно.

---

# 4.2. Що зробити

Винести fullscreen control у shared Cabinet UI.

Наприклад:

```text
@e-pharmacy/ui/cabinet/FullscreenButton
```

або у відповідне місце існуючого cabinet entrypoint, якщо структура package вже організована інакше.

Важливо:

не створювати новий паралельний entrypoint, якщо:

```text
@e-pharmacy/ui/cabinet
```

уже є canonical public API для Cabinet UI.

---

# 4.3. Відповідальність FullscreenButton

Компонент відповідає тільки за fullscreen interaction:

```text
enter fullscreen
exit fullscreen
fullscreen state
fullscreenchange synchronization
```

Він не повинен залежати від:

```text
pharmacy
admin
auth
router
profile
application-specific state
```

---

# 4.4. Очікувана поведінка

Кнопка повинна:

- визначати поточний fullscreen state;
- входити у fullscreen;
- виходити з fullscreen;
- реагувати на `fullscreenchange`;
- правильно оновлювати icon/label після зміни state;
- коректно поводитися, якщо fullscreen був закритий не самою кнопкою;
- не залишати event listeners після unmount.

Якщо fullscreen API недоступний у середовищі, UI не повинен падати.

Не створювати fake fullscreen через CSS.

---

# 4.5. Accessibility

Кнопка повинна залишатися звичайним accessible button.

Потрібен динамічний accessible label, наприклад:

```text
Enter fullscreen
Exit fullscreen
```

Не покладатися тільки на icon.

Keyboard activation:

```text
Enter
Space
```

має працювати нативно через `<button>`.

---

# 4.6. Pharmacy migration

Після створення shared component:

```text
PharmacyHeader
```

повинен використовувати:

```text
FullscreenButton
```

замість локальної fullscreen implementation.

Після refactor:

- visual appearance pharmacy header не змінюється;
- breakpoint behavior не змінюється;
- fullscreen UX не змінюється;
- pharmacy-specific CSS не дублює внутрішню логіку shared button.

---

# 5. Shared configurable UserDropdown

## 5.1. Поточна проблема

Pharmacy header уже має user dropdown із приблизно такою структурою:

```text
Go to profile
Go to the website
Go to my pharmacy
Log out
```

Для admin потрібна майже така сама interaction model:

```text
Go to profile
Go to the website
Log out
```

Різниця тут не в dropdown component.

Різниця лише у **конфігурації actions**.

Тому копіювати весь pharmacy dropdown для admin не потрібно.

---

# 5.2. Цільова архітектура

Shared UI відповідає за:

```text
trigger
dropdown layout
item rendering
open/close state
outside click
Escape
focus behavior
accessibility
disabled state
```

Application відповідає за:

```text
які items показати
які href використовувати
що робить logout
які application-specific actions доступні
```

---

# 5.3. Configurable items

Dropdown повинен приймати configuration.

Наприклад концептуально:

```ts
type UserDropdownItem =
  | {
      type: 'link';
      label: string;
      href: string;
      icon?: ReactNode;
      external?: boolean;
    }
  | {
      type: 'action';
      label: string;
      onSelect: () => void | Promise<void>;
      icon?: ReactNode;
      disabled?: boolean;
      destructive?: boolean;
    };
```

Точний API можна адаптувати до існуючих conventions `@e-pharmacy/ui`.

Не потрібно вводити складну abstraction hierarchy, якщо достатньо простого discriminated union.

---

# 5.4. Pharmacy configuration

Pharmacy формує свою конфігурацію на рівні `apps/pharmacy`.

Наприклад:

```text
Profile
Website
Public pharmacy
Logout
```

Тут саме pharmacy application визначає:

- profile URL;
- client website URL;
- public pharmacy URL;
- logout callback.

Shared component не повинен сам будувати ці URL.

---

# 5.5. Майбутня Admin configuration

Shared component уже повинен дозволяти configuration:

```text
Profile
Website
Logout
```

але **на Stage 6 не потрібно створювати AdminHeader тільки для того, щоб перевірити цей сценарій**.

Admin-specific wiring відбудеться в наступному відповідному етапі.

У Stage 6 достатньо, щоб public contract компонента дозволяв такий набір items без pharmacy-specific assumptions.

---

# 5.6. Dropdown interaction

Поведінка має бути однакова для pharmacy та майбутнього admin:

### Open

Клік на trigger:

```text
closed → open
```

### Toggle

Повторний клік:

```text
open → closed
```

### Outside click

Клік поза dropdown:

```text
open → closed
```

### Escape

```text
Escape → close
```

### Selection

Після вибору item dropdown закривається.

### Route change

Якщо існуюча Cabinet architecture вже закриває overlays/navigation після route change, новий shared dropdown не повинен ламати цей lifecycle.

---

# 5.7. Accessibility

Dropdown trigger повинен мати відповідні attributes.

Наприклад:

```text
aria-expanded
aria-controls
```

Якщо поточна семантика компонента передбачає popup:

```text
aria-haspopup
```

Також потрібно забезпечити:

- зрозумілий accessible name trigger;
- keyboard activation;
- `Escape`;
- visible focus;
- відсутність focus trap там, де він не потрібен;
- відсутність nested interactive controls;
- коректний `<a>` для navigation;
- коректний `<button>` для action.

Не перетворювати звичайну navigation list на ARIA `menu/menuitem`, якщо компонент фактично не реалізує повний ARIA menu pattern.

Нативні link/button semantics тут безпечніші.

---

# 5.8. Logout

Shared dropdown не виконує logout самостійно.

Він отримує callback:

```ts
onSelect;
```

або application-level logout item.

Тобто:

```text
@e-pharmacy/ui
```

не імпортує:

```text
auth hooks
auth API
router
pharmacy store
admin store
```

---

# 6. Nested Cabinet Navigation

## 6.1. Чому зміна потрібна вже зараз

Поточний shared `NavigationItem` орієнтований на flat navigation.

У ньому є приблизно:

```ts
label;
href;
icon;
exact;
disabled;
```

Для pharmacy цього достатньо.

Для admin — ні.

Admin navigation матиме щонайменше такі groups:

```text
Reviews
  Pharmacy reviews
  Product reviews

Settings
  Employees
  Site pages
  Product categories
```

Тому support nested navigation потрібно зробити **до реалізації Admin Sidebar**, а не всередині admin application.

---

# 6.2. Розширення NavigationItem

Shared navigation model потрібно розширити підтримкою children.

Концептуально:

```ts
type NavigationItem = {
  label: string;
  href?: string;
  icon: ...;
  exact?: boolean;
  disabled?: boolean;
  children?: NavigationItem[];
};
```

Але потрібно зберегти нормальний type contract.

Не повинно виникнути ambiguous item, де незрозуміло:

```text
чи це direct link
чи це expandable group
```

Якщо поточна typing architecture дозволяє — краще розрізнити:

```text
NavigationLinkItem
NavigationGroupItem
```

через discriminated union або еквівалентний type-safe contract.

Наприклад концептуально:

```ts
type NavigationLinkItem = {
  type: 'link';
  label: string;
  href: string;
  icon: ...;
  exact?: boolean;
  disabled?: boolean;
};

type NavigationGroupItem = {
  type: 'group';
  label: string;
  icon: ...;
  children: NavigationLinkItem[];
  disabled?: boolean;
};
```

Це краще за contract, де одночасно optional:

```ts
href?: string;
children?: NavigationItem[];
```

і компоненту доводиться здогадуватися, що саме передали.

Не потрібно при цьому будувати recursive navigation будь-якої глибини.

Для поточного product scope достатньо:

```text
parent
  child
```

тобто **один рівень вкладеності**.

Не закладати третій/четвертий рівень «про всяк випадок».

---

# 7. Active route contract

Nested navigation повинна правильно визначати active state.

## Flat item

Поточна поведінка зберігається.

Наприклад:

```text
/dashboard
/orders
/clients
```

## Child item

Якщо active route відповідає child:

```text
/admin/reviews/pharmacies
```

активним є відповідний child.

## Parent group

Якщо active будь-який child:

```text
Reviews
```

теж отримує active-parent state.

Тобто:

```text
active child
→ active parent
```

---

# 8. Automatic opening active group

Якщо користувач відкрив route напряму:

```text
/admin/reviews/products
```

navigation не повинна стартувати так:

```text
Reviews >
```

із прихованим active child.

Група active route повинна автоматично відкриватися:

```text
Reviews v
  Pharmacy reviews
  Product reviews  ← active
```

Це повинно працювати:

- після direct page load;
- після refresh;
- після navigation;
- при browser back/forward.

Не покладатися лише на локальний state, встановлений click'ом користувача.

Active route є source of truth.

---

# 9. Expand / collapse behavior

Для navigation group потрібен окремий trigger.

Він повинен:

```text
collapsed → expanded
expanded → collapsed
```

Має бути chevron/icon, який відображає state.

Trigger повинен мати:

```text
aria-expanded
aria-controls
```

Не потрібно робити parent fake-link на `#`.

Якщо parent не має власної сторінки, він має бути:

```html
<button></button>
```

а не:

```html
<a href="#"></a>
```

---

# 10. Manual state vs active-route state

Потрібно уникнути конфлікту між:

```text
automatic opening active group
manual expand/collapse
```

Базова логіка:

- active group при route resolution відкритий;
- користувач може відкривати інші groups;
- route navigation до child автоматично відкриває відповідний parent;
- navigation state не повинен «залипати» на group, який більше не стосується active route.

Не потрібно додавати persistence в:

```text
localStorage
cookies
backend
```

На Stage 6 це зайве.

---

# 11. Expanded desktop sidebar

Для звичайного desktop sidebar:

```text
[icon] Reviews       [chevron]
       Pharmacy reviews
       Product reviews
```

Children відображаються під parent.

Потрібно передбачити:

- child indentation;
- active child;
- active parent;
- hover;
- focus-visible;
- disabled;
- smooth layout без стрибків;
- достатню click/tap area.

Animation може використовувати поточні UI conventions проєкту.

Не додавати важку animation library лише заради nested navigation.

---

# 12. Collapsed desktop sidebar

Це окремий важливий сценарій.

Коли desktop sidebar знаходиться в collapsed state, child labels не можна просто намалювати всередині вузької sidebar.

Також не можна робити nested navigation недоступною.

Для navigation group у collapsed desktop mode потрібно забезпечити окрему interaction.

Рекомендована поведінка:

```text
collapsed sidebar
→ click/focus group icon
→ відкривається компактний anchored submenu біля sidebar
→ child links доступні
```

Наприклад:

```text
[Reviews icon] → | Pharmacy reviews
                 | Product reviews
```

При цьому:

- parent icon має active state, якщо active child;
- trigger має accessible name;
- submenu не обрізається `overflow`;
- `Escape` закриває submenu;
- outside click закриває submenu;
- вибір child закриває submenu;
- child navigation залишається keyboard accessible.

Не потрібно автоматично розгортати весь sidebar лише тому, що користувач хоче перейти до child route.

І не потрібно приховувати children у collapsed mode.

---

# 13. Mobile navigation

Та сама navigation configuration повинна працювати і в mobile menu.

Не створювати окремий:

```text
AdminMobileNavigationConfig
```

лише через nested items.

Для mobile:

```text
Reviews
  Pharmacy reviews
  Product reviews
```

працює як звичайна expandable section.

Потрібно:

- expand/collapse;
- chevron;
- `aria-expanded`;
- active parent;
- active child;
- auto-open active group;
- закриття mobile navigation після переходу за child link.

При expand/collapse group сам mobile drawer не закривається.

При navigation:

```text
click child
→ route change
→ mobile menu closes
```

---

# 14. Shared configuration для desktop і mobile

Desktop sidebar і mobile navigation повинні отримувати **одну navigation model**, а не дві окремі структури, які потім розходяться.

Тобто application-level configuration концептуально одна:

```ts
const navigationItems = [...]
```

і використовується:

```text
desktop cabinet navigation
mobile cabinet navigation
```

Rendering може бути різним.

Data contract — один.

---

# 15. Pharmacy regression requirement

Pharmacy navigation зараз плоска.

Після додавання nested navigation вона повинна залишитися плоскою.

Не потрібно штучно додавати groups у pharmacy лише для перевірки нового API.

Поточні pharmacy items повинні працювати без зміни UX:

```text
Dashboard
Orders
Clients
Products
Statistics
...
```

тобто existing flat configuration повинна лишитися валідною.

Stage 6 не повинен вимагати переписати всю pharmacy navigation configuration, якщо для цього немає архітектурної потреби.

---

# 16. Не переносити application-specific navigation у shared UI

У `@e-pharmacy/ui` не повинно з'явитися:

```ts
const adminNavigation = [...]
```

або:

```ts
const pharmacyNavigation = [...]
```

Shared UI знає лише generic structure.

Конкретні items зберігаються у відповідній application:

```text
apps/pharmacy
apps/admin
```

Admin navigation буде сформована на відповідному наступному етапі.

---

# 17. Shared Cabinet public API

Нові primitives мають експортуватися через canonical public API package.

Наприклад:

```ts
import {
  FullscreenButton,
  UserDropdown,
  ...
} from '@e-pharmacy/ui/cabinet';
```

Не використовувати deep imports на кшталт:

```ts
@e-pharmacy/ui/src/components/cabinet/...
```

Також потрібно оновити package exports, якщо цього вимагає поточна структура package.

---

# 18. Орієнтовні файли Stage 6

Точні назви потрібно узгодити з уже існуючою структурою `packages/ui`, але зміни мають бути локалізовані приблизно тут:

```text
packages/ui/
  src/
    cabinet/
      FullscreenButton/
      UserDropdown/
      navigation/
      ...
```

або в існуючих canonical Cabinet directories.

Можуть бути змінені:

```text
CabinetSidebar
SideMenu
MobileNavigation
NavigationItem
CabinetTopBar
```

тільки якщо саме вони зараз володіють відповідною поведінкою.

Також буде змінено pharmacy composition:

```text
apps/pharmacy/.../PharmacyHeader.tsx
```

і, за потреби, його локальні styles/tests.

---

# 19. Що НЕ потрібно робити в Stage 6

На цьому етапі **не додаємо**:

```text
AdminHeader
AdminSidebar configuration
AdminShell
AdminDashboard UI
AdminProfile page
Admin User Dropdown wiring
Admin logout flow
Admin mobile menu composition
Admin Reviews pages
Admin Settings pages
Admin Employees page
Admin Site Pages page
Admin Product Categories page
permissions UI
notifications
support chat
```

Не потрібно також створювати placeholder routes тільки для перевірки nested navigation.

Не потрібно робити:

```text
/admin/reviews/pharmacies
/admin/reviews/products
/admin/settings/employees
...
```

як порожні сторінки.

Вони з'являться у своїх етапах.

---

# 20. Не створювати тимчасові abstractions

Не потрібно робити:

```text
TemporaryAdminNavigation
FutureAdminDropdown
AdminHeaderBase
PharmacyAdminHeader
UniversalEverythingHeader
```

Stage 6 має винести лише те, що **вже обґрунтовано двома Cabinet applications**:

```text
fullscreen
user dropdown presentation
nested navigation mechanics
```

Не більше.

---

# 21. Styling boundaries

Shared component styles повинні жити разом із shared component.

Application-specific layout styles залишаються у відповідній application.

Наприклад:

`FullscreenButton` може володіти:

```text
button dimensions
icon alignment
hover
focus-visible
disabled
```

але не повинен знати:

```text
точну ширину PharmacyHeader
позицію pharmacy logo
admin-specific spacing
```

`UserDropdown` може володіти:

```text
panel
items
hover
focus
separator
destructive state
```

але application вирішує, де саме trigger стоїть у header.

---

# 22. Responsive requirements

Перевірити щонайменше:

```text
mobile
tablet
desktop
collapsed desktop sidebar
expanded desktop sidebar
```

Особливо nested navigation.

Не повинно бути:

- horizontal overflow;
- обрізаного submenu;
- inaccessible children;
- chevron, що виїжджає за межі item;
- text overlap;
- active indicator, що зникає у collapsed mode.

---

# 23. Accessibility requirements

Stage 6 повинен окремо перевіряти:

## FullscreenButton

```text
button semantics
accessible label
focus-visible
state synchronization
```

## UserDropdown

```text
accessible trigger
aria-expanded
Escape
outside click
links/buttons semantics
focus visibility
```

## Navigation group

```text
button trigger
aria-expanded
aria-controls
keyboard operation
active-state semantics
visible focus
```

## Nested children

```text
real links
logical tab order
active indication not color-only
```

Не потрібно додавати ARIA roles лише «для більшої accessibility».

ARIA повинна відповідати реальній interaction model.

---

# 24. Keyboard scenarios

Обов'язково вручну перевірити:

### Dropdown

```text
Tab → trigger
Enter → open
Tab → items
Escape → close
```

### Expanded navigation

```text
Tab → parent trigger
Enter/Space → expand
Tab → child links
Enter → navigate
```

### Collapsed desktop

```text
Tab → group icon
Enter/Space → open child navigation
Tab → child links
Escape → close
```

### Mobile

```text
open mobile menu
navigate to group
expand
navigate through children
select child
mobile menu closes
```

---

# 25. Structural checks

Для Stage 6 варто додати окремий checker, наприклад:

```text
check:shared-cabinet-ui
```

або розширити вже існуючий canonical shared UI checker, якщо він логічно відповідає за ці contracts.

Не потрібно створювати десяток мікро-check scripts.

Checker має гарантувати ключові architecture contracts.

Наприклад:

### Fullscreen

- `PharmacyHeader` не містить власну fullscreen implementation;
- shared `FullscreenButton` експортується через public API.

### User dropdown

- shared dropdown не імпортує application-specific modules;
- pharmacy використовує shared dropdown;
- logout залишається callback/application concern.

### Navigation

- navigation contract підтримує group/children;
- nested navigation має `aria-expanded`;
- active child підтримує active parent;
- mobile та desktop використовують shared navigation model;
- pharmacy flat navigation залишається supported.

---

# 26. Existing checks не послаблювати

Як показав Stage 5, новий refactor не повинен ламати старі structural contracts лише через переміщення коду.

Тому перед завершенням Stage 6 потрібно прогнати не лише новий checker, а й existing checks для:

```text
@e-pharmacy/ui
pharmacy components
pharmacy layout
pharmacy navigation
accessibility
styles
public API
boundaries
unused exports
```

Якщо старий checker описує валідний architecture contract, його не потрібно просто видаляти або послаблювати, щоб нова реалізація стала зеленою.

Якщо implementation переноситься — contract треба зберегти або коректно оновити разом із architecture.

---

# 27. Unit tests

Потрібні unit tests для pure/helper logic, якщо така з'явиться.

Наприклад:

```text
route → active child
route → active parent
active child → auto-open group
exact/non-exact route matching
```

Не потрібно тестувати React markup через unit test, якщо це краще перевіряється React tests.

---

# 28. React tests

Потрібно покрити щонайменше:

## FullscreenButton

```text
renders correct initial state
calls requestFullscreen
calls exitFullscreen
reacts to fullscreenchange
cleans up listeners
```

## UserDropdown

```text
opens
closes on second click
closes on Escape
closes on outside click
renders link item
renders action item
calls action
supports destructive/disabled state if contract has it
```

## Nested navigation

```text
flat item still renders
group renders
group expands/collapses
active child marks parent active
active group opens automatically
child navigation works
```

## Mobile

```text
nested group renders
child navigation closes mobile menu
expand itself does not close mobile menu
```

---

# 29. Regression matrix

Перед завершенням Stage 6 перевірити:

| Scenario                           | Expected                     |
| ---------------------------------- | ---------------------------- |
| Pharmacy desktop header            | без visual regression        |
| Pharmacy fullscreen                | працює як раніше             |
| Pharmacy user dropdown             | працює як раніше             |
| Pharmacy logout                    | працює як раніше             |
| Pharmacy profile link              | працює                       |
| Pharmacy website link              | працює                       |
| Pharmacy public pharmacy link      | працює                       |
| Pharmacy desktop sidebar expanded  | flat menu без змін           |
| Pharmacy desktop sidebar collapsed | flat menu без змін           |
| Pharmacy mobile navigation         | flat menu без змін           |
| Shared nested group                | expand/collapse              |
| Nested active child                | child + parent active        |
| Direct child route                 | group auto-open              |
| Collapsed nested group             | children доступні            |
| Mobile nested group                | children доступні            |
| Escape                             | закриває відповідний overlay |
| Keyboard navigation                | повністю доступна            |

---

# 30. Manual verification

Окремо перевірити pharmacy application після refactor.

Не достатньо лише:

```text
pnpm type-check
```

Потрібно руками перевірити:

```text
header
fullscreen
dropdown
sidebar
collapsed sidebar
mobile menu
logout
navigation
responsive states
```

Stage 6 змінює shared interactive UI, тому visual/interaction regression тут важливіша, ніж у чисто type-level refactor.

---

# 31. TypeScript contracts

Не використовувати:

```ts
any;
```

для обходу nested navigation typing.

Не робити необмежене:

```ts
children?: NavigationItem[];
```

якщо фактичний product contract підтримує тільки один рівень.

Типи повинні відображати реальний UI contract.

Також не дублювати однакові navigation types окремо для:

```text
CabinetSidebar
SideMenu
MobileNavigation
```

Canonical type має бути один.

---

# 32. Public API compatibility

Оскільки `@e-pharmacy/ui` вже використовується pharmacy application, Stage 6 не повинен без потреби ламати existing imports.

Якщо можливий backward-compatible migration — використовувати його.

Якщо старий API потрібно змінити, треба одночасно оновити всі existing consumers у межах Stage 6.

Після завершення в repository не повинно залишитися:

```text
old dropdown implementation
old fullscreen implementation
unused old navigation type
dead exports
```

---

# 33. Dependency boundaries

`packages/ui` не імпортує нічого з:

```text
apps/admin
apps/pharmacy
apps/client
```

Так само shared Cabinet UI не має залежати від конкретного app router wrapper, якщо interaction можна передати через:

```text
href
callbacks
state
props
```

Application → shared package:

```text
allowed
```

Shared package → application:

```text
forbidden
```

---

# 34. Error handling

Shared interactive UI не повинен падати через browser API edge cases.

Для fullscreen:

- unsupported browser API;
- rejected `requestFullscreen()`;
- state changed externally.

Для dropdown/navigation:

- missing optional icon;
- disabled item;
- route changes while overlay open.

Не потрібно показувати global error page через невдалу спробу fullscreen.

---

# 35. Performance

Stage 6 не потребує нових network requests.

Після refactor:

```text
FullscreenButton → 0 requests
UserDropdown → 0 own requests
Nested navigation → 0 requests
```

Shared dropdown не повинен сам завантажувати profile.

Navigation не повинна fetch'ити children.

Усе необхідне передається application composition layer.

---

# 36. Що повинно бути результатом Stage 6

Після завершення етапу архітектура має виглядати приблизно так:

```text
@e-pharmacy/ui/cabinet
│
├── FullscreenButton
│
├── UserDropdown
│
├── CabinetSidebar
│   └── nested navigation support
│
├── SideMenu
│   └── nested navigation support
│
└── MobileNavigation
    └── nested navigation support
```

А pharmacy:

```text
PharmacyHeader
│
├── shared FullscreenButton
├── shared UserDropdown
└── pharmacy-specific configuration/callbacks
```

Pharmacy navigation:

```text
pharmacy navigation config
        ↓
shared Cabinet navigation
        ↓
flat menu
```

Майбутній admin:

```text
admin navigation config
        ↓
shared Cabinet navigation
        ↓
flat + nested groups
```

Але сам цей admin composition у Stage 6 ще не реалізується.

---

# 37. Definition of Done

Stage 6 вважається завершеним, коли:

- [ ] fullscreen logic винесена з `PharmacyHeader`;
- [ ] є shared `FullscreenButton`;
- [ ] `PharmacyHeader` використовує shared `FullscreenButton`;
- [ ] є shared/configurable `UserDropdown`;
- [ ] pharmacy dropdown використовує shared component;
- [ ] shared dropdown не містить pharmacy/admin business logic;
- [ ] pharmacy-specific items передаються configuration;
- [ ] logout передається callback;
- [ ] navigation model підтримує один рівень children;
- [ ] flat navigation залишається supported;
- [ ] є expand/collapse navigation group;
- [ ] є chevron/state indicator;
- [ ] є `aria-expanded`;
- [ ] active child робить parent active;
- [ ] active group автоматично відкривається;
- [ ] nested navigation працює в expanded desktop sidebar;
- [ ] nested navigation доступна в collapsed desktop sidebar;
- [ ] nested navigation працює у mobile menu;
- [ ] mobile menu закривається після child navigation;
- [ ] desktop/mobile використовують один navigation data contract;
- [ ] pharmacy navigation не отримала UX regression;
- [ ] shared UI не імпортує application-specific modules;
- [ ] public exports оновлені;
- [ ] dead old implementation видалена;
- [ ] accessibility scenarios пройдені;
- [ ] keyboard scenarios пройдені;
- [ ] responsive scenarios пройдені;
- [ ] unit/React tests пройдені;
- [ ] structural checks пройдені;
- [ ] existing pharmacy/shared UI checks пройдені;
- [ ] `pnpm lint` проходить;
- [ ] `pnpm type-check` проходить;
- [ ] `pnpm test` проходить;
- [ ] `pnpm test:react` проходить;
- [ ] `pnpm test:integration` проходить;
- [ ] `pnpm build` проходить;
- [ ] `pnpm check:before-deploy` проходить.

---

# 38. Що буде після Stage 6

Після цього shared Cabinet UI готовий до використання admin application.

Наступний етап уже може збирати конкретний:

```text
Admin Header
```

із:

```text
shared FullscreenButton
shared UserDropdown
shared UserBadge / cabinet primitives
admin-specific configuration
```

а наступні navigation/shell етапи зможуть використати:

```text
shared nested navigation
```

для:

```text
Reviews
  Pharmacy reviews
  Product reviews

Settings
  Employees
  Site pages
  Product categories
```

без копіювання pharmacy sidebar/mobile navigation.

---

# 39. Головний architectural verdict Stage 6

На цьому етапі не потрібно «переробляти pharmacy під admin».

Потрібно знайти три речі, які насправді вже є generic Cabinet concerns:

```text
fullscreen
user dropdown interaction
navigation hierarchy
```

і зробити їх shared.

Тоді:

```text
Pharmacy
  → configuration + business callbacks
         ↓
Shared Cabinet UI
         ↑
Admin
  → configuration + business callbacks
```

Тобто shared package володіє **interaction mechanics**, а applications володіють **meaning and business behavior**.

Саме така межа дозволить далі будувати admin без копіювання `PharmacyHeader` і водночас не перетворювати `@e-pharmacy/ui` на application layer.

Для цього етапу я б заклала коміт:

refactor(ui): prepare shared cabinet UI for admin

Ключова відмінність від початкового короткого плану: я б не робила безмежний recursive children?: NavigationItem[]. Для поточної адмінки реально потрібен лише один рівень parent → child, тому type contract краще зробити явним і не вирощувати маленький файловий провідник усередині sidebar 😄 Це також значно полегшить accessibility, collapsed mode і тести.

//==========================================================

Готово 🙂 Stage 6 реалізований поверх наданого e-pharmacy-6.zip без змін із Stage 7+.

📦 Архів Stage 6

Завантажити архів з оновленими/доданими файлами Stage 6

В архіві 26 оновлених/доданих файлів. Після накладання на твій поточний проєкт будуть готові етапи 1–6.

Реалізовано:

shared FullscreenButton;
shared configurable UserDropdown;
PharmacyHeader переведений на ці shared-компоненти;
one-level nested navigation group → child;
active parent при active child;
автоматичне відкриття active group;
expand/collapse + chevron + aria-expanded / aria-controls;
nested navigation для expanded desktop sidebar;
flyout submenu для collapsed desktop sidebar;
nested navigation для mobile;
одна navigation model для desktop/mobile;
flat pharmacy navigation залишилась сумісною;
доданий check:shared-cabinet-ui;
Stage 7 AdminHeader, admin navigation config, admin sidebar тощо не створювалися.
⚠️ Після розпакування треба видалити 2 старі файли

ZIP при накладанні не може фізично видалити файли, а ця стара pharmacy-local реалізація fullscreen після Stage 6 більше не потрібна:

apps/pharmacy/src/lib/layout/fullscreen.ts
apps/pharmacy/src/lib/layout/fullscreen.test.ts

У Git Bash можна одразу:

rm apps/pharmacy/src/lib/layout/fullscreen.ts \
 apps/pharmacy/src/lib/layout/fullscreen.test.ts

Це частина Stage 6, а не додаткова необов'язкова чистка.

Перевірки

На фінальній версії пройшли:

TypeScript — packages/ui, apps/pharmacy, apps/client, apps/admin;
check:shared-cabinet-ui;
UI boundaries;
UI styles;
pharmacy lib;
pharmacy layout;
Stage 5 client-admin-header;
admin checks етапів 1–4;
UI unit/contract tests — 40/40;
pharmacy layout regression tests — 24/24;
перевірка самого update-архіву після накладання на чистий e-pharmacy-6.zip.

Повний pnpm check:before-deploy у моєму розпакованому середовищі не запускала до кінця через неповний dependency tree із переданого архіву, але доступні TypeScript, structural та regression checks пройшли.

Коміт
refactor(ui): prepare shared cabinet UI for admin

Тобто після розпакування архіву + видалення двох старих fullscreen.\* файлів можна запускати у себе:

pnpm check:before-deploy

І Stage 6 можна відправляти на його улюблений екзамен 😄
