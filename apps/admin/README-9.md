Так 🙂 Я переглянула актуальні README-0.md–README-8.md саме з e-pharmacy-9.zip і звірила Stage 9 з уже реалізованими Stage 7–8. Нижче я б зафіксувала його так, щоб Audit Log став інфраструктурою до появи першого нормального admin CRUD, а не декоративною сторінкою, яку потім доведеться підключати заднім числом.

# 14. ЕТАП 9 — Audit log

## 1. Мета етапу

На Stage 9 я б зробила **повноцінний audit foundation + Activity history UI**.

Головна задача:

```text
будь-яка критична зміна, зроблена admin,
має залишати незмінний історичний запис
```

Тобто перед тим, як ми почнемо реалізовувати:

```text
Pharmacies CRUD/moderation
Products CRUD
Product Requests moderation UI
Reviews moderation
Employees
Permissions editor
Categories
Site Pages
```

у нас уже повинен існувати єдиний механізм:

```text
Admin mutation
      │
      ├── domain change
      │
      └── AuditLog
              │
              └── одна transaction
```

Це важливо зробити саме зараз.

Інакше після створення всіх admin CRUD доведеться повертатися до кожного:

```text
PATCH
POST
DELETE
status mutation
permission mutation
moderation mutation
```

і вручну вшивати audit logging.

Той самий улюблений жанр:

> «Додамо потім, це ж маленька фіча».

А потім маленька фіча дивиться на нас із 37 mutation endpoints 😄

---

# 2. Що вже готово після Stage 8

Stage 8 дуже вдало підготував Stage 9.

У permission registry уже є:

```ts
audit.view;
```

Тобто **новий permission зараз вигадувати не потрібно**.

Уже існує:

```text
User.role = admin
        │
        ▼
AdminProtectedRoute
        │
        ▼
AdminAccess
        │
        ├── isPlatformOwner
        └── permissions
```

Backend уже має:

```text
authenticate
authorizeRoles(admin)
resolveAdminAuthorization
requireAdminPermission(...)
```

Frontend уже має:

```text
AdminAuthorizationProvider
canAdmin(...)
AdminPermissionGate
permission-filtered navigation
```

Отже Activity history просто підключається до:

```ts
ADMIN_PERMISSIONS.audit.view;
```

без нового authorization layer.

---

# 3. Ще одна важлива готова річ — request ID

У backend уже існує request context.

API генерує/отримує:

```text
X-Request-ID
```

і зберігає його в:

```ts
res.locals.requestId;
```

Тобто для Audit Log **не треба вигадувати ще один correlation id**.

Використовуємо існуючий request ID.

Архітектура:

```text
Browser
   │
   │ request / trace context
   ▼
Admin BFF
   │
   ▼
API request-context middleware
   │
   ├── res.locals.requestId
   │
   ▼
Domain mutation
   │
   ▼
AuditLog.requestId
```

Це дозволить у майбутньому зіставити:

```text
UI error
API log
Audit record
request trace
```

---

# 4. Scope Stage 9

На цьому етапі я б зробила:

```text
1. AuditLog persistence model

2. Canonical audit actions/entity types

3. Safe audit snapshot contract

4. Sensitive-data protection

5. Server-side audit writer

6. Transactional audit integration

7. Audit існуючих admin mutations

8. GET audit list API

9. GET audit details API

10. Same-origin Admin BFF

11. Activity history page

12. Filters + pagination

13. Audit details UI

14. Settings navigation item

15. Permission integration через audit.view

16. Structural checks

17. Unit / API / integration / React tests
```

---

# 5. Що НЕ входить у Stage 9

Stage 9 не повинен випадково перетворитися на реалізацію всіх майбутніх admin features.

Тому зараз **не робимо**:

```text
Employees CRUD
Positions CRUD
Permission editor UI
Pharmacies list/detail page
Products admin CRUD
Product Requests admin page
Clients page
Orders page
Reviews moderation UI
Site Pages CMS
Categories CRUD
Admin Profile
Dashboard
notifications
exports
```

Так само не створюємо mutations лише для того, щоб було що показати в Audit Log.

Audit має працювати з **реальними операціями, які вже існують**, і бути готовим приймати нові події з наступних stages.

---

# 6. Audit Log — це не звичайний application log

Треба чітко розділити:

```text
Application log
```

і:

```text
Audit log
```

Application log відповідає на питання:

```text
Що сталося із системою?
```

Наприклад:

```text
Mongo timeout
API returned 500
validation failed
request failed
```

Audit log відповідає на питання:

```text
ХТО
ЩО
ЗМІНИВ
У ЯКІЙ СУТНОСТІ
КОЛИ
З ЯКОГО ЗНАЧЕННЯ
НА ЯКЕ
І З ЯКОЇ ПРИЧИНИ
```

Наприклад:

```text
Natalia

Pharmacy #123

Status:
on_moderation → active

22 Sep 2026 16:24
```

Це різні речі.

Не треба змішувати їх в одну collection.

---

# 7. Audit Log повинен бути append-only

Audit history не повинна мати:

```text
PATCH /audit/:id
DELETE /audit/:id
POST /audit
```

з browser.

Тобто Audit Log:

```text
create → тільки backend internal service

read → admin з audit.view

update → немає

delete → немає
```

Жодної кнопки:

```text
Delete history
Edit history
Correct record
```

не існує.

Якщо admin зробив неправильну дію, історія має показувати:

```text
A → B
B → A
```

а не переписувати перший запис.

---

# 8. AuditLog model

Я б заклала приблизно таку структуру:

```text
AuditLog

_id

actorUserId
actorNameSnapshot

action

entityType
entityId
entityLabelSnapshot

before
after
changedFields

reason

requestId

createdAt
```

Не потрібен:

```text
updatedAt
```

бо audit record після створення не змінюється.

---

# 9. `actorUserId`

```text
actorUserId
```

— реальний `User._id` admin, який виконав операцію.

Він повинен визначатися **тільки backend**.

Не:

```json
{
  "actorUserId": "..."
}
```

із browser body.

Джерело:

```text
authenticated user
+
resolved AdminAuthorization
```

---

# 10. `actorNameSnapshot`

Окрім `actorUserId`, обов'язково зберігаємо:

```text
actorNameSnapshot
```

Наприклад:

```text
Nataliia Skoropad
```

Чому не достатньо просто `populate(User)`?

Бо через два роки:

```text
admin змінив ім'я
employee видалений
employee account деактивований
```

а audit history все одно повинна показувати:

```text
хто виконав дію на той момент
```

Тому:

```text
actorUserId
+
actorNameSnapshot
```

правильніше, ніж лише foreign key.

---

# 11. Actor snapshot не приходить із frontend

Frontend ніколи не передає:

```text
actorName
actorEmail
actorRole
```

Audit service сам отримує ім'я actor з authoritative backend data.

Тобто не можна зробити:

```json
{
  "actorNameSnapshot": "Elon Musk"
}
```

і залишити в історії маленький корпоративний сюрприз 😄

---

# 12. Email actor зараз не потрібен

Я б не додавала:

```text
actorEmailSnapshot
```

без реальної потреби.

Для UI достатньо:

```text
actorUserId
actorNameSnapshot
```

Email — додаткові персональні дані, які не потрібні для поточного сценарію.

Якщо пізніше з'явиться вимога compliance — можна додати окремо.

---

# 13. `entityType`

Потрібен canonical entity registry.

Для Stage 9 реальні типи:

```text
pharmacy
productRequest
adminAccess
```

Наприклад:

```ts
AUDIT_ENTITY_TYPES = {
  PHARMACY: 'pharmacy',
  PRODUCT_REQUEST: 'productRequest',
  ADMIN_ACCESS: 'adminAccess',
};
```

Не треба зараз наперед додавати:

```text
product
category
review
sitePage
employee
position
order
client
```

якщо вони ще не створюють audit events.

Registry легко розшириться разом із наступними stages.

---

# 14. `entityId`

Я б зберігала його як:

```text
string
```

а не жорстко як Mongo `ObjectId`.

Причина проста.

Сьогодні сутність може мати:

```text
ObjectId
```

а завтра Site Page може ідентифікуватися:

```text
about
privacy
terms
```

Тобто Audit Log не повинен бути прив'язаний до Mongo ObjectId як єдиного можливого identifier.

---

# 15. `entityLabelSnapshot`

Я б додала:

```text
entityLabelSnapshot
```

Це дуже корисно для UI.

Наприклад:

```text
entityType: pharmacy
entityId: 68...
entityLabelSnapshot: "Аптека Доброго Дня"
```

або:

```text
entityType: productRequest
entityId: 69...
entityLabelSnapshot: "Nurofen Express"
```

Тоді Activity history не мусить робити:

```text
AuditLog
+ User lookup
+ Pharmacy lookup
+ ProductRequest lookup
+ Product lookup
+ ...
```

для кожного рядка.

І якщо сама сутність пізніше буде видалена — історія залишиться читабельною.

---

# 16. Не робити Audit page залежною від живих сутностей

Audit page не повинна вимагати:

```text
populate current pharmacy
populate current product
populate current employee
```

щоб просто намалювати запис.

Основна інформація має бути self-contained:

```text
actorNameSnapshot
entityLabelSnapshot
action
before
after
reason
createdAt
```

Foreign IDs потрібні для:

```text
filtering
future navigation
correlation
```

але не для базового рендеру.

---

# 17. Canonical audit actions

На Stage 9 потрібен окремий registry.

Наприклад:

```text
pharmacy.status.changed

productRequest.status.changed

admin.platformOwner.granted

admin.platformOwner.revoked
```

Не використовуємо magic strings у services:

```ts
'action': 'something changed lol'
```

🙂

Має бути:

```ts
AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED;
```

---

# 18. Не створювати десятки future actions зараз

Stage 8 уже підказує майбутні події:

```text
admin.permission.changed
admin.access.revoked
admin.access.restored
```

Але якщо mutation service для них ще фактично не існує, я б не будувала навколо них половину Stage 21.

Canonical registry можна розширювати разом із feature.

Stage 9 закладає механізм.

Не весь словник майбутнього людства.

---

# 19. `before` і `after`

Це не повинні бути повні Mongo documents.

Неправильно:

```ts
before: pharmacy.toObject();
after: updatedPharmacy.toObject();
```

Бо тоді в audit автоматично можуть потрапити:

```text
bankDetails
documents
phone
email
internal fields
moderation internals
future secrets
```

---

# 20. Audit snapshots повинні бути explicit

Для конкретної події передаємо тільки те, що потрібно.

Наприклад pharmacy status:

```ts
before: {
  status: 'on_moderation',
}

after: {
  status: 'active',
}

changedFields: ['status']
```

Product Request:

```ts
before: {
  status: 'in_progress',
}

after: {
  status: 'approved',
  productId: '...',
}

changedFields: [
  'status',
  'productId',
]
```

Platform Owner:

```ts
before: {
  isPlatformOwner: false,
}

after: {
  isPlatformOwner: true,
}

changedFields: [
  'isPlatformOwner',
]
```

---

# 21. `before` / `after` — тільки changed audit fields

Я б не використовувала їх як:

```text
повний snapshot entity до
+
повний snapshot entity після
```

Краще:

```text
тільки поля, які мають значення для конкретної audited operation
```

Це:

- безпечніше;
- менше займає місця;
- простіше читати;
- простіше показувати у UI;
- складніше випадково злити sensitive data.

---

# 22. Audit value contract

Я б обмежила допустимі audit values приблизно такими типами:

```text
string
number
boolean
null
string[]
```

Date:

```text
ISO string
```

Не потрібно дозволяти довільні:

```text
Buffer
Blob
Document
Map<any>
File
Mongoose document
Request
Response
```

Audit snapshot повинен бути маленьким і передбачуваним.

---

# 23. `changedFields`

```text
changedFields
```

зберігаємо явно.

Наприклад:

```text
[
  "status"
]
```

або:

```text
[
  "permissions"
]
```

Перед записом:

```text
deduplicate
normalize
stable sort
```

І він має відповідати `before/after`.

---

# 24. No-op mutation не створює AuditLog

Якщо:

```text
before === after
```

Audit record не потрібен.

Наприклад:

```text
isPlatformOwner = true
```

і система отримала повторний запит:

```text
set true
```

Результат:

```text
domain change → немає
audit record → немає
```

Audit Log — це історія змін, а не історія натискання кнопок.

---

# 25. `reason`

Для операцій, де причина має business meaning:

```text
reason
```

потрібно зберігати.

Наприклад:

```text
Pharmacy:
on_moderation → new

Reason:
Invalid verification documents
```

або:

```text
Product Request:
in_progress → rejected

Reason:
Product already exists
```

Reason:

```text
trim
max length
optional
```

і не повинен автоматично братися з усього request body.

---

# 26. `requestId`

Зберігаємо:

```text
requestId
```

з API request context.

Важливо:

```text
requestId не приходить із validated body
```

і не визначається frontend manually.

Для Product Request зараз у коді також є змінна:

```ts
requestId;
```

яка означає `ProductRequest._id`.

Під час Stage 9 я б там зробила невелике очищення naming:

```text
productRequestId
```

для entity ID.

А:

```text
requestId
```

залишити для request/correlation ID.

Інакше через пів року буде дуже веселе:

```ts
(requestId, requestId);
```

і TypeScript теж піде пити каву.

---

# 27. `createdAt`

Mongo зберігає:

```text
Date
```

в UTC.

Frontend форматує дату для користувача.

Не потрібно зберігати:

```text
22 Sep 2026 16:24 Europe/Kyiv
```

як готовий string.

У DB:

```text
Date
```

У UI:

```text
Intl.DateTimeFormat
```

---

# 28. `updatedAt` не потрібен

Schema:

```ts
timestamps: {
  createdAt: true,
  updatedAt: false,
}
```

Audit record незмінний.

Це хороший structural invariant.

---

# 29. Sensitive data — головне правило Stage 9

У AuditLog **ніколи не повинні потрапляти**:

```text
password

hashed password

JWT

access token

refresh token

cookies

Authorization header

BFF secret

session secrets

full request headers

full request body

file binary

Buffer

uploaded document contents

verification document binary

bankDetails

IBAN

taxId

full payment/banking information
```

Це має бути не просто README-правило.

Потрібен кодовий захист.

---

# 30. Allowlist важливіший за blacklist

Основний захист:

```text
audit event сам явно формує safe before/after fields
```

Наприклад:

```ts
appendAuditLog({
  ...
  before: {
    status: previousStatus,
  },
  after: {
    status: nextStatus,
  },
});
```

а не:

```ts
sanitize(pharmacy.toObject());
```

і сподіватися, що sanitizer згадає всі sensitive fields.

---

# 31. Але defensive denylist теж потрібен

Поверх explicit allowlist я б зробила defensive validator.

Наприклад заборонені keys:

```text
password
passwordHash

token
accessToken
refreshToken
jwt

cookie
authorization

bankDetails
iban
taxId

file
binary
buffer
content
```

Case-insensitive.

Це друга лінія захисту.

---

# 32. Sensitive audit payload — fail closed

Якщо audit writer отримав заборонене поле:

```text
не мовчки прибираємо його
```

а:

```text
throw
```

Для critical mutation це означає:

```text
audit write failed
→ transaction failed
→ domain mutation rolled back
```

Це правильніше за:

```text
mutation пройшла
audit випадково не записався
```

---

# 33. Не логувати HTTP body автоматично

Не створюємо middleware на кшталт:

```ts
audit({
  before: req.body,
});
```

ніколи.

Audit logging повинен бути domain-aware.

Middleware не знає:

```text
що sensitive
що реально змінилось
яке значення було до mutation
яке стало після
яка entity була змінена
```

---

# 34. Не логувати passwords навіть у failed request

Audit history — не місце для:

```text
failed login payload
forgot password body
reset password token
```

Auth security logging — окремий concern.

Stage 9 фокусується на **успішних admin business mutations**.

---

# 35. Failed mutation ≠ AuditLog

Якщо admin спробував:

```text
activate invalid pharmacy
```

і backend повернув:

```text
400
403
409
500
```

Audit change record не створюємо.

Бо entity не змінилася.

Такі речі можуть потрапити в application/security logs, але не в history of changes.

---

# 36. Audit service

Я б зробила окремий backend service.

Наприклад:

```text
apps/api/src/services/admin-audit.service.ts
```

З умовним API:

```ts
appendAdminAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  entityLabel,
  before,
  after,
  changedFields,
  reason,
  requestId,
  session,
});
```

---

# 37. Audit service є єдиною точкою запису

Не треба розкидати:

```ts
AuditLog.create(...)
```

по:

```text
admin.service.ts
product-request.service.ts
employee.service.ts
category.service.ts
...
```

Domain services викликають:

```text
appendAdminAuditLog(...)
```

А він уже відповідає за:

```text
actor snapshot
normalization
validation
sensitive-field protection
model write
```

---

# 38. Public endpoint для створення AuditLog не потрібен

Не існує:

```text
POST /admin/audit
```

Frontend не повинен мати можливість сказати:

```text
запиши в історію, що я щось зробив
```

Історія створюється тільки там, де реально відбулася mutation.

---

# 39. Actor snapshot отримує backend

Audit service перед записом знаходить:

```text
User
```

за:

```text
actorUserId
```

і бере authoritative:

```text
name
```

Якщо mutation працює в Mongo transaction:

```text
actor lookup
```

також виконується з тією ж:

```text
session
```

---

# 40. Audit та domain mutation — одна transaction

Для critical admin operations:

```text
BEGIN TRANSACTION

read entity

validate transition

change entity

write AuditLog

COMMIT
```

Якщо audit write падає:

```text
ROLLBACK
```

---

# 41. Не записувати audit після commit

Неправильно:

```ts
await updatePharmacy();

await createAuditLog();
```

Бо може статися:

```text
updatePharmacy → success

createAuditLog → Mongo error
```

і ми отримали:

```text
реальна зміна є
історії немає
```

Для critical mutation це неприйнятно.

---

# 42. Поточний код уже дуже добре підготовлений

`updatePharmacyStatusByAdminService(...)` уже працює через:

```ts
session.withTransaction(...)
```

`moderateProductRequestByAdminService(...)` також працює через:

```ts
session.withTransaction(...)
```

`setPlatformOwnerStatusService(...)` Stage 8 теж має transaction.

Тобто для основних існуючих admin mutations Stage 9 не потребує архітектурного перевороту.

Потрібно акуратно вставити:

```text
AuditLog write
```

у вже існуючу transaction.

---

# 43. Pharmacy status moderation

Поточна операція:

```text
PATCH /admin/pharmacies/:pharmacyId/status
```

має створювати:

```text
action:
pharmacy.status.changed
```

Наприклад:

```text
actorUserId:
...

actorNameSnapshot:
Natalia

entityType:
pharmacy

entityId:
...

entityLabelSnapshot:
Pharmacy ABC

before:
{
  status: "on_moderation"
}

after:
{
  status: "active"
}

changedFields:
[
  "status"
]

reason:
optional

requestId:
...

createdAt:
...
```

---

# 44. Pharmacy activation не повинна dump'ити pending moderation

При переході:

```text
on_moderation → active
```

backend зараз може застосовувати:

```text
pendingModeration
```

до pharmacy profile.

Не треба через це записувати в AuditLog:

```text
full pendingModeration
bankDetails
documents
```

Подія Stage 9 фіксує admin moderation action:

```text
status before
status after
reason
```

А майбутні окремі profile-edit/moderation audit events можна додати тоді, коли їхній domain contract буде чітко визначений.

---

# 45. Product Request moderation

Поточна операція:

```text
PATCH /admin/product-requests/:productRequestId/status
```

отримує:

```text
productRequest.status.changed
```

Наприклад:

```text
in_progress → rejected
```

і:

```text
reason
```

або:

```text
in_progress → approved
```

Якщо approval створив/підв'язав product, safe snapshot може також містити:

```text
productId
```

але не весь Product.

---

# 46. Platform Owner change

У Stage 8 уже є internal:

```text
setPlatformOwnerStatusService(...)
```

Його я б також одразу підключила до Audit Log.

Grant:

```text
admin.platformOwner.granted
```

```ts
before: {
  isPlatformOwner: false,
}

after: {
  isPlatformOwner: true,
}
```

Revoke:

```text
admin.platformOwner.revoked
```

```ts
before: {
  isPlatformOwner: true,
}

after: {
  isPlatformOwner: false,
}
```

І audit insert знаходиться всередині тієї ж owner transaction.

---

# 47. No-op Platform Owner operation

Stage 8 уже має логіку:

```text
target.isPlatformOwner === requested value
→ return
```

У такому випадку AuditLog також:

```text
не створюється
```

Правильно.

---

# 48. Permission changes у майбутньому

Stage 8 уже має:

```text
assertCanManageAdminPermissions(...)
```

але Employees/permission mutation API ще не створені.

Stage 9 не повинен робити їх лише заради Audit Log.

Коли Stage Employees з'явиться:

```text
permission mutation
      │
      ├── assertCanManageAdminPermissions
      ├── AdminAccess update
      └── appendAdminAuditLog
```

в одній transaction.

Тоді можна додати action:

```text
admin.permissions.changed
```

і snapshot:

```ts
before: {
  permissions: [...]
}

after: {
  permissions: [...]
}

changedFields: ['permissions']
```

Механізм Stage 9 вже буде готовий.

---

# 49. Access revoke / restore у майбутньому

Аналогічно:

```text
admin.access.revoked
admin.access.restored
```

не потребуватимуть окремої audit architecture.

Тільки нового action + виклику існуючого writer.

---

# 50. Legacy `POST /admin/pharmacies`

Тут я б нарешті прибрала одну річ, яку ми ще в `README-0` визначили як неправильну для нового Admin.

Зараз backend досі має:

```text
POST /admin/pharmacies
```

який створює:

```text
pharmacy user
+
pharmacy
```

через admin.

Але цільова бізнес-логіка вже зафіксована інша:

```text
owner сам реєструється
→ створює pharmacy
→ admin тільки переглядає / модерує / керує
```

Тому Stage 9 — останній хороший момент прибрати цей legacy endpoint **до того, як ми почнемо будувати admin CRUD і audit coverage навколо нього**.

Я б видалила:

```text
POST /admin/pharmacies
```

і admin-specific creation flow, якщо в нього немає іншого production consumer.

---

# 51. Не треба логувати legacy mutation, яку ми вирішили видалити

Я б не робила:

```text
Stage 9:
додати AuditLog до POST /admin/pharmacies

Stage 13:
видалити POST /admin/pharmacies
```

Це саме те «тимчасово тимчасове», якого ми намагаємось уникати.

Якщо endpoint суперечить зафіксованій архітектурі й не потрібен — прибираємо до audit integration.

---

# 52. AuditLog indexes

Для collection потрібні нормальні indexes.

Мінімально:

```ts
{ createdAt: -1 }

{ entityType: 1, entityId: 1, createdAt: -1 }

{ actorUserId: 1, createdAt: -1 }

{ action: 1, createdAt: -1 }

{ requestId: 1 }
```

Це покриває:

```text
global Activity history

history конкретної pharmacy

history конкретного product

history employee/admin

filter by action

debug by request ID
```

---

# 53. TTL не додаємо

Audit Log не повинен тихенько зникати через:

```text
expiresAfterSeconds
```

На Stage 9:

```text
ніякого TTL
```

Якщо колись з'явиться:

```text
formal data retention policy
```

її треба буде приймати як окреме бізнес-рішення.

Не випадково через Mongo index.

---

# 54. Cascade delete не робимо

Якщо:

```text
entity deleted
```

Audit Log залишається.

Якщо:

```text
employee deleted/deactivated
```

Audit Log залишається.

Тому `actorUserId` і `entityId` — references для correlation, але audit history не повинна каскадно очищатися.

---

# 55. Backend read API

Я б додала:

```text
GET /admin/audit
```

і:

```text
GET /admin/audit/:auditLogId
```

Обидва:

```text
authenticate
authorizeRoles(admin)
resolveAdminAuthorization
requireAdminPermission(audit.view)
```

---

# 56. Чому list + details окремо

List page не мусить для 100 записів тягнути всі:

```text
before
after
```

особливо коли майбутні permission changes матимуть масиви.

List endpoint може повертати summary:

```text
id
actorUserId
actorNameSnapshot

action

entityType
entityId
entityLabelSnapshot

changedFields
reason

requestId
createdAt
```

А:

```text
GET /admin/audit/:id
```

додає:

```text
before
after
```

---

# 57. List filters

Backend query я б одразу заклала так:

```text
page
perPage

dateFrom
dateTo

action

entityType
entityId

actorUserId

requestId
```

Це дозволить одному endpoint обслуговувати:

```text
global Activity history

Pharmacy Activity

Product Activity

Employee Activity
```

у майбутньому.

---

# 58. Особливо важливі `entityType + entityId`

Саме вони дозволять пізніше на:

```text
/admin/pharmacies/[pharmacyId]
```

показати:

```text
Activity
```

без нового API.

Запит:

```text
GET /admin/audit
  ?entityType=pharmacy
  &entityId=...
```

І те саме для:

```text
product
productRequest
employee
...
```

коли відповідні audit actions з'являться.

---

# 59. Pagination

Використовуємо існуючий shared convention:

```text
20
50
100
```

Бо `RowsPerPageSelect` уже має:

```ts
[20, 50, 100];
```

Default:

```text
20
```

Backend:

```text
page >= 1
perPage ∈ 20 | 50 | 100
```

Не дозволяємо:

```text
perPage=1000000
```

через query string.

---

# 60. Sorting

Default і фактично єдиний потрібний Stage 9 sort:

```text
newest first
```

тобто:

```text
createdAt DESC
```

Для deterministic ordering можна використовувати:

```text
createdAt DESC
_id DESC
```

Не потрібен зараз generic sorting engine для Audit Log.

---

# 61. Date filters

Activity history повинна підтримувати:

```text
Date from
Date to
```

Backend перетворює їх у нормальний date range.

Не треба передавати frontend-generated Mongo operators.

Тобто:

```text
?dateFrom=2026-09-01
&dateTo=2026-09-30
```

а не:

```text
createdAt[$gte]=...
```

---

# 62. Action filter

UI не повинен показувати raw:

```text
pharmacy.status.changed
```

як єдиний текст для користувача.

Потрібна presentation map.

Наприклад:

```text
Pharmacy status changed
Product request status changed
Platform Owner granted
Platform Owner removed
```

А в API/DB лишається canonical action.

---

# 63. Entity type presentation

Так само:

```text
pharmacy
productRequest
adminAccess
```

у UI:

```text
Pharmacy
Product request
Admin access
```

Domain constants ≠ human-readable label.

---

# 64. Audit Details

При натисканні на рядок я б відкривала admin-specific:

```text
Audit details modal
```

або detail panel.

Там:

```text
Date and time

Changed by
Action

Entity
Entity ID

Changes

Reason

Request ID
```

---

# 65. Changes UI

Наприклад:

```text
Status

On moderation
      ↓
Active
```

або:

```text
Platform Owner

No
↓
Yes
```

Для permission arrays у майбутньому можна буде показувати:

```text
Added:
products.edit
products.delete

Removed:
orders.view
```

але generic permission diff UI зараз не потрібно реалізовувати без actual mutation.

---

# 66. Request ID у details

Я б показувала:

```text
Request ID
```

саме в details, а не обов'язково окремою широкою колонкою таблиці.

Наприклад:

```text
Request ID:
01J...
```

із можливістю скопіювати.

Це дуже корисно при debugging/support.

---

# 67. Activity history route

У admin додаємо:

```text
/admin/settings/activity
```

і canonical route:

```ts
ADMIN_ROUTES.SETTINGS_ACTIVITY;
```

---

# 68. Settings navigation після Stage 9

Отримуємо:

```text
Settings
├── Employees
├── Positions
├── Site pages
├── Product categories
└── Activity history
```

Саме той варіант, який логічно сформувався після Stage 8.

---

# 69. Activity history permission

Navigation item:

```ts
requiredPermission: ADMIN_PERMISSIONS.audit.view;
```

Отже:

```text
audit.view є
→ Activity history видно

audit.view немає
→ item прихований

Platform Owner
→ item видно
```

Без окремої special-case логіки.

---

# 70. Empty Settings group

Stage 8 уже вміє:

```text
видаляти inaccessible children
```

і:

```text
не показувати empty group
```

Stage 9 це не переписує.

Ми просто додаємо ще одну child definition.

---

# 71. Breadcrumbs

Для:

```text
/admin/settings/activity
```

breadcrumbs:

```text
Settings
/
Activity history
```

Додаємо це в існуючий:

```text
BREADCRUMB_ROUTES
```

Не створюємо окрему breadcrumbs систему.

---

# 72. Page-level Permission Gate

Activity page:

```text
AdminProtectedRoute
      │
      ▼
AdminAuthorizationProvider
      │
      ▼
AdminPermissionGate(audit.view)
      │
      ▼
ActivityHistory
```

Frontend gate потрібен для UX.

Backend:

```text
requireAdminPermission(audit.view)
```

залишається security boundary.

---

# 73. Direct URL

Якщо admin без:

```text
audit.view
```

вручну відкриє:

```text
/admin/settings/activity
```

Frontend не показує protected data.

А якщо напряму викличе:

```text
/api/admin/audit
```

backend повертає permission error.

---

# 74. Activity History page

Я б зробила сторінку приблизно так:

```text
Activity history

[ Filters ]

-------------------------------------------------------------
Date / time | Employee | Entity | Action | Changed fields
-------------------------------------------------------------

22 Sep 16:24 | Natalia | Pharmacy ABC | Status changed | status

21 Sep 11:04 | John    | Product req. | Status changed | status
-------------------------------------------------------------

Rows per page
Pagination
```

---

# 75. Не перевантажувати таблицю

Я б не намагалася впхнути в table:

```text
before
after
reason
requestId
entityId
actorUserId
```

в окремих колонках.

На desktop це буде Excel, який випадково вдав себе за сайт 😄

Основні поля в таблиці.

Деталі — після відкриття row.

---

# 76. Filters UI

Для першої версії достатньо:

```text
Date from
Date to

Action
Entity type
```

Плюс технічно API підтримує:

```text
entityId
actorUserId
requestId
```

для future consumers / deep filtering.

---

# 77. Employees dependency не створюємо

На Stage 9 ще немає Employees CRUD.

Тому я б не будувала зараз:

```text
Employee dropdown
```

який мусить ходити в майбутній:

```text
GET /admin/employees/options
```

лише заради filter.

Це зайва залежність Stage 9 → Stage 21.

Коли Employees з'являться, actor filter можна красиво покращити.

---

# 78. Entity links

Так само поки не потрібно робити мертві links:

```text
Pharmacy → /admin/pharmacies/:id
```

якщо detail page ще не реалізована.

На Stage 9:

```text
entity label
+
entity ID у details
```

Після появи detail pages entity presentation можна перетворити на link.

---

# 79. Initial loading

Для першого завантаження:

```text
PageLoader
```

той самий shared.

Не створюємо `AuditLoader`.

---

# 80. Refetch loading

При:

```text
filter change
pagination
rows per page
```

краще не очищати весь screen до білого loader.

Можна залишати поточну layout/table structure і показувати pending state.

Але не створюємо зараз новий shared loading framework лише заради цієї сторінки.

---

# 81. Empty state

Потрібно розділити:

```text
Audit history ще порожня
```

і:

```text
No activity matches the selected filters
```

Це різні повідомлення.

---

# 82. Error state

Initial fetch error:

```text
shared ErrorPage
```

або page-level shared error pattern.

Refetch error після вже успішно завантажених даних не повинен обов'язково зносити весь екран.

Головне правило:

```text
API error ≠ fake empty activity
```

Не можна:

```ts
catch {
  return [];
}
```

---

# 83. Backend list response

Приблизно:

```ts
{
  items: [
    {
      id,

      actorUserId,
      actorNameSnapshot,

      action,

      entityType,
      entityId,
      entityLabelSnapshot,

      changedFields,
      reason,

      requestId,
      createdAt,
    }
  ],

  page,
  perPage,
  total,
  totalPages,
}
```

---

# 84. Backend details response

Приблизно:

```ts
{
  auditLog: {
    id,

    actorUserId,
    actorNameSnapshot,

    action,

    entityType,
    entityId,
    entityLabelSnapshot,

    before,
    after,
    changedFields,

    reason,

    requestId,
    createdAt,
  }
}
```

---

# 85. Runtime parser у admin

Frontend не повинен робити:

```ts
const data = (await response.json()) as AuditLogResponse;
```

Потрібні fail-closed parsers:

```text
parseAuditLogListResponse
parseAuditLogDetailsResponse
```

Перевіряємо:

```text
id
actor
action
entity type
entity ID
changedFields
requestId
createdAt
pagination
safe before/after values
```

Malformed backend response:

```text
→ error
```

а не:

```text
→ half-rendered table
```

---

# 86. Same-origin BFF

Browser:

```text
GET /api/admin/audit
```

і:

```text
GET /api/admin/audit/:auditLogId
```

Admin BFF:

```text
/apps/admin/src/app/api/admin/audit/...
```

Backend:

```text
GET /admin/audit
GET /admin/audit/:auditLogId
```

Architecture залишається:

```text
Browser
   ↓
same-origin Admin BFF
   ↓
API
   ↓
Mongo
```

---

# 87. Query params повинні проходити через BFF

List BFF повинен нормально прокидати:

```text
?page=...
&perPage=...
&dateFrom=...
&dateTo=...
&action=...
&entityType=...
```

без browser knowledge про backend origin.

---

# 88. Private cache policy

Audit history — приватні admin data.

Backend/BFF responses:

```text
Cache-Control: no-store
```

Ніякого:

```text
revalidate
public cache
CDN cache
```

---

# 89. Не передавати AuditLog у client storefront

Audit:

```text
admin-only
```

Немає причин додавати його:

```text
apps/client
apps/pharmacy
```

або робити shared browser API.

---

# 90. Shared UI не знає про Audit domain

Можемо перевикористовувати:

```text
DataTable
FilterDrawer
RowsPerPageSelect
Pagination
StatusBadge якщо доречно
Modal
Button
SelectField
Input
PageLoader
```

Але:

```text
AuditHistoryTable
AuditDetailsModal
AuditActionLabel
AuditFilters
```

живуть в:

```text
apps/admin
```

Не в:

```text
packages/ui
```

---

# 91. API client routes

У `@e-pharmacy/api-client/contracts` додаємо canonical backend paths.

Наприклад:

```ts
admin: {
  accessMe: '/admin/access/me',

  audit: {
    list: '/admin/audit',

    details: (auditLogId) =>
      `/admin/audit/${segment(auditLogId)}`,
  },
}
```

Не хардкодимо backend URL у BFF route.

---

# 92. Admin browser routes

У:

```text
apps/admin/src/lib/api/routes/admin-api-routes.ts
```

додаємо local same-origin contract:

```text
/api/admin/audit
/api/admin/audit/:id
```

---

# 93. Audit query schema

Backend має валідовувати query.

Наприклад:

```text
page
perPage

dateFrom
dateTo

action
entityType
entityId
actorUserId
requestId
```

Unknown:

```text
action
entityType
```

→ validation error.

Malformed:

```text
actorUserId
auditLogId
```

→ fail closed до database query.

---

# 94. Detail malformed ID

```text
GET /admin/audit/banana
```

не повинен робити безглуздий Mongo query.

Route params schema перевіряє ID до service.

Це продовжує той самий malformed-ID contract, який ми вже закладали в інших частинах проєкту.

---

# 95. Audit list permission

Routes:

```ts
GET / admin / audit;
```

і:

```ts
GET /admin/audit/:auditLogId
```

обидва:

```ts
requireAdminPermission(ADMIN_PERMISSIONS.audit.view);
```

Не можна зробити:

```text
list protected
details forgotten
```

---

# 96. Platform Owner

Platform Owner, як і в Stage 8:

```text
bypass regular permission checks
```

Отже бачить Activity history без необхідності мати:

```text
audit.view
```

explicitly у permissions array.

Це вже реалізовано canonical permission evaluator.

Stage 9 не додає:

```ts
if (isPlatformOwner)
```

у route.

---

# 97. Audit history itself не створює audit history

Перегляд:

```text
GET /admin/audit
```

не повинен породжувати:

```text
admin viewed audit
```

Інакше:

```text
відкрила history
→ з'явився history record
→ refresh
→ ще один record
→ refresh
→ ще...
```

Auditception 😄

Stage 9 логить mutations, не reads.

---

# 98. Не логувати navigation

Також не пишемо:

```text
admin opened Dashboard
admin opened Products
admin opened Settings
```

Це вже analytics/session activity, а не mutation audit.

---

# 99. Audit events не повинні залежати від UI

Audit action формується backend service.

Не:

```text
frontend button label
```

Тобто якщо UI:

```text
Activate
```

пізніше перейменуємо в:

```text
Approve pharmacy
```

audit action лишається:

```text
pharmacy.status.changed
```

---

# 100. Snapshot labels не є authoritative state

Наприклад:

```text
entityLabelSnapshot = Pharmacy ABC
```

— лише presentation snapshot.

Для authorization/business decisions ніколи не використовуємо AuditLog.

Audit collection:

```text
read-only history
```

а не source of truth.

---

# 101. AuditLog не замінює entity status history

Наприклад Product Request уже має власний:

```text
request.history
```

Stage 9 не обов'язково видаляє його.

Це різні рівні:

```text
ProductRequest.history
→ domain-specific workflow state

AuditLog
→ platform-wide "who changed what"
```

Можна мати обидва.

---

# 102. Не дублювати business logic в Audit service

Audit service не вирішує:

```text
чи можна activate pharmacy

чи можна reject request

чи можна remove Platform Owner
```

Це залишаються:

```text
domain/policy services
```

Audit writer лише перевіряє:

```text
audit payload correctness
security
snapshot format
```

---

# 103. DB failure policy

Якщо critical mutation потребує audit:

```text
AuditLog insert failed
```

результат:

```text
transaction rollback
```

Не:

```text
console.error(...)
return success
```

Це важливий invariant Stage 9.

---

# 104. Atomicity test — Pharmacy

Integration scenario:

```text
initial:
pharmacy.status = on_moderation
AuditLog count = N

simulate audit write failure

PATCH status → active

expect:
request failed

pharmacy.status =
on_moderation

AuditLog count =
N
```

---

# 105. Atomicity test — Product Request

Аналогічно:

```text
moderation change
+
audit
```

мають commit/rollback разом.

---

# 106. Atomicity test — Platform Owner

Особливо важливо для:

```text
isPlatformOwner
```

бо це security-sensitive mutation.

Не повинно існувати стану:

```text
owner changed
audit missing
```

---

# 107. Sanitizer tests

Окремо тестуємо, що audit writer відхиляє:

```text
password
accessToken
refreshToken
authorization
cookie
bankDetails
iban
Buffer
```

Навіть якщо хтось випадково передасть це в майбутньому service.

---

# 108. Safe snapshot tests

Дозволяємо:

```text
string
number
boolean
null
string[]
```

і нормальні safe keys.

Перевіряємо normalization:

```text
changedFields
```

---

# 109. Model tests

AuditLog model:

```text
createdAt exists

updatedAt does not exist

required fields required

action enum validated

entity type validated

no update-specific fields
```

---

# 110. Read API tests

Перевірити:

```text
admin with audit.view
→ 200

Platform Owner
→ 200

admin without audit.view
→ 403

revoked admin
→ 403

client
→ forbidden

pharmacy
→ forbidden

anonymous
→ auth failure
```

---

# 111. Filtering tests

Backend:

```text
by action

by entity type

by entity type + entity ID

by actor

by requestId

by date range
```

---

# 112. Pagination tests

Перевірити:

```text
default page

default perPage = 20

20 / 50 / 100 accepted

invalid perPage rejected

page < 1 rejected

total

totalPages

stable newest-first order
```

---

# 113. Details API tests

```text
valid ID
→ full safe audit record

missing
→ 404

malformed ID
→ fail closed

no audit.view
→ 403
```

---

# 114. Frontend parser tests

Перевірити malformed:

```text
action

entityType

changedFields

createdAt

before/after

pagination
```

Ніяких:

```text
as AuditLog
```

без runtime validation.

---

# 115. Navigation tests

Після Stage 9:

```text
audit.view
→ Settings / Activity history visible
```

```text
no audit.view
→ Activity history hidden
```

```text
Platform Owner
→ Activity history visible
```

```text
Activity history є єдиним доступним Settings child
→ Settings group visible
```

```text
жодного Settings permission
→ Settings hidden
```

---

# 116. Breadcrumb tests

```text
/admin/settings/activity

→ Settings
→ Activity history
```

Existing breadcrumb routes не повинні ламатися.

---

# 117. Page Permission Gate tests

```text
audit.view
→ activity content renders

no audit.view
→ protected content does not render

Platform Owner
→ renders

authorization loading
→ no protected content flash
```

---

# 118. Activity page React tests

Мінімально:

```text
loading

loaded list

empty history

empty filtered result

API failure

pagination

rows-per-page

filter change

open details

details failure
```

---

# 119. No sensitive value rendering

React/API tests мають також перевіряти, що response contract не містить:

```text
password
tokens
cookies
bankDetails
file content
```

Не просто «UI їх не показує».

Backend взагалі не повинен їх віддавати.

---

# 120. Structural checker

Я б додала:

```text
scripts/checks/admin/check-admin-audit.mjs
```

і root command:

```text
check:admin-audit
```

---

# 121. Що повинен перевіряти structural checker

Не потрібно regex-ом писати другий TypeScript compiler.

Але кілька invariants варто зафіксувати:

```text
audit.view досі є

Activity route існує

Activity navigation використовує audit.view

backend audit routes protected requireAdminPermission(audit.view)

AuditLog не має update/delete admin routes

AuditLog model не має updatedAt

Admin browser використовує same-origin /api

BFF використовує canonical api-client route

critical existing admin mutations викликають audit service

legacy admin pharmacy-create route відсутній
```

---

# 122. Checker не повинен шукати точну кількість рядків

Не робимо brittle перевірки типу:

```text
AuditLog model має бути рівно на рядку 37
```

або:

```text
component повинен називатися тільки ActivityHistoryTable
```

Перевіряємо architecture contract, а не форматування коду.

---

# 123. Existing Stage 1–8 regressions

Обов'язково залишаються зеленими:

```text
admin app shell

admin providers

admin status pages

admin auth foundation

admin protected route

admin shell

admin permissions

shared cabinet UI

client admin header

pharmacy layout

auth lifecycle

API boundaries

API client boundaries
```

Stage 9 не повинен перебудувати Stage 8 authorization.

---

# 124. `audit.view` не переносимо в нове місце

Canonical permission registry залишається там, де він уже є.

Не створюємо:

```text
AUDIT_PERMISSIONS = [...]
```

в Audit module.

Використовуємо існуючий:

```ts
ADMIN_PERMISSIONS.audit.view;
```

---

# 125. Не створювати `audit.create`

Permission:

```text
audit.create
```

не потрібен.

Admins не створюють audit records руками.

Так само зараз не потрібні:

```text
audit.edit
audit.delete
```

Є лише:

```text
audit.view
```

---

# 126. Не додавати audit permissions Platform Owner окремо

Platform Owner bypass уже вирішує це.

Не треба під час bootstrap записувати:

```text
audit.view
```

лише для того, щоб Owner побачив history.

---

# 127. Не використовувати AuditLog для rollback feature

Stage 9 не реалізує:

```text
Undo
Restore previous version
Rollback pharmacy
Rollback product
```

`before` існує для history.

Не для автоматичного відновлення domain objects.

Rollback потребує окремих business rules.

---

# 128. Не створювати event-sourcing architecture

Так само не треба перетворювати E-pharmacy на:

```text
event sourced system
```

Domain entities залишаються source of truth.

AuditLog — secondary append-only history.

Тобто:

```text
Current Pharmacy
≠
rebuild from AuditLog
```

---

# 129. Не додавати Kafka / RabbitMQ

Audit write критичний і локальний до Mongo transaction.

Не потрібно:

```text
Kafka
RabbitMQ
Redis Stream
event bus
outbox
```

для Stage 9.

У нас Mongo transactions уже є — саме це зараз найпростіше й найнадійніше.

---

# 130. Не робити asynchronous audit

Для critical admin mutations я б не робила:

```text
mutation success
→ queue audit job
→ maybe someday write history
```

Бо:

```text
queue failure
worker failure
deploy
restart
```

можуть залишити change без audit.

Тому зараз:

```text
synchronous
+
transactional
```

---

# 131. Performance

Audit insert:

```text
один маленький document
```

в межах admin mutation.

Це прийнятна ціна за correctness.

Read side індексуємо окремо.

Не потрібно кешувати Activity history.

---

# 132. Snapshot size

Я б додала limits на:

```text
actorNameSnapshot

entityId

entityLabelSnapshot

reason

requestId

changedFields count

array value length
```

щоб audit document не можна було випадково перетворити на 5 MB JSON.

---

# 133. Duplicate audit records

`requestId` не робимо:

```text
unique
```

Один HTTP request у майбутньому може легітимно породити кілька audit events.

Наприклад:

```text
approve request
├── request status changed
└── product created
```

Тому:

```text
requestId
```

— correlation field, не idempotency key AuditLog.

---

# 134. Audit record ID

Звичайний Mongo:

```text
_id
```

достатній.

Не треба додавати:

```text
auditNumber
AUD-2026-00001
```

якщо бізнес цього не вимагає.

---

# 135. Activity history і майбутні detail pages

Stage 9 я б одразу проєктувала так, щоб пізніше можна було зробити reusable admin component:

```text
EntityActivityHistory
```

який отримує:

```ts
entityType;
entityId;
```

і використовує той самий API.

Наприклад у Pharmacy detail:

```text
Overview
Products
Clients
Orders
Reviews
Activity
```

Activity:

```text
GET /api/admin/audit
?entityType=pharmacy
&entityId=...
```

---

# 136. Але Activity tab зараз не додаємо в майбутні pages

Бо цих detail pages ще немає.

Stage 9 створює API/component foundation.

Не fake Pharmacy page.

---

# 137. Орієнтовна backend structure

Я б очікувала приблизно:

```text
apps/api/src/

constants/
  admin-audit.ts

models/
  adminAuditLog.model.ts

types/
  admin-audit.ts

schemas/
  admin-audit.schema.ts

services/
  admin-audit.service.ts

controllers/
  admin-audit.controller.ts

routes/
  admin.routes.ts
```

Плюс integration у:

```text
admin.service.ts

product-request.service.ts

admin-owner.service.ts
```

---

# 138. Чому окремий `admin-audit.controller.ts`

Я б не продовжувала нескінченно роздувати:

```text
admin.controller.ts
```

бо надалі admin features буде багато.

Audit — вже самостійний resource.

Тому:

```text
admin-audit.controller.ts
admin-audit.service.ts
```

цілком виправдані.

---

# 139. Орієнтовна admin frontend structure

Наприклад:

```text
apps/admin/src/

app/
  admin/
    settings/
      activity/
        page.tsx

  api/
    admin/
      audit/
        route.ts

        [auditLogId]/
          route.ts

components/
  activity/
    ActivityHistory/
    ActivityHistoryTable/
    ActivityFilters/
    AuditDetailsModal/

lib/
  api/
    browser/
      admin-audit.api.ts

    routes/
      admin-api-routes.ts

  audit/
    admin-audit.ts
    admin-audit-presentation.ts
```

Не обов'язково створювати barrel для кожної папки.

---

# 140. Не робити barrel proliferation

Не потрібно:

```text
activity/index.ts
ActivityHistory/index.ts
AuditDetails/index.ts
audit/index.ts
```

на кожні три файли.

Barrel тільки там, де він реально є public boundary.

---

# 141. CSS

Audit page може мати свої:

```text
.module.css
```

але базові:

```text
buttons
inputs
table
pagination
modal
loader
```

беремо із shared UI.

Не копіюємо pharmacy table CSS цілком.

---

# 142. Responsive

Desktop/tablet:

```text
DataTable
```

Mobile:

потрібно переконатися, що audit row не перетворюється на горизонтальний поїзд із Варшави до Токіо.

Якщо shared `DataTable` уже має responsive strategy — використовуємо її.

Details на mobile:

```text
column layout
```

---

# 143. Accessibility

Filters:

```text
labels
```

Details modal:

```text
focus management
Escape
dialog semantics
```

Table actions:

```text
keyboard accessible
```

Change values не передаємо лише кольором:

```text
old
→
new
```

мають бути текстом.

---

# 144. Date/time accessibility

Не показуємо лише:

```text
2 hours ago
```

як authoritative history.

Основне:

```text
22 Sep 2026, 16:24
```

Relative time можна додати пізніше як secondary presentation.

---

# 145. Не логувати IP / User-Agent зараз

Я б не додавала на Stage 9:

```text
ipAddress
userAgent
deviceFingerprint
```

Це вже privacy/security logging concern.

Для поточного ТЗ достатньо:

```text
actor
action
entity
changes
reason
time
requestId
```

---

# 146. Не логувати session ID

Також не потрібно:

```text
sessionId
refreshSessionId
JWT id
```

Audit history не повинна ставати ще одним сховищем auth-sensitive metadata.

---

# 147. Stage 9 migration

Для AuditLog не потрібен migration script.

Collection створиться штатно при першому записі.

Не треба backfill'ити вигадані audit records за минулі admin changes.

---

# 148. Не генерувати fake historical audit

Не робимо:

```text
Existing Pharmacy active

→ створити fake audit:
"System activated pharmacy"
```

якщо такої реальної події AuditLog не бачив.

Історія починається з моменту введення Audit subsystem.

Це чесніше.

---

# 149. Bootstrap Platform Owner history

Так само старий:

```text
seed:admin-owner
```

я б не змушувала створювати fake AuditLog заднім числом.

Bootstrap — deployment/bootstrap operation, а Stage 9 Audit Log — runtime admin mutation history.

Майбутню зміну Platform Owner через admin flow вже логуватимемо.

---

# 150. Audit writer не доступний з seed як mandatory dependency

Не треба робити так, щоб:

```text
seed першого Platform Owner
```

зламався через відсутність actorUserId.

Перший bootstrap за своєю природою ще не має admin actor.

---

# 151. Manual verification — Pharmacy moderation

Сценарій:

```text
login as Platform Owner

change pharmacy:
on_moderation → active

open:
Settings → Activity history
```

Очікуємо:

```text
actor correct

pharmacy correct

status:
on_moderation → active

date correct

request ID exists
```

---

# 152. Manual verification — Product Request

```text
moderate request

open Activity history
```

Очікуємо відповідний:

```text
Product request status changed
```

і reason для reject.

---

# 153. Manual verification — permission visibility

Admin:

```text
audit.view = false
```

не бачить:

```text
Activity history
```

Admin:

```text
audit.view = true
```

бачить.

Platform Owner:

```text
бачить незалежно від permissions array
```

---

# 154. Manual verification — sensitive data

Після:

```text
pharmacy activation
product request approval
```

перевірити Mongo AuditLog document руками.

Там не повинно бути:

```text
password
JWT
cookie
bankDetails
documents binary
Authorization
full request body
```

Це окрема acceptance перевірка, не «ну наче ми цього не передавали».

---

# 155. Manual verification — rollback

Штучно змусити audit write впасти в integration environment.

Переконатися:

```text
domain mutation rollback
```

Це одна з найважливіших перевірок Stage 9.

---

# 156. Орієнтовні нові/оновлені checks

Root:

```text
check:admin-audit
```

включити в:

```text
check:admin
```

і:

```text
check:before-deploy
```

Не створюємо окремий ручний check, який ніколи не запускається CI/deploy pipeline.

---

# 157. Команди після реалізації

Мінімально:

```text
pnpm check:admin-audit

pnpm check:admin

pnpm lint

pnpm type-check

pnpm test

pnpm test:react

pnpm test:integration

pnpm build

pnpm check:before-deploy
```

---

# 158. Definition of Done

Stage 9 завершений, коли:

- [ ] існує append-only `AdminAuditLog` / `AuditLog` model;
- [ ] AuditLog має `actorUserId`;
- [ ] AuditLog має `actorNameSnapshot`;
- [ ] actor snapshot визначається backend;
- [ ] frontend не може підмінити actor;
- [ ] існує canonical audit action registry;
- [ ] існує canonical audit entity-type registry;
- [ ] `entityId` не прив'язаний жорстко до одного типу domain identifier;
- [ ] є `entityLabelSnapshot`;
- [ ] `before` містить лише safe audited fields;
- [ ] `after` містить лише safe audited fields;
- [ ] `changedFields` normalized/deduplicated;
- [ ] no-op mutation не створює audit record;
- [ ] `reason` підтримується для відповідних mutations;
- [ ] `requestId` береться з server request context;
- [ ] `createdAt` зберігається як Date;
- [ ] `updatedAt` для audit records відсутній;
- [ ] немає public create AuditLog endpoint;
- [ ] немає AuditLog update endpoint;
- [ ] немає AuditLog delete endpoint;
- [ ] немає AuditLog TTL;
- [ ] видалення actor/entity не видаляє audit history;
- [ ] passwords не можуть потрапити в AuditLog;
- [ ] JWT/tokens не можуть потрапити в AuditLog;
- [ ] cookies/Authorization не можуть потрапити в AuditLog;
- [ ] file binary не може потрапити в AuditLog;
- [ ] bank data не може потрапити в AuditLog;
- [ ] є defensive sensitive-field validation;
- [ ] unsafe audit payload fail-closed;
- [ ] AuditLog writer централізований;
- [ ] domain services не пишуть напряму `AuditLog.create`;
- [ ] pharmacy status change логиться;
- [ ] pharmacy status audit знаходиться в тій самій transaction;
- [ ] product request moderation логиться;
- [ ] product request audit знаходиться в тій самій transaction;
- [ ] Platform Owner grant/revoke логиться;
- [ ] Platform Owner audit знаходиться в owner transaction;
- [ ] audit write failure rollback'ить critical mutation;
- [ ] failed/no-op mutation не створює fake audit event;
- [ ] legacy `POST /admin/pharmacies` прибраний відповідно до цільової архітектури;
- [ ] є indexes для global history;
- [ ] є index для entity history;
- [ ] є index для actor history;
- [ ] є index для action history;
- [ ] є lookup/index для requestId;
- [ ] `GET /admin/audit` існує;
- [ ] `GET /admin/audit/:auditLogId` існує;
- [ ] обидва endpoints захищені `audit.view`;
- [ ] Platform Owner проходить через existing canonical bypass;
- [ ] list endpoint має pagination;
- [ ] list endpoint newest-first;
- [ ] perPage узгоджений із shared `20 / 50 / 100`;
- [ ] підтримується date filtering;
- [ ] підтримується action filtering;
- [ ] підтримується entity-type filtering;
- [ ] підтримується `entityType + entityId`;
- [ ] підтримується actor filter contract;
- [ ] підтримується requestId lookup;
- [ ] malformed params fail-closed;
- [ ] private audit responses використовують `no-store`;
- [ ] browser працює лише через same-origin `/api/admin/*`;
- [ ] canonical backend routes додані в `@e-pharmacy/api-client`;
- [ ] frontend runtime parsers fail-closed;
- [ ] `ADMIN_ROUTES.SETTINGS_ACTIVITY` існує;
- [ ] `Activity history` доданий у Settings;
- [ ] navigation item використовує `audit.view`;
- [ ] breadcrumbs `Settings → Activity history` працюють;
- [ ] Activity page має page-level permission gate;
- [ ] Activity page не є security boundary;
- [ ] initial loading не перетворюється на fake empty table;
- [ ] fetch error не перетворюється на zero activity;
- [ ] empty history state існує;
- [ ] empty filtered state існує;
- [ ] Activity table responsive;
- [ ] Audit details доступні з row;
- [ ] details показують before → after;
- [ ] details показують reason;
- [ ] details показують request ID;
- [ ] shared Cabinet UI не знає про Audit domain;
- [ ] немає Employees dependency лише для filters;
- [ ] немає fake entity detail pages;
- [ ] немає audit writes для GET/navigation;
- [ ] AuditLog не використовується як domain source of truth;
- [ ] AuditLog не перетворюється на event-sourcing subsystem;
- [ ] немає queue/event-bus dependency;
- [ ] немає IP/User-Agent/session secrets у AuditLog;
- [ ] sanitizer tests проходять;
- [ ] audit model tests проходять;
- [ ] audit atomicity integration tests проходять;
- [ ] pharmacy audit tests проходять;
- [ ] product request audit tests проходять;
- [ ] Platform Owner audit tests проходять;
- [ ] read API authorization tests проходять;
- [ ] filtering tests проходять;
- [ ] pagination tests проходять;
- [ ] frontend parser tests проходять;
- [ ] navigation tests проходять;
- [ ] breadcrumb tests проходять;
- [ ] Permission Gate tests проходять;
- [ ] Activity History React tests проходять;
- [ ] Stage 1–8 regression checks проходять;
- [ ] `check:admin-audit` інтегрований у `check:admin`;
- [ ] `check:admin-audit` інтегрований у `check:before-deploy`;
- [ ] `pnpm lint` проходить;
- [ ] `pnpm type-check` проходить;
- [ ] `pnpm test` проходить;
- [ ] `pnpm test:react` проходить;
- [ ] `pnpm test:integration` проходить;
- [ ] `pnpm build` проходить;
- [ ] `pnpm check:before-deploy` проходить.

---

# 159. Архітектура після Stage 9

У результаті отримуємо:

```text
                       Admin request
                            │
                            ▼
                    Authentication
                            │
                            ▼
                     AdminAccess
                            │
                            ▼
                 Permission evaluation
                            │
                            ▼
                     Domain service
                            │
                  Mongo transaction
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
            Domain mutation        AuditLog
                 │                     │
                 └──────────┬──────────┘
                            │
                          COMMIT
```

Read side:

```text
Admin
  │
  ▼
Settings
  │
  ▼
Activity history
  │
  ▼
same-origin /api/admin/audit
  │
  ▼
GET /admin/audit
  │
  ▼
require audit.view
  │
  ▼
AuditLog
```

---

# 160. Як наступні stages користуватимуться Stage 9

Після цього кожен новий admin mutation робиться за правилом:

```text
1. Permission check

2. Load authoritative entity

3. Validate business rules

4. Determine safe before snapshot

5. Apply mutation

6. Determine safe after snapshot

7. Append AuditLog

8. Commit transaction
```

Наприклад майбутній Product edit:

```text
products.edit

Product update
+
product.updated audit event
```

Categories:

```text
categories.edit

Category update
+
category.updated audit event
```

Employee permissions:

```text
employees.managePermissions

AdminAccess update
+
admin.permissions.changed
```

Reviews:

```text
productReviews.moderate

Review moderation
+
review.status.changed
```

І вже не треба думати:

> «А як ми взагалі будемо вести історію?»

Механізм готовий.

---

# 161. Головний architectural verdict Stage 9

Після Stage 9 Admin переходить від:

```text
admin може щось змінити
```

до:

```text
admin може щось змінити

і система гарантовано знає:

хто
що
де
коли
з чого
на що
і в межах якого request
```

При цьому Audit Log:

```text
не бачить secrets
не є source of truth
не редагується
не видаляється через UI
не покладається на frontend
не записується "потім"
```

а critical mutation + audit:

```text
commit разом
або rollback разом
```

Саме після такого фундаменту я б уже спокійно переходила до наступних admin features.

---

# 162. Коміт для Stage 9

Я б використала:

```text
feat(admin): add audit log and activity history
```

Або трохи більше infrastructure-oriented:

```text
feat(admin): add transactional audit logging
```

Але перший варіант точніше описує весь Stage 9, бо тут буде і backend foundation, і реальна сторінка `Activity history`.

Тут я свідомо не заходжу в Stage 10+: немає Employees CRUD, permission editor, Pharmacy admin pages чи інших майбутніх сутностей. Водночас Stage 9 уже підготовлений так, щоб усі вони потім підключали audit без повторного архітектурного рефакторингу.

//=============================================================

Готово 🙂 Зібрала Stage 9 — Audit log окремим patch-архівом: у ньому 34 лише нових/змінених файли, які потрібно накласти на актуальний проєкт після Stage 8. Нічого зі Stage 10+ не додавала.

📦 Завантажити архів Stage 9

Архів має правильну структуру від кореня репозиторію (apps/admin, apps/api, packages/api-client, scripts, package.json) і містить, зокрема, transactional Audit Log, safe snapshots із захистом sensitive data, audit для pharmacy moderation / Product Request moderation / Platform Owner changes, GET /admin/audit, same-origin Admin BFF, Settings → Activity history, filters/pagination/details, runtime parsers, тести, README-9.md та check:admin-audit. Legacy POST /admin/pharmacies прибраний — тимчасову логіку навколо нього не будувала.

Перевірено: Stage 1–9 structural checks пройшли, admin type-check пройшов, api-client type-check пройшов, архів перевірений на цілісність. Повний pnpm check:before-deploy у цьому середовищі не запускався, бо тут немає доступного pnpm/мережі та локальних node_modules для apps/api.

Коміт для цих змін:

feat(admin): add audit log and activity history

Тобто після розпакування архіву поверх твоєї актуальної ревізії матимемо готові Stage 1–9, а Stage 10 поки чемно стоїть за дверима й не лізе 😄
