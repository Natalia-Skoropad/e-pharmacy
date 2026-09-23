Так. І тут після перевірки актуального e-pharmacy-2 є важливе уточнення: частина фундаменту для admin auth вже закладена. AuthApplication, frontend config, backend AUTH_APPLICATIONS, User.role і ADMIN_APP_URL уже знають про admin. Зараз блокують admin саме LoginPayload, ForgotPasswordPayload, backend-схеми та password-reset routing; навіть structural test поки спеціально перевіряє, що forgot-password не приймає admin.

Саму сторінку Login я б у етап 3 не включала. Формулювання «до сторінки Login спочатку завершити контракти» тут дуже правильне: етап 3 = shared/backend auth foundation + bootstrap першого admin; Login/Password Recovery/Reset Password уже підуть наступним окремим етапом. Інакше наш маленький етап знову почне відрощувати щупальця 😄

Нижче я б зафіксувала етап 3 так.

# ЕТАП 3 — завершення shared auth для admin та bootstrap першого admin

## 1. Мета етапу

На цьому етапі **не будуємо UI авторизації admin**.

Завдання — завершити спільний auth-контракт так, щоб система вже коректно підтримувала третій application:

```text
client
pharmacy
admin
```

Після етапу backend і shared contracts повинні бути готовими до того, що наступний етап додасть:

```text
/admin login
password recovery
reset password
AdminProtectedRoute
```

Також на цьому етапі потрібно вирішити bootstrap-проблему:

> звідки береться перший admin, якщо public admin registration не існує?

Для цього створюємо окремий one-time deployment/development script:

```bash
pnpm seed:admin-owner
```

який без public API створює першого admin-користувача.

---

# 2. Що вже є в проєкті і НЕ потрібно робити повторно

В актуальному коді вже правильно існує:

```ts
export type AuthApplication = 'client' | 'pharmacy' | 'admin';
```

Також frontend config уже містить:

```text
client
pharmacy
admin
```

Backend:

```ts
AUTH_APPLICATIONS.ADMIN;
USER_ROLES.ADMIN;
```

вже існують.

`User` model також уже дозволяє:

```text
role: admin
```

і `apps/api/.env.example` уже містить:

```env
ADMIN_APP_URL=http://localhost:3001
```

`apps/api/src/config/env.ts` уже читає `ADMIN_APP_URL` і включає admin origin до trusted application origins.

Тому на етапі 3 **не потрібно заново додавати admin у базові role/application enums**.

Це вже зроблено.

---

# 3. Що зараз фактично блокує admin auth

Зараз shared application type широкий:

```text
client | pharmacy | admin
```

але конкретні auth payloads звужені до:

```text
client | pharmacy
```

Тобто зараз є такий розрив:

```text
AuthApplication
        ↓
client | pharmacy | admin

LoginPayload / ForgotPasswordPayload
        ↓
client | pharmacy
```

Backend має ту саму ситуацію.

`loginSchema` дозволяє тільки:

```text
client
pharmacy
```

`forgotPasswordSchema` також дозволяє тільки:

```text
client
pharmacy
```

А password-reset URL resolver має mapping лише:

```text
client   → CLIENT_APP_URL
pharmacy → PHARMACY_APP_URL
```

Отже, Stage 3 має прибрати саме ці штучні обмеження.

---

# 4. Важлива межа: public registration admin НЕ з'являється

Це принципова acceptance condition.

Після етапу 3:

```text
Login application:
client | pharmacy | admin
```

```text
Forgot password application:
client | pharmacy | admin
```

але:

```text
Public registration role:
client | pharmacy
```

і **не**:

```text
client | pharmacy | admin
```

Тобто цей контракт лишається незмінним:

```ts
role?: Extract<UserRole, 'client' | 'pharmacy'>;
```

Так само backend `registerSchema` продовжує дозволяти лише:

```ts
USER_ROLES.CLIENT;
USER_ROLES.PHARMACY;
```

Не додаємо:

```text
Register as admin
```

ані в API, ані в client, ані в майбутній admin application.

---

# 5. `LoginPayload`

Зараз:

```ts
export type LoginPayload = {
  email: string;
  password: string;
  application: Extract<AuthApplication, 'client' | 'pharmacy'>;
};
```

Після етапу контракт повинен дозволяти всі підтримувані applications:

```ts
export type LoginPayload = {
  email: string;
  password: string;
  application: AuthApplication;
};
```

або еквівалентний exhaustively typed контракт.

Не потрібно створювати:

```text
AdminLoginPayload
ClientLoginPayload
PharmacyLoginPayload
```

Auth payload один.

Application визначає, для якого frontend application користувач проходить login.

---

# 6. Чому окремий `AdminLoginPayload` не потрібен

Login credentials у всіх applications однакові:

```text
email
password
application
```

Відмінність лише:

```text
application
```

Тому правильна модель:

```ts
loginUser({
  email,
  password,
  application: 'admin',
});
```

а не:

```ts
adminLoginUser(...)
pharmacyLoginUser(...)
clientLoginUser(...)
```

із трьома копіями контракту.

---

# 7. Backend `loginSchema`

Зараз backend приймає:

```text
client
pharmacy
```

Треба дозволити:

```text
client
pharmacy
admin
```

Концептуально:

```ts
application: z.enum([
  AUTH_APPLICATIONS.CLIENT,
  AUTH_APPLICATIONS.PHARMACY,
  AUTH_APPLICATIONS.ADMIN,
]);
```

Application залишається **обов'язковим**.

Не робимо:

```ts
application: ...optional()
```

і не визначаємо application за `Origin`.

Frontend явно говорить, у який application входить користувач.

---

# 8. Сам `loginUserService` майже не потрібно переписувати

Поточна backend-логіка вже має правильний generic contract:

```ts
user.role !== input.application;
```

Тобто після того як schema почне пропускати:

```text
application: admin
```

цей код природно підтримуватиме admin.

Не потрібно додавати:

```ts
if (application === 'admin') {
  ...
}
```

окрему auth-гілку.

Admin тут не особливий тип автентифікації.

Це той самий User + той самий password + той самий session lifecycle.

---

# 9. Захист від account enumeration під час login

Поточну поведінку потрібно зберегти.

Для:

```text
невідомий email
неправильний password
правильний email, але application не відповідає role
```

зовнішня відповідь повинна лишатися однаковою.

Наприклад:

```text
client account + application=admin
```

не повинен повідомляти:

> This user is not an admin.

Так само:

```text
admin account + application=client
```

не повинен розкривати:

> This is an admin account.

Залишається generic:

```text
invalid credentials
```

зі стабільним auth error code.

---

# 10. `ForgotPasswordPayload`

Зараз:

```ts
export type ForgotPasswordPayload = {
  email: string;
  application: Extract<AuthApplication, 'client' | 'pharmacy'>;
};
```

Після етапу:

```ts
export type ForgotPasswordPayload = {
  email: string;
  application: AuthApplication;
};
```

Тобто підтримуються:

```text
client
pharmacy
admin
```

---

# 11. Backend `forgotPasswordSchema`

Backend validation також розширюємо до:

```text
client
pharmacy
admin
```

Application лишається:

```text
required
```

Не визначається автоматично за знайденим користувачем.

Це важливо, тому що reset link має вести назад у той application, з якого користувач почав recovery flow.

---

# 12. Password recovery не повинен розкривати admin email

Зараз flow правильно використовує anti-enumeration поведінку.

Її необхідно зберегти й для admin.

Запити:

```text
existing admin email + application=admin
unknown email + application=admin
blocked admin + application=admin
client email + application=admin
```

мають мати однаковий зовнішній success envelope.

Тобто UI надалі може показувати щось на кшталт:

```text
If an account with this email exists, password reset instructions were sent.
```

Backend не повідомляє, чи існує admin.

---

# 13. Password-reset application routing

Саме тут зараз є конкретна відсутня частина.

Поточний resolver фактично знає:

```text
client
pharmacy
```

Після Stage 3 він повинен знати:

```text
client   → CLIENT_APP_URL
pharmacy → PHARMACY_APP_URL
admin    → ADMIN_APP_URL
```

Концептуально:

```ts
const appUrls = {
  client: env.CLIENT_APP_URL,
  pharmacy: env.PHARMACY_APP_URL || env.CLIENT_APP_URL,
  admin: env.ADMIN_APP_URL,
} satisfies Record<ForgotPasswordInput['application'], string | undefined>;
```

---

# 14. Admin reset URL

Для admin email має формуватися URL:

```text
http://localhost:3001/reset-password
```

а у production:

```text
ADMIN_APP_URL/reset-password
```

Token передається тим самим поточним механізмом, що й для інших applications.

Не потрібно створювати:

```text
/admin/reset-password
```

лише через те, що це admin.

Auth pages у структурі застосунку заплановані як top-level routes:

```text
/login
/password-recovery
/reset-password
```

А вже authenticated application живе під:

```text
/admin/*
```

---

# 15. Не додавати `application` у reset-confirm payload

Це важливий security contract.

Поточний:

```ts
ResetPasswordPayload = {
  token;
  newPassword;
}
```

залишається таким самим.

Не робимо:

```ts
{
  token,
  newPassword,
  application: 'admin'
}
```

Під час password reset authoritative credential — це:

```text
opaque single-use reset token
```

а не application, який browser ще раз прислав під час confirm.

Тобто application потрібний лише на етапі **issuance reset link**.

---

# 16. `ADMIN_APP_URL` — що реально треба зробити

В актуальному проєкті:

```env
ADMIN_APP_URL=http://localhost:3001
```

**вже є**.

Тому не потрібно додавати цю змінну вдруге.

Потрібно:

1. реально використати її у password-reset application routing;
2. перевірити production contract;
3. додати tests, що admin reset URL не потрапляє на client/pharmacy origin.

---

# 17. Поведінка при відсутньому `ADMIN_APP_URL`

Оскільки після Stage 3 password recovery для admin стає реальним підтримуваним flow, production не повинен тихо робити:

```text
admin reset → client site
```

Не потрібно fallback:

```text
ADMIN_APP_URL || CLIENT_APP_URL
```

для admin.

Це приховає неправильну deployment configuration.

Для local/test середовища допустимий canonical fallback:

```text
http://localhost:3001
```

А production configuration повинна вимагати коректний admin origin.

Головний принцип:

```text
admin reset link ніколи не йде на client application
```

---

# 18. `AuthApplication` не змінюємо

Цей файл уже правильний:

```ts
export type AuthApplication = 'client' | 'pharmacy' | 'admin';
```

Не потрібно його редагувати тільки заради того, щоб він з'явився в diff.

Так само не змінюємо без потреби frontend config domain values — вони вже exhaustive.

---

# 19. User role також уже правильний

Shared:

```ts
export type UserRole = 'client' | 'pharmacy' | 'admin';
```

Backend:

```text
USER_ROLES.ADMIN
```

вже існує.

`User` model уже дозволяє `admin`.

Тому нову роль:

```text
admin_owner
```

не додаємо.

Так само не створюємо:

```text
super_admin
platform_owner
admin_employee
```

як `User.role`.

---

# 20. Що означає Platform Owner на цьому етапі

У майбутньому platform owner буде admin із максимальними permissions.

Але permissions — **не Stage 3**.

Тому зараз bootstrap script створює:

```text
User
role = admin
status = active
```

і саме цей перший admin надалі стане platform owner, коли буде реалізований permission layer.

Не додаємо зараз у User model:

```text
isPlatformOwner
permissions
adminRole
permissionPreset
```

Це передчасно й залізе в майбутній RBAC-етап.

---

# 21. Навіщо потрібен bootstrap

Маємо замкнене коло:

```text
public admin registration = заборонена
↓
нових employees пізніше створює admin
↓
але першого admin ще немає
```

Отже, потрібен окремий trusted bootstrap mechanism.

Правильний варіант:

```bash
pnpm seed:admin-owner
```

---

# 22. Чого bootstrap НЕ повинен робити

Не створюємо:

```text
POST /auth/register-admin
POST /admin/register
POST /bootstrap/admin
/admin/secret-register
```

Не створюємо приховану сторінку:

```text
/admin/create-first-user
```

Не додаємо query flag:

```text
?superSecret=true
```

І не додаємо тимчасову кнопку в UI.

Bootstrap — це **server-side deployment script**, а не HTTP functionality.

---

# 23. Де розташувати bootstrap script

Я б зробила окремий файл:

```text
apps/api/src/scripts/seed-admin-owner.ts
```

Не треба вбудовувати це в загальний:

```text
apps/api/src/scripts/seed.ts
```

Тому що загальний seed створює demo/domain data.

А bootstrap admin — security/deployment operation.

Це різні задачі.

---

# 24. Script command в `apps/api/package.json`

Додати окрему команду, наприклад:

```json
"seed:admin-owner": "node ../../scripts/dev/run-with-bff-secret.mjs tsx src/scripts/seed-admin-owner.ts"
```

Використання того самого dev wrapper дозволяє script працювати з тим самим API environment contract.

---

# 25. Root command

У root `package.json`:

```json
"seed:admin-owner": "pnpm --filter @e-pharmacy/api seed:admin-owner"
```

Тоді з кореня монорепозиторію:

```bash
pnpm seed:admin-owner
```

---

# 26. Дані для першого admin

Я б не передавала password через CLI arguments.

Не так:

```bash
pnpm seed:admin-owner --email=a@b.com --password=Secret123
```

Бо password може залишитися:

```text
shell history
process list
CI command logs
```

Краще використовувати environment values:

```text
ADMIN_OWNER_NAME
ADMIN_OWNER_EMAIL
ADMIN_OWNER_PASSWORD
ADMIN_OWNER_PHONE
ADMIN_OWNER_ADDRESS
```

`ADDRESS` може бути optional.

---

# 27. `.env.example` для bootstrap

Можна додати окремий чітко позначений block:

```env
# One-time admin bootstrap only.
# Set these temporarily when running `pnpm seed:admin-owner`.
# Do not commit real credentials.

ADMIN_OWNER_NAME=
ADMIN_OWNER_EMAIL=
ADMIN_OWNER_PASSWORD=
ADMIN_OWNER_PHONE=
ADMIN_OWNER_ADDRESS=
```

Ці значення не є звичайними runtime settings API.

Після створення першого owner у deployment environment їх бажано прибрати.

---

# 28. Bootstrap credentials не додаємо до global `env` object без потреби

API server не повинен вимагати:

```text
ADMIN_OWNER_EMAIL
ADMIN_OWNER_PASSWORD
```

кожного разу під час normal startup.

Тому bootstrap-specific credentials краще читати й валідовувати **в самому bootstrap flow**, а не робити їх обов'язковими для:

```text
apps/api/src/config/env.ts
```

Інакше production API раптом не стартуватиме без seed credentials, хоча bootstrap давно завершений.

---

# 29. Валідація bootstrap input

Не копіюємо regex вручну.

Bootstrap повинен використовувати ті самі backend validation primitives для:

```text
name
email
password
phone
address
```

що й інші User flows.

Можна створити невелику internal schema, наприклад:

```text
apps/api/src/schemas/admin-bootstrap.schema.ts
```

Вона не є HTTP schema.

Це validation contract для trusted deployment script.

---

# 30. Що має створювати bootstrap

Один:

```text
User
```

із:

```text
role: admin
status: active
```

Password перед збереженням:

```text
hashPassword(...)
```

Не зберігаємо plain password.

Не створюємо:

```text
Client
Pharmacy
Cart
ProductOffer
```

або будь-яку іншу domain entity.

Admin — окремий account role, не pharmacy/client profile.

---

# 31. Bootstrap не має ставити pharmacy/client поля

Не потрібно:

```text
defaultClientPharmacyId
isDefaultPharmacyClient
pharmacy status
pharmacy documents
client profile
```

Так само не створюємо fake pharmacy лише тому, що `phone/address` використовуються User model.

---

# 32. `createdBy`

У bootstrap першого admin немає authenticated actor, який міг би бути:

```text
createdBy
```

Тому не потрібно створювати:

```text
createdBy: self
```

або fake system user.

Перший bootstrap account може мати:

```text
createdBy = undefined
```

Це чесний historical state.

Подальших employees уже буде створювати реальний admin, і там `createdBy` стане meaningful.

---

# 33. Поведінка при повторному запуску bootstrap

Script не повинен бути небезпечним.

Особливо він не повинен при кожному запуску:

```text
перезаписувати password
міняти email
міняти phone
активувати заблокованого admin
```

Я б заклала таку поведінку.

### Admin ще немає

```text
→ створити першого admin
```

### Такий самий admin уже існує

```text
→ завершити без змін
→ повідомити, що bootstrap уже виконано
```

Не reset password автоматично.

### Уже існує інший admin

```text
→ bootstrap відмовляється створювати другого
```

Бо command призначений саме для:

```text
first admin
```

а не для employee management.

---

# 34. Якщо bootstrap email уже належить client/pharmacy

Категорично не робимо:

```text
client → admin
pharmacy → admin
```

автоматично.

Якщо:

```text
ADMIN_OWNER_EMAIL
```

вже зайнятий non-admin account:

```text
→ script завершується помилкою
```

Role conversion тут неприпустимий.

---

# 35. Якщо bootstrap phone уже зайнятий

Оскільки `User.phone` unique, це також повинно бути fail-fast.

Не потрібно обходити unique constraint чи генерувати fake phone.

Script має повідомити, що bootstrap data конфліктують із наявним account.

---

# 36. Не логувати secrets

У console/output bootstrap script не повинні потрапити:

```text
ADMIN_OWNER_PASSWORD
password hash
JWT
cookies
reset token
BFF secret
MongoDB URI
```

Так само не потрібно логувати весь environment object.

Для результату достатньо:

```text
Admin bootstrap completed.
```

або safe identifier / masked email, якщо справді потрібно.

---

# 37. Login admin після Stage 3 — backend contract

Після Stage 3 цей payload повинен бути валідним:

```json
{
  "email": "admin@example.com",
  "password": "...",
  "application": "admin"
}
```

І якщо:

```text
email/password правильні
role === admin
status === active
```

backend повинен створити normal auth session тим самим механізмом, що й для client/pharmacy.

Не створюємо:

```text
admin JWT
special admin token
admin refresh token format
```

Session infrastructure спільна.

---

# 38. Blocked admin

Поведінка повинна залишатися тією самою, що для інших roles.

Admin зі:

```text
status = blocked
```

не повинен отримувати робочу session.

Не потрібно чекати `AdminProtectedRoute`, щоб backend security почала діяти.

Frontend guard — UX/navigation layer.

Backend auth lifecycle — security layer.

---

# 39. Password recovery admin після Stage 3

Payload:

```json
{
  "email": "admin@example.com",
  "application": "admin"
}
```

для валідного active admin має створити reset token і сформувати URL через:

```text
ADMIN_APP_URL
```

Наприклад:

```text
http://localhost:3001/reset-password?token=...
```

з поточним token handoff contract.

---

# 40. Password reset після Stage 3

Confirm flow лишається shared:

```json
{
  "token": "...",
  "newPassword": "..."
}
```

Після успішного reset:

```text
existing sessions revoke
reset token invalidated
new password usable
old password unusable
```

Admin не отримує окремої password-reset implementation.

---

# 41. Existing security lifecycle не послаблюємо

Зберігаємо поточні правила:

```text
opaque reset token
hashed token у DB
expiration
single use
session revocation після password reset
generic recovery response
stable auth error codes
BFF ownership browser cookies
```

Stage 3 тільки додає третій supported application.

Не переписує auth architecture.

---

# 42. Admin browser ще не ходить у backend

Stage 3 не створює:

```text
apps/admin/src/lib/api/browser/auth.api.ts
```

і не створює:

```text
apps/admin/src/app/api/auth/*
```

лише заради майбутнього.

Це буде потрібно разом із реальними Login/Recovery/Reset pages.

Зараз тестуємо shared/backend contracts без створення порожнього frontend auth layer.

---

# 43. Login UI на цьому етапі НЕ створюємо

Не створюємо:

```text
apps/admin/src/app/login/page.tsx
apps/admin/src/components/auth/LoginForm/*
```

Так само не копіюємо:

```text
apps/client/src/components/auth/*
```

у admin.

Stage 3 закінчується **готовністю контрактів**.

Наступний етап уже зможе правильно вирішити, які auth visual blocks потрібно винести/reuse.

---

# 44. Password Recovery UI також не створюємо

Не створюємо:

```text
/password-recovery
```

на Stage 3.

Але backend уже повинен бути готовий приймати:

```text
application: admin
```

і відправляти reset link на admin origin.

---

# 45. Reset Password UI також не створюємо

Не створюємо:

```text
/reset-password
```

у `apps/admin` на цьому етапі.

Email link технічно вже формуватиметься на майбутній route.

До реалізації наступного етапу цей route може повертати 404.

Це так само нормально, як після Stage 1 `/admin/dashboard` ще був відсутній.

Не створюємо тимчасову сторінку лише щоб URL «кудись відкривався».

---

# 46. Оновлення auth contract tests

Зараз у проєкті вже є tests, які спеціально фіксують старий стан:

> public password recovery does not accept the future admin application

Після Stage 3 цей test стає неправильним.

Його потрібно замінити контрактом:

```text
forgot password accepts:
client
pharmacy
admin
```

При цьому окремий test повинен продовжити гарантувати:

```text
public registration rejects admin
```

---

# 47. Backend login validation tests

Потрібно перевірити всі три applications:

```text
client
pharmacy
admin
```

І окремо:

```text
missing application → invalid
unknown application → invalid
```

Наприклад:

```text
application: supplier
```

не проходить.

---

# 48. Password recovery validation tests

Так само:

```text
client   ✅
pharmacy ✅
admin    ✅
```

і:

```text
unknown  ❌
missing  ❌
```

---

# 49. Auth service login tests

Корисно додати contract/integration case:

```text
admin User
+
application=admin
+
correct password
→ login success
```

І негативні:

```text
admin User + application=client → generic invalid credentials
client User + application=admin → generic invalid credentials
```

Ніякої інформації про real role назовні.

---

# 50. Password-reset routing tests

Обов'язково перевіряємо:

```text
client → CLIENT_APP_URL/reset-password
pharmacy → PHARMACY_APP_URL/reset-password
admin → ADMIN_APP_URL/reset-password
```

Особливо важливо мати explicit admin case.

Це захистить від майбутнього regression, коли хтось випадково залишить mapping лише для двох застосунків.

---

# 51. Існуючий `buildPasswordResetUrl` не треба дублювати

Функція вже будує:

```text
/reset-password
```

і token handoff.

Не створюємо:

```text
buildAdminPasswordResetUrl()
```

Потрібно лише передати їй правильний:

```text
ADMIN_APP_URL
```

---

# 52. `check:auth-contracts` треба оновити

Зараз structural auth check прямо очікує відсутність:

```text
AUTH_APPLICATIONS.ADMIN
```

у forgot-password schema.

Після Stage 3 це правило потрібно інвертувати.

Check має гарантувати:

```text
LoginPayload supports AuthApplication
ForgotPasswordPayload supports AuthApplication

loginSchema:
client
pharmacy
admin

forgotPasswordSchema:
client
pharmacy
admin

registerSchema:
client
pharmacy only
```

Тобто він одночасно захищає дві речі:

```text
admin auth дозволений
admin public registration заборонена
```

---

# 53. Existing type parity checks мають лишатися зеленими

У проєкті вже є parity між:

```text
frontend AuthApplication
backend AUTH_APPLICATIONS
```

Це добре.

Не потрібно вводити admin-specific copy цього check.

Після Stage 3:

```text
types
config
backend constants
backend schemas
```

повинні залишатися узгодженими.

---

# 54. Structural check для Stage 3

Я б додала:

```text
scripts/checks/admin/check-admin-auth-foundation.mjs
```

Його задача — перевіряти саме Stage 3 boundary.

---

# 55. Що перевіряє `check-admin-auth-foundation`

Наприклад:

```text
shared login payload accepts AuthApplication
shared forgot-password payload accepts AuthApplication

backend login schema includes ADMIN
backend forgot-password schema includes ADMIN

reset routing includes ADMIN_APP_URL

register payload не дозволяє admin
register schema не дозволяє admin

seed-admin-owner script існує

root seed:admin-owner script існує
API seed:admin-owner script існує

admin bootstrap не є HTTP route

apps/admin не має register page
apps/admin не має register API route
```

Не прив'язуємо check до точного форматування коду.

---

# 56. Structural check не повинен вимагати Login page

Навпаки, Stage 3 check не повинен змушувати створити:

```text
apps/admin/src/app/login
```

бо Login UI — наступний етап.

Ми перевіряємо:

```text
auth foundation ready
```

а не:

```text
auth UI implemented
```

---

# 57. Bootstrap structural rules

Check може додатково гарантувати, що seed script:

```text
не створює HTTP server
не імпортує Express Router
не створює public endpoint
використовує USER_ROLES.ADMIN
використовує USER_STATUSES.ACTIVE
hashPassword викликається
```

І що в коді немає hardcoded:

```text
real admin email
real admin password
```

---

# 58. Bootstrap tests

Мінімально треба перевірити:

```text
valid bootstrap input проходить validation
invalid email не проходить
weak/invalid password не проходить
invalid phone не проходить
```

Для service/database behavior:

```text
no admin → admin created
same admin already exists → no credential overwrite
different admin already exists → bootstrap rejected
email belongs to client/pharmacy → rejected
phone conflict → rejected
stored password hashed
created role = admin
created status = active
```

Якщо Mongo integration infrastructure уже дозволяє це перевірити, краще використати її, а не mock entire Mongoose layer.

---

# 59. Особливо протестувати повторний запуск

Це важливіше, ніж здається.

Сценарій:

```text
1. запустили seed
2. owner змінив password через normal auth flow
3. через місяць хтось випадково ще раз запустив seed
```

Script **не повинен повернути старий bootstrap password**.

Тобто rerun:

```text
не змінює існуючий password
```

---

# 60. README admin

`apps/admin/README.md` варто оновити.

Після Stage 3 зафіксувати:

```text
shared/backend auth now supports application=admin
public admin registration does not exist
first admin is created through pnpm seed:admin-owner
admin auth UI is not implemented yet
Login/Recovery/Reset come in the next stage
```

---

# 61. API README / env documentation

Якщо API documentation має section про environment або seed commands, додати коротку згадку про:

```bash
pnpm seed:admin-owner
```

і bootstrap environment variables.

Не потрібно писати реальні credentials у README.

---

# 62. Нових dependencies не потрібно

Для Stage 3 вже є:

```text
zod
mongoose
bcrypt/hashPassword infrastructure
tsx
shared types/config
```

Тому:

```text
pnpm-lock.yaml
```

очікувано **не повинен змінюватися**.

Якщо lockfile змінився — треба перевірити, чому.

---

# 63. Не змінюємо auth password rules

Stage 3 не є приводом:

```text
посилювати password rules
міняти email normalization
міняти token expiration
міняти JWT duration
міняти refresh rotation
```

Це окремі concerns.

Bootstrap password просто проходить той самий поточний password contract.

---

# 64. Не створюємо username

Admin login залишається:

```text
email + password
```

Не вводимо:

```text
username
loginName
adminLogin
employeeCode
```

У системі identity зараз:

```text
email
```

і цього достатньо.

На майбутній Login page поле можна назвати:

```text
Email
```

або в дизайні:

```text
Login / Email
```

але backend field лишається:

```ts
email;
```

---

# 65. Не змінюємо email uniqueness

Admin використовує ту саму global User collection.

Тому один email не може одночасно бути:

```text
client
і
admin
```

або:

```text
pharmacy
і
admin
```

Це правильна модель для поточної identity architecture.

Bootstrap не обходить цей constraint.

---

# 66. Не створюємо окрему Admin model

Не потрібно:

```text
Admin
AdminUser
PlatformAdmin
```

як окрему Mongo collection.

Admin уже є:

```text
User.role = admin
```

Employee-specific permissions/documents пізніше можуть отримати свої entities, але authentication identity лишається User.

---

# 67. Не додаємо permissions зараз

Stage 3 не повинен додати:

```text
permissions
roles matrix
employee permissions
owner permission presets
```

Це буде окремий етап.

Перший admin зараз лише створюється як trusted bootstrap account.

---

# 68. Не додаємо employee creation зараз

Так само поки немає:

```text
Create Employee
Invite Employee
Set password invitation
Employee documents
```

Це майбутня admin business functionality.

Bootstrap script не повинен перетворюватися на generic:

```bash
pnpm create-admin-user
```

для всіх співробітників.

Він існує **тільки для першого account**.

---

# 69. Команди перевірки

Після реалізації Stage 3 окремо:

```bash
pnpm check:auth-contracts
```

```bash
pnpm check:type-contracts
```

```bash
pnpm check:validation-contracts
```

```bash
pnpm --filter @e-pharmacy/api test
```

```bash
pnpm --filter @e-pharmacy/api type-check
```

```bash
pnpm --filter @e-pharmacy/api lint
```

і новий:

```bash
pnpm check:admin-auth-foundation
```

---

# 70. Перевірка admin application

Сам `apps/admin` також не повинен зламатися через shared type changes:

```bash
pnpm lint:admin
pnpm type-check:admin
pnpm build:admin
```

Навіть якщо auth UI там ще немає.

---

# 71. Оновлення `check:admin`

Після Stage 3 приблизно:

```text
check:admin-app-shell
↓
check:admin-providers
↓
check:admin-status-pages
↓
check:admin-auth-foundation
↓
lint
↓
type-check
↓
tests
↓
build
```

Новий structural check додаємо **перед** lint/type-check.

---

# 72. Інтеграція в `check:before-deploy`

Так само як на попередніх етапах, додаємо лише structural:

```bash
pnpm check:admin-auth-foundation
```

до structural частини.

Не вставляємо туди повний:

```bash
pnpm check:admin
```

бо lint/type-check/test/build уже запускаються загальними workspace commands.

---

# 73. Full monorepo verification

Фінально:

```bash
pnpm check:before-deploy
```

Повинен залишитися зеленим.

Особливо перевіряємо, що розширення:

```text
LoginPayload
ForgotPasswordPayload
```

не зламало client/pharmacy.

Обидва вони як і раніше передають:

```text
client
```

або:

```text
pharmacy
```

і для них поведінка не повинна змінитися.

---

# 74. Ручна перевірка bootstrap

У локальному test/development DB:

```text
1. переконатися, що admin відсутній;
2. тимчасово задати bootstrap env;
3. pnpm seed:admin-owner;
4. перевірити User у DB;
5. role = admin;
6. status = active;
7. password не plain text;
8. повторно запустити script;
9. переконатися, що password/identity не були переписані.
```

Після перевірки test credentials видалити.

---

# 75. Не використовувати production credentials у source

Для repository/tests використовуємо лише очевидно тестові значення:

```text
admin@example.com
```

і synthetic password.

Ніякі реальні email/password platform owner не повинні потрапити:

```text
Git
tests
fixtures
README
.env.example
archive
```

---

# 76. Acceptance scenario: admin login contract

Після Stage 3 backend повинен підтримувати:

```text
admin exists
role = admin
status = active
correct email/password
application = admin
```

результат:

```text
normal AuthResponse
normal access/refresh lifecycle
normal session
```

Самої admin Login page ще немає.

---

# 77. Acceptance scenario: wrong application

```text
admin exists
correct admin password
application = client
```

результат:

```text
generic invalid credentials
```

Не:

```text
You should use admin application
```

---

# 78. Acceptance scenario: admin password recovery

```text
admin@example.com
application=admin
```

результат:

```text
generic 200 response
reset token issued
email URL uses ADMIN_APP_URL
```

---

# 79. Acceptance scenario: unknown admin email

```text
unknown@example.com
application=admin
```

результат:

```text
той самий зовнішній recovery response
```

Без reset token у DB і без email.

---

# 80. Acceptance scenario: registration

Спроба:

```json
{
  "role": "admin"
}
```

через public registration:

```text
rejected
```

Після Stage 3 це правило має бути спеціально захищене test/check.

---

# 81. Що НЕ входить у Stage 3

На цьому етапі не робимо:

```text
Admin Login page
Password Recovery page
Reset Password page
Admin AuthProvider
AdminProtectedRoute
admin BFF auth routes
admin browser auth.api
Header
Sidebar
AdminShell
Profile
Dashboard
permissions
employees
invitations
audit log
client header admin badge
```

Усе це залишається наступним роботам.

---

# 82. Очікуваний набір змінених/доданих файлів

Основний scope я очікую приблизно такий:

```text
packages/types/src/auth/payloads.ts
UPDATE
```

```text
apps/api/src/schemas/auth.schema.ts
UPDATE
```

```text
apps/api/src/services/auth.service.ts
UPDATE
```

```text
apps/api/src/schemas/auth-validation.contract.test.ts
UPDATE
```

```text
apps/api/src/schemas/auth-flow-validation.contract.test.ts
UPDATE
```

```text
apps/api/src/utils/password-reset-url.test.ts
UPDATE / EXPAND
```

```text
scripts/checks/auth/check-auth-contracts.mjs
UPDATE
```

Bootstrap:

```text
apps/api/src/scripts/seed-admin-owner.ts
NEW
```

Можливий окремий internal validation contract:

```text
apps/api/src/schemas/admin-bootstrap.schema.ts
NEW
```

і його tests:

```text
apps/api/src/schemas/admin-bootstrap.schema.test.ts
NEW
```

або еквівалентні test files.

Scripts:

```text
apps/api/package.json
UPDATE
```

```text
package.json
UPDATE
```

```text
scripts/checks/admin/check-admin-auth-foundation.mjs
NEW
```

Documentation/config:

```text
apps/api/.env.example
UPDATE
```

```text
apps/admin/README.md
UPDATE
```

Залежно від обраного production validation `ADMIN_APP_URL` може також знадобитися невелике оновлення:

```text
apps/api/src/config/env.ts
```

але сама змінна там уже існує — її не потрібно додавати вдруге.

---

# 83. Файли, які не очікую змінювати

Без окремої причини Stage 3 не повинен торкатися:

```text
apps/client/src/components
apps/pharmacy/src/components
apps/admin/src/app/loading.tsx
apps/admin/src/app/error.tsx
apps/admin/src/app/global-error.tsx
apps/admin/src/app/not-found.tsx

packages/ui

Product/Order/Client/Pharmacy domains
```

Також не очікую нового dependency, тому:

```text
pnpm-lock.yaml
```

має лишитися незмінним.

---

# 84. Definition of Done

Stage 3 готовий, коли виконано все:

```text
AuthApplication як і раніше містить client | pharmacy | admin;

LoginPayload підтримує admin;

ForgotPasswordPayload підтримує admin;

backend loginSchema приймає admin;

backend forgotPasswordSchema приймає admin;

public registerSchema як і раніше відхиляє admin;

login service не має окремої дубльованої admin auth logic;

admin login використовує той самий session lifecycle;

wrong application не розкриває реальну role;

admin password recovery має anti-enumeration behavior;

admin reset URL використовує ADMIN_APP_URL;

admin reset URL не fallback-иться на client app;

reset confirm не отримує application;

ADMIN_APP_URL не дублюється — використовується вже існуючий config;

існує pnpm seed:admin-owner;

bootstrap не є HTTP endpoint;

bootstrap створює лише role=admin/status=active User;

password hash-иться;

bootstrap не створює Pharmacy/Client;

bootstrap не конвертує існуючого client/pharmacy в admin;

bootstrap не перезаписує password при повторному запуску;

public admin registration відсутня;

нові auth tests проходять;

check:auth-contracts проходить;

check:admin-auth-foundation проходить;

lint/type-check/API tests проходять;

admin lint/type-check/build проходять;

pnpm check:before-deploy проходить;

Login/Recovery/Reset UI ще не реалізовані;

AdminProtectedRoute ще не реалізований;

permissions і employees ще не реалізовані.
```

---

# 85. Що ми матимемо після Stage 3

Після цього architecture виглядає так:

```text
Shared Auth
├─ client ✅
├─ pharmacy ✅
└─ admin ✅
```

```text
Public Registration
├─ client ✅
├─ pharmacy ✅
└─ admin ❌
```

```text
Password Recovery
├─ client → CLIENT_APP_URL
├─ pharmacy → PHARMACY_APP_URL
└─ admin → ADMIN_APP_URL
```

```text
Admin bootstrap
└─ pnpm seed:admin-owner
```

А `apps/admin` при цьому все ще лишається чистим фундаментом без auth UI.

---

# 86. Наступний логічний етап

Тільки після цього вже без костилів робимо:

```text
Login
↓
Password Recovery
↓
Reset Password
↓
Admin AuthProvider/BFF
↓
AdminProtectedRoute
```

Тобто Stage 3 відповідає на питання:

> Чи вміє вся система безпечно автентифікувати admin як третій тип application і чи існує перший admin?

А наступний етап відповість:

> Як admin користується цим через `localhost:3001`?

Окремо я б особливо зафіксувала дві речі перед реалізацією: ADMIN_APP_URL уже є в останньому коді, тому не треба створювати його вдруге; і перший platform owner поки не потребує isPlatformOwner/permissions у Mongo — інакше ми непомітно почнемо майбутній RBAC раніше часу. На етапі 3 це просто перший trusted User з role=admin, а owner/permissions оформимо на відповідному етапі.
