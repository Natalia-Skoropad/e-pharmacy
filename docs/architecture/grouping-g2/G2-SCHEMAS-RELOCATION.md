# Stage G2 — API Schemas canonical grouping

Джерело: актуальний `e-pharmacy-14-20-5.zip` **після Stage G1**. G2 — тільки перенесення схем, Zod-контрактів і відповідних контрактних тестів, без редагування правил валідації або бізнес-логіки.

## Обсяг і канонічні папки

- `apps/api/src/schemas/`: **50 файлів** за незмінним G0 manifest.
- **38** запланованих переміщень, **12** стабільних файлів у `shared/` та `contracts/`.
- Цільові підпапки: `admin/{audit,employees,owners,pharmacies,settings}`, `admin`, `auth`, `cart`, `catalog`, `clients`, `contracts`, `infrastructure`, `orders`, `owners`, `pharmacies`, `reviews`, `shared`.
- Немає редагування схем, DTO, повідомлень валідації, default/refine/transform, regex, доступів, статусів, обмежень довжини, order/payment/owner/pharmacy workflows.
- Дедуплікація й об'єднання схем відкладаються до окремого **A6 Audit**. Не створювати проксі чи реекспортні барелі на старих місцях.

## Файли пакета

- `scripts/architecture/relocate-api-grouping-g2.mjs` — read-only dry-run/check, preflight, staged apply G2.
- `scripts/architecture/relocate-api-grouping-g2.test.mjs` — 5 тестів карти, стабільних файлів, хешів, CLI, заборони дострокових G3–G5 та proxy.
- `scripts/architecture/relocate-api-grouping.mjs` — явний диспетчер G1/G2, щоб команда `grouping:relocate` не втрачала доступ до G1.
- `docs/architecture/grouping-g2/source-fingerprints.json` — **фіксовані** pre-G2 та canonical post-G2 SHA-256, у тому числі очікувані зміни залежних G1 constants. Зафіксовані в ізольованому тестовому прогоні, ніколи не розраховуються заново під час `--check`.
- Дрібні зміни у G1 check/test та M1 check, щоб вони враховували **лише точні затверджені G2 переміщення**, не послаблюючи свої історичні baseline.
- `package.json` — маршрутизація команди та нові `check:grouping-g2`, `test:grouping-g2`.

## Безпечне застосування (із кореня репозиторію)

До встановлення патча G2 закомітити повністю перевірений G1. Розпакувати тільки змінені/нові файли з архіву G2. Сам архів не переносить 38 схем: фізичне перенесення відбувається **тільки** після `--apply`.

```bash
pnpm grouping:relocate --dry-run --stage G2
pnpm test:grouping-g2
pnpm grouping:relocate --apply --stage G2
pnpm grouping:relocate --check --stage G2
pnpm check:grouping-g2
pnpm test:grouping-g2

pnpm check:grouping-g1
pnpm test:grouping-g1
pnpm check:models-m1
pnpm test:models-m1
pnpm check:services-s1
pnpm test:services-s1
pnpm check:transport-c1
pnpm test:transport-c1
```

Очікування після `--apply`: `completedBeforeRun=38`, `selectedMoves=0`, `obsoleteProxyFiles=0`, `verifiedRelativeImports=3494` (число залежить від поточного стану репозиторію). `--check` не змінює файли, неповне перенесення відхиляється.

Після архітектурних тестів — **повний локальний Gate**:

```bash
pnpm check:source:api
pnpm check:source:shared
pnpm check:source:client
pnpm check:source:pharmacy
pnpm check:source:admin
pnpm check:lint:serial
pnpm check:type-check:serial
pnpm check:test:serial
pnpm check:react:serial
pnpm check:integration:serial
pnpm check:build:serial
pnpm check:deploy-artifact
```

Якщо знайдуться старі жорстко закодовані шляхи у контрактних тестах — правити **тільки** застаріле очікування шляху, а не повертати модуль у старе місце. Збереження реальних validation contracts обов'язкове.

`check:grouping-g0` історично контролює стан **до G1** і після G1/G2 очікувано не відповідає поточному дереву. Натомість використовуємо G1 + G2 gates; G0 inventory/manifest залишаються незмінними.

## Висновки тестування в ізольованій копії

| Перевірка | Результат |
|---|---|
| G2 dry-run на до-G2 дереві | PASS, 38 змін, 144 affected files, 135 текстових переписувань |
| G2 apply/check в ізольованій копії | PASS, 38/38, без застарілих proxy |
| G2 tests до й після переміщення | 5/5 PASS |
| G1 після G2 | PASS, 35/35 |
| M1 / Transport C1–C6 / Services S1 | PASS |
| G1 + M1 + Transport + Services архітектурні тести | 12/12 PASS |
| Standalone Node source checks | 76/80 PASS; 4 не запустилися через відсутність package-local `node_modules`/TypeScript |

Повні TypeScript/lint/unit/integration/React/build/deploy перевірки у цьому середовищі не виконувалися. Їх потрібно виконати локально після застосування G2. Це **не** production-gate PASS до отримання локального логу.

## Коміт

Після успішного локального Gate:

```bash
git status --short
git diff --check
git add -A
git diff --cached --check
git diff --cached --name-status
git commit -m "refactor(api): group schemas into canonical domains G2"
git push origin main
```

Не включати чужі незакомічені файли, середовище `.env`, тимчасові логи або інші неузгоджені зміни. Наступний етап — **G3 Scripts**: під час перенесення важливо зберегти всі CLI entrypoints, міграції, dry-run semantics та відносні шляхи до шаблонів.
