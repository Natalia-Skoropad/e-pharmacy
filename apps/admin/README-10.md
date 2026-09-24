Супер, що Stage 9 уже зелений 🙂 І так — **сторінки Login / Password Recovery / Reset Password треба додати саме зараз, у Stage 10**. Backend-контракти для admin-auth ми заклали ще на Stage 3, але UI тоді навмисно не створювали. Тепер без нього Admin Profile виходив би трохи кумедним: профіль є, а зайти до нього треба через вентиляцію 😄

Я б тому трохи розширила назву етапу:

# 15. ЕТАП 10 — Admin Auth UI + Admin Profile

## 1. Головна мета Stage 10

Після цього етапу повинен існувати **перший повністю робочий user flow Admin Cabinet**:

```text
Admin employee
      │
      ▼
/login
      │
      │ email + password
      ▼
Admin authentication
      │
      ▼
Admin access verification
      │
      ▼
/admin/profile
      │
      ├── Personal information
      ├── Documents
      ├── Comments
      └── Active sessions
```

І окремо:

```text
Forgot password
      │
      ▼
/password-recovery
      │
      ▼
email reset link
      │
      ▼
/reset-password
      │
      ▼
new password
      │
      ▼
/login
```

Тобто після Stage 10 ти вже реально можеш:

```text
1. відкрити Admin app;
2. увійти під Platform Owner;
3. відкрити свій Profile;
4. побачити свої дані;
5. змінити фото;
6. за потреби змінити пароль;
7. переглянути активні сесії;
8. вийти;
9. відновити пароль через email.
```

---

# 2. Чому Login / Recovery / Reset логічно додати саме зараз

Stage 3 уже підготував backend:

```text
application = admin
```

для:

```text
login
forgot password
reset password
```

Уже закладено:

```text
ADMIN_APP_URL
```

для формування admin reset link.

Уже немає public admin registration.

Stage 4 уже створив:

```text
AdminProtectedRoute
```

Stage 7:

```text
Admin Shell
```

Stage 8:

```text
AdminAccess
permissions
Platform Owner
```

Stage 9:

```text
Audit Log
```

Тобто зараз усі фундаментальні dependencies готові.

Саме Stage 10 є першою точкою, де Login UI перестає бути «передчасною сторінкою» і стає частиною завершеного flow.

---

# 3. Що зараз фактично відсутнє

В актуальному `apps/admin` уже є:

```text
/api/auth/me
/api/auth/logout

AuthProvider
AdminProtectedRoute
AdminAuthorizationProvider
```

але немає:

```text
/login page

/password-recovery page

/reset-password page

/api/auth/login

/api/auth/password-reset/request

/api/auth/password-reset/confirm

/api/auth/password

/api/auth/sessions

/api/auth/sessions/:sessionId

/admin/profile
```

Також поточний Admin `AuthProvider` передає shared auth core лише:

```text
getCurrentUser
logout
```

але ще не:

```text
login
logoutAll
```

Stage 10 це завершить.

---

# 4. Порядок роботи всередині Stage 10

Я б робила Stage 10 в такій послідовності:

```text
10.1 Shared Auth UI
10.2 Admin Login / Recovery / Reset
10.3 Shared Profile UI extraction
10.4 Pharmacy Profile migration
10.5 Admin Employee self-profile backend
10.6 Admin Profile UI
10.7 Documents
10.8 Private Comments
10.9 Active Sessions
10.10 Change Password
10.11 Audit integration
10.12 Tests + structural checks
```

Саме в такому порядку.

---

# 5. Спочатку — reusable Auth UI

Тут ситуація дуже схожа на Pharmacy Profile.

У client уже є:

```text
AuthFormShell
LoginForm
PasswordRecoveryForm
ResetPasswordForm
```

Але просто зробити:

```text
copy
client/components/auth
→
admin/components/auth
```

я б не стала.

---

# 6. Що саме перевикористовуємо з client auth

У shared UI я б винесла **presentation/layout**, а application logic залишила в конкретних apps.

Наприклад:

```text
packages/ui/src/auth/

AuthPageShell
AuthFormLayout
AuthFormFooter
```

або близьку невелику структуру.

Shared повинні бути:

```text
illustration + card layout

title / description layout

form spacing

footer layout

responsive auth page layout
```

Уже shared залишаються:

```text
EmailInput
PasswordInput
Button
TextActionButton
Breadcrumbs
Container
```

---

# 7. `AuthPageShell`

Поточний client:

```text
AuthFormShell
```

я б перетворила на справді shared:

```text
AuthPageShell
```

з параметрами на кшталт:

```text
title
description
breadcrumbs
image
showHeader
showDescription
children
```

Тоді:

```text
Client Login
Client Password Recovery
Client Reset Password

Admin Login
Admin Password Recovery
Admin Reset Password
```

використовують один layout.

---

# 8. Не переносити client business logic у shared UI

Shared компонент не повинен знати:

```text
client
pharmacy
admin

application
login API
reset API
router destination
```

Тобто:

```text
@e-pharmacy/ui/auth
```

відповідає лише за UI.

А:

```text
apps/client
apps/admin
```

— за behavior.

---

# 9. Client auth теж треба перевести на shared shell

Щоб це було реальне перевикористання, а не:

```text
shared component created
Admin uses it
Client continues using old duplicate
```

поточний client `AuthFormShell` треба або:

```text
замінити shared AuthPageShell
```

або залишити дуже тонким adapter над shared компонентом.

Не повинно залишитися двох однакових auth layouts.

---

# 10. Ілюстрація

Admin auth pages стилістично мають повторювати client:

```text
image
+
form card
```

Можна використовувати ту саму:

```text
authorization.png
```

Не потрібно малювати окрему «адмінську людину з ноутбуком, але цього разу дуже серйозну» 🙂

---

# 11. Admin auth routes

У `ADMIN_ROUTES` додаємо:

```ts
LOGIN: '/login',

PASSWORD_RECOVERY: '/password-recovery',

RESET_PASSWORD: '/reset-password',

PROFILE: '/admin/profile',
```

---

# 12. Registration route НЕ додаємо

В Admin app не існує:

```text
/register
```

І не існує:

```text
/api/auth/register
```

Навіть якщо shared backend має:

```text
POST /auth/register
```

Admin frontend не повинен його exposing.

---

# 13. Чому Admin registration відсутня

Registration admin employee пізніше відбуватиметься через:

```text
Settings
→ Employees
→ Create employee
```

Тобто:

```text
public registration
```

для admin ніколи не потрібна.

---

# 14. Admin Login page

Route:

```text
/login
```

Сторінка:

```text
illustration

Login

Email
Password

Forgot password?

Log in
```

Без:

```text
Register
```

Без:

```text
I am a client
I am a pharmacy owner
```

---

# 15. «Поле логіну» фактично залишається email

Я б тут не вводила новий:

```text
username
loginName
adminLogin
```

Бо canonical identity зараз:

```text
email
```

Stage 3 уже спеціально зафіксував:

```text
не створюємо username
```

Тому UI може називатися:

```text
Email
```

або, якщо хочеш саме слово Login:

```text
Login (email)
```

але backend payload залишається:

```ts
{
  email,
  password,
  application: 'admin'
}
```

---

# 16. `application` не вибирається користувачем

Admin Login ніколи не відправляє значення з radio/select.

Завжди:

```ts
application: 'admin';
```

Hardcoded application context у frontend service.

---

# 17. Admin Login BFF

Browser:

```text
POST /api/auth/login
```

BFF:

```text
POST /auth/login
```

через existing:

```text
createAuthProxyRoute
```

із:

```text
markerAction: set
```

так само, як у client.

---

# 18. Admin AuthProvider після Stage 10

Замість:

```text
getCurrentUser
logout
```

матиме:

```text
getCurrentUser
login
logout
logoutAll
```

Не створюємо окремий auth engine.

Продовжуємо використовувати:

```text
AuthProviderCore
```

---

# 19. Guest-only Login

`/login` повинен бути guest route.

Тобто authenticated admin, який відкриває:

```text
/login
```

не повинен бачити Login form.

Використовуємо existing shared:

```text
GuestOnlyRoute
```

або thin Admin adapter над ним.

---

# 20. Guest auth layout

Я б зробила route groups приблизно так:

```text
app/

(auth)/
  (guest)/
    login/
    password-recovery/
    layout.tsx

  reset-password/
```

Reset Password я б, як у client, не прив'язувала жорстко до guest-only.

Бо reset link може бути відкритий, поки в browser ще існує стара session.

---

# 21. Login redirect

Якщо користувач потрапив на Login через:

```text
/admin/profile
```

отримуємо:

```text
/login?redirect=/admin/profile
```

Після успіху:

```text
/admin/profile
```

---

# 22. Direct Login

Якщо користувач відкрив:

```text
/login
```

напряму, default destination Stage 10 я б зробила:

```text
/admin/profile
```

Чому не:

```text
/admin/dashboard
```

?

Бо справжній Dashboard буде Stage 12.

Не створюємо fake Dashboard лише для redirect.

---

# 23. Це краще за тимчасовий Dashboard

Не робимо:

```text
/admin/dashboard

Hello admin!
Dashboard coming soon
```

лише для того, щоб Login мав destination.

Після Login ми вже маємо справжню сторінку:

```text
/admin/profile
```

Туди й ведемо.

---

# 24. Redirect повинен бути safe

Не можна дозволити:

```text
/login?redirect=https://evil.example
```

і після Login виконати:

```text
window.location = redirect
```

Admin login redirect:

```text
тільки trusted internal admin path
```

Для external client/pharmacy redirects уже є окремий canonical mechanism.

---

# 25. Wrong role після Login

Якщо хтось на Admin Login вводить credentials:

```text
client
```

або:

```text
pharmacy
```

backend application contract не повинен створити нормальний Admin login flow.

Не треба frontend'у після цього вигадувати role switching.

---

# 26. Blocked admin

Якщо:

```text
User.status = blocked
```

Admin login не дає private access.

Stable auth behavior Stage 3 зберігається.

---

# 27. Revoked AdminAccess

Це інший випадок:

```text
User authentication = valid
AdminAccess = revoked
```

Login може authentication завершити.

А далі:

```text
AdminAuthorizationProvider
```

показує:

```text
Admin access has been revoked
```

Ці два рівні не змішуємо.

---

# 28. Password Recovery page

Route:

```text
/password-recovery
```

Містить:

```text
illustration

Password recovery

Email

Send reset link

Back to login
```

---

# 29. Password Recovery application

Payload:

```ts
{
  email,
  application: 'admin'
}
```

Again:

```text
application
```

не вибирається user.

---

# 30. Password enumeration protection

Після submit:

```text
known admin email
unknown email
```

мають отримувати однаковий public UX:

```text
If an account with that email exists,
you will receive password reset instructions.
```

Не:

```text
Admin with this email does not exist.
```

---

# 31. Password Recovery BFF

```text
POST /api/auth/password-reset/request
```

→

```text
POST /auth/password-reset/request
```

через existing shared proxy.

---

# 32. Reset Password page

Route:

```text
/reset-password
```

Містить:

```text
illustration

New password
Confirm password

Save new password

Request a new reset link
```

---

# 33. Reset token contract

Не зберігаємо token:

```text
localStorage
sessionStorage
cookie
```

Поточний client уже має правильний helper, який:

```text
captures token

removes token from visible URL

keeps it temporarily in history.state
```

Цю логіку я б **не копіювала в Admin**.

---

# 34. Reset token helper треба зробити shared

Поточний:

```text
client/src/lib/auth/reset-password-token.ts
```

за своєю природою не client-domain.

Я б перенесла його в:

```text
@e-pharmacy/auth
```

наприклад:

```text
@e-pharmacy/auth/reset-password
```

і використовувала:

```text
client
+
admin
```

---

# 35. Reset confirm payload

Залишається:

```ts
{
  (token, newPassword);
}
```

Не додаємо:

```text
application
email
userId
role
```

Backend уже знає account із reset token.

---

# 36. Reset Password BFF

```text
POST /api/auth/password-reset/confirm
```

із:

```text
cookieCleanup: on-success
```

---

# 37. Після успішного reset

Показуємо:

```text
Password changed successfully
```

і кнопку:

```text
Continue to login
```

або redirect після явної дії.

---

# 38. Auth metadata

Login / Recovery / Reset:

```text
noindex
nofollow
```

Admin app і так закритий від indexing, але page metadata повинна лишатися узгодженою.

---

# 39. Після Auth UI — Profile refactor

Тут важлива твоя початкова вимога:

```text
PharmacyProfilePageContent.tsx
```

не копіюємо.

Взагалі.

---

# 40. Що зараз дублюється між profile flows

Вже зараз client/pharmacy мають дуже схожі блоки:

```text
picture

personal data

change password

active sessions
```

Pharmacy додатково має:

```text
documents
comments
```

Admin також потребує:

```text
picture
personal information
change password
documents
comments
sessions
```

Отже спільність реальна, а не придумана «для архітектурної краси».

---

# 41. Shared profile package

Я б додала:

```text
packages/ui/src/profile/
```

і public export:

```text
@e-pharmacy/ui/profile
```

---

# 42. Shared profile components

Орієнтовно:

```text
ProfileIdentityCard

ProfilePictureEditor

ChangePasswordForm

DocumentsPanel

ActiveSessionsPanel

ProfileTabsLayout
```

Для comments можемо використовувати вже існуючі:

```text
CommentComposer
CommentsList
```

---

# 43. Не робити shared profile components domain-aware

`ProfileIdentityCard` не повинен знати:

```text
pharmacy
admin
client
moderation
permissions
Platform Owner
```

Йому передають:

```text
name
email
picture
roleLabel
status
```

---

# 44. Shared component не робить API requests

Неправильно:

```text
ProfilePictureEditor
  → PATCH /api/admin/...
```

Правильно:

```text
ProfilePictureEditor
  → onSave(...)
```

API належить app.

---

# 45. Не створювати супер-універсальний `PersonalDataForm`

Я б тут трохи уточнила початковий план.

Не треба створювати form-конструктор на 47 props:

```text
fields
schema
fieldConfig
dynamicMapper
mode
permissions
formatter
...
```

лише щоб один component міг малювати абсолютно всі profiles.

Це вже буде абстракція заради абстракції.

---

# 46. Що справді shared

Shared:

```text
profile layout
picture editor
password form
sessions
documents presentation
tabs shell
identity presentation
```

А конкретні forms:

```text
PharmacyPersonalDataForm
AdminPersonalInformation
```

можуть залишатися app-specific.

---

# 47. Pharmacy Profile після refactor

Pharmacy profile:

```text
ProfileTabsLayout
├── ProfileIdentityCard
│   └── ProfilePictureEditor
│
├── My data
│   └── shared ChangePasswordForm
│
├── Pharmacy data
├── About pharmacy
├── Payment details
│
├── Documents
│   └── shared DocumentsPanel
│
├── Reviews
│
├── Comments
│
└── Active sessions
    └── shared ActiveSessionsPanel
```

---

# 48. Pharmacy-specific logic залишається в Pharmacy

Не переносимо в shared:

```text
working hours

pharmacy status

pending moderation

bank details

send for verification

pharmacy reviews

pharmacy moderation
```

---

# 49. `PharmacyProfilePageContent.tsx` треба зменшити

Після Stage 10 він уже не повинен inline реалізовувати заново:

```text
picture editor

password form

session item rendering

generic documents layout
```

Саме так Admin не буде змушений копіювати їх.

---

# 50. Comments shared type зараз треба трохи виправити

Поточний shared:

```text
@e-pharmacy/ui/feedback/Comments
```

типізований через:

```text
PharmacyNote
```

Це означає, що формально shared UI знає pharmacy domain.

До Admin Comments це треба виправити.

---

# 51. Comments UI повинно працювати з generic note presentation

Наприклад:

```ts
type CommentListItem = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    displayName: string;
  };
};
```

Тоді:

```text
PharmacyNote
AdminEmployeePrivateNote
```

можуть обидва рендеритися через один UI.

---

# 52. Pharmacy Note backend не чіпаємо

Ми не перетворюємо:

```text
PharmacyNote
```

на:

```text
EverythingNote
```

Backend domains залишаються різні.

Універсалізуємо лише presentation contract.

---

# 53. Admin Profile route

Додаємо:

```text
/admin/profile
```

---

# 54. Profile НЕ потрібен окремий permission

Доступ до **власного profile** не повинен залежати від:

```text
employees.view
employees.edit
```

Інакше admin employee без Employee permissions навіть пароль собі не змінить.

Тому:

```text
authenticated admin
+
active AdminAccess
```

достатньо.

---

# 55. Profile і AdminAuthorizationProvider

Route все одно знаходиться всередині:

```text
AdminProtectedRoute
+
AdminAuthorizationProvider
+
AdminShell
```

Отже revoked employee profile не відкриває.

---

# 56. Profile item у desktop UserDropdown

Stage 10 додає:

```text
Profile
```

у:

```text
AdminHeader → UserDropdown
```

Орієнтовно:

```text
Profile

Go to the website

─────────

Log out
```

---

# 57. Profile у mobile

Admin Mobile Menu також повинен мати:

```text
Profile
```

щоб mobile user не мав profile route, доступний лише через ручне введення URL 🙂

---

# 58. Profile не додаємо в основне ліве меню

Я б не робила:

```text
Dashboard
Profile
Pharmacy owners
...
```

Profile — account-level route.

Нормальне місце:

```text
User menu
```

---

# 59. Breadcrumbs

Для:

```text
/admin/profile
```

breadcrumbs:

```text
Profile
```

Без:

```text
Settings → Profile
```

Бо profile не є system setting.

---

# 60. Admin Profile layout

Ліва частина:

```text
photo

upload/delete photo

name

email

role

status
```

Права:

```text
Tabs
```

---

# 61. Tabs

Рівно:

```text
Personal information

Documents

Comments

Active sessions
```

Не додаємо зараз:

```text
Permissions
Activity history
Employee information
Position
Audit
```

Це інші concerns.

---

# 62. Role presentation

Не треба показувати просто:

```text
role: admin
```

як єдиний meaningful label.

З AdminAccess ми вже знаємо:

```text
isPlatformOwner
```

Тому UI:

```text
Platform Owner
```

або:

```text
Admin employee
```

---

# 63. Position не показуємо

Stage 21/22 ще не реалізували actual Employee/Position management.

Тому не придумуємо:

```text
Director
Moderator
Administrator
```

із повітря.

---

# 64. Status

Profile показує canonical user status:

```text
Active
Blocked
```

Але фактично blocked user не повинен нормально залишатися в private app.

AdminAccess revoked також уже обробляється authorization layer до profile.

---

# 65. Personal Information — Regular Employee

Для звичайного employee:

```text
Name
readonly

Email
readonly
```

І нижче:

```text
Change password
```

доступний.

---

# 66. Regular Employee НЕ використовує `/auth/current` для edit

Ми взагалі не даємо йому edit name/email.

Frontend readonly — UX.

Backend policy — security.

---

# 67. Platform Owner Personal Information

Platform Owner:

```text
Name
editable

Email
editable
```

---

# 68. Owner edit не робимо через generic `/auth/current`

Це важлива межа.

Не розширюємо:

```text
PATCH /auth/current
```

до:

```text
admin може змінювати email
owner щось може
employee щось не може
...
```

Інакше generic auth endpoint почне знати Admin business policy.

---

# 69. Narrow employee self endpoint

Я б додала:

```text
PATCH /admin/employees/me/profile
```

або близький canonical path.

Саме **self employee endpoint**, а не Stage 21 Employees CRUD.

---

# 70. Чому `/admin/employees/me/profile`

Він чітко каже:

```text
admin employee domain

current employee only

profile-specific mutation
```

І не створює ще:

```text
/admin/employees
/admin/employees/:id
```

CRUD зі Stage 21.

---

# 71. Self endpoint не означає Employees Stage

Stage 10 endpoint:

```text
/admin/employees/me/profile
```

не повинен мати:

```text
list employees
create employee
edit another employee
delete employee
permissions
position
access revoke
```

Тільки self profile.

---

# 72. Profile update payload

Орієнтовно:

```text
name
email
pictureUrl
expectedRevision
```

---

# 73. Field-level policy

Regular employee може змінити:

```text
pictureUrl
```

Platform Owner може:

```text
pictureUrl
name
email
```

---

# 74. Backend визначає Platform Owner

Не frontend:

```json
{
  "isPlatformOwner": true
}
```

🙂

Backend використовує:

```text
req.adminAuthorization
```

зі Stage 8.

---

# 75. Email validation

Owner email update використовує canonical:

```text
normalization
validation
uniqueness
```

Той самий email не повинен отримувати два Users.

---

# 76. Concurrency

Self profile update повинен використовувати вже знайомий:

```text
expectedRevision
```

щоб два відкриті browser tabs не затерли зміни один одного.

---

# 77. Після profile update

Backend повертає updated:

```text
AuthUser
```

Frontend викликає:

```text
applyCurrentUser(updatedUser)
```

і одразу оновлюються:

```text
Header
UserBadge
Profile
Client header presentation
```

без logout/login.

---

# 78. Profile picture

Photo edit доступний:

```text
regular employee
Platform Owner
```

Бо це self presentation, не employee management.

---

# 79. Picture validation

Перевикористовуємо existing:

```text
PICTURE_ACCEPT

buildPictureFileError

buildPictureUrlError

readFileAsDataUrl
```

Не створюємо окремі Admin picture rules без причини.

---

# 80. Picture delete

Delete photo:

```text
pictureUrl: null
```

або canonical clearable representation endpoint'а.

Не зберігаємо:

```text
''
```

як business data, якщо model використовує unset.

---

# 81. Admin Profile не показує Pharmacy-specific UI

Немає:

```text
Pharmacy Profile status

Send for verification

Pending moderation

Pharmacy details

Working hours

About pharmacy

Payment details

Reviews
```

---

# 82. Change Password — це auth concern

Тут, навпаки, **не треба створювати admin employee password endpoint**.

Для password правильний existing endpoint:

```text
PATCH /auth/current/password
```

Бо це authentication lifecycle.

---

# 83. Admin password BFF

Додаємо:

```text
PATCH /api/auth/password
```

через:

```text
createPrivateProxyRoute
```

---

# 84. Change Password form

Shared:

```text
Current password

New password

Confirm new password

Change password
```

Validation уже існує в:

```text
@e-pharmacy/validation/profile
```

---

# 85. Password rules не змінюємо

Не створюємо «сильніший пароль для Admin», якщо такого бізнес-вимоги немає.

Canonical password contract має бути один.

---

# 86. Після зміни password

Поточний auth security lifecycle вже робить важливу річ:

```text
password update
+
revoke sessions
```

Stage 10 має зберегти це.

---

# 87. Admin після password change

Після success:

```text
auth cookies cleared

invalidateSession('password_changed')

redirect /login
```

і користувач входить уже новим password.

Саме той flow, який тобі потрібен.

---

# 88. Не залишати profile після password change

Неправильно:

```text
Password changed successfully
```

але old auth session UI продовжує виглядати authenticated.

Після security mutation state повинен одразу синхронізуватися.

---

# 89. Documents — окремий domain

Повністю погоджуюся:

```text
PharmacyDocumentFile
```

не використовуємо.

Навіть якщо структура файлу схожа.

---

# 90. Новий model

Я б зробила:

```text
AdminEmployeeDocument
```

або:

```text
AdminEmployeeDocumentFile
```

Другий варіант точніше, якщо document реально містить binary.

---

# 91. Орієнтовні поля document

```text
_id

ownerUserId

uploadedByUserId

name

size

type

sha256

content

createdAt

updatedAt
```

---

# 92. `content`

Як і в Pharmacy document:

```text
Buffer
select: false
```

Не повинен повертатися звичайним list query.

---

# 93. `ownerUserId`

Головний access boundary:

```text
document.ownerUserId
```

Для self profile:

```text
ownerUserId === currentUser.id
```

---

# 94. Document rules окремі

Не використовуємо:

```text
PHARMACY_DOCUMENT_RULES
```

як admin business constant.

Можемо перевикористати низькорівневі validators, але створити:

```text
ADMIN_EMPLOYEE_DOCUMENT_RULES
```

Навіть якщо зараз:

```text
mime types
size
```

однакові.

Domains різні.

---

# 95. Regular employee Documents

Може:

```text
list own documents

download own document
```

Не може:

```text
upload
replace
delete
```

---

# 96. Platform Owner Documents

На власному profile може:

```text
upload

replace

delete

download
```

---

# 97. Чому саме owner може mutate

Це відповідає твоєму contract.

Пізніше Stage Employees дасть Owner можливість керувати документами інших employees через Employee Detail.

Зараз цього UI/API не додаємо.

---

# 98. Self document API

Мінімально:

```text
GET
/admin/employees/me/documents

GET
/admin/employees/me/documents/:documentId
```

Для Platform Owner:

```text
POST
/admin/employees/me/documents

PUT
/admin/employees/me/documents/:documentId

DELETE
/admin/employees/me/documents/:documentId
```

---

# 99. Ніякого target `userId` із frontend

Stage 10 не має:

```text
/admin/employees/:employeeId/documents
```

Бо це вже management іншого employee.

---

# 100. Download authorization

Download query повинен шукати:

```text
_id = documentId

AND

ownerUserId = currentUser.id
```

Не:

```text
findById(documentId)
```

а потім «ой, забули ownership check».

---

# 101. Binary BFF

Для download можна перевикористати existing shared:

```text
createPrivateDownloadProxyRoute
```

який уже використовується Pharmacy.

Це хороший reusable infrastructure.

---

# 102. Document UI

Shared `DocumentsPanel` повинен отримувати capabilities:

```text
canUpload
canReplace
canDelete
```

Тоді:

Regular:

```text
false
false
false
```

Owner:

```text
true
true
true
```

---

# 103. Не приховувати backend policy лише UI

Навіть якщо regular employee не бачить Delete button:

```text
DELETE endpoint
```

також повинен повернути:

```text
403
```

---

# 104. Comments — окремі від Pharmacy Notes

Admin private comments не повинні використовувати:

```text
PharmacyNote
```

---

# 105. Model

Можна створити:

```text
AdminEmployeePrivateNote
```

з мінімальним contract:

```text
_id

ownerUserId

text

clientRequestId

createdAt
```

Можна також мати:

```text
authorNameSnapshot
```

як presentation snapshot.

---

# 106. Найважливіше правило Comments

Кожен query:

```text
ownerUserId === currentUser.id
```

Без винятків.

---

# 107. Навіть Platform Owner

Якщо ми говоримо:

```text
повністю приватні
```

то Platform Owner **не повинен читати приватні comments іншого employee** лише тому, що він Owner.

Це саме personal private notes.

---

# 108. Немає API «comments іншого employee»

Stage 10 не створює:

```text
GET /admin/employees/:id/comments
```

взагалі.

Це найкращий спосіб не допустити випадковий privacy bypass.

---

# 109. Self Comments API

Наприклад:

```text
GET
/admin/employees/me/comments

POST
/admin/employees/me/comments

DELETE
/admin/employees/me/comments/:commentId
```

---

# 110. Comments pagination

Можна використовувати вже перевірений pattern:

```text
page
perPage
newest first
```

і той самий UX, що Pharmacy internal comments.

---

# 111. Comment create idempotency

Я б залишила:

```text
clientRequestId
```

як у поточних Pharmacy comments.

Тоді подвійний submit/retry не створює duplicate note.

---

# 112. Comments UI

Перевикористовуємо:

```text
CommentComposer

CommentsList

ConfirmationModal

PaginationView
```

після того, як `Comments` перестане бути типізований конкретно через `PharmacyNote`.

---

# 113. Private Comments і Audit Log

Тут важлива privacy деталь.

Я б **не записувала content приватного comment у global AuditLog**.

Ніколи.

---

# 114. Я б навіть не створювала global business audit для private note

Бо employee з:

```text
audit.view
```

тоді бачитиме хоча б:

```text
Natalia created private note
```

а requirement каже:

```text
повністю приватні
```

Отже private personal notes залишаються поза глобальною Activity History.

---

# 115. Sessions

Тут можемо майже напряму використовувати existing auth lifecycle.

Backend уже має:

```text
GET /auth/sessions

DELETE /auth/sessions/:sessionId

POST /auth/logout-all
```

---

# 116. Admin BFF sessions

Додаємо:

```text
GET /api/auth/sessions

DELETE /api/auth/sessions/:sessionId

POST /api/auth/logout-all
```

---

# 117. Admin AuthProvider

`logoutAll` також підключаємо до:

```text
AuthProviderCore
```

---

# 118. ActiveSessionsPanel

Перевикористовуємо shared:

```text
device/session info

created time

last activity

current session marker

revoke

logout all
```

Без копіювання pharmacy JSX.

---

# 119. Session secrets

UI ніколи не отримує:

```text
refresh token

token hash

JWT

cookie
```

Лише safe session DTO.

---

# 120. Revoking another session

Після:

```text
DELETE session
```

перезавантажуємо session list.

---

# 121. Revoking current session

Якщо current session revoke підтримується existing lifecycle:

```text
clear auth state
→ /login
```

Не залишаємо Admin UI authenticated.

---

# 122. Logout all

Profile tab може мати:

```text
Log out all devices
```

з confirmation/action state.

---

# 123. Error states

Не можна:

```text
sessions request failed
→ []
→ No active sessions
```

Як і в попередніх аудитах:

```text
error ≠ zero
```

---

# 124. Profile loading

Initial profile:

```text
PageLoader
```

той самий shared.

---

# 125. Profile data source

Не треба робити зайвий:

```text
GET profile
+
GET current user
+
GET admin access
```

якщо `AuthProvider` і `AdminAuthorizationProvider` уже мають:

```text
user
access
```

Основна identity card будується з них.

Окремо завантажуються лише tab resources:

```text
documents
comments
sessions
```

---

# 126. Network budget

Initial `/admin/profile` не повинен одразу робити:

```text
documents
comments
sessions
```

якщо tabs ще не відкриті.

Я б зробила tab resources lazy.

---

# 127. Lazy tabs

Наприклад:

```text
Personal information
→ no extra list request

Documents opened
→ load documents

Comments opened
→ load comments

Active sessions opened
→ load sessions
```

---

# 128. Це особливо важливо через попередній Pharmacy audit

Ми вже знаходили проблему:

```text
inactive tabs mount
→ зайві requests
```

Admin Profile не повинен повторювати її.

---

# 129. Tab state

Можна локально:

```text
useState
```

Не потрібно додавати:

```text
?tab=documents
```

якщо deep link на profile tabs не є вимогою.

---

# 130. Picture update Audit

Stage 9 вже існує.

Тому новий admin business mutation повинен одразу підключатися до AuditLog.

---

# 131. Новий entity type

Stage 10 може розширити registry:

```text
adminEmployee
```

Тепер це вже реальний domain consumer.

---

# 132. Profile audit actions

Наприклад:

```text
adminEmployee.profile.updated

adminEmployee.document.uploaded

adminEmployee.document.replaced

adminEmployee.document.deleted
```

---

# 133. Profile update audit snapshot

Наприклад Owner змінює name:

```text
before:
{
  name: "Natalia"
}

after:
{
  name: "Nataliia"
}

changedFields:
[
  "name"
]
```

---

# 134. Email update audit

Можна записати:

```text
before.email
after.email
```

Email тут business identity field, не authentication secret.

---

# 135. Picture audit

Не зберігати:

```text
data:image/...base64,XXXXXXXX
```

в AuditLog.

Тільки:

```text
changedFields: ['pictureUrl']
```

або safe boolean:

```text
before: { hasPicture: false }
after: { hasPicture: true }
```

---

# 136. Document audit

Ніколи не audit:

```text
binary
base64
content
sha256 якщо не потрібно
```

Можна:

```text
document added
document replaced
document removed
```

із safe document ID.

---

# 137. Password НЕ потрапляє в audit snapshot

Очевидно:

```text
currentPassword
newPassword
```

ніколи.

Stage 9 sensitive-data invariant тут має пройти regression.

---

# 138. Password change і global business Audit

Я б не змушувала generic auth service писати business AuditLog лише для Admin.

Stage 9 уже розділив:

```text
business audit
```

і:

```text
auth/security lifecycle logging
```

Password lifecycle залишається в auth security concern.

---

# 139. Session revocation також не треба пхати в Activity History зараз

Це authentication/session lifecycle.

Не треба перетворювати Activity History на:

```text
clicked logout
opened profile
revoked Chrome session
```

---

# 140. Profile update transaction

Owner identity update:

```text
BEGIN

load employee
validate policy
validate revision
apply update
write AuditLog

COMMIT
```

---

# 141. Document mutations transaction

Для:

```text
upload
replace
delete
```

document mutation + AuditLog бажано commit разом.

Особливо:

```text
delete
```

щоб не було:

```text
document deleted
audit missing
```

---

# 142. Private notes не входять у global transaction audit

Бо глобальної audit події для них не створюємо.

Їхній власний persistence повинен мати ownership/idempotency guarantees.

---

# 143. Admin Profile browser API

Орієнтовно:

```text
lib/api/browser/

admin-profile.api.ts
auth.api.ts
```

`auth.api.ts`:

```text
loginAdmin

requestAdminPasswordReset

resetAdminPassword

updateCurrentUserPassword

getActiveSessions

revokeActiveSession
```

Profile:

```text
updateMyAdminEmployeeProfile

getMyAdminDocuments

uploadMyAdminDocument

replaceMyAdminDocument

deleteMyAdminDocument

downloadMyAdminDocument

getMyPrivateNotes

createMyPrivateNote

deleteMyPrivateNote
```

---

# 144. Browser API same-origin only

Browser:

```text
/api/...
```

ніколи:

```text
process.env.API_URL
backend origin
```

---

# 145. Admin BFF routes

Орієнтовно:

```text
app/api/auth/

login/route.ts

password-reset/
  request/route.ts
  confirm/route.ts

password/route.ts

sessions/route.ts

sessions/[sessionId]/route.ts

logout-all/route.ts
```

---

# 146. Admin employee BFF

```text
app/api/admin/employees/me/

profile/route.ts

documents/route.ts

documents/[documentId]/route.ts

comments/route.ts

comments/[commentId]/route.ts
```

---

# 147. Canonical backend routes

В `@e-pharmacy/api-client/contracts` додаємо тільки нові Admin employee routes.

Auth routes уже canonical.

Не хардкодимо:

```text
'/admin/employees/me/...'
```

у кожному BFF.

---

# 148. Runtime parsers

Admin employee API responses повинні мати fail-closed parsers:

```text
profile update

documents list

document metadata

private notes list
```

---

# 149. Download binary — окремий contract

Binary download не JSON parser.

Використовуємо existing download proxy infrastructure.

---

# 150. Profile picture і header

Після зміни picture:

```text
Admin Profile
Admin Header
Client header for logged-in admin
```

повинні отримати updated user data.

Не чекати наступного login.

---

# 151. Email/name і header

Те саме:

```text
applyCurrentUser
```

оновлює account presentation.

---

# 152. Client website Admin presentation

Stage 5 уже заклав:

```text
logged-in admin on client site
→ admin picture/name
→ admin cabinet label
```

Stage 10 не ламає цей contract.

---

# 153. Admin auth pages не використовують Admin Shell

`/login`:

```text
NO AdminHeader
NO AdminSidebar
```

`/password-recovery`:

так само.

`/reset-password`:

так само.

---

# 154. `/admin/profile` використовує Admin Shell

Так.

```text
AdminHeader
AdminSidebar
Profile content
```

---

# 155. Не додавати Profile permission

Не створюємо:

```text
profile.view
profile.edit
```

або:

```text
employees.editSelf
```

лише заради self account.

---

# 156. Owner edit не використовує `employees.edit`

`employees.edit` у Stage 21 буде означати:

```text
edit another employee
```

Self Platform Owner identity — інший policy.

---

# 157. Не реалізовувати Employees CRUD зараз

Навіть якщо з'являється:

```text
/admin/employees/me
```

не додаємо:

```text
GET /admin/employees

POST /admin/employees

GET /admin/employees/:id

PATCH /admin/employees/:id
```

---

# 158. Не реалізовувати Positions

Admin Profile role label:

```text
Platform Owner / Admin employee
```

а не Position.

---

# 159. Не реалізовувати employee permissions tab

Навіть Owner не редагує власні permissions у profile.

Stage 8 спеціально забороняє self permission manipulation.

---

# 160. Не показувати permissions у Profile

Profile ≠ authorization management.

Permissions будуть:

```text
Settings
→ Employees
→ Employee detail
```

у відповідному Stage.

---

# 161. Не додавати Admin registration «для зручності»

Навіть temporary.

Навіть localhost-only.

Навіть кнопку:

```text
Create first admin
```

Bootstrap Platform Owner уже вирішує first admin.

---

# 162. Shared Auth errors

Я б додала Admin-specific mapper:

```text
getAdminAuthErrorMessage
```

але використовувала canonical:

```text
getAuthErrorCode
```

із shared auth.

---

# 163. Login error copy

Наприклад:

```text
Invalid email or password.
```

Без уточнення:

```text
email exists but password wrong
```

---

# 164. Recovery error copy

Generic.

Не account enumeration.

---

# 165. Reset invalid token

Page повинна чітко показувати:

```text
Password reset link is missing or invalid.
Request a new link.
```

---

# 166. Reset expired token

Backend stable error → friendly message:

```text
This password reset link has expired.
Request a new one.
```

---

# 167. Auth form duplicate submit

Login / Recovery / Reset:

```text
single flight
```

або local submit guard.

Подвійний click не створює подвійний request.

---

# 168. Documents duplicate upload

Upload button:

```text
disabled while pending
```

Replace/delete також single pending operation для конкретного resource.

---

# 169. Profile mutation conflict

Якщо:

```text
expectedRevision
```

старий:

```text
409
```

UI:

```text
Profile changed in another session.
Reload latest data.
```

Не overwrite.

---

# 170. Mobile profile

Особливо перевірити:

```text
picture card

name/email

tabs

documents

password fields

sessions
```

на:

```text
320–375px
```

---

# 171. Tabs mobile

Можна використовувати існуючий shared Tabs responsive contract.

Не створювати другий custom tab system.

---

# 172. Documents mobile

File name повинен:

```text
wrap
```

а buttons:

```text
не виштовхувати card за viewport
```

---

# 173. Sessions mobile

Device information:

```text
wrap
```

Revoke button доступний.

---

# 174. Accessibility — Auth

Обов'язково:

```text
label для email

label для password

password visibility button aria-label

submit disabled state

error role

keyboard navigation
```

---

# 175. Accessibility — Profile

Photo actions:

```text
accessible labels
```

Tabs:

```text
tablist / tab / tabpanel
```

Documents:

```text
download action labels
```

Comments:

```text
labelled textarea
```

Sessions:

```text
device list semantics
```

---

# 176. Structural check для Auth UI

Я б додала:

```text
check:admin-auth-ui
```

---

# 177. `check:admin-auth-ui` перевіряє

Мінімально:

```text
/login exists

/password-recovery exists

/reset-password exists

/register does NOT exist

/api/auth/login exists

/api/auth/password-reset/request exists

/api/auth/password-reset/confirm exists

Admin AuthProvider provides login

Admin Login fixes application=admin

Admin has no registration BFF

auth pages use shared Auth UI
```

---

# 178. Structural check Profile

Додати:

```text
check:admin-profile
```

---

# 179. `check:admin-profile` перевіряє

```text
/admin/profile exists

Profile is inside protected Admin shell

Profile route constant exists

Header profile item exists

mobile profile link exists

no profile permission added

admin employee self endpoint exists

generic /auth/current was not expanded for admin email policy

AdminEmployeeDocument exists

private note ownership is self-scoped

session BFF exists

password BFF exists

shared profile components are used
```

---

# 180. Pharmacy regression structural check

Оскільки Stage 10 рефакторить Pharmacy Profile:

```text
check:pharmacy
```

має залишитися зеленим.

Особливо:

```text
moderation
documents
working hours
payment
reviews
comments
sessions
```

---

# 181. Auth UI tests — Login

Перевірити:

```text
email validation

password validation

application = admin

no account-type selector

no register link

forgot-password link

pending state

wrong credentials

successful login

safe redirect

default → /admin/profile
```

---

# 182. Guest Route tests

Authenticated admin:

```text
/login
→ redirect private destination
```

Anonymous:

```text
/login
→ form
```

---

# 183. Password Recovery tests

```text
application = admin

known email response

unknown email same presentation

invalid email

double submit

back to login
```

---

# 184. Reset tests

```text
query token

hash token

token removed from URL

history state fallback

invalid token

expired token

password mismatch

successful reset

auth invalidated

login link
```

---

# 185. Shared reset-token tests

Після переносу client helper у `@e-pharmacy/auth` його existing tests також переносимо.

Client regression обов'язково green.

---

# 186. Profile policy tests

Regular admin:

```text
picture update → allowed

name update → forbidden

email update → forbidden
```

Platform Owner:

```text
picture → allowed

name → allowed

email → allowed
```

---

# 187. Owner spoof test

Regular employee відправляє:

```json
{
  "name": "New Name"
}
```

напряму через API.

Очікуємо:

```text
403
```

Незалежно від того, що frontend form readonly.

---

# 188. Profile ownership tests

Self endpoint не приймає:

```text
userId
ownerUserId
```

із body.

Current user визначається authentication layer.

---

# 189. Document access tests

Regular employee:

```text
GET own → 200

download own → 200

POST → 403

PUT → 403

DELETE → 403
```

---

# 190. Owner document tests

Platform Owner:

```text
upload → success

download → success

replace → success

delete → success
```

---

# 191. Foreign document test

User A знає:

```text
documentId User B
```

Запит:

```text
GET /me/documents/:id
```

не повинен повернути document.

---

# 192. Document content safety

List response не містить:

```text
Buffer
content
base64
```

---

# 193. Private comments tests

User A:

```text
create A
```

User B:

```text
GET own comments
```

не бачить A.

Навіть якщо B:

```text
Platform Owner
```

---

# 194. Foreign private comment delete

User B знає ID comment A.

```text
DELETE
```

не видаляє його.

---

# 195. Comment idempotency

Повтор:

```text
same clientRequestId
same text
```

не створює duplicate.

---

# 196. Sessions tests

```text
load

error

retry

revoke other session

logout all

current-session lifecycle
```

---

# 197. Change password tests

```text
wrong current password

invalid new password

same/invalid policy if applicable

success

sessions revoked

auth cookie cleanup

frontend auth state invalidated
```

---

# 198. Audit tests — profile

Owner edit:

```text
User update
+
AuditLog
```

одна transaction.

Audit fail:

```text
User update rollback
```

---

# 199. Audit tests — documents

Document mutation:

```text
document
+
audit
```

commit together.

---

# 200. Audit sensitive tests

Перевіряємо, що Stage 10 не протягнув у AuditLog:

```text
password

picture base64

document content

Authorization

cookie
```

---

# 201. Comments Audit privacy test

Global `AdminAuditLog` не містить:

```text
private comment text
```

і я б узагалі не створювала global comment audit event.

---

# 202. Profile page React tests

Мінімально:

```text
regular employee view

Platform Owner view

picture update

picture remove

owner editable identity

regular readonly identity

password form

tabs

documents permissions

comments

sessions

resource errors
```

---

# 203. Lazy tab tests

Initial profile render:

```text
does not fetch documents
does not fetch comments
does not fetch sessions
```

Відкрили Documents:

```text
fetch documents once
```

і так далі.

---

# 204. Header tests

Profile link:

```text
desktop UserDropdown
```

Mobile:

```text
profile link
```

After picture/name update:

```text
UserBadge updates
```

---

# 205. Regression Client Auth

Оскільки ми виносимо shared Auth UI:

```text
client login

client recovery

client reset

client register
```

мають лишитися візуально та функціонально робочими.

---

# 206. Registration client не переносимо в Admin

Shared layout може використовуватись Register page client.

Але Admin registration page все одно відсутня.

---

# 207. Regression Pharmacy Profile

Pharmacy після refactor не втрачає:

```text
picture

data

password

documents

comments

sessions
```

---

# 208. Не чіпати pharmacy-specific functionality

Stage 10 — не привід переписувати:

```text
moderation
payment
reviews
working hours
about pharmacy
```

якщо для shared extraction це не потрібно.

---

# 209. Що НЕ входить у Stage 10

Не робимо:

```text
Dashboard

Product Categories

Pharmacy Owners

Pharmacies admin pages

Products

Product Requests UI

Clients

Orders

Reviews moderation

Site Pages

Employees list

Employee create

Employee detail

Positions

Permission editor

notifications

exports
```

---

# 210. Особливо: Employees Stage не пересуваємо вперед

Єдиний employee resource зараз:

```text
me
```

Self only.

Це не повноцінний Employees module.

---

# 211. Не створювати fake employee data

Не додаємо:

```text
position = Administrator

department = Management

employee number = 001
```

лише щоб Profile виглядав багатшим.

---

# 212. Не додавати phone/address у Admin Profile

У `User` вони технічно є.

Але твоє Admin Profile ТЗ їх не містить.

Тому не тягнемо туди поля «бо вони вже є в model».

---

# 213. Не показувати permissions

Також не треба Profile перетворювати на:

```text
Personal information
Permissions
Access
Documents
...
```

Permissions — management concern.

---

# 214. Орієнтовна shared UI structure

```text
packages/ui/src/

auth/
  AuthPageShell/
  AuthFormLayout/
  index.ts

profile/
  ProfileIdentityCard/
  ProfilePictureEditor/
  ChangePasswordForm/
  DocumentsPanel/
  ActiveSessionsPanel/
  ProfileTabsLayout/
  index.ts
```

Без обов'язкового component на кожен `<div>` 🙂

---

# 215. Орієнтовна Admin structure

```text
apps/admin/src/

app/
  (auth)/
    (guest)/
      login/
        page.tsx

      password-recovery/
        page.tsx

    reset-password/
      page.tsx

  admin/
    profile/
      page.tsx

  api/
    auth/
      login/
      password-reset/
      password/
      sessions/
      logout-all/

    admin/
      employees/
        me/
          profile/
          documents/
          comments/
```

---

# 216. Admin components

```text
components/

auth/
  AdminLoginForm/
  AdminPasswordRecoveryForm/
  AdminResetPasswordForm/

profile/
  AdminProfilePageContent/
  AdminPersonalInformation/
  AdminDocuments/
  AdminPrivateComments/
```

Shared pieces не дублюються тут.

---

# 217. Backend structure

Орієнтовно:

```text
apps/api/src/

models/
  adminEmployeeDocument.model.ts
  adminEmployeePrivateNote.model.ts

schemas/
  admin-employee-profile.schema.ts
  admin-employee-document.schema.ts
  admin-employee-note.schema.ts

services/
  admin-employee-profile.service.ts
  admin-employee-document.service.ts
  admin-employee-note.service.ts

controllers/
  admin-employee.controller.ts

routes/
  admin.routes.ts
```

Назви можна трохи адаптувати до поточної структури, головне — boundaries.

---

# 218. Не роздувати `admin.controller.ts`

Stage 9 уже почав відділяти resources.

Тому profile/documents/notes не потрібно все складати в один 1500-line:

```text
admin.controller.ts
```

---

# 219. Security architecture після Stage 10

Отримаємо:

```text
Admin credentials
       │
       ▼
Admin Login BFF
       │
       ▼
Auth backend
       │
       ▼
HttpOnly tokens
       │
       ▼
AdminProtectedRoute
       │
       ▼
AdminAuthorizationProvider
       │
       ▼
Admin Profile
```

Browser JWT не бачить.

---

# 220. Profile mutation architecture

```text
Admin Profile
      │
      ▼
same-origin /api/admin/...
      │
      ▼
authenticate
      │
      ▼
AdminAccess
      │
      ▼
self policy / Platform Owner policy
      │
      ▼
Mongo transaction
     ┌┴───────────────┐
     │                │
     ▼                ▼
User / Document    AuditLog
```

---

# 221. Private comments architecture

```text
Current admin
     │
     ▼
/employees/me/comments
     │
     ▼
ownerUserId = req.user.id
     │
     ▼
AdminEmployeePrivateNote
```

Немає:

```text
target user
permission override
owner override
moderator override
```

---

# 222. Definition of Done — Auth UI

Stage 10 Auth готовий, коли:

- [ ] `/login` існує;
- [ ] `/password-recovery` існує;
- [ ] `/reset-password` існує;
- [ ] `/register` в Admin не існує;
- [ ] Admin Login стилістично використовує той самий shared auth layout, що client;
- [ ] Login має email;
- [ ] Login має password;
- [ ] Login має Forgot password;
- [ ] Login не має registration link;
- [ ] Login не має client/pharmacy selector;
- [ ] Login завжди надсилає `application: admin`;
- [ ] `POST /api/auth/login` існує;
- [ ] Admin AuthProvider має `login`;
- [ ] authenticated user не бачить guest Login form;
- [ ] safe redirect працює;
- [ ] direct login веде на `/admin/profile`;
- [ ] Password Recovery має email;
- [ ] Recovery завжди надсилає `application: admin`;
- [ ] account enumeration відсутній;
- [ ] reset email веде в Admin app;
- [ ] Reset Password має password + confirm password;
- [ ] reset token очищається з URL;
- [ ] reset-token helper не дублюється між client/admin;
- [ ] successful reset очищає auth session;
- [ ] Admin registration BFF відсутній;
- [ ] auth pages `noindex`;
- [ ] shared client auth після refactor працює.

---

# 223. Definition of Done — Shared Profile

- [ ] Pharmacy Profile не копіюється в Admin;
- [ ] існує shared profile UI boundary;
- [ ] `ProfileIdentityCard` reusable;
- [ ] `ProfilePictureEditor` reusable;
- [ ] `ChangePasswordForm` reusable;
- [ ] `DocumentsPanel` reusable;
- [ ] `ActiveSessionsPanel` reusable;
- [ ] `ProfileTabsLayout` reusable;
- [ ] shared components не роблять app API requests;
- [ ] shared components не знають про Admin permissions;
- [ ] shared components не знають про Pharmacy moderation;
- [ ] shared Comments presentation більше не залежить від `PharmacyNote`;
- [ ] Pharmacy Profile переведений на shared blocks;
- [ ] Pharmacy-specific tabs не винесені в shared без потреби.

---

# 224. Definition of Done — Admin Profile

- [ ] `/admin/profile` існує;
- [ ] Profile accessible усім active AdminAccess;
- [ ] окремий profile permission не створено;
- [ ] Profile є в desktop UserDropdown;
- [ ] Profile доступний із mobile menu;
- [ ] breadcrumbs працюють;
- [ ] показується photo;
- [ ] photo можна upload;
- [ ] photo можна delete;
- [ ] показується name;
- [ ] показується email;
- [ ] показується role label;
- [ ] показується status;
- [ ] немає Pharmacy Profile status;
- [ ] немає moderation controls;
- [ ] tabs рівно `Personal information / Documents / Comments / Active sessions`;
- [ ] regular employee name readonly;
- [ ] regular employee email readonly;
- [ ] Platform Owner може редагувати name/email;
- [ ] owner edit йде через Admin employee self endpoint;
- [ ] generic `/auth/current` не отримав Admin-specific email policy;
- [ ] profile update використовує revision protection;
- [ ] `applyCurrentUser` оновлює Header;
- [ ] phone/address не додані без ТЗ;
- [ ] permissions не показуються;
- [ ] Positions не вигадуються.

---

# 225. Definition of Done — Password/Sessions

- [ ] Change Password доступний regular employee;
- [ ] Change Password доступний Platform Owner;
- [ ] використовується existing `/auth/current/password`;
- [ ] password validation canonical;
- [ ] success revoke'ить sessions згідно з existing lifecycle;
- [ ] browser cookies очищаються;
- [ ] frontend auth state invalidated;
- [ ] після password change користувач повертається до Login;
- [ ] Active Sessions використовує existing auth session API;
- [ ] session BFF same-origin;
- [ ] session tokens не потрапляють у browser DTO;
- [ ] revoke працює;
- [ ] logout all працює;
- [ ] session error не стає fake empty state.

---

# 226. Definition of Done — Documents

- [ ] `AdminEmployeeDocument` є окремим domain;
- [ ] `PharmacyDocumentFile` не використовується;
- [ ] `ownerUserId` authoritative;
- [ ] regular employee бачить лише own docs;
- [ ] regular employee може download own docs;
- [ ] regular employee не може upload;
- [ ] regular employee не може replace;
- [ ] regular employee не може delete;
- [ ] Platform Owner може upload own docs;
- [ ] Platform Owner може replace;
- [ ] Platform Owner може delete;
- [ ] foreign document ID не обходить ownership;
- [ ] binary не повертається list endpoint'ом;
- [ ] download проходить private binary BFF;
- [ ] file rules не прив'язані до Pharmacy domain;
- [ ] document mutations audit'яться без file contents.

---

# 227. Definition of Done — Comments

- [ ] Admin private notes мають окремий model;
- [ ] `ownerUserId === currentUser.id` на read;
- [ ] те саме на create;
- [ ] те саме на delete;
- [ ] endpoint іншого employee відсутній;
- [ ] Platform Owner не може читати чужі private comments;
- [ ] moderator не може читати чужі comments;
- [ ] comments paginated;
- [ ] create має idempotency;
- [ ] shared Comments UI reused;
- [ ] comment content ніколи не потрапляє в global AuditLog.

---

# 228. Definition of Done — Audit

- [ ] Owner name update audit'иться;
- [ ] Owner email update audit'иться;
- [ ] picture update audit не містить base64;
- [ ] document upload audit'иться;
- [ ] document replace audit'иться;
- [ ] document delete audit'иться;
- [ ] password ніколи не потрапляє в audit;
- [ ] document binary ніколи не потрапляє в audit;
- [ ] private comment text ніколи не потрапляє в audit;
- [ ] critical profile/document mutation + AuditLog atomic;
- [ ] Stage 9 audit checks залишаються green.

---

# 229. Перевірки Stage 10

Після реалізації:

```text
pnpm check:admin-auth-ui

pnpm check:admin-profile

pnpm check:admin

pnpm check:auth-contracts

pnpm check:before-deploy

pnpm lint

pnpm type-check

pnpm test

pnpm test:react

pnpm test:integration

pnpm build
```

---

# 230. Manual acceptance №1 — перший реальний Admin login

```text
1. Open /login

2. Enter Platform Owner email

3. Enter password

4. Log in

5. Browser receives HttpOnly auth cookies

6. /admin/profile opens

7. Header shows owner picture/name/email

8. Profile shows:
   Platform Owner
   Active
```

Це для мене головний acceptance scenario Stage 10.

---

# 231. Manual acceptance №2 — change password

```text
/admin/profile
→ Personal information
→ Change password

Current password
New password
Confirm password
→ Save
```

Очікуємо:

```text
Password changed successfully

old sessions revoked

current auth invalidated

→ /login
```

Потім:

```text
old password → fail

new password → success
```

---

# 232. Manual acceptance №3 — Forgot Password

```text
/login
→ Forgot password
→ email
→ Send
```

Email link:

```text
Admin app
/reset-password?...token...
```

Token зникає з visible URL.

Новий password зберігається.

Login новим password працює.

---

# 233. Manual acceptance №4 — Regular Employee

Regular employee:

```text
Profile
```

бачить:

```text
photo editable

name readonly

email readonly

password editable

documents downloadable

private comments editable

sessions
```

Не бачить:

```text
name Save
email Save
document upload/delete
```

---

# 234. Manual acceptance №5 — privacy

Створити:

```text
Employee A comment:
"Private note A"
```

Зайти Employee B.

Employee B:

```text
не бачить comment
```

Зайти іншим moderator.

Не бачить.

Навіть знання:

```text
commentId
```

не дозволяє отримати/delete його.

---

# 235. Що матимемо після Stage 10

Після цього етапу Admin уже перестає бути лише architecture shell.

У нас буде реальна завершена вертикаль:

```text
Authentication
      │
      ▼
Authorization
      │
      ▼
Admin Shell
      │
      ▼
Admin Profile
```

плюс:

```text
Login
Forgot Password
Reset Password

Picture
Identity
Password
Documents
Private Comments
Sessions
```

І все це вже сидить на:

```text
same-origin BFF

HttpOnly auth

AdminAccess

Platform Owner

AuditLog
```

---

# 236. І головне — без заходу в Stage 11+

Ми **не починаємо**:

```text
Categories
Dashboard
Pharmacy Owners
Pharmacies
Products
Employees CRUD
Positions
```

Але після Stage 10 ти вже можеш абсолютно нормально:

```text
відкрити Admin
→ залогінитися
→ працювати в Admin Shell
→ відкрити свій Profile
→ змінити пароль
```

Тобто це вже не буде адмінка, до якої технічно можна зайти лише силою думки 😄

## Коміт для Stage 10

Я б використала:

```text
feat(admin): add auth pages and admin profile
```

А для самого етапу я б зафіксувала назву в `README-10.md` саме як:

```text
# 15. ЕТАП 10 — Admin Auth UI + Admin Profile
```

Бо тепер це точніше відповідає фактичному scope.

//===============================================

Я б розділила Stage 10 на **8 підетапів**. Так зміни будуть достатньо маленькими для нормального формування архівів, але водночас ми не створюватимемо «тимчасово тимчасове» 🙂

Найкращий порядок такий:

### Stage 10.1 — Shared Auth UI foundation

Спочатку винести з `apps/client` лише справді reusable presentation для auth:

```text
AuthPageShell
AuthFormLayout
```

і, якщо потрібно, reset-token helper перенести в `@e-pharmacy/auth`.

Одразу перевести існуючі client:

```text
/login
/password-recovery
/reset-password
```

на shared foundation, **без зміни їхньої поведінки**.

На цьому підетапі Admin auth-сторінок ще можна не створювати.

**Мета:** спочатку отримати один правильний reusable auth UI, а не копіювати client у admin.

---

### Stage 10.2 — Admin Login + Password Recovery + Reset Password

Тут уже створити весь Admin auth flow:

```text
/login
/password-recovery
/reset-password
```

і BFF:

```text
/api/auth/login
/api/auth/password-reset/request
/api/auth/password-reset/confirm
```

Також:

```text
Admin AuthProvider → login
application = admin
GuestOnlyRoute
safe redirect
```

Без:

```text
/register
```

Default redirect після прямого login:

```text
/admin/profile
```

Навіть якщо profile поки буде створений у наступному підетапі, route можна додати разом із 10.3/10.4 — тобто тут я не робила б fake page.

**Після 10.2 вже буде готовий сам механізм входу.**

---

### Stage 10.3 — Shared Profile UI foundation

Це окремий підетап, бо саме тут найбільший ризик випадково рознести Pharmacy Profile 😄

Винести reusable:

```text
ProfileIdentityCard
ProfilePictureEditor
ChangePasswordForm
ActiveSessionsPanel
ProfileTabsLayout
DocumentsPanel
```

і відв'язати shared Comments presentation від конкретного:

```text
PharmacyNote
```

Але поки не створювати великий Admin Profile.

---

### Stage 10.4 — Pharmacy Profile migration + Admin Profile core

Тут я б об'єднала дві речі, бо вони є перевіркою одна одної.

Спочатку перевести Pharmacy Profile на нові shared blocks, не змінюючи pharmacy-specific functionality.

Потім створити:

```text
/admin/profile
```

з:

```text
photo
name
email
role
status

Personal information
```

Також:

```text
Profile у desktop UserDropdown
Profile у mobile menu
breadcrumbs
```

І backend self-profile:

```text
PATCH /admin/employees/me/profile
```

Політика:

```text
regular employee:
  photo edit
  name readonly
  email readonly

Platform Owner:
  photo edit
  name edit
  email edit
```

Саме після цього підетапу login flow уже нормально завершується реальною сторінкою:

```text
/login
→ /admin/profile
```

---

### Stage 10.5 — Change Password + Active Sessions

Окремий компактний auth/security підетап.

Додати BFF для:

```text
PATCH /api/auth/password

GET /api/auth/sessions
DELETE /api/auth/sessions/:sessionId
POST /api/auth/logout-all
```

У Profile підключити:

```text
ChangePasswordForm
ActiveSessionsPanel
```

Після успішної зміни password:

```text
sessions revoked
auth state invalidated
→ /login
```

Це якраз дасть тобі той реальний сценарій, який ти хотіла:

```text
зайти в Admin
→ Profile
→ змінити пароль
→ зайти новим паролем
```

---

### Stage 10.6 — Admin Documents

Я б точно не змішувала документи з попереднім підетапом, бо тут уже новий persistence domain.

Створити:

```text
AdminEmployeeDocument
```

Self API:

```text
GET    /admin/employees/me/documents
GET    /admin/employees/me/documents/:id

POST   /admin/employees/me/documents
PUT    /admin/employees/me/documents/:id
DELETE /admin/employees/me/documents/:id
```

Політика:

```text
Regular employee:
  list own
  download own

Platform Owner:
  list
  download
  upload
  replace
  delete
```

Плюс private download BFF.

І вже тут інтегрувати Stage 9 audit для document mutations.

---

### Stage 10.7 — Private Comments

Окремо, бо тут дуже важливий privacy boundary.

Створити:

```text
AdminEmployeePrivateNote
```

і тільки self API:

```text
GET    /admin/employees/me/comments
POST   /admin/employees/me/comments
DELETE /admin/employees/me/comments/:id
```

Обов'язкове правило:

```text
ownerUserId === currentUser.id
```

І навіть:

```text
Platform Owner
```

не може читати comments іншого employee.

Тут же:

```text
clientRequestId
pagination
shared Comments UI
```

А в global AuditLog **не записувати private comment content**.

---

### Stage 10.8 — Audit completion + hardening + checks

Фінальний підетап я б залишила тільки для зведення всього разом.

Перевірити/доробити AuditLog для:

```text
adminEmployee.profile.updated

adminEmployee.document.uploaded
adminEmployee.document.replaced
adminEmployee.document.deleted
```

Без:

```text
password
picture base64
document binary
private comment text
```

І додати:

```text
check:admin-auth-ui
check:admin-profile
```

плюс regression Stage 1–9.

Фінальні команди:

```text
pnpm lint
pnpm type-check
pnpm test
pnpm test:react
pnpm test:integration
pnpm build
pnpm check:before-deploy
```

---

Отже, я б зафіксувала Stage 10 так:

```text
Stage 10
│
├── 10.1 Shared Auth UI foundation
│
├── 10.2 Admin Auth UI
│      Login
│      Recovery
│      Reset Password
│
├── 10.3 Shared Profile UI foundation
│
├── 10.4 Pharmacy migration + Admin Profile core
│
├── 10.5 Change Password + Active Sessions
│
├── 10.6 Admin Documents
│
├── 10.7 Private Comments
│
└── 10.8 Audit + hardening + final checks
```

Для **формування архівів** це, на мою думку, значно зручніше за один величезний Stage 10. Я б робила кожен наступний архів **кумулятивним від попереднього підетапу**: наприклад, після `10.1` ти перевіряєш, потім я беру вже перевірену ревізію й роблю `10.2`, і так далі. Тоді якщо десь з'явиться помилка, ми точно знаємо, в якому маленькому шматку вона приїхала, а не шукаємо винуватця серед сотні файлів 😄

//================================================

Готово 🙂 Підготувала окремий архів тільки для Stage 10.1 — Shared Auth UI foundation.

📦 Завантажити Stage 10.1

У ньому 22 змінених/доданих файли. Зроблено саме в межах цього підетапу:

додано shared AuthPageShell;
додано shared AuthFormLayout;
client /login, /password-recovery, /reset-password переведені на shared foundation;
AuthFormShell у client тепер лише thin adapter, без дублювання layout-логіки;
reset-password token helper перенесений у @e-pharmacy/auth/reset-password;
client використовує shared helper;
оновлено explicit auth public API та його structural check;
Admin auth pages ще не створювала;
нічого зі Stage 10.2+ не додавала.

Перевірила:

@e-pharmacy/ui type-check — успішно;
@e-pharmacy/auth type-check — успішно;
auth public API structural check — успішно;
UI boundary check — успішно;
сам .zip перевірений на цілісність.

Для цього підетапу я б використала коміт:

refactor(auth): extract shared auth UI foundation

Тобто тепер можна спокійно перевірити 10.1 окремо, і вже після зелених перевірок переходити до 10.2 — Admin Login + Password Recovery + Reset Password.

//=========================================================

Так, це виправила. І правило на майбутнє теж беру як постійне для E-pharmacy: після рефакторингу не залишаємо proxy/re-export файли без власної відповідальності — міняємо імпорти й видаляємо старий модуль.

У твоєму логу check:before-deploy справді падає на check:client-lib-public-api, бо client-local файл просто реекспортує shared package, а цей boundary у проєкті прямо заборонений.

Що виправлено

Повністю прибираємо стару папку:

apps/client/src/components/auth/AuthFormShell/
├── AuthFormShell.tsx
├── AuthFormShell.module.css
└── index.ts

RegisterPage, який ще використовував AuthFormShell, тепер напряму імпортує:

import { AuthPageShell } from '@e-pharmacy/ui/auth';

Із:

apps/client/src/components/auth/index.ts

прибрано export AuthFormShell.

Також повністю видаляємо:

apps/client/src/lib/auth/reset-password-token.ts
apps/client/src/lib/auth/reset-password-token.test.ts

ResetPasswordForm уже використовує напряму:

import {
captureResetPasswordToken,
clearResetPasswordTokenFromHistoryState,
} from '@e-pharmacy/auth/reset-password';

А сам test тепер живе разом із shared implementation у packages/auth.

Що з файлом на малюнку 3

Оцей файл залишаю:

packages/auth/src/reset-password.ts

У нього є конкретна роль: це public package entrypoint для:

@e-pharmacy/auth/reset-password

і саме на нього вказує exports package. Тобто це не випадковий app-local proxy на кшталт двох попередніх файлів, а boundary самого package. Тут він доречний.

Що треба видалити у твоєму поточному проєкті

Оскільки звичайний .zip фізично не може видалити файли, які вже лежать у репозиторії, перед накладанням fix виконай:

git rm -r apps/client/src/components/auth/AuthFormShell

git rm \
 apps/client/src/lib/auth/reset-password-token.ts \
 apps/client/src/lib/auth/reset-password-token.test.ts

Після цього наклади маленький fix-архів:

📦 Stage 10.1 — proxy cleanup fix

У ньому лише 2 реально змінені файли після видалення зайвих wrapper'ів:

apps/client/src/app/(public)/(auth)/(guest)/register/page.tsx
apps/client/src/components/auth/index.ts

//============================================

Привіт) Готово 💙💛

Зібрала Stage 10.2 — Admin Login + Password Recovery + Reset Password окремим patch-архівом: тільки 22 оновлені/додані файли, без node_modules, build artifacts і без функціоналу Stage 10.3+.

📦 Завантажити архів Stage 10.2

Реалізовано /login, /password-recovery, /reset-password, три відповідні BFF routes, AuthProvider → login, жорстко заданий application: 'admin', GuestOnlyRoute, safe redirect лише всередині /admin/\*, default redirect → /admin/profile, shared reset-token flow без localStorage/sessionStorage/cookie, generic password-recovery UX без account enumeration. /register не доданий, fake /admin/profile теж не створювався.

Також оновила старі structural checks Stage 4, які раніше навмисно забороняли login UI/BFF і login у AuthProvider — інакше новий етап сам би ламав попередні перевірки. Маленька архітектурна міна була акуратно знешкоджена 😄

Перевірено: admin unit tests 27/27, React tests 6/6, tsc --noEmit — успішно, всі admin structural checks — успішно.

Коміт для цих змін:

feat(admin): add stage 10.2 authentication flow
