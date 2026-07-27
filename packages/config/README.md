# @e-pharmacy/config

`@e-pharmacy/config` contains stable, shared frontend runtime values and explicit domain presentation mappings. It is intentionally small, side-effect-free, and independent from React, Next.js, browser APIs, application state, and backend runtime code.

## Public entrypoints

Only explicit subpaths are public:

- `@e-pharmacy/config/auth`
- `@e-pharmacy/config/cart`
- `@e-pharmacy/config/orders`
- `@e-pharmacy/config/pharmacies`
- `@e-pharmacy/config/products`
- `@e-pharmacy/config/product-requests`
- `@e-pharmacy/config/users`
- `@e-pharmacy/config/notes`
- `@e-pharmacy/config/presentation`

The package has no root entrypoint. Consumers must not import:

- `@e-pharmacy/config`
- `@e-pharmacy/config/admin`
- `@e-pharmacy/config/pharmacy`
- `@e-pharmacy/config/navigation`
- `@e-pharmacy/config/status`
- `@e-pharmacy/config/clients`
- `@e-pharmacy/config/src/**`

`pnpm check:config-public-api` verifies the approved entrypoints, their target files, and the absence of root, deep, and removed subpath imports.

## Runtime domain values

Canonical frontend runtime sets live in domain entrypoints when they are shared by validation, filters, presentation, or contract checks:

- auth applications and user roles;
- user, pharmacy, product, product-request, and order statuses;
- delivery methods, payment methods, and order creator types;
- product categories;
- pharmacy note entity types.

Every array uses both:

1. `satisfies readonly DomainType[]` to reject values outside the domain type;
2. a type-level exact-set assertion to reject missing union members.

Frontend and backend remain deployment-independent. `check:type-contracts` compares their runtime sets, including app-local successful-order filters, without importing frontend config into the backend.

Feature-specific subsets remain app-local. For example, pharmacy own-product filters expose only `active` and `blocked`, while their values are checked against the canonical `PRODUCT_STATUSES` set.

Review moderation remains a type-level frontend/backend contract because no frontend runtime iteration currently consumes it. A runtime array should be introduced only together with a real filter, validator, or other runtime consumer.

## Route policy

Application-internal routes stay inside their application:

- client routes: `apps/client/src/lib/routes/**`;
- pharmacy routes: `apps/pharmacy/src/lib/routes/**`;
- admin routes: created only when a runnable admin application exists.

Dynamic pharmacy builders accept `EntityId`, trim and reject empty values, and encode the route segment. Static routes are read directly from `PHARMACY_ROUTES`; no no-op path wrappers are maintained.

Cross-application navigation uses environment-owned origins such as `NEXT_PUBLIC_CLIENT_APP_URL`, `NEXT_PUBLIC_PHARMACY_APP_URL`, `CLIENT_APP_URL`, `PHARMACY_APP_URL`, and `ADMIN_APP_URL`. Pathname constants must not be treated as external application URLs.

Route and navigation data used by application `lib/**` modules stays framework-neutral and app-local. UI components may accept the data through structural TypeScript compatibility without making the lower application layer depend on `@e-pharmacy/ui`.

## Presentation policy

`@e-pharmacy/config/presentation` contains only domain-specific typed maps:

- `ORDER_STATUS_PRESENTATION`;
- `PHARMACY_STATUS_PRESENTATION`;
- `PRODUCT_STATUS_PRESENTATION`;
- `PRODUCT_REQUEST_STATUS_PRESENTATION`;
- `USER_STATUS_PRESENTATION`.

Consumers use direct typed access such as `ORDER_STATUS_PRESENTATION[status]`. No redundant resolver aliases are exported.

There is no global registry and no resolver accepting `status: string`. Each map is exhaustive for its domain type and is the single source of its status label.

Presentation uses semantic tones only:

- `info`;
- `pending`;
- `success`;
- `warning`;
- `danger`;
- `neutral`.

The UI package decides how those tones map to colors. Config does not use color names such as `blue`, `yellow`, `red`, `gray`, or `beauty` as status semantics.

Known domain values do not have a gray fallback. Unknown raw API values must be rejected or handled explicitly at the API boundary rather than silently rendered as a normal status.

The current copy is English-only. Domain values are independent from labels so a future localization layer can replace labels with translation keys without changing runtime contracts.

## Ownership boundaries

Config may contain:

- shared runtime domain values;
- safe auth cookie names;
- shared business limits;
- explicit domain presentation mappings.

Config must not contain:

- React or Next.js APIs;
- component/navigation types owned by UI;
- application routes or menus;
- runtime API-data transformations;
- feature statistics models;
- environment secrets or deployment origins;
- speculative admin configuration.

Backend constants remain independent. Contract equality is enforced by CI checks, not backend imports from this package.

## Auth cookie contract

| Cookie | Owner | Browser visibility | Lifetime source | Backend parity |
| --- | --- | --- | --- | --- |
| Access token | Next.js BFF / backend auth contract | `httpOnly` | `accessTokenExpiresIn` | checked |
| Refresh token | Next.js BFF / backend auth contract | `httpOnly` | `refreshTokenExpiresIn` | checked |
| Legacy token | migration cleanup only | `httpOnly` | expired during cleanup | checked |
| Auth-ready hint | Next.js BFF | client-readable | `refreshTokenExpiresIn` | frontend-only |

The browser may read `AUTH_READY_COOKIE_NAME` during auth bootstrap, but it must not set, refresh, or clear that cookie. The fixed 30-day browser policy and the browser-owned hint storage were removed. The BFF writes and expires the hint together with the refresh-token lifetime, so cookie attributes and expiry have one owner.

## Product category policy

`PRODUCT_CATEGORY_LABELS` is the only public category-label API. A formatter that merely returned `PRODUCT_CATEGORY_LABELS[category]` is intentionally not exposed.

Building category options from API products is runtime feature work and stays in client/pharmacy product adapters. Config contains neither `Set` processing nor locale-dependent sorting. The caller supplies the locale used by the feature adapter.

Frontend and backend category labels are compared by `pnpm check:config-contracts`, not only their raw category values. A copy drift such as `Medical devices` versus `Medical equipment` therefore fails CI.

## Pharmacy client statistics and filters

`ClientStatisticsCounts`, statistics defaults, keys, and labels are owned by `apps/pharmacy/src/lib/statistics/**` because the pharmacy application composes that view model from several requests.

The successful-order endpoint filter is owned by:

```text
apps/pharmacy/src/lib/clients/client-filter-contracts.ts
```

The runtime values and the TypeScript type come from one array. `check:config-contracts` and `check:type-contracts` compare those app-local values with the backend Zod enum.

## Cart limit and error contract

`MAX_PHARMACY_GROUPS_PER_CART` limits unique pharmacies in the cart. Each pharmacy group creates one order during checkout. User-facing copy may explain orders, but it must not redefine the business rule.

The backend returns the stable code `CART_PHARMACY_LIMIT_EXCEEDED`. Client code detects that code from the API payload and never parses English text such as `15 orders` or `15 pharmacies`.

## Order presentation copy

`DELIVERY_METHOD_LABELS`, `PAYMENT_METHOD_LABELS`, and `ORDER_CREATED_BY_LABELS` are the canonical domain copy. The approved postal label is `Postal delivery`. Checkout and order-details components consume these maps instead of maintaining local strings.

## Package tooling

`@e-pharmacy/config` remains a source workspace package. Public exports point to `src/**`; `dist/**` is declaration-only verification output and is removed by `clean` before each package build.

Package commands:

```bash
pnpm --filter @e-pharmacy/config lint
pnpm --filter @e-pharmacy/config type-check
pnpm --filter @e-pharmacy/config test
pnpm --filter @e-pharmacy/config clean
pnpm --filter @e-pharmacy/config build
pnpm --filter @e-pharmacy/config check:public-api
pnpm --filter @e-pharmacy/config check:boundaries
pnpm --filter @e-pharmacy/config check:unused-exports
pnpm --filter @e-pharmacy/config check:contracts
```

Repository commands:

```bash
pnpm check:config-boundaries
pnpm check:config-public-api
pnpm check:config-unused-exports
pnpm check:config-contracts
```

All four repository checks run before lint, type-check, tests, and builds in `pnpm check:before-deploy`.

`check:config-contracts` parses TypeScript through the compiler AST for critical exported literals. This avoids coupling parity checks to quote style, line wrapping, or object formatting. The older broad type-contract check remains as an independent second layer while critical config contracts use the AST-based check.
