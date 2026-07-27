# @e-pharmacy/config

`@e-pharmacy/config` contains stable, shared frontend runtime values and explicit presentation mappings. It is intentionally small and side-effect-free.

## Public entrypoints

- `@e-pharmacy/config/auth`
- `@e-pharmacy/config/cart`
- `@e-pharmacy/config/orders`
- `@e-pharmacy/config/pharmacies`
- `@e-pharmacy/config/products`
- `@e-pharmacy/config/product-requests`
- `@e-pharmacy/config/users`
- `@e-pharmacy/config/notes`
- `@e-pharmacy/config/presentation`

The package has no root entrypoint. Consumers must use an explicit subpath.

## Ownership rules

Config may contain shared runtime domain values, safe cookie names, shared business limits, and domain-specific presentation maps. Presentation lookups must always accept a typed domain status; a global `status: string` resolver is forbidden.

Config must not contain React or Next.js APIs, navigation component types, application routes, application menus, runtime API-data transformations, feature statistics models, environment secrets, or speculative admin configuration.

Application-internal routes and navigation stay inside their application. UI contracts such as `BreadcrumbItem`, `NavigationItem`, and `StatusTone` belong to `@e-pharmacy/ui`.

Backend constants remain independent. Frontend/backend equality is enforced by contract checks rather than runtime imports.

The current presentation copy is English-only. Domain values are independent from labels so a future localization layer can replace labels without changing contracts.
