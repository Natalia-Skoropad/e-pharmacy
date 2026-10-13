# Stage 14.17 — Hardening / regression / E2E checklist

Дата підготовки: 13.10.2026. Межі: лише вже наявні Stage 1–14.17, **без Stage 12 та Stage 15+**.

## Автоматизовані перевірки

У монорепозиторії після накладання патча:

```bash
pnpm check:admin-pharmacies-stage-14-17
pnpm check:admin-permissions
pnpm check:admin-shell
pnpm check:admin-pharmacy-owners
pnpm --filter @e-pharmacy/admin test
pnpm --filter @e-pharmacy/api test
# Для інтеграційного тестування потрібна окрема ТЕСТОВА MongoDB replica set:
E_PHARMACY_TEST_MONGODB_URI=mongodb://... pnpm --filter @e-pharmacy/api test:integration
pnpm check:before-deploy
```

`check:before-deploy` містить Stage 14.17 source checker. Додано контракти API `pharmacy-stage-14-17-hardening.contract.test.ts`, UI `pharmacies-stage-14-17.test.ts` та інтеграційний тест збереження default client `default-pharmacy-client.stage-14-17.mongo.integration.test.ts`.

У середовищі підготовки патча **пройшли**: 177/177 Admin unit/contract (включно з 39/39 Pharmacy), 19/19 Admin React, 9/9 API Stage 14.17 source-контрактів, Admin `tsc --noEmit` та 78/78 source-only checks (Stage 7/8/13/14.17). Повні `pnpm lint`, `type-check`, `test`, `test:integration`, `build`, `check:before-deploy` і **ручні E2E** не можна вважати успішно виконаними без локальних залежностей, запущених додатків і тестової MongoDB. Їх потрібно підтвердити на локальному проєкті.

## Ручні E2E — виконати та зафіксувати результат

Тестові ролі: новий Owner зі статусом `new`, активний Owner, заблокований Owner, Admin з `pharmacies.view`, Admin з `pharmacies.moderate`, Admin з `pharmacies.edit`, Owner з двома аптеками (A/B). Використовувати лише тестові облікові записи та тестову БД. Після кожної мутації перевіряти **статус, revision, власника, audit та public DTO**. Результат кожного пункту позначити `PASS`/`FAIL` з доказом (ID / screenshot / response), не підмінювати це source-контрактами.

| № | Кроки та очікуваний результат |
| --- | --- |
| 1 | Зареєструвати Owner `new`, створити pharmacy `new`, Owner submits. Pharmacy стає `on_verification`, Owner поки `new`. |
| 2 | Admin `request_corrections` на `on_verification`: статус незмінний, reason у Owner, окремий audit; Owner редагує та повторно submits. |
| 3 | Admin `Approve & activate` для Owner **`new`** доступний у UI і API. Pharmacy `active`, Owner уперше `active`, default client один. |
| 4 | Active pharmacy зберігає й submits іншу назву/адресу/банк: `on_moderation`; public storefront бачить лише затверджені дані. |
| 5 | Admin corrections на `on_moderation`: статус незмінний, pending зберігається, public дані без змін. Owner виправляє/надсилає повторно. |
| 6 | Admin approves: published = submitted, pending очищено, документи узгоджені, початковий `activatedAt` не змінено. |
| 7 | Створити `new`, потім `in_progress` order: обидва блокують `block` (409). Закрити/скасувати — блокування дозволене з reason. |
| 8 | Block Owner: активація pharmacy заборонена. Unblock Owner **не** відновлює жодну pharmacy автоматично. |
| 9 | Block pharmacy з початковою активацією і без неї: `review_reactivation` лише явним Admin рішенням — `active` або `on_verification`; **ніколи** `on_moderation`. |
| 10 | Дві corrections поспіль із новими revision/key записують **два** audit events без зміни pharmacy.status. Replay з тим самим key не додає audit. |
| 11 | Для rating `0`, `0.95`, `1`, `1.95`, `3.95`, `4`, `5` та `reviewsCount=0` перевірити рівно один правильний bucket і no-reviews UI. |
| 12 | Комбінувати pharmacy search, Owner search, date, status (AND); back/forward/reload дають той самий URL і результат; недійсна page → clamp. |
| 13 | Pharmacy ID/name та Owner name відкривають потрібні details. Некоректний/відсутній ID → NotFound. |
| 14 | Admin comments приватні: не показуються в Owner notes/Pharmacy cabinet. GET/POST/DELETE чужих даних відхиляються відповідно до ролі/permission. |
| 15 | Admin docs list/download лише для посилань і `attachedAt` вибраної pharmacy; IDOR іншої pharmacy заборонено; жодних edit controls. |
| 16 | Pharmacy A Activity не містить Pharmacy B, хоч Owner спільний; Owner Activity містить обидві. Перевірити list/actors/detail IDOR. |
| 17 | Відкрити `/documents`: detail + docs (без запитів до інших вкладок); `/reviews` майбутнього модуля — **0** reviews API requests, без waterfall. |
| 18 | Перевірити loading/error/empty/retry, горизонтальний scroll таблиці на мобільному, клавіатуру/Tab/Escape, фокус модалок, labels для screen reader. |
| 19 | Admin лише з `pharmacies.view`: немає Manage status у UI; direct POST moderation / PATCH status → 403. Admin з `moderate` має доступ. |
| 20 | Повторно застосувати індекси / наявні idempotent міграції на **тестовій** БД. `pnpm check:before-deploy` повинен завершитись кодом 0. |

## Результат / критерії завершення

- Зберегти stdout/stderr та коди завершення усіх команд у локальному QA report.
- Для E2E зібрати 20 підтверджених PASS; для знайдених FAIL — issue + повторний прогін.
- Перевірити, що жоден з майбутніх Admin Reviews/Orders/Clients/Products/Product Requests модулів не реалізовано до Stage 15.
- **Не позначати `build/tests green` або `manual E2E done`, доки ці перевірки фактично не виконані.**
