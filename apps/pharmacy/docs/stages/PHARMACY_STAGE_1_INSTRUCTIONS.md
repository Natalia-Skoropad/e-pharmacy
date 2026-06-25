# Pharmacy Cabinet — Stage 1 installation

Цей пакет додає перший каркас `apps/pharmacy` для E-PHARMACY.

## Що входить

- `apps/pharmacy/package.json`
- `apps/pharmacy/tsconfig.json`
- `apps/pharmacy/next.config.ts`
- `apps/pharmacy/eslint.config.mjs`
- `apps/pharmacy/.env.example`
- базовий `src/app` App Router
- protected route group `src/app/pharmacy/(protected)`
- placeholder pages для dashboard, profile, orders, clients, products, all-products, product-requests
- route constants, path builders і parser functions для clean filter URLs
- простий Pharmacy shell без Footer
- service pages: loading, error, not-found
- оновлений root `package.json` із pharmacy scripts

## Як застосувати

1. Розпакуй архів у корінь репозиторію `e-pharmacy`.
2. Дозволь заміну root `package.json`, бо в ньому додані scripts для Pharmacy app.
3. Перевір, що структура стала такою:

```txt
apps/pharmacy
package.json
```

4. Встанови залежності або онови workspace links:

```bash
pnpm install
```

5. Запусти Pharmacy app:

```bash
pnpm --filter @e-pharmacy/pharmacy dev
```

Або root script:

```bash
pnpm dev:pharmacy
```

6. Відкрий сторінку:

```txt
http://localhost:3002/pharmacy/dashboard
```

## Перевірки

```bash
pnpm --filter @e-pharmacy/pharmacy lint
pnpm --filter @e-pharmacy/pharmacy type-check
pnpm --filter @e-pharmacy/pharmacy build
```

Root-команди:

```bash
pnpm lint:pharmacy
pnpm type-check:pharmacy
pnpm build:pharmacy
pnpm check:pharmacy
```

## Важливо перед наступним етапом

- Auth guard у цьому етапі ще не підключений. Це окремий наступний крок.
- API layer у цьому етапі ще не підключений. Сторінки зроблені як UI skeleton.
- Route structure зроблена за ТЗ із `[[...filters]]`. Якщо Next.js у твоїй версії посвариться на сусідство `[[...filters]]` і `[id]`, потрібно буде винести details routes у додатковий сегмент або замінити table filters на search params. Але в цьому пакеті залишено саме структуру з ТЗ.
