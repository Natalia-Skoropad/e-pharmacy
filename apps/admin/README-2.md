Так 🙂 **Етап 2 — додаємо до admin сторінки завантаження, 404 та обробки помилок на основі вже наявних shared-компонентів.**

Я звірила їхні реальні props у твоєму проєкті та реалізацію в pharmacy. Нижче — детальне завдання **для виконання після застосування правок першого етапу**.

Авторизацію, Dashboard, Header, Sidebar та інші наступні етапи сюди не включаємо. Цього разу навчаємо каркас красиво реагувати, коли щось загубилося або пішло не за планом 😄

---

1. **Мета другого етапу**

   Додати чотири спеціальні файли Next.js:

   ```text
   apps/admin/src/app/loading.tsx
   apps/admin/src/app/not-found.tsx
   apps/admin/src/app/error.tsx
   apps/admin/src/app/global-error.tsx
   ```

   Після цього admin має:
   - показувати спільний loader під час очікування відповідного route segment;
   - відображати брендовану сторінку для невідомих маршрутів;
   - показувати зрозумілу помилку рендерингу сторінки;
   - мати окремий fallback для помилок кореневого layout;
   - пропонувати повторну спробу там, де це підтримує error boundary;
   - зберігати `noindex, nofollow`;
   - використовувати існуючий UI без дублювання його розмітки та стилів.

2. **Межі етапу**

   На цьому етапі не створюємо:

   ```text
   Login
   Password Recovery
   Reset Password
   AuthProvider
   AdminProtectedRoute
   AdminShell
   AdminHeader
   AdminSidebar
   Dashboard
   API/BFF routes
   permissions
   business modules
   ```

   Також не потрібні:
   - нові бібліотеки;
   - оновлення Next.js;
   - окремий loading store;
   - глобальний перехоплювач усіх browser errors;
   - підключення сервісу моніторингу;
   - власна реалізація React Error Boundary.

   Використовуємо файлові conventions Next.js і наявний shared UI.

3. **Відповідальність кожного файла**

   | Файл               | Призначення                                       | Компонент      |
   | ------------------ | ------------------------------------------------- | -------------- |
   | `loading.tsx`      | Очікування завантаження сегмента                  | `PageLoader`   |
   | `not-found.tsx`    | Невідомий маршрут або `notFound()`                | `NotFoundPage` |
   | `error.tsx`        | Неочікувана помилка рендерингу всередині boundary | `ErrorPage`    |
   | `global-error.tsx` | Помилка кореневого layout/template                | `ErrorPage`    |

   `error.tsx` не охоплює layout того самого сегмента. Для кореневого layout потрібний `global-error.tsx`. ([Next.js][1])

4. **Єдине джерело UI**

   Усі три компоненти вже експортуються з:

   ```ts
   '@e-pharmacy/ui/status-pages';
   ```

   Використовуємо цей public entrypoint:

   ```tsx
   import { PageLoader } from '@e-pharmacy/ui/status-pages';
   ```

   Для уникнення однакових назв локального та shared-компонента:

   ```tsx
   import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';
   ```

   ```tsx
   import { NotFoundPage as SharedNotFoundPage } from '@e-pharmacy/ui/status-pages';
   ```

   Не копіюємо в admin реалізації:

   ```text
   PageLoader
   ErrorPage
   NotFoundPage
   StatusPageLayout
   Button
   LinkButton
   Container
   ```

   Не імпортуємо компоненти безпосередньо з іншого застосунку, наприклад із `apps/pharmacy`.

5. **`loading.tsx`**

   Файл має бути мінімальним:

   ```tsx
   import { PageLoader } from '@e-pharmacy/ui/status-pages';

   function Loading() {
     return <PageLoader label="Loading admin cabinet..." />;
   }

   export default Loading;
   ```

   Вимоги:
   - без `'use client'`;
   - без `useEffect`;
   - без timer;
   - без network requests;
   - без перевірки session;
   - без власної анімації;
   - без копіювання CSS loader.

   У поточному `PageLoader` є лише prop `label`. Не додаємо до виклику вигадані `fullscreen`, `size`, `variant` або `isLoading`.

6. **Коли loader має з’являтися**

   `loading.tsx` працює як fallback для відповідної Suspense-межі, яку Next.js створює для сегмента. Він не є універсальним індикатором кожного запиту в застосунку. ([Next.js][2])

   Тому не потрібно:
   - примусово показувати його при кожному кліку;
   - встановлювати мінімальну тривалість анімації;
   - додавати штучну затримку до root redirect;
   - обгортати ним майбутні fetch-запити вручну.

   На швидкому переході loader може бути непомітним — це нормально.

   Поточний shared loader уже має:

   ```text
   role="status"
   aria-label
   aria-hidden для декоративної анімації
   prefers-reduced-motion
   ```

   Зберігаємо цю поведінку.

7. **Майбутня аптечна анімація**

   Другий етап має забезпечити простий контракт:

   ```text
   admin loading.tsx → shared PageLoader
   ```

   Коли пізніше зміниться анімація всередині shared `PageLoader`, admin отримає її разом з іншими місцями, які використовують цей компонент.

   Зараз анімацію не переробляємо. Не створюємо:

   ```text
   AdminLoader
   AdminPageLoader
   AdminLoadingAnimation
   ```

   Окремий wrapper, який лише повертає `PageLoader`, також не потрібний.

8. **`not-found.tsx`**

   Залишається Server Component.

   Використовуємо `SharedNotFoundPage` з такими параметрами:

   | Prop          | Значення                                                        |
   | ------------- | --------------------------------------------------------------- |
   | `title`       | `Page not found`                                                |
   | `description` | `The page you are looking for does not exist in Admin Cabinet.` |
   | `eyebrow`     | `404`                                                           |
   | `homeHref`    | `ADMIN_ROUTES.DASHBOARD`                                        |
   | `homeLabel`   | `Back to dashboard`                                             |
   | `variant`     | `brand`                                                         |
   | `landmark`    | `main`                                                          |

   Додаємо ту саму ілюстрацію сторінок статусів, яка використовується в pharmacy.

   На цьому етапі `secondaryAction` не передаємо: робочих admin-розділів для другої кнопки ще немає.

   Не додаємо посилання на майбутні Products, Employees або Pharmacies.

9. **Маршрути для кнопок**

   Імпортуємо наявний app-local контракт:

   ```tsx
   import { ADMIN_ROUTES } from '@/lib/routes';
   ```

   Використовуємо:

   ```tsx
   homeHref={ADMIN_ROUTES.DASHBOARD}
   ```

   Не дублюємо строку:

   ```tsx
   homeHref = '/admin/dashboard';
   ```

   Нові route constants для цього етапу не потрібні.

   **Важливе обмеження:** Dashboard після другого етапу все ще не реалізований. Тому натискання `Back to dashboard` поки приведе на брендовану 404 за адресою `/admin/dashboard`.

   Це продовження погодженого контракту першого етапу, а не готовий шлях виходу з помилки. У перевірках треба прямо зазначити це обмеження.

   Не створюємо тимчасовий Dashboard лише заради кнопки й не додаємо автоматичні редиректи зі сторінки 404.

10. **Ілюстрація сторінок статусів**

    У pharmacy вже є:

    ```text
    apps/pharmacy/public/images/status/status-pills.png
    ```

    Для admin додаємо той самий asset:

    ```text
    apps/admin/public/images/status/status-pills.png
    ```

    Копіюємо **лише цей файл**.

    Це виправдане розміщення статичного ресурсу для окремого Next.js-застосунку: admin має самостійно віддавати зображення зі свого origin.

    Не копіюємо весь `public/` і не завантажуємо ілюстрацію з pharmacy-сайта.

    Параметри наявного зображення:

    ```tsx
    {
      src: '/images/status/status-pills.png',
      alt: '',
      width: 749,
      height: 508,
      priority: true,
    }
    ```

    `alt=""` правильний для декоративної ілюстрації: зміст помилки вже пояснений текстом.

11. **Спільний опис asset усередині admin**

    Щоб не повторювати цей об’єкт у трьох файлах, можна створити маленький модуль:

    ```text
    apps/admin/src/lib/status-pages/status-page-image.ts
    ```

    Наприклад:

    ```ts
    export const STATUS_PAGE_IMAGE = {
      src: '/images/status/status-pills.png',
      alt: '',
      width: 749,
      height: 508,
      priority: true,
    } as const;
    ```

    Він має бути безпечним і для Server, і для Client Components:
    - без `server-only`;
    - без environment variables;
    - без browser globals;
    - без network requests;
    - без імпорту auth або providers.

    Це лише опис ресурсу, без додаткового шару компонентів.

12. **`error.tsx`**

    Файл обов’язково починається з:

    ```tsx
    'use client';
    ```

    Для встановленого в проєкті Next.js `16.2.4` використовуємо наявний стабільний контракт:

    ```tsx
    type ErrorPageProps = Readonly<{
      error: Error & { digest?: string };
      reset: () => void;
    }>;
    ```

    Передаємо callback у shared-компонент:

    ```tsx
    onRetry = { reset };
    ```

    Це спроба скинути стан boundary та повторно відрендерити його вміст. Не обіцяємо, що будь-яка серверна чи мережева проблема обов’язково зникне.

    Не переносимо приклади з новішим `retry` prop без урахування встановленої версії: стабільний `retry` з’явився пізніше. ([Next.js][1])

13. **Тексти й оформлення route error**

    Для `SharedErrorPage`:

    | Prop          | Значення                                                           |
    | ------------- | ------------------------------------------------------------------ |
    | `title`       | `Something went wrong`                                             |
    | `description` | `The admin cabinet could not display this page. Please try again.` |
    | `eyebrow`     | `Page error`                                                       |
    | `homeHref`    | `ADMIN_ROUTES.DASHBOARD`                                           |
    | `homeLabel`   | `Back to dashboard`                                                |
    | `retryLabel`  | `Try again`                                                        |
    | `variant`     | `brand`                                                            |
    | `landmark`    | `main`                                                             |
    | `image`       | `STATUS_PAGE_IMAGE`                                                |
    | `onRetry`     | `reset`                                                            |

    Не переносимо pharmacy-specific copy на кшталт `Route guard`: на цьому етапі admin ще не має auth guard.

    Кнопка `Try again` має викликати переданий callback **тільки після натискання**.

    Не викликаємо `reset()` під час render або автоматично в `useEffect`.

14. **Які помилки обробляє `error.tsx`**

    Його призначення — неочікувані помилки рендерингу в межах відповідного дерева.

    Не будуємо навколо нього універсальну обробку:
    - помилок валідації форми;
    - відмови в доступі;
    - результатів бізнес-операцій;
    - усіх event handlers;
    - будь-якого rejected Promise.

    Такі стани надалі оброблятимуться у відповідних features.

    Також не підміняємо помилку сторінкою 404: «не знайдено» і «не вдалося відобразити» мають різний зміст.

15. **Безпечна діагностика помилок**

    Для двох error boundaries потрібний невеликий app-local helper:

    ```text
    apps/admin/src/lib/errors/report-render-error.ts
    ```

    Він має формувати мінімальну структуровану діагностику:

    ```ts
    {
      application: 'admin',
      category: 'render_error',
      context: 'route-boundary' | 'root-layout',
      digest?: string,
    }
    ```

    Виклик — із `useEffect`, коли boundary отримав помилку.

    У повідомлення користувачу та власний browser log не передаємо:

    ```text
    error.message
    error.stack
    повний об’єкт error
    cookies
    tokens
    request/response bodies
    URL query parameters
    дані користувача
    ```

    Для другого етапу достатньо структурованого `console.error` з дозволеними полями. Новий endpoint або зовнішній сервіс логування не потрібний.

    Helper не повинен залежати від `AuthProvider`, `ToastProvider` або працездатності backend.

16. **`global-error.tsx`**

    Це окремий Client Component:

    ```tsx
    'use client';
    ```

    Він використовує той самий `SharedErrorPage`, але повинен самостійно сформувати документ:

    ```tsx
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <title>Something went wrong | Admin Cabinet</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>{/* SharedErrorPage */}</body>
    </html>
    ```

    Причина: коли активний global error fallback, він замінює root layout. Потрібні власні `<html>`, `<body>` та необхідні стилі. Експорт `metadata` у цьому Client Component не підтримується. ([Next.js][1])

17. **Незалежність global error від providers**

    У `global-error.tsx` не додаємо:

    ```tsx
    <AdminProviders>...</AdminProviders>
    ```

    Також не додаємо окремо:

    ```text
    ToastProvider
    AuthProvider
    майбутній AdminShell
    ```

    Global fallback має відображатися навіть тоді, коли звичайне кореневе дерево не змогло відрендеритися.

    Поточні shared `ErrorPage`, `Button` і `LinkButton` не вимагають auth/toast provider — це дозволяє використати їх тут.

18. **Стилі для global error**

    Підключаємо необхідний shared baseline безпосередньо:

    ```tsx
    import '@e-pharmacy/ui/styles/tokens.css';
    import '@e-pharmacy/ui/styles/reset.css';
    import '@e-pharmacy/ui/styles/base.css';
    import '@e-pharmacy/ui/styles/utilities.css';

    import './styles.css';
    ```

    Повторення imports у двох точках входу допустиме. Копіювати сам CSS не потрібно.

    Для етапу 2 не створюємо:

    ```text
    AdminError.module.css
    AdminNotFound.module.css
    AdminLoader.module.css
    ```

    Зовнішній вигляд забезпечують shared-компоненти та їхні CSS Modules.

19. **Тексти global error**

    Від route error відрізняються лише контекст і опис:

    | Prop          | Значення                                                         |
    | ------------- | ---------------------------------------------------------------- |
    | `title`       | `Something went wrong`                                           |
    | `description` | `The admin cabinet could not start correctly. Please try again.` |
    | `eyebrow`     | `Application error`                                              |
    | `retryLabel`  | `Try again`                                                      |
    | `homeLabel`   | `Back to dashboard`                                              |

    Решта props — ті самі:

    ```text
    ADMIN_ROUTES.DASHBOARD
    STATUS_PAGE_IMAGE
    variant="brand"
    landmark="main"
    onRetry={reset}
    ```

    Для діагностики використовуємо:

    ```text
    context: root-layout
    ```

    Для звичайного `error.tsx`:

    ```text
    context: route-boundary
    ```

20. **404, metadata та robots**

    Зберігаємо налаштування першого етапу:

    ```text
    root metadata: noindex, nofollow
    robots.txt: Disallow: /
    sitemap.ts: відсутній
    ```

    У global error додаємо власний robots meta, оскільки на metadata root layout покладатися не можна.

    Root `not-found.tsx` має обробляти невідомі адреси. Водночас у Next.js HTTP-статус для not-found UI залежить від streaming: для вже розпочатої streamed-відповіді він може залишатися `200`. Тому тест «кожний not-found завжди повертає 404» був би некоректним. ([Next.js][3])

    Для звичайного прямого запиту до невідомого маршруту перевіряємо очікувану 404-відповідь і потрібний UI.

    Не додаємо `global-not-found.tsx` чи експериментальні налаштування: для поточної структури вони не потрібні.

21. **Доступність і responsive**

    Для 404 та двох error pages:
    - один основний заголовок `h1`;
    - один `main` у поточному документі;
    - доступність кнопок із клавіатури;
    - видимий focus;
    - зрозумілі назви дій;
    - декоративне зображення з порожнім `alt`;
    - відсутність горизонтального scroll.

    Shared-компонент уже підтримує:

    ```tsx
    landmark = 'main';
    ```

    Тому не обгортаємо його ще одним `<main>`.

    Перевіряємо щонайменше ширини:

    ```text
    360px
    768px
    1440px
    ```

    Для loader зберігаємо наявну підтримку reduced motion.

22. **Structural check для другого етапу**

    Додаємо:

    ```text
    scripts/checks/admin/check-admin-status-pages.mjs
    ```

    Перевірка має захищати такі контракти:

    | Область      | Що перевіряємо                                              |
    | ------------ | ----------------------------------------------------------- |
    | Файли        | Усі чотири special files існують і не порожні               |
    | Loading      | Shared `PageLoader`, admin label, без client directive      |
    | Not found    | Shared `NotFoundPage`, route constant, без client directive |
    | Error        | Client directive, shared `ErrorPage`, `onRetry={reset}`     |
    | Global error | Client directive, власні `html/body`, robots meta, стилі    |
    | Providers    | Global error не імпортує `AdminProviders`                   |
    | Imports      | Немає імпортів із `apps/pharmacy` або `apps/client`         |
    | Security     | Немає auth/network/token logic в boundary-файлах            |
    | Asset        | Ілюстрація існує за заявленим локальним шляхом              |

    Перевірка не повинна залежати від точного порядку props, форматування JSX чи дослівного тексту description.

    Старі checks першого етапу залишаються активними.

23. **Підключення перевірок**

    У root `package.json` додаємо:

    ```json
    "check:admin-status-pages": "node scripts/checks/admin/check-admin-status-pages.mjs"
    ```

    У `check:admin` новий check ставимо після наявних structural checks і перед lint/type-check.

    У `check:before-deploy` додаємо окрему команду:

    ```bash
    pnpm check:admin-status-pages
    ```

    Вона має:
    - запускатися в структурній частині;
    - бути з’єднана через `&&`;
    - виконуватися один раз;
    - не додавати повторний admin build.

    Повний `pnpm check:admin` усередину `check:before-deploy` не вставляємо.

24. **Тести поведінки**

    Не потрібно заново тестувати всю реалізацію shared UI.

    Для нового admin-коду корисні дві цільові перевірки:
    - натискання `Try again` викликає переданий `reset`, а саме монтування error page його не викликає;
    - діагностика містить лише дозволені поля й не серіалізує `message`, `stack` або сторонні властивості помилки.

    Можливі файли:

    ```text
    apps/admin/src/app/error.react.test.tsx
    apps/admin/src/lib/errors/report-render-error.test.ts
    ```

    Використовуємо наявну тестову інфраструктуру. Новий framework не встановлюємо.

    Перевірка виклику `reset` не замінює перевірку реального Next.js boundary у запущеному застосунку.

25. **Ручна перевірка Next.js boundaries**

    Перевіряємо:

    | Сценарій                                       | Очікуваний результат                   |
    | ---------------------------------------------- | -------------------------------------- |
    | Пряма невідома адреса                          | Брендована admin 404                   |
    | Відсутній `/admin/dashboard`                   | Та сама 404 — очікувано на цьому етапі |
    | Затримка тестового сегмента                    | Shared loader                          |
    | Помилка рендерингу тестової сторінки           | `error.tsx`                            |
    | Помилка root layout у контрольованій перевірці | `global-error.tsx`                     |
    | Натискання retry                               | Виклик boundary callback               |
    | Стійка помилка після retry                     | Error UI залишається доступним         |
    | Global error                                   | Стилі та UI працюють без providers     |
    | Ілюстрація                                     | Завантажується з admin origin          |

    Для перевірки loading/error можна тимчасово використати окремий тестовий маршрут у локальній робочій копії.

    Після перевірки прибрати:

    ```text
    тестові маршрути
    штучні throw
    штучні затримки
    debug-перемикачі
    ```

    Ці допоміжні зміни не повинні потрапити у фінальний архів.

    Особливо важливо перевірити error UI у production-збірці: development overlay не є фінальним інтерфейсом користувача.

26. **Команди перевірки**

    Окремо:

    ```bash
    pnpm check:admin-status-pages
    pnpm lint:admin
    pnpm type-check:admin
    pnpm --filter @e-pharmacy/admin test
    pnpm --filter @e-pharmacy/admin test:react
    pnpm build:admin
    ```

    Комплексно:

    ```bash
    pnpm check:admin
    pnpm check:before-deploy
    ```

    Для перевірки production-інтерфейсу після build:

    ```bash
    pnpm --filter @e-pharmacy/admin start
    ```

    Повний monorepo check запускаємо з потрібними environment variables інших застосунків. Якщо перевірка заблокована середовищем, у результаті окремо зазначаємо, що пройдено, а що не вдалося перевірити.

27. **Документація та залежності**

    Оновлюємо:

    ```text
    apps/admin/README.md
    ```

    Фіксуємо:
    - додані чотири fallback-файли;
    - використання shared status components;
    - команду `check:admin-status-pages`;
    - обмеження маршруту Dashboard;
    - відсутність auth і business modules;
    - різницю між route error і global error.

    Нових dependencies для цього етапу не потрібно. Відповідно, очікуваних змін у `pnpm-lock.yaml` немає.

    `turbo.json`, `pnpm-workspace.yaml` і backend configuration для цієї задачі змінювати не потрібно.

28. **Очікуваний набір файлів**

    | Файл                                                    | Дія                  |
    | ------------------------------------------------------- | -------------------- |
    | `apps/admin/src/app/loading.tsx`                        | Додати               |
    | `apps/admin/src/app/not-found.tsx`                      | Додати               |
    | `apps/admin/src/app/error.tsx`                          | Додати               |
    | `apps/admin/src/app/global-error.tsx`                   | Додати               |
    | `apps/admin/src/lib/status-pages/status-page-image.ts`  | Додати               |
    | `apps/admin/src/lib/errors/report-render-error.ts`      | Додати               |
    | `apps/admin/src/lib/errors/report-render-error.test.ts` | Додати               |
    | `apps/admin/src/app/error.react.test.tsx`               | Додати               |
    | `apps/admin/public/images/status/status-pills.png`      | Додати наявний asset |
    | `scripts/checks/admin/check-admin-status-pages.mjs`     | Додати               |
    | `apps/admin/README.md`                                  | Оновити              |
    | `package.json`                                          | Оновити scripts      |

    Основний шлях реалізації не потребує змін у:

    ```text
    apps/api
    apps/client
    apps/pharmacy
    packages/ui
    packages/auth
    packages/types
    packages/validation
    ```

29. **Definition of Done**

    Другий етап готовий, коли:
    - усі чотири special files реалізовані;
    - використовується shared status UI;
    - loading і not-found залишаються Server Components;
    - error і global-error є Client Components;
    - retry передає керування boundary callback;
    - global error має власний документ, стилі та `noindex, nofollow`;
    - global error працює без providers;
    - raw error details не виводяться користувачу й у власну діагностику;
    - ілюстрація доступна з admin origin;
    - сторінки перевірені на mobile і desktop;
    - новий structural check інтегрований у команди перевірки;
    - цільові тести проходять;
    - lint, type-check і build проходять;
    - результат повної перевірки монорепозиторію зафіксований;
    - тимчасові тестові маршрути видалені;
    - auth, Dashboard та інші наступні етапи не реалізовані.

30. **Формат результату після реалізації**

    Надіслати:
    - архів тільки зі зміненими й доданими файлами;
    - короткий перелік змін;
    - фактичні результати перевірок;
    - текст коміту.

    Очікуваний коміт:

    ```text
    feat(admin): add shared loading and error boundaries
    ```

[1]: https://nextjs.org/docs/app/api-reference/file-conventions/error?utm_source=chatgpt.com 'File-system conventions: error.js'
[2]: https://nextjs.org/docs/app/api-reference/file-conventions/loading?utm_source=chatgpt.com 'File-system conventions: loading.js'
[3]: https://nextjs.org/docs/app/api-reference/file-conventions/not-found?utm_source=chatgpt.com 'File-system conventions: not-found.js'
