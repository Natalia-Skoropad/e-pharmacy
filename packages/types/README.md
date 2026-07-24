# `@e-pharmacy/types`

Private, type-focused source package for stable frontend domain primitives and API contracts.

## Public API

Application code must use explicit domain subpaths:

- `@e-pharmacy/types/api`
- `@e-pharmacy/types/primitives`
- `@e-pharmacy/types/auth`
- `@e-pharmacy/types/cart`
- `@e-pharmacy/types/orders`
- `@e-pharmacy/types/pharmacies`
- `@e-pharmacy/types/products`
- `@e-pharmacy/types/product-requests`
- `@e-pharmacy/types/reviews`
- `@e-pharmacy/types/notes`

The root entrypoint contains only basic API and primitive types. Application source must not import it directly; `scripts/check-types-public-api.mjs` enforces this rule.

## Package policy

- The package has no runtime exports and is not published independently.
- Browser-native types such as `File`, React props, page state, labels, defaults, guards, and normalizers belong to UI, validation, config, API-client, or application layers.
- Backend DTOs remain local to `apps/api`; parity is checked through independent fixtures and CI scripts.
- `build` emits declarations to `dist` for verification. Workspace consumers use the source entrypoints declared in `package.json`.

## Checks

```bash
pnpm --filter @e-pharmacy/types lint
pnpm --filter @e-pharmacy/types type-check
pnpm --filter @e-pharmacy/types test:types
pnpm --filter @e-pharmacy/types build
pnpm check:types-unused-exports
pnpm check:type-contracts
```
