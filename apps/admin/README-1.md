Так. Перший етап я б зробила **дуже вузьким і технічним**: після нього `apps/admin` уже є повноцінним третім frontend-застосунком монорепозиторію, але **ще не містить auth, Dashboard, меню, профілю чи business logic**.

Я звірила це з поточним `e-pharmacy.zip`. Зараз `apps/admin` фактично містить лише `README.md`; `pnpm-workspace.yaml` уже має `apps/*`, тому окремо реєструвати admin у workspace не потрібно. Для admin уже зарезервований локальний порт **3001**, тоді як client — `3000`, pharmacy — `3002`, API — `4000`.

Нижче я б зафіксувала ЕТАП 1 саме так.

---

# ЕТАП 1 — створення фундаменту `apps/admin`

## 1. Мета етапу

Не реалізовувати функціонал адміністратора.

На цьому етапі потрібно отримати окремий runnable Next.js application:

```text
apps/admin
```

який:

- є повноцінним workspace package;
- запускається через `pnpm dev:admin`;
- працює на `http://localhost:3001`;
- збирається окремо;
- проходить ESLint;
- проходить TypeScript;
- використовує ті самі shared packages, що client/pharmacy;
- має Server Component root layout;
- має глобальні shared UI styles;
- має базовий provider stack;
- є повністю закритим від пошукової індексації;
- має root redirect;
- входить у `pnpm check:before-deploy`;
- має structural checks;
- не містить дубльованих компонентів із pharmacy/client;
- не містить auth/business logic.

Тобто після етапу маємо не «адмінку», а **правильний каркас для адмінки**.

---

# 2. Що НЕ робимо на цьому етапі

Це важливо, щоб перший PR не перетворився на половину admin 😄

Поки **не робимо**:

- Login;
- Password Recovery;
- Reset Password;
- `AdminProtectedRoute`;
- admin API/BFF routes;
- Dashboard;
- Header;
- Sidebar;
- Mobile Menu;
- breadcrumbs;
- Profile;
- permissions;
- auth provider із реальним admin session;
- employees;
- pharmacies;
- products;
- reviews;
- CMS;
- admin business types.

Також поки не створюємо:

```text
src/components/
src/hooks/
src/services/
```

просто «щоб були».

Порожні архітектурні папки нам нічого не дають.

---

# 3. Базова структура після ЕТАПУ 1

Я б очікувала приблизно таку структуру:

```text
apps/admin/
├── .env.example
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── README.md
├── tsconfig.json
│
├── src/
│   ├── app/
│   │   ├── icon.svg
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── styles.css
│   │
│   ├── lib/
│   │   └── routes/
│   │       ├── admin-routes.ts
│   │       └── index.ts
│   │
│   └── providers/
│       ├── AdminProviders.tsx
│       └── index.ts
```

Плюс у root:

```text
package.json
pnpm-lock.yaml
scripts/checks/admin/
```

---

# 4. `apps/admin/package.json`

Беремо за основу **`apps/pharmacy/package.json`**, а не вигадуємо новий набір залежностей.

Назва:

```json
"name": "@e-pharmacy/admin"
```

Admin працює на **3001**.

Основні scripts:

```json
"dev": "node ../../scripts/dev/run-with-bff-secret.mjs next dev --port 3001",
"build": "node -e \"require('node:fs').rmSync('.next', { recursive: true, force: true })\" && next build",
"start": "next start --port 3001",
"lint": "eslint .",
"type-check": "next typegen && tsc --noEmit"
```

Я б одразу додала й стандартні test commands:

```json
"test": "node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.test.ts",
"test:react": "node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.react.test.tsx"
```

Навіть якщо тестів першого дня майже немає.

Це дозволить admin із самого початку жити за тими самими правилами, що client/pharmacy.

---

## Dependencies

Я б одразу підключила той самий shared foundation:

```text
@e-pharmacy/api-client
@e-pharmacy/auth
@e-pharmacy/config
@e-pharmacy/hooks
@e-pharmacy/next-api
@e-pharmacy/types
@e-pharmacy/ui
@e-pharmacy/utils
@e-pharmacy/validation
```

та:

```text
clsx
lucide-react
next
react
react-dom
```

Частина пакетів на ЕТАПІ 1 ще не буде використовуватись, але вони точно потрібні наступним admin-модулям і це фактично той самий frontend stack, що pharmacy.

Версії **не придумуємо** — беремо ті самі, що зараз у pharmacy:

```text
next 16.2.4
react 19.2.4
react-dom 19.2.4
```

Так само devDependencies мають відповідати pharmacy.

---

# 5. `pnpm-lock.yaml`

Після появи:

```text
apps/admin/package.json
```

обов'язково виконати:

```bash
pnpm install
```

щоб у `pnpm-lock.yaml` з'явився importer:

```text
apps/admin
```

Не редагувати lock вручну.

---

# 6. `tsconfig.json`

Тут я взагалі не бачу причини винаходити щось нове.

Беремо контракт `apps/pharmacy/tsconfig.json`.

Обов'язково:

```json
"strict": true
```

```json
"moduleResolution": "bundler"
```

```json
"jsx": "react-jsx"
```

```json
"noEmit": true
```

і Next plugin.

---

# 7. Alias `@/*`

Обов'язково:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

Тоді admin code використовує:

```ts
import { AdminProviders } from '@/providers';
```

а не:

```ts
../../../providers/AdminProviders
```

Бо відносні імпорти через пів застосунку — це та сама локшина, тільки TypeScript 😄

---

# 8. Shared package aliases

Також копіюємо існуючі aliases pharmacy:

```text
@e-pharmacy/utils
@e-pharmacy/config/*
@e-pharmacy/ui
@e-pharmacy/ui/*
@e-pharmacy/hooks/*
@e-pharmacy/api-client/*
@e-pharmacy/types
@e-pharmacy/types/*
@e-pharmacy/validation
@e-pharmacy/validation/*
@e-pharmacy/auth/*
@e-pharmacy/next-api/browser
@e-pharmacy/next-api/server
@e-pharmacy/next-api/proxy
@e-pharmacy/next-api/contracts
```

Важливо: **не створювати admin-specific aliases до копій shared code**.

Наприклад не потрібно:

```text
@/ui/*
@/shared-ui/*
```

якщо вже є:

```text
@e-pharmacy/ui/*
```

---

# 9. `eslint.config.mjs`

Абсолютно той самий baseline, що pharmacy:

- `eslint-config-next/core-web-vitals`;
- `eslint-config-next/typescript`;
- ESLint 9 flat config;
- ignores:

```text
.next/**
out/**
build/**
next-env.d.ts
```

Без admin-specific послаблень.

Не додаємо:

```text
eslint-disable
```

на весь застосунок, щоб «поки не заважав».

---

# 10. `next.config.ts`

Admin має використовувати той самий workspace-transpilation approach.

```text
transpilePackages:
  @e-pharmacy/api-client
  @e-pharmacy/auth
  @e-pharmacy/config
  @e-pharmacy/hooks
  @e-pharmacy/next-api
  @e-pharmacy/types
  @e-pharmacy/ui
  @e-pharmacy/utils
  @e-pharmacy/validation
```

Це важливо для локальної роботи shared TypeScript packages.

---

## Чого поки НЕ треба в `next.config.ts`

Не додаємо поки:

- redirects;
- auth redirects;
- admin rewrites;
- BFF routing;
- remote image domains;
- pharmacy-specific seed rewrites;
- CSP, придуманий тільки для admin;
- route logic.

У pharmacy зараз є image rewrites, бо ці сторінки вже реально працюють з API assets.

Admin на ЕТАПІ 1 цього ще не робить.

Коли з'являться Products/Clients/Pharmacies — тоді визначимо, які asset rewrites справді потрібні.

---

# 11. `.env.example`

Для admin я б одразу заклала правильну BFF-модель, але **не додавала public backend URL**.

Приблизно:

```env
# apps/admin

# Express API origin.
# Used only by Next.js server-side code and BFF route handlers.
# Browser code must never call this origin directly.
API_BASE_URL=http://localhost:4000

# Shared client storefront.
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3000

# Server-owned auth cookie configuration.
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_LEGACY_DOMAINS=
AUTH_COOKIE_SAME_SITE=lax

# Trust provider-owned client IP headers only on a known deployment platform.
# Allowed: none, vercel, cloudflare.
BFF_TRUSTED_PROXY_PROVIDER=none

# Server-only BFF → API shared secret.
# Local pnpm dev may auto-provision the shared value.
# Production must explicitly configure the same value in apps/admin and apps/api.
BFF_PROXY_SECRET=
```

---

## Не додавати `NEXT_PUBLIC_API_URL`

У pharmacy `.env.example` зараз воно ще є:

```text
NEXT_PUBLIC_API_URL
```

але для нового admin я б цього **не переносила**.

Правильний architecture contract уже є:

```text
browser
   ↓
/api/*
   ↓
Next BFF
   ↓
API_BASE_URL
```

Тому admin browser взагалі не повинен знати origin backend.

---

# 12. Чи потрібен `NEXT_PUBLIC_ADMIN_APP_URL`

У самому `apps/admin` на цьому етапі — **ні**.

Admin не потребує public self-origin для:

- sitemap;
- canonical;
- public SEO.

Він приватний.

`ADMIN_APP_URL=http://localhost:3001` вже має сенс на backend/client side для cross-app navigation та reset links, але це буде наступний auth етап.

Не треба зараз насипати env-параметри «про всяк випадок».

---

# 13. `src/app/layout.tsx`

Root layout admin має бути **Server Component**.

Тобто категорично:

```tsx
'use client';
```

там бути не повинно.

Це той самий правильний boundary, який уже збережений у pharmacy.

---

## Shared global styles

Підключаємо:

```ts
import '@e-pharmacy/ui/styles/tokens.css';
import '@e-pharmacy/ui/styles/reset.css';
import '@e-pharmacy/ui/styles/base.css';
import '@e-pharmacy/ui/styles/utilities.css';
```

і після shared styles:

```ts
import './styles.css';
```

Таким чином admin одразу використовує той самий visual baseline.

Не копіюємо:

- reset;
- typography;
- colors;
- buttons;
- spacing variables.

---

# 14. Metadata

Admin приватний.

Тому metadata одразу:

```ts
export const metadata: Metadata = {
  title: {
    default: 'Admin Cabinet | E-PHARMACY',
    template: '%s | Admin Cabinet',
  },

  description: 'Private administration cabinet for E-PHARMACY.',

  robots: {
    index: false,
    follow: false,
  },
};
```

Головне тут не точне формулювання description.

Головне:

```text
index: false
follow: false
```

---

# 15. Не додавати canonical

Для client canonical потрібен.

Для приватної admin area — ні.

Так само не потрібні:

- Open Graph metadata;
- Twitter cards;
- public structured data;
- sitemap references.

Це не маркетингова сторінка.

---

# 16. `<html>` та `<body>`

Можна зберегти те саме:

```tsx
<html lang="en" data-scroll-behavior="smooth">
```

Мова UI у системі зараз англійська, тому `lang="en"` логічний.

---

# 17. Provider boundary

Ось тут є нюанс.

Я **не створювала б зараз фальшивий `AuthProvider`**.

Admin auth буде окремим наступним етапом.

Але provider infrastructure уже можна зробити.

Створити:

```text
src/providers/AdminProviders.tsx
src/providers/index.ts
```

---

## `AdminProviders`

Це client boundary:

```tsx
'use client';
```

На ЕТАПІ 1 він має містити тільки **реально потрібний provider**, наприклад shared:

```text
ToastProvider
```

Концептуально:

```text
RootLayout — Server Component
        ↓
AdminProviders — Client Component
        ↓
ToastProvider
        ↓
children
```

Пізніше сюди додасться:

```text
AuthProvider
```

без необхідності перетворювати root layout у Client Component.

---

# 18. Чому не класти `'use client'` у layout

Тому що весь admin application shell не потребує бути client-rendered.

Правильно:

```text
layout.tsx
Server Component
     ↓
AdminProviders
Client boundary
```

Неправильно:

```text
layout.tsx
'use client'
```

і потім увесь application tree випадково стає клієнтським.

Цю межу я б уже захищала structural check.

---

# 19. `src/app/styles.css`

На цьому етапі файл має бути **дуже маленьким**.

Наприклад global admin page baseline:

```css
html,
body {
  min-height: 100%;
}

body {
  background: var(--gradient-page-bg);
  color: var(--color-text-primary);
}

a {
  color: inherit;
}
```

Тобто фактично те саме, що вже працює в pharmacy.

---

## Чого я зараз НЕ копіювала б

У pharmacy є:

```css
--pharmacy-sidebar-width: 280px;
--pharmacy-header-height: 72px;
```

Я б **не створювала зараз**:

```css
--admin-sidebar-width
--admin-header-height
```

лише тому, що так є у pharmacy.

На етапі Header/Sidebar ми якраз будемо рефакторити cabinet UI.

Тоді логічніше вирішити, чи повинні ці variables стати shared:

```text
--cabinet-sidebar-width
--cabinet-header-height
```

а не розмножувати:

```text
--pharmacy-...
--admin-...
```

Це якраз відповідає правилу «не дублювати те, що вже є».

---

# 20. `src/app/icon.svg`

Я б додала.

Client і pharmacy вже мають:

```text
src/app/icon.svg
```

Admin — частина тієї самої E-PHARMACY ecosystem.

Тому використовуємо той самий чистий application icon.

Це не business functionality, тому нормально зробити вже зараз.

---

# 21. `public/`

Я б **не копіювала зараз весь `public/` client/pharmacy**.

На ЕТАПІ 1 admin не використовує:

- auth image;
- product assets;
- client photos;
- pharmacy images.

Тому порожня `public/` нам не потрібна.

Коли дійдемо до Login і буде потрібний малюнок, окремо вирішимо:

- чи asset справді має бути duplicated per Next app;
- чи є сенс винести reusable asset;
- чи використати той самий source.

Не копіюємо сотню файлів «бо, може, знадобляться».

---

# 22. Базові admin routes

Я б уже зараз створила маленький app-local route contract.

```text
src/lib/routes/admin-routes.ts
```

Поки лише мінімум:

```text
ROOT
DASHBOARD
```

Наприклад:

```ts
export const ADMIN_ROUTES = {
  ROOT: '/',
  DASHBOARD: '/admin/dashboard',
} as const;
```

Потім цей object буде розширюватись.

---

# 23. Чому routes потрібні вже зараз

Щоб у:

```text
src/app/page.tsx
```

не писати:

```ts
redirect('/admin/dashboard');
```

напряму.

А використовувати:

```ts
redirect(ADMIN_ROUTES.DASHBOARD);
```

Pharmacy вже використовує такий route ownership pattern.

Тому admin одразу робимо так само.

---

# 24. `src/app/page.tsx`

Root page має залишатися **Server Component**.

Вона не повинна:

- рендерити UI;
- визначати auth;
- читати localStorage;
- робити request;
- містити dashboard;
- містити loading logic.

Вона лише виконує:

```text
/ → /admin/dashboard
```

через Next:

```ts
redirect();
```

---

## «А `/admin/dashboard` ще не існує»

Так. І це нормально для цього технічного етапу.

Ми **не створюємо фальшивий Dashboard**, щоб redirect було куди приземлити.

Після ЕТАПУ 1:

```text
/
→ /admin/dashboard
→ поки 404
```

це чесніше, ніж створювати тимчасову сторінку, яку потім забудемо видалити.

Після auth/shell етапів `/admin/dashboard` буде реалізований нормально.

---

# 25. `robots.ts`

Обов'язково:

```text
apps/admin/src/app/robots.ts
```

І він має бути максимально простим.

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
```

---

# 26. Чому потрібні і metadata robots, і `robots.ts`

Це дві різні речі.

Metadata:

```text
noindex, nofollow
```

потрапляє безпосередньо на pages.

`robots.txt`:

```text
Disallow: /
```

говорить crawler:

> сюди взагалі не ходити.

Для приватної admin application я б залишила **обидва шари**.

---

# 27. `sitemap.ts` НЕ створюємо

Взагалі.

Admin:

```text
/private
/noindex
/disallow
```

тому sitemap тут суперечив би самій концепції застосунку.

Structural check навіть може перевіряти:

```text
apps/admin/src/app/sitemap.ts must not exist
```

щоб його випадково ніхто пізніше не «додав для SEO» 😄

---

# 28. `next-env.d.ts`

Файл має бути присутнім так само, як у client/pharmacy.

Його генерує Next.

Не потрібно руками писати туди application declarations.

---

# 29. Root `package.json`

Тепер додаємо scripts, про які ти писала.

## Development

```json
"dev:admin": "pnpm --filter @e-pharmacy/admin dev"
```

---

## Build

```json
"build:admin": "pnpm --filter @e-pharmacy/admin build"
```

---

## Lint

```json
"lint:admin": "pnpm --filter @e-pharmacy/admin lint"
```

---

## Type check

```json
"type-check:admin": "pnpm --filter @e-pharmacy/admin type-check"
```

---

# 30. `check:admin`

Я б не робила його просто:

```text
lint + type-check
```

У нас уже є структурні перевірки в pharmacy/client.

Admin повинен стартувати з такою ж дисципліною.

Наприклад:

```json
"check:admin": "pnpm check:admin-app-shell && pnpm check:admin-providers && pnpm --filter @e-pharmacy/admin lint && pnpm --filter @e-pharmacy/admin type-check && pnpm --filter @e-pharmacy/admin test && pnpm --filter @e-pharmacy/admin test:react && pnpm --filter @e-pharmacy/admin build"
```

Пізніше сюди додаватимуться:

```text
check:admin-auth
check:admin-lib
check:admin-layout
check:admin-routes
check:admin-permissions
...
```

Але не зараз.

---

# 31. Structural check №1 — `check-admin-app-shell.mjs`

Створити:

```text
scripts/checks/admin/check-admin-app-shell.mjs
```

Цей check має захищати фундамент.

---

## Перевірка required files

Повинні існувати:

```text
apps/admin/package.json
apps/admin/tsconfig.json
apps/admin/eslint.config.mjs
apps/admin/next.config.ts
apps/admin/.env.example

apps/admin/src/app/layout.tsx
apps/admin/src/app/page.tsx
apps/admin/src/app/styles.css
apps/admin/src/app/robots.ts

apps/admin/src/providers/AdminProviders.tsx
apps/admin/src/providers/index.ts

apps/admin/src/lib/routes/admin-routes.ts
```

---

# 32. Root layout contract

Structural check перевіряє:

### layout не client component

Не повинно бути:

```text
'use client'
```

### Є Metadata

І:

```text
robots.index === false
robots.follow === false
```

### Shared UI styles підключені

Перевірити imports:

```text
tokens.css
reset.css
base.css
utilities.css
```

### Admin local stylesheet

```text
./styles.css
```

### Provider boundary

Layout має використовувати:

```text
AdminProviders
```

а не складати кожен client provider прямо в root.

---

# 33. Root layout не містить business logic

Structural check може забороняти в:

```text
src/app/layout.tsx
```

такі речі:

```text
fetch(
localApiRequest
API_BASE_URL
Authorization
accessToken
refreshToken
document.cookie
localStorage
sessionStorage
```

Так само layout не повинен імпортувати:

```text
@/lib/api/*
```

На root рівні йому це не потрібно.

---

# 34. Root page contract

`src/app/page.tsx` має:

```text
import redirect from next/navigation
```

і використовувати canonical route constant.

Не повинно бути:

```text
'use client'
```

Не повинно бути:

```text
fetch
auth
localStorage
UI
```

---

# 35. Robots contract

Check перевіряє:

```text
userAgent: '*'
disallow: '/'
```

І додатково:

```text
apps/admin/src/app/sitemap.ts
```

**не існує**.

---

# 36. Structural check №2 — providers

Створити:

```text
scripts/checks/admin/check-admin-providers.mjs
```

На цьому етапі він буде невеликий.

Перевіряє:

- `AdminProviders.tsx` є client component;
- provider використовує shared `ToastProvider`;
- provider не містить network requests;
- provider не читає JWT;
- provider не використовує browser storage для auth;
- provider не містить `API_BASE_URL`;
- provider не містить прямого backend URL.

---

# 37. Чому structural checks уже зараз

Бо потім ми хочемо гарантовано мати:

```text
Admin root layout = Server Component
```

а не через два місяці випадково побачити:

```tsx
'use client';

export default function RootLayout() { ... }
```

лише тому, що комусь треба було `useEffect`.

Structural check не дає архітектурі тихо поповзти в кущі.

---

# 38. Root scripts для structural checks

Додати:

```json
"check:admin-app-shell": "node scripts/checks/admin/check-admin-app-shell.mjs",
"check:admin-providers": "node scripts/checks/admin/check-admin-providers.mjs"
```

---

# 39. Інтеграція в `check:before-deploy`

Тут є важливий момент.

Я б **не вставляла просто**:

```text
pnpm check:admin
```

в `check:before-deploy`.

Чому?

Тому що `check:before-deploy` наприкінці вже запускає:

```text
lint
type-check
test
build
```

для workspace.

Якщо там ще запустити повний `check:admin`, admin буде:

- lint двічі;
- type-check двічі;
- build двічі.

Нам це не потрібно.

---

# 40. Правильніше інтегрувати structural checks

У `check:before-deploy` додати:

```text
pnpm check:admin-app-shell
&& pnpm check:admin-providers
```

до структурної частини.

А загальні:

```text
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

вже автоматично підхоплять:

```text
@e-pharmacy/admin
```

через Turbo/workspace.

Таким чином немає дублювання.

---

# 41. Root `test:react`

Я б також підготувала root script до третього frontend app.

Зараз там:

```text
client
pharmacy
```

Поступово має стати:

```text
client
pharmacy
admin
```

Навіть якщо admin React tests поки порожні.

Так усі три frontend apps мають однакову CI-модель.

---

# 42. `turbo.json`

**Міняти не потрібно.**

Він уже описує generic tasks:

```text
dev
build
lint
type-check
test
```

А `apps/admin/package.json` надасть відповідні scripts.

Turbo сам підхопить admin.

Це ще одна причина не додавати туди admin-specific logic.

---

# 43. `pnpm-workspace.yaml`

Так само:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

вже правильний.

**Не змінюємо.**

Admin автоматично входить у workspace.

---

# 44. `apps/admin/README.md`

Його треба оновити вже на першому етапі.

Зараз там написано:

> This app is not implemented yet.

Після ЕТАПУ 1 це вже неправда.

Також там ще є старий planned section:

```text
Suppliers
```

А в актуальному ТЗ його немає.

Тому README треба очистити від застарілого roadmap.

---

## README після ЕТАПУ 1 має описувати

- що це private admin application;
- port `3001`;
- як запустити:

```bash
pnpm dev:admin
```

- що backend залишається shared `apps/api`;
- що browser надалі працюватиме через same-origin BFF;
- що UI перевикористовується з `@e-pharmacy/ui`;
- що public registration admin не передбачається;
- що app `noindex`;
- що sitemap відсутній навмисно;
- поточний статус:

> application shell implemented; business modules pending.

---

# 45. Root `README.md`

Його теж невеликим patch треба актуалізувати.

Зараз список source-of-truth env examples містить:

```text
apps/client/.env.example
apps/pharmacy/.env.example
apps/api/.env.example
```

Додати:

```text
apps/admin/.env.example
```

І до local run documentation:

```bash
pnpm dev:admin
```

та:

```text
Admin: http://localhost:3001
```

---

# 46. Archive hygiene

Оскільки в тебе вже є:

```text
check:archive-hygiene
archive:source
check:archive-artifact
```

треба переконатися, що новий:

```text
apps/admin
```

потрапляє в source archive.

Якщо archive script працює через `apps/*`, нічого додатково не міняємо.

Якщо там hardcoded app list — додати admin.

Це саме **перевірити**, а не автоматично переписувати archive logic.

---

# 47. Що має відкриватися після першого етапу

Команда:

```bash
pnpm dev:admin
```

має успішно запустити Next на:

```text
http://localhost:3001
```

Root:

```text
http://localhost:3001/
```

має server-side redirect:

```text
/admin/dashboard
```

Сам Dashboard ще не реалізований.

Це нормально для ЕТАПУ 1.

---

# 48. SEO-перевірка

На:

```text
http://localhost:3001/robots.txt
```

має бути по суті:

```text
User-Agent: *
Disallow: /
```

Admin HTML metadata:

```text
noindex
nofollow
```

І не повинно існувати:

```text
/sitemap.xml
```

через admin `sitemap.ts`.

---

# 49. Security boundary першого етапу

Хоч auth ще не реалізований, уже зараз закладаємо правила.

У `apps/admin/src` не повинно бути:

```text
accessToken
refreshToken
Authorization
document.cookie
localStorage auth state
NEXT_PUBLIC_API_URL
direct backend fetch
```

На ЕТАПІ 1 це легко забезпечити, бо network layer взагалі ще не потрібен.

---

# 50. Не створювати `proxy.ts` зараз

У client є proxy, але admin на цьому етапі він не потрібен.

Коли будемо проектувати auth/navigation boundaries, тоді окремо визначимо, чи потрібен admin `proxy.ts`.

І якщо потрібен — він, як і pharmacy/client, **не буде authorization layer**.

---

# 51. Не створювати `/api` зараз

Так само:

```text
apps/admin/src/app/api
```

поки не потрібна.

BFF routes почнемо створювати разом із admin auth/backend contracts.

Порожня API папка не додає архітектури.

---

# 52. Не копіювати pharmacy application shell

Це теж важлива acceptance умова.

На першому етапі **не копіюємо**:

```text
PharmacyShell
PharmacyHeader
PharmacySidebar
PharmacyMobileMenu
PharmacyProtectedRoute
```

в admin під новими назвами.

На майбутньому етапі спочатку рефакторимо reusable cabinet layer.

Тільки після цього будуємо Admin Shell.

Інакше вже на першому дні народимо два майже однакові комплекти компонентів.

---

# 53. Перевірки після реалізації

Після внесення змін окремо запустити:

```bash
pnpm install
```

Потім:

```bash
pnpm lint:admin
```

```bash
pnpm type-check:admin
```

```bash
pnpm build:admin
```

```bash
pnpm check:admin-app-shell
```

```bash
pnpm check:admin-providers
```

І разом:

```bash
pnpm check:admin
```

---

# 54. Після цього — повна перевірка монорепозиторію

Обов'язково:

```bash
pnpm check:before-deploy
```

Не достатньо того, що сам admin build зелений.

Новий workspace package може вплинути на:

- Turbo graph;
- root lint;
- root TypeScript;
- dependency graph;
- source archive;
- lockfile;
- shared packages.

---

# 55. Definition of Done для ЕТАПУ 1

Я б не вважала етап завершеним, доки не виконані **всі** ці умови:

- `apps/admin` більше не README-only folder;
- існує `@e-pharmacy/admin`;
- `pnpm dev:admin` запускає port `3001`;
- `pnpm build:admin` проходить;
- `pnpm lint:admin` проходить;
- `pnpm type-check:admin` проходить;
- root layout лишається Server Component;
- shared UI global styles використовуються напряму;
- немає скопійованих reset/base styles;
- є реальний provider boundary;
- немає фальшивого auth provider;
- root route використовує server `redirect()`;
- route береться з app-local route contract;
- metadata містить `noindex, nofollow`;
- `/robots.txt` має `Disallow: /`;
- `sitemap.ts` відсутній;
- browser-facing public API origin не доданий;
- немає direct backend fetch;
- немає JWT/browser-token logic;
- немає business components;
- немає copied PharmacyShell/Header/Sidebar;
- admin structural checks існують;
- admin structural checks входять у `check:before-deploy`;
- `pnpm-lock.yaml` актуальний;
- README актуальний;
- старий `Suppliers` roadmap прибраний;
- `pnpm check:before-deploy` проходить.

---

## Які файли очікую змінити/створити

У підсумку ЕТАП 1 має торкнутися приблизно цього набору:

```text
apps/admin/.env.example                         NEW
apps/admin/eslint.config.mjs                   NEW
apps/admin/next.config.ts                      NEW
apps/admin/next-env.d.ts                       GENERATED/NEW
apps/admin/package.json                        NEW
apps/admin/README.md                           UPDATE
apps/admin/tsconfig.json                       NEW

apps/admin/src/app/icon.svg                    NEW
apps/admin/src/app/layout.tsx                  NEW
apps/admin/src/app/page.tsx                    NEW
apps/admin/src/app/robots.ts                   NEW
apps/admin/src/app/styles.css                  NEW

apps/admin/src/lib/routes/admin-routes.ts      NEW
apps/admin/src/lib/routes/index.ts             NEW

apps/admin/src/providers/AdminProviders.tsx    NEW
apps/admin/src/providers/index.ts              NEW

scripts/checks/admin/check-admin-app-shell.mjs NEW
scripts/checks/admin/check-admin-providers.mjs NEW

package.json                                   UPDATE
pnpm-lock.yaml                                 UPDATE
README.md                                      UPDATE
```

При цьому **не очікую змін** у:

```text
apps/api
apps/client
apps/pharmacy
packages/ui
packages/auth
packages/types
packages/validation
```

на цьому конкретному етапі.

Це дуже хороший критерій межі першої задачі: **ми вводимо новий application boundary, але поки не змінюємо жоден існуючий domain**. Наступний окремий етап уже можна буде присвятити shared Error/404/Loader, а після нього — admin auth.
