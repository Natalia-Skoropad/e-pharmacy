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

`@e-pharmacy/config/presentation` contains only domain-specific maps and typed resolvers:

- `ORDER_STATUS_PRESENTATION` / `getOrderStatusPresentation`;
- `PHARMACY_STATUS_PRESENTATION` / `getPharmacyStatusPresentation`;
- `PRODUCT_STATUS_PRESENTATION` / `getProductStatusPresentation`;
- `PRODUCT_REQUEST_STATUS_PRESENTATION` / `getProductRequestStatusPresentation`;
- `USER_STATUS_PRESENTATION` / `getUserStatusPresentation`.

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
