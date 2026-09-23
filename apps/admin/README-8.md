Так 🙂 Із Stage 8 я б уже зробила **справжній authorization foundation**, а не просто набір frontend-прапорців. Це саме той етап, який краще зробити зараз: інакше кожна наступна CRUD-сторінка почне винаходити свої `if (role === ...)`, а потім доведеться викорчовувати їх саперною лопаткою 😄

Твоє уточнення щодо **«Посад»** теж важливе: **посада не визначає permissions**. Вона лише показує, чим займається співробітник. Можна створити хоч `Бухгалтер`, хоч `Контент-менеджер`, хоч `Людина, яка рятує понеділки`, але фактичні доступи конкретного Employee налаштовуються незалежно.

Нижче готовий варіант `apps/admin/README-8.md`.

---

# 12. ЕТАП 8 — Admin Permissions + Platform Owner foundation

## 1. Мета етапу

До реалізації будь-яких admin CRUD pages потрібно створити єдину authorization model для Admin Cabinet.

Не можна будувати:

```text
Pharmacies CRUD
Products CRUD
Product Requests
Reviews
Employees
Site Pages
Categories
...
```

а вже потім намагатися додати permissions поверх готових сторінок.

Правильний порядок:

```text
Admin authentication
        ↓
Admin access
        ↓
Permissions
        ↓
Platform Owner
        ↓
navigation / UI capability filtering
        ↓
backend authorization
        ↓
CRUD features
```

Stage 8 створює саме цей foundation.

---

# 2. Головний принцип

`User.role` залишається **coarse-grained application role**.

Не створюємо:

```text
pharmacy_moderator
products_editor
reviews_moderator
support_admin
accountant
content_manager
super_admin
```

у `User.role`.

Canonical roles залишаються:

```text
client
pharmacy
admin
```

Тобто:

```text
role === admin
```

означає:

> цей account належить до Admin application.

А що саме цей admin може робити — визначається окремою authorization model.

---

# 3. Auth role ≠ permissions ≠ position

Ці три поняття повинні бути чітко розділені:

```text
Auth role
    admin

Position
    Бухгалтер

Permissions
    orders.view
    clients.view
    audit.view
```

Наприклад:

```text
Employee:
Іванов Іван

User.role:
admin

Position:
Бухгалтер

Permissions:
✓ orders.view
✓ clients.view
✓ audit.view
✗ products.edit
✗ reviews.moderate
```

---

# 4. Position не надає permissions

Це принципове правило Stage 8.

Не робимо:

```text
Position: Accountant
        ↓
automatic permissions
```

і не робимо:

```text
Position: Moderator
        ↓
review permissions
```

Посада — це опис того:

> чим займається конкретний співробітник.

Permissions — це:

> що конкретному співробітнику дозволено робити.

Ці дві системи незалежні.

---

# 5. Довільні Positions

У майбутньому Platform Owner зможе створювати довільну кількість посад.

Наприклад:

```text
Бухгалтер
Головний бухгалтер
Moderator
Content manager
Support
Administrator
SEO specialist
Customer support manager
```

Не створюємо hardcoded enum:

```ts
type Position = 'accountant' | 'moderator' | 'support';
```

`Position` буде окремою domain entity.

---

# 6. Settings navigation

До final Settings structure додаємо:

```text
Settings
├── Employees
├── Positions
├── Site pages
└── Product categories
```

Тобто після Stage 8 canonical navigation structure вже враховує:

```text
Positions
```

Не використовуємо для цього назву:

```text
Roles
```

---

# 7. Що НЕ робимо з Positions у Stage 8

Stage 8 не є CRUD stage для посад.

Тому зараз не потрібно створювати:

```text
Positions list page
Create Position modal
Edit Position
Delete Position
Position form
Position selector
```

Це буде реалізовано разом із відповідним Settings/Employees feature.

Stage 8 лише закладає правильний authorization/domain contract:

```text
Employee.positionId
```

у майбутньому може посилатися на arbitrary Position.

Але:

```text
Employee.positionId
```

ніколи не є джерелом permissions.

---

# 8. Admin Permission model

Permissions повинні бути granular.

Canonical resources приблизно такі:

```text
pharmacyOwners
pharmacies
products
productRequests
clients
orders
productReviews
pharmacyReviews
sitePages
categories
employees
positions
audit
```

---

# 9. Permission matrix

Базовий contract:

```text
pharmacyOwners
  view
  edit

pharmacies
  view
  edit
  moderate

products
  view
  create
  edit
  delete

productRequests
  view
  edit
  moderate

clients
  view

orders
  view

productReviews
  view
  moderate

pharmacyReviews
  view
  moderate

sitePages
  view
  edit
  publish

categories
  view
  create
  edit
  delete

employees
  view
  create
  edit
  managePermissions
  revokeAccess

positions
  view
  create
  edit
  delete

audit
  view
```

Це permission vocabulary, а не UI labels.

---

# 10. Не додавати permissions «про всяк випадок»

Не потрібно зараз створювати:

```text
orders.delete
orders.refund
clients.block
pharmacies.delete
products.publish
...
```

якщо відповідної операції ще немає у product requirements.

Permission registry має розширюватися разом із реальною business capability.

---

# 11. Canonical permission representation

Бажано мати один canonical registry.

Концептуально:

```ts
const ADMIN_PERMISSION_MATRIX = {
  pharmacies: ['view', 'edit', 'moderate'],
  products: ['view', 'create', 'edit', 'delete'],
  // ...
} as const;
```

І вже з нього отримувати canonical permission type.

Концептуально permission може виглядати:

```text
products.view
products.edit
employees.managePermissions
positions.create
```

---

# 12. Не використовувати magic strings по repository

Не повинно бути десятків:

```ts
permissions.includes('product-edit');
permissions.includes('edit_product');
permissions.includes('products:edit');
```

у різних місцях.

Має існувати один canonical format.

Наприклад:

```text
resource.action
```

---

# 13. Unknown permissions fail closed

Якщо backend/database отримав:

```text
products.destroyEverything
```

він не повинен:

```text
ignore
assume allowed
map to edit
```

Unknown permission:

```text
→ invalid
→ rejected
```

Authorization завжди fail-closed.

---

# 14. Permissions зберігаються явно

Для звичайного admin employee зберігаємо explicit permissions.

Наприклад:

```text
[
  "products.view",
  "products.edit",
  "productReviews.view"
]
```

Не потрібно зберігати:

```text
"*"
"*.*"
"admin.all"
```

Для unrestricted access є окрема концепція:

```text
Platform Owner
```

---

# 15. Platform Owner

Platform Owner — це:

```text
admin
+
isPlatformOwner === true
```

Це **не новий User.role**.

Не робимо:

```text
role = platform_owner
role = super_admin
role = root_admin
```

`User.role` залишається:

```text
admin
```

---

# 16. Platform Owner capabilities

Platform Owner має повний admin access.

Він може:

```text
керувати співробітниками
керувати permissions
керувати positions
переглядати employee documents
змінювати protected employee identity
надавати Platform Owner access іншому admin
забирати Platform Owner access
```

і має всі звичайні admin permissions.

---

# 17. Platform Owner bypass

Permission evaluator концептуально:

```ts
if (access.isPlatformOwner) {
  return true;
}

return access.permissions.has(permission);
```

Не потрібно фізично записувати Platform Owner сотні permission strings.

Owner access є окремою authoritative ознакою.

---

# 18. Platform Owner ≠ Position

Platform Owner може мати будь-яку Position.

Наприклад:

```text
isPlatformOwner:
true

Position:
CEO
```

або:

```text
isPlatformOwner:
true

Position:
Administrator
```

Це незалежні поля.

Так само:

```text
Position = Administrator
```

не робить employee Platform Owner.

---

# 19. Мінімальна access model

Не потрібно на Stage 8 передчасно будувати повний Employee profile/document model.

Authorization layer може мати окрему мінімальну сутність, концептуально:

```ts
AdminAccess {
  userId;
  status;
  isPlatformOwner;
  permissions;
  createdAt;
  updatedAt;
}
```

Де:

```text
status:
active
revoked
```

---

# 20. Чому access record окремий

Не потрібно засмічувати `User`:

```text
permissions
platformOwner
position
employeeDocuments
employeeSettings
```

`User` відповідає за account/auth identity.

Admin access layer відповідає за authorization.

Майбутня Employee entity відповідатиме за:

```text
employee-specific profile
position
documents
business identity
```

---

# 21. Employee ↔ AdminAccess

Концептуально:

```text
User
 └── auth identity

AdminEmployee
 └── business employee data
     └── positionId

AdminAccess
 └── authorization
     ├── isPlatformOwner
     ├── status
     └── permissions
```

Усі вони зв'язуються через canonical user/employee identifier.

Точна Mongo model structure має відповідати існуючій backend architecture.

---

# 22. Position не живе в AdminAccess

Не потрібно:

```ts
AdminAccess {
  position: 'accountant'
}
```

Position належить Employee domain.

Це важливо, щоб access layer не почав змішувати:

```text
професію
+
authorization
```

---

# 23. Admin access status

Потрібно окремо підтримати:

```text
active
revoked
```

`revoked` означає:

> account може існувати, але доступ до Admin Cabinet відкликаний.

Це не обов'язково те саме, що глобальний:

```text
User.status
```

---

# 24. Revoked access

Якщо:

```text
User.role === admin
User.status === active
AdminAccess.status === revoked
```

admin operations все одно заборонені.

Backend:

```text
→ 403
```

Frontend:

```text
→ access denied state
```

---

# 25. Відсутній AdminAccess

Якщо:

```text
User.role === admin
```

але canonical `AdminAccess` record відсутній:

```text
→ deny
```

Не:

```text
→ assume full admin
```

Не:

```text
→ give default permissions
```

Fail closed.

---

# 26. Backend є authoritative

Frontend permissions потрібні для UX.

Наприклад:

```text
employee does not have products.edit
→ Edit button hidden/disabled
```

Але це **не security**.

Навіть якщо користувач вручну виконає:

```text
PATCH /products/:id
```

backend повинен перевірити:

```text
products.edit
```

---

# 27. Backend guard

Має бути canonical authorization guard.

Концептуально:

```ts
requireAdminPermission('products', 'edit');
```

або еквівалентний API відповідно до backend architecture.

Не потрібно на кожному endpoint писати:

```ts
if (
  user.permissions.includes(...) ||
  user.isPlatformOwner
) {
  ...
}
```

---

# 28. Canonical authorization flow

Для protected admin operation:

```text
authenticate user
        ↓
require role === admin
        ↓
require active User
        ↓
load AdminAccess
        ↓
require access.status === active
        ↓
Platform Owner?
  yes → allow
  no
        ↓
required permission exists?
  yes → allow
  no  → 403
```

---

# 29. Один AdminAccess lookup на request

Не потрібно робити:

```text
guard A → DB request
guard B → DB request
guard C → DB request
```

для одного HTTP request.

Authorization context потрібно resolve один раз і передавати далі request-scoped.

Наприклад:

```text
req.adminAuthorization
```

або відповідний pattern існуючого backend.

---

# 30. Permissions не зберігати як authoritative JWT claims

Mutable permissions не потрібно робити authoritative частиною довгоживучого JWT.

Інакше:

```text
Owner забрав products.edit
```

але старий token ще годину дозволяє:

```text
products.edit
```

Backend повинен читати актуальний authorization state.

JWT може ідентифікувати user/role.

Permission database залишається authoritative.

---

# 31. Frontend access snapshot

Admin frontend має отримувати власний authorization state.

Наприклад canonical response:

```ts
{
  status: 'active',
  isPlatformOwner: false,
  permissions: [
    'products.view',
    'orders.view'
  ]
}
```

Не потрібно віддавати:

```text
employee documents
other employee permissions
private owner data
```

через self-access endpoint.

---

# 32. Same-origin BFF

Browser продовжує працювати через:

```text
/api/*
```

Не робимо direct browser → backend permission request.

Наприклад:

```text
GET /api/admin/access/me
```

через existing BFF architecture.

---

# 33. Private response caching

Admin access response:

```text
Cache-Control: no-store
```

Permissions — private mutable authorization data.

Не кешувати їх у CDN/public cache.

---

# 34. Runtime parser

Frontend/BFF не повинен довіряти response blindly.

Потрібен fail-closed parser.

Перевіряємо:

```text
known status
boolean isPlatformOwner
permissions is array
every permission is known
no malformed items
```

Malformed access response:

```text
→ error
```

Не:

```text
→ empty permissions
```

---

# 35. AdminAuthorizationProvider / equivalent

Після Stage 7 shell уже існує.

Stage 8 може додати одну canonical authorization layer для admin.

Концептуально:

```text
AdminProtectedRoute
        ↓
AdminAuthorizationGate
        ↓
AdminShell
```

`AdminProtectedRoute` продовжує відповідати за:

```text
authentication
role === admin
User.status
```

Authorization Gate:

```text
AdminAccess
permissions
Platform Owner
revoked access
```

---

# 36. Не змішувати ProtectedRoute і permissions

Не потрібно перетворювати:

```text
AdminProtectedRoute.tsx
```

на гігантський компонент, який знає:

```text
JWT
roles
permissions
navigation
employee positions
documents
CRUD access
```

Auth і authorization пов'язані, але мають окремі responsibilities.

---

# 37. Authorization loading state

Поки self-access request завантажується:

```text
loading
```

не показуємо повне меню на секунду.

Тобто не допускаємо:

```text
full admin navigation
↓
permissions load
↓
половина menu зникає
```

Це і UX-проблема, і capability leakage.

---

# 38. Authorization failure state

Якщо access request реально впав:

```text
network error
500
malformed response
```

не представляємо це як:

```text
permissions = []
```

Потрібен controlled error state + retry.

---

# 39. Revoked state

Якщо:

```text
AdminAccess.status === revoked
```

не показуємо fake empty dashboard.

Показуємо controlled access-denied presentation.

Не потрібно для цього створювати новий standalone route, якщо існуючий shared error UI підходить.

---

# 40. Frontend permission helper

Потрібен один canonical helper.

Наприклад:

```ts
canAdmin(authorization, 'products', 'edit');
```

або:

```ts
hasAdminPermission(authorization, ADMIN_PERMISSIONS.products.edit);
```

---

# 41. Platform Owner у frontend helper

Helper сам враховує owner bypass.

Не повинно бути:

```ts
if (isPlatformOwner || hasPermission(...))
```

по десятках components.

Це одна canonical function.

---

# 42. Frontend permissions — лише presentation

Frontend helper використовується для:

```text
navigation
buttons
actions
tabs
forms
```

але ніколи не вважається security boundary.

Backend повторно перевіряє permission.

---

# 43. Admin navigation filtering

Stage 7 має canonical:

```text
ADMIN_NAVIGATION
```

Stage 8 додає application-level permission metadata.

Наприклад концептуально:

```ts
{
  label: 'Products',
  href: ADMIN_ROUTES.PRODUCTS,
  requiredPermission: 'products.view',
}
```

Але `requiredPermission` не потрібно додавати у shared `NavigationItem`.

---

# 44. Shared Cabinet UI не знає про permissions

Не додаємо в:

```text
@e-pharmacy/ui
```

такі concepts:

```text
AdminPermission
isPlatformOwner
role
canManageProducts
```

Admin application:

```text
authorization
        ↓
filter navigation
        ↓
NavigationItem[]
        ↓
shared Cabinet UI
```

---

# 45. App-level navigation definition

Оскільки navigation тепер має admin authorization metadata, можна мати:

```text
AdminNavigationDefinition
```

це не є дублем shared navigation type.

Воно описує:

```text
shared navigation data
+
admin-specific permission requirement
```

Після filtering отримуємо звичайний shared:

```text
NavigationItem[]
```

---

# 46. Group visibility

Для:

```text
Reviews
  Pharmacy reviews
  Product reviews
```

якщо employee має лише:

```text
productReviews.view
```

показуємо:

```text
Reviews
  Product reviews
```

Не показуємо недоступний:

```text
Pharmacy reviews
```

---

# 47. Empty group

Якщо employee не має доступу до жодного child:

```text
Reviews
```

не показується взагалі.

Те саме для:

```text
Settings
```

---

# 48. Settings permissions

Наприклад:

```text
employees.view
→ Employees visible

positions.view
→ Positions visible

sitePages.view
→ Site pages visible

categories.view
→ Product categories visible
```

---

# 49. Position не впливає на navigation

Не робимо:

```ts
if (position === 'Accountant') {
  showOrders();
}
```

або:

```ts
if (position === 'Moderator') {
  showReviews();
}
```

Єдина причина показати protected item:

```text
permission
або
Platform Owner
```

---

# 50. Dashboard navigation

Dashboard може залишатися базовим entry point для будь-якого active admin employee.

Не потрібно вигадувати:

```text
dashboard.view
```

лише заради симетрії, якщо product requirements цього не потребують.

А конкретні Dashboard widgets у майбутньому повинні враховувати доступ до своїх даних.

---

# 51. Page-level Permission Gate

До CRUD pages корисно створити reusable admin-level gate.

Концептуально:

```tsx
<AdminPermissionGate permission="products.view">...</AdminPermissionGate>
```

або equivalent.

Він відповідає за frontend presentation.

Backend все одно перевіряє endpoint.

---

# 52. Навіщо gate робити зараз

Щоб наступна сторінка:

```text
Products
```

не винаходила свою permission logic.

А потім:

```text
Pharmacies
Orders
Reviews
Employees
```

не створювали ще п'ять варіантів.

Stage 8 визначає один contract.

---

# 53. Action-level permission

Page view і action permissions — різні.

Наприклад:

```text
products.view
```

дозволяє побачити Products page.

Але:

```text
products.edit
```

потрібно для Edit action.

Тобто:

```text
view page
≠
mutate resource
```

---

# 54. Direct URL

Прихований menu item не означає protected route.

Якщо employee без:

```text
products.view
```

вручну відкриває:

```text
/admin/products
```

frontend gate повинен показати denied state.

Коли реальний page з'явиться.

А backend:

```text
GET products
```

так само поверне:

```text
403
```

---

# 55. Stable backend error codes

Для authorization потрібні контрольовані codes.

Наприклад:

```text
ADMIN_ACCESS_REQUIRED
ADMIN_ACCESS_REVOKED
ADMIN_PERMISSION_DENIED
PLATFORM_OWNER_REQUIRED
LAST_PLATFORM_OWNER
ADMIN_SELF_ACCESS_CHANGE_NOT_ALLOWED
```

Не потрібно використовувати raw English backend message як frontend logic.

---

# 56. HTTP semantics

Типово:

```text
401
→ user not authenticated

403
→ authenticated, але немає admin access/permission
```

Не маскувати permission denial як:

```text
404
500
```

без окремої security-причини.

---

# 57. Platform Owner protection

Звичайний employee не може:

```text
змінювати permissions Platform Owner
revoke Platform Owner access
змінювати owner flag
видаляти Platform Owner
змінювати protected owner identity
```

Навіть якщо employee має:

```text
employees.managePermissions
employees.revokeAccess
```

---

# 58. Granting Platform Owner

Тільки Platform Owner може зробити іншого admin:

```text
isPlatformOwner = true
```

Не permission:

```text
employees.managePermissions
```

---

# 59. Removing Platform Owner

Тільки Platform Owner може забрати owner access.

При цьому система повинна гарантувати:

```text
activePlatformOwners >= 1
```

після операції.

---

# 60. Last Platform Owner invariant

Не допускаємо:

```text
owner #1
↓
removes own/last owner access
↓
0 platform owners
```

Backend повинен відхилити операцію.

Наприклад:

```text
LAST_PLATFORM_OWNER
```

---

# 61. Race condition

Перевірка:

```text
count owners > 1
```

окремо від mutation недостатня.

Два concurrent requests можуть одночасно побачити:

```text
owners = 2
```

і обидва забрати owner status.

Тому критичні owner mutations повинні виконуватися transactionally.

У проєкті вже використовується Mongo transaction pattern — тут потрібно застосувати той самий принцип.

---

# 62. No runtime auto-owner

Не робимо:

```text
if no owner:
  first admin becomes owner
```

на application startup.

Так само не робимо:

```text
oldest admin
first admin
admin@example.com
```

неявно Platform Owner.

Bootstrap має бути explicit.

---

# 63. Initial Platform Owner migration

Stage 8 повинен передбачити migration/seed strategy для існуючого admin account.

Потрібно явно визначити:

```text
який existing admin стає першим Platform Owner
```

Без hardcoded personal email у source code.

---

# 64. Migration fail-safe

Не вмикати новий authorization gate у production із:

```text
0 platform owners
```

Deployment/data migration повинні гарантувати:

```text
>= 1 active Platform Owner
```

---

# 65. Self permission management

Звичайний employee не повинен мати можливість змінити власні permissions.

Інакше:

```text
employees.managePermissions
↓
grant self everything
```

отримаємо privilege escalation.

Тому:

```text
actorUserId === targetUserId
```

для access/permission mutation:

```text
deny
```

за винятком окремих owner-specific flows, якщо вони пізніше будуть явно потрібні.

---

# 66. Permission delegation

Якщо non-owner має:

```text
employees.managePermissions
```

це не означає, що він може видати іншому employee більше доступів, ніж має сам.

Наприклад employee має:

```text
products.view
products.edit
employees.managePermissions
```

Він не повинен видати:

```text
audit.view
sitePages.publish
```

якщо сам їх не має.

---

# 67. Grant subset rule

Для non-owner:

```text
granted permissions
⊆
actor permissions
```

Platform Owner не має такого обмеження.

Це не дозволяє делегованому manager самостійно створити більш привілейованого account.

---

# 68. Revoking access

`employees.revokeAccess` дозволяє revoke тільки:

```text
non-owner employee
```

і не себе.

Не дозволяє:

```text
revoke Platform Owner
```

---

# 69. managePermissions ≠ owner management

Навіть:

```text
employees.managePermissions
```

не дозволяє:

```text
grant Platform Owner
remove Platform Owner
modify owner access
```

Owner lifecycle — окремий privileged operation.

---

# 70. Employee identity

Ти окремо зазначила, що Platform Owner:

```text
бачить employee documents
може змінювати employee identity
```

Тому звичайний:

```text
employees.edit
```

не повинен автоматично означати:

```text
edit legal identity
view sensitive documents
```

Ці owner-only capabilities тримаємо окремо.

---

# 71. Employee documents

Stage 8 не реалізує саму document subsystem.

Але architecture фіксує:

```text
employee sensitive documents
→ Platform Owner only
```

Не додаємо зараз:

```text
employees.viewDocuments
```

як звичайний permission, якщо вимога каже, що це owner capability.

---

# 72. Position management

Майбутній Positions CRUD буде authorization-controlled через:

```text
positions.view
positions.create
positions.edit
positions.delete
```

Але зміна Position:

```text
Employee: Accountant → Support
```

не повинна автоматично:

```text
remove old permissions
add new permissions
```

---

# 73. Position deletion

У майбутньому, якщо Position використовується employees, потрібно буде визначити domain policy:

```text
block delete
або
set positionId = null
```

Але Stage 8 цього CRUD behavior ще не реалізує.

Не придумуємо тимчасову політику зараз.

---

# 74. Permission normalization

Перед persistence:

```text
remove duplicates
validate every permission
canonical order
```

Наприклад:

```text
[
  'products.view',
  'products.view',
  'orders.view'
]
```

нормалізується до:

```text
[
  'orders.view',
  'products.view'
]
```

---

# 75. No implicit inheritance

На Stage 8 не вводимо складну permission hierarchy:

```text
edit automatically means view
delete automatically means edit
moderate automatically means view
```

якщо цього явно не визначено.

Безпечніше:

```text
permissions explicit
```

Наприклад employee, який редагує products, зазвичай отримає і:

```text
products.view
products.edit
```

явно.

---

# 76. Чому без implicit hierarchy

Інакше з'являється hidden logic:

```text
delete
→ edit
→ view
```

яку frontend/backend можуть реалізувати по-різному.

Stage 8 краще залишити permission evaluation простим:

```text
exact permission
або
Platform Owner
```

---

# 77. Permission revocation freshness

Якщо Owner забрав permission:

```text
products.edit
```

backend повинен застосувати це одразу для наступного request.

Не чекати:

```text
logout
token expiry
browser restart
```

---

# 78. Frontend stale snapshot

Frontend snapshot може коротко залишитися stale.

Це допустимо для presentation:

```text
Edit button ще видно
```

але при click backend уже поверне:

```text
403
```

Після permission denial frontend може invalidate/refetch current access.

---

# 79. Не робити realtime permission system зараз

Не потрібно на Stage 8 додавати:

```text
WebSockets
SSE
permission push notifications
```

лише для миттєвого приховування menu.

Це вже інший scope.

---

# 80. Audit foundation

Authorization-sensitive operations повинні бути придатні для audit logging.

Наприклад майбутні events:

```text
admin.permission.changed
admin.access.revoked
admin.access.restored
admin.platform_owner.granted
admin.platform_owner.revoked
```

---

# 81. Audit permission

Permission registry вже містить:

```text
audit.view
```

Але Stage 8 не створює Audit Log page.

Вона буде окремим feature.

---

# 82. Не логувати sensitive payload

Audit log у майбутньому не повинен зберігати:

```text
password
tokens
full document contents
bank data
```

Для permission event достатньо:

```text
actor
target
changed permission names
timestamp
correlation/request id
```

---

# 83. API boundaries

Authorization module не повинен залежати від:

```text
React
Admin UI
navigation
CSS
frontend routes
```

Backend permission engine — окремий application/domain concern.

---

# 84. Frontend boundaries

Frontend не імпортує backend implementation files.

Використовує:

```text
DTO
API client
canonical permission types/contracts
```

через уже прийняті public APIs repository.

---

# 85. Орієнтовна backend structure

Точні шляхи потрібно підібрати під існуючу API architecture.

Концептуально:

```text
apps/api/src/
  modules/
    admin-access/
      admin-access.model.ts
      admin-access.service.ts
      admin-permissions.ts
      admin-authorization.ts
      admin-owner-policy.ts
      admin-access.parser.ts
```

Назви не потрібно копіювати механічно, якщо repository already має інший canonical structure.

---

# 86. Орієнтовна admin structure

Наприклад:

```text
apps/admin/src/
  lib/
    permissions/
      permissions.ts
      can-admin.ts
      navigation-permissions.ts

  providers/
    AdminAuthorizationProvider.tsx

  hooks/
    useAdminAuthorization.ts

  components/
    auth/
      AdminPermissionGate.tsx
```

Але не створюємо зайві abstraction layers, якщо існуюча структура admin уже має відповідні canonical місця.

---

# 87. Self-access endpoint

Stage 8 потребує read-only endpoint для поточного admin access.

Концептуально:

```text
GET /admin/access/me
```

Backend.

Через BFF:

```text
GET /api/admin/access/me
```

Frontend.

---

# 88. Ніяких Employee CRUD endpoints зараз

Stage 8 не додає:

```text
POST /employees
PATCH /employees/:id
DELETE /employees/:id
PATCH /employees/:id/permissions
```

якщо Employee CRUD є наступним feature stage.

Зараз потрібен authorization foundation, не повний management API.

---

# 89. Internal owner/access policy

Навіть якщо public mutation endpoints ще не створюються, Stage 8 може вже мати pure/domain policy helpers для:

```text
permission evaluation
owner protection
grant subset
self-management protection
last-owner invariant
```

і покрити їх tests.

Тоді Employee CRUD пізніше використовує вже перевірену policy.

---

# 90. Admin navigation після Stage 8

Для Platform Owner:

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
  Positions
  Site pages
  Product categories
```

---

# 91. Limited employee example

Наприклад employee має:

```text
products.view
productRequests.view
productReviews.view
productReviews.moderate
```

Menu:

```text
Dashboard

Products
Product Requests

Reviews
  Product reviews
```

Не показуємо:

```text
Pharmacies
Clients
Orders
Employees
Positions
Site pages
Product categories
Pharmacy reviews
```

---

# 92. Accountant example

Наприклад:

```text
Position:
Бухгалтер
```

Permissions:

```text
orders.view
clients.view
audit.view
```

UI:

```text
Dashboard
Clients
Orders
```

і майбутній Audit entry, коли feature буде реалізований.

Посада сама не створила ці permissions.

Їх було призначено Employee окремо.

---

# 93. Два бухгалтери можуть мати різні permissions

Наприклад:

```text
Іван
Position: Бухгалтер
Permissions:
  orders.view
```

```text
Марія
Position: Бухгалтер
Permissions:
  orders.view
  clients.view
  audit.view
```

Це валідна модель.

Саме тому Position не є permission preset.

---

# 94. Permission presets зараз не потрібні

Раніше можна було розглядати Position як preset.

Після твого уточнення це краще **не робити**.

Не створюємо:

```text
Position.defaultPermissions
```

на Stage 8.

Якщо колись знадобляться окремі permission templates/presets, це може бути окремою сутністю.

Але зараз:

```text
Position ≠ PermissionPreset
```

---

# 95. Platform Owner і navigation

Frontend:

```text
isPlatformOwner === true
```

означає:

```text
all permission-controlled navigation visible
```

Не потрібно materialize full permission list у browser state лише для Owner.

---

# 96. Platform Owner і backend

Backend guard:

```text
Platform Owner
→ passes any regular admin permission check
```

але owner-specific invariants все одно діють.

Наприклад Owner не може:

```text
remove last Platform Owner
```

навіть якщо він має максимальні права.

---

# 97. Security ordering

Не потрібно перевіряти permission до authentication.

Правильна послідовність:

```text
authenticate
role
account status
admin access
permission
resource ownership/domain constraints
mutation
```

---

# 98. Tenant isolation

Admin permissions не повинні послабити існуючі pharmacy/client tenant boundaries.

Наприклад:

```text
admin permission
```

не повинна випадково потрапити в pharmacy application і дозволити pharmacy user admin action.

`requireAdminPermission()` завжди спочатку вимагає:

```text
role === admin
```

---

# 99. Permission spoofing

Backend ніколи не читає authoritative permissions із:

```text
request body
query
header
client localStorage
frontend state
```

Наприклад:

```json
{
  "permissions": ["products.edit"]
}
```

від browser не означає нічого для authorization actor.

---

# 100. Frontend localStorage

Не зберігати admin permissions як canonical state у:

```text
localStorage
sessionStorage
```

Self-access endpoint/provider є source для presentation.

Backend database — source of truth.

---

# 101. Security-sensitive logging

Не логувати повний AdminAccess document без потреби.

Особливо не потрібно виводити permission payload у production console на кожен request.

---

# 102. Indexes / persistence

Для access collection потрібен щонайменше unique constraint:

```text
userId
```

Один admin account:

```text
→ один current AdminAccess
```

Не допускаємо два conflicting authorization documents для одного user.

---

# 103. Platform Owner query/index

Якщо owner invariant потребує регулярного пошуку active owners, структура/index має дозволяти це робити без collection scan.

Але не потрібно створювати premature складні indexes, якщо document count малий і existing conventions інші.

---

# 104. Structural checker

Для Stage 8 варто додати:

```text
check:admin-permissions
```

Він має перевіряти architecture contracts, а не formatting implementation.

---

# 105. Structural checker — обов'язкові invariants

Checker має підтвердити:

```text
User.role не розширений position/permission roles

Platform Owner не є User.role

canonical admin permission registry існує

positions permissions існують

Admin navigation містить Positions

shared Cabinet UI не знає про permissions

backend permission guard існує

frontend permission helper існує

admin access endpoint no-store

unknown permissions fail closed

position не визначає permissions
```

---

# 106. Checker не повинен бути brittle

Не перевіряти:

```text
конкретний рядок повинен знаходитися
на конкретному line number
```

якщо architecture contract може бути реалізований через canonical helper.

Перевіряємо dependency/behavior boundaries.

---

# 107. Unit tests — permission evaluator

Обов'язково:

```text
regular employee with permission → allowed
regular employee without permission → denied
Platform Owner → allowed
revoked access → denied
missing access → denied
unknown permission → denied
duplicate permissions normalize
```

---

# 108. Unit tests — Platform Owner policy

Перевірити:

```text
non-owner cannot modify owner
non-owner cannot grant owner
non-owner cannot revoke owner
last owner cannot lose owner access
multiple owners allow controlled owner removal
```

---

# 109. Unit tests — delegation

Перевірити:

```text
non-owner with managePermissions
can grant own permission

non-owner
cannot grant permission they do not possess

employee cannot modify own access

owner may assign regular permissions without subset restriction
```

---

# 110. Unit tests — Position independence

Це варто зафіксувати тестом.

Наприклад:

```text
employee position changes
→ permissions unchanged
```

і:

```text
two employees with same position
→ may have different permissions
```

Так ми не дозволимо майбутньому refactor випадково зв'язати ці сутності.

---

# 111. API tests

Для self-access endpoint:

```text
unauthenticated → 401
client → denied
pharmacy → denied
admin without access → 403
revoked admin → 403
active employee → own permissions
Platform Owner → isPlatformOwner=true
private response → no-store
malformed persistence → fail closed
```

---

# 112. Frontend tests

Перевірити:

```text
loading access
ready access
access error
revoked access
Platform Owner
limited permissions
navigation filtering
nested group filtering
empty group removal
```

---

# 113. Navigation tests

Наприклад:

```text
only productReviews.view
→ Reviews visible
→ Product reviews visible
→ Pharmacy reviews hidden
```

```text
no review permissions
→ Reviews hidden
```

```text
positions.view
→ Settings visible
→ Positions visible
```

---

# 114. Permission Gate tests

```text
required permission exists
→ children render

permission absent
→ denied state

Platform Owner
→ children render

loading
→ no protected content flash
```

---

# 115. Existing Stage 1–7 regressions

Обов'язково прогнати:

```text
admin app shell
admin providers
admin status pages
admin auth
admin protected route
admin shell
shared cabinet UI
client admin-header
pharmacy layout
pharmacy hooks lifecycle
```

Stage 8 не повинен ламати shell.

---

# 116. No CRUD pages

До Definition of Done перевірити, що Stage 8 випадково не додав:

```text
Employees page
Positions page
Pharmacies page
Products page
Reviews page
Site Pages page
Categories page
```

лише для демонстрації permissions.

---

# 117. No fake permissions UI

Також зараз не потрібна форма:

```text
☑ Products
☑ Orders
☑ Reviews
```

як placeholder.

Permission editor з'явиться разом із Employees feature.

---

# 118. No fake positions

Не seed'имо:

```text
Moderator
Content manager
Support
Administrator
```

як обов'язкові system positions.

Це лише приклади.

Platform Owner зможе створити свої positions.

---

# 119. Definition of Done

Stage 8 завершений, коли:

- [ ] `User.role` залишається `client | pharmacy | admin`;
- [ ] не додані `moderator`, `support`, `accountant` тощо як auth roles;
- [ ] існує canonical Admin Permission registry;
- [ ] permissions granular за resource/action;
- [ ] `pharmacyOwners` permissions визначені;
- [ ] `pharmacies` permissions визначені;
- [ ] `products` permissions визначені;
- [ ] `productRequests` permissions визначені;
- [ ] `clients` permissions визначені;
- [ ] `orders` permissions визначені;
- [ ] `productReviews` permissions визначені;
- [ ] `pharmacyReviews` permissions визначені;
- [ ] `sitePages` permissions визначені;
- [ ] `categories` permissions визначені;
- [ ] `employees` permissions визначені;
- [ ] `positions` permissions визначені;
- [ ] `audit.view` визначений;
- [ ] unknown permission fail-closed;
- [ ] permissions deduplicated/normalized;
- [ ] є окремий AdminAccess authorization record;
- [ ] missing AdminAccess deny-by-default;
- [ ] revoked AdminAccess deny-by-default;
- [ ] існує `isPlatformOwner`;
- [ ] Platform Owner не є `User.role`;
- [ ] Platform Owner bypass regular permissions;
- [ ] non-owner не може керувати Platform Owner;
- [ ] owner lifecycle захищений;
- [ ] last Platform Owner не може бути втрачений;
- [ ] owner mutation policy concurrency-safe;
- [ ] bootstrap першого Owner explicit;
- [ ] немає runtime auto-promotion;
- [ ] employee не може змінити власний access;
- [ ] delegated manager не може grant permissions понад власні;
- [ ] position не визначає permissions;
- [ ] Position не є permission preset;
- [ ] arbitrary Positions підтримуються domain model;
- [ ] `Positions` доданий до Settings navigation contract;
- [ ] shared Cabinet UI не знає про admin permissions;
- [ ] admin navigation filter знаходиться в admin application;
- [ ] nested groups приховують inaccessible children;
- [ ] empty nested groups не відображаються;
- [ ] є canonical frontend permission helper;
- [ ] Platform Owner враховується в helper;
- [ ] існує frontend permission gate;
- [ ] permissions не є frontend security boundary;
- [ ] backend має canonical `requireAdminPermission`;
- [ ] backend перевіряє permission на operation level;
- [ ] permission state не є authoritative JWT claim;
- [ ] self-access endpoint існує;
- [ ] self-access endpoint private/no-store;
- [ ] runtime parser fail-closed;
- [ ] loading не показує full navigation flash;
- [ ] access fetch failure не перетворюється на fake empty permissions;
- [ ] revoked access має окремий state;
- [ ] stable authorization error codes існують;
- [ ] unit tests permission evaluator проходять;
- [ ] Platform Owner policy tests проходять;
- [ ] delegation tests проходять;
- [ ] position independence tests проходять;
- [ ] API access tests проходять;
- [ ] frontend authorization tests проходять;
- [ ] navigation filtering tests проходять;
- [ ] Stage 1–7 regression checks проходять;
- [ ] немає Employees CRUD;
- [ ] немає Positions CRUD;
- [ ] немає інших Stage 9+ business CRUD pages;
- [ ] `pnpm lint` проходить;
- [ ] `pnpm type-check` проходить;
- [ ] `pnpm test` проходить;
- [ ] `pnpm test:react` проходить;
- [ ] `pnpm test:integration` проходить;
- [ ] `pnpm build` проходить;
- [ ] `pnpm check:before-deploy` проходить.

---

# 120. Архітектура після Stage 8

У результаті:

```text
                    User
                     │
             role = admin
                     │
                     ▼
             AdminProtectedRoute
                     │
                     ▼
               AdminAccess
            ┌────────┴─────────┐
            │                  │
   Platform Owner         Permissions
            │                  │
            └────────┬─────────┘
                     ▼
            Authorization
            ┌────────┴────────┐
            │                 │
         Frontend          Backend
            │                 │
       UX filtering      authoritative
       hide actions       permission check
       hide menu          every operation
```

При цьому:

```text
Employee
   │
   └── Position
```

існує паралельно і **не впливає на authorization**.

---

# 121. Архітектура Employee у майбутньому

Коли дійдемо до Employees:

```text
Employee
├── user/account
├── employee data
├── positionId
└── access
     ├── permissions
     ├── access status
     └── Platform Owner flag
```

UI може виглядати:

```text
Іванов Іван

Посада:
[ Бухгалтер ▼ ]

Доступи:
☑ Замовлення — перегляд
☑ Клієнти — перегляд
☑ Аудит — перегляд
☐ Товари — редагування
...
```

При зміні:

```text
Бухгалтер
→
Support
```

checkboxes permissions **не змінюються автоматично**.

Саме це відповідає твоєму уточненню.

---

# 122. Головний architectural verdict Stage 8

Після цього маємо три незалежні виміри:

```text
1. Хто це?
   → User.role = admin

2. Чим людина займається?
   → Position = Бухгалтер

3. Що людині дозволено?
   → Permissions
```

І четвертий спеціальний security concept:

```text
4. Хто має ultimate platform control?
   → Platform Owner
```

Не:

```text
role = super_admin_accountant_moderator
```

🙂

Для Stage 8 я б використала коміт:

```text
feat(admin): add permission and platform owner foundation
```

А після цього вже можна безпечно переходити до CRUD-сторінок: кожна нова feature одразу отримуватиме свій `view/create/edit/...` contract, а не чекатиме на «великий permissions refactor колись потім».

//=================================================

Готово 🙂 Stage 8 реалізований поверх e-pharmacy-8.zip без переходу до Stage 9+.

📦 Архів Stage 8

Завантажити архів з оновленими/доданими файлами Stage 8

В архіві 44 файли:

24 нові;
20 оновлених;
видалених файлів немає.

Основне, що реалізовано:

окремий AdminAccess, не змішаний з User;
User.role як і раніше тільки client | pharmacy | admin;
canonical granular admin permissions;
окремий isPlatformOwner, а не super_admin role;
fail-closed access для missing/revoked AdminAccess;
backend requireAdminPermission(...);
один resolved authorization context на request;
permission guards для вже наявних admin operations;
policy проти self privilege escalation;
non-owner може делегувати лише власний subset permissions;
Platform Owner захищений від змін звичайним employee;
last Platform Owner invariant + transaction-based owner mutation foundation;
explicit bootstrap першого Platform Owner;
GET /admin/access/me + same-origin BFF /api/admin/access/me;
private response з no-store;
fail-closed runtime parser;
AdminAuthorizationProvider;
AdminPermissionGate;
navigation filtering за permissions;
Platform Owner бачить усю permission-controlled navigation;
empty nested groups прибираються;
у Settings доданий Positions;
Position не прив'язана до permissions і не є permission preset;
Positions CRUD, Employees CRUD, permission editor та інші Stage 9+ сторінки не створювалися.

Перевірки фінальної версії:

admin structural checks Stage 1–8 — ✅
check:admin-permissions — ✅
API boundaries — ✅
API-client boundaries/public API/contracts/routes — ✅
shared Cabinet regression — ✅
pharmacy layout regression — ✅
client Admin Header regression — ✅
Admin TypeScript — ✅
API-client TypeScript — ✅
Admin unit tests — 22/22
Admin React/contract tests — 6/6
backend Stage 8 permission/policy tests — 7/7
API-client route tests — 2/2
окремо перевірила накладання готового ZIP на чистий e-pharmacy-8 — ✅

Повний pnpm check:before-deploy у моєму архівному середовищі не проганяла до кінця через неповний dependency tree apps/api, тому фінальний повний прогін, як і раніше, краще зробити у твоєму робочому репозиторії.

⚠️ Один важливий крок після оновлення

Для вже існуючого admin account потрібно один раз виконати explicit Stage 8 migration/bootstrap:

pnpm seed:admin-owner

із тими самими ADMIN*OWNER*\*, які використовуються для твого поточного першого admin.

Це навмисно fail-closed: після Stage 8 просто role === admin більше не дає повного доступу без AdminAccess. Скрипт не робить прихованої runtime auto-promotion — він явно створює/перевіряє access першого Platform Owner.

Після цього можна запускати:

pnpm check:before-deploy
Коміт
feat(admin): add permission and platform owner foundation

Тепер permission-фундамент стоїть перед CRUD, як і планували — отже наступні сторінки вже не доведеться потім масово лікувати від if (role === 'щось*дуже*спеціальне') 😄
