Так. І тут після звірки з поточним кодом є одна важлива архітектурна поправка: для admin не треба копіювати PharmacyProtectedRoute один-в-один. У @e-pharmacy/auth/next уже є shared RoleProtectedRoute, який client уже використовує. Тому Stage 4 краще будувати поверх нього, а admin-specific залишити тільки правила доступу, redirect destinations та fallback UI. Так ми не народимо третій guard із тією самою логікою 😄

# ЕТАП 4 — AdminProtectedRoute

## 1. Мета етапу

На цьому етапі потрібно зробити єдину auth/access boundary для всіх приватних admin routes:

```text
/admin/*
```

Правило доступу:

```text
role === admin
status === active
```

Усі майбутні сторінки:

```text
/admin/dashboard
/admin/profile
/admin/pharmacies
/admin/products
/admin/orders
...
```

повинні автоматично успадковувати цю перевірку.

Жодна окрема admin page надалі не повинна писати власне:

```ts
if (user.role !== 'admin') ...
```

або:

```ts
if (user.status !== 'active') ...
```

---

# 2. Очікувана поведінка

Матриця повинна бути такою:

```text
auth bootstrap
→ loader

no session
→ /login

active client
→ client application

active pharmacy
→ pharmacy application

active admin
→ /admin/* дозволено

blocked admin
→ session invalidated / cookies cleared
→ /login

auth unavailable
→ shared ErrorPage
```

Це один централізований contract.

---

# 3. Важлива межа Stage 4

На цьому етапі **не реалізовуємо сам Login UI**.

Не створюємо:

```text
/login page
LoginForm
Password Recovery
Reset Password
Forgot Password form
admin login BFF
```

Але route contract:

```text
/login
```

вже повинен існувати як `ADMIN_ROUTES.LOGIN`.

Тому після Stage 4:

```text
unauthenticated
→ /login?redirect=...
→ поки branded 404
```

це очікувано.

Сам `/login` буде реалізований окремим наступним auth UI етапом.

Не створюємо тимчасовий Login лише для того, щоб redirect «кудись приземлявся».

---

# 4. Чому Stage 4 все одно потребує частину auth infrastructure

`AdminProtectedRoute` не може працювати сам по собі.

Йому потрібно знати:

```text
session існує?
хто current user?
role?
status?
auth backend доступний?
```

Тому Stage 4 має додати **мінімальний session bootstrap layer** для admin.

Не Login.

Не registration.

Лише:

```text
GET /api/auth/me
POST /api/auth/logout

Admin AuthProvider
AdminProtectedRoute
```

Це мінімум, необхідний guard.

---

# 5. Що вже є shared і не треба копіювати

У `@e-pharmacy/auth` уже існують:

```text
AuthProviderCore
useAuth
RoleProtectedRoute
auth state machine
bootstrap retry
session invalidation
cross-tab session synchronization
safe login redirect builder
trusted external redirect helpers
```

Тому не створюємо:

```text
AdminAuthContext
AdminAuthState
AdminSessionStore
useAdminSession
AdminRoleGuardCore
AdminAuthMachine
```

Shared auth уже вирішує ці задачі.

---

# 6. Не копіюємо `PharmacyProtectedRoute`

Поточний `PharmacyProtectedRoute` містить власні:

```text
usePathname
useSearchParams
useEffect
redirect logic
role check
loading state
error fallback
```

Але після його появи shared auth уже отримав:

```text
RoleProtectedRoute
```

Тому для нового admin правильніше використати:

```tsx
import { RoleProtectedRoute } from '@e-pharmacy/auth/next';
```

а не копіювати pharmacy implementation.

---

# 7. Admin wrapper все одно потрібний

Shared guard не знає:

```text
яка role дозволена
що означає active admin
куди відправляти client
куди відправляти pharmacy
які тексти показувати
який admin login route
```

Тому створюємо тонкий app-specific wrapper:

```text
apps/admin/src/components/auth/AdminProtectedRoute.tsx
```

Його задача — конфігурація shared guard.

---

# 8. Головний access contract

Admin private route доступний лише якщо:

```ts
user.role === 'admin' && user.status === 'active';
```

Винести це в чисту функцію:

```text
apps/admin/src/lib/auth/admin-route-access.ts
```

Наприклад:

```ts
export function canAccessAdminPrivateRoutes(user: AuthUser): boolean {
  return user.role === 'admin' && user.status === 'active';
}
```

Це:

- легко тестується;
- не дублюється на сторінках;
- пізніше може бути розширене permissions layer без переписування всіх routes.

---

# 9. Permissions поки НЕ додаємо

Stage 4 перевіряє лише coarse-grained identity:

```text
admin
active
```

Не перевіряємо:

```text
canViewProducts
canEditPharmacies
canModerateReviews
isPlatformOwner
permissions
permission presets
```

Це майбутній RBAC stage.

Поки:

```text
active admin
→ може увійти в admin application
```

А permission layer пізніше вирішуватиме, **які розділи та операції** йому доступні.

---

# 10. `ADMIN_ROUTES.LOGIN`

Поточний route contract містить:

```text
ROOT
DASHBOARD
```

Додаємо:

```ts
LOGIN: '/login';
```

Отже:

```ts
export const ADMIN_ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/admin/dashboard',
} as const;
```

Поки нових business routes не додаємо.

---

# 11. Збереження redirect після login

Якщо користувач відкрив:

```text
/admin/products?page=3
```

без session, guard не повинен просто відправити:

```text
/login
```

Він повинен зберегти destination:

```text
/login?redirect=%2Fadmin%2Fproducts%3Fpage%3D3
```

Shared `RoleProtectedRoute` уже вміє це робити.

Не пишемо власний:

```ts
new URLSearchParams(...)
```

для redirect.

---

# 12. Hash також не губимо

Якщо route:

```text
/admin/example?tab=documents#section
```

redirect contract повинен зберегти:

```text
pathname
query
hash
```

Shared guard уже збирає current location.

Тому не дублюємо цю логіку.

---

# 13. Open redirect protection

`redirect` parameter не можна використовувати як довільний URL.

Не повинно працювати:

```text
/login?redirect=https://evil.example
```

Shared auth routing уже має safe local redirect normalization.

Admin повинен перевикористати її.

Не створюємо власний regex для redirect.

---

# 14. Admin AuthProvider

Створюємо мінімальний provider:

```text
apps/admin/src/providers/AuthProvider/AuthProvider.tsx
apps/admin/src/providers/AuthProvider/index.ts
```

або аналогічну назву.

Він використовує:

```tsx
AuthProviderCore;
```

із:

```text
bootstrapMode="always"
```

---

# 15. Чому `bootstrapMode="always"`

Admin — приватний application.

При відкритті:

```text
localhost:3001
```

ми повинні завжди запитати authoritative current session.

Не покладаємося лише на browser session hint.

Причина також у тому, що:

```text
client
pharmacy
admin
```

можуть працювати на різних origins.

Same-origin browser hint не є authoritative cross-app session contract.

---

# 16. AuthProvider services Stage 4

Stage 4 provider потребує лише:

```text
getCurrentUser
logout
```

Не додаємо поки:

```text
login
register
logoutAll
sessions
change password
forgot password
reset password
```

Бо вони не потрібні самому protected route.

---

# 17. Browser auth API

Створити:

```text
apps/admin/src/lib/api/browser/auth.api.ts
```

Мінімально:

```ts
getCurrentUser();
logoutUser();
```

Browser працює тільки через:

```text
/api/auth/*
```

Не через:

```text
API_BASE_URL
```

---

# 18. Same-origin architecture зберігається

Admin auth flow:

```text
Browser
  ↓
/api/auth/me
  ↓
apps/admin BFF
  ↓
apps/api /auth/current
```

Logout:

```text
Browser
  ↓
/api/auth/logout
  ↓
apps/admin BFF
  ↓
apps/api /auth/logout
```

JWT browser не читає.

---

# 19. `GET /api/auth/me`

Додаємо:

```text
apps/admin/src/app/api/auth/me/route.ts
```

На основі shared proxy:

```tsx
createPrivateProxyRoute({
  backendPath: authRoutes.current,
  method: 'GET',
});
```

На Stage 4 `PATCH /auth/me` admin ще не потрібний.

Тому я б поки додала **тільки GET**.

Не копіюємо functionality «про всяк випадок».

---

# 20. `POST /api/auth/logout`

Додаємо:

```text
apps/admin/src/app/api/auth/logout/route.ts
```

Використовуємо існуючий auth proxy contract:

```text
cookieCleanup: always
authCookieMode: refresh-only
```

Так само, як client/pharmacy.

---

# 21. Не створюємо admin login BFF зараз

Поки не потрібний:

```text
POST /api/auth/login
```

Бо Login page ще немає.

Так само не створюємо:

```text
/api/auth/forgot-password
/api/auth/reset-password
```

Це не Stage 4.

---

# 22. Local API route constants

Не хардкодимо:

```ts
'/api/auth/me';
'/api/auth/logout';
```

у browser service.

Створити app-local contract:

```text
apps/admin/src/lib/api/routes/admin-api-routes.ts
```

Наприклад:

```ts
export const adminApiRoutes = {
  auth: {
    current: '/api/auth/me',
    logout: '/api/auth/logout',
  },
} as const;
```

---

# 23. `getCurrentUser`

Browser service використовує:

```text
localApiRequest
parseApiResponseData
parseAuthResponse
```

Тобто той самий runtime validation boundary, що client/pharmacy.

Не робимо:

```ts
return response.json() as AuthResponse;
```

Runtime response повинен парситися fail-closed.

---

# 24. `logoutUser`

Logout response перевіряємо через:

```text
parseApiEmptyResponse
```

Не ігноруємо backend response contract.

---

# 25. Оновлення `AdminProviders`

Зараз:

```text
AdminProviders
└─ ToastProvider
```

Після Stage 4:

```text
AdminProviders
└─ ToastProvider
   └─ AuthProvider
      └─ children
```

Або AuthProvider/ToastProvider у зворотному порядку, якщо немає dependency.

Головне:

```text
RootLayout
= Server Component
```

залишається незмінним.

---

# 26. Root layout НЕ перетворюємо на Client Component

Не додаємо:

```tsx
'use client';
```

до:

```text
apps/admin/src/app/layout.tsx
```

Stage 1 саме для цього створив:

```text
AdminProviders
```

client boundary.

AuthProvider додається туди.

---

# 27. `/admin/layout.tsx`

Створюємо:

```text
apps/admin/src/app/admin/layout.tsx
```

Це головна structural boundary Stage 4.

Наприклад концептуально:

```tsx
function AdminLayout({ children }) {
  return <AdminProtectedRoute>{children}</AdminProtectedRoute>;
}
```

---

# 28. Чому guard саме в `/admin/layout.tsx`

Тоді автоматично захищені:

```text
/admin/dashboard
/admin/profile
/admin/pharmacies
/admin/products
/admin/orders
/admin/settings/*
```

і будь-який майбутній:

```text
/admin/whatever
```

Немає потреби імпортувати guard у кожну page.

---

# 29. Root `/login` не потрапляє під guard

Це також важливо.

Структура:

```text
app/
├─ login/
└─ admin/
   └─ layout.tsx ← AdminProtectedRoute
```

Тому:

```text
/login
```

залишається guest/auth route.

Інакше отримаємо класичну пастку:

```text
/login requires admin
admin requires login
login requires admin
...
```

і браузер почне спортивну кар'єру з бігу по колу 😄

---

# 30. `/password-recovery` і `/reset-password` також будуть зовні

Майбутні:

```text
/password-recovery
/reset-password
```

не повинні знаходитися всередині:

```text
/app/admin/
```

бо blocked/unauthenticated admin має мати до них доступ.

Stage 4 їх ще не створює.

---

# 31. Loading state

Поки `AuthProviderCore` виконує bootstrap:

```text
isBootstrapping === true
```

показуємо shared:

```tsx
<PageLoader label="Checking admin access..." />
```

Не створюємо:

```text
AdminAccessLoader
AdminGuardLoader
```

---

# 32. Redirecting state

Під час redirect:

```text
no session → login
wrong role → other application
```

показуємо:

```tsx
<PageLoader label="Redirecting..." />
```

або трохи конкретніше:

```text
Opening the right application...
```

Без blank screen.

---

# 33. Auth unavailable

Якщо `/api/auth/me` не відповідає через:

```text
network error
backend unavailable
timeout
invalid transport response
```

не робимо:

```text
treat as guest
→ redirect login
```

Це принципово.

Невідомий auth state ≠ unauthenticated.

---

# 34. Fail closed

При:

```text
auth unavailable
```

admin content не рендеримо.

Показуємо:

```text
shared ErrorPage
```

з retry.

Це правильна security boundary.

---

# 35. Текст ErrorPage

Наприклад:

```text
eyebrow:
Access check

title:
We could not verify admin access

description:
The authentication service is temporarily unavailable.
Retry the session check before opening the admin cabinet.

retry:
Retry session check
```

Не показуємо raw exception.

---

# 36. Retry

Кнопка:

```text
Retry session check
```

викликає:

```ts
retryAuthBootstrap();
```

Не:

```text
window.reload()
```

Не автоматичний endless retry loop.

---

# 37. Status illustration

Не дублюємо image object.

Stage 2 вже створив:

```text
STATUS_PAGE_IMAGE
```

у:

```text
apps/admin/src/lib/status-pages/status-page-image.ts
```

Stage 4 використовує його.

---

# 38. Client account у admin

Сценарій:

```text
session valid
user.role === client
user.status === active
```

Результат:

```text
redirect → client application
```

Не logout.

Session залишається валідною.

Користувач просто відкрив не свій application.

---

# 39. Куди відправляти client

Для client достатньо:

```text
NEXT_PUBLIC_CLIENT_APP_URL
```

base URL.

Наприклад:

```text
http://localhost:3000/
```

Не потрібно автоматично відкривати profile.

Client app уже сам знає, як показувати authenticated client.

---

# 40. Pharmacy account у admin

Сценарій:

```text
session valid
user.role === pharmacy
user.status === active
```

Результат:

```text
redirect → pharmacy application
```

Я б направляла відразу на:

```text
/pharmacy/dashboard
```

а не на root pharmacy app.

---

# 41. Для цього admin потрібний `NEXT_PUBLIC_PHARMACY_APP_URL`

У:

```text
apps/admin/.env.example
```

додати:

```env
NEXT_PUBLIC_PHARMACY_APP_URL=http://localhost:3002
```

Тільки base URL.

Не:

```env
NEXT_PUBLIC_PHARMACY_APP_URL=http://localhost:3002/pharmacy/dashboard
```

---

# 42. `NEXT_PUBLIC_CLIENT_APP_URL` уже є

Stage 1 уже додав:

```env
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3000
```

Не дублюємо.

Stage 4 лише починає реально використовувати його для role redirect.

---

# 43. External application config

Не можна сліпо робити:

```ts
window.location.replace(process.env.NEXT_PUBLIC_PHARMACY_APP_URL!);
```

Потрібно валідовувати URLs.

Мінімальні правила:

```text
valid URL
http/https
HTTPS у production
no username/password
no query
no hash
```

---

# 44. Development fallback

Для development допустимі defaults:

```text
client   → http://localhost:3000
pharmacy → http://localhost:3002
```

У production missing URL повинен бути configuration error.

Не мовчазний redirect на localhost.

---

# 45. App-local config module

Я б створила:

```text
apps/admin/src/lib/auth/app-destinations.ts
```

або кілька маленьких файлів:

```text
client-app-config.ts
pharmacy-app-config.ts
admin-auth-redirects.ts
```

Не потрібно зараз рефакторити аналогічні pharmacy/client modules у shared package.

Це вже розширило б Stage 4 на існуючі applications.

---

# 46. Не імпортуємо код із `apps/client`

Не можна:

```ts
import { getPharmacyAppConfiguration } from '../../../client/...';
```

Next applications не є libraries один для одного.

Reuse — тільки через:

```text
packages/*
```

або app-local implementation.

---

# 47. Не імпортуємо код із `apps/pharmacy`

Так само не використовуємо:

```text
apps/pharmacy/src/lib/auth/client-app-config
```

напряму.

Admin application має власні boundaries.

---

# 48. Trusted external redirects

Для redirects client/pharmacy використовуємо:

```text
getTrustedExternalRedirectUrl
```

з:

```text
@e-pharmacy/auth/routing
```

Не передаємо довільний URL у:

```ts
window.location.replace(...)
```

---

# 49. Allowed origins

Trusted redirect resolver повинен дозволяти тільки configured:

```text
client origin
pharmacy origin
```

Не:

```text
any https origin
```

---

# 50. Pharmacy allowed path

Для pharmacy destination дозволений мінімум:

```text
/pharmacy
```

усередині pharmacy application base path.

Default destination:

```text
/pharmacy/dashboard
```

---

# 51. Configuration error не повинен створити redirect loop

Наприклад production:

```text
NEXT_PUBLIC_PHARMACY_APP_URL missing
```

і login session належить pharmacy.

Неправильно:

```text
redirect /
→ /admin/dashboard
→ guard
→ redirect /
→ ...
```

Правильно:

```text
shared ErrorPage
```

із повідомленням про configuration problem.

---

# 52. Те саме для client destination

Якщо:

```text
NEXT_PUBLIC_CLIENT_APP_URL
```

invalid/missing у production і current role = client:

не намагаємося вгадати destination.

Показуємо controlled configuration error state.

---

# 53. Blocked admin — реальна поточна backend поведінка

У поточній архітектурі authoritative:

```text
GET /auth/current
```

для blocked user повертає:

```text
AUTH_USER_BLOCKED
```

Shared private BFF розпізнає цей code як session-invalidating і очищає auth cookies.

`AuthProviderCore` переводить state у:

```text
unauthenticated
reason = user_blocked
```

Після цього guard відправляє на:

```text
/login
```

---

# 54. Тому не потрібний другий logout request

Не потрібно при:

```text
reason === user_blocked
```

ще раз викликати:

```text
POST /logout
```

Cookies уже очищені BFF на authoritative auth failure.

Подвійний logout лише додасть race і зайвий HTTP request.

---

# 55. Defense in depth для status

Попри backend behavior, `canAccessAdminPrivateRoutes()` все одно перевіряє:

```text
status === active
```

Тобто навіть якщо blocked/non-active user якимось чином потрапив у React state:

```text
admin content не відобразиться
```

---

# 56. Client/pharmacy status

Redirect у правильний application робимо тільки для account, який має valid authenticated state.

Blocked client/pharmacy session так само повинна бути інвалідована shared auth lifecycle ще під час `/auth/current`.

Не намагаємося перенаправити blocked pharmacy на pharmacy dashboard.

---

# 57. Guard не є authorization boundary

Дуже важливо:

```text
AdminProtectedRoute
```

захищає UI/navigation.

Він **не захищає backend admin operations**.

Майбутні endpoints:

```text
/admin/pharmacies
/admin/products
/admin/employees
```

повинні окремо перевіряти:

```text
authentication
role
status
permissions
```

на backend.

---

# 58. Не створюємо `proxy.ts` як security layer

Stage 4 не потребує:

```text
apps/admin/proxy.ts
```

лише для:

```text
if cookie → allow
else redirect
```

Cookie presence нічого не доводить.

Authoritative session перевіряє:

```text
/auth/current
```

через BFF/backend.

---

# 59. Не читаємо cookies у Client Component

`AdminProtectedRoute` не використовує:

```text
document.cookie
cookies()
accessToken
refreshToken
```

Він бачить тільки normalized state із:

```text
useAuth()
```

---

# 60. Не читаємо JWT

Жодного:

```ts
jwtDecode(...)
```

у admin frontend.

Не перевіряємо role зі token payload у browser.

Authoritative user приходить через:

```text
GET /auth/current
```

---

# 61. Не використовуємо localStorage для auth

Не створюємо:

```text
localStorage.adminUser
localStorage.token
sessionStorage.userRole
```

Session лишається server-managed через HttpOnly cookies.

---

# 62. `AdminProtectedRoute` приблизно компонується так

Концептуально:

```tsx
<RoleProtectedRoute
  allowedRoles={['admin']}
  authorizeUser={canAccessAdminPrivateRoutes}
  loginPath={ADMIN_ROUTES.LOGIN}
  forbiddenPath={...}
  resolveExternalRedirect={...}
  loadingFallback={...}
  authUnavailableFallback={...}
  redirectingFallback={...}
  forbiddenFallback={...}
>
  {children}
</RoleProtectedRoute>
```

Не треба переписувати internals shared guard.

---

# 63. Визначення forbidden destination

Для current user:

```text
client
→ CLIENT_APP_URL

pharmacy
→ PHARMACY_APP_URL/pharmacy/dashboard

admin + not active
→ /login
```

Unknown role теоретично неможлива завдяки runtime validation.

Fail closed:

```text
→ /login
```

---

# 64. Не redirect-имо admin на client за замовчуванням

У старому `PharmacyProtectedRoute` зараз є тимчасове правило:

```text
every non-pharmacy
→ client
```

бо admin application тоді ще не був deployed.

Для нового admin це правило **не копіюємо**.

Ми вже знаємо всі три roles:

```text
client
pharmacy
admin
```

і кожна має конкретний destination.

---

# 65. Shared `RoleProtectedRoute` — правильна база

Це ще один плюс Stage 4.

Client уже використовує:

```text
RoleProtectedRoute
```

Тепер admin також.

У майбутньому можна окремо вирішити, чи варто перевести старий:

```text
PharmacyProtectedRoute
```

на той самий shared primitive.

Але **не в Stage 4**.

---

# 66. Pharmacy code на цьому етапі не змінюємо

Не рефакторимо:

```text
apps/pharmacy/src/components/auth/PharmacyProtectedRoute.tsx
```

навіть якщо бачимо можливість покращення.

Інакше Stage 4 перестане бути admin-only зміною.

---

# 67. Client code також не змінюємо

Stage 5 окремо буде:

```text
Client header for authenticated admin
```

Тому зараз не чіпаємо:

```text
apps/client
```

навіть якщо client уже розпізнає admin.

---

# 68. Backend Stage 4 змінювати не потрібно

Stage 3 уже завершив:

```text
admin application auth
admin role
bootstrap owner
password reset routing
```

Поточний:

```text
/auth/current
/auth/logout
```

generic і вже працює для всіх roles.

Тому нових backend admin auth endpoints не потрібно.

---

# 69. API route tests

Для нових BFF routes перевірити:

```text
GET /api/auth/me
→ authRoutes.current
→ private proxy
→ no-store

POST /api/auth/logout
→ authRoutes.logout
→ auth proxy
→ cookie cleanup always
```

Не потрібно дублювати всі internal tests `@e-pharmacy/next-api`.

---

# 70. `no-store`

`/api/auth/me` є private endpoint.

Response повинен лишатися:

```text
Cache-Control: no-store
```

Це вже забезпечує shared private proxy.

Не пишемо header вручну в route.

---

# 71. Browser-controlled Authorization не forwarding

Admin BFF не повинен пропускати arbitrary browser:

```text
Authorization
Cookie override
Host
X-Forwarded-*
```

на backend.

Це вже контролює shared proxy layer.

Тому використовуємо factory, а не custom:

```ts
fetch(API_BASE_URL + ...)
```

---

# 72. React tests для access predicate

Додати unit tests для:

```text
canAccessAdminPrivateRoutes
```

Cases:

```text
active admin      → true
blocked admin     → false
active client     → false
active pharmacy   → false
```

---

# 73. Destination tests

Перевірити:

```text
client → client base
pharmacy → pharmacy dashboard
inactive/invalid admin → login
```

І config failures.

---

# 74. External redirect security tests

Перевірити, що resolver відхиляє:

```text
https://evil.example
javascript:...
URL with credentials
untrusted origin
unsafe encoded path
```

Не потрібно заново тестувати весь `@e-pharmacy/auth/routing`, лише admin integration contract.

---

# 75. Provider tests

Перевірити, що Admin AuthProvider:

```text
використовує bootstrapMode="always"
має getCurrentUser
має logout
не має register
```

Особливо:

```text
canRegister === false
```

для admin provider.

---

# 76. Guard behavior tests

Корисно перевірити сценарії:

```text
bootstrapping
→ loader

unavailable
→ ErrorPage

unauthenticated
→ login redirect

active admin
→ children

active client
→ external client redirect

active pharmacy
→ external pharmacy redirect
```

Можна не дублювати internals shared `RoleProtectedRoute`.

Тестуємо саме admin configuration навколо нього.

---

# 77. Blocked session test

Окремо корисно зафіксувати contract:

```text
AUTH_USER_BLOCKED
→ private proxy clears auth cookies
→ AuthProvider becomes unauthenticated
→ guard routes to login
```

Частина цієї поведінки вже тестується shared packages.

Admin test може перевіряти лише очікуваний integration result.

---

# 78. Admin layout structural test

Structural check має гарантувати:

```text
apps/admin/src/app/admin/layout.tsx exists
```

і використовує:

```text
AdminProtectedRoute
```

Так усі `/admin/*` автоматично захищені.

---

# 79. Жодної role-check логіки на pages

Structural check можна зробити fail-fast для майбутнього code drift.

У:

```text
apps/admin/src/app/admin/**
```

не повинні масово з'являтися:

```text
user.role === 'admin'
user.role !== 'admin'
USER_ROLES.ADMIN
```

за винятком auth/access modules.

Тобто role ownership централізований.

---

# 80. Новий Stage 4 structural check

Створити:

```text
scripts/checks/admin/check-admin-protected-route.mjs
```

---

# 81. Що він перевіряє

Мінімально:

```text
AdminProtectedRoute існує
/admin/layout.tsx існує
layout використовує AdminProtectedRoute

Admin AuthProvider існує
AdminProviders включає AuthProvider

/api/auth/me route існує
/api/auth/logout route існує

admin browser auth API існує

ADMIN_ROUTES.LOGIN існує

allowed role = admin
active status перевіряється

shared RoleProtectedRoute використовується

shared PageLoader використовується
shared ErrorPage використовується

NEXT_PUBLIC_PHARMACY_APP_URL документований

немає direct backend fetch
немає browser JWT
немає document.cookie
немає localStorage auth
```

---

# 82. Що structural check НЕ повинен вимагати

Stage 4 check не повинен вимагати:

```text
/login/page.tsx
/password-recovery/page.tsx
/reset-password/page.tsx
/api/auth/login
AdminHeader
AdminSidebar
AdminShell
Dashboard page
permissions
```

Інакше він залізе в наступні stages.

---

# 83. Update `check:admin`

Порядок приблизно:

```text
check:admin-app-shell
↓
check:admin-providers
↓
check:admin-status-pages
↓
check:admin-auth-foundation
↓
check:admin-protected-route
↓
lint
↓
type-check
↓
tests
↓
build
```

---

# 84. `check:before-deploy`

Додаємо тільки:

```bash
pnpm check:admin-protected-route
```

до structural section.

Не додаємо повторний:

```bash
pnpm check:admin
```

бо workspace lint/test/build уже запускаються пізніше.

---

# 85. Existing provider check потрібно оновити

Stage 1 check зараз правильно очікував:

```text
AdminProviders
→ ToastProvider
→ no auth provider yet
```

Після Stage 4 це вже неактуально.

`check-admin-providers.mjs` треба оновити:

тепер він повинен дозволяти/вимагати:

```text
AuthProvider
```

але як і раніше забороняти:

```text
network request прямо в AdminProviders
token logic
API_BASE_URL
browser storage auth
```

---

# 86. README

`apps/admin/README.md` оновити.

Зафіксувати:

```text
admin session bootstrap implemented
/admin/* protected centrally
active admin required
client/pharmacy redirected to their apps
auth unavailable fails closed
login UI is not implemented yet
```

---

# 87. `.env.example`

Оновити лише одним необхідним Stage 4 параметром:

```env
# Pharmacy application used when a pharmacy account opens admin.
NEXT_PUBLIC_PHARMACY_APP_URL=http://localhost:3002
```

`NEXT_PUBLIC_CLIENT_APP_URL` уже є.

---

# 88. Нових dependencies не потрібно

Усе потрібне вже є:

```text
@e-pharmacy/auth
@e-pharmacy/next-api
@e-pharmacy/api-client
@e-pharmacy/validation
@e-pharmacy/types
@e-pharmacy/ui
```

Тому:

```text
pnpm-lock.yaml
```

очікувано не змінюється.

---

# 89. Очікуваний набір файлів

Основний scope приблизно такий:

```text
apps/admin/src/components/auth/AdminProtectedRoute.tsx
NEW

apps/admin/src/app/admin/layout.tsx
NEW

apps/admin/src/providers/AuthProvider/AuthProvider.tsx
NEW

apps/admin/src/providers/AuthProvider/index.ts
NEW

apps/admin/src/providers/AdminProviders.tsx
UPDATE

apps/admin/src/lib/api/browser/auth.api.ts
NEW

apps/admin/src/lib/api/routes/admin-api-routes.ts
NEW

apps/admin/src/app/api/auth/me/route.ts
NEW

apps/admin/src/app/api/auth/logout/route.ts
NEW

apps/admin/src/lib/auth/admin-route-access.ts
NEW

apps/admin/src/lib/auth/...
NEW
```

для trusted client/pharmacy destinations.

Також:

```text
apps/admin/src/lib/routes/admin-routes.ts
UPDATE

apps/admin/.env.example
UPDATE

apps/admin/README.md
UPDATE

scripts/checks/admin/check-admin-protected-route.mjs
NEW

scripts/checks/admin/check-admin-providers.mjs
UPDATE

package.json
UPDATE
```

І відповідні targeted test files.

---

# 90. Файли, яких Stage 4 не повинен торкатися

Не очікую змін у:

```text
apps/api
apps/client
apps/pharmacy

packages/ui
packages/types
packages/validation
packages/config
```

Shared auth також бажано не змінювати, бо потрібний:

```text
RoleProtectedRoute
```

уже існує.

---

# 91. Manual scenario — unauthenticated

Відкрити:

```text
http://localhost:3001/admin/dashboard
```

без session.

Очікуємо:

```text
Checking admin access...
↓
/login?redirect=/admin/dashboard
```

Сам login поки 404 — це **очікувана межа Stage 4**.

---

# 92. Manual scenario — active admin

Створений Stage 3 bootstrap admin:

```text
role = admin
status = active
```

із валідною session.

Відкриття:

```text
/admin/dashboard
```

проходить guard.

Оскільки Dashboard page ще не реалізований:

```text
→ branded 404
```

але **не auth redirect**.

Це важлива різниця.

---

# 93. Manual scenario — client session

Якщо cookies належать:

```text
active client
```

відкриття admin:

```text
/admin/dashboard
```

має відправити на:

```text
NEXT_PUBLIC_CLIENT_APP_URL
```

---

# 94. Manual scenario — pharmacy session

Якщо session:

```text
active pharmacy
```

admin route перенаправляє на:

```text
NEXT_PUBLIC_PHARMACY_APP_URL/pharmacy/dashboard
```

---

# 95. Manual scenario — blocked admin

Для blocked admin:

```text
/auth/current
→ AUTH_USER_BLOCKED
```

Очікуємо:

```text
auth cookies cleared
auth state unauthenticated
/login
```

Admin content не блимає перед redirect.

---

# 96. Manual scenario — API unavailable

Вимкнути API та відкрити:

```text
/admin/*
```

Очікуємо:

```text
shared ErrorPage
```

Не:

```text
/login
```

і не:

```text
admin content
```

---

# 97. Retry scenario

При ErrorPage:

```text
Retry session check
```

після відновлення API:

```text
retryAuthBootstrap
→ session перевірена
→ потрібний guard decision
```

Без full page reload.

---

# 98. Configuration failure scenario

Production-like config:

```text
pharmacy user
NEXT_PUBLIC_PHARMACY_APP_URL missing
```

Очікуємо controlled error UI.

Не redirect loop.

---

# 99. Команди перевірки

Окремо:

```bash
pnpm check:admin-protected-route
pnpm check:admin-providers

pnpm lint:admin
pnpm type-check:admin

pnpm --filter @e-pharmacy/admin test
pnpm --filter @e-pharmacy/admin test:react

pnpm build:admin
```

---

# 100. Загальна перевірка

Після цього:

```bash
pnpm check:admin
```

і обов'язково:

```bash
pnpm check:before-deploy
```

---

# 101. Definition of Done

Stage 4 готовий, коли:

```text
Admin AuthProvider використовує shared AuthProviderCore;

bootstrapMode = always;

browser отримує current user тільки через same-origin /api/auth/me;

logout працює через same-origin /api/auth/logout;

admin browser не знає API_BASE_URL;

JWT не читається browser code;

AdminProtectedRoute використовує shared RoleProtectedRoute;

доступ дозволений лише role=admin + status=active;

/admin/layout.tsx централізовано захищає всі /admin/* routes;

окремі pages не перевіряють role самостійно;

unauthenticated → /login + safe redirect;

active client → client application;

active pharmacy → pharmacy dashboard;

blocked admin → session invalidated → login;

auth unavailable → shared ErrorPage;

retry використовує retryAuthBootstrap;

configuration failures не створюють redirect loops;

external redirects allowlisted;

NEXT_PUBLIC_PHARMACY_APP_URL доданий;

root layout залишається Server Component;

public registration admin не з'явилась;

Login UI не реалізований;

Password Recovery UI не реалізований;

Reset Password UI не реалізований;

Header/Sidebar/Shell не реалізовані;

permissions не реалізовані;

Dashboard не реалізований;

structural check проходить;

lint проходить;

type-check проходить;

tests проходять;

build проходить;

check:before-deploy проходить.
```

---

# 102. Що маємо після Stage 4

Архітектура вже така:

```text
apps/admin
│
├─ public/root routes
│    └─ майбутній /login
│
├─ AdminProviders
│    ├─ ToastProvider
│    └─ AuthProvider
│
└─ /admin/*
     ↓
   AdminProtectedRoute
     ↓
   RoleProtectedRoute
     ↓
   active admin?
     │
     ├─ yes → render route
     │
     ├─ no session → login
     │
     ├─ client → client app
     │
     ├─ pharmacy → pharmacy app
     │
     └─ auth unavailable → ErrorPage
```

При цьому admin усе ще **не має жодної business page**.

Це саме те, що нам потрібно на цьому кроці: доступ до майбутньої адмінки вже контролюється правильно, але ми ще не почали малювати саму адмінку.

---

# 103. Найважливіша архітектурна умова Stage 4

Після цього етапу правило має бути дуже простим:

> Усе, що знаходиться під `/admin/*`, вважається приватним за замовчуванням.

Розробнику майбутнього Products або Employees не треба пам'ятати:

```text
«А тут я додала role check?»
```

Вона вже успадковується від layout.

І це набагато надійніше, ніж сто маленьких:

```tsx
if (!isAdmin) return ...
```

розкиданих по застосунку.

Окремо тут я б зафіксувала одну зміну порівняно з первинним коротким планом: blocked admin не потрібно вручну logout-ити другим HTTP-запитом у AdminProtectedRoute. Поточний backend повертає AUTH_USER_BLOCKED, shared private BFF уже очищає auth cookies, а AuthProviderCore переводить session у unauthenticated state. Guard після цього лише направляє на /login. Це чистіше й не дублює auth lifecycle.

І ще один важливий результат звірки: Stage 4 справді потребує GET /api/auth/me, POST /api/auth/logout та Admin AuthProvider. Без них сам AdminProtectedRoute був би красивою дверною ручкою без дверей 😄
