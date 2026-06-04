# Duplicate audit after Stage 10

Scope: `apps/client` and `packages`, excluding `node_modules` and generated `dist` output.

## Fixed in this update

| Duplicate | Previous locations | Resolution |
|---|---|---|
| `normalizeSlugPart` implementation | `packages/utils/src/index.ts`, `packages/config/src/routes/slug-builder.ts` | Moved implementation to `packages/utils/src/slug/normalize-slug-part.ts`. Removed implementation from `index.ts`. Config routes now use the shared slug helper. |
| `buildSlugId` / `buildRouteSlugId` same work | `packages/utils/src/index.ts`, `packages/config/src/routes/slug-builder.ts` | Moved implementation to `packages/utils/src/slug/build-slug-id.ts`. `packages/config` imports `buildSlugId` from `@e-pharmacy/utils/slug`. |
| `formatInitials` duplicate implementations | `packages/utils/src/formatters/format-initials.ts`, `packages/ui/src/utils/formatInitials.ts` | Kept one implementation in `@e-pharmacy/utils/formatters`. `packages/ui` imports it from the shared package. |
| `cn` / class-name join helper duplicate | `packages/utils/src/classes/cn.ts`, `packages/ui/src/utils/classNames.ts` | Kept one implementation in `@e-pharmacy/utils/classes`. `packages/ui` imports it from the shared package. |
| `createApiUrl` duplicate name | `apps/client/src/lib/api/api-url.ts`, `apps/client/src/app/sitemap.ts` | Kept the shared client API URL helper in `apps/client/src/lib/api/api-url.ts`. `sitemap.ts` imports and reuses it. |
| `getSafeRedirectPath` duplicate implementation | `apps/client/proxy.ts`, `packages/config/src/routes/auth-routes.ts` | Kept the shared implementation in `@e-pharmacy/config/routes`. `proxy.ts` imports and reuses it. |
| `splitSetCookieHeader`, `getSetCookieHeaders`, `copySetCookieHeader` duplicate implementations | `apps/client/src/lib/api/auth-proxy.ts`, `apps/client/src/lib/api/proxy-response.ts` | Kept one implementation in `proxy-response.ts`. `auth-proxy.ts` imports `copySetCookieHeader`. |
| `buildCatalogHref`, `buildStoresHref`, `createResetFiltersHref` same helper names in different contexts | catalog/stores page and filter components | Renamed local helpers to context-specific names: `buildMedicinesFiltersHref`, `buildMedicinesPageHref`, `buildStoresFiltersHref`, `buildStoresPageHref`, `createMedicinesResetFiltersHref`, `createStoresResetFiltersHref`. |
| `createQueryString` / `buildQueryString` same work | `packages/api-client/src/index.ts`, `packages/utils/src/query/build-query-string.ts` | Removed the unused duplicate `createQueryString` implementation. The single query string helper remains in `@e-pharmacy/utils/query`. |
| Local listbox keyboard duplicate | `apps/client/src/lib/accessibility/listbox-keyboard.ts`, `packages/hooks/src/listbox-keyboard.ts` | The client copy is unused and should be deleted. The shared implementation stays in `@e-pharmacy/hooks`. |

## Remaining duplicate-like entries found

These are intentionally not all changed in this update because some are Next.js conventions or belong to later stages such as API client/domain cleanup.

### Framework-required names

These names repeat because Next.js requires exact exported names in route/special files. Do not rename them.

- `GET`, `POST`, `PATCH`, `DELETE` in `apps/client/src/app/api/**/route.ts`
- `generateMetadata` in several route `page.tsx` files

### Local/internal helper names to consider in later cleanup

| Duplicate | Locations | Recommendation |
|---|---|---|
| `fetchCart` | `apps/client/src/components/checkout/hooks/useCheckoutCart.ts`, `apps/client/src/components/cart/CartPageContent/CartPageContent.tsx` | Extract cart fetch/update logic during cart/API client cleanup. |
| `getRequestSignal` | `apps/client/src/lib/api/api-request.ts`, `apps/client/src/lib/api/local-api.ts` | Extract to one API request helper during API client migration. |
| `handleKeyDown` | `packages/hooks/src/useEscapeToClose.ts`, `packages/hooks/src/useFocusTrap.ts` | Local nested/event handler names only. Low risk, but can be renamed for clarity if desired. |
| `isValidObjectId` | `apps/client/src/lib/catalog/medicines-catalog.ts`, `packages/config/src/routes/slug-id.ts` | Use one shared helper from config or utils during catalog helpers cleanup. |
| `parsePage` | `apps/client/src/lib/catalog/medicines-catalog.ts`, `apps/client/src/lib/catalog/pharmacy-stores-catalog.ts` | Extract common catalog pagination parser. |
| `slugify` | `apps/client/src/lib/catalog/medicines-catalog.ts`, `apps/client/src/lib/catalog/pharmacy-stores-catalog.ts` | Replace with shared slug helper from `@e-pharmacy/utils/slug` or extract catalog-specific path helper. |

### Identical/similar work still present

| Duplicate work | Locations | Recommendation |
|---|---|---|
| Text sanitize helpers | `sanitizeNameParam`, `sanitizeArticleParam`, `sanitizeTextParam` | Extract common catalog sanitize helper. |
| Catalog search sanitizers | `sanitizeCatalogTextSearch`, `sanitizeCatalogArticleSearch` | Keep separate only if future rules differ; otherwise use one helper with a semantic alias. |
| City sorting | `sortCities`, `sortOfferCities` | Extract shared `sortAlphabetically` or `sortCityNames`. |
| Cart quantity update | product details and cart page content quantity helpers | Extract reusable cart quantity helper in cart domain cleanup. |
| Product query-string helpers | canonical and legacy product query helpers | Extract a shared product query helper when legacy route handling is cleaned up. |
| `buildProductPath` / `buildStorePath` body shape | `packages/config/src/routes/product-routes.ts`, `packages/config/src/routes/store-routes.ts` | Acceptable domain-specific wrappers, both use shared `buildSlugId`. |

## Rules confirmed for next stages

- Do not put function implementations in `index.ts`; keep index files as re-export-only public APIs.
- Before moving any helper/component into a package, search both `apps/client` and `packages` for same-name and same-work duplicates.
- If a helper already exists in `packages/config` or `packages/utils`, import and reuse it instead of reimplementing it.
