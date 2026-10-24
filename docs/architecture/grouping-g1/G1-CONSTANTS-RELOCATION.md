# Stage G1 — API Constants canonical relocation

Джерело: `e-pharmacy-14-20-4.zip` + застосований **G0 Baseline & Inventory**. Цей пакет містить **механізм безпечного перенесення**. Під час самого встановлення ZIP жоден із 35 файлів не переміщується; фактичні зміни відбудуться тільки після `--apply`.

## Межі етапу

- Розділ: `apps/api/src/constants/`.
- G0 baseline: **35 файлів**, з них **35 канонічних переміщень** і 0 stable.
- Цільові домени за незмінною картою G0: `admin/access`, `admin/audit`, `admin/employees`, `admin/settings`, `auth`, `cart`, `catalog`, `fixtures`, `http`, `inventory`, `orders`, `owners`, `pharmacies`, `reviews`, `shared`.
- Сценарій переписує відносні імпорти в усіх `apps/`, `packages/`, `scripts/`, оновлює відомі абсолютні й сегментовані рядкові посилання. **Немає старих proxy-файлів чи барелів.**
- G1 **не** змінює значення констант, назви експортів, статуси, коди помилок, схеми та правила доступу. Створення нових спільних утиліт і дедуплікація відкладені до A5.
- Не переміщує `schemas`, `scripts`, `types`, `utils` — їхні майбутні канонічні адреси залишаються на G2–G5.

## Застосування

З кореня робочого репозиторію після встановлення G0 та збереження Stage C6:

```bash
pnpm grouping:relocate --dry-run --stage G1
pnpm test:grouping-g1
pnpm grouping:relocate --apply --stage G1
pnpm grouping:relocate --check --stage G1
pnpm check:grouping-g1
pnpm test:grouping-g1
pnpm check:services-s1
pnpm check:models-m1
pnpm test:models-m1
pnpm check:transport-c1
pnpm test:transport-c1
```

Далі запускати повний Gate (`check:source:*`, lint, type-check, test, React, integration, build, deploy-artifact) у локальному репозиторії з `node_modules`.

**Увага:** команди `check:grouping-g0` і `test:grouping-g0` перевіряють **саме плоский стан до G1**. Їх очікувана невідповідність після `--apply G1` не є регресією. Використовуйте `check:grouping-g1` і `test:grouping-g1`; історичні документи та інвентарі G0 зберігаються незмінними.

## Безпека та гейти

1. Immutable G0 manifest із 35 неповторюваними `from → to` шляхами; жодних колізій або неочікуваних плоских `.ts` файлів.
2. Перед записом — зчитування **всіх** майбутніх змін, перевірка вихідних G0 SHA-256 (з допустимим косметичним нормалізуванням, але строгим raw-хешем для multiline-template джерел), фіксованого fingerprint майбутніх 35 файлів, кількості й адрес усіх відносних імпортів.
3. `--dry-run` і `--check` ніколи не записують у файлову систему. `--check` після перенесення перевіряє immutable post-G1 SHA-256 та повну доступність імпортів. Неповне перенесення відхиляється.
4. JSON-фікстури переносяться без переписування даних. Реалізації зберігають свої назви та експортовані значення.
5. Модельний M1 gate канонізує **тільки** точні завершені G1 шляхи залежностей до їхнього історичного вигляду перед порівнянням незмінних M1-хешів. Не вимикає перевірку схем і не перезаписує M1 baseline.
6. У разі failure *перед* `--apply` нічого не переміщується; якщо скрипт аварійно завершується під час реальних файлових операцій (наприклад, disk I/O), не запускати повторно, а відновити вихідний snapshot/git стан і повторити preflight.

## Результати локального моделювання

- `--dry-run`: PASS, `selectedMoves=35`, `touchedFiles=250`, `rewrittenFileContents=218`, `verifiedRelativeImports=3494` (цифри можуть змінитися за наявності додаткових файлів у робочій копії; непередбачені зміни baseline відхиляються).
- `--apply` у локальній копії: PASS; `--check`: 35/35, selectedMoves=0, proxyFiles=0.
- M1 (`check-models-m1`), S1 (`check:services-s1`), C1 (`check:transport-c1`): PASS.
- Архітектурні тести G1+M1+S1+C1: **12/12 PASS**.
- З 78 статичних `check:source:*`, які перевірялися окремими Node-скриптами, **76 пройшли**. Дві перевірки клієнтської бібліотеки потребують `node_modules` і не можуть бути підтверджені в цьому середовищі.
- Повний lint/type-check/unit/integration/React/build/deploy Gate тут **не виконувався** — перевірити локально після застосування.

## Commit

Після повного Gate:

```bash
git diff --check
git status --short
git add -A
git diff --cached --check
git diff --cached --name-status
git commit -m "refactor(api): group constants into canonical domains G1"
git push origin main
```

Перед `git add -A` переконайтесь, що незв'язані файли (зокрема `apps/api/.gitignore` і тимчасові логи) не будуть випадково включені до коміту. Якщо є сторонні зміни — staging виконати явними шляхами.
