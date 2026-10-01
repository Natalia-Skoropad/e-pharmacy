
> e-pharmacy@0.1.0 check:before-deploy D:\Projects\сareer-skills\e-pharmacy
> pnpm check:client-catalog-components && pnpm check:client-catalog-contracts && pnpm check:client-catalog-performance && pnpm check:client-catalog-a11y && pnpm check:client-catalog-styles && pnpm check:client-detail-components && pnpm check:client-components-boundaries && pnpm check:client-components-public-api && pnpm check:client-components-a11y && pnpm check:client-components-styles && pnpm check:client-admin-header && pnpm check:client-content-contracts && pnpm check:client-lib-boundaries && pnpm check:client-lib-public-api && pnpm check:client-lib-unused-exports && pnpm check:client-lib-routes && pnpm check:client-lib-contracts && pnpm check:client-hooks && pnpm check:client-providers && pnpm check:pharmacy-lib && pnpm check:pharmacy-providers && pnpm check:pharmacy-account-components && pnpm check:pharmacy-layout && pnpm check:pharmacy-product-components && pnpm check:pharmacy-client-components && pnpm check:pharmacy-order-components && pnpm check:pharmacy-analytics-components && pnpm check:client-routes && pnpm check:client-user-state && pnpm check:client-cart && pnpm check:client-checkout && pnpm check:client-noop-wrappers && pnpm check:auth-boundaries && pnpm check:auth-public-api && pnpm check:auth-lifecycle && pnpm check:auth-contracts && pnpm check:profile-contracts && pnpm check:api-boundaries && pnpm check:api-client-boundaries && pnpm check:api-client-public-api && pnpm check:api-client-unused-exports && pnpm check:api-client-contracts && pnpm check:api-client-routes && pnpm check:hooks-boundaries && pnpm check:hooks-public-api && pnpm check:hooks-lifecycle && pnpm check:next-api-boundaries && pnpm check:next-api-routes && pnpm check:next-api-contracts && pnpm check:config-boundaries && pnpm check:config-public-api && pnpm check:config-unused-exports && pnpm check:config-contracts && pnpm check:validation-contracts && pnpm check:type-contracts && pnpm check:dynamic-product-categories && pnpm check:ui-boundaries && pnpm check:ui-styles && pnpm check:shared-cabinet-ui && pnpm check:admin-app-shell && pnpm check:admin-providers && pnpm check:admin-status-pages && pnpm check:admin-auth-foundation && pnpm check:admin-protected-route && pnpm check:admin-auth-ui && pnpm check:admin-shell && pnpm check:admin-permissions && pnpm check:admin-profile && pnpm check:admin-audit && pnpm check:admin-settings-backend && pnpm check:admin-settings-ui && pnpm check:admin-settings-dictionaries && pnpm lint && pnpm type-check && pnpm test && pnpm test:react && pnpm test:integration && pnpm build && pnpm check:deploy-artifact


> e-pharmacy@0.1.0 check:client-catalog-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-catalog-components.mjs

Client catalog component check passed (foundation, ownership, server boundaries, size budgets and public APIs).

> e-pharmacy@0.1.0 check:client-catalog-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-catalog-contracts.mjs

Client catalog contract check passed (summary DTOs, resource states, filters, offers, bank details and review totals).

> e-pharmacy@0.1.0 check:client-catalog-performance D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-catalog-performance.mjs

Client catalog performance check passed (product 562 B, pharmacy 361 B).

> e-pharmacy@0.1.0 check:client-catalog-a11y D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-catalog-a11y.mjs

Client catalog accessibility check passed (cards, lists, filters, details, offers, email actions and tabs).

> e-pharmacy@0.1.0 check:client-catalog-styles D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-catalog-styles.mjs

Client catalog style check passed (26 CSS modules; exact and near-duplicate analysis complete).

> e-pharmacy@0.1.0 check:client-detail-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-detail-components.mjs

Client detail component check passed (splits, SSR ownership, offers, cart, bank details, content, reviews and runtime invariants).

> e-pharmacy@0.1.0 check:client-components-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-components-boundaries.mjs

Client component boundary check passed.

> e-pharmacy@0.1.0 check:client-components-public-api D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-components-public-api.mjs

Client component public API check passed.

> e-pharmacy@0.1.0 check:client-components-a11y D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-components-a11y.mjs

Client component accessibility contract check passed.

> e-pharmacy@0.1.0 check:client-components-styles D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-components-styles.mjs

Client component style check passed (39 CSS modules scanned).

> e-pharmacy@0.1.0 check:client-admin-header D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-admin-header.mjs

Client admin-header compatibility contracts passed through Stage 10.4.

> e-pharmacy@0.1.0 check:client-content-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-content-contracts.mjs

Client content contract check passed (4 documents checked).

> e-pharmacy@0.1.0 check:client-lib-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-lib-boundaries.mjs

Client-lib boundary check passed (106 lib modules scanned).

> e-pharmacy@0.1.0 check:client-lib-public-api D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-lib-public-api.mjs

Client-lib public API check passed (106 lib modules, explicit environment entrypoints).

> e-pharmacy@0.1.0 check:client-lib-unused-exports D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-lib-unused-exports.mjs

Client-lib unused-export check passed (14 dead candidates absent, 3 symbols internal).

> e-pharmacy@0.1.0 check:client-lib-routes D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-lib-routes.mjs

Client-lib route/SEO parity check passed (application routes, proxy/BFF parity, sitemap and robots classifications).

> e-pharmacy@0.1.0 check:client-lib-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-lib-contracts.mjs

Client-lib contract check passed (request semantics, environment, cache, server data, atomic cart-group removal, cart ownership and sitemap policy).

> e-pharmacy@0.1.0 check:client-hooks D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-hooks.mjs

Client hooks check passed (9 hook modules, identity-scoped mutations, one favorite collection owner, behavioral companions present).

> e-pharmacy@0.1.0 check:client-providers D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-providers.mjs

Client providers check passed (16 provider modules, enforced Auth → Favorites → Cart ownership order, session-scoped state, no event loop).

> e-pharmacy@0.1.0 check:pharmacy-lib D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-lib.mjs

Pharmacy-lib check passed (81 lib modules, 8 browser API adapters scanned).

> e-pharmacy@0.1.0 check:pharmacy-providers D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-providers.mjs

Pharmacy provider check passed (Auth → protected pharmacy profile summary ownership, same-origin browser APIs, no token/private persistence).

> e-pharmacy@0.1.0 check:pharmacy-account-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-account-components.mjs

Pharmacy account component check passed (10 source files scanned).

> e-pharmacy@0.1.0 check:pharmacy-layout D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-layout.mjs

Pharmacy-layout check passed (27 layout source/style files scanned).

> e-pharmacy@0.1.0 check:pharmacy-product-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-product-components.mjs

Pharmacy product-component check passed (30 feature source files scanned).

> e-pharmacy@0.1.0 check:pharmacy-client-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-client-components.mjs

Pharmacy client-component check passed (11 feature source files scanned).

> e-pharmacy@0.1.0 check:pharmacy-order-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-order-components.mjs

Pharmacy order-component check passed (22 feature source files scanned).

> e-pharmacy@0.1.0 check:pharmacy-analytics-components D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/pharmacy/check-pharmacy-analytics-components.mjs

Pharmacy analytics-component check passed (19 feature source files scanned; request fan-out and role guards verified).

> e-pharmacy@0.1.0 check:client-routes D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-routes.mjs

Client route-access check passed (5 private pages, 3 guest-preferred routes, reset-password token policy).

> e-pharmacy@0.1.0 check:client-user-state D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-user-state.mjs

Client user-state check passed (keyed session boundary, one favorite collection owner, scoped reviews, serialized cart controller).

> e-pharmacy@0.1.0 check:client-cart D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-cart.mjs

Client cart check passed (state machine, serialized mutations, atomic pharmacy-group delete, abortable API writes, no event/wrapper layer).

> e-pharmacy@0.1.0 check:client-checkout D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-checkout.mjs

Client checkout check passed (reviewed snapshot comparison, revision/fingerprint contract, abortable locked submit, same-origin BFF).

> e-pharmacy@0.1.0 check:client-noop-wrappers D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/client/check-client-noop-wrappers.mjs

Client no-op wrapper check passed (351 client source files scanned).

> e-pharmacy@0.1.0 check:auth-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/auth/check-auth-boundaries.mjs

Auth boundary check passed (37 auth source files scanned).

> e-pharmacy@0.1.0 check:auth-public-api D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/auth/check-auth-public-api.mjs

Auth public API check passed (1610 source files scanned).

> e-pharmacy@0.1.0 check:auth-lifecycle D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/auth/check-auth-lifecycle.mjs

Auth lifecycle check passed (630 application source files scanned).

> e-pharmacy@0.1.0 check:auth-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/auth/check-auth-contracts.mjs

Auth contract parity check passed.

> e-pharmacy@0.1.0 check:profile-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/profile/check-profile-contracts.mjs

Profile contract check passed (strict parsing, revision conflicts, atomic moderation, explicit membership capabilities, missing-profile semantics, and server-backed verification documents).

> e-pharmacy@0.1.0 check:api-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/boundaries/check-api-package-boundaries.mjs

Backend boundary check passed (287 source files scanned).

> e-pharmacy@0.1.0 check:api-client-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/api-client/check-api-client-boundaries.mjs

API-client boundary check passed (30 package source files scanned).

> e-pharmacy@0.1.0 check:api-client-public-api D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/api-client/check-api-client-public-api.mjs

API-client public API check passed (1696 repository source files scanned, 3 approved entrypoints).

> e-pharmacy@0.1.0 check:api-client-unused-exports D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/api-client/check-api-client-unused-exports.mjs

API-client unused-export check passed (18 internal/dead candidates guarded).

> e-pharmacy@0.1.0 check:api-client-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/api-client/check-api-client-contracts.mjs

API-client contract check passed (transport, bodies, JSON, envelopes, endpoint DTOs, pagination, query and build policy).

> e-pharmacy@0.1.0 check:api-client-routes D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/api-client/check-api-client-routes.mjs

Next API structural route check passed (75 routes, 91 handlers, backend method/path parity verified, 1 backend access contract and 2 BFF access comparisons verified).
API-client route check passed (75 BFF handler files, 13 shared auth contracts and 0 hidden browser routes).

> e-pharmacy@0.1.0 check:hooks-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/boundaries/check-hooks-boundaries.mjs

Hooks boundary check passed (8 hook source files scanned).

> e-pharmacy@0.1.0 check:hooks-public-api D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/hooks/check-hooks-public-api.mjs

Hooks public API check passed (6 DOM consumers, 7 timing consumers).

> e-pharmacy@0.1.0 check:hooks-lifecycle D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/hooks/check-hooks-lifecycle-contracts.mjs

Hooks lifecycle contract check passed.
{
  "client": {
    "useEffect": 23,
    "setTimeout": 2,
    "clearTimeout": 2,
    "requestAnimationFrame": 0,
    "cancelAnimationFrame": 0,
    "addEventListener": 4,
    "removeEventListener": 3
  },
  "pharmacy": {
    "useEffect": 58,
    "setTimeout": 2,
    "clearTimeout": 2,
    "requestAnimationFrame": 0,
    "cancelAnimationFrame": 0,
    "addEventListener": 8,
    "removeEventListener": 6
  },
  "ui": {
    "useEffect": 22,
    "setTimeout": 4,
    "clearTimeout": 5,
    "requestAnimationFrame": 4,
    "cancelAnimationFrame": 3,
    "addEventListener": 10,
    "removeEventListener": 11
  },
  "auth": {
    "useEffect": 5,
    "setTimeout": 1,
    "clearTimeout": 1,
    "requestAnimationFrame": 0,
    "cancelAnimationFrame": 0,
    "addEventListener": 3,
    "removeEventListener": 2
  },
  "hooks": {
    "useEffect": 5,
    "setTimeout": 2,
    "clearTimeout": 2,
    "requestAnimationFrame": 0,
    "cancelAnimationFrame": 0,
    "addEventListener": 1,
    "removeEventListener": 1
  }
}

> e-pharmacy@0.1.0 check:next-api-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/boundaries/check-next-api-boundaries.mjs

Next API boundary check passed (1697 source files scanned).

> e-pharmacy@0.1.0 check:next-api-routes D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/routes/check-next-api-routes.mjs

Next API structural route check passed (75 routes, 91 handlers, backend method/path parity verified, 1 backend access contract and 2 BFF access comparisons verified).

> e-pharmacy@0.1.0 check:next-api-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/contracts/check-next-api-contracts.mjs

Next API contract parity check passed (headers, cookies, production secret, errors).

> e-pharmacy@0.1.0 check:config-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/config/check-config-boundaries.mjs

Config boundary check passed (34 config source files scanned).

> e-pharmacy@0.1.0 check:config-public-api D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/config/check-config-public-api.mjs

Config public API check passed (1696 source files scanned, 9 approved entrypoints).

> e-pharmacy@0.1.0 check:config-unused-exports D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/config/check-config-unused-exports.mjs

Config unused-export check passed (53 public exports, 2 intentional contracts).

> e-pharmacy@0.1.0 check:config-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/config/check-config-contracts.mjs

Config contract check passed (runtime values, dynamic category consumers, status presentation, cart error code, app-local filters/statistics, canonical order copy, notes, and auth-hint ownership).

> e-pharmacy@0.1.0 check:validation-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/contracts/check-validation-contract-parity.mjs

Validation contract parity check passed (70 mirrored cases).

> e-pharmacy@0.1.0 check:type-contracts D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/types/check-types-public-api.mjs && node scripts/checks/types/check-types-unused-exports.mjs && node scripts/checks/contracts/check-type-contract-parity.mjs

Types public API check passed (1696 source files scanned, 13 approved entrypoints).
Types unused-export check passed (1605 consumer source files scanned, 42 intentional public contracts).
Type contract parity check passed (runtime value sets, filters, cart limit, contract shapes, and date examples).

> e-pharmacy@0.1.0 check:dynamic-product-categories D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/product-categories/check-dynamic-product-categories.mjs

Dynamic product-category structural checks passed.

> e-pharmacy@0.1.0 check:ui-boundaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/boundaries/check-ui-boundaries.mjs

UI boundary check passed (1605 source files scanned).

> e-pharmacy@0.1.0 check:ui-styles D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/ui/check-ui-style-contracts.mjs

UI style contract check passed (139 CSS files scanned).

> e-pharmacy@0.1.0 check:shared-cabinet-ui D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/ui/check-shared-cabinet-ui.mjs

Shared cabinet UI check passed (fullscreen, dropdown and one-level nested navigation contracts).

> e-pharmacy@0.1.0 check:admin-app-shell D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-app-shell.mjs

Admin app shell check passed.

> e-pharmacy@0.1.0 check:admin-providers D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-providers.mjs

Admin providers check passed (shared Toast/Auth providers, always-bootstrap session boundary).

> e-pharmacy@0.1.0 check:admin-status-pages D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-status-pages.mjs

Admin status-pages check passed.

> e-pharmacy@0.1.0 check:admin-auth-foundation D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-auth-foundation.mjs

Admin auth foundation structural check passed.

> e-pharmacy@0.1.0 check:admin-protected-route D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-protected-route.mjs

Admin protected-route and Stage 10.2 auth UI structural check passed.

> e-pharmacy@0.1.0 check:admin-auth-ui D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-auth-ui.mjs

Admin Stage 10 auth UI structural checks passed.

> e-pharmacy@0.1.0 check:admin-shell D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-shell.mjs

Admin Stage 7 shell structural check passed.

> e-pharmacy@0.1.0 check:admin-permissions D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-permissions.mjs

Admin Stage 8 permissions and Platform Owner structural check passed.

> e-pharmacy@0.1.0 check:admin-profile D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-profile.mjs

Admin Stage 10 profile structural checks passed.

> e-pharmacy@0.1.0 check:admin-audit D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-audit.mjs

Admin audit structural checks passed.

> e-pharmacy@0.1.0 check:admin-settings-backend D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-settings-backend.mjs

Admin Settings CRUD backend structural checks passed.

> e-pharmacy@0.1.0 check:admin-settings-ui D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-settings-ui.mjs

Admin Settings CRUD pages structural checks passed.

> e-pharmacy@0.1.0 check:admin-settings-dictionaries D:\Projects\сareer-skills\e-pharmacy
> node scripts/checks/admin/check-admin-settings-dictionaries.mjs

Admin Settings dictionary hardening checks passed.

> e-pharmacy@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy
> turbo lint

• turbo 2.9.8

   • Packages in scope: @e-pharmacy/admin, @e-pharmacy/api, @e-pharmacy/api-client, @e-pharmacy/auth, @e-pharmacy/client, @e-pharmacy/config, @e-pharmacy/hooks, @e-pharmacy/next-api, @e-pharmacy/pharmacy, @e-pharmacy/types, @e-pharmacy/ui, @e-pharmacy/utils, @e-pharmacy/validation
   • Running lint in 13 packages
   • Remote caching disabled

@e-pharmacy/types:lint: cache hit, replaying logs 4fec8dc31eafa27d
@e-pharmacy/types:lint: 
@e-pharmacy/types:lint: > @e-pharmacy/types@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/types:lint: > eslint src type-tests --ext .ts
@e-pharmacy/types:lint: 
@e-pharmacy/utils:lint: cache hit, replaying logs e6b882fc86e9ae33
@e-pharmacy/utils:lint: 
@e-pharmacy/utils:lint: > @e-pharmacy/utils@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\utils
@e-pharmacy/utils:lint: > eslint src --ext .ts
@e-pharmacy/utils:lint: 
@e-pharmacy/hooks:lint: cache hit, replaying logs 1e72788670eb03f0
@e-pharmacy/hooks:lint: 
@e-pharmacy/hooks:lint: > @e-pharmacy/hooks@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\hooks
@e-pharmacy/hooks:lint: > eslint src --ext .ts,.tsx
@e-pharmacy/hooks:lint: 
@e-pharmacy/api:lint: cache hit, replaying logs c61ad05b443a4449
@e-pharmacy/api:lint: 
@e-pharmacy/api:lint: > @e-pharmacy/api@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\apps\api
@e-pharmacy/api:lint: > node ../../scripts/checks/boundaries/check-api-package-boundaries.mjs && eslint src --ext .ts
@e-pharmacy/api:lint: 
@e-pharmacy/api:lint: Backend boundary check passed (287 source files scanned).
@e-pharmacy/config:lint: cache hit, replaying logs 8b34e5a7b3f45be1
@e-pharmacy/config:lint: 
@e-pharmacy/config:lint: > @e-pharmacy/config@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\config
@e-pharmacy/config:lint: > eslint src test --ext .ts
@e-pharmacy/config:lint: 
@e-pharmacy/api-client:lint: cache hit, replaying logs 04953f6d9c5028a2
@e-pharmacy/api-client:lint: 
@e-pharmacy/api-client:lint: > @e-pharmacy/api-client@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:lint: > eslint src --ext .ts
@e-pharmacy/api-client:lint: 
@e-pharmacy/auth:lint: cache hit, replaying logs d4d97c5fa4ea5d0c
@e-pharmacy/auth:lint: 
@e-pharmacy/auth:lint: > @e-pharmacy/auth@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\auth
@e-pharmacy/auth:lint: > eslint src --ext .ts,.tsx
@e-pharmacy/auth:lint: 
@e-pharmacy/validation:lint: cache hit, replaying logs c7b5c203a8c3caff
@e-pharmacy/validation:lint: 
@e-pharmacy/validation:lint: > @e-pharmacy/validation@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\validation
@e-pharmacy/validation:lint: > eslint src --ext .ts
@e-pharmacy/validation:lint: 
@e-pharmacy/next-api:lint: cache hit, replaying logs 3db502f80666a21f
@e-pharmacy/next-api:lint: 
@e-pharmacy/next-api:lint: > @e-pharmacy/next-api@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\next-api
@e-pharmacy/next-api:lint: > eslint src test --ext .ts
@e-pharmacy/next-api:lint: 
@e-pharmacy/ui:lint: cache hit, replaying logs 6ec968fae4dc1395
@e-pharmacy/ui:lint: 
@e-pharmacy/ui:lint: > @e-pharmacy/ui@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\packages\ui
@e-pharmacy/ui:lint: > eslint src --ext .ts,.tsx
@e-pharmacy/ui:lint: 
@e-pharmacy/admin:lint: cache hit, replaying logs 4d7638866d2d56b8
@e-pharmacy/admin:lint: 
@e-pharmacy/admin:lint: > @e-pharmacy/admin@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\apps\admin
@e-pharmacy/admin:lint: > eslint .
@e-pharmacy/admin:lint: 
@e-pharmacy/client:lint: cache miss, executing 8466bb6b2a8f9271
@e-pharmacy/pharmacy:lint: cache miss, executing 763729d484c540b2
@e-pharmacy/pharmacy:lint: 
@e-pharmacy/pharmacy:lint: > @e-pharmacy/pharmacy@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\apps\pharmacy
@e-pharmacy/pharmacy:lint: > eslint .
@e-pharmacy/pharmacy:lint: 
@e-pharmacy/client:lint: 
@e-pharmacy/client:lint: > @e-pharmacy/client@0.1.0 lint D:\Projects\сareer-skills\e-pharmacy\apps\client
@e-pharmacy/client:lint: > eslint .
@e-pharmacy/client:lint: 

 Tasks:    13 successful, 13 total
Cached:    11 cached, 13 total
  Time:    50.351s 


> e-pharmacy@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy
> turbo type-check

• turbo 2.9.8

   • Packages in scope: @e-pharmacy/admin, @e-pharmacy/api, @e-pharmacy/api-client, @e-pharmacy/auth, @e-pharmacy/client, @e-pharmacy/config, @e-pharmacy/hooks, @e-pharmacy/next-api, @e-pharmacy/pharmacy, @e-pharmacy/types, @e-pharmacy/ui, @e-pharmacy/utils, @e-pharmacy/validation
   • Running type-check in 13 packages
   • Remote caching disabled

@e-pharmacy/types:type-check: cache hit, replaying logs 2335bde1c1adc26f
@e-pharmacy/types:type-check: 
@e-pharmacy/types:type-check: > @e-pharmacy/types@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/types:type-check: > tsc -p tsconfig.json --noEmit && tsc -p tsconfig.type-tests.json --noEmit
@e-pharmacy/types:type-check: 
@e-pharmacy/utils:type-check: cache hit, replaying logs 33e5c05a18191267
@e-pharmacy/utils:type-check: 
@e-pharmacy/utils:type-check: > @e-pharmacy/utils@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\utils
@e-pharmacy/utils:type-check: > tsc --noEmit
@e-pharmacy/utils:type-check: 
@e-pharmacy/api:type-check: cache hit, replaying logs 3e6cec369b390608
@e-pharmacy/api:type-check: 
@e-pharmacy/api:type-check: > @e-pharmacy/api@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\apps\api
@e-pharmacy/api:type-check: > tsc --noEmit
@e-pharmacy/api:type-check: 
@e-pharmacy/hooks:type-check: cache hit, replaying logs 7b76d1ca63842670
@e-pharmacy/hooks:type-check: 
@e-pharmacy/hooks:type-check: > @e-pharmacy/hooks@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\hooks
@e-pharmacy/hooks:type-check: > tsc --noEmit
@e-pharmacy/hooks:type-check: 
@e-pharmacy/config:type-check: cache hit, replaying logs 15fdcc784c4d80a5
@e-pharmacy/config:type-check: 
@e-pharmacy/config:type-check: > @e-pharmacy/config@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\config
@e-pharmacy/config:type-check: > tsc -p tsconfig.json --noEmit && tsc -p test/tsconfig.json --noEmit
@e-pharmacy/config:type-check: 
@e-pharmacy/api-client:type-check: cache hit, replaying logs 267ebd75888418a5
@e-pharmacy/api-client:type-check: 
@e-pharmacy/api-client:type-check: > @e-pharmacy/api-client@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:type-check: > tsc --noEmit
@e-pharmacy/api-client:type-check: 
@e-pharmacy/validation:type-check: cache hit, replaying logs 8f0d1feee7111070
@e-pharmacy/auth:type-check: cache hit, replaying logs b7753ca763dab0e6
@e-pharmacy/validation:type-check: 
@e-pharmacy/validation:type-check: > @e-pharmacy/validation@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\validation
@e-pharmacy/validation:type-check: > tsc --noEmit
@e-pharmacy/validation:type-check: 
@e-pharmacy/auth:type-check: 
@e-pharmacy/auth:type-check: > @e-pharmacy/auth@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\auth
@e-pharmacy/auth:type-check: > tsc --noEmit
@e-pharmacy/auth:type-check: 
@e-pharmacy/next-api:type-check: cache hit, replaying logs 03789e1ed15f2078
@e-pharmacy/next-api:type-check: 
@e-pharmacy/next-api:type-check: > @e-pharmacy/next-api@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\next-api
@e-pharmacy/next-api:type-check: > tsc --noEmit
@e-pharmacy/next-api:type-check: 
@e-pharmacy/ui:type-check: cache hit, replaying logs aafdfb5ea6cf1431
@e-pharmacy/ui:type-check: 
@e-pharmacy/ui:type-check: > @e-pharmacy/ui@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\ui
@e-pharmacy/ui:type-check: > tsc --noEmit
@e-pharmacy/ui:type-check: 
@e-pharmacy/admin:type-check: cache hit, replaying logs 0b5505c7b508416d
@e-pharmacy/admin:type-check: 
@e-pharmacy/admin:type-check: > @e-pharmacy/admin@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\apps\admin
@e-pharmacy/admin:type-check: > node -e "require('node:fs').rmSync('.next', { recursive: true, force: true })" && next typegen && tsc --noEmit
@e-pharmacy/admin:type-check: 
@e-pharmacy/admin:type-check: Generating route types...
@e-pharmacy/admin:type-check: ✓ Types generated successfully
@e-pharmacy/pharmacy:type-check: cache miss, executing 45d011c3ddb61e63
@e-pharmacy/client:type-check: cache miss, executing a3704236d23fc275
@e-pharmacy/pharmacy:type-check: 
@e-pharmacy/pharmacy:type-check: > @e-pharmacy/pharmacy@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\apps\pharmacy
@e-pharmacy/pharmacy:type-check: > next typegen && tsc --noEmit
@e-pharmacy/pharmacy:type-check: 
@e-pharmacy/client:type-check: 
@e-pharmacy/client:type-check: > @e-pharmacy/client@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\apps\client
@e-pharmacy/client:type-check: > node -e "require('node:fs').rmSync('.next', { recursive: true, force: true })" && next typegen && tsc --noEmit
@e-pharmacy/client:type-check: 
@e-pharmacy/pharmacy:type-check: Generating route types...
@e-pharmacy/pharmacy:type-check: ✓ Types generated successfully
@e-pharmacy/client:type-check: Generating route types...
@e-pharmacy/client:type-check: ✓ Types generated successfully

 Tasks:    13 successful, 13 total
Cached:    11 cached, 13 total
  Time:    31.772s 


> e-pharmacy@0.1.0 test D:\Projects\сareer-skills\e-pharmacy
> turbo test

• turbo 2.9.8

   • Packages in scope: @e-pharmacy/admin, @e-pharmacy/api, @e-pharmacy/api-client, @e-pharmacy/auth, @e-pharmacy/client, @e-pharmacy/config, @e-pharmacy/hooks, @e-pharmacy/next-api, @e-pharmacy/pharmacy, @e-pharmacy/types, @e-pharmacy/ui, @e-pharmacy/utils, @e-pharmacy/validation
   • Running test in 13 packages
   • Remote caching disabled

@e-pharmacy/types:type-check: cache hit, replaying logs 2335bde1c1adc26f
@e-pharmacy/types:type-check: 
@e-pharmacy/types:type-check: > @e-pharmacy/types@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/types:type-check: > tsc -p tsconfig.json --noEmit && tsc -p tsconfig.type-tests.json --noEmit
@e-pharmacy/types:type-check: 
@e-pharmacy/utils:type-check: cache hit, replaying logs 33e5c05a18191267
@e-pharmacy/utils:type-check: 
@e-pharmacy/utils:type-check: > @e-pharmacy/utils@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\utils
@e-pharmacy/utils:type-check: > tsc --noEmit
@e-pharmacy/utils:type-check: 
@e-pharmacy/hooks:type-check: cache hit, replaying logs 7b76d1ca63842670
@e-pharmacy/hooks:type-check: 
@e-pharmacy/hooks:type-check: > @e-pharmacy/hooks@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\hooks
@e-pharmacy/hooks:type-check: > tsc --noEmit
@e-pharmacy/hooks:type-check: 
@e-pharmacy/utils:test: cache hit, replaying logs 8735c888c65c7944
@e-pharmacy/api:test: cache miss, executing 7b8ca1af7e21d630
@e-pharmacy/hooks:test: cache hit, replaying logs f1fbb701fbf405d3
@e-pharmacy/types:test: cache miss, executing 43eea37fea65a06b
@e-pharmacy/config:type-check: cache hit, replaying logs 15fdcc784c4d80a5
@e-pharmacy/config:type-check: 
@e-pharmacy/config:type-check: > @e-pharmacy/config@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\config
@e-pharmacy/config:type-check: > tsc -p tsconfig.json --noEmit && tsc -p test/tsconfig.json --noEmit
@e-pharmacy/config:type-check: 
@e-pharmacy/api-client:type-check: cache hit, replaying logs 267ebd75888418a5
@e-pharmacy/api-client:type-check: 
@e-pharmacy/api-client:type-check: > @e-pharmacy/api-client@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:type-check: > tsc --noEmit
@e-pharmacy/api-client:type-check: 
@e-pharmacy/api-client:test: cache miss, executing b4ae91e1ed0b594f
@e-pharmacy/config:test: cache miss, executing 24921b22859a35b6
@e-pharmacy/utils:test: 
@e-pharmacy/utils:test: > @e-pharmacy/utils@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\utils
@e-pharmacy/utils:test: > node ../../scripts/test-runners/run-tsx-tests.mjs src
@e-pharmacy/utils:test: 
@e-pharmacy/utils:test: TAP version 13
@e-pharmacy/utils:test: # Subtest: counts boolean conditions
@e-pharmacy/utils:test: ok 1 - counts boolean conditions
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 2.426437
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: creates sorted unique labeled options
@e-pharmacy/utils:test: ok 2 - creates sorted unique labeled options
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 189.844582
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: uses an explicit English locale and Kyiv business timezone
@e-pharmacy/utils:test: ok 3 - uses an explicit English locale and Kyiv business timezone
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 28.659968
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: keeps calendar dates independent from instant timezones
@e-pharmacy/utils:test: ok 4 - keeps calendar dates independent from instant timezones
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 1.260523
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: rejects environment-dependent offset-less date-times
@e-pharmacy/utils:test: ok 5 - rejects environment-dependent offset-less date-times
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 1.167305
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: returns null instead of throwing for invalid or empty dates
@e-pharmacy/utils:test: ok 6 - returns null instead of throwing for invalid or empty dates
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 1.61577
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: returns reusable table date parts
@e-pharmacy/utils:test: ok 7 - returns reusable table date parts
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 2.897626
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: recognizes DOM and transport abort errors
@e-pharmacy/utils:test: ok 8 - recognizes DOM and transport abort errors
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 3.588177
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: accepts dictionary-like records only
@e-pharmacy/utils:test: ok 9 - accepts dictionary-like records only
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 4.096931
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: formats finite amounts and money using the English UI locale
@e-pharmacy/utils:test: ok 10 - formats finite amounts and money using the English UI locale
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 68.250962
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: rejects non-finite money values
@e-pharmacy/utils:test: ok 11 - rejects non-finite money values
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 0.397914
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: calculates and formats numeric ranges without UI fallback text
@e-pharmacy/utils:test: ok 12 - calculates and formats numeric ranges without UI fallback text
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 3.173568
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: normalizes finite numbers without accepting numeric strings
@e-pharmacy/utils:test: ok 13 - normalizes finite numbers without accepting numeric strings
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 3.08406
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: rejects invalid counts
@e-pharmacy/utils:test: ok 14 - rejects invalid counts
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 0.566262
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: formats valid count labels
@e-pharmacy/utils:test: ok 15 - formats valid count labels
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 0.500406
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: returns a trimmed non-empty string
@e-pharmacy/utils:test: ok 16 - returns a trimmed non-empty string
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 2.667133
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: # Subtest: capitalizes only the first character
@e-pharmacy/utils:test: ok 17 - capitalizes only the first character
@e-pharmacy/utils:test:   ---
@e-pharmacy/utils:test:   duration_ms: 0.455421
@e-pharmacy/utils:test:   type: 'test'
@e-pharmacy/utils:test:   ...
@e-pharmacy/utils:test: 1..17
@e-pharmacy/utils:test: # tests 17
@e-pharmacy/utils:test: # suites 0
@e-pharmacy/utils:test: # pass 17
@e-pharmacy/utils:test: # fail 0
@e-pharmacy/utils:test: # cancelled 0
@e-pharmacy/utils:test: # skipped 0
@e-pharmacy/utils:test: # todo 0
@e-pharmacy/utils:test: # duration_ms 32220.667103
@e-pharmacy/validation:type-check: cache hit, replaying logs 8f0d1feee7111070
@e-pharmacy/next-api:type-check: cache hit, replaying logs 03789e1ed15f2078
@e-pharmacy/next-api:type-check: 
@e-pharmacy/validation:type-check: 
@e-pharmacy/next-api:type-check: > @e-pharmacy/next-api@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\next-api
@e-pharmacy/validation:type-check: > @e-pharmacy/validation@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\validation
@e-pharmacy/next-api:type-check: > tsc --noEmit
@e-pharmacy/validation:type-check: > tsc --noEmit
@e-pharmacy/next-api:type-check: 
@e-pharmacy/validation:type-check: 
@e-pharmacy/validation:test: cache miss, executing f247e92d5a114b58
@e-pharmacy/next-api:test: cache miss, executing 388ed9034b9ad29f
@e-pharmacy/ui:test: cache miss, executing 94c7244fc7541525
@e-pharmacy/auth:type-check: cache hit, replaying logs b7753ca763dab0e6
@e-pharmacy/auth:type-check: 
@e-pharmacy/auth:type-check: > @e-pharmacy/auth@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\auth
@e-pharmacy/auth:type-check: > tsc --noEmit
@e-pharmacy/auth:type-check: 
@e-pharmacy/ui:type-check: cache hit, replaying logs aafdfb5ea6cf1431
@e-pharmacy/ui:type-check: 
@e-pharmacy/ui:type-check: > @e-pharmacy/ui@0.1.0 type-check D:\Projects\сareer-skills\e-pharmacy\packages\ui
@e-pharmacy/ui:type-check: > tsc --noEmit
@e-pharmacy/ui:type-check: 
@e-pharmacy/auth:test: cache miss, executing e64af6fa8684af28
@e-pharmacy/admin:test: cache miss, executing ad121925c27ddf93
@e-pharmacy/hooks:test: 
@e-pharmacy/hooks:test: > @e-pharmacy/hooks@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\hooks
@e-pharmacy/hooks:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs src
@e-pharmacy/hooks:test: 
@e-pharmacy/hooks:test: TAP version 13
@e-pharmacy/hooks:test: # Subtest: notifies only when the pointer path is outside allowed and ignored targets
@e-pharmacy/hooks:test: ok 1 - notifies only when the pointer path is outside allowed and ignored targets
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 89.57407
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: uses the latest refs and callback without resubscribing
@e-pharmacy/hooks:test: ok 2 - uses the latest refs and callback without resubscribing
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 1.188175
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: unsubscribe and SSR no-op cleanup are idempotent
@e-pharmacy/hooks:test: ok 3 - unsubscribe and SSR no-op cleanup are idempotent
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 18.592008
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: multiple subscriptions remain isolated during Strict Mode-style cleanup
@e-pharmacy/hooks:test: ok 4 - multiple subscriptions remain isolated during Strict Mode-style cleanup
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 2.256697
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: commits the latest scheduled value after the delay
@e-pharmacy/hooks:test: ok 5 - commits the latest scheduled value after the delay
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 36.201756
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: cleanup cancels stale values and supports delay changes
@e-pharmacy/hooks:test: ok 6 - cleanup cancels stale values and supports delay changes
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 0.915943
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: Strict Mode-style setup, cleanup, and setup does not duplicate commits
@e-pharmacy/hooks:test: ok 7 - Strict Mode-style setup, cleanup, and setup does not duplicate commits
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 0.554204
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: # Subtest: rejects invalid delays before scheduling a timer
@e-pharmacy/hooks:test: ok 8 - rejects invalid delays before scheduling a timer
@e-pharmacy/hooks:test:   ---
@e-pharmacy/hooks:test:   duration_ms: 1.770203
@e-pharmacy/hooks:test:   type: 'test'
@e-pharmacy/hooks:test:   ...
@e-pharmacy/hooks:test: 1..8
@e-pharmacy/hooks:test: # tests 8
@e-pharmacy/hooks:test: # suites 0
@e-pharmacy/hooks:test: # pass 8
@e-pharmacy/hooks:test: # fail 0
@e-pharmacy/hooks:test: # cancelled 0
@e-pharmacy/hooks:test: # skipped 0
@e-pharmacy/hooks:test: # todo 0
@e-pharmacy/hooks:test: # duration_ms 12108.920166
@e-pharmacy/pharmacy:test: cache miss, executing 6861cad18f68cf5f
@e-pharmacy/validation:test: 
@e-pharmacy/validation:test: > @e-pharmacy/validation@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\validation
@e-pharmacy/validation:test: > node ../../scripts/test-runners/run-tsx-tests.mjs src
@e-pharmacy/validation:test: 
@e-pharmacy/next-api:test: 
@e-pharmacy/next-api:test: > @e-pharmacy/next-api@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\next-api
@e-pharmacy/next-api:test: > node ../../scripts/test-runners/run-tsx-tests.mjs src && node ../../scripts/test-runners/run-tsx-tests.mjs test
@e-pharmacy/next-api:test: 
@e-pharmacy/api:test: 
@e-pharmacy/types:test: 
@e-pharmacy/api:test: > @e-pharmacy/api@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\apps\api
@e-pharmacy/types:test: > @e-pharmacy/types@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/api:test: > node ../../scripts/test-runners/run-api-tests.mjs src
@e-pharmacy/types:test: > pnpm run test:types
@e-pharmacy/api:test: 
@e-pharmacy/types:test: 
@e-pharmacy/ui:test: 
@e-pharmacy/ui:test: > @e-pharmacy/ui@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\ui
@e-pharmacy/ui:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs src
@e-pharmacy/ui:test: 
@e-pharmacy/auth:test: 
@e-pharmacy/auth:test: > @e-pharmacy/auth@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\auth
@e-pharmacy/auth:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs src
@e-pharmacy/auth:test: 
@e-pharmacy/config:test: 
@e-pharmacy/config:test: > @e-pharmacy/config@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\config
@e-pharmacy/config:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs test
@e-pharmacy/config:test: 
@e-pharmacy/admin:test: 
@e-pharmacy/admin:test: > @e-pharmacy/admin@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\apps\admin
@e-pharmacy/admin:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.test.ts --allow-empty
@e-pharmacy/admin:test: 
@e-pharmacy/api-client:test: 
@e-pharmacy/api-client:test: > @e-pharmacy/api-client@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:test: > pnpm run test:unit && pnpm run test:integration
@e-pharmacy/api-client:test: 
@e-pharmacy/pharmacy:test: 
@e-pharmacy/pharmacy:test: > @e-pharmacy/pharmacy@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\apps\pharmacy
@e-pharmacy/pharmacy:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.test.ts
@e-pharmacy/pharmacy:test: 
@e-pharmacy/config:test: TAP version 13
@e-pharmacy/ui:test: TAP version 13
@e-pharmacy/auth:test: TAP version 13
@e-pharmacy/admin:test: TAP version 13
@e-pharmacy/next-api:test: TAP version 13
@e-pharmacy/validation:test: TAP version 13
@e-pharmacy/pharmacy:test: TAP version 13
@e-pharmacy/types:test: 
@e-pharmacy/types:test: > @e-pharmacy/types@0.1.0 test:types D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/types:test: > tsc -p tsconfig.type-tests.json --noEmit
@e-pharmacy/types:test: 
@e-pharmacy/api-client:test: 
@e-pharmacy/api-client:test: > @e-pharmacy/api-client@0.1.0 test:unit D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:test: > node ../../scripts/test-runners/run-tsx-tests.mjs src
@e-pharmacy/api-client:test: 
@e-pharmacy/api:test: TAP version 13
@e-pharmacy/next-api:test: # Subtest: accepts same-origin /api paths
@e-pharmacy/next-api:test: ok 1 - accepts same-origin /api paths
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 3.037213
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects external and protocol-relative URLs
@e-pharmacy/next-api:test: ok 2 - rejects external and protocol-relative URLs
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.126954
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects non-api same-origin paths
@e-pharmacy/next-api:test: ok 3 - rejects non-api same-origin paths
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.45171
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/ui:test: # Subtest: modal foundation requires a real accessible name
@e-pharmacy/ui:test: ok 1 - modal foundation requires a real accessible name
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 335.045563
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/api:test: # Subtest: ordinary JSON uses a small global parser while document payloads opt into the large parser
@e-pharmacy/api:test: ok 1 - ordinary JSON uses a small global parser while document payloads opt into the large parser
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.082545
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/ui:test: # Subtest: working hours are exposed as a labelled field group
@e-pharmacy/ui:test: ok 2 - working hours are exposed as a labelled field group
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 120.09537
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: data table preserves consumer order and alignment classes are truthful
@e-pharmacy/ui:test: ok 3 - data table preserves consumer order and alignment classes are truthful
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 125.591941
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/auth:test: # Subtest: timeout aborts the concrete attempt and a late result stays obsolete
@e-pharmacy/auth:test: ok 1 - timeout aborts the concrete attempt and a late result stays obsolete
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 18.668959
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/ui:test: # Subtest: overlay foundation coordinates stacked dialogs through one UI-owned manager
@e-pharmacy/ui:test: ok 4 - overlay foundation coordinates stacked dialogs through one UI-owned manager
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 114.052479
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: date filter uses business calendar dates and synchronizes draft state
@e-pharmacy/ui:test: ok 5 - date filter uses business calendar dates and synchronizes draft state
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 139.992385
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/admin:test: # Subtest: activity history uses one employee search across identity and contact fields
@e-pharmacy/admin:test: ok 1 - activity history uses one employee search across identity and contact fields
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 270.92971
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: activity date filter is bounded by the first audit log and the shared calendar handles today as the upper bound
@e-pharmacy/admin:test: ok 2 - activity date filter is bounded by the first audit log and the shared calendar handles today as the upper bound
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 7.435584
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: activity count label is centered on mobile
@e-pharmacy/admin:test: ok 3 - activity count label is centered on mobile
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 3.816807
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/api:test: # Subtest: derives trusted origins from client, pharmacy and admin application URLs
@e-pharmacy/api:test: ok 2 - derives trusted origins from client, pharmacy and admin application URLs
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 144.862871
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: rejects unsafe trusted-origin configuration at startup
@e-pharmacy/api:test: ok 3 - rejects unsafe trusted-origin configuration at startup
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.593505
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: CORS and mutation-origin middleware use the same trusted-origin set
@e-pharmacy/api:test: ok 4 - CORS and mutation-origin middleware use the same trusted-origin set
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 15.36508
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/ui:test: # Subtest: select foundations expose safe option ids and complete navigation keys
@e-pharmacy/ui:test: ok 6 - select foundations expose safe option ids and complete navigation keys
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 599.406934
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/config:test: # Subtest: keeps auth cookie names unique and browser lifetime-free
@e-pharmacy/config:test: ok 1 - keeps auth cookie names unique and browser lifetime-free
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 2.575301
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: keeps the category fallback limited to the non-domain all option
@e-pharmacy/config:test: ok 2 - keeps the category fallback limited to the non-domain all option
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 2.58504
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: uses canonical delivery and payment copy
@e-pharmacy/config:test: ok 3 - uses canonical delivery and payment copy
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 0.367768
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: keeps the cart pharmacy-group limit contract explicit
@e-pharmacy/config:test: ok 4 - keeps the cart pharmacy-group limit contract explicit
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 0.353391
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/ui:test: # Subtest: document upload delegates file rules to validation and exposes a labelled input
@e-pharmacy/ui:test: ok 7 - document upload delegates file rules to validation and exposes a labelled input
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 100.928787
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/auth:test: # Subtest: identical double submit shares one interactive server operation
@e-pharmacy/auth:test: ok 2 - identical double submit shares one interactive server operation
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 7.488917
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: different interactive payload supersedes rather than deduplicates
@e-pharmacy/auth:test: ok 3 - different interactive payload supersedes rather than deduplicates
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.359767
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: login and register flights are independent
@e-pharmacy/auth:test: ok 4 - login and register flights are independent
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.739245
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/ui:test: # Subtest: status pages have one image API and truthful image semantics
@e-pharmacy/ui:test: ok 8 - status pages have one image API and truthful image semantics
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 275.856775
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: sales chart provides keyboard navigation, values, summary, and a data table
@e-pharmacy/ui:test: ok 9 - sales chart provides keyboard navigation, values, summary, and a data table
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 3.765328
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: public UI folders contain implementations rather than legacy forwarding barrels
@e-pharmacy/ui:test: ok 10 - public UI folders contain implementations rather than legacy forwarding barrels
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 14.310473
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: icon controls share one accessible IconButton primitive
@e-pharmacy/ui:test: ok 11 - icon controls share one accessible IconButton primitive
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 86.684633
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/admin:test: # Subtest: admin logout is single-flight and always navigates to login
@e-pharmacy/admin:test: ok 4 - admin logout is single-flight and always navigates to login
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 78.919775
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin logout redirects even when the remote logout request fails
@e-pharmacy/admin:test: ok 5 - admin logout redirects even when the remote logout request fails
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.838955
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/config:test: # Subtest: keeps canonical runtime value sets free of duplicates and empty values
@e-pharmacy/config:test: ok 5 - keeps canonical runtime value sets free of duplicates and empty values
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 3.523241
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: keeps the expected product and order runtime contracts
@e-pharmacy/config:test: ok 6 - keeps the expected product and order runtime contracts
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 12.262012
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: order status transitions expose the canonical pharmacy state machine
@e-pharmacy/config:test: ok 7 - order status transitions expose the canonical pharmacy state machine
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 4.71095
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"b2e756e4-b445-4c0d-ae03-a4ea4b5449e9","method":"GET","path":"/api/example","destination":"bff","durationMs":15,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"3539c426-8240-4d8e-9384-cf458bddb015","method":"GET","path":"/api/example","destination":"bff","durationMs":1,"status":204,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"INVALID_RESPONSE","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"8386ce0d-6964-473e-8823-6215b46fae68","method":"GET","path":"/api/example","destination":"bff","durationMs":5,"status":204,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"ed135206-0cbe-4aaa-b7c7-004c22c149a8","method":"GET","path":"/api/private-defaults","destination":"bff","durationMs":2,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"ae1e052d-4eb7-4b35-bddd-cb00ca3b07f5","method":"GET","path":"/api/example","destination":"bff","durationMs":4,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"INVALID_RESPONSE","source":"browser-api"}
@e-pharmacy/auth:test: # Subtest: current-user bootstrap is single-flight and receives a cancellable signal
@e-pharmacy/auth:test: ok 5 - current-user bootstrap is single-flight and receives a cancellable signal
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 24.058401
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: advancing the auth lifecycle aborts stale work and permits a fresh bootstrap
@e-pharmacy/auth:test: ok 6 - advancing the auth lifecycle aborts stale work and permits a fresh bootstrap
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.433969
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: bootstrap timeout cancels the active attempt and ignores its late response
@e-pharmacy/auth:test: ok 7 - bootstrap timeout cancels the active attempt and ignores its late response
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 127.975242
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"2c526cbf-15a0-4bdd-afd1-3faacaf35ab7","method":"GET","path":"/api/example","destination":"bff","durationMs":1,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"INVALID_RESPONSE","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"e435af54-65bd-4d57-b4bb-359ea0b8f9c7","method":"GET","path":"/api/problem-json","destination":"bff","durationMs":1,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # Subtest: returns JSON and requires an explicit empty-response contract for 204
@e-pharmacy/next-api:test: ok 4 - returns JSON and requires an explicit empty-response contract for 204
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 295.921212
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: uses the fixed private browser-to-BFF transport policy by default
@e-pharmacy/ui:test: # Subtest: component names and physical placement describe their actual responsibility
@e-pharmacy/next-api:test: ok 5 - uses the fixed private browser-to-BFF transport policy by default
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 2.847996
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/ui:test: ok 12 - component names and physical placement describe their actual responsibility
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 245.047312
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects invalid JSON and HTML success responses
@e-pharmacy/next-api:test: ok 6 - rejects invalid JSON and HTML success responses
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 9.646827
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: supports structured +json responses through the shared parser
@e-pharmacy/next-api:test: ok 7 - supports structured +json responses through the shared parser
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 2.417156
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"fe38e06e-b23c-472d-95e5-2eb7488a60e7","method":"GET","path":"/api/timeout","destination":"bff","durationMs":108,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"TIMEOUT","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"14d52467-ea78-4e42-b898-f4ebf59542a4","method":"GET","path":"/api/combined-timeout","destination":"bff","durationMs":10,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"TIMEOUT","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"53496785-5bd7-45b7-94c0-b05390470b13","method":"GET","path":"/api/abort","destination":"bff","durationMs":2,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"ABORTED","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"e14a028b-b157-4636-b5d0-877121c0fe4b","method":"GET","path":"/api/retry-status","destination":"bff","durationMs":4,"status":200,"retryCount":1,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"999d8c49-2c15-4377-99d2-7888ffd7bbfb","method":"GET","path":"/api/retry-network","destination":"bff","durationMs":2,"status":200,"retryCount":1,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"42ad2c89-0372-481f-a8d0-855eccb31a65","method":"POST","path":"/api/mutation","destination":"bff","durationMs":1,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","transportErrorCode":"NETWORK_ERROR","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"a82aad05-3ee4-4b85-9d28-806180578b32","method":"GET","path":"/api/no-default-retry","destination":"bff","durationMs":4,"status":503,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/api:test: # Subtest: legacy Stage 10.6 document actions normalize to the canonical audit contract
@e-pharmacy/api:test: ok 5 - legacy Stage 10.6 document actions normalize to the canonical audit contract
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 9.891696
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"82fd2b96-2550-47e1-b42a-59cb59c9d591","method":"GET","path":"/api/document","destination":"bff","durationMs":65,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"40986e3b-0b86-4388-9fe1-1e1200f7f0ff","method":"GET","path":"/api/correlated","destination":"bff","durationMs":11,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/next-api:test: # Subtest: classifies timeout and caller abort separately
@e-pharmacy/next-api:test: ok 8 - classifies timeout and caller abort separately
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 123.381625
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: retries GET status and network failures but never retries mutations
@e-pharmacy/next-api:test: ok 9 - retries GET status and network failures but never retries mutations
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 8.163699
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: does not retry browser → BFF GET requests unless a caller explicitly opts in
@e-pharmacy/next-api:test: ok 10 - does not retry browser → BFF GET requests unless a caller explicitly opts in
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 4.132632
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: supports binary same-origin responses without JSON parsing
@e-pharmacy/next-api:test: ok 11 - supports binary same-origin responses without JSON parsing
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 66.834457
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: adds a W3C traceparent for browser to BFF correlation
@e-pharmacy/next-api:test: ok 12 - adds a W3C traceparent for browser to BFF correlation
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 11.824216
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/ui:test: # Subtest: cabinet sidebar supports accessible nested groups in expanded and collapsed modes
@e-pharmacy/ui:test: ok 13 - cabinet sidebar supports accessible nested groups in expanded and collapsed modes
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 301.418247
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: tablet and desktop top bar keep the current breadcrumb rendered
@e-pharmacy/ui:test: ok 14 - tablet and desktop top bar keep the current breadcrumb rendered
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 140.114356
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/next-api:test: # Subtest: production API base URL configuration fails closed
@e-pharmacy/next-api:test: ok 13 - production API base URL configuration fails closed
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 8.163699
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: local production-build validation can explicitly allow loopback HTTP only
@e-pharmacy/next-api:test: ok 14 - local production-build validation can explicitly allow loopback HTTP only
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 11.75094
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: development API base URL falls back to localhost when omitted
@e-pharmacy/next-api:test: ok 15 - development API base URL falls back to localhost when omitted
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.452637
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: node environment resolution is shared by config and runtime callers
@e-pharmacy/next-api:test: ok 16 - node environment resolution is shared by config and runtime callers
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.809274
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/admin:test: # Subtest: admin private comments reuse shared comment presentation and pagination UI
@e-pharmacy/admin:test: ok 6 - admin private comments reuse shared comment presentation and pagination UI
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 184.698641
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin private comment count preloads while the tab body stays lazy
@e-pharmacy/admin:test: ok 7 - admin private comment count preloads while the tab body stays lazy
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 9.588856
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin private comment BFF routes proxy only canonical self endpoints
@e-pharmacy/admin:test: ok 8 - admin private comment BFF routes proxy only canonical self endpoints
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 5.599529
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin private comment deletion treats the canonical 204 response as no content
@e-pharmacy/admin:test: ok 9 - admin private comment deletion treats the canonical 204 response as no content
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 4.633037
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client products load only on first activation for the current request generation
@e-pharmacy/pharmacy:test: ok 1 - client products load only on first activation for the current request generation
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 68.567556
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client products reload when filters, pagination, or retry create a new request generation
@e-pharmacy/pharmacy:test: ok 2 - client products reload when filters, pagination, or retry create a new request generation
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.475825
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: clients list uses one canonical request for rows and statistics without a Walk-in lookup
@e-pharmacy/pharmacy:test: ok 3 - clients list uses one canonical request for rows and statistics without a Walk-in lookup
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 177.919289
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client details keep the primary request independent and lazily activate products and comments
@e-pharmacy/pharmacy:test: ok 4 - client details keep the primary request independent and lazily activate products and comments
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 70.104946
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: clientId is a generation boundary that remounts all client-detail local resource state
@e-pharmacy/pharmacy:test: ok 5 - clientId is a generation boundary that remounts all client-detail local resource state
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 83.055653
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: deleted purchased products are rendered as history without a broken Product Details link
@e-pharmacy/pharmacy:test: ok 6 - deleted purchased products are rendered as history without a broken Product Details link
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 99.00137
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: clients list debounces PII search requests while route-owned filters resync from navigation
@e-pharmacy/pharmacy:test: ok 7 - clients list debounces PII search requests while route-owned filters resync from navigation
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 109.728312
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client resources keep unavailable state separate from successful empty data and map errors safely
@e-pharmacy/pharmacy:test: ok 8 - client resources keep unavailable state separate from successful empty data and map errors safely
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 105.538172
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client detail pagination accepts canonical backend pages and order statistics follow each successful filtered response
@e-pharmacy/pharmacy:test: ok 9 - client detail pagination accepts canonical backend pages and order statistics follow each successful filtered response
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 127.45675
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client component barrels do not re-export canonical domain types
@e-pharmacy/pharmacy:test: ok 10 - client component barrels do not re-export canonical domain types
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 149.536719
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client route pages fail closed for malformed entity ids before rendering detail content
@e-pharmacy/pharmacy:test: ok 11 - client route pages fail closed for malformed entity ids before rendering detail content
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 137.444446
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client detail text searches debounce network work and reset pagination by debounced generation
@e-pharmacy/pharmacy:test: ok 12 - client detail text searches debounce network work and reset pagination by debounced generation
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 34.745459
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client resources expose explicit local retry controls without clearing last-known-good state
@e-pharmacy/pharmacy:test: ok 13 - client resources expose explicit local retry controls without clearing last-known-good state
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 8.615872
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api-client:test: TAP version 13
@e-pharmacy/pharmacy:test: # Subtest: dashboard unavailable resources expose explicit retry generations
@e-pharmacy/pharmacy:test: ok 14 - dashboard unavailable resources expose explicit retry generations
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 260.540391
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # Subtest: admin permission registry uses stable resource.action values
@e-pharmacy/api:test: ok 6 - admin permission registry uses stable resource.action values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.413792
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin permissions fail closed for unknown values
@e-pharmacy/api:test: ok 7 - admin permissions fail closed for unknown values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.643128
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin permissions normalize duplicates deterministically
@e-pharmacy/api:test: ok 8 - admin permissions normalize duplicates deterministically
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.348983
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: operational pharmacy status contract is active plus on_moderation only
@e-pharmacy/api:test: ok 9 - operational pharmacy status contract is active plus on_moderation only
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.369036
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test: # Subtest: owns shared same-origin auth BFF routes in next-api
@e-pharmacy/next-api:test: ok 17 - owns shared same-origin auth BFF routes in next-api
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 2.881851
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test: # Subtest: token-bearing auth endpoints require the trusted BFF before rate limiting and validation
@e-pharmacy/api:test: ok 10 - token-bearing auth endpoints require the trusted BFF before rate limiting and validation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 13.252155
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: a browser-supplied marker alone cannot satisfy the BFF trust check
@e-pharmacy/api:test: ok 11 - a browser-supplied marker alone cannot satisfy the BFF trust check
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 8.266655
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test: # Subtest: uses backend expiry metadata for access, refresh, and hint cookies
@e-pharmacy/next-api:test: ok 18 - uses backend expiry metadata for access, refresh, and hint cookies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 187.652376
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: clears host-only, current-domain, and legacy-domain variants
@e-pharmacy/next-api:test: ok 19 - clears host-only, current-domain, and legacy-domain variants
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 7.949902
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: reads only structured auth codes from JSON response bodies
@e-pharmacy/next-api:test: ok 20 - reads only structured auth codes from JSON response bodies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 4.659472
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: invalidates cookies only for stable session lifecycle codes
@e-pharmacy/next-api:test: ok 21 - invalidates cookies only for stable session lifecycle codes
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.585274
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: refreshes only stable session-invalid 401 responses
@e-pharmacy/next-api:test: ok 22 - refreshes only stable session-invalid 401 responses
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 389.33743
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: evaluates backend responses by code rather than HTTP status alone
@e-pharmacy/next-api:test: ok 23 - evaluates backend responses by code rather than HTTP status alone
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 3.296923
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test: cache miss, executing dfa8e9f7fdfec513
@e-pharmacy/ui:test: # Subtest: fullscreen button synchronizes with the browser event and cleans up its listener
@e-pharmacy/ui:test: ok 15 - fullscreen button synchronizes with the browser event and cleans up its listener
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 181.773196
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/auth:test: # Subtest: package exposes only explicit React, Next, errors, routing, and reset-password entrypoints
@e-pharmacy/auth:test: ok 8 - package exposes only explicit React, Next, errors, routing, and reset-password entrypoints
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 7.185149
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: errors entrypoint exposes its stable runtime helper
@e-pharmacy/auth:test: ok 9 - errors entrypoint exposes its stable runtime helper
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.549564
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: routing entrypoint exposes only safe redirect helpers
@e-pharmacy/auth:test: ok 10 - routing entrypoint exposes only safe redirect helpers
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.478145
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: reset-password entrypoint exposes only token lifecycle helpers
@e-pharmacy/auth:test: ok 11 - reset-password entrypoint exposes only token lifecycle helpers
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.655303
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/admin:test: # Subtest: admin profile exposes the complete Stage 10.7 self-service tabs
@e-pharmacy/admin:test: ok 10 - admin profile exposes the complete Stage 10.7 self-service tabs
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 439.223968
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/ui:test: # Subtest: fullscreen availability requires enter and exit APIs
@e-pharmacy/ui:test: ok 16 - fullscreen availability requires enter and exit APIs
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 2.992691
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: fullscreen toggle enters and exits based on the current document state
@e-pharmacy/ui:test: ok 17 - fullscreen toggle enters and exits based on the current document state
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.815767
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: fullscreen toggle fails closed for unsupported and rejected APIs
@e-pharmacy/ui:test: ok 18 - fullscreen toggle fails closed for unsupported and rejected APIs
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.674317
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/admin:test: # Subtest: password change uses the existing auth lifecycle and returns to login
@e-pharmacy/admin:test: ok 11 - password change uses the existing auth lifecycle and returns to login
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 130.494427
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: active sessions load lazily and keep load errors distinct from an empty list
@e-pharmacy/admin:test: ok 12 - active sessions load lazily and keep load errors distinct from an empty list
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 3.736111
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: session mutations are single-flight and refresh the list after revoke
@e-pharmacy/admin:test: ok 13 - session mutations are single-flight and refresh the list after revoke
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 148.14449
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin auth BFF routes proxy canonical password and session endpoints safely
@e-pharmacy/admin:test: ok 14 - admin auth BFF routes proxy canonical password and session endpoints safely
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 5.301326
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/api:test: # ◇ injected env (19) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
@e-pharmacy/api:test: # Subtest: rejects direct auth-session requests before downstream middleware
@e-pharmacy/api:test: ok 12 - rejects direct auth-session requests before downstream middleware
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 185.92948
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: allows only the marker plus the configured BFF secret
@e-pharmacy/api:test: ok 13 - allows only the marker plus the configured BFF secret
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.708173
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/admin:test: # Subtest: admin AuthProvider exposes logoutAll through the shared auth core
@e-pharmacy/admin:test: ok 15 - admin AuthProvider exposes logoutAll through the shared auth core
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 6.477904
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/auth:test: # Subtest: single-flight is scoped to one manager lifecycle
@e-pharmacy/auth:test: ok 12 - single-flight is scoped to one manager lifecycle
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 3.495416
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: advancing lifecycle aborts an obsolete bootstrap and creates a fresh retry
@e-pharmacy/auth:test: ok 13 - advancing lifecycle aborts an obsolete bootstrap and creates a fresh retry
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.202549
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: a newer logout lifecycle makes an older login response obsolete
@e-pharmacy/auth:test: ok 14 - a newer logout lifecycle makes an older login response obsolete
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.835709
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: a newer login lifecycle is not cleared by an older logout completion
@e-pharmacy/auth:test: ok 15 - a newer login lifecycle is not cleared by an older logout completion
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.786086
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: provider instances with identical service functions stay independent
@e-pharmacy/auth:test: ok 16 - provider instances with identical service functions stay independent
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.126955
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: creates only valid discriminated auth states
@e-pharmacy/auth:test: ok 17 - creates only valid discriminated auth states
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 6.201962
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: password changes and resets always produce unauthenticated state
@e-pharmacy/auth:test: ok 18 - password changes and resets always produce unauthenticated state
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.670144
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/ui:test: # Subtest: user dropdown owns the shared disclosure, outside-click and Escape lifecycle
@e-pharmacy/ui:test: ok 19 - user dropdown owns the shared disclosure, outside-click and Escape lifecycle
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 282.308709
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/config:test: # Subtest: pharmacy profile transition matrix is explicit for every status
@e-pharmacy/config:test: ok 8 - pharmacy profile transition matrix is explicit for every status
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 5.114891
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/admin:test: # Subtest: audit list parser accepts the canonical paginated contract
@e-pharmacy/admin:test: ok 16 - audit list parser accepts the canonical paginated contract
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 3.850197
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: audit list parser accepts canonical Stage 10 profile and document actions
@e-pharmacy/admin:test: ok 17 - audit list parser accepts canonical Stage 10 profile and document actions
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 3.226431
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: audit parsers fail closed for unknown actions and unsafe snapshot values
@e-pharmacy/admin:test: ok 18 - audit parsers fail closed for unknown actions and unsafe snapshot values
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 2.464924
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: audit list parser validates earliest audit date metadata
@e-pharmacy/admin:test: ok 19 - audit list parser validates earliest audit date metadata
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.689622
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: audit actor parser keeps only current employee presentation fields
@e-pharmacy/admin:test: ok 20 - audit actor parser keeps only current employee presentation fields
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.914549
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: audit list parser renders product-category and position dictionary events
@e-pharmacy/admin:test: ok 21 - audit list parser renders product-category and position dictionary events
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.632115
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/api:test: # Subtest: current access cookies are attempted before the legacy migration fallback
@e-pharmacy/api:test: ok 14 - current access cookies are attempted before the legacy migration fallback
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.565327
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: successful legacy-cookie fallback emits token-free sunset telemetry
@e-pharmacy/api:test: ok 15 - successful legacy-cookie fallback emits token-free sunset telemetry
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.382027
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/config:test: # Subtest: keeps colliding in_progress statuses domain-specific
@e-pharmacy/config:test: ok 9 - keeps colliding in_progress statuses domain-specific
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 4.580631
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: keeps each domain presentation exhaustive at runtime
@e-pharmacy/config:test: ok 10 - keeps each domain presentation exhaustive at runtime
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 0.856115
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: uses only semantic tones and non-empty labels
@e-pharmacy/config:test: ok 11 - uses only semantic tones and non-empty labels
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 0.825506
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: keeps shared raw values owned by their domain maps
@e-pharmacy/config:test: ok 12 - keeps shared raw values owned by their domain maps
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 0.388174
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: # Subtest: does not expose a global string-only resolver
@e-pharmacy/config:test: ok 13 - does not expose a global string-only resolver
@e-pharmacy/config:test:   ---
@e-pharmacy/config:test:   duration_ms: 0.325565
@e-pharmacy/config:test:   type: 'test'
@e-pharmacy/config:test:   ...
@e-pharmacy/config:test: 1..13
@e-pharmacy/config:test: # tests 13
@e-pharmacy/config:test: # suites 0
@e-pharmacy/config:test: # pass 13
@e-pharmacy/config:test: # fail 0
@e-pharmacy/config:test: # cancelled 0
@e-pharmacy/config:test: # skipped 0
@e-pharmacy/config:test: # todo 0
@e-pharmacy/config:test: # duration_ms 30108.266052
@e-pharmacy/admin:test: # Subtest: only an active admin can access private admin routes
@e-pharmacy/admin:test: ok 22 - only an active admin can access private admin routes
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 2.483939
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/next-api:test: # Subtest: logout forwards refresh identity and always clears browser cookies
@e-pharmacy/next-api:test: ok 24 - logout forwards refresh identity and always clears browser cookies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 10.538652
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: logout-all also uses refresh identity and clears local cookies without a live access token
@e-pharmacy/next-api:test: ok 25 - logout-all also uses refresh identity and clears local cookies without a live access token
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 10.403695
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: header keeps mobile and desktop account controls mutually available
@e-pharmacy/pharmacy:test: ok 15 - header keeps mobile and desktop account controls mutually available
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 146.865419
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: shared account popover owns disclosure semantics and Escape focus restoration
@e-pharmacy/pharmacy:test: ok 16 - shared account popover owns disclosure semantics and Escape focus restoration
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 9.669552
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test: # Subtest: extracts valid tokens, expiry metadata, and removes them from the browser body
@e-pharmacy/next-api:test: ok 26 - extracts valid tokens, expiry metadata, and removes them from the browser body
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 5.590717
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects missing, malformed, and unsafe token lifetime objects
@e-pharmacy/next-api:test: ok 27 - rejects missing, malformed, and unsafe token lifetime objects
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.809275
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: mobile menu closes through explicit navigation actions and pathname lifecycle
@e-pharmacy/pharmacy:test: ok 17 - mobile menu closes through explicit navigation actions and pathname lifecycle
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 76.038851
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: mobile menu styling does not depend on generated SideMenu internals
@e-pharmacy/pharmacy:test: ok 18 - mobile menu styling does not depend on generated SideMenu internals
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.832686
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pathname navigation and browser Back/Forward close an open mobile menu
@e-pharmacy/pharmacy:test: ok 19 - pathname navigation and browser Back/Forward close an open mobile menu
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.360923
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: same-path navigation does not rely on the pathname effect to close the menu
@e-pharmacy/pharmacy:test: ok 20 - same-path navigation does not rely on the pathname effect to close the menu
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.418782
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # ◇ injected env (19) from .env // tip: ◈ encrypted .env [www.dotenvx.com]
@e-pharmacy/client:test: 
@e-pharmacy/client:test: > @e-pharmacy/client@0.1.0 test D:\Projects\сareer-skills\e-pharmacy\apps\client
@e-pharmacy/client:test: > node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.test.ts
@e-pharmacy/auth:test: # Subtest: uses stable backend business codes before mutable copy or status
@e-pharmacy/admin:test: # Subtest: uses development defaults for client and pharmacy destinations
@e-pharmacy/next-api:test: # Subtest: forwards query parameters for every supported HTTP method and disables redirects
@e-pharmacy/client:test: 
@e-pharmacy/ui:test: # Subtest: flat navigation preserves exact and descendant route matching
@e-pharmacy/pharmacy:test: # Subtest: server snapshot is always expanded and valid stored booleans hydrate the client snapshot
@e-pharmacy/api:test: # Subtest: optional auth stays anonymous when no access token candidate exists
@e-pharmacy/api:test: ok 16 - optional auth stays anonymous when no access token candidate exists
@e-pharmacy/api:test:   ---
@e-pharmacy/auth:test: ok 19 - uses stable backend business codes before mutable copy or status
@e-pharmacy/client:test: TAP version 13
@e-pharmacy/client:test: # Subtest: private, auth and token routes stay out of the static sitemap and remain robots-disallowed
@e-pharmacy/client:test: ok 1 - private, auth and token routes stay out of the static sitemap and remain robots-disallowed
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test: ok 23 - uses development defaults for client and pharmacy destinations
@e-pharmacy/api:test:   duration_ms: 8519.951972
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: optional auth surfaces an invalid presented access token as AUTH_SESSION_INVALID
@e-pharmacy/api:test: ok 17 - optional auth surfaces an invalid presented access token as AUTH_SESSION_INVALID
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.316054
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: normalizes the account dimension independently from client IP
@e-pharmacy/client:test:   duration_ms: 2.71304
@e-pharmacy/api:test: ok 18 - normalizes the account dimension independently from client IP
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/auth:test:   ---
@e-pharmacy/admin:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test: # Subtest: product SEO canonical keeps indexed dimensions and removes noindex noise
@e-pharmacy/auth:test:   duration_ms: 3.027475
@e-pharmacy/api:test:   duration_ms: 2.918488
@e-pharmacy/client:test: ok 2 - product SEO canonical keeps indexed dimensions and removes noindex noise
@e-pharmacy/admin:test:   duration_ms: 3.274199
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   duration_ms: 0.749912
@e-pharmacy/admin:test:   ...
@e-pharmacy/auth:test: # Subtest: classifies stable transport codes and infrastructure status fallbacks
@e-pharmacy/api:test: # Subtest: hashes reset secrets before they become rate-limit keys
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/admin:test: # Subtest: preserves application base paths
@e-pharmacy/api:test: ok 19 - hashes reset secrets before they become rate-limit keys
@e-pharmacy/client:test:   ...
@e-pharmacy/admin:test: ok 24 - preserves application base paths
@e-pharmacy/auth:test: ok 20 - classifies stable transport codes and infrastructure status fallbacks
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test: # Subtest: pharmacy SEO canonical keeps the indexed city dimension and removes noindex noise
@e-pharmacy/admin:test:   ---
@e-pharmacy/auth:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.25681
@e-pharmacy/client:test: ok 3 - pharmacy SEO canonical keeps the indexed city dimension and removes noindex noise
@e-pharmacy/admin:test:   duration_ms: 0.978086
@e-pharmacy/auth:test:   duration_ms: 0.704927
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   duration_ms: 1.436288
@e-pharmacy/auth:test:   ...
@e-pharmacy/admin:test:   ...
@e-pharmacy/api:test: # Subtest: progressive delay grows after repeated failures and stays bounded
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/auth:test: # Subtest: does not infer auth business semantics from legacy messages or statuses
@e-pharmacy/admin:test: # Subtest: production destinations fail closed when configuration is unsafe
@e-pharmacy/api:test: ok 20 - progressive delay grows after repeated failures and stays bounded
@e-pharmacy/client:test:   ...
@e-pharmacy/auth:test: ok 21 - does not infer auth business semantics from legacy messages or statuses
@e-pharmacy/admin:test: ok 25 - production destinations fail closed when configuration is unsafe
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test: # Subtest: legal documents become index/sitemap eligible only after complete approval metadata exists
@e-pharmacy/auth:test:   ---
@e-pharmacy/admin:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.474434
@e-pharmacy/client:test: ok 4 - legal documents become index/sitemap eligible only after complete approval metadata exists
@e-pharmacy/auth:test:   duration_ms: 0.660405
@e-pharmacy/admin:test:   duration_ms: 2.508519
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/auth:test:   ...
@e-pharmacy/client:test:   duration_ms: 2.621214
@e-pharmacy/admin:test:   ...
@e-pharmacy/api:test: # Subtest: distributed auth rate limiting uses Mongo instead of process-local buckets
@e-pharmacy/auth:test: # Subtest: maps explicit validation and resource codes without status inference
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/admin:test: # Subtest: pharmacy environment value must be the application base URL
@e-pharmacy/api:test: ok 21 - distributed auth rate limiting uses Mongo instead of process-local buckets
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.508636
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/auth:test: ok 22 - maps explicit validation and resource codes without status inference
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.373796
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: builds the current route including query and hash
@e-pharmacy/auth:test: ok 23 - builds the current route including query and hash
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 3.895182
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: keeps local destinations local and normalized
@e-pharmacy/auth:test: ok 24 - keeps local destinations local and normalized
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 6.926831
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test: ok 26 - pharmacy environment value must be the application base URL
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: auth routes combine IP and account dimensions for credential-sensitive flows
@e-pharmacy/api:test: ok 22 - auth routes combine IP and account dimensions for credential-sensitive flows
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.931127
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   ...
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: requires an application resolver for external navigation
@e-pharmacy/auth:test: ok 25 - requires an application resolver for external navigation
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.351418
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.514782
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/auth:test:   ...
@e-pharmacy/client:test: # Subtest: dynamic sitemap/detail URLs reuse the typed canonical entity builders
@e-pharmacy/admin:test: # Subtest: trusted redirects are limited to configured application origins and paths
@e-pharmacy/api:test: # ◇ injected env (19) from .env // tip: ⌘ suppress logs { quiet: true }
@e-pharmacy/auth:test: # Subtest: guest guard makes auth-unavailable behavior explicit
@e-pharmacy/client:test: ok 5 - dynamic sitemap/detail URLs reuse the typed canonical entity builders
@e-pharmacy/admin:test: ok 27 - trusted redirects are limited to configured application origins and paths
@e-pharmacy/api:test: # Subtest: traceparent preserves correlation without requiring x-request-id
@e-pharmacy/auth:test: ok 26 - guest guard makes auth-unavailable behavior explicit
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test:   ---
@e-pharmacy/api:test: ok 23 - traceparent preserves correlation without requiring x-request-id
@e-pharmacy/auth:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.197447
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: recovery and password-change UI never prefer arbitrary error.message copy
@e-pharmacy/client:test: ok 6 - recovery and password-change UI never prefer arbitrary error.message copy
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 90.212513
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: auth-sensitive submit handlers use synchronous refs before starting requests
@e-pharmacy/client:test: ok 7 - auth-sensitive submit handlers use synchronous refs before starting requests
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 8.335293
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: registration submit stays disabled until all required registration data is valid
@e-pharmacy/client:test: ok 8 - registration submit stays disabled until all required registration data is valid
@e-pharmacy/api:test:   ---
@e-pharmacy/auth:test:   duration_ms: 2.527069
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: role guard distinguishes loading, unavailable, login, forbidden, and allowed states
@e-pharmacy/auth:test: ok 27 - role guard distinguishes loading, unavailable, login, forbidden, and allowed states
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.596405
@e-pharmacy/admin:test:   duration_ms: 4.359878
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 4.430834
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: continue shopping uses filter metadata, pagination and independent errors
@e-pharmacy/client:test: ok 9 - continue shopping uses filter metadata, pagination and independent errors
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 213.997152
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 3.593734
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: captures a fragment reset token and removes it from the visible URL
@e-pharmacy/auth:test: ok 28 - captures a fragment reset token and removes it from the visible URL
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 3.146663
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: scrubs legacy query tokens while preserving unrelated URL state
@e-pharmacy/auth:test: ok 29 - scrubs legacy query tokens while preserving unrelated URL state
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.650665
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: prefers the fragment token and scrubs both token locations
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: uses admin profile as the direct-login destination
@e-pharmacy/admin:test: ok 28 - uses admin profile as the direct-login destination
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/auth:test: ok 30 - prefers the fragment token and scrubs both token locations
@e-pharmacy/client:test:   ...
@e-pharmacy/admin:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/auth:test:   ---
@e-pharmacy/client:test: # Subtest: pharmacy reset clears name, address, city and sorting together
@e-pharmacy/admin:test:   duration_ms: 3.942024
@e-pharmacy/api:test: # Subtest: User model enforces the same name, email, phone and address invariants as Zod
@e-pharmacy/auth:test:   duration_ms: 0.494377
@e-pharmacy/client:test: ok 10 - pharmacy reset clears name, address, city and sorting together
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/api:test: ok 24 - User model enforces the same name, email, phone and address invariants as Zod
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/auth:test:   ...
@e-pharmacy/client:test:   duration_ms: 55.469836
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/admin:test: # Subtest: preserves a trusted internal admin redirect
@e-pharmacy/admin:test: ok 29 - preserves a trusted internal admin redirect
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 1.1251
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: rejects external and non-admin redirects
@e-pharmacy/api:test:   duration_ms: 103.365885
@e-pharmacy/auth:test: # Subtest: keeps the captured token across a reset-page remount after URL cleanup
@e-pharmacy/client:test:   ...
@e-pharmacy/admin:test: ok 30 - rejects external and non-admin redirects
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/auth:test: ok 31 - keeps the captured token across a reset-page remount after URL cleanup
@e-pharmacy/admin:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test: # Subtest: product reset clears every catalog filter together
@e-pharmacy/auth:test:   ---
@e-pharmacy/admin:test:   duration_ms: 1.829099
@e-pharmacy/api:test: # Subtest: Pharmacy model protects contact, schedule, bank and picture invariants
@e-pharmacy/api:test: ok 25 - Pharmacy model protects contact, schedule, bank and picture invariants
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 106.355794
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Review model rejects comments outside the shared character contract
@e-pharmacy/client:test: ok 11 - product reset clears every catalog filter together
@e-pharmacy/auth:test:   duration_ms: 0.755941
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: clears the in-memory history token after a successful reset
@e-pharmacy/auth:test: ok 32 - clears the in-memory history token after a successful reset
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 2.900866
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/api:test: ok 26 - Review model rejects comments outside the shared character contract
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 49.671815
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test: # Subtest: accepts normalized local paths with query and hash
@e-pharmacy/auth:test: ok 33 - accepts normalized local paths with query and hash
@e-pharmacy/client:test: # Subtest: checkout pharmacy loader keeps loading, success and error states distinct
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 4.218429
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: rejects traversal, protocol-relative and encoded control paths
@e-pharmacy/auth:test: ok 34 - rejects traversal, protocol-relative and encoded control paths
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.85507
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: render error diagnostics expose only approved correlation fields
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.36104
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Review models enforce one pending or approved review per user and entity
@e-pharmacy/api:test: ok 27 - Review models enforce one pending or approved review per user and entity
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.212518
@e-pharmacy/client:test: ok 12 - checkout pharmacy loader keeps loading, success and error states distinct
@e-pharmacy/admin:test: ok 31 - render error diagnostics expose only approved correlation fields
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 76.406618
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: render error diagnostics omit the digest when Next.js does not provide one
@e-pharmacy/admin:test: ok 32 - render error diagnostics omit the digest when Next.js does not provide one
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 97.605429
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: keeps the cart limit message single-action and fully described
@e-pharmacy/client:test: ok 13 - keeps the cart limit message single-action and fully described
@e-pharmacy/auth:test:   ...
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.501796
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test: # Subtest: enforces application route roots without prefix collisions
@e-pharmacy/client:test:   duration_ms: 181.944791
@e-pharmacy/admin:test:   ...
@e-pharmacy/auth:test: ok 35 - enforces application route roots without prefix collisions
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/admin:test: # Subtest: flat admin routes derive breadcrumbs from canonical pathname families
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 1.561968
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: allows only trusted external origins and path roots
@e-pharmacy/auth:test: ok 36 - allows only trusted external origins and path roots
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 2.150026
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: closes the mobile overlay in state at desktop breakpoint
@e-pharmacy/client:test: ok 14 - closes the mobile overlay in state at desktop breakpoint
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/admin:test: ok 33 - flat admin routes derive breadcrumbs from canonical pathname families
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 4.533327
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/client:test:   duration_ms: 4.658544
@e-pharmacy/api:test: # Subtest: Position normalizes name and case-insensitive uniqueness key
@e-pharmacy/auth:test: # Subtest: accepts only the exact BFF-owned auth hint value
@e-pharmacy/admin:test: # Subtest: nested admin routes expose their group and child labels
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test: ok 28 - Position normalizes name and case-insensitive uniqueness key
@e-pharmacy/auth:test: ok 37 - accepts only the exact BFF-owned auth hint value
@e-pharmacy/client:test:   ...
@e-pharmacy/admin:test: ok 34 - nested admin routes expose their group and child labels
@e-pharmacy/auth:test:   ---
@e-pharmacy/admin:test:   ---
@e-pharmacy/client:test: # Subtest: keeps public feature actions as real links and the shared shell free of transient skip controls
@e-pharmacy/auth:test:   duration_ms: 3.195822
@e-pharmacy/admin:test:   duration_ms: 1.816577
@e-pharmacy/client:test: ok 15 - keeps public feature actions as real links and the shared shell free of transient skip controls
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 4.687761
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: freezes the client reference shell and server-rendered home baseline
@e-pharmacy/client:test: ok 16 - freezes the client reference shell and server-rendered home baseline
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 14.074879
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: ignores malformed values and accepts a later valid duplicate
@e-pharmacy/auth:test: ok 38 - ignores malformed values and accepts a later valid duplicate
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.592231
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: does not match cookie-name prefixes
@e-pharmacy/auth:test: ok 39 - does not match cookie-name prefixes
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 137.369316
@e-pharmacy/client:test: # Subtest: catalog routes use six-card skeleton loading states with reduced-motion support
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test: ok 17 - catalog routes use six-card skeleton loading states with reduced-motion support
@e-pharmacy/admin:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/auth:test:   duration_ms: 0.515246
@e-pharmacy/api:test:   ...
@e-pharmacy/admin:test: # Subtest: unknown admin routes do not invent breadcrumb labels
@e-pharmacy/client:test:   duration_ms: 67.874688
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test: ok 35 - unknown admin routes do not invent breadcrumb labels
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/admin:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/auth:test: # Subtest: handles cookie whitespace and a non-browser environment
@e-pharmacy/admin:test:   duration_ms: 0.441506
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: does not publish placeholder social links or developer diagnostics
@e-pharmacy/client:test: ok 18 - does not publish placeholder social links or developer diagnostics
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 10.486247
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: keeps CartPageContent outside its own feature barrel cycle
@e-pharmacy/api:test: # Subtest: Position rejects invalid names and has unique normalizedName index
@e-pharmacy/auth:test: ok 40 - handles cookie whitespace and a non-browser environment
@e-pharmacy/auth:test:   ---
@e-pharmacy/api:test: ok 29 - Position rejects invalid names and has unique normalizedName index
@e-pharmacy/auth:test:   duration_ms: 0.491593
@e-pharmacy/api:test:   ---
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/client:test: ok 19 - keeps CartPageContent outside its own feature barrel cycle
@e-pharmacy/api:test:   duration_ms: 8.078829
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: ProductCategory normalizes persistence name and uniqueness key
@e-pharmacy/api:test: ok 30 - ProductCategory normalizes persistence name and uniqueness key
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 75.814388
@e-pharmacy/admin:test:   ...
@e-pharmacy/auth:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/admin:test: # Subtest: admin navigation keeps canonical top-level routes unique
@e-pharmacy/auth:test: # Subtest: publishes only non-sensitive auth lifecycle events
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   duration_ms: 6.864686
@e-pharmacy/admin:test: ok 36 - admin navigation keeps canonical top-level routes unique
@e-pharmacy/auth:test: ok 41 - publishes only non-sensitive auth lifecycle events
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 4.240226
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: reviews and settings use one-level shared navigation groups including Positions
@e-pharmacy/admin:test: ok 37 - reviews and settings use one-level shared navigation groups including Positions
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 1.306433
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: limited access filters children and removes empty groups without using position
@e-pharmacy/admin:test: ok 38 - limited access filters children and removes empty groups without using position
@e-pharmacy/admin:test:   ---
@e-pharmacy/auth:test:   ---
@e-pharmacy/auth:test:   duration_ms: 4.916399
@e-pharmacy/api:test: # Subtest: ProductCategory rejects invalid name, slug and sort order
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: preserves all home blocks while keeping stats and customer reviews stable
@e-pharmacy/client:test: ok 20 - preserves all home blocks while keeping stats and customer reviews stable
@e-pharmacy/api:test: ok 31 - ProductCategory rejects invalid name, slug and sort order
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 14.921254
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test:   duration_ms: 1.319419
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/auth:test:   ...
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 10.323
@e-pharmacy/api:test:   ...
@e-pharmacy/auth:test: # Subtest: ignores invalid messages and supports unsubscribe
@e-pharmacy/admin:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: ProductCategory has database-level unique indexes for normalizedName and slug
@e-pharmacy/auth:test: ok 42 - ignores invalid messages and supports unsubscribe
@e-pharmacy/admin:test: # Subtest: Platform Owner receives all permission-controlled navigation
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test: ok 32 - ProductCategory has database-level unique indexes for normalizedName and slug
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 69.288715
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/auth:test:   ---
@e-pharmacy/admin:test: ok 39 - Platform Owner receives all permission-controlled navigation
@e-pharmacy/client:test: # Subtest: keeps information navigation in the mobile drawer and hides draft copy
@e-pharmacy/api:test:   ...
@e-pharmacy/auth:test:   duration_ms: 0.873274
@e-pharmacy/admin:test:   ---
@e-pharmacy/client:test: ok 21 - keeps information navigation in the mobile drawer and hides draft copy
@e-pharmacy/api:test: # Subtest: admin audit read routes require audit.view and expose no mutation route
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test:   duration_ms: 78.15734
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test: ok 33 - admin audit read routes require audit.view and expose no mutation route
@e-pharmacy/auth:test:   ...
@e-pharmacy/auth:test: # Subtest: falls back to a no-op adapter without browser channel support
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: nested admin routes resolve against the visible navigation model
@e-pharmacy/admin:test: ok 40 - nested admin routes resolve against the visible navigation model
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.672927
@e-pharmacy/client:test:   duration_ms: 9.95987
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 158.55607
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # ◇ injected env (19) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
@e-pharmacy/api:test: # Subtest: article availability route requires authentication and pharmacy role
@e-pharmacy/api:test: ok 34 - article availability route requires authentication and pharmacy role
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: app-level client status boundaries opt into one main landmark
@e-pharmacy/client:test: ok 22 - app-level client status boundaries opt into one main landmark
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 63.56026
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses the branded status layout for pharmacy application configuration errors
@e-pharmacy/client:test: ok 23 - uses the branded status layout for pharmacy application configuration errors
@e-pharmacy/client:test:   ---
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin access parser accepts known permissions and normalizes duplicates
@e-pharmacy/admin:test: ok 41 - admin access parser accepts known permissions and normalizes duplicates
@e-pharmacy/admin:test:   ---
@e-pharmacy/auth:test: ok 43 - falls back to a no-op adapter without browser channel support
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   duration_ms: 86.225503
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/admin:test:   duration_ms: 6.219586
@e-pharmacy/auth:test:   ---
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test:   duration_ms: 0.839883
@e-pharmacy/admin:test:   ...
@e-pharmacy/pharmacy:test: ok 21 - server snapshot is always expanded and valid stored booleans hydrate the client snapshot
@e-pharmacy/auth:test:   type: 'test'
@e-pharmacy/admin:test: # Subtest: admin access parser fails closed for malformed and unknown permissions
@e-pharmacy/auth:test:   ...
@e-pharmacy/admin:test: ok 42 - admin access parser fails closed for malformed and unknown permissions
@e-pharmacy/auth:test: 1..43
@e-pharmacy/admin:test:   ---
@e-pharmacy/auth:test: # tests 43
@e-pharmacy/admin:test:   duration_ms: 1.820287
@e-pharmacy/auth:test: # suites 0
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/auth:test: # pass 43
@e-pharmacy/auth:test: # fail 0
@e-pharmacy/auth:test: # cancelled 0
@e-pharmacy/auth:test: # skipped 0
@e-pharmacy/auth:test: # todo 0
@e-pharmacy/auth:test: # duration_ms 66644.56861
@e-pharmacy/api:test:   duration_ms: 12.995228
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin owner bootstrap validates and normalizes trusted input
@e-pharmacy/api:test: ok 35 - admin owner bootstrap validates and normalizes trusted input
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 168.526606
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin owner bootstrap rejects invalid identity credentials
@e-pharmacy/api:test: ok 36 - admin owner bootstrap rejects invalid identity credentials
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.950025
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin self profile rejects identity edits
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: frontend permission helper grants exact access and Platform Owner bypass only
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.959647
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: same-tab updates persist when possible and notify active subscribers
@e-pharmacy/next-api:test: ok 28 - forwards query parameters for every supported HTTP method and disables redirects
@e-pharmacy/api:test: ok 37 - admin self profile rejects identity edits
@e-pharmacy/pharmacy:test: ok 22 - same-tab updates persist when possible and notify active subscribers
@e-pharmacy/admin:test: ok 43 - frontend permission helper grants exact access and Platform Owner bypass only
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/admin:test:   ---
@e-pharmacy/api:test:   duration_ms: 12.172969
@e-pharmacy/pharmacy:test:   duration_ms: 1.108868
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin self profile accepts picture updates and removal
@e-pharmacy/api:test: ok 38 - admin self profile accepts picture updates and removal
@e-pharmacy/admin:test:   duration_ms: 0.779593
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: cross-tab storage events update the in-memory preference and ignore unrelated keys
@e-pharmacy/pharmacy:test: ok 23 - cross-tab storage events update the in-memory preference and ignore unrelated keys
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.884405
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: storage failures keep the in-memory preference functional
@e-pharmacy/pharmacy:test: ok 24 - storage failures keep the in-memory preference functional
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 130.004689
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: propagates incoming request abort to a direct backend fetch
@e-pharmacy/next-api:test: ok 29 - propagates incoming request abort to a direct backend fetch
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 6.89344
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test:   duration_ms: 2.329968
@e-pharmacy/pharmacy:test:   duration_ms: 0.637216
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: order counters refresh from explicit lifecycle signals instead of pathname changes
@e-pharmacy/pharmacy:test: ok 25 - order counters refresh from explicit lifecycle signals instead of pathname changes
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 160.498792
@e-pharmacy/next-api:test: # Subtest: propagates incoming request abort to backend fetch and does not retry
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin self profile requires a mutation field and a valid revision
@e-pharmacy/api:test: ok 39 - admin self profile requires a mutation field and a valid revision
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.683012
@e-pharmacy/admin:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/next-api:test: ok 30 - propagates incoming request abort to backend fetch and does not retry
@e-pharmacy/admin:test: # Subtest: authorization error codes stay stable for access state classification
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test:   ---
@e-pharmacy/admin:test: ok 44 - authorization error codes stay stable for access state classification
@e-pharmacy/api:test: # Subtest: admin category mutations require and normalize a six-digit hex color
@e-pharmacy/api:test: ok 40 - admin category mutations require and normalize a six-digit hex color
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 12.543055
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: position payload remains name-only and rejects category color metadata
@e-pharmacy/api:test: ok 41 - position payload remains name-only and rejects category color metadata
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.459822
@e-pharmacy/next-api:test:   duration_ms: 5.740977
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: generic JSON validation accepts canonical JSON and empty 204 responses
@e-pharmacy/next-api:test: ok 31 - generic JSON validation accepts canonical JSON and empty 204 responses
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 314.412548
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: counter refresh aborts the previous generation before starting another
@e-pharmacy/pharmacy:test: ok 26 - counter refresh aborts the previous generation before starting another
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/admin:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: # Subtest: settings list dates accept real inclusive boundaries and reject invalid ranges
@e-pharmacy/admin:test:   duration_ms: 0.62655
@e-pharmacy/next-api:test: # Subtest: generic JSON validation rejects HTML and malformed JSON backend responses
@e-pharmacy/pharmacy:test:   duration_ms: 4.338545
@e-pharmacy/api:test: ok 42 - settings list dates accept real inclusive boundaries and reject invalid ranges
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test: ok 32 - generic JSON validation rejects HTML and malformed JSON backend responses
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   duration_ms: 6.366599
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: collapsed order notifications remain visible and expanded badges expose semantic labels
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: ok 27 - collapsed order notifications remain visible and expanded badges expose semantic labels
@e-pharmacy/api:test: # Subtest: login validates email but does not re-apply registration password rules
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: ok 43 - login validates email but does not re-apply registration password rules
@e-pharmacy/pharmacy:test:   duration_ms: 11.862245
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin document parsers accept the canonical metadata-only contract
@e-pharmacy/next-api:test:   ---
@e-pharmacy/admin:test: ok 45 - admin document parsers accept the canonical metadata-only contract
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test:   duration_ms: 4.33669
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/admin:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: counter presentation handles 9, 99, 999 and 1000+ without unbounded pills
@e-pharmacy/api:test:   duration_ms: 162.687773
@e-pharmacy/next-api:test:   ...
@e-pharmacy/admin:test:   duration_ms: 7.637323
@e-pharmacy/pharmacy:test: ok 28 - counter presentation handles 9, 99, 999 and 1000+ without unbounded pills
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/next-api:test: # Subtest: generic JSON validation remains syntax-only for private transport consumers
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test: ok 33 - generic JSON validation remains syntax-only for private transport consumers
@e-pharmacy/pharmacy:test:   duration_ms: 5.780398
@e-pharmacy/api:test: # Subtest: forgot and reset password schemas enforce application, token and new password
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 75.960937
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: API envelope validation accepts canonical success and error envelopes
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: ok 44 - forgot and reset password schemas enforce application, token and new password
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.468053
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: profile updates reject payloads without meaningful values
@e-pharmacy/pharmacy:test: # Subtest: notification visibility supports zero, one-sided and two-sided counts
@e-pharmacy/api:test: ok 45 - profile updates reject payloads without meaningful values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.710135
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: ok 29 - notification visibility supports zero, one-sided and two-sided counts
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/admin:test:   ...
@e-pharmacy/next-api:test: ok 34 - API envelope validation accepts canonical success and error envelopes
@e-pharmacy/api:test: # Subtest: password update requires current password and a valid new password
@e-pharmacy/pharmacy:test:   duration_ms: 0.529623
@e-pharmacy/admin:test: # Subtest: admin document parsers fail closed for malformed metadata
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api:test: ok 46 - password update requires current password and a valid new password
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/admin:test: ok 46 - admin document parsers fail closed for malformed metadata
@e-pharmacy/next-api:test:   duration_ms: 3.826545
@e-pharmacy/api:test:   ---
@e-pharmacy/admin:test:   ---
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 1.400114
@e-pharmacy/admin:test:   duration_ms: 1.591186
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin private comment parsers accept the canonical paginated contract
@e-pharmacy/admin:test: ok 47 - admin private comment parsers accept the canonical paginated contract
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 7.085903
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: admin private comment parsers fail closed for malformed data
@e-pharmacy/admin:test: ok 48 - admin private comment parsers fail closed for malformed data
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 1.762317
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: API envelope validation rejects syntactically valid but non-canonical payloads
@e-pharmacy/next-api:test: ok 35 - API envelope validation rejects syntactically valid but non-canonical payloads
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: optional registration address normalizes empty values
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: category list parser keeps dynamic category color and usage metadata
@e-pharmacy/admin:test: ok 49 - category list parser keeps dynamic category color and usage metadata
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 6.337847
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: expanded and collapsed notification labels expose exact semantic counts
@e-pharmacy/pharmacy:test: ok 30 - expanded and collapsed notification labels expose exact semantic counts
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.582956
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: an already-open mobile menu is closed when mounted at desktop width
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api:test: ok 47 - optional registration address normalizes empty values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 32.1901
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: optional registration address trims valid values
@e-pharmacy/api:test: ok 48 - optional registration address trims valid values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.742956
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: registration address enforces boundaries after trimming
@e-pharmacy/api:test: ok 49 - registration address enforces boundaries after trimming
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.38933
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: public registration rejects the admin role
@e-pharmacy/api:test: ok 50 - public registration rejects the admin role
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: ok 31 - an already-open mobile menu is closed when mounted at desktop width
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 7.163816
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: crossing from mobile to desktop closes once and returning mobile does not open
@e-pharmacy/pharmacy:test: ok 32 - crossing from mobile to desktop closes once and returning mobile does not open
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.701217
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test:   duration_ms: 3.206952
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: builds explicit public cache policies and supports no-store
@e-pharmacy/next-api:test: ok 36 - builds explicit public cache policies and supports no-store
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 3.185618
@e-pharmacy/api:test:   duration_ms: 1.524868
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: login requires an explicit supported application binding
@e-pharmacy/api:test: ok 51 - login requires an explicit supported application binding
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.465851
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: successful logout settles local UI and performs one login redirect
@e-pharmacy/pharmacy:test: ok 33 - successful logout settles local UI and performs one login redirect
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 81.335539
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: remote logout failure still closes and redirects to login
@e-pharmacy/pharmacy:test: ok 34 - remote logout failure still closes and redirects to login
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects non-finite, fractional, negative, and excessive cache values
@e-pharmacy/next-api:test: ok 37 - rejects non-finite, fractional, negative, and excessive cache values
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.003593
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test: # Subtest: password recovery accepts every supported auth application
@e-pharmacy/api:test: ok 52 - password recovery accepts every supported auth application
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.642201
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/admin:test: # Subtest: category parser fails closed for malformed color and inconsistent usage
@e-pharmacy/admin:test: ok 50 - category parser fails closed for malformed color and inconsistent usage
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.592807
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 1.174259
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: position parser stays color-free and validates its own usage shape
@e-pharmacy/admin:test: ok 51 - position parser stays color-free and validates its own usage shape
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 0.897854
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: settings list parsers accept an empty database response
@e-pharmacy/admin:test: ok 52 - settings list parsers accept an empty database response
@e-pharmacy/admin:test:   ---
@e-pharmacy/admin:test:   duration_ms: 2.096229
@e-pharmacy/next-api:test: # Subtest: private requests forward only access and legacy cookies
@e-pharmacy/next-api:test: ok 38 - private requests forward only access and legacy cookies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 3.893792
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: second concurrent logout is rejected before another request starts
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: # Subtest: category parser rejects malformed dynamic slugs
@e-pharmacy/admin:test: ok 53 - category parser rejects malformed dynamic slugs
@e-pharmacy/admin:test:   ---
@e-pharmacy/ui:test: ok 20 - flat navigation preserves exact and descendant route matching
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/admin:test:   duration_ms: 0.55884
@e-pharmacy/admin:test:   type: 'test'
@e-pharmacy/admin:test:   ...
@e-pharmacy/admin:test: 1..53
@e-pharmacy/admin:test: # tests 53
@e-pharmacy/admin:test: # suites 0
@e-pharmacy/admin:test: # pass 53
@e-pharmacy/admin:test: # fail 0
@e-pharmacy/next-api:test:   ...
@e-pharmacy/admin:test: # cancelled 0
@e-pharmacy/next-api:test: # Subtest: refresh forwards only the refresh cookie
@e-pharmacy/admin:test: # skipped 0
@e-pharmacy/admin:test: # todo 0
@e-pharmacy/admin:test: # duration_ms 71695.086337
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 2.794199
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 35 - second concurrent logout is rejected before another request starts
@e-pharmacy/next-api:test: ok 39 - refresh forwards only the refresh cookie
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.563478
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: public and unauthenticated auth requests forward no cookies
@e-pharmacy/next-api:test: ok 40 - public and unauthenticated auth requests forward no cookies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.348753
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 0.801854
@e-pharmacy/next-api:test: # Subtest: private retry never copies unrelated or refresh cookies
@e-pharmacy/next-api:test: ok 41 - private retry never copies unrelated or refresh cookies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.639999
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: last duplicate wins and cookie values may contain equals signs
@e-pharmacy/next-api:test: ok 42 - last duplicate wins and cookie values may contain equals signs
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.717448
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: active child marks its parent group active
@e-pharmacy/ui:test: ok 21 - active child marks its parent group active
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.531477
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/api-client:test: # Subtest: uses resource-oriented backend route builders
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test: # Subtest: parses a complete AuthResponse at the browser boundary
@e-pharmacy/client:test: # Subtest: allows one favorite mutation and exposes local pending state
@e-pharmacy/client:test: ok 24 - allows one favorite mutation and exposes local pending state
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 4.807877
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rapid clicks cannot start a second favorite mutation
@e-pharmacy/client:test: ok 25 - rapid clicks cannot start a second favorite mutation
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.671536
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: disabled and externally pending buttons do not mutate
@e-pharmacy/client:test: ok 26 - disabled and externally pending buttons do not mutate
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.51571
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: distinguishes unknown stock from a confirmed zero quantity
@e-pharmacy/client:test: ok 27 - distinguishes unknown stock from a confirmed zero quantity
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 51.533841
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rejects malformed stock instead of visually normalizing it
@e-pharmacy/client:test: ok 28 - rejects malformed stock instead of visually normalizing it
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.472462
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: provides explicit user-facing copy for every server data reason
@e-pharmacy/client:test: ok 29 - provides explicit user-facing copy for every server data reason
@e-pharmacy/next-api:test: # Subtest: accepts same-origin mutations with the BFF CSRF header
@e-pharmacy/next-api:test: ok 43 - accepts same-origin mutations with the BFF CSRF header
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 340.535179
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: desktop and mobile logout share one pharmacy application lifecycle owner
@e-pharmacy/ui:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: ok 36 - desktop and mobile logout share one pharmacy application lifecycle owner
@e-pharmacy/client:test:   duration_ms: 39.576989
@e-pharmacy/next-api:test: # Subtest: rejects missing header and cross-site requests
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test: ok 44 - rejects missing header and cross-site requests
@e-pharmacy/pharmacy:test:   duration_ms: 90.061787
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: shared fullscreen UI is capability-gated and cleans up browser subscriptions
@e-pharmacy/pharmacy:test: ok 37 - shared fullscreen UI is capability-gated and cleans up browser subscriptions
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.811353
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: sidebar hides counters after a current-generation request failure
@e-pharmacy/pharmacy:test: ok 38 - sidebar hides counters after a current-generation request failure
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 87.845907
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: shows a short optional support reference without exposing the full ID
@e-pharmacy/client:test: ok 30 - shows a short optional support reference without exposing the full ID
@e-pharmacy/ui:test: # Subtest: UserBadge owns broken-image fallback while ImagePreview stays generic
@e-pharmacy/next-api:test:   duration_ms: 1.926954
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: does not require CSRF validation for GET
@e-pharmacy/next-api:test: ok 45 - does not require CSRF validation for GET
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.768463
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: every environment requires the BFF proxy secret and production also requires HTTPS
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/ui:test: ok 22 - UserBadge owns broken-image fallback while ImagePreview stays generic
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 73.75294
@e-pharmacy/pharmacy:test: # Subtest: text filters use settled debounce values while non-text filters apply immediately
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: valid image URLs render until that exact URL reports an error
@e-pharmacy/ui:test: ok 23 - valid image URLs render until that exact URL reports an error
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 3.12904
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: missing image URLs use initials and a new URL can retry after an older failure
@e-pharmacy/ui:test: ok 24 - missing image URLs use initials and a new URL can retry after an older failure
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.450318
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: comments presentation accepts non-pharmacy note contracts
@e-pharmacy/ui:test: ok 25 - comments presentation accepts non-pharmacy note contracts
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 176.558132
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: adds unique files and reports duplicate selections
@e-pharmacy/ui:test: ok 26 - adds unique files and reports duplicate selections
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 13.480329
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: single-file mode replaces the previous file without accepting duplicates
@e-pharmacy/ui:test: ok 27 - single-file mode replaces the previous file without accepting duplicates
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.904346
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: recognizes listbox keyboard actions
@e-pharmacy/ui:test: ok 28 - recognizes listbox keyboard actions
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 2.898083
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: keeps active indexes inside available options
@e-pharmacy/ui:test: ok 29 - keeps active indexes inside available options
@e-pharmacy/next-api:test: ok 46 - every environment requires the BFF proxy secret and production also requires HTTPS
@e-pharmacy/pharmacy:test: ok 39 - text filters use settled debounce values while non-text filters apply immediately
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 2.691707
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/ui:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: route synchronization restores Back and Forward filter state
@e-pharmacy/client:test:   duration_ms: 0.616347
@e-pharmacy/ui:test:   duration_ms: 0.570434
@e-pharmacy/next-api:test:   duration_ms: 5.254021
@e-pharmacy/pharmacy:test: ok 40 - route synchronization restores Back and Forward filter state
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: keeps Product Details split by lifecycle responsibility
@e-pharmacy/client:test: ok 31 - keeps Product Details split by lifecycle responsibility
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 109.663848
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: keeps Pharmacy Details retryable and separates contact from receipt email
@e-pharmacy/client:test: ok 32 - keeps Pharmacy Details retryable and separates contact from receipt email
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 31.289463
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: inner widgets own Escape when they prevent the event
@e-pharmacy/ui:test: ok 30 - inner widgets own Escape when they prevent the event
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 6.687064
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects invalid SameSite and cookie-domain configuration
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 2.641619
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: route synchronization keeps the existing object when filters are already canonical
@e-pharmacy/pharmacy:test: ok 41 - route synchronization keeps the existing object when filters are already canonical
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.590376
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test: ok 47 - rejects invalid SameSite and cookie-domain configuration
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 13.82259
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: trusted client IP forwarding requires an explicit proxy provider
@e-pharmacy/next-api:test: ok 48 - trusted client IP forwarding requires an explicit proxy provider
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test: # Subtest: keeps detail feature public APIs minimal and nested barrels removed
@e-pharmacy/client:test: ok 33 - keeps detail feature public APIs minimal and nested barrels removed
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 8.6488
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/ui:test:   ...
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 85.069331
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: appends search params to a path without query
@e-pharmacy/next-api:test: ok 49 - appends search params to a path without query
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 4.378893
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: Orders page uses settled text filters for requests and URL updates
@e-pharmacy/client:test: # Subtest: legal and information documents have unique paths and structured revision metadata
@e-pharmacy/client:test: ok 34 - legal and information documents have unique paths and structured revision metadata
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.508865
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: document anchors are explicit, stable, unique, and independent of visible titles
@e-pharmacy/ui:test: # Subtest: closeOnEscape=false does not block child keyboard behavior
@e-pharmacy/ui:test: ok 31 - closeOnEscape=false does not block child keyboard behavior
@e-pharmacy/ui:test:   ---
@e-pharmacy/next-api:test: # Subtest: merges search params with an existing query
@e-pharmacy/pharmacy:test: ok 42 - Orders page uses settled text filters for requests and URL updates
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 252.953156
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test: ok 50 - merges search params with an existing query
@e-pharmacy/next-api:test:   ---
@e-pharmacy/client:test: ok 35 - document anchors are explicit, stable, unique, and independent of visible titles
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.323129
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: closes an already-open mobile overlay when desktop is active
@e-pharmacy/client:test: ok 36 - closes an already-open mobile overlay when desktop is active
@e-pharmacy/client:test:   ---
@e-pharmacy/ui:test:   duration_ms: 1.110259
@e-pharmacy/client:test:   duration_ms: 86.93043
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: closes on a mobile-to-desktop transition and ignores mobile changes
@e-pharmacy/client:test: ok 37 - closes on a mobile-to-desktop transition and ignores mobile changes
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.598724
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses one explicit mode for loading, unavailable, and guest states
@e-pharmacy/client:test: ok 38 - uses one explicit mode for loading, unavailable, and guest states
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.42585
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: maps authenticated users to role-specific presentation modes
@e-pharmacy/client:test: ok 39 - maps authenticated users to role-specific presentation modes
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.632579
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: does not expose contradictory guest and unavailable flags
@e-pharmacy/client:test: ok 40 - does not expose contradictory guest and unavailable flags
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: Orders page accepts the backend canonical page without a duplicate GET
@e-pharmacy/pharmacy:test: ok 43 - Orders page accepts the backend canonical page without a duplicate GET
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 97.521951
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: Orders page ignores its own URL replacements when syncing route filters but restores external navigation
@e-pharmacy/pharmacy:test: ok 44 - Orders page ignores its own URL replacements when syncing route filters but restores external navigation
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 4.34411
@e-pharmacy/next-api:test:   duration_ms: 1.050434
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: keeps the original path when search is empty
@e-pharmacy/next-api:test: ok 51 - keeps the original path when search is empty
@e-pharmacy/client:test:   duration_ms: 0.484637
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: runs logout once and completes close/navigation lifecycle
@e-pharmacy/client:test: ok 41 - runs logout once and completes close/navigation lifecycle
@e-pharmacy/client:test:   ---
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 14.207052
@e-pharmacy/ui:test:   ...
@e-pharmacy/next-api:test:   duration_ms: 0.409042
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/ui:test: # Subtest: nested overlays close only the top layer
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: successful empty orders response is represented as success, not an error
@e-pharmacy/client:test:   ...
@e-pharmacy/ui:test: ok 32 - nested overlays close only the top layer
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: preserves repeated, encoded, and Unicode values while dropping fragments
@e-pharmacy/next-api:test: ok 52 - preserves repeated, encoded, and Unicode values while dropping fragments
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.031883
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects query strings above the practical encoded-length limit
@e-pharmacy/next-api:test: ok 53 - rejects query strings above the practical encoded-length limit
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.55223
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 45 - successful empty orders response is represented as success, not an error
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.42979
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: failed initial orders request is represented as error instead of successful empty data
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 5.446021
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test: # Subtest: remote failure still closes and navigates with a non-blocking report
@e-pharmacy/pharmacy:test: ok 46 - failed initial orders request is represented as error instead of successful empty data
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test: # Subtest: counts repeated parameters toward the practical query parameter limit
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test: ok 42 - remote failure still closes and navigates with a non-blocking report
@e-pharmacy/ui:test:   ...
@e-pharmacy/next-api:test: ok 54 - counts repeated parameters toward the practical query parameter limit
@e-pharmacy/pharmacy:test:   duration_ms: 0.548173
@e-pharmacy/client:test:   ---
@e-pharmacy/ui:test: # Subtest: uses explicit initial focus and restores focus to the opener
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: refresh failure preserves the last successful snapshot while marking it unavailable
@e-pharmacy/pharmacy:test: ok 47 - refresh failure preserves the last successful snapshot while marking it unavailable
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.521275
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 0.838956
@e-pharmacy/ui:test: ok 33 - uses explicit initial focus and restores focus to the opener
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/ui:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: order A to B navigation remounts the details resource and resets transient UI state
@e-pharmacy/ui:test:   duration_ms: 2.077215
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test: ok 48 - order A to B navigation remounts the details resource and resets transient UI state
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: rejects a second concurrent logout before another request starts
@e-pharmacy/client:test: ok 43 - rejects a second concurrent logout before another request starts
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.782839
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: allows retry after an error but not duplicate loads
@e-pharmacy/client:test: ok 44 - allows retry after an error but not duplicate loads
@e-pharmacy/next-api:test:   duration_ms: 1.316172
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 62.755622
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: stale detail and mutation responses are generation-isolated
@e-pharmacy/pharmacy:test: ok 49 - stale detail and mutation responses are generation-isolated
@e-pharmacy/client:test:   ---
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects an excessive combined backend path and query URL length
@e-pharmacy/next-api:test: ok 55 - rejects an excessive combined backend path and query URL length
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.787941
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: forwards JSON bodies for POST, PATCH, PUT, and DELETE
@e-pharmacy/next-api:test: ok 56 - forwards JSON bodies for POST, PATCH, PUT, and DELETE
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 342.337843
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: uses semantic limits for small, standard, and document JSON payloads
@e-pharmacy/next-api:test: ok 57 - uses semantic limits for small, standard, and document JSON payloads
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.396057
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 10.535869
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: traps Tab in both directions and focuses the container when empty
@e-pharmacy/ui:test: ok 34 - traps Tab in both directions and focuses the container when empty
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 2.535881
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: scroll locking and background inertness remain stack-safe
@e-pharmacy/ui:test: ok 35 - scroll locking and background inertness remain stack-safe
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 1.19281
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: unmount cancels queued initial focus work
@e-pharmacy/ui:test: ok 36 - unmount cancels queued initial focus work
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 4.420632
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: restores focus to the underlying overlay when the opener was removed
@e-pharmacy/ui:test: ok 37 - restores focus to the underlying overlay when the opener was removed
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 1.230839
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: normalizes absolute seed image URLs to the current application origin
@e-pharmacy/ui:test: ok 38 - normalizes absolute seed image URLs to the current application origin
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 5.090775
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: keeps non-seed image sources unchanged
@e-pharmacy/ui:test: ok 39 - keeps non-seed image sources unchanged
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.512463
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: Order details never renders raw transport or backend Error.message values
@e-pharmacy/pharmacy:test: ok 50 - Order details never renders raw transport or backend Error.message values
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 177.692506
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: ProductPicker owns its independent product resource lifecycle outside the order coordinator
@e-pharmacy/pharmacy:test: ok 51 - ProductPicker owns its independent product resource lifecycle outside the order coordinator
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects multipart and binary media types
@e-pharmacy/next-api:test: ok 58 - rejects multipart and binary media types
@e-pharmacy/client:test:   duration_ms: 2.60962
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: connects tabs and tabpanels with unique ARIA relationships
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 63.669709
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product picker loads categories from the canonical product filters endpoint
@e-pharmacy/next-api:test:   ---
@e-pharmacy/ui:test: ok 40 - connects tabs and tabpanels with unique ARIA relationships
@e-pharmacy/ui:test:   ---
@e-pharmacy/pharmacy:test: ok 52 - product picker loads categories from the canonical product filters endpoint
@e-pharmacy/ui:test:   duration_ms: 117.358678
@e-pharmacy/next-api:test:   duration_ms: 98.824674
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 79.911773
@e-pharmacy/ui:test:   ...
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/ui:test: # Subtest: normalizes invalid current pages without accepting invalid total pages
@e-pharmacy/next-api:test: # Subtest: returns undefined for an empty mutation body
@e-pharmacy/next-api:test: ok 59 - returns undefined for an empty mutation body
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.042085
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects declared oversized small JSON bodies before buffering
@e-pharmacy/next-api:test: ok 60 - rejects declared oversized small JSON bodies before buffering
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: orders share one status summary layout across draft and persisted states
@e-pharmacy/pharmacy:test: ok 53 - orders share one status summary layout across draft and persisted states
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 91.56393
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: cancellation modal keeps mobile actions stacked and desktop actions inline
@e-pharmacy/ui:test: ok 41 - normalizes invalid current pages without accepting invalid total pages
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 5.074543
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.196984
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects actual standard JSON size even when Content-Length is spoofed smaller
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: creates a bounded pagination model for large page counts
@e-pharmacy/client:test: # Subtest: keeps client order and user presentation domain-specific
@e-pharmacy/pharmacy:test: ok 54 - cancellation modal keeps mobile actions stacked and desktop actions inline
@e-pharmacy/client:test: ok 45 - keeps client order and user presentation domain-specific
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 22.3471
@e-pharmacy/next-api:test: ok 61 - rejects actual standard JSON size even when Content-Length is spoofed smaller
@e-pharmacy/ui:test: ok 42 - creates a bounded pagination model for large page counts
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 0.798608
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   ---
@e-pharmacy/client:test:   duration_ms: 49.322134
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test:   duration_ms: 18.571104
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: product requests align status copy with metadata and expose rejection reason
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: ok 55 - product requests align status copy with metadata and expose rejection reason
@e-pharmacy/client:test: # Subtest: keeps product order information and checkout copy on canonical maps
@e-pharmacy/next-api:test: # Subtest: accepts a realistic base64-sized document payload under documentUpload limit
@e-pharmacy/next-api:test: ok 62 - accepts a realistic base64-sized document payload under documentUpload limit
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 927.953723
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects invalid UTF-8 text bodies
@e-pharmacy/next-api:test: ok 63 - rejects invalid UTF-8 text bodies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 6.004398
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 75.787489
@e-pharmacy/api:test: # Subtest: backend contract: user-name-empty
@e-pharmacy/client:test: ok 46 - keeps product order information and checkout copy on canonical maps
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 7.357207
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: active clients receive a success-toned information summary
@e-pharmacy/pharmacy:test: ok 56 - active clients receive a success-toned information summary
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: ok 53 - backend contract: user-name-empty
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.488917
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: exposes a minimal client-specific projection instead of the full auth context
@e-pharmacy/client:test: ok 47 - exposes a minimal client-specific projection instead of the full auth context
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test: # Subtest: generates trusted security headers and forwards only allowlisted context
@e-pharmacy/client:test:   duration_ms: 4.738776
@e-pharmacy/api:test: # Subtest: backend contract: user-name-min-minus-one
@e-pharmacy/next-api:test: ok 64 - generates trusted security headers and forwards only allowlisted context
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 341.420047
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: drops malformed context and never trusts browser marker, secret, request id, or IP
@e-pharmacy/pharmacy:test:   duration_ms: 60.148786
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test: ok 54 - backend contract: user-name-min-minus-one
@e-pharmacy/next-api:test: ok 65 - drops malformed context and never trusts browser marker, secret, request id, or IP
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   duration_ms: 0.680347
@e-pharmacy/client:test: # Subtest: distinguishes active pharmacy users from blocked and unauthenticated users
@e-pharmacy/next-api:test:   duration_ms: 132.166309
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: forwards the approved response header allowlist
@e-pharmacy/next-api:test: ok 66 - forwards the approved response header allowlist
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 220.016853
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client search help documents all supported identifiers
@e-pharmacy/pharmacy:test: ok 57 - client search help documents all supported identifiers
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test: ok 48 - distinguishes active pharmacy users from blocked and unauthenticated users
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.540753
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: treats active admin users as privileged viewers without enabling client features
@e-pharmacy/client:test: ok 49 - treats active admin users as privileged viewers without enabling client features
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.395594
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: user-name-min
@e-pharmacy/api:test: ok 55 - backend contract: user-name-min
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.502724
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/next-api:test: # Subtest: response header policy forwards only safe relative redirects
@e-pharmacy/next-api:test: ok 67 - response header policy forwards only safe relative redirects
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 2.569736
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: drops unsafe allowlisted values and always owns the response request id
@e-pharmacy/next-api:test: ok 68 - drops unsafe allowlisted values and always owns the response request id
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: user-name-max
@e-pharmacy/api:test: ok 56 - backend contract: user-name-max
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 55.484213
@e-pharmacy/next-api:test:   duration_ms: 2.619823
@e-pharmacy/client:test: # Subtest: review drafts are isolated by session and target owner key
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/client:test: ok 50 - review drafts are isolated by session and target owner key
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: new order uses active client badge, matching states and compact controls
@e-pharmacy/next-api:test: # Subtest: accepts a valid entity id
@e-pharmacy/client:test:   duration_ms: 2.761736
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 58 - new order uses active client badge, matching states and compact controls
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.190949
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test: ok 69 - accepts a valid entity id
@e-pharmacy/client:test:   ...
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.298203
@e-pharmacy/client:test: # Subtest: reset clears values, touched fields and submission state
@e-pharmacy/next-api:test:   duration_ms: 2.924054
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test: ok 51 - reset clears values, touched fields and submission state
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: user-name-max-plus-one
@e-pharmacy/next-api:test: # Subtest: rejects path traversal, slashes, and non-object ids
@e-pharmacy/next-api:test: ok 70 - rejects path traversal, slashes, and non-object ids
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.813331
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test:   duration_ms: 2.238605
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: public cache policy keeps volatile commerce substantially fresher than reviews and dictionaries
@e-pharmacy/client:test: ok 52 - public cache policy keeps volatile commerce substantially fresher than reviews and dictionaries
@e-pharmacy/pharmacy:test: # Subtest: order draft product and checkout presentation matches requested contracts
@e-pharmacy/api:test: ok 57 - backend contract: user-name-max-plus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.475826
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 59 - order draft product and checkout presentation matches requested contracts
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 8.4248
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: commerce, review, and dictionary readers select their domain cache presets
@e-pharmacy/client:test: ok 53 - commerce, review, and dictionary readers select their domain cache presets
@e-pharmacy/next-api:test: # Subtest: accepts only declared enum route segments
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: user-name-hyphen
@e-pharmacy/client:test:   ---
@e-pharmacy/next-api:test: ok 71 - accepts only declared enum route segments
@e-pharmacy/api:test: ok 58 - backend contract: user-name-hyphen
@e-pharmacy/client:test:   duration_ms: 16.990121
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 1.220173
@e-pharmacy/api:test:   duration_ms: 0.268522
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: user-name-cyrillic
@e-pharmacy/api:test: ok 59 - backend contract: user-name-cyrillic
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.463768
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: pharmacy-name-min-minus-one
@e-pharmacy/api:test: ok 60 - backend contract: pharmacy-name-min-minus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.518028
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: public reader injects transport while keeping route/query/envelope logic shared
@e-pharmacy/client:test: ok 54 - public reader injects transport while keeping route/query/envelope logic shared
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 13.708039
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: pharmacy-name-max
@e-pharmacy/api:test: ok 61 - backend contract: pharmacy-name-max
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test: # Subtest: pharmacy reader shares route and runtime parsing behavior
@e-pharmacy/client:test: ok 55 - pharmacy reader shares route and runtime parsing behavior
@e-pharmacy/api:test:   duration_ms: 0.816695
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 1.201622
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: backend contract: pharmacy-name-max-plus-one
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test: ok 62 - backend contract: pharmacy-name-max-plus-one
@e-pharmacy/client:test: # Subtest: SSR public reads reuse the shared next-api transient retry policy without 429 retry
@e-pharmacy/client:test: ok 56 - SSR public reads reuse the shared next-api transient retry policy without 429 retry
@e-pharmacy/client:test:   ---
@e-pharmacy/next-api:test: # Subtest: creates W3C trace context from the request id
@e-pharmacy/next-api:test: ok 72 - creates W3C trace context from the request id
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 4.243473
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 38.90499
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   duration_ms: 57.637022
@e-pharmacy/api:test:   duration_ms: 1.152926
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: keeps pharmacy status badges on typed domain maps
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test: ok 60 - keeps pharmacy status badges on typed domain maps
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 73.758506
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: keeps pharmacy app-level status pages visually aligned with client status design
@e-pharmacy/pharmacy:test: ok 61 - keeps pharmacy app-level status pages visually aligned with client status design
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 11.108623
@e-pharmacy/client:test: # Subtest: classifies semantic transport and HTTP failures
@e-pharmacy/client:test: ok 57 - classifies semantic transport and HTTP failures
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 5.075007
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: does not convert abort into an unavailable state
@e-pharmacy/client:test: ok 58 - does not convert abort into an unavailable state
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test: # Subtest: backend contract: pharmacy-name-punctuation
@e-pharmacy/api:test: ok 63 - backend contract: pharmacy-name-punctuation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.293101
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: pharmacy-name-cyrillic
@e-pharmacy/api:test: ok 64 - backend contract: pharmacy-name-cyrillic
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product details route semantics are represented by one all/own mode contract
@e-pharmacy/pharmacy:test: ok 62 - product details route semantics are represented by one all/own mode contract
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 57.498355
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test:   duration_ms: 2.010432
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: private App Router files do not perform public or direct backend server reads
@e-pharmacy/next-api:test: # Subtest: cacheable server requests keep correlation outside the application cache-key header
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.457738
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test: ok 59 - private App Router files do not perform public or direct backend server reads
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 610.540136
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses the local admin origin only outside production
@e-pharmacy/client:test: ok 60 - uses the local admin origin only outside production
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.938313
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: preserves a configured admin application base path
@e-pharmacy/pharmacy:test: # Subtest: product stock summary never turns a missing or locked offer into believable zero values
@e-pharmacy/api:test: # Subtest: backend contract: recipient-name-max
@e-pharmacy/api:test: ok 65 - backend contract: recipient-name-max
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.293101
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: recipient-name-max-plus-one
@e-pharmacy/client:test: ok 61 - preserves a configured admin application base path
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test: ok 63 - product stock summary never turns a missing or locked offer into believable zero values
@e-pharmacy/next-api:test: ok 73 - cacheable server requests keep correlation outside the application cache-key header
@e-pharmacy/api:test: ok 66 - backend contract: recipient-name-max-plus-one
@e-pharmacy/client:test:   duration_ms: 0.64742
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 309.559685
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rejects unsafe or malformed production admin application URLs
@e-pharmacy/client:test: ok 62 - rejects unsafe or malformed production admin application URLs
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.201158
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 7.283931
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: initial product details load owns only the required product request
@e-pharmacy/pharmacy:test: ok 64 - initial product details load owns only the required product request
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 93.051233
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: no-store server requests preserve x-request-id correlation
@e-pharmacy/api:test:   duration_ms: 0.380289
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: bank-name-max
@e-pharmacy/api:test: ok 67 - backend contract: bank-name-max
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.277333
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: bank-name-max-plus-one
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: related orders use backend pagination instead of a capped local dataset
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test: ok 74 - no-store server requests preserve x-request-id correlation
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.617738
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects request ids that cannot become a W3C trace id
@e-pharmacy/pharmacy:test: ok 65 - related orders use backend pagination instead of a capped local dataset
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: auth UI copy ignores arbitrary exception messages
@e-pharmacy/client:test: ok 63 - auth UI copy ignores arbitrary exception messages
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.052518
@e-pharmacy/api:test: ok 68 - backend contract: bank-name-max-plus-one
@e-pharmacy/next-api:test: ok 75 - rejects request ids that cannot become a W3C trace id
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.320927
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 50.719466
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test: # Subtest: password change maps stable credential code to allowlisted copy
@e-pharmacy/client:test: ok 64 - password change maps stable credential code to allowlisted copy
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.572289
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: classifies a client-aborted backend request separately from an upstream outage
@e-pharmacy/next-api:test: ok 76 - classifies a client-aborted backend request separately from an upstream outage
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 5.719644
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.668753
@e-pharmacy/pharmacy:test: # Subtest: stock summary never reconstructs reserved stock from related orders
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 66 - stock summary never reconstructs reserved stock from related orders
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: # Subtest: backend contract: email-normalization
@e-pharmacy/api:test: ok 69 - backend contract: email-normalization
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: document transfer timeout is explicitly separated from generic auth/private requests
@e-pharmacy/next-api:test: ok 77 - document transfer timeout is explicitly separated from generic auth/private requests
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 4.775877
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: document upload and private download proxies use the document transfer timeout
@e-pharmacy/next-api:test: ok 78 - document upload and private download proxies use the document transfer timeout
@e-pharmacy/next-api:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: allows only active client accounts
@e-pharmacy/client:test: ok 65 - allows only active client accounts
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 2.811359
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: preserves a configured pharmacy application base path
@e-pharmacy/client:test: ok 66 - preserves a configured pharmacy application base path
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.238024
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rejects missing, insecure, credentialed and same-origin production URLs
@e-pharmacy/client:test: ok 67 - rejects missing, insecure, credentialed and same-origin production URLs
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.660869
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses the local pharmacy origin only outside production
@e-pharmacy/client:test: ok 68 - uses the local pharmacy origin only outside production
@e-pharmacy/next-api:test:   duration_ms: 112.202975
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: accepts a relative backend path
@e-pharmacy/next-api:test: ok 79 - accepts a relative backend path
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 51.4179
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: supporting resources expose unavailable states instead of fake empty or zero data
@e-pharmacy/pharmacy:test: ok 67 - supporting resources expose unavailable states instead of fake empty or zero data
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 43.36736
@e-pharmacy/api:test:   duration_ms: 0.618202
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.661332
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: pharmacy login returns to a trusted pharmacy application URL
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: email-internal-space
@e-pharmacy/next-api:test:   duration_ms: 3.139706
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: rejects absolute and protocol-relative backend URLs
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: ok 69 - pharmacy login returns to a trusted pharmacy application URL
@e-pharmacy/api:test: ok 70 - backend contract: email-internal-space
@e-pharmacy/next-api:test: ok 80 - rejects absolute and protocol-relative backend URLs
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: add mutation commits its response before supporting-resource refresh and reconciles ambiguous failures
@e-pharmacy/client:test:   duration_ms: 4.921964
@e-pharmacy/api:test:   duration_ms: 0.582028
@e-pharmacy/next-api:test:   duration_ms: 1.126491
@e-pharmacy/pharmacy:test: ok 68 - add mutation commits its response before supporting-resource refresh and reconciles ambiguous failures
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 42.992636
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product list landmarks use human-readable labels and valid page title references
@e-pharmacy/pharmacy:test: ok 69 - product list landmarks use human-readable labels and valid page title references
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 73.056826
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product detail composition does not expose implementation names as accessible copy
@e-pharmacy/pharmacy:test: ok 70 - product detail composition does not expose implementation names as accessible copy
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 8.698886
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: backend contract: email-max
@e-pharmacy/next-api:test: # Subtest: rejects encoded and plain traversal
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: ok 71 - backend contract: email-max
@e-pharmacy/next-api:test: ok 81 - rejects encoded and plain traversal
@e-pharmacy/client:test: # Subtest: pharmacy login rejects foreign, malformed and double-encoded redirects
@e-pharmacy/pharmacy:test: # Subtest: article validation uses shared field semantics without a redundant success announcement
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/client:test: ok 70 - pharmacy login rejects foreign, malformed and double-encoded redirects
@e-pharmacy/pharmacy:test: ok 71 - article validation uses shared field semantics without a redundant success announcement
@e-pharmacy/next-api:test:   duration_ms: 0.868172
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: redacts sensitive query values case-insensitively
@e-pharmacy/next-api:test: ok 82 - redacts sensitive query values case-insensitively
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 15.494008
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: redacts private client search query values
@e-pharmacy/next-api:test: ok 83 - redacts private client search query values
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.488694
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: pharmacy login falls back to dashboard when no return URL was requested
@e-pharmacy/client:test: ok 71 - pharmacy login falls back to dashboard when no return URL was requested
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.316289
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 55.555633
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: does not redact ordinary name queries outside private clients
@e-pharmacy/next-api:test: ok 84 - does not redact ordinary name queries outside private clients
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.204058
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 0.89739
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 59.442005
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: backend contract: email-max-plus-one
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test: ok 72 - backend contract: email-max-plus-one
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: all products remounts from canonical server filters like the other list routes
@e-pharmacy/pharmacy:test: ok 72 - all products remounts from canonical server filters like the other list routes
@e-pharmacy/next-api:test: # Subtest: redacts private order client search values
@e-pharmacy/next-api:test: ok 85 - redacts private order client search values
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.161274
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: redacts private order comment search values
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test: ok 86 - redacts private order comment search values
@e-pharmacy/pharmacy:test:   duration_ms: 32.031492
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 1.394086
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.329275
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: email-cyrillic
@e-pharmacy/api:test: ok 73 - backend contract: email-cyrillic
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: groups cart totals once and exposes immutable output
@e-pharmacy/client:test: ok 72 - groups cart totals once and exposes immutable output
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test:   duration_ms: 0.458202
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: password-min-minus-one
@e-pharmacy/api:test: ok 74 - backend contract: password-min-minus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 100.391744
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: password-min
@e-pharmacy/pharmacy:test: # Subtest: list failures preserve loaded rows and expose an explicit error state
@e-pharmacy/next-api:test: # Subtest: does not redact ordinary comment queries outside private orders
@e-pharmacy/next-api:test: ok 87 - does not redact ordinary comment queries outside private orders
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 18.90409
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: authenticated server reads forward only access identity and remain fail-closed/no-store
@e-pharmacy/next-api:test: ok 88 - authenticated server reads forward only access identity and remain fail-closed/no-store
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 176.269204
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test: ok 75 - backend contract: password-min
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.301912
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: 1..88
@e-pharmacy/next-api:test: # tests 88
@e-pharmacy/next-api:test: # suites 0
@e-pharmacy/next-api:test: # pass 88
@e-pharmacy/next-api:test: # fail 0
@e-pharmacy/next-api:test: # cancelled 0
@e-pharmacy/next-api:test: # skipped 0
@e-pharmacy/client:test:   duration_ms: 3.205097
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 73 - list failures preserve loaded rows and expose an explicit error state
@e-pharmacy/api:test: # Subtest: backend contract: password-max
@e-pharmacy/next-api:test: # todo 0
@e-pharmacy/next-api:test: # duration_ms 75040.66916
@e-pharmacy/next-api:test: TAP version 13
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"67f8c349-c887-4ca8-8910-0a9a193f1ffa","method":"GET","path":"/problem","destination":"backend","durationMs":60,"status":409,"retryCount":0,"authMode":"public","refreshPerformed":false,"cachePolicy":"no-store","source":"public-proxy"}
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 23.011678
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: text search is debounced before request query construction
@e-pharmacy/pharmacy:test: ok 74 - text search is debounced before request query construction
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.508049
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: ok 76 - backend contract: password-max
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.192927
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: password-max-plus-one
@e-pharmacy/api:test: ok 77 - backend contract: password-max-plus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.039303
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: password-space
@e-pharmacy/api:test: ok 78 - backend contract: password-space
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.358956
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: phone-valid
@e-pharmacy/api:test: ok 79 - backend contract: phone-valid
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.924981
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: phone-without-plus
@e-pharmacy/api:test: ok 80 - backend contract: phone-without-plus
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.520811
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: phone-extra-digit
@e-pharmacy/api:test: ok 81 - backend contract: phone-extra-digit
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.327884
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: own products statistics reuse the management list response
@e-pharmacy/pharmacy:test: ok 75 - own products statistics reuse the management list response
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 76.958966
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product lists clamp pagination after mutations and server total changes
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: serializes cart writes so operation B cannot finish before A
@e-pharmacy/client:test: ok 73 - serializes cart writes so operation B cannot finish before A
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 6.19176
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"180df672-8f14-4829-8a78-dbaff77d94c1","method":"GET","path":"/api/problem","destination":"bff","durationMs":85,"status":409,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"no-store","source":"browser-api"}
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: address-min-minus-one
@e-pharmacy/pharmacy:test: ok 76 - product lists clamp pagination after mutations and server total changes
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.7826
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: list requests abort stale generations before they can overwrite newer state
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/next-api:test: # Subtest: problem+json survives API-client → local request → BFF → backend flow
@e-pharmacy/next-api:test: ok 1 - problem+json survives API-client → local request → BFF → backend flow
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 91.986886
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: login: valid backend tokens are stripped before the browser response
@e-pharmacy/pharmacy:test: ok 77 - list requests abort stale generations before they can overwrite newer state
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test: # Subtest: closing the session aborts the active write and drops queued writes
@e-pharmacy/client:test: ok 74 - closing the session aborts the active write and drops queued writes
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.945968
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: close settles an active task even when the task ignores AbortSignal
@e-pharmacy/client:test: ok 75 - close settles an active task even when the task ignores AbortSignal
@e-pharmacy/api:test: ok 82 - backend contract: address-min-minus-one
@e-pharmacy/next-api:test: ok 2 - login: valid backend tokens are stripped before the browser response
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.932396
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.975649
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: a rejected task does not block the next queued task
@e-pharmacy/client:test: ok 76 - a rejected task does not block the next queued task
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.479535
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: address-min
@e-pharmacy/api:test: ok 83 - backend contract: address-min
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.250898
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: address-max
@e-pharmacy/api:test: ok 84 - backend contract: address-max
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.23513
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test:   duration_ms: 3.608574
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: login: success without tokens is an invalid auth response
@e-pharmacy/next-api:test: ok 3 - login: success without tokens is an invalid auth response
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product management list failures expose explicit retry generations
@e-pharmacy/pharmacy:test: ok 78 - product management list failures expose explicit retry generations
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.903296
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: successful product mutations apply canonical local state without an unconditional follow-up list GET
@e-pharmacy/pharmacy:test: ok 79 - successful product mutations apply canonical local state without an unconditional follow-up list GET
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: # Subtest: backend contract: address-max-plus-one
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.477681
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: register: valid backend tokens are stripped before the browser response
@e-pharmacy/next-api:test: ok 4 - register: valid backend tokens are stripped before the browser response
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.391884
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.337846
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 4.145154
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test: # Subtest: register: success without tokens is an invalid auth response
@e-pharmacy/pharmacy:test: # Subtest: product request flow uses one explicit feature mode contract
@e-pharmacy/client:test:   ...
@e-pharmacy/next-api:test: ok 5 - register: success without tokens is an invalid auth response
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 75.218446
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: refresh: valid backend tokens are stripped before the browser response
@e-pharmacy/next-api:test: ok 6 - refresh: valid backend tokens are stripped before the browser response
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.414608
@e-pharmacy/api:test: ok 85 - backend contract: address-max-plus-one
@e-pharmacy/pharmacy:test: ok 80 - product request flow uses one explicit feature mode contract
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 91.418308
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: clone mode accepts rejected sources only and never copies server-managed request state
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: refresh: success without tokens is an invalid auth response
@e-pharmacy/next-api:test: ok 7 - refresh: success without tokens is an invalid auth response
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 0.595014
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"login-request","method":"POST","path":"/auth/login","destination":"backend","durationMs":70,"status":200,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"register-request","method":"POST","path":"/auth/register","destination":"backend","durationMs":6,"status":200,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/client:test: # Subtest: models initial load, success and refresh without ambiguous flags
@e-pharmacy/client:test: ok 77 - models initial load, success and refresh without ambiguous flags
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.568691
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: load failure preserves the last confirmed cart only
@e-pharmacy/client:test: ok 78 - load failure preserves the last confirmed cart only
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.569043
@e-pharmacy/pharmacy:test: ok 81 - clone mode accepts rejected sources only and never copies server-managed request state
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"refresh-request","method":"POST","path":"/auth/refresh","destination":"backend","durationMs":5,"status":200,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 41.198783
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: request entity generations remount local state and abort async work
@e-pharmacy/pharmacy:test: ok 82 - request entity generations remount local state and abort async work
@e-pharmacy/api:test:   duration_ms: 0.272232
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"invalid-auth-response","method":"POST","path":"/auth/login","destination":"backend","durationMs":3,"status":502,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"INVALID_BACKEND_RESPONSE","source":"auth-proxy"}
@e-pharmacy/client:test: # Subtest: a new session starts idle without resurrecting the previous cart
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test: ok 79 - a new session starts idle without resurrecting the previous cart
@e-pharmacy/pharmacy:test:   duration_ms: 5.798485
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"invalid-auth-response","method":"POST","path":"/auth/login","destination":"backend","durationMs":1,"status":502,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"INVALID_BACKEND_RESPONSE","source":"auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-success","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":3,"status":200,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-invalid-token","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":4,"status":400,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-expired-token","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":1,"status":400,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.632579
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: does not carry a previous owner cart into loading or error state
@e-pharmacy/client:test: ok 80 - does not carry a previous owner cart into loading or error state
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request mutations wait for every file reader and share one mutation lock
@e-pharmacy/pharmacy:test: ok 83 - product request mutations wait for every file reader and share one mutation lock
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 60.949248
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-validation","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":59,"status":400,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-backend-error","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":2,"status":500,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","source":"auth-proxy"}
@e-pharmacy/client:test:   duration_ms: 0.437796
@e-pharmacy/api-client:test: ok 1 - uses resource-oriented backend route builders
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 6.252513
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects unsafe or already encoded route segments
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api-client:test: ok 2 - rejects unsafe or already encoded route segments
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   ...
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api:test: # Subtest: backend contract: address-cyrillic
@e-pharmacy/client:test: # Subtest: reports stock conflicts without masking the server quantity
@e-pharmacy/api-client:test:   duration_ms: 2.505736
@e-pharmacy/api:test: ok 86 - backend contract: address-cyrillic
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.355246
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: review-min-minus-one
@e-pharmacy/api:test: ok 87 - backend contract: review-min-minus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.455883
@e-pharmacy/client:test: ok 81 - reports stock conflicts without masking the server quantity
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: parses success envelopes and rejects HTTP-200 error envelopes
@e-pharmacy/api-client:test: ok 3 - parses success envelopes and rejects HTTP-200 error envelopes
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 9.414479
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: requires the data field while preserving explicit nullable data
@e-pharmacy/api-client:test: ok 4 - requires the data field while preserving explicit nullable data
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.738781
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: parses empty JSON success separately from data envelopes
@e-pharmacy/api-client:test: ok 5 - parses empty JSON success separately from data envelopes
@e-pharmacy/pharmacy:test: # Subtest: article checking separates conflict from transport failure without rendering success copy
@e-pharmacy/pharmacy:test: ok 84 - article checking separates conflict from transport failure without rendering success copy
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 9.666769
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: scoped product and request actions never surface raw Error.message
@e-pharmacy/pharmacy:test: ok 85 - scoped product and request actions never surface raw Error.message
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 2.630025
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: detects the cart pharmacy limit by stable API error code
@e-pharmacy/client:test: ok 82 - detects the cart pharmacy limit by stable API error code
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.39014
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.725333
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: legacy array messages include only non-empty strings
@e-pharmacy/api-client:test: ok 6 - legacy array messages include only non-empty strings
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.805564
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 104.644028
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: does not infer the cart limit from mutable English copy
@e-pharmacy/client:test: ok 83 - does not infer the cart limit from mutable English copy
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   duration_ms: 0.479535
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request page mode is explicit for new and clone flows
@e-pharmacy/pharmacy:test: ok 86 - product request page mode is explicit for new and clone flows
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 6.683353
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api-client:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api-client:test: # Subtest: normalizes the canonical pagination response and empty-page contract
@e-pharmacy/api:test: # Subtest: backend contract: review-min
@e-pharmacy/client:test:   ...
@e-pharmacy/api-client:test: ok 7 - normalizes the canonical pagination response and empty-page contract
@e-pharmacy/api:test: ok 88 - backend contract: review-min
@e-pharmacy/client:test: # Subtest: normalizes Ukrainian cities without collapsing distinct values
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test: ok 84 - normalizes Ukrainian cities without collapsing distinct values
@e-pharmacy/api-client:test:   duration_ms: 6.038252
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects non-canonical empty pages unless explicit legacy normalization is enabled
@e-pharmacy/api-client:test: ok 8 - rejects non-canonical empty pages unless explicit legacy normalization is enabled
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.028637
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: supports only explicitly declared legacy item keys and reports their use
@e-pharmacy/api-client:test: ok 9 - supports only explicitly declared legacy item keys and reports their use
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.244405
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: review-max
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 38.273801
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: accepts only canonical safe positive page values
@e-pharmacy/client:test: ok 85 - accepts only canonical safe positive page values
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.720695
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rejects excessive catch-all segment counts before parsing the full URL
@e-pharmacy/client:test: ok 86 - rejects excessive catch-all segment counts before parsing the full URL
@e-pharmacy/client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.908985
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects duplicate item arrays and invalid alias configuration
@e-pharmacy/api-client:test: ok 10 - rejects duplicate item arrays and invalid alias configuration
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api:test: ok 89 - backend contract: review-max
@e-pharmacy/client:test:   duration_ms: 3.256575
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: reports duplicate, malformed and unknown product segments
@e-pharmacy/client:test: ok 87 - reports duplicate, malformed and unknown product segments
@e-pharmacy/validation:test: ok 1 - parses a complete AuthResponse at the browser boundary
@e-pharmacy/api-client:test:   duration_ms: 2.278026
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 0.947013
@e-pharmacy/validation:test:   duration_ms: 10.694478
@e-pharmacy/api-client:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api-client:test: # Subtest: does not silently turn malformed payloads or items into an empty page
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: accepts a future database category slug without compile-time membership
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: accepts every declared role and status combination
@e-pharmacy/validation:test: ok 2 - accepts every declared role and status combination
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.69507
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.166493
@e-pharmacy/api-client:test: ok 11 - does not silently turn malformed payloads or items into an empty page
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/api-client:test:   duration_ms: 0.81484
@e-pharmacy/validation:test: # Subtest: rejects malformed users before they reach AuthProviderCore
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/validation:test: ok 3 - rejects malformed users before they reach AuthProviderCore
@e-pharmacy/api-client:test:   ...
@e-pharmacy/client:test: ok 88 - accepts a future database category slug without compile-time membership
@e-pharmacy/api-client:test: # Subtest: rejects unsafe integers, overflow and inconsistent pagination metadata
@e-pharmacy/client:test:   ---
@e-pharmacy/api-client:test: ok 12 - rejects unsafe integers, overflow and inconsistent pagination metadata
@e-pharmacy/client:test:   duration_ms: 0.752694
@e-pharmacy/api-client:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 26.278457
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: does not preserve unverified response fields
@e-pharmacy/validation:test: ok 4 - does not preserve unverified response fields
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.615419
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: backend contract: review-max-plus-one
@e-pharmacy/api:test: ok 90 - backend contract: review-max-plus-one
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: reports duplicate and unknown pharmacy segments
@e-pharmacy/client:test: ok 89 - reports duplicate and unknown pharmacy segments
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.778665
@e-pharmacy/api:test:   duration_ms: 0.268985
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test: # Subtest: builds typed canonical pharmacy filter paths and recognizes legacy paths
@e-pharmacy/api:test: # Subtest: backend contract: review-cyrillic
@e-pharmacy/client:test: ok 90 - builds typed canonical pharmacy filter paths and recognizes legacy paths
@e-pharmacy/api:test: ok 91 - backend contract: review-cyrillic
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: registration, login and password recovery use the same auth boundaries
@e-pharmacy/validation:test: ok 5 - registration, login and password recovery use the same auth boundaries
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 5.135761
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: password reset requires matching valid passwords and a token
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.8371
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: order-comment-empty
@e-pharmacy/api:test: ok 92 - backend contract: order-comment-empty
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.048461
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: order-comment-max
@e-pharmacy/api-client:test:   duration_ms: 194.262918
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 2.937503
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/validation:test: ok 6 - password reset requires matching valid passwords and a token
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 2.608692
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: payment purpose has its own semantic pattern
@e-pharmacy/validation:test: ok 7 - payment purpose has its own semantic pattern
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 3.25101
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test: ok 93 - backend contract: order-comment-max
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: captures normalizer exceptions and preserves request context in ApiError
@e-pharmacy/api-client:test: ok 13 - captures normalizer exceptions and preserves request context in ApiError
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: working hours require exactly one entry for every day
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: keeps availability independent from the selected pharmacy
@e-pharmacy/client:test: ok 91 - keeps availability independent from the selected pharmacy
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.532405
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.397331
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test: ok 8 - working hours require exactly one entry for every day
@e-pharmacy/api-client:test: # Subtest: surfaces legacy normalization metadata to an optional reporter
@e-pharmacy/api:test:   duration_ms: 0.312116
@e-pharmacy/client:test: # Subtest: redirects stale catalog pages to the last available page
@e-pharmacy/client:test: ok 92 - redirects stale catalog pages to the last available page
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.871883
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses semantic, neutral catalog SEO content
@e-pharmacy/client:test: ok 93 - uses semantic, neutral catalog SEO content
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 2.086026
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: treats known pharmacy catalog prefixes as catalog segments before legacy detail lookup
@e-pharmacy/client:test: ok 94 - treats known pharmacy catalog prefixes as catalog segments before legacy detail lookup
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.532869
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 3.60672
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: uses path filters as canonical authority and query filters only as compatibility input
@e-pharmacy/client:test: ok 95 - uses path filters as canonical authority and query filters only as compatibility input
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.440925
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: drops duplicate query values and recognizes any query form as compatibility input
@e-pharmacy/client:test: ok 96 - drops duplicate query values and recognizes any query form as compatibility input
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.439651
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api-client:test: ok 14 - surfaces legacy normalization metadata to an optional reporter
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test: # Subtest: pharmacy noindex canonical keeps only the indexed city dimension
@e-pharmacy/client:test: ok 97 - pharmacy noindex canonical keeps only the indexed city dimension
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.803591
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rapid typing commits only the latest draft
@e-pharmacy/client:test: ok 98 - rapid typing commits only the latest draft
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 59.782409
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.876057
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: parses an endpoint DTO only after validating the success envelope
@e-pharmacy/api-client:test: ok 15 - parses an endpoint DTO only after validating the success envelope
@e-pharmacy/validation:test: # Subtest: calendar dates reject impossible dates and inverted ranges
@e-pharmacy/validation:test: ok 9 - calendar dates reject impossible dates and inverted ranges
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.91536
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: picture transport distinguishes data URLs, HTTP URLs and blob previews
@e-pharmacy/validation:test: ok 10 - picture transport distinguishes data URLs, HTTP URLs and blob previews
@e-pharmacy/client:test: # Subtest: reset or unmount cancels a stale pending search
@e-pharmacy/client:test: ok 99 - reset or unmount cancels a stale pending search
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 60.85093
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: a later search can be scheduled after cancellation
@e-pharmacy/client:test: ok 100 - a later search can be scheduled after cancellation
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 10.682884
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects invalid endpoint DTO fields instead of trusting a generic type
@e-pharmacy/api-client:test: ok 16 - rejects invalid endpoint DTO fields instead of trusting a generic type
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 6.121267
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: pharmacy draft and verification validation modes are explicit
@e-pharmacy/validation:test: ok 11 - pharmacy draft and verification validation modes are explicit
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 4.840341
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: pharmacy payment normalization lowercases email and uppercases IBAN
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 44.516575
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.036984
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: validates shared pagination response contracts
@e-pharmacy/api-client:test: ok 17 - validates shared pagination response contracts
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 4.879761
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/validation:test: ok 12 - pharmacy payment normalization lowercases email and uppercases IBAN
@e-pharmacy/validation:test:   ---
@e-pharmacy/client:test: # Subtest: detects committed route changes from Back or server navigation
@e-pharmacy/api:test: # Subtest: backend contract: order-comment-max-plus-one
@e-pharmacy/validation:test:   duration_ms: 1.156173
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: pharmacy document validation checks count, MIME, extension and size
@e-pharmacy/validation:test: ok 13 - pharmacy document validation checks count, MIME, extension and size
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.968693
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: password validation reports spaces without changing the input
@e-pharmacy/validation:test: ok 14 - password validation reports spaces without changing the input
@e-pharmacy/client:test: ok 101 - detects committed route changes from Back or server navigation
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.683593
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: cleanup remains idempotent under Strict Mode effect replay
@e-pharmacy/api:test: ok 94 - backend contract: order-comment-max-plus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.383072
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: payment-purpose-empty
@e-pharmacy/api:test: ok 95 - backend contract: payment-purpose-empty
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.397913
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: payment-purpose-valid
@e-pharmacy/api:test: ok 96 - backend contract: payment-purpose-valid
@e-pharmacy/api:test:   ---
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 3.554778
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: email normalization trims surrounding whitespace and lowercases
@e-pharmacy/validation:test: ok 15 - email normalization trims surrounding whitespace and lowercases
@e-pharmacy/client:test: ok 102 - cleanup remains idempotent under Strict Mode effect replay
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.205913
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: payment-purpose-max
@e-pharmacy/api:test: ok 97 - backend contract: payment-purpose-max
@e-pharmacy/api-client:test: # Subtest: distinguishes empty success envelopes from data envelopes
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.937274
@e-pharmacy/api:test:   ---
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 0.71142
@e-pharmacy/api:test:   duration_ms: 0.246724
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/validation:test: # Subtest: IBAN normalization removes spaces and uppercases the value
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: preserves independent degraded states for product catalog resources
@e-pharmacy/client:test: ok 103 - preserves independent degraded states for product catalog resources
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 5.10979
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: does not represent a pharmacy filter outage as an available empty list
@e-pharmacy/client:test: ok 104 - does not represent a pharmacy filter outage as an available empty list
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 2.140286
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: payment-purpose-max-plus-one
@e-pharmacy/api:test: ok 98 - backend contract: payment-purpose-max-plus-one
@e-pharmacy/api-client:test: ok 18 - distinguishes empty success envelopes from data envelopes
@e-pharmacy/validation:test: ok 16 - IBAN normalization removes spaces and uppercases the value
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: keeps unavailable product state exclusive from empty results
@e-pharmacy/client:test: ok 105 - keeps unavailable product state exclusive from empty results
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.981678
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/api-client:test:   ---
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.573681
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: phone input normalization removes presentation formatting only
@e-pharmacy/validation:test: ok 17 - phone input normalization removes presentation formatting only
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.779593
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: phone input normalization does not hide invalid values
@e-pharmacy/api:test:   duration_ms: 0.626549
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: payment-purpose-cyrillic
@e-pharmacy/api:test: ok 99 - backend contract: payment-purpose-cyrillic
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.383536
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: iban-normalization
@e-pharmacy/api-client:test:   duration_ms: 0.941448
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test: ok 18 - phone input normalization does not hide invalid values
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.695651
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: English-only text validation rejects Cyrillic without sanitizing it
@e-pharmacy/api:test: ok 100 - backend contract: iban-normalization
@e-pharmacy/client:test: # Subtest: classifies filtered empty results separately from an empty catalog
@e-pharmacy/client:test: ok 106 - classifies filtered empty results separately from an empty catalog
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.572752
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: checkout fingerprint is stable for an unchanged group
@e-pharmacy/validation:test: ok 19 - English-only text validation rejects Cyrillic without sanitizing it
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 2.085099
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: domain name validators accept English and reject Cyrillic
@e-pharmacy/validation:test: ok 20 - domain name validators accept English and reject Cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 2.087418
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.390956
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: iban-invalid-letter
@e-pharmacy/api:test: ok 101 - backend contract: iban-invalid-letter
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.464695
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: iban-max-plus-one
@e-pharmacy/api:test: ok 102 - backend contract: iban-max-plus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.31026
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: working-hours-valid
@e-pharmacy/api:test: ok 103 - backend contract: working-hours-valid
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.704345
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: working-hours-free-text
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-empty
@e-pharmacy/validation:test: ok 21 - frontend contract: user-name-empty
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 5.93947
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-min-minus-one
@e-pharmacy/validation:test: ok 22 - frontend contract: user-name-min-minus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: validates active sessions at runtime
@e-pharmacy/api-client:test: ok 19 - validates active sessions at runtime
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 8.523582
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api:test: ok 104 - backend contract: working-hours-free-text
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.628517
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: working-hours-missing-day
@e-pharmacy/api:test: ok 105 - backend contract: working-hours-missing-day
@e-pharmacy/validation:test:   duration_ms: 0.412289
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-min
@e-pharmacy/validation:test: ok 23 - frontend contract: user-name-min
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.465622
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-max
@e-pharmacy/validation:test: ok 24 - frontend contract: user-name-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.357101
@e-pharmacy/api-client:test: # Subtest: accepts dynamic product categories by canonical shape instead of hardcoded membership
@e-pharmacy/api-client:test: ok 20 - accepts dynamic product categories by canonical shape instead of hardcoded membership
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 2.824808
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: accepts dynamic category filter options and still rejects malformed slugs
@e-pharmacy/api-client:test: ok 21 - accepts dynamic category filter options and still rejects malformed slugs
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 2.459359
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.624695
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: working-hours-duplicate-day
@e-pharmacy/api:test: ok 106 - backend contract: working-hours-duplicate-day
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.400231
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: working-hours-inverted-range
@e-pharmacy/api:test: ok 107 - backend contract: working-hours-inverted-range
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.38539
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-max-plus-one
@e-pharmacy/validation:test: ok 25 - frontend contract: user-name-max-plus-one
@e-pharmacy/api:test: # Subtest: backend contract: working-hours-all-closed
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api:test: ok 108 - backend contract: working-hours-all-closed
@e-pharmacy/api-client:test: # Subtest: requires backend-provided typed public slug IDs
@e-pharmacy/api:test:   ---
@e-pharmacy/api-client:test: ok 22 - requires backend-provided typed public slug IDs
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 16.951628
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: strictly validates transactional cart responses
@e-pharmacy/api-client:test: ok 23 - strictly validates transactional cart responses
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 44.506373
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-outage","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":2,"status":502,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"BAD_GATEWAY","source":"auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"reset-timeout","method":"POST","path":"/auth/password-reset/confirm","destination":"backend","durationMs":0,"status":504,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"GATEWAY_TIMEOUT","source":"auth-proxy"}
@e-pharmacy/api:test:   duration_ms: 0.354782
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"logout-outage","method":"POST","path":"/auth/logout","destination":"backend","durationMs":2,"status":502,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"BAD_GATEWAY","source":"auth-proxy"}
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects inconsistent pharmacy metadata across one cart group
@e-pharmacy/api-client:test: ok 24 - rejects inconsistent pharmacy metadata across one cart group
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 24.442401
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: existing draft and non-draft requests resolve to edit and readonly modes
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"oversized-login","method":"POST","path":"/auth/login","destination":"backend","durationMs":1,"status":413,"retryCount":0,"authMode":"auth","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"PAYLOAD_TOO_LARGE","source":"auth-proxy"}
@e-pharmacy/next-api:test: # Subtest: login/register/refresh strip valid tokens and set httpOnly cookies
@e-pharmacy/next-api:test: ok 8 - login/register/refresh strip valid tokens and set httpOnly cookies
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 107.840314
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: transformed proxy responses drop stale representation headers
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test: # Subtest: validates cart cleanup issues instead of silently dropping them
@e-pharmacy/pharmacy:test: ok 87 - existing draft and non-draft requests resolve to edit and readonly modes
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.470724
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request generation keys isolate existing, clone, and new lifecycles
@e-pharmacy/pharmacy:test: ok 88 - product request generation keys isolate existing, clone, and new lifecycles
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.476289
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test: ok 9 - transformed proxy responses drop stale representation headers
@e-pharmacy/validation:test:   duration_ms: 0.322318
@e-pharmacy/api-client:test: ok 25 - validates cart cleanup issues instead of silently dropping them
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 10.526594
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-hyphen
@e-pharmacy/validation:test: ok 26 - frontend contract: user-name-hyphen
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pristine profile draft follows a newer canonical provider value
@e-pharmacy/pharmacy:test: ok 89 - pristine profile draft follows a newer canonical provider value
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 2.950488
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: dirty profile draft is left untouched when provider refreshes
@e-pharmacy/pharmacy:test: ok 90 - dirty profile draft is left untouched when provider refreshes
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.508289
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api-client:test:   ...
@e-pharmacy/validation:test:   duration_ms: 0.283825
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: owner profile PATCH responses update AuthUser directly without a follow-up current-user GET
@e-pharmacy/next-api:test:   duration_ms: 8.295409
@e-pharmacy/api-client:test: # Subtest: strictly validates pharmacy profile documents, status, dates and nested data
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 91 - owner profile PATCH responses update AuthUser directly without a follow-up current-user GET
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api-client:test: ok 26 - strictly validates pharmacy profile documents, status, dates and nested data
@e-pharmacy/validation:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api-client:test:   ---
@e-pharmacy/validation:test: # Subtest: frontend contract: user-name-cyrillic
@e-pharmacy/pharmacy:test:   duration_ms: 25.020719
@e-pharmacy/validation:test: ok 27 - frontend contract: user-name-cyrillic
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api-client:test:   duration_ms: 6.370774
@e-pharmacy/next-api:test: # Subtest: secret mismatch or missing/malformed tokens becomes a controlled 502
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/next-api:test: ok 10 - secret mismatch or missing/malformed tokens becomes a controlled 502
@e-pharmacy/validation:test:   duration_ms: 0.392811
@e-pharmacy/pharmacy:test: # Subtest: active pharmacy moderation uses one atomic browser command and supports already-saved pending changes
@e-pharmacy/api-client:test:   ...
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test: ok 92 - active pharmacy moderation uses one atomic browser command and supports already-saved pending changes
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api-client:test: # Subtest: validates pharmacy registration upload-session responses
@e-pharmacy/next-api:test:   duration_ms: 13.870357
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: pharmacy-name-min-minus-one
@e-pharmacy/validation:test: ok 28 - frontend contract: pharmacy-name-min-minus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.606608
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: pharmacy-name-max
@e-pharmacy/validation:test: ok 29 - frontend contract: pharmacy-name-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.252636
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: pharmacy-name-max-plus-one
@e-pharmacy/validation:test: ok 30 - frontend contract: pharmacy-name-max-plus-one
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.827702
@e-pharmacy/next-api:test:   ...
@e-pharmacy/validation:test:   duration_ms: 1.273969
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: pharmacy-name-punctuation
@e-pharmacy/validation:test: ok 31 - frontend contract: pharmacy-name-punctuation
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.424811
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: pharmacy-name-cyrillic
@e-pharmacy/validation:test: ok 32 - frontend contract: pharmacy-name-cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.350608
@e-pharmacy/api-client:test: ok 27 - validates pharmacy registration upload-session responses
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pharmacy profile mutations use scoped synchronous mutex refs
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/next-api:test: # Subtest: password reset cleanup clears cookies only after a successful reset
@e-pharmacy/next-api:test: ok 11 - password reset cleanup clears cookies only after a successful reset
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 84.664462
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: logout cleanup remains unconditional when backend transport fails
@e-pharmacy/next-api:test: ok 12 - logout cleanup remains unconditional when backend transport fails
@e-pharmacy/api-client:test:   ---
@e-pharmacy/pharmacy:test: ok 93 - pharmacy profile mutations use scoped synchronous mutex refs
@e-pharmacy/validation:test: # Subtest: frontend contract: recipient-name-max
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.011013
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: ok 33 - frontend contract: recipient-name-max
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: validates controlled pharmacy registration upload responses
@e-pharmacy/api-client:test: ok 28 - validates controlled pharmacy registration upload responses
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.706782
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: current pharmacy summary accepts only compact application-wide fields
@e-pharmacy/api-client:test: ok 29 - current pharmacy summary accepts only compact application-wide fields
@e-pharmacy/pharmacy:test:   duration_ms: 11.56636
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: profile comments count preloads and the tab reuses the first comments page
@e-pharmacy/pharmacy:test: ok 94 - profile comments count preloads and the tab reuses the first comments page
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.442898
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: recipient-name-max-plus-one
@e-pharmacy/validation:test: ok 34 - frontend contract: recipient-name-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.290319
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: bank-name-max
@e-pharmacy/validation:test: ok 35 - frontend contract: bank-name-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.541216
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: current pharmacy summary rejects private profile fields
@e-pharmacy/api-client:test: ok 30 - current pharmacy summary rejects private profile fields
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.055535
@e-pharmacy/next-api:test:   duration_ms: 4.323704
@e-pharmacy/api-client:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 39.89606
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api-client:test:   duration_ms: 0.559303
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: bank-name-max-plus-one
@e-pharmacy/next-api:test: # Subtest: auth proxy rejects oversized login JSON before any backend request
@e-pharmacy/api-client:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: active sessions distinguish load errors from a real empty result and expose retry
@e-pharmacy/validation:test: ok 36 - frontend contract: bank-name-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.247188
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: email-normalization
@e-pharmacy/validation:test: ok 37 - frontend contract: email-normalization
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.656231
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: email-internal-space
@e-pharmacy/validation:test: ok 38 - frontend contract: email-internal-space
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.397912
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: email-max
@e-pharmacy/validation:test: ok 39 - frontend contract: email-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.211478
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: email-max-plus-one
@e-pharmacy/validation:test: ok 40 - frontend contract: email-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.290319
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/api-client:test: # Subtest: preserves transport, HTTP, backend and request diagnostic fields
@e-pharmacy/api-client:test: ok 31 - preserves transport, HTTP, backend and request diagnostic fields
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 5.372746
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 95 - active sessions distinguish load errors from a real empty result and expose retry
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 37.244238
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: email-cyrillic
@e-pharmacy/validation:test: ok 41 - frontend contract: email-cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.339478
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: password-min-minus-one
@e-pharmacy/validation:test: ok 42 - frontend contract: password-min-minus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.36684
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/next-api:test: ok 13 - auth proxy rejects oversized login JSON before any backend request
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 3.676284
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-refresh-success","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":84,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":true,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/pharmacy:test: # Subtest: profile tabs use the shared TabPanel contract without eagerly mounting tab resources
@e-pharmacy/pharmacy:test: ok 96 - profile tabs use the shared TabPanel contract without eagerly mounting tab resources
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.979354
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: profile save sections use native form submission and current-account copy
@e-pharmacy/pharmacy:test: ok 97 - profile save sections use native form submission and current-account copy
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 40.827769
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: cabinet summary is provider-owned while full profile stays feature-owned
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: does not accept permissive status-shaped objects as ApiError
@e-pharmacy/api-client:test: ok 32 - does not accept permissive status-shaped objects as ApiError
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.415535
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: safe message extraction ignores objects, numbers and blank strings
@e-pharmacy/api-client:test: ok 33 - safe message extraction ignores objects, numbers and blank strings
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.851013
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-pre-refresh-success","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":8,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":true,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/validation:test: # Subtest: frontend contract: password-min
@e-pharmacy/pharmacy:test: ok 98 - cabinet summary is provider-owned while full profile stays feature-owned
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 143.609771
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: list and detail effects use AbortController rather than mounted flags
@e-pharmacy/pharmacy:test: ok 99 - list and detail effects use AbortController rather than mounted flags
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 13.955227
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-refresh-invalid","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":62,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":true,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/pharmacy:test: # Subtest: URL filters use shared timing hooks and header delegates dropdown lifecycle to shared Cabinet UI
@e-pharmacy/pharmacy:test: ok 100 - URL filters use shared timing hooks and header delegates dropdown lifecycle to shared Cabinet UI
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 81.3578
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: sidebar storage and breadcrumb dispatch remain hydration and timer safe
@e-pharmacy/pharmacy:test: ok 101 - sidebar storage and breadcrumb dispatch remain hydration and timer safe
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 66.988429
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test: ok 43 - frontend contract: password-min
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: requires configured requests at compile time and supports a configured factory
@e-pharmacy/api-client:test: ok 34 - requires configured requests at compile time and supports a configured factory
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 218.369087
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-refresh-malformed","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":9,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":true,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-refresh-outage","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":8,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":true,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-no-refresh","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":5,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":false,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/validation:test:   duration_ms: 0.297739
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: password-max
@e-pharmacy/validation:test: ok 44 - frontend contract: password-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.490666
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: password-max-plus-one
@e-pharmacy/validation:test: ok 45 - frontend contract: password-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.284753
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"optional-anonymous","method":"GET","path":"/products/507f1f77bcf86cd799439011","destination":"backend","durationMs":1,"status":200,"retryCount":0,"authMode":"optional","refreshPerformed":false,"cachePolicy":"default","source":"optional-auth-proxy"}
@e-pharmacy/next-api:test: # Subtest: expired access + valid refresh returns personalized optional data
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: password-space
@e-pharmacy/validation:test: ok 46 - frontend contract: password-space
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.188753
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api-client:test: # Subtest: validates base URLs and preserves their pathname
@e-pharmacy/api-client:test: ok 35 - validates base URLs and preserves their pathname
@e-pharmacy/api-client:test:   ---
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api-client:test:   duration_ms: 1.1251
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects unsafe API paths including fragments
@e-pharmacy/api-client:test: ok 36 - rejects unsafe API paths including fragments
@e-pharmacy/next-api:test: ok 14 - expired access + valid refresh returns personalized optional data
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 185.823741
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: missing access + valid refresh pre-refreshes before optional detail read
@e-pharmacy/next-api:test: ok 15 - missing access + valid refresh pre-refreshes before optional detail read
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 12.490185
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: invalid refresh clears cookies and falls back to public data
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: phone-valid
@e-pharmacy/validation:test: ok 47 - frontend contract: phone-valid
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.482782
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: phone-without-plus
@e-pharmacy/validation:test: ok 48 - frontend contract: phone-without-plus
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.262492
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: phone-extra-digit
@e-pharmacy/validation:test: ok 49 - frontend contract: phone-extra-digit
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.178551
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: address-min-minus-one
@e-pharmacy/validation:test: ok 50 - frontend contract: address-min-minus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.37426
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: address-min
@e-pharmacy/validation:test: ok 51 - frontend contract: address-min
@e-pharmacy/pharmacy:test: # Subtest: comments error state retries the exact failed page
@e-pharmacy/next-api:test: ok 16 - invalid refresh clears cookies and falls back to public data
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 66.153647
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 102 - comments error state retries the exact failed page
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: malformed refresh response clears cookies before public fallback
@e-pharmacy/ui:test: # Subtest: profile identity presentation stays domain-neutral
@e-pharmacy/next-api:test: ok 17 - malformed refresh response clears cookies before public fallback
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 13.931575
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api-client:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 96.152446
@e-pharmacy/ui:test: ok 43 - profile identity presentation stays domain-neutral
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 87.678486
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: profile tabs layout preserves canonical tab relationships
@e-pharmacy/ui:test: ok 44 - profile tabs layout preserves canonical tab relationships
@e-pharmacy/ui:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: temporary refresh outage preserves cookies and falls back to public data
@e-pharmacy/next-api:test: ok 18 - temporary refresh outage preserves cookies and falls back to public data
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/ui:test:   duration_ms: 10.658304
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: read-only documents panel does not expose upload controls
@e-pharmacy/ui:test: ok 45 - read-only documents panel does not expose upload controls
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 12.373316
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: active sessions panel renders auth sessions without app-specific copy
@e-pharmacy/ui:test: ok 46 - active sessions panel renders auth sessions without app-specific copy
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 64.47991
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: active sessions panel supports client-compatible IP and date copy
@e-pharmacy/ui:test: ok 47 - active sessions panel supports client-compatible IP and date copy
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 11.534824
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: missing refresh cookie clears stale access state before public fallback
@e-pharmacy/next-api:test: ok 19 - missing refresh cookie clears stale access state before public fallback
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pharmacy browser read adapters expose only the narrow read options contract
@e-pharmacy/pharmacy:test: ok 103 - pharmacy browser read adapters expose only the narrow read options contract
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 4.791182
@e-pharmacy/api-client:test:   duration_ms: 1.843476
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 5.719644
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: shared password form includes explicit password confirmation
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: supports JSON media types including structured +json and valid null
@e-pharmacy/api-client:test: ok 37 - supports JSON media types including structured +json and valid null
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 7.32799
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 8.283351
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: no auth cookies performs exactly one anonymous detail request
@e-pharmacy/next-api:test: ok 20 - no auth cookies performs exactly one anonymous detail request
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/ui:test: ok 48 - shared password form includes explicit password confirmation
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 16.234644
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 4.889964
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"download-request","method":"GET","path":"/pharmacies/me/documents/abc","destination":"backend","durationMs":70,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"download-error","method":"GET","path":"/pharmacies/me/documents/abc","destination":"backend","durationMs":6,"status":404,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/api-client:test:   ...
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: # Subtest: shared password form can preserve legacy two-field profile flows
@e-pharmacy/ui:test: ok 49 - shared password form can preserve legacy two-field profile flows
@e-pharmacy/ui:test:   ---
@e-pharmacy/ui:test:   duration_ms: 78.86134
@e-pharmacy/next-api:test: # Subtest: private document download streams binary data with no-store and safe headers
@e-pharmacy/next-api:test: ok 21 - private document download streams binary data with no-store and safe headers
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api-client:test: # Subtest: distinguishes non-JSON and malformed JSON responses
@e-pharmacy/api-client:test: ok 38 - distinguishes non-JSON and malformed JSON responses
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 9.513262
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: separates strict no-content from JSON success envelopes
@e-pharmacy/api-client:test: ok 39 - separates strict no-content from JSON success envelopes
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 9.638016
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/ui:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 98.37853
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: private document download preserves canonical JSON errors
@e-pharmacy/next-api:test: ok 22 - private document download preserves canonical JSON errors
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 11.402651
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"wrong-envelope","method":"GET","path":"/products","destination":"backend","durationMs":80,"status":502,"retryCount":0,"authMode":"public","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"INVALID_BACKEND_RESPONSE","source":"public-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"malformed-public-response","method":"GET","path":"/products","destination":"backend","durationMs":3,"status":502,"retryCount":0,"authMode":"public","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"INVALID_BACKEND_RESPONSE","source":"public-proxy"}
@e-pharmacy/pharmacy:test: # Subtest: aggregate statistics helpers cannot widen browser transport options
@e-pharmacy/pharmacy:test: ok 104 - aggregate statistics helpers cannot widen browser transport options
@e-pharmacy/ui:test:   ...
@e-pharmacy/ui:test: 1..49
@e-pharmacy/ui:test: # tests 49
@e-pharmacy/ui:test: # suites 0
@e-pharmacy/ui:test: # pass 49
@e-pharmacy/ui:test: # fail 0
@e-pharmacy/api-client:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"malformed-public-response","method":"GET","path":"/products","destination":"backend","durationMs":1,"status":502,"retryCount":0,"authMode":"public","refreshPerformed":false,"cachePolicy":"default","transportErrorCode":"INVALID_BACKEND_RESPONSE","source":"public-proxy"}
@e-pharmacy/next-api:test: # Subtest: wrong 2xx envelope becomes 502 and is never public-cacheable
@e-pharmacy/next-api:test: ok 23 - wrong 2xx envelope becomes 502 and is never public-cacheable
@e-pharmacy/api-client:test: # Subtest: separates backend error semantics from transport errors
@e-pharmacy/api-client:test: ok 40 - separates backend error semantics from transport errors
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 5.393616
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: falls back to X-Request-ID and exposes normalized Retry-After seconds
@e-pharmacy/api-client:test: ok 41 - falls back to X-Request-ID and exposes normalized Retry-After seconds
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.519766
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/ui:test: # cancelled 0
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 97.933313
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/ui:test: # skipped 0
@e-pharmacy/next-api:test: # Subtest: malformed JSON and HTML success responses become controlled 502 responses
@e-pharmacy/ui:test: # todo 0
@e-pharmacy/ui:test: # duration_ms 82272.302925
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 109.350341
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: retries the default GET status allowlist and network failures
@e-pharmacy/api-client:test: ok 42 - retries the default GET status allowlist and network failures
@e-pharmacy/api-client:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test: ok 24 - malformed JSON and HTML success responses become controlled 502 responses
@e-pharmacy/api-client:test:   duration_ms: 6.692629
@e-pharmacy/pharmacy:test: # Subtest: read request options forward only cancellation and timeout controls
@e-pharmacy/next-api:test:   ---
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 105 - read request options forward only cancellation and timeout controls
@e-pharmacy/next-api:test:   duration_ms: 11.247289
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: does not retry mutations even when retry options are supplied
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/validation:test:   duration_ms: 0.315362
@e-pharmacy/pharmacy:test:   duration_ms: 4.945616
@e-pharmacy/next-api:test:   ...
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: read request options preserve AbortSignal identity and optional timeout
@e-pharmacy/pharmacy:test: ok 106 - read request options preserve AbortSignal identity and optional timeout
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.65484
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client app configuration is fail-closed in production
@e-pharmacy/pharmacy:test: ok 107 - client app configuration is fail-closed in production
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: address-max
@e-pharmacy/validation:test: ok 52 - frontend contract: address-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.249507
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: address-max-plus-one
@e-pharmacy/validation:test: ok 53 - frontend contract: address-max-plus-one
@e-pharmacy/client:test: ok 107 - checkout fingerprint is stable for an unchanged group
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 96.680213
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: checkout fingerprint changes for quantity, item and price changes
@e-pharmacy/client:test: ok 108 - checkout fingerprint changes for quantity, item and price changes
@e-pharmacy/pharmacy:test:   duration_ms: 3.196286
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client app configuration preserves a configured base path
@e-pharmacy/pharmacy:test: ok 108 - client app configuration preserves a configured base path
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.684521
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.179014
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: address-cyrillic
@e-pharmacy/validation:test: ok 54 - frontend contract: address-cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.242087
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: review-min-minus-one
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.930781
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: checkout fingerprint changes when quantity, items or price changes
@e-pharmacy/client:test: ok 109 - checkout fingerprint changes when quantity, items or price changes
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 94.150361
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: local client app fallback is available only outside production
@e-pharmacy/pharmacy:test: ok 109 - local client app fallback is available only outside production
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.476753
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: password change maps invalid credentials to the current-password message
@e-pharmacy/validation:test: ok 55 - frontend contract: review-min-minus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test: ok 110 - password change maps invalid credentials to the current-password message
@e-pharmacy/validation:test:   duration_ms: 0.369159
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test: # Subtest: normalizes an origin-only site URL
@e-pharmacy/client:test: ok 110 - normalizes an origin-only site URL
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.959183
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: keeps successful-order filter values unique and fully labelled
@e-pharmacy/api-client:test: ok 43 - does not retry mutations even when retry options are supplied
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 2.927301
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 111 - keeps successful-order filter values unique and fully labelled
@e-pharmacy/validation:test: # Subtest: frontend contract: review-min
@e-pharmacy/validation:test: ok 56 - frontend contract: review-min
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.635825
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test:   duration_ms: 5.111645
@e-pharmacy/api-client:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: # Subtest: frontend contract: review-max
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api-client:test: # Subtest: classifies an already aborted external signal and preserves its reason
@e-pharmacy/validation:test: ok 57 - frontend contract: review-max
@e-pharmacy/pharmacy:test:   duration_ms: 40.667306
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: rejects unsafe and base-path site URLs
@e-pharmacy/validation:test:   duration_ms: 0.300521
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: review-max-plus-one
@e-pharmacy/validation:test: ok 58 - frontend contract: review-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.187826
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: review-cyrillic
@e-pharmacy/validation:test: ok 59 - frontend contract: review-cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.225855
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client route keeps non-PII filters but never persists private search values
@e-pharmacy/pharmacy:test: ok 112 - client route keeps non-PII filters but never persists private search values
@e-pharmacy/client:test: ok 111 - rejects unsafe and base-path site URLs
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.767999
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: allows localhost when local production fallback is explicitly permitted
@e-pharmacy/client:test: ok 112 - allows localhost when local production fallback is explicitly permitted
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.614028
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rejects a production localhost origin without the explicit local-build opt-in
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: order-comment-empty
@e-pharmacy/validation:test: ok 60 - frontend contract: order-comment-empty
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.385737
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.597908
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: legacy PII-bearing client URL is recognized but its values are not restored
@e-pharmacy/pharmacy:test: ok 113 - legacy PII-bearing client URL is recognized but its values are not restored
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.053215
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client routes distinguish canonical filters, entity IDs and malformed segments
@e-pharmacy/pharmacy:test: ok 114 - client routes distinguish canonical filters, entity IDs and malformed segments
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.314082
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: duplicate and invalid client filters canonicalize deterministically
@e-pharmacy/api-client:test: ok 44 - classifies an already aborted external signal and preserves its reason
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.845795
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: times out a pending first attempt within the overall deadline
@e-pharmacy/api-client:test: ok 45 - times out a pending first attempt within the overall deadline
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 95.515693
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: keeps retry enabled for an active signal and cancels the previous body
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: order-comment-max
@e-pharmacy/validation:test: ok 61 - frontend contract: order-comment-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/client:test: ok 113 - rejects a production localhost origin without the explicit local-build opt-in
@e-pharmacy/pharmacy:test: ok 115 - duplicate and invalid client filters canonicalize deterministically
@e-pharmacy/api-client:test: ok 46 - keeps retry enabled for an active signal and cancels the previous body
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 3.753734
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: aborts during retry delay without starting another fetch
@e-pharmacy/api-client:test: ok 47 - aborts during retry delay without starting another fetch
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 6.762658
@e-pharmacy/validation:test:   duration_ms: 0.524521
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 1.142724
@e-pharmacy/api-client:test:   ...
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: order-comment-max-plus-one
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pharmacy client parser rejects missing or malformed authoritative fields
@e-pharmacy/pharmacy:test: ok 116 - pharmacy client parser rejects missing or malformed authoritative fields
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 37.586034
@e-pharmacy/client:test:   duration_ms: 0.447999
@e-pharmacy/api-client:test: # Subtest: applies timeout to the overall operation including retry delay
@e-pharmacy/api-client:test: ok 48 - applies timeout to the overall operation including retry delay
@e-pharmacy/api-client:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api-client:test:   duration_ms: 95.792563
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: pharmacy clients response rejects malformed rows and earliest date
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: validates retry configuration
@e-pharmacy/validation:test: ok 62 - frontend contract: order-comment-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.205449
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test: ok 117 - pharmacy clients response rejects malformed rows and earliest date
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: # Subtest: frontend contract: payment-purpose-empty
@e-pharmacy/client:test: # Subtest: canonical production policy distinguishes build-time validation from production runtime
@e-pharmacy/validation:test: ok 63 - frontend contract: payment-purpose-empty
@e-pharmacy/validation:test:   ---
@e-pharmacy/client:test: ok 114 - canonical production policy distinguishes build-time validation from production runtime
@e-pharmacy/validation:test:   duration_ms: 0.341333
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: payment-purpose-valid
@e-pharmacy/validation:test: ok 64 - frontend contract: payment-purpose-valid
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.265275
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: payment-purpose-max
@e-pharmacy/validation:test: ok 65 - frontend contract: payment-purpose-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.329739
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: payment-purpose-max-plus-one
@e-pharmacy/pharmacy:test:   duration_ms: 4.360342
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.976695
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses the browser or deployment origin when the explicit URL is absent
@e-pharmacy/client:test: ok 115 - uses the browser or deployment origin when the explicit URL is absent
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.74423
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: requires an explicit canonical site URL in production
@e-pharmacy/client:test: ok 116 - requires an explicit canonical site URL in production
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test: ok 66 - frontend contract: payment-purpose-max-plus-one
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.222608
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: payment-purpose-cyrillic
@e-pharmacy/pharmacy:test: # Subtest: purchased product response rejects invalid quantities and dates
@e-pharmacy/pharmacy:test: ok 118 - purchased product response rejects invalid quantities and dates
@e-pharmacy/client:test:   duration_ms: 4.397443
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: maps transport failures without exposing raw backend copy
@e-pharmacy/client:test: ok 117 - maps transport failures without exposing raw backend copy
@e-pharmacy/client:test:   ---
@e-pharmacy/api-client:test: ok 49 - validates retry configuration
@e-pharmacy/validation:test: ok 67 - frontend contract: payment-purpose-cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.534372
@e-pharmacy/validation:test:   duration_ms: 0.288
@e-pharmacy/api-client:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 4.234197
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 3.631299
@e-pharmacy/client:test: # Subtest: uses backend semantic codes only through an explicit allowlist
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: ok 118 - uses backend semantic codes only through an explicit allowlist
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: maps profile business codes without exposing backend copy
@e-pharmacy/client:test:   duration_ms: 0.622376
@e-pharmacy/pharmacy:test: ok 119 - maps profile business codes without exposing backend copy
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 3.435589
@e-pharmacy/client:test: # Subtest: returns an empty message for aborted requests
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: ok 119 - returns an empty message for aborted requests
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 0.506898
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: client route access, guest routes and token routes keep distinct semantics
@e-pharmacy/client:test: ok 120 - client route access, guest routes and token routes keep distinct semantics
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 4.552805
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: maps moderation and owner-only profile codes through controlled copy
@e-pharmacy/pharmacy:test: ok 120 - maps moderation and owner-only profile codes through controlled copy
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.513855
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: private redirect targets preserve safe local state and reject external destinations
@e-pharmacy/client:test: ok 121 - private redirect targets preserve safe local state and reject external destinations
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 29.503496
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: typed public slugs dispatch by entity type before lookup
@e-pharmacy/client:test: ok 122 - typed public slugs dispatch by entity type before lookup
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: iban-normalization
@e-pharmacy/validation:test: ok 68 - frontend contract: iban-normalization
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.692869
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: iban-invalid-letter
@e-pharmacy/validation:test: ok 69 - frontend contract: iban-invalid-letter
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: does not retry 429 without an explicit product policy
@e-pharmacy/api-client:test: ok 50 - does not retry 429 without an explicit product policy
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.474317
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: validates timeout and preserves the original network cause
@e-pharmacy/api-client:test: ok 51 - validates timeout and preserves the original network cause
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 2.120345
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.955825
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: legacy root resolution remains product-first for colliding ObjectIds
@e-pharmacy/client:test: ok 123 - legacy root resolution remains product-first for colliding ObjectIds
@e-pharmacy/validation:test:   duration_ms: 0.367767
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: preserves scalar zero and false while skipping empty values
@e-pharmacy/api-client:test: ok 52 - preserves scalar zero and false while skipping empty values
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 3.301097
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: merges an existing query and supports repeated primitive keys
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.908984
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: catalog routes keep path authority, reject malformed pagination and bound catch-all work
@e-pharmacy/client:test: ok 124 - catalog routes keep path authority, reject malformed pagination and bound catch-all work
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: does not expose unknown API or technical messages
@e-pharmacy/pharmacy:test: ok 121 - does not expose unknown API or technical messages
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.404405
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: does not expose raw backend or browser error messages
@e-pharmacy/api-client:test: ok 53 - merges an existing query and supports repeated primitive keys
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 0.720695
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects non-finite numbers, nested values and fragments
@e-pharmacy/api-client:test: ok 54 - rejects non-finite numbers, nested values and fragments
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.487303
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 3.440691
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: runtime pagination correction only applies to successful known page counts
@e-pharmacy/client:test: ok 125 - runtime pagination correction only applies to successful known page counts
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.360811
@e-pharmacy/pharmacy:test: ok 122 - does not expose raw backend or browser error messages
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.587934
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: maps transport failures through controlled copy
@e-pharmacy/pharmacy:test: ok 123 - maps transport failures through controlled copy
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.625622
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: serializes JSON and preserves supported text/urlencoded bodies
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api-client:test: ok 55 - serializes JSON and preserves supported text/urlencoded bodies
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: iban-max-plus-one
@e-pharmacy/pharmacy:test: # Subtest: maps common HTTP failures without surfacing backend messages
@e-pharmacy/pharmacy:test: ok 124 - maps common HTTP failures without surfacing backend messages
@e-pharmacy/api-client:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test: # Subtest: private checkout and order labels are advisory while typed IDs remain authoritative
@e-pharmacy/api-client:test:   duration_ms: 362.7668
@e-pharmacy/pharmacy:test:   duration_ms: 0.95768
@e-pharmacy/client:test: ok 126 - private checkout and order labels are advisory while typed IDs remain authoritative
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: prefers controlled backend-code copy over generic status copy
@e-pharmacy/pharmacy:test: ok 125 - prefers controlled backend-code copy over generic status copy
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.426202
@e-pharmacy/validation:test: ok 70 - frontend contract: iban-max-plus-one
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.811129
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: legacy public entity URLs permanently redirect to typed canonical URLs
@e-pharmacy/client:test: ok 127 - legacy public entity URLs permanently redirect to typed canonical URLs
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 59.952148
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: picture-http
@e-pharmacy/api:test: ok 109 - backend contract: picture-http
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.881622
@e-pharmacy/api-client:test: # Subtest: turns cyclic and BigInt serialization failures into controlled errors
@e-pharmacy/api-client:test: ok 56 - turns cyclic and BigInt serialization failures into controlled errors
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 2.363359
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects custom toJSON, content-type mismatches and multipart bodies
@e-pharmacy/api-client:test: ok 57 - rejects custom toJSON, content-type mismatches and multipart bodies
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.363477
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: rejects unsupported native bodies without exposing sensitive payloads
@e-pharmacy/api-client:test: ok 58 - rejects unsupported native bodies without exposing sensitive payloads
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 1.792461
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: # Subtest: forbids GET bodies at compile time intent and runtime boundary
@e-pharmacy/api-client:test: ok 59 - forbids GET bodies at compile time intent and runtime boundary
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 2.792808
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: 1..59
@e-pharmacy/api-client:test: # tests 59
@e-pharmacy/api-client:test: # suites 0
@e-pharmacy/api-client:test: # pass 59
@e-pharmacy/api-client:test: # fail 0
@e-pharmacy/api-client:test: # cancelled 0
@e-pharmacy/api-client:test: # skipped 0
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test: # todo 0
@e-pharmacy/api-client:test: # duration_ms 171619.778384
@e-pharmacy/api:test: # Subtest: backend contract: picture-data-url
@e-pharmacy/api-client:test: 
@e-pharmacy/validation:test:   duration_ms: 0.208232
@e-pharmacy/api:test: ok 110 - backend contract: picture-data-url
@e-pharmacy/api-client:test: > @e-pharmacy/api-client@0.1.0 test:integration D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/api-client:test: > node ../../scripts/test-runners/run-tsx-tests.mjs test/integration
@e-pharmacy/validation:test:   ...
@e-pharmacy/api:test:   duration_ms: 0.409043
@e-pharmacy/api-client:test: 
@e-pharmacy/validation:test: # Subtest: frontend contract: working-hours-valid
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api-client:test: TAP version 13
@e-pharmacy/validation:test: ok 71 - frontend contract: working-hours-valid
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 2.128229
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: working-hours-free-text
@e-pharmacy/validation:test: ok 72 - frontend contract: working-hours-free-text
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.89368
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: working-hours-missing-day
@e-pharmacy/validation:test: ok 73 - frontend contract: working-hours-missing-day
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.359884
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: working-hours-duplicate-day
@e-pharmacy/api-client:test: # Subtest: configured transport works against a real HTTP boundary
@e-pharmacy/api-client:test: ok 1 - configured transport works against a real HTTP boundary
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: picture-jpg-alias
@e-pharmacy/client:test: # Subtest: keeps documented product-first precedence when a legacy ObjectId resolves to both entity types
@e-pharmacy/validation:test: ok 74 - frontend contract: working-hours-duplicate-day
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api:test: ok 111 - backend contract: picture-jpg-alias
@e-pharmacy/client:test: ok 128 - keeps documented product-first precedence when a legacy ObjectId resolves to both entity types
@e-pharmacy/validation:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 183.989078
@e-pharmacy/api:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.296811
@e-pharmacy/client:test:   ---
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.361739
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: working-hours-inverted-range
@e-pharmacy/validation:test: ok 75 - frontend contract: working-hours-inverted-range
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.240695
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 6.202426
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: falls back to pharmacy only when the legacy id is not a product
@e-pharmacy/client:test: ok 129 - falls back to pharmacy only when the legacy id is not a product
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.816695
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: working-hours-all-closed
@e-pharmacy/validation:test: ok 76 - frontend contract: working-hours-all-closed
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.696579
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: picture-http
@e-pharmacy/validation:test: ok 77 - frontend contract: picture-http
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.745275
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: picture-data-url
@e-pharmacy/validation:test: ok 78 - frontend contract: picture-data-url
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.507362
@e-pharmacy/api-client:test: # Subtest: real HTTP malformed JSON keeps response status and transport code
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: picture-blob
@e-pharmacy/api:test: ok 112 - backend contract: picture-blob
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: picture-jpg-alias
@e-pharmacy/validation:test: ok 79 - frontend contract: picture-jpg-alias
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.226318
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: picture-blob
@e-pharmacy/validation:test: ok 80 - frontend contract: picture-blob
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.245797
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api-client:test: ok 2 - real HTTP malformed JSON keeps response status and transport code
@e-pharmacy/api-client:test:   ---
@e-pharmacy/api-client:test:   duration_ms: 67.297761
@e-pharmacy/api-client:test:   type: 'test'
@e-pharmacy/api-client:test:   ...
@e-pharmacy/api-client:test: 1..2
@e-pharmacy/api-client:test: # tests 2
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.389101
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: date-valid
@e-pharmacy/api:test: ok 113 - backend contract: date-valid
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.733681
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: date-valid
@e-pharmacy/validation:test: ok 81 - frontend contract: date-valid
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.969274
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: date-leap-valid
@e-pharmacy/client:test:   ...
@e-pharmacy/api-client:test: # suites 0
@e-pharmacy/api-client:test: # pass 2
@e-pharmacy/api-client:test: # fail 0
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api-client:test: # cancelled 0
@e-pharmacy/api-client:test: # skipped 0
@e-pharmacy/api:test: # Subtest: backend contract: date-leap-valid
@e-pharmacy/api:test: ok 114 - backend contract: date-leap-valid
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.345507
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: date-leap-invalid
@e-pharmacy/api:test: ok 115 - backend contract: date-leap-invalid
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.475362
@e-pharmacy/validation:test: ok 82 - frontend contract: date-leap-valid
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.238377
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: date-leap-invalid
@e-pharmacy/validation:test: ok 83 - frontend contract: date-leap-invalid
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.23513
@e-pharmacy/client:test: # Subtest: emits structured telemetry for legacy traffic without logging the slug
@e-pharmacy/api-client:test: # todo 0
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: date-impossible
@e-pharmacy/api:test: ok 116 - backend contract: date-impossible
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 32.94836
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: product-article-normalization
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/client:test: ok 130 - emits structured telemetry for legacy traffic without logging the slug
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.66968
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: builds short root-level product and pharmacy detail paths with typed IDs
@e-pharmacy/client:test: ok 131 - builds short root-level product and pharmacy detail paths with typed IDs
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 4.871413
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: uses the backend canonical public slug when it is provided
@e-pharmacy/client:test: ok 132 - uses the backend canonical public slug when it is provided
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.428985
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: builds a shared product context query string
@e-pharmacy/client:test: ok 133 - builds a shared product context query string
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.446608
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: treats private route labels as advisory while IDs remain authoritative
@e-pharmacy/client:test: ok 134 - treats private route labels as advisory while IDs remain authoritative
@e-pharmacy/validation:test: # Subtest: frontend contract: date-impossible
@e-pharmacy/validation:test: ok 84 - frontend contract: date-impossible
@e-pharmacy/api:test: ok 117 - backend contract: product-article-normalization
@e-pharmacy/api-client:test: # duration_ms 2163.998844
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.173332
@e-pharmacy/validation:test:   duration_ms: 0.280116
@e-pharmacy/api:test:   duration_ms: 19.071046
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test: # Subtest: builds typed checkout pharmacy paths and redirects legacy checkout slugs
@e-pharmacy/api:test: # Subtest: backend contract: product-article-max
@e-pharmacy/client:test: ok 135 - builds typed checkout pharmacy paths and redirects legacy checkout slugs
@e-pharmacy/api:test: ok 118 - backend contract: product-article-max
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.940521
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: product-article-normalization
@e-pharmacy/validation:test: ok 85 - frontend contract: product-article-normalization
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 2.823417
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: product-article-max
@e-pharmacy/validation:test: ok 86 - frontend contract: product-article-max
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.622723
@e-pharmacy/pharmacy:test: # Subtest: render error diagnostics expose only redacted correlation data
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.885332
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 126 - render error diagnostics expose only redacted correlation data
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 8.561611
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: breadcrumb dispatch captures pathname before the deferred microtask
@e-pharmacy/pharmacy:test: ok 127 - breadcrumb dispatch captures pathname before the deferred microtask
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 16.018064
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test: # Subtest: builds and parses a canonical order slug with Unicode order numbers
@e-pharmacy/client:test: ok 136 - builds and parses a canonical order slug with Unicode order numbers
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: product-article-max-plus-one
@e-pharmacy/pharmacy:test: # Subtest: breadcrumb subscription cleanup stops later events
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 1.703417
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: redirects legacy order slugs to the canonical ph-prefixed route
@e-pharmacy/client:test: ok 137 - redirects legacy order slugs to the canonical ph-prefixed route
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: product-article-max-plus-one
@e-pharmacy/api:test: ok 119 - backend contract: product-article-max-plus-one
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 56.201197
@e-pharmacy/pharmacy:test: ok 128 - breadcrumb subscription cleanup stops later events
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test: ok 87 - frontend contract: product-article-max-plus-one
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.916868
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.911767
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: rejects malformed order route identifiers
@e-pharmacy/client:test: ok 138 - rejects malformed order route identifiers
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 0.886259
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/validation:test:   duration_ms: 0.930317
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test: # Subtest: keeps static routes and reports partial dynamic sitemap failure
@e-pharmacy/api:test: # Subtest: backend contract: product-article-cyrillic
@e-pharmacy/pharmacy:test: # Subtest: base and new routes derive breadcrumbs from canonical route families
@e-pharmacy/validation:test: # Subtest: frontend contract: product-article-cyrillic
@e-pharmacy/client:test: ok 139 - keeps static routes and reports partial dynamic sitemap failure
@e-pharmacy/api:test: ok 120 - backend contract: product-article-cyrillic
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.748521
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: ok 129 - base and new routes derive breadcrumbs from canonical route families
@e-pharmacy/validation:test: ok 88 - frontend contract: product-article-cyrillic
@e-pharmacy/api:test: # Subtest: backend contract: product-long-text-english
@e-pharmacy/client:test:   ---
@e-pharmacy/validation:test:   ---
@e-pharmacy/api:test: ok 121 - backend contract: product-long-text-english
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.550956
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 8.294481
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 1.208114
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: product-long-text-english
@e-pharmacy/validation:test: ok 89 - frontend contract: product-long-text-english
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.401159
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: frontend contract: product-long-text-cyrillic
@e-pharmacy/validation:test: ok 90 - frontend contract: product-long-text-cyrillic
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.778666
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test:   duration_ms: 203.517398
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: canonical filter segments are never classified as entity detail ids
@e-pharmacy/pharmacy:test: ok 130 - canonical filter segments are never classified as entity detail ids
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/validation:test: # Subtest: pickup does not require postal details, while postal delivery does
@e-pharmacy/validation:test: ok 91 - pickup does not require postal details, while postal delivery does
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test: # Subtest: backend contract: product-long-text-cyrillic
@e-pharmacy/pharmacy:test:   duration_ms: 2.250663
@e-pharmacy/client:test: # Subtest: keeps active products in the sitemap when temporary inventory is out of stock
@e-pharmacy/api:test: ok 122 - backend contract: product-long-text-cyrillic
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: ok 140 - keeps active products in the sitemap when temporary inventory is out of stock
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.850549
@e-pharmacy/pharmacy:test: # Subtest: real entity ids still produce detail breadcrumbs for each domain
@e-pharmacy/client:test:   duration_ms: 4.576921
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: does not invent lastModified for static routes
@e-pharmacy/client:test: ok 141 - does not invent lastModified for static routes
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 6.001615
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: domain name schemas accept English and reject Cyrillic values
@e-pharmacy/api:test: ok 123 - domain name schemas accept English and reject Cyrillic values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 20.802753
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: domain name schemas use their own maximum lengths
@e-pharmacy/api:test: ok 124 - domain name schemas use their own maximum lengths
@e-pharmacy/pharmacy:test: ok 131 - real entity ids still produce detail breadcrumbs for each domain
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.190485
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: unknown routes and unsupported request edit paths never invent detail breadcrumbs
@e-pharmacy/pharmacy:test: ok 132 - unknown routes and unsupported request edit paths never invent detail breadcrumbs
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.271187
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: reuses the public transport retry policy and preserves sitemap cache options
@e-pharmacy/client:test: ok 142 - reuses the public transport retry policy and preserves sitemap cache options
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 203.179311
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.690432
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: checkout delivery is discriminated by delivery method
@e-pharmacy/api:test: ok 125 - checkout delivery is discriminated by delivery method
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 69.766859
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order update rejects stale or detached delivery details
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: keeps pharmacy navigation unique and tied to existing route constants
@e-pharmacy/validation:test:   ---
@e-pharmacy/client:test: # Subtest: caps page collection below the single-sitemap URL ceiling
@e-pharmacy/api:test: ok 126 - order update rejects stale or detached delivery details
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.062603
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/validation:test:   duration_ms: 7.828395
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: rejected order status requires a bounded rejection reason
@e-pharmacy/validation:test: ok 92 - rejected order status requires a bounded rejection reason
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.815303
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: draft pharmacy normalization distinguishes unchanged empty values from explicit clears
@e-pharmacy/client:test: ok 143 - caps page collection below the single-sitemap URL ceiling
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test: ok 133 - keeps pharmacy navigation unique and tied to existing route constants
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: rejected order status requires a bounded reason
@e-pharmacy/api:test: ok 127 - rejected order status requires a bounded reason
@e-pharmacy/client:test:   duration_ms: 162.644643
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: requires an origin-only site URL and application path
@e-pharmacy/client:test: ok 144 - requires an origin-only site URL and application path
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 4.495762
@e-pharmacy/validation:test: ok 93 - draft pharmacy normalization distinguishes unchanged empty values from explicit clears
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.228169
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: dynamic product-category slug validation accepts canonical snake_case
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   ---
@e-pharmacy/api:test: ok 128 - dynamic product-category slug validation accepts canonical snake_case
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test:   duration_ms: 10.325319
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.738424
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: dynamic product-category slug validation rejects malformed values
@e-pharmacy/api:test: ok 129 - dynamic product-category slug validation rejects malformed values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 6.283122
@e-pharmacy/pharmacy:test: # Subtest: top bar presentation derives section identity from pathname instead of display labels
@e-pharmacy/pharmacy:test: ok 134 - top bar presentation derives section identity from pathname instead of display labels
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.970201
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: PharmacyHeader does not use breadcrumb labels as route identity
@e-pharmacy/pharmacy:test: ok 135 - PharmacyHeader does not use breadcrumb labels as route identity
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: draft pharmacy normalization omits fields that were already empty
@e-pharmacy/validation:test: ok 94 - draft pharmacy normalization omits fields that were already empty
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.665042
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: draft validation requires name and article
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema accepts English draft and submission values
@e-pharmacy/api:test: ok 130 - product request schema accepts English draft and submission values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 26.13237
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema rejects non-English text
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 17.224787
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: distinguishes initial loading and profile failure states
@e-pharmacy/pharmacy:test: ok 136 - distinguishes initial loading and profile failure states
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 4.716979
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: allows active and on-moderation pharmacies through the canonical URL helper
@e-pharmacy/pharmacy:test: ok 137 - allows active and on-moderation pharmacies through the canonical URL helper
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 2.608228
@e-pharmacy/validation:test: ok 95 - draft validation requires name and article
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 6.959295
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test: ok 131 - product request schema rejects non-English text
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 62.721768
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema enforces field length boundaries
@e-pharmacy/api:test: ok 132 - product request schema enforces field length boundaries
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: inactive pharmacy status is distinct from a missing profile
@e-pharmacy/pharmacy:test: ok 138 - inactive pharmacy status is distinct from a missing profile
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.492057
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: cached profile remains usable during background loading or refresh error
@e-pharmacy/pharmacy:test: ok 139 - cached profile remains usable during background loading or refresh error
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: validation enforces every field boundary without relying on JSX
@e-pharmacy/validation:test: ok 96 - validation enforces every field boundary without relying on JSX
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 18.528438
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: validation rejects non-English product text without changing it
@e-pharmacy/validation:test: ok 97 - validation rejects non-English product text without changing it
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.09681
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.014606
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema normalizes blank optional text to undefined
@e-pharmacy/api:test: ok 133 - product request schema normalizes blank optional text to undefined
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.099593
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: order counter refresh notifies active subscribers
@e-pharmacy/pharmacy:test: ok 140 - order counter refresh notifies active subscribers
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.202778
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: order counter refresh cleanup removes the subscriber
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: catalog category mode requires a category id without hardcoded membership checks
@e-pharmacy/validation:test: ok 98 - catalog category mode requires a category id without hardcoded membership checks
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.471188
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.947013
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema requires custom category metadata in custom mode
@e-pharmacy/api:test: ok 134 - product request schema requires custom category metadata in custom mode
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: ok 141 - order counter refresh cleanup removes the subscriber
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 68.626455
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: not loaded and failed counters are never presented as authoritative zeroes
@e-pharmacy/client:test:   duration_ms: 3.409155
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: validation rejects an unsupported category mode
@e-pharmacy/validation:test: ok 99 - validation rejects an unsupported category mode
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 1.856925
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 142 - not loaded and failed counters are never presented as authoritative zeroes
@e-pharmacy/validation:test:   ---
@e-pharmacy/client:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.424348
@e-pharmacy/client:test: # Subtest: accepts only canonical calendar or timezone-aware ISO dates
@e-pharmacy/api:test: # Subtest: product request schema enforces moderation-required fields
@e-pharmacy/pharmacy:test:   duration_ms: 2.583185
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/client:test: ok 145 - accepts only canonical calendar or timezone-aware ISO dates
@e-pharmacy/api:test: ok 135 - product request schema enforces moderation-required fields
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.101794
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema keeps Product data fields optional for moderation
@e-pharmacy/api:test: ok 136 - product request schema keeps Product data fields optional for moderation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.075013
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema accepts rich text markdown links and lists
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: a failed refresh hides previously successful counters
@e-pharmacy/pharmacy:test: ok 143 - a failed refresh hides previously successful counters
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: # Subtest: custom category is required only in custom category mode
@e-pharmacy/client:test:   duration_ms: 1.159882
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/validation:test: ok 100 - custom category is required only in custom category mode
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.693332
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: moderation validation requires the moderation essentials and product image
@e-pharmacy/validation:test: ok 101 - moderation validation requires the moderation essentials and product image
@e-pharmacy/pharmacy:test:   duration_ms: 2.413446
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 2.333214
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: Product data fields stay optional when a request is sent for moderation
@e-pharmacy/api:test: ok 137 - product request schema accepts rich text markdown links and lists
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: dedupe keeps the highest-priority and then latest entry
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"canonical-503","method":"GET","path":"/products","destination":"backend","durationMs":190,"status":503,"retryCount":1,"authMode":"public","refreshPerformed":false,"cachePolicy":"no-store","source":"public-proxy"}
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.980405
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request schema enforces image MIME, extension and size
@e-pharmacy/api:test: ok 138 - product request schema enforces image MIME, extension and size
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.263532
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/client:test: ok 146 - dedupe keeps the highest-priority and then latest entry
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 2.963474
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"public-auth-isolation","method":"GET","path":"/products","destination":"backend","durationMs":3,"status":200,"retryCount":0,"authMode":"public","refreshPerformed":false,"cachePolicy":"public, s-maxage=30, stale-while-revalidate=30","source":"public-proxy"}
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/next-api:test: # Subtest: canonical 503 error envelope preserves status and no-store policy
@e-pharmacy/next-api:test: ok 25 - canonical 503 error envelope preserves status and no-store policy
@e-pharmacy/client:test:   ...
@e-pharmacy/next-api:test:   ---
@e-pharmacy/client:test: # Subtest: same auth identity receives a new owner key for every mounted session
@e-pharmacy/next-api:test:   duration_ms: 286.211312
@e-pharmacy/client:test: ok 147 - same auth identity receives a new owner key for every mounted session
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/client:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: ready state preserves zero, one-sided and two-sided counter values
@e-pharmacy/next-api:test: # Subtest: authenticated browser public reads never forward cookies or upstream Set-Cookie
@e-pharmacy/next-api:test: ok 26 - authenticated browser public reads never forward cookies or upstream Set-Cookie
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 9.855986
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"refresh-outage","method":"GET","path":"/orders","destination":"backend","durationMs":13,"status":502,"retryCount":0,"authMode":"private","refreshPerformed":true,"cachePolicy":"default","transportErrorCode":"BAD_GATEWAY","source":"private-proxy"}
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"business-401-no-refresh","method":"PATCH","path":"/auth/current/password","destination":"backend","durationMs":6,"status":401,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/validation:test: ok 102 - Product data fields stay optional when a request is sent for moderation
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test: ok 144 - ready state preserves zero, one-sided and two-sided counter values
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.426202
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: product request schema stores attachment data and checks MIME consistency
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"session-refresh-retry","method":"GET","path":"/orders","destination":"backend","durationMs":13,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":true,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/validation:test:   duration_ms: 1.713157
@e-pharmacy/api:test: ok 139 - product request schema stores attachment data and checks MIME consistency
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"blocked-no-refresh","method":"GET","path":"/orders","destination":"backend","durationMs":9,"status":403,"retryCount":0,"authMode":"private","refreshPerformed":false,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: full description validation accepts rich-text markdown controls
@e-pharmacy/validation:test: ok 103 - full description validation accepts rich-text markdown controls
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 10.545609
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/next-api:test: # Subtest: clears cookies after invalid refresh credentials
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: sales statistics parser rejects malformed values instead of returning zero defaults
@e-pharmacy/next-api:test: ok 27 - clears cookies after invalid refresh credentials
@e-pharmacy/validation:test:   duration_ms: 0.98597
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: product image validation checks MIME, extension and size
@e-pharmacy/validation:test: ok 104 - product image validation checks MIME, extension and size
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 1.738665
@e-pharmacy/pharmacy:test: ok 145 - sales statistics parser rejects malformed values instead of returning zero defaults
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 5.204862
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pharmacy order parser rejects invalid transactional defaults
@e-pharmacy/pharmacy:test: ok 146 - pharmacy order parser rejects invalid transactional defaults
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 9.293436
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 67.801413
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: additional file validation checks count, MIME, size and data URL
@e-pharmacy/validation:test: ok 105 - additional file validation checks count, MIME, size and data URL
@e-pharmacy/next-api:test: # Subtest: temporary refresh transport outage does not destroy browser cookies
@e-pharmacy/validation:test:   ---
@e-pharmacy/next-api:test: ok 28 - temporary refresh transport outage does not destroy browser cookies
@e-pharmacy/validation:test:   duration_ms: 1.477563
@e-pharmacy/next-api:test:   ---
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/next-api:test:   duration_ms: 36.8185
@e-pharmacy/validation:test:   ...
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/validation:test: # Subtest: normalization trims values, uppercases article and removes empty optional fields
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pharmacy order details reject malformed nested history and bank data
@e-pharmacy/pharmacy:test: ok 147 - pharmacy order details reject malformed nested history and bank data
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: AUTH_INVALID_CREDENTIALS 401 never triggers refresh or mutation replay
@e-pharmacy/next-api:test: ok 29 - AUTH_INVALID_CREDENTIALS 401 never triggers refresh or mutation replay
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 12.109432
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: product request moderation schema enforces the admin transition payload
@e-pharmacy/validation:test: ok 106 - normalization trims values, uppercases article and removes empty optional fields
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.457739
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: AUTH_SESSION_INVALID refreshes and retries the protected request once
@e-pharmacy/next-api:test: ok 30 - AUTH_SESSION_INVALID refreshes and retries the protected request once
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 19.015394
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: AUTH_USER_BLOCKED clears cookies without refresh or replay
@e-pharmacy/api:test: ok 140 - product request moderation schema enforces the admin transition payload
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 12.579229
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 2.20475
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: normalization keeps custom category separate from catalog category ids
@e-pharmacy/next-api:test: ok 31 - AUTH_USER_BLOCKED clears cookies without refresh or replay
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: pharmacy orders response rejects malformed statistics instead of using zero defaults
@e-pharmacy/pharmacy:test: ok 148 - pharmacy orders response rejects malformed statistics instead of using zero defaults
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: ok 107 - normalization keeps custom category separate from catalog category ids
@e-pharmacy/validation:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 66.536255
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/api:test: # Subtest: product and pharmacy reviews share rating and English comment contracts
@e-pharmacy/api:test: ok 141 - product and pharmacy reviews share rating and English comment contracts
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 121.131426
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"request-a","method":"GET","path":"/private-resource","destination":"backend","durationMs":181,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":true,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/validation:test:   duration_ms: 0.366376
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: file metadata infers MIME and preserves actual file data
@e-pharmacy/validation:test: ok 108 - file metadata infers MIME and preserves actual file data
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.439188
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: shared ObjectId schema accepts only 24 hexadecimal characters
@e-pharmacy/api:test: ok 142 - shared ObjectId schema accepts only 24 hexadecimal characters
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.695992
@e-pharmacy/next-api:test: # {"event":"api_transport","requestId":"request-b","method":"GET","path":"/private-resource","destination":"backend","durationMs":197,"status":200,"retryCount":0,"authMode":"private","refreshPerformed":true,"cachePolicy":"default","source":"private-proxy"}
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: user profile validation trims values without changing their meaning
@e-pharmacy/validation:test: ok 109 - user profile validation trims values without changing their meaning
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 15.506529
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: user profile updates use null to explicitly clear an existing address
@e-pharmacy/pharmacy:test:   duration_ms: 16.417368
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/next-api:test: # Subtest: concurrent private requests share one refresh call
@e-pharmacy/next-api:test: ok 32 - concurrent private requests share one refresh call
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: order comment parser requires the author snapshot
@e-pharmacy/pharmacy:test: ok 149 - order comment parser requires the author snapshot
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.670027
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: only active and on_moderation pharmacies are operational
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: shared pagination schemas normalize aliases and preserve endpoint limits
@e-pharmacy/api:test: ok 143 - shared pagination schemas normalize aliases and preserve endpoint limits
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 9.121379
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 150 - only active and on_moderation pharmacies are operational
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/next-api:test:   ---
@e-pharmacy/validation:test: ok 110 - user profile updates use null to explicitly clear an existing address
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.717448
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: password update requires both current and valid new password
@e-pharmacy/validation:test: ok 111 - password update requires both current and valid new password
@e-pharmacy/validation:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 3.113735
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: blocked remains an explicit locked status instead of falling through to new
@e-pharmacy/pharmacy:test: ok 151 - blocked remains an explicit locked status instead of falling through to new
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.446144
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   duration_ms: 1.292056
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: reference-data names use one shared category/position contract
@e-pharmacy/validation:test: ok 112 - reference-data names use one shared category/position contract
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 3.856226
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: reference-data persistence trims edge whitespace without rewriting display text
@e-pharmacy/api:test: # Subtest: shared boolean and optional text helpers normalize query values
@e-pharmacy/next-api:test:   duration_ms: 216.24967
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request parser preserves the canonical application projection
@e-pharmacy/pharmacy:test: ok 152 - product request parser preserves the canonical application projection
@e-pharmacy/validation:test: ok 113 - reference-data persistence trims edge whitespace without rewriting display text
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: browser transport cannot bypass the same-origin BFF
@e-pharmacy/next-api:test: ok 33 - browser transport cannot bypass the same-origin BFF
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 6.412513
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: backend proxy cannot become an open proxy
@e-pharmacy/api:test: ok 144 - shared boolean and optional text helpers normalize query values
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   ---
@e-pharmacy/next-api:test: ok 34 - backend proxy cannot become an open proxy
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 8.087641
@e-pharmacy/validation:test:   duration_ms: 0.54771
@e-pharmacy/next-api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: legacy request statuses are normalized explicitly and unknown statuses are rejected
@e-pharmacy/pharmacy:test: ok 153 - legacy request statuses are normalized explicitly and unknown statuses are rejected
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 2.329504
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request pagination rejects malformed rows instead of silently dropping them
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: reference-data uniqueness keys are case-insensitive and whitespace-stable
@e-pharmacy/api:test:   duration_ms: 39.196235
@e-pharmacy/next-api:test:   duration_ms: 1.353274
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: # Subtest: unrelated browser cookies never reach the backend
@e-pharmacy/validation:test: ok 114 - reference-data uniqueness keys are case-insensitive and whitespace-stable
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test: ok 154 - product request pagination rejects malformed rows instead of silently dropping them
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 90.068744
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: product request list metadata fails closed for malformed earliest dates
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: working hours require every day exactly once
@e-pharmacy/api:test: ok 145 - working hours require every day exactly once
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 8.927988
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: query schemas validate real calendar dates and ordered ranges
@e-pharmacy/next-api:test: ok 35 - unrelated browser cookies never reach the backend
@e-pharmacy/next-api:test:   ---
@e-pharmacy/next-api:test:   duration_ms: 1.132984
@e-pharmacy/next-api:test:   type: 'test'
@e-pharmacy/next-api:test:   ...
@e-pharmacy/next-api:test: 1..35
@e-pharmacy/next-api:test: # tests 35
@e-pharmacy/next-api:test: # suites 0
@e-pharmacy/next-api:test: # pass 35
@e-pharmacy/next-api:test: # fail 0
@e-pharmacy/pharmacy:test: ok 155 - product request list metadata fails closed for malformed earliest dates
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 2.006722
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request history requires an explicit inferred marker
@e-pharmacy/pharmacy:test: ok 156 - product request history requires an explicit inferred marker
@e-pharmacy/validation:test:   duration_ms: 0.682665
@e-pharmacy/api:test: ok 146 - query schemas validate real calendar dates and ordered ranges
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.838956
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: dynamic product-category slugs preserve the existing snake_case key format
@e-pharmacy/validation:test: ok 115 - dynamic product-category slugs preserve the existing snake_case key format
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.878375
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/next-api:test: # cancelled 0
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 29.573061
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: client contact search accepts email, phone and postal address values
@e-pharmacy/api:test: ok 147 - client contact search accepts email, phone and postal address values
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.767999
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: public product queries reject management-only lifecycle filters
@e-pharmacy/api:test: ok 148 - public product queries reject management-only lifecycle filters
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.766484
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: public cacheable query schemas reject unknown parameters
@e-pharmacy/api:test: ok 149 - public cacheable query schemas reject unknown parameters
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.212981
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: sales statistics query rejects unknown parameters
@e-pharmacy/api:test: ok 150 - sales statistics query rejects unknown parameters
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.941448
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: private resource query schemas reject unknown parameters
@e-pharmacy/next-api:test: # skipped 0
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: product request statistics require all canonical non-negative integer counts
@e-pharmacy/pharmacy:test: ok 157 - product request statistics require all canonical non-negative integer counts
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.541792
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/api:test: ok 151 - private resource query schemas reject unknown parameters
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 117.12633
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: strict pagination query schemas preserve the supported limit alias
@e-pharmacy/api:test: ok 152 - strict pagination query schemas preserve the supported limit alias
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.642312
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: keeps already absolute image URLs unchanged
@e-pharmacy/pharmacy:test: ok 158 - keeps already absolute image URLs unchanged
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.305735
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: normalizes seeded product and client images to same-origin rewrite paths
@e-pharmacy/pharmacy:test: ok 159 - normalizes seeded product and client images to same-origin rewrite paths
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.095883
@e-pharmacy/validation:test: # Subtest: product-category color uses a canonical six-digit hex contract
@e-pharmacy/validation:test: ok 116 - product-category color uses a canonical six-digit hex contract
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 0.725796
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: empty nested bank details do not count as a profile change
@e-pharmacy/api:test: ok 153 - empty nested bank details do not count as a profile change
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.046483
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: profile updates use null for explicit clears and reject empty-string clear ambiguity
@e-pharmacy/client:test:   duration_ms: 2.781214
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: resolves backend image paths against a validated public API URL
@e-pharmacy/pharmacy:test: ok 160 - resolves backend image paths against a validated public API URL
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.884869
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: uses localhost only outside production
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: review validation enforces rating, length and English-only text
@e-pharmacy/validation:test: ok 117 - review validation enforces rating, length and English-only text
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 9.080103
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: builds SEO-friendly typed product and pharmacy slug IDs
@e-pharmacy/validation:test: ok 118 - builds SEO-friendly typed product and pharmacy slug IDs
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 5.10979
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: auth identity includes authentication, role and account status
@e-pharmacy/client:test: ok 148 - auth identity includes authentication, role and account status
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test: ok 161 - uses localhost only outside production
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: parses the entity type before any backend lookup
@e-pharmacy/validation:test: ok 119 - parses the entity type before any backend lookup
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 3.845559
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: rejects untyped or malformed public slug IDs
@e-pharmacy/validation:test: ok 120 - rejects untyped or malformed public slug IDs
@e-pharmacy/next-api:test: # todo 0
@e-pharmacy/client:test:   duration_ms: 57.291979
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 0.780057
@e-pharmacy/validation:test:   ---
@e-pharmacy/next-api:test: # duration_ms 17613.143726
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/validation:test:   duration_ms: 0.425274
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: # Subtest: URL params keep valid English input and reject invalid calendar dates
@e-pharmacy/validation:test: ok 121 - URL params keep valid English input and reject invalid calendar dates
@e-pharmacy/validation:test:   ---
@e-pharmacy/validation:test:   duration_ms: 11.87523
@e-pharmacy/client:test: # Subtest: cart mutations refresh authoritative state after multi-tab conflicts
@e-pharmacy/client:test: ok 149 - cart mutations refresh authoritative state after multi-tab conflicts
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 59.803743
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: # Subtest: deduplicates twenty-four card requests into one collection request
@e-pharmacy/client:test: ok 150 - deduplicates twenty-four card requests into one collection request
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test: ok 154 - profile updates use null for explicit clears and reject empty-string clear ambiguity
@e-pharmacy/client:test:   duration_ms: 4.224458
@e-pharmacy/pharmacy:test: # Subtest: rejects unsafe or malformed configured backend origins
@e-pharmacy/validation:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 162 - rejects unsafe or malformed configured backend origins
@e-pharmacy/validation:test: # Subtest: URL enum normalization returns only declared values
@e-pharmacy/api:test:   duration_ms: 2.403243
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: ok 122 - URL enum normalization returns only declared values
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/client:test: # Subtest: failed requests are removed so a later card can retry
@e-pharmacy/validation:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.779939
@e-pharmacy/client:test: ok 151 - failed requests are removed so a later card can retry
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy document upload validates content while profile stores references
@e-pharmacy/api:test: ok 155 - pharmacy document upload validates content while profile stores references
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.215183
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: regular admin access requires the exact permission while Platform Owner bypasses it
@e-pharmacy/validation:test:   duration_ms: 1.154781
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: ok 156 - regular admin access requires the exact permission while Platform Owner bypasses it
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/validation:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: clamps the last page after the last row is removed
@e-pharmacy/validation:test:   ...
@e-pharmacy/validation:test: 1..122
@e-pharmacy/validation:test: # tests 122
@e-pharmacy/validation:test: # suites 0
@e-pharmacy/api:test:   duration_ms: 3.299241
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/client:test:   ---
@e-pharmacy/pharmacy:test: ok 163 - clamps the last page after the last row is removed
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.286256
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/client:test:   duration_ms: 1.737272
@e-pharmacy/pharmacy:test: # Subtest: keeps the current page when a mutation does not reduce total pages
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/pharmacy:test: ok 164 - keeps the current page when a mutation does not reduce total pages
@e-pharmacy/client:test: # Subtest: owner change aborts an obsolete collection request
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: # pass 122
@e-pharmacy/client:test: ok 152 - owner change aborts an obsolete collection request
@e-pharmacy/client:test:   ---
@e-pharmacy/client:test:   duration_ms: 2.608229
@e-pharmacy/client:test:   type: 'test'
@e-pharmacy/client:test:   ...
@e-pharmacy/client:test: 1..152
@e-pharmacy/client:test: # tests 152
@e-pharmacy/client:test: # suites 0
@e-pharmacy/client:test: # pass 152
@e-pharmacy/client:test: # fail 0
@e-pharmacy/client:test: # cancelled 0
@e-pharmacy/client:test: # skipped 0
@e-pharmacy/client:test: # todo 0
@e-pharmacy/pharmacy:test:   duration_ms: 0.395593
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: normalizes invalid pages defensively
@e-pharmacy/pharmacy:test: ok 165 - normalizes invalid pages defensively
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.422956
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: own product response preserves canonical stock and price values
@e-pharmacy/validation:test: # fail 0
@e-pharmacy/validation:test: # cancelled 0
@e-pharmacy/client:test: # duration_ms 136824.581346
@e-pharmacy/api:test: # Subtest: delegated permission managers can grant only their own permission subset
@e-pharmacy/pharmacy:test: ok 166 - own product response preserves canonical stock and price values
@e-pharmacy/validation:test: # skipped 0
@e-pharmacy/api:test: ok 157 - delegated permission managers can grant only their own permission subset
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/validation:test: # todo 0
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 11.004739
@e-pharmacy/validation:test: # duration_ms 194789.135598
@e-pharmacy/api:test:   duration_ms: 8.518481
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: self access and Platform Owner targets remain protected
@e-pharmacy/api:test: ok 158 - self access and Platform Owner targets remain protected
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.916868
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: own product response rejects malformed authoritative fields
@e-pharmacy/api:test: # Subtest: Platform Owner can assign regular permissions without subset inheritance
@e-pharmacy/pharmacy:test: ok 167 - own product response rejects malformed authoritative fields
@e-pharmacy/api:test: ok 159 - Platform Owner can assign regular permissions without subset inheritance
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 100.160788
@e-pharmacy/api:test:   duration_ms: 0.457738
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: all product statistics require canonical non-negative integer counts
@e-pharmacy/api:test: # Subtest: admin audit snapshots accept only small explicit scalar values
@e-pharmacy/pharmacy:test: ok 168 - all product statistics require canonical non-negative integer counts
@e-pharmacy/api:test: ok 160 - admin audit snapshots accept only small explicit scalar values
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 3.772285
@e-pharmacy/api:test:   duration_ms: 5.747007
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: order status route uses canonical hyphenated slug and roundtrips
@e-pharmacy/pharmacy:test: ok 169 - order status route uses canonical hyphenated slug and roundtrips
@e-pharmacy/api:test: # Subtest: admin audit snapshots fail closed for secrets and sensitive business data
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: ok 161 - admin audit snapshots fail closed for secrets and sensitive business data
@e-pharmacy/pharmacy:test:   duration_ms: 7.572859
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 1.996056
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: order client search stays ephemeral and is never persisted in the route
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: ok 170 - order client search stays ephemeral and is never persisted in the route
@e-pharmacy/api:test: # Subtest: admin audit snapshots reject object and binary-shaped values at runtime
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: ok 162 - admin audit snapshots reject object and binary-shaped values at runtime
@e-pharmacy/pharmacy:test:   duration_ms: 34.00575
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.813911
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: own product stock route roundtrips through its domain builder
@e-pharmacy/pharmacy:test: ok 171 - own product stock route roundtrips through its domain builder
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: # Subtest: admin employee documents are a separate self-owned persistence domain
@e-pharmacy/pharmacy:test:   duration_ms: 1.558259
@e-pharmacy/api:test: ok 163 - admin employee documents are a separate self-owned persistence domain
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   duration_ms: 3.22272
@e-pharmacy/pharmacy:test: # Subtest: product request status route roundtrips through its domain builder
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 172 - product request status route roundtrips through its domain builder
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 1.093564
@e-pharmacy/api:test: # Subtest: admin self-profile document mutations are blocked for every admin
@e-pharmacy/api:test: ok 164 - admin self-profile document mutations are blocked for every admin
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.807883
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin document mutations and audit records commit in the same transaction
@e-pharmacy/api:test: ok 165 - admin document mutations and audit records commit in the same transaction
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 52.079696
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin document AuditLog uses the canonical Stage 10 action names
@e-pharmacy/api:test: ok 166 - admin document AuditLog uses the canonical Stage 10 action names
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.217389
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin document self routes expose only the Stage 10.6 contract
@e-pharmacy/api:test: ok 167 - admin document self routes expose only the Stage 10.6 contract
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.671536
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin private comments are a separate self-owned persistence domain
@e-pharmacy/api:test: ok 168 - admin private comments are a separate self-owned persistence domain
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.709676
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin private comment routes are self-only and do not expose another employee target
@e-pharmacy/api:test: ok 169 - admin private comment routes are self-only and do not expose another employee target
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.560695
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: private comment creation is strict and idempotent by clientRequestId
@e-pharmacy/api:test: ok 170 - private comment creation is strict and idempotent by clientRequestId
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.768927
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: private comments never write to the global Admin AuditLog
@e-pharmacy/api:test: ok 171 - private comments never write to the global Admin AuditLog
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   duration_ms: 0.39884
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin self profile is picture-only while employee identity stays managed elsewhere
@e-pharmacy/api:test: ok 172 - admin self profile is picture-only while employee identity stays managed elsewhere
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.345155
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: dynamic and custom product request categories roundtrip without static membership
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: ok 173 - dynamic and custom product request categories roundtrip without static membership
@e-pharmacy/api:test: # Subtest: admin self profile uses optimistic revision protection and admin scope
@e-pharmacy/api:test: ok 173 - admin self profile uses optimistic revision protection and admin scope
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.603362
@e-pharmacy/pharmacy:test:   duration_ms: 1.032346
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: admin self profile update and AuditLog commit atomically with a safe snapshot
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: ok 174 - admin self profile update and AuditLog commit atomically with a safe snapshot
@e-pharmacy/pharmacy:test: # Subtest: client non-PII filters roundtrip through the canonical client path builder
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: ok 174 - client non-PII filters roundtrip through the canonical client path builder
@e-pharmacy/api:test:   duration_ms: 0.946549
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 1.315245
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: # Subtest: admin self profile route stays authenticated, validated, request-correlated and no-store
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: ok 175 - admin self profile route stays authenticated, validated, request-correlated and no-store
@e-pharmacy/pharmacy:test: # Subtest: all-products filters roundtrip through the canonical domain builder
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: ok 175 - all-products filters roundtrip through the canonical domain builder
@e-pharmacy/api:test:   duration_ms: 0.965564
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   duration_ms: 3.82098
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # Subtest: Settings mutations keep domain changes and audit writes in transactions
@e-pharmacy/pharmacy:test: # Subtest: invalid known enum segments normalize to canonical defaults
@e-pharmacy/api:test: ok 176 - Settings mutations keep domain changes and audit writes in transactions
@e-pharmacy/pharmacy:test: ok 176 - invalid known enum segments normalize to canonical defaults
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.177153
@e-pharmacy/pharmacy:test:   duration_ms: 1.555476
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # Subtest: Category usage and mutation locks cover products and product requests
@e-pharmacy/pharmacy:test: # Subtest: unknown filter segments normalize deterministically to canonical base routes
@e-pharmacy/api:test: ok 177 - Category usage and mutation locks cover products and product requests
@e-pharmacy/pharmacy:test: ok 177 - unknown filter segments normalize deterministically to canonical base routes
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.892752
@e-pharmacy/pharmacy:test:   duration_ms: 1.509563
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # Subtest: Settings duplicate failures are translated from Mongo unique indexes
@e-pharmacy/pharmacy:test: # Subtest: exposes app-local pharmacy routes
@e-pharmacy/pharmacy:test: ok 178 - exposes app-local pharmacy routes
@e-pharmacy/api:test: ok 178 - Settings duplicate failures are translated from Mongo unique indexes
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.376579
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Category color is audited and can change without renaming an in-use category
@e-pharmacy/pharmacy:test:   duration_ms: 4.592225
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: matches canonical route families without re-parsing section names in layout
@e-pharmacy/pharmacy:test: ok 179 - matches canonical route families without re-parsing section names in layout
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.318027
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: builds dynamic routes only from validated entity IDs
@e-pharmacy/pharmacy:test: ok 180 - builds dynamic routes only from validated entity IDs
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 1.022607
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: ok 179 - Category color is audited and can change without renaming an in-use category
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: rejects empty and malformed dynamic route IDs
@e-pharmacy/api:test:   duration_ms: 0.388173
@e-pharmacy/pharmacy:test: ok 181 - rejects empty and malformed dynamic route IDs
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 2.360112
@e-pharmacy/api:test: # Subtest: Settings mutations distinguish stale resources from in-use conflicts
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: does not expose a route builder for a missing request edit page
@e-pharmacy/pharmacy:test: ok 182 - does not expose a route builder for a missing request edit page
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.371014
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: ok 180 - Settings mutations distinguish stale resources from in-use conflicts
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: keeps pharmacy client statistics app-local and fully labelled
@e-pharmacy/api:test:   duration_ms: 0.656694
@e-pharmacy/pharmacy:test: ok 183 - keeps pharmacy client statistics app-local and fully labelled
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   duration_ms: 4.350139
@e-pharmacy/api:test: # Subtest: Category usage is re-read inside mutation transactions before edit and delete
@e-pharmacy/api:test: ok 181 - Category usage is re-read inside mutation transactions before edit and delete
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   duration_ms: 0.720695
@e-pharmacy/pharmacy:test: # Subtest: adding a product updates only pharmacy-membership product statistics
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 184 - adding a product updates only pharmacy-membership product statistics
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: # Subtest: Settings date filters include complete UTC calendar-day boundaries
@e-pharmacy/pharmacy:test:   duration_ms: 4.866776
@e-pharmacy/api:test: ok 182 - Settings date filters include complete UTC calendar-day boundaries
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   duration_ms: 0.531941
@e-pharmacy/pharmacy:test: # Subtest: removing an own product subtracts its stock contribution without producing negative statistics
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: ok 185 - removing an own product subtracts its stock contribution without producing negative statistics
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: # ◇ injected env (19) from .env // tip: ◈ secrets for agents [www.dotenvx.com]
@e-pharmacy/pharmacy:test:   duration_ms: 1.12881
@e-pharmacy/api:test: # Subtest: registration rolls User back when Client creation fails
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test: ok 183 - registration rolls User back when Client creation fails # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.118836
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: registration rolls User and Pharmacy back when document claim fails
@e-pharmacy/api:test: ok 184 - registration rolls User and Pharmacy back when document claim fails # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.301449
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: session creation failure does not roll back a committed registration
@e-pharmacy/api:test: ok 185 - session creation failure does not roll back a committed registration # SKIP
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test: # Subtest: removing a zero-stock product decrements the out-of-stock product count
@e-pharmacy/api:test:   duration_ms: 0.23142
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: concurrent duplicate email registration creates one identity only
@e-pharmacy/api:test: ok 186 - concurrent duplicate email registration creates one identity only # SKIP
@e-pharmacy/pharmacy:test: ok 186 - removing a zero-stock product decrements the out-of-stock product count
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.211014
@e-pharmacy/pharmacy:test:   duration_ms: 0.582956
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test: # Subtest: concurrent duplicate phone registration creates one identity only
@e-pharmacy/pharmacy:test: # Subtest: background refresh keeps the last known good pharmacy profile visible
@e-pharmacy/api:test: ok 187 - concurrent duplicate phone registration creates one identity only # SKIP
@e-pharmacy/pharmacy:test: ok 187 - background refresh keeps the last known good pharmacy profile visible
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.233275
@e-pharmacy/pharmacy:test:   duration_ms: 2.968112
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: password change and revoke-all roll back together when session update fails
@e-pharmacy/api:test: ok 188 - password change and revoke-all roll back together when session update fails # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.209623
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # Subtest: refresh transport error preserves the existing profile and exposes the error
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test: ok 188 - refresh transport error preserves the existing profile and exposes the error
@e-pharmacy/api:test: # Subtest: one reset token has exactly one successful concurrent consumer
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test: ok 189 - one reset token has exactly one successful concurrent consumer # SKIP
@e-pharmacy/pharmacy:test:   duration_ms: 0.563941
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   duration_ms: 0.489739
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: password change revokes refresh tokens from all existing devices
@e-pharmacy/api:test: ok 190 - password change revokes refresh tokens from all existing devices # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.216579
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: login does not enumerate unknown accounts, wrong passwords or wrong applications
@e-pharmacy/pharmacy:test: # Subtest: initial profile retry without cached data remains an initial loading state
@e-pharmacy/api:test: ok 191 - login does not enumerate unknown accounts, wrong passwords or wrong applications # SKIP
@e-pharmacy/pharmacy:test: ok 189 - initial profile retry without cached data remains an initial loading state
@e-pharmacy/api:test:   ---
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.8691
@e-pharmacy/pharmacy:test:   duration_ms: 0.370086
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: initial profile load error does not invent cached profile data
@e-pharmacy/pharmacy:test: ok 190 - initial profile load error does not invent cached profile data
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 0.391883
@e-pharmacy/api:test: # Subtest: admin-created pharmacy rolls User back when Pharmacy creation fails
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: hybrid pharmacy routes fail closed for malformed entity ids before mounting detail clients
@e-pharmacy/pharmacy:test: ok 191 - hybrid pharmacy routes fail closed for malformed entity ids before mounting detail clients
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 28.984539
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: # Subtest: client hybrid route resolver accepts only canonical filters or valid ObjectIds
@e-pharmacy/pharmacy:test: ok 192 - client hybrid route resolver accepts only canonical filters or valid ObjectIds
@e-pharmacy/pharmacy:test:   ---
@e-pharmacy/pharmacy:test:   duration_ms: 13.478938
@e-pharmacy/pharmacy:test:   type: 'test'
@e-pharmacy/pharmacy:test:   ...
@e-pharmacy/pharmacy:test: 1..192
@e-pharmacy/pharmacy:test: # tests 192
@e-pharmacy/api:test: ok 192 - admin-created pharmacy rolls User back when Pharmacy creation fails # SKIP
@e-pharmacy/pharmacy:test: # suites 0
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.423767
@e-pharmacy/pharmacy:test: # pass 192
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/pharmacy:test: # fail 0
@e-pharmacy/pharmacy:test: # cancelled 0
@e-pharmacy/pharmacy:test: # skipped 0
@e-pharmacy/pharmacy:test: # todo 0
@e-pharmacy/pharmacy:test: # duration_ms 184898.047215
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: reading a missing pharmacy profile reports integrity failure without auto-creating one
@e-pharmacy/api:test: ok 193 - reading a missing pharmacy profile reports integrity failure without auto-creating one # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.392347
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy profile document attachment is status-checked and atomic with the Pharmacy update
@e-pharmacy/api:test: ok 194 - pharmacy profile document attachment is status-checked and atomic with the Pharmacy update # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.740279
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy registration stores verified binary evidence and exposes it only through controlled access services
@e-pharmacy/api:test: ok 195 - pharmacy registration stores verified binary evidence and exposes it only through controlled access services # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.214261
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy document upload rejects MIME and size spoofing
@e-pharmacy/api:test: ok 196 - pharmacy document upload rejects MIME and size spoofing # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.300058
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: registration upload sessions enforce file-count, aggregate-byte and expiry quotas
@e-pharmacy/api:test: ok 197 - registration upload sessions enforce file-count, aggregate-byte and expiry quotas # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.177159
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy registration rejects document claims from different upload sessions atomically
@e-pharmacy/api:test: ok 198 - pharmacy registration rejects document claims from different upload sessions atomically # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.408115
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: private pharmacy document replacement and removal use server document IDs
@e-pharmacy/api:test: ok 199 - private pharmacy document replacement and removal use server document IDs # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.203594
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: active pharmacy document drafts keep approved files and delete superseded pending files
@e-pharmacy/api:test: ok 200 - active pharmacy document drafts keep approved files and delete superseded pending files # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.176695
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy activation rolls back when default User creation fails
@e-pharmacy/api:test: ok 201 - pharmacy activation rolls back when default User creation fails # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.163246
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy activation rolls back User and pharmacy status when Client creation fails
@e-pharmacy/api:test: ok 202 - pharmacy activation rolls back User and pharmacy status when Client creation fails # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.156753
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: logout revokes only the current refresh session while logout-all revokes every device
@e-pharmacy/api:test: ok 203 - logout revokes only the current refresh session while logout-all revokes every device # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.165102
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: refresh rotation is race-safe, bounded by an absolute lifetime, and revokes reuse after grace
@e-pharmacy/api:test: ok 204 - refresh rotation is race-safe, bounded by an absolute lifetime, and revokes reuse after grace # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.172058
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: profile update cannot mass-assign role or status
@e-pharmacy/api:test: ok 205 - profile update cannot mass-assign role or status # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.166493
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: stale client profile revisions cannot overwrite a newer saved profile
@e-pharmacy/api:test: ok 206 - stale client profile revisions cannot overwrite a newer saved profile # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.155362
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: active pharmacy moderation submission atomically stores pending changes and transitions status
@e-pharmacy/api:test: ok 207 - active pharmacy moderation submission atomically stores pending changes and transitions status # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.169275
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: stale pharmacy profile revisions cannot overwrite newer pending moderation data
@e-pharmacy/api:test: ok 208 - stale pharmacy profile revisions cannot overwrite newer pending moderation data # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.147478
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy managers can read the profile but cannot edit verification data or submit moderation
@e-pharmacy/api:test: ok 209 - pharmacy managers can read the profile but cannot edit verification data or submit moderation # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.157681
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy profiles already under review reject repeated submission explicitly
@e-pharmacy/api:test: ok 210 - pharmacy profiles already under review reject repeated submission explicitly # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.144231
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: password recovery timing floor equalizes fast and slower account lookup paths without wall-clock sleeps
@e-pharmacy/api:test: ok 211 - password recovery timing floor equalizes fast and slower account lookup paths without wall-clock sleeps
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.783415
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: password recovery timing floor never adds delay once real work exceeded the target
@e-pharmacy/api:test: ok 212 - password recovery timing floor never adds delay once real work exceeded the target
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.068051
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: registration commits User and role profile before creating a browser session
@e-pharmacy/api:test: ok 213 - registration commits User and role profile before creating a browser session
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.873386
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: password change and reset revoke sessions in the same Mongo transaction
@e-pharmacy/api:test: ok 214 - password change and reset revoke sessions in the same Mongo transaction
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.847767
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: login does not branch on application-specific copy before credential proof
@e-pharmacy/api:test: ok 215 - login does not branch on application-specific copy before credential proof
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.600578
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: refresh rotates tokens, caps sliding expiry with an absolute lifetime, and keeps stale-cookie fallback safe
@e-pharmacy/api:test: ok 216 - refresh rotates tokens, caps sliding expiry with an absolute lifetime, and keeps stale-cookie fallback safe
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.892288
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: password reset uses only opaque hashed reset secrets without stale application/JWT semantics
@e-pharmacy/api:test: ok 217 - password reset uses only opaque hashed reset secrets without stale application/JWT semantics
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.633506
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: cart reads clean their own stale items while global cleanup is deployment-owned
@e-pharmacy/api:test: ok 218 - cart reads clean their own stale items while global cleanup is deployment-owned
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 63.001883
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: classifies stale cart references without silently dropping them
@e-pharmacy/api:test: ok 219 - classifies stale cart references without silently dropping them
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.21159
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy-group removal is one backend cart mutation and is idempotent
@e-pharmacy/api:test: ok 220 - pharmacy-group removal is one backend cart mutation and is idempotent
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 12.900156
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: cart persistence stores intent only while response prices stay live
@e-pharmacy/api:test: ok 221 - cart persistence stores intent only while response prices stay live
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 79.459599
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: cart add never silently clamps requested quantity and enforces the shared max
@e-pharmacy/api:test: ok 222 - cart add never silently clamps requested quantity and enforces the shared max
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 15.687398
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: cart serialization cleans stale items transactionally and reports issues
@e-pharmacy/api:test: ok 223 - cart serialization cleans stale items transactionally and reports issues
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 13.313837
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: cart mutations do not reserve, release or commit stock
@e-pharmacy/api:test: ok 224 - cart mutations do not reserve, release or commit stock
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 13.042069
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: checkout rejects stale revision/fingerprint before stock reservation or order creation
@e-pharmacy/api:test: ok 225 - checkout rejects stale revision/fingerprint before stock reservation or order creation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 39.781047
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend checkout fingerprint changes with transactional group data
@e-pharmacy/api:test: ok 226 - backend checkout fingerprint changes with transactional group data
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.97727
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: client list derives canonical metrics before applying first-order filters
@e-pharmacy/api:test: ok 227 - client list derives canonical metrics before applying first-order filters
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 19.852494
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: client list pagination and statistics stay inside one Mongo aggregation
@e-pharmacy/api:test: ok 228 - client list pagination and statistics stay inside one Mongo aggregation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.040459
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: purchased products stay historical and paginate inside Mongo aggregation
@e-pharmacy/api:test: ok 229 - purchased products stay historical and paginate inside Mongo aggregation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 23.791271
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Walk-in identity is flag-based and never inferred from the display name
@e-pharmacy/api:test: ok 230 - Walk-in identity is flag-based and never inferred from the display name
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 9.095872
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: client and purchased-product pagination clamp stale requested pages before returning data
@e-pharmacy/api:test: ok 231 - client and purchased-product pagination clamp stale requested pages before returning data
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.110952
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: client purchase history has a compound order index for scoped pagination
@e-pharmacy/api:test: ok 232 - client purchase history has a compound order index for scoped pagination
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.326833
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: default client projection suppresses synthetic contact fields and stays active
@e-pharmacy/api:test: ok 233 - default client projection suppresses synthetic contact fields and stays active
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 40.026843
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: first-order filters are applied after canonical client metrics are derived
@e-pharmacy/api:test: ok 234 - first-order filters are applied after canonical client metrics are derived # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.410663
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: purchased-product history stays on the order snapshot while current metadata controls availability
@e-pharmacy/api:test: ok 235 - purchased-product history stays on the order snapshot while current metadata controls availability # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.47768
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: purchased products aggregate repeated product purchases across successful orders
@e-pharmacy/api:test: ok 236 - purchased products aggregate repeated product purchases across successful orders # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.473971
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: client resources are isolated to the authenticated owner or manager pharmacy
@e-pharmacy/api:test: ok 237 - client resources are isolated to the authenticated owner or manager pharmacy # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.750141
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: retrying the same manager order request returns the committed order without reserving stock twice
@e-pharmacy/api:test: ok 238 - retrying the same manager order request returns the committed order without reserving stock twice # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.453794
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: manager order request fingerprint ignores the replay key and normalizes item order
@e-pharmacy/api:test: ok 239 - manager order request fingerprint ignores the replay key and normalizes item order
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 61.805827
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: manager order request fingerprint changes when transactional order data changes
@e-pharmacy/api:test: ok 240 - manager order request fingerprint changes when transactional order data changes
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.739245
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order client search covers historical and current client identity fields
@e-pharmacy/api:test: ok 241 - order client search covers historical and current client identity fields
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 120.635195
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order client search accepts email and phone syntax
@e-pharmacy/api:test: ok 242 - order client search accepts email and phone syntax
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 8.387698
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: new checkout and manager orders persist immutable client snapshots
@e-pharmacy/api:test: ok 243 - new checkout and manager orders persist immutable client snapshots
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 98.750008
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Walk-in snapshots do not copy synthetic credentials into order history
@e-pharmacy/api:test: ok 244 - Walk-in snapshots do not copy synthetic credentials into order history
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 103.912667
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: invalid client order id is rejected before any fallback lookup
@e-pharmacy/api:test: ok 245 - invalid client order id is rejected before any fallback lookup
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 6.335527
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: invalid pharmacy order id is rejected instead of resolving the latest pharmacy order
@e-pharmacy/api:test: ok 246 - invalid pharmacy order id is rejected instead of resolving the latest pharmacy order
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.606144
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Mongo lifecycle keeps checkout snapshot immutable and stock reservation transactional
@e-pharmacy/api:test: ok 247 - Mongo lifecycle keeps checkout snapshot immutable and stock reservation transactional # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.455068
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: Mongo transaction rolls back a reservation when later work fails
@e-pharmacy/api:test: ok 248 - Mongo transaction rolls back a reservation when later work fails # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.381217
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend rejects bank transfer edits when the confirmed order snapshot has no bank details
@e-pharmacy/api:test: ok 249 - backend rejects bank transfer edits when the confirmed order snapshot has no bank details # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.267594
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: retrying the same checkout after a committed response is lost cannot create a duplicate order
@e-pharmacy/api:test: ok 250 - retrying the same checkout after a committed response is lost cannot create a duplicate order # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.302377
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: only one checkout can reserve the last available unit
@e-pharmacy/api:test: ok 251 - only one checkout can reserve the last available unit # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.347362
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order details keep the historical client snapshot after the client profile changes
@e-pharmacy/api:test: ok 252 - order details keep the historical client snapshot after the client profile changes # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.257855
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: successful sales use successfulAt instead of order creation time
@e-pharmacy/api:test: ok 253 - successful sales use successfulAt instead of order creation time # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.265275
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: rejected orders never contribute to sales statistics
@e-pharmacy/api:test: ok 254 - rejected orders never contribute to sales statistics # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.254145
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: sales statistics remain isolated to the authenticated pharmacy
@e-pharmacy/api:test: ok 255 - sales statistics remain isolated to the authenticated pharmacy # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.781912
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: concurrent terminal status changes commit exactly one stock outcome
@e-pharmacy/api:test: ok 256 - concurrent terminal status changes commit exactly one stock outcome # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.124636
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: orders clamp stale pages before applying skip and limit
@e-pharmacy/api:test: ok 257 - orders clamp stale pages before applying skip and limit
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 52.961317
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order responses keep the confirmed pharmacy snapshot immutable
@e-pharmacy/api:test: ok 258 - order responses keep the confirmed pharmacy snapshot immutable
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 74.983316
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: cart limits the number of pharmacy groups to prevent excessive orders
@e-pharmacy/api:test: ok 259 - cart limits the number of pharmacy groups to prevent excessive orders
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.198141
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order status state machine allows only forward terminal transitions
@e-pharmacy/api:test: ok 260 - order status state machine allows only forward terminal transitions
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.595941
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: order services keep owner/manager membership explicit and block a foreign pharmacy across read and mutation paths
@e-pharmacy/api:test: ok 261 - order services keep owner/manager membership explicit and block a foreign pharmacy across read and mutation paths # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.302605
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: checkout and pharmacy edits keep cart, order and stock inside Mongo transactions
@e-pharmacy/api:test: ok 262 - checkout and pharmacy edits keep cart, order and stock inside Mongo transactions
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 25.822573
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product-request statistics return one tenant-scoped status distribution
@e-pharmacy/api:test: ok 263 - product-request statistics return one tenant-scoped status distribution # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.85588
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: managed-product statistics keep added/not-added counts scoped to the current pharmacy
@e-pharmacy/api:test: ok 264 - managed-product statistics keep added/not-added counts scoped to the current pharmacy # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.442435
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: verification document content has owner/admin-only route boundaries
@e-pharmacy/api:test: ok 265 - verification document content has owner/admin-only route boundaries
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.03014
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy notes enforce ownership for every supported entity type
@e-pharmacy/api:test: ok 266 - pharmacy notes enforce ownership for every supported entity type
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 16.034297
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: all pharmacy note operations pass through entity access validation
@e-pharmacy/api:test: ok 267 - all pharmacy note operations pass through entity access validation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 101.04241
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy note routes require the authenticated pharmacy role
@e-pharmacy/api:test: ok 268 - pharmacy note routes require the authenticated pharmacy role
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 64.172896
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy notes reuse centralized membership and blocked-pharmacy access
@e-pharmacy/api:test: ok 269 - pharmacy notes reuse centralized membership and blocked-pharmacy access
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 69.341121
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy notes reject unrelated client and pharmacy entities
@e-pharmacy/api:test: ok 270 - pharmacy notes reject unrelated client and pharmacy entities # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.382374
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: internal pharmacy notes are shared: owner and managers can delete each other notes inside the same pharmacy
@e-pharmacy/api:test: ok 271 - internal pharmacy notes are shared: owner and managers can delete each other notes inside the same pharmacy # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.34829
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy note author snapshot survives author rename and deletion
@e-pharmacy/api:test: ok 272 - pharmacy note author snapshot survives author rename and deletion # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.254609
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: internal pharmacy notes fail closed for a non-pharmacy actor even with stale pharmacy membership
@e-pharmacy/api:test: ok 273 - internal pharmacy notes fail closed for a non-pharmacy actor even with stale pharmacy membership # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.233275
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: removed pharmacy manager immediately loses internal note read and delete access
@e-pharmacy/api:test: ok 274 - removed pharmacy manager immediately loses internal note read and delete access # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.265739
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy note create is idempotent for an ambiguous retry and rejects request-key reuse with different text
@e-pharmacy/api:test: ok 275 - pharmacy note create is idempotent for an ambiguous retry and rejects request-key reuse with different text # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.234667
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: operational pharmacy mutations require active or on_moderation status while reads and tenant isolation remain intact
@e-pharmacy/api:test: ok 276 - operational pharmacy mutations require active or on_moderation status while reads and tenant isolation remain intact # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.318373
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend pharmacy profile transition graph is explicit for every status
@e-pharmacy/api:test: ok 277 - backend pharmacy profile transition graph is explicit for every status
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.535758
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: owner and manager pharmacy-profile capabilities follow least privilege
@e-pharmacy/api:test: ok 278 - owner and manager pharmacy-profile capabilities follow least privilege
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.66968
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: profile and document services enforce the membership capability matrix
@e-pharmacy/api:test: ok 279 - profile and document services enforce the membership capability matrix
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 14.541893
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: private pharmacy document responses are explicitly non-cacheable at the backend boundary
@e-pharmacy/api:test: ok 280 - private pharmacy document responses are explicitly non-cacheable at the backend boundary
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 91.38909
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: current pharmacy summary exposes identity/status fields without private profile details
@e-pharmacy/api:test: ok 281 - current pharmacy summary exposes identity/status fields without private profile details
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 52.805028
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: full profile serializer keeps owner-only private fields out of manager DTOs
@e-pharmacy/api:test: ok 282 - full profile serializer keeps owner-only private fields out of manager DTOs
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 10.149088
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: owner-facing profile document metadata omits the stored sha256 fingerprint
@e-pharmacy/api:test: ok 283 - owner-facing profile document metadata omits the stored sha256 fingerprint
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.048343
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: generic public pharmacy details expose availability but never payment credentials
@e-pharmacy/api:test: ok 284 - generic public pharmacy details expose availability but never payment credentials
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 65.287793
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: complete bank details remain owned by the authenticated checkout endpoint
@e-pharmacy/api:test: ok 285 - complete bank details remain owned by the authenticated checkout endpoint
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 6.867469
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: blocked pharmacy members can read the minimal current summary while full profile access remains blocked
@e-pharmacy/api:test: ok 286 - blocked pharmacy members can read the minimal current summary while full profile access remains blocked # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.758025
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: initial ProductCategory seed contains only real categories
@e-pharmacy/api:test: ok 287 - initial ProductCategory seed contains only real categories
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.026775
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: ProductCategory seed uses idempotent upserts with setOnInsert only
@e-pharmacy/api:test: ok 288 - ProductCategory seed uses idempotent upserts with setOnInsert only
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.006722
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: legacy Other migrates to custom request metadata, not a category record
@e-pharmacy/api:test: ok 289 - legacy Other migrates to custom request metadata, not a category record
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 0.976694
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product domain stores ProductCategory relations instead of static category strings
@e-pharmacy/api:test: ok 290 - product domain stores ProductCategory relations instead of static category strings
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 53.132448
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: query validation accepts dynamic category slugs without a static enum
@e-pharmacy/api:test: ok 291 - query validation accepts dynamic category slugs without a static enum
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.702485
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: custom Product Request behavior is metadata-based and public categories have a canonical read route
@e-pharmacy/api:test: ok 292 - custom Product Request behavior is metadata-based and public categories have a canonical read route
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 53.835983
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: legacy relation migration covers products, product requests and order snapshots without making legacy values authoritative
@e-pharmacy/api:test: ok 293 - legacy relation migration covers products, product requests and order snapshots without making legacy values authoritative
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 8.062597
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: managed products derive pharmacy scope from the authenticated pharmacy actor
@e-pharmacy/api:test: ok 294 - managed products derive pharmacy scope from the authenticated pharmacy actor # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.418547
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: managed product reads bind pharmacy scope to the authenticated actor
@e-pharmacy/api:test: ok 295 - managed product reads bind pharmacy scope to the authenticated actor
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 20.050986
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: pharmacy management offer projection exposes operational fields only for the current pharmacy
@e-pharmacy/api:test: ok 296 - pharmacy management offer projection exposes operational fields only for the current pharmacy
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 21.378289
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product offer add/remove mutations keep relation checks and writes in transactions
@e-pharmacy/api:test: ok 297 - product offer add/remove mutations keep relation checks and writes in transactions
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 46.526544
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product offer mutations remain consistent under concurrent add and order/remove races
@e-pharmacy/api:test: ok 298 - product offer mutations remain consistent under concurrent add and order/remove races # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.366605
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request deletion keeps request and private-note cleanup in one transaction
@e-pharmacy/api:test: ok 299 - product request deletion keeps request and private-note cleanup in one transaction
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 54.055345
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: legacy request history is explicitly marked as inferred in the API projection
@e-pharmacy/api:test: ok 300 - legacy request history is explicitly marked as inferred in the API projection
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 8.851466
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request deletion rolls request and private notes back together
@e-pharmacy/api:test: ok 301 - product request deletion rolls request and private notes back together # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.596746
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: active product request articles have a storage-level uniqueness backstop
@e-pharmacy/api:test: ok 302 - active product request articles have a storage-level uniqueness backstop
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 20.837072
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: admin moderation endpoint owns the request transition graph and approved product relation
@e-pharmacy/api:test: ok 303 - admin moderation endpoint owns the request transition graph and approved product relation
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 11.02329
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: product request uniqueness and moderation remain backend-authoritative under concurrency
@e-pharmacy/api:test: ok 304 - product request uniqueness and moderation remain backend-authoritative under concurrency # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.721036
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: public product endpoints are active-only while blocked lifecycle access is management-only
@e-pharmacy/api:test: ok 305 - public product endpoints are active-only while blocked lifecycle access is management-only
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 21.679274
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: distributed auth rate-limit callers share one Mongo counter without storing the raw key
@e-pharmacy/api:test: ok 306 - distributed auth rate-limit callers share one Mongo counter without storing the raw key # SKIP
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.812749
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: legacy stock backfill preserves the current balance when old orders cannot be replayed safely
@e-pharmacy/api:test: ok 307 - legacy stock backfill preserves the current balance when old orders cannot be replayed safely
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 22.658751
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: reservation reconciliation does not turn legacy over-reservation into a failed stock-movement response
@e-pharmacy/api:test: ok 308 - reservation reconciliation does not turn legacy over-reservation into a failed stock-movement response
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 6.086484
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: legacy stock replay tolerates incomplete historical order metadata
@e-pharmacy/api:test: ok 309 - legacy stock replay tolerates incomplete historical order metadata
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.728456
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: stock movement response keeps the canonical pagination envelope expected by the pharmacy client
@e-pharmacy/api:test: ok 310 - stock movement response keeps the canonical pagination envelope expected by the pharmacy client
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 43.789388
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: creates UTC day boundaries for validated calendar dates
@e-pharmacy/api:test: ok 311 - creates UTC day boundaries for validated calendar dates
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 5.354195
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: rejects malformed and non-existent calendar dates
@e-pharmacy/api:test: ok 312 - rejects malformed and non-existent calendar dates
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.516056
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: email preview metadata never contains message bodies or reset secrets
@e-pharmacy/api:test: ok 313 - email preview metadata never contains message bodies or reset secrets
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.558946
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: preserves a stable business error code
@e-pharmacy/api:test: ok 314 - preserves a stable business error code
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 2.844286
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: classifies only entity + user duplicate keys as review uniqueness conflicts
@e-pharmacy/api:test: ok 315 - classifies only entity + user duplicate keys as review uniqueness conflicts
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 7.842772
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: routes password reset to the selected frontend application
@e-pharmacy/api:test: ok 316 - routes password reset to the selected frontend application
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.128922
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: keeps the legacy pharmacy fallback but never falls admin back to client
@e-pharmacy/api:test: ok 317 - keeps the legacy pharmacy fallback but never falls admin back to client
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.701562
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: includes a query fallback while keeping the fragment reset handoff
@e-pharmacy/api:test: ok 318 - includes a query fallback while keeping the fragment reset handoff
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 6.866542
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: backend serializes the same typed public slug contract as the client
@e-pharmacy/api:test: ok 319 - backend serializes the same typed public slug contract as the client
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 3.785734
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: matches addresses when punctuation is omitted from the search value
@e-pharmacy/api:test: ok 320 - matches addresses when punctuation is omitted from the search value
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 4.205907
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: # Subtest: matches pharmacy names across hyphenated words
@e-pharmacy/api:test: ok 321 - matches pharmacy names across hyphenated words
@e-pharmacy/api:test:   ---
@e-pharmacy/api:test:   duration_ms: 1.592114
@e-pharmacy/api:test:   type: 'test'
@e-pharmacy/api:test:   ...
@e-pharmacy/api:test: 1..321
@e-pharmacy/api:test: # tests 321
@e-pharmacy/api:test: # suites 0
@e-pharmacy/api:test: # pass 262
@e-pharmacy/api:test: # fail 0
@e-pharmacy/api:test: # cancelled 0
@e-pharmacy/api:test: # skipped 59
@e-pharmacy/api:test: # todo 0
@e-pharmacy/api:test: # duration_ms 185799.364453

 Tasks:    22 successful, 22 total
Cached:    11 cached, 22 total
  Time:    3m32.432s 


> e-pharmacy@0.1.0 test:react D:\Projects\сareer-skills\e-pharmacy
> pnpm --filter @e-pharmacy/client test:react && pnpm --filter @e-pharmacy/pharmacy test:react && pnpm --filter @e-pharmacy/admin test:react


> @e-pharmacy/client@0.1.0 test:react D:\Projects\сareer-skills\e-pharmacy\apps\client
> node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.react.test.tsx

TAP version 13
# Subtest: supports contextual heading levels and unique instance labels
ok 1 - supports contextual heading levels and unique instance labels
  ---
  duration_ms: 43.537099
  type: 'test'
  ...
# Subtest: renders catalog collections with list semantics
ok 2 - renders catalog collections with list semantics
  ---
  duration_ms: 5.918137
  type: 'test'
  ...
# Subtest: renders unavailable, empty and success catalog states exclusively
ok 3 - renders unavailable, empty and success catalog states exclusively
  ---
  duration_ms: 70.749582
  type: 'test'
  ...
# Subtest: checkout confirmation button follows the validated canSubmit state
ok 4 - checkout confirmation button follows the validated canSubmit state
  ---
  duration_ms: 84.100984
  type: 'test'
  ...
# Subtest: announces active and pending favorite states
ok 5 - announces active and pending favorite states
  ---
  duration_ms: 57.094877
  type: 'test'
  ...
# Subtest: renders a required radio group with selected state and a described error
ok 6 - renders a required radio group with selected state and a described error
  ---
  duration_ms: 59.350178
  type: 'test'
  ...
# Subtest: disables every rating option while the composer is unavailable
ok 7 - disables every rating option while the composer is unavailable
  ---
  duration_ms: 8.404394
  type: 'test'
  ...
# Subtest: renders honest description fallbacks
ok 8 - renders honest description fallbacks
  ---
  duration_ms: 46.390197
  type: 'test'
  ...
# Subtest: renders the bank receipt email from payment details and retry state
ok 9 - renders the bank receipt email from payment details and retry state
  ---
  duration_ms: 77.343429
  type: 'test'
  ...
# Subtest: separates contact-email navigation from the explicit copy action
ok 10 - separates contact-email navigation from the explicit copy action
  ---
  duration_ms: 94.522303
  type: 'test'
  ...
# Subtest: renders offer-specific phone, favorite and quantity semantics
ok 11 - renders offer-specific phone, favorite and quantity semantics
  ---
  duration_ms: 58.16618
  type: 'test'
  ...
# Subtest: same-user favorite requests reject stale page responses
ok 12 - same-user favorite requests reject stale page responses
  ---
  duration_ms: 5.514659
  type: 'test'
  ...
# Subtest: only the latest non-aborted favorite request may commit
ok 13 - only the latest non-aborted favorite request may commit
  ---
  duration_ms: 0.419246
  type: 'test'
  ...
# Subtest: background auth revalidation preserves a dirty client profile draft
ok 14 - background auth revalidation preserves a dirty client profile draft
  ---
  duration_ms: 15.061776
  type: 'test'
  ...
# Subtest: successful save returns the form to canonical AuthUser-backed state
ok 15 - successful save returns the form to canonical AuthUser-backed state
  ---
  duration_ms: 7.463874
  type: 'test'
  ...
# Subtest: picture PATCH success is applied directly without a second current-user request
ok 16 - picture PATCH success is applied directly without a second current-user request
  ---
  duration_ms: 8.972509
  type: 'test'
  ...
# Subtest: account switching remounts private profile state for the next identity
ok 17 - account switching remounts private profile state for the next identity
  ---
  duration_ms: 3.711995
  type: 'test'
  ...
# Subtest: favorite profile reads are abortable/versioned and zero-timeout workarounds are absent
ok 18 - favorite profile reads are abortable/versioned and zero-timeout workarounds are absent
  ---
  duration_ms: 7.938772
  type: 'test'
  ...
# Subtest: renders Auth → Favorites → Cart inside the client provider stack
ok 19 - renders Auth → Favorites → Cart inside the client provider stack
  ---
  duration_ms: 18.07812
  type: 'test'
  ...
1..19
# tests 19
# suites 0
# pass 19
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 17476.36154

> @e-pharmacy/pharmacy@0.1.0 test:react D:\Projects\сareer-skills\e-pharmacy\apps\pharmacy
> node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.react.test.tsx

TAP version 13
# Subtest: initial loading and failure never synthesize zero statistics
ok 1 - initial loading and failure never synthesize zero statistics
  ---
  duration_ms: 191.387096
  type: 'test'
  ...
# Subtest: refresh loading and failure preserve the last-known-good statistics
ok 2 - refresh loading and failure preserve the last-known-good statistics
  ---
  duration_ms: 161.995832
  type: 'test'
  ...
# Subtest: load error stays an error rather than an empty result and Retry recovers
ok 3 - load error stays an error rather than an empty result and Retry recovers
  ---
  duration_ms: 97.853545
  type: 'test'
  ...
# Subtest: a stale page response cannot overwrite a newer comments page
ok 4 - a stale page response cannot overwrite a newer comments page
  ---
  duration_ms: 12.544446
  type: 'test'
  ...
# Subtest: deleting the last comment on a later page reloads the previous page
ok 5 - deleting the last comment on a later page reloads the previous page
  ---
  duration_ms: 27.418396
  type: 'test'
  ...
# Subtest: unmount aborts an in-flight comment mutation
ok 6 - unmount aborts an in-flight comment mutation
  ---
  duration_ms: 35.642849
  type: 'test'
  ...
# Subtest: ambiguous create retry reuses the same client request ID until it succeeds
ok 7 - ambiguous create retry reuses the same client request ID until it succeeds
  ---
  duration_ms: 9.200219
  type: 'test'
  ...
# Subtest: initial summary loading blocks cabinet children
ok 8 - initial summary loading blocks cabinet children
  ---
  duration_ms: 6.437556
  type: 'test'
  ...
# Subtest: initial summary failure renders the branded cabinet error instead of children
ok 9 - initial summary failure renders the branded cabinet error instead of children
  ---
  duration_ms: 0.830607
  type: 'test'
  ...
# Subtest: blocked and last-known-good summaries keep cabinet children renderable
ok 10 - blocked and last-known-good summaries keep cabinet children renderable
  ---
  duration_ms: 0.655304
  type: 'test'
  ...
# Subtest: canonical filter generations remount all three list feature states on Back/Forward-like URL changes
ok 11 - canonical filter generations remount all three list feature states on Back/Forward-like URL changes
  ---
  duration_ms: 100.384324
  type: 'test'
  ...
# Subtest: changing the product-request generation key remounts local UI state
ok 12 - changing the product-request generation key remounts local UI state
  ---
  duration_ms: 100.298063
  type: 'test'
  ...
# Subtest: unauthenticated state performs no summary request; authenticated pharmacy loads once
ok 13 - unauthenticated state performs no summary request; authenticated pharmacy loads once
  ---
  duration_ms: 67.933587
  type: 'test'
  ...
# Subtest: blocked pharmacy summary remains available with its authoritative status
ok 14 - blocked pharmacy summary remains available with its authoritative status
  ---
  duration_ms: 9.016103
  type: 'test'
  ...
# Subtest: initial failure exposes error and retry can recover
ok 15 - initial failure exposes error and retry can recover
  ---
  duration_ms: 16.970179
  type: 'test'
  ...
# Subtest: refresh transport failure preserves the last-known-good summary
ok 16 - refresh transport failure preserves the last-known-good summary
  ---
  duration_ms: 10.906883
  type: 'test'
  ...
# Subtest: account switch ignores an older account response and logout clears private state
ok 17 - account switch ignores an older account response and logout clears private state
  ---
  duration_ms: 9.099117
  type: 'test'
  ...
# Subtest: newer reload wins when concurrent refreshes resolve out of order
ok 18 - newer reload wins when concurrent refreshes resolve out of order
  ---
  duration_ms: 8.298191
  type: 'test'
  ...
# Subtest: authoritative mutation sync prevents an older GET from overwriting state
ok 19 - authoritative mutation sync prevents an older GET from overwriting state
  ---
  duration_ms: 7.853902
  type: 'test'
  ...
# Subtest: unmount aborts the active request and its later response cannot commit
ok 20 - unmount aborts the active request and its later response cannot commit
  ---
  duration_ms: 9.139001
  type: 'test'
  ...
# Subtest: StrictMode lifecycle settles on the current pharmacy summary
ok 21 - StrictMode lifecycle settles on the current pharmacy summary
  ---
  duration_ms: 11.468969
  type: 'test'
  ...
# Subtest: stale pharmacy owner responses cannot overwrite a new account
ok 22 - stale pharmacy owner responses cannot overwrite a new account
  ---
  duration_ms: 4.694254
  type: 'test'
  ...
# Subtest: only the current non-aborted pharmacy profile request may commit
ok 23 - only the current non-aborted pharmacy profile request may commit
  ---
  duration_ms: 0.526376
  type: 'test'
  ...
# Subtest: authoritative profile sync invalidates a pending older GET
ok 24 - authoritative profile sync invalidates a pending older GET
  ---
  duration_ms: 0.618666
  type: 'test'
  ...
# Subtest: a mutation sync makes an in-flight refresh response obsolete
ok 25 - a mutation sync makes an in-flight refresh response obsolete
  ---
  duration_ms: 0.612173
  type: 'test'
  ...
1..25
# tests 25
# suites 0
# pass 25
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 14133.521438

> @e-pharmacy/admin@0.1.0 test:react D:\Projects\сareer-skills\e-pharmacy\apps\admin
> node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.react.test.tsx --allow-empty

TAP version 13
# Subtest: route error wires Try again to reset without invoking reset during render
ok 1 - route error wires Try again to reset without invoking reset during render
  ---
  duration_ms: 2.75246
  type: 'test'
  ...
# Subtest: permission gate delegates authorization to the canonical admin helper
ok 2 - permission gate delegates authorization to the canonical admin helper
  ---
  duration_ms: 3.14017
  type: 'test'
  ...
# Subtest: admin auth pages reuse the shared auth shell and stay noindex
ok 3 - admin auth pages reuse the shared auth shell and stay noindex
  ---
  duration_ms: 3.234315
  type: 'test'
  ...
# Subtest: admin auth layout keeps the client-style logo-only auth header
ok 4 - admin auth layout keeps the client-style logo-only auth header
  ---
  duration_ms: 0.735999
  type: 'test'
  ...
# Subtest: admin login and recovery show shared account guidance panels
ok 5 - admin login and recovery show shared account guidance panels
  ---
  duration_ms: 1.893099
  type: 'test'
  ...
# Subtest: admin login fixes application to admin and has no registration flow
ok 6 - admin login fixes application to admin and has no registration flow
  ---
  duration_ms: 0.631187
  type: 'test'
  ...
# Subtest: password recovery is single-flight and does not enumerate accounts
ok 7 - password recovery is single-flight and does not enumerate accounts
  ---
  duration_ms: 1.10794
  type: 'test'
  ...
# Subtest: reset password uses the shared transient-token lifecycle and invalidates auth
ok 8 - reset password uses the shared transient-token lifecycle and invalidates auth
  ---
  duration_ms: 0.715593
  type: 'test'
  ...
# Subtest: admin cabinet composes shared shell primitives without business fetching
ok 9 - admin cabinet composes shared shell primitives without business fetching
  ---
  duration_ms: 3.821908
  type: 'test'
  ...
# Subtest: admin header reuses shared fullscreen and user dropdown mechanics
ok 10 - admin header reuses shared fullscreen and user dropdown mechanics
  ---
  duration_ms: 0.926607
  type: 'test'
  ...
# Subtest: desktop and mobile navigation consume the same canonical admin model
ok 11 - desktop and mobile navigation consume the same canonical admin model
  ---
  duration_ms: 0.486492
  type: 'test'
  ...
# Subtest: admin personal information is read-only and shows name plus phone
ok 12 - admin personal information is read-only and shows name plus phone
  ---
  duration_ms: 10.723695
  type: 'test'
  ...
# Subtest: profile picture mutation keeps optimistic revision and refreshes current user
ok 13 - profile picture mutation keeps optimistic revision and refreshes current user
  ---
  duration_ms: 1.037448
  type: 'test'
  ...
# Subtest: document and comment counts preload while tab bodies remain conditional
ok 14 - document and comment counts preload while tab bodies remain conditional
  ---
  duration_ms: 1.015651
  type: 'test'
  ...
# Subtest: password errors are toast-only and session security mutations end in login lifecycle
ok 15 - password errors are toast-only and session security mutations end in login lifecycle
  ---
  duration_ms: 0.574608
  type: 'test'
  ...
# Subtest: authorization provider blocks shell rendering until current access is known
ok 16 - authorization provider blocks shell rendering until current access is known
  ---
  duration_ms: 3.326141
  type: 'test'
  ...
1..16
# tests 16
# suites 0
# pass 16
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4953.604702

> e-pharmacy@0.1.0 test:integration D:\Projects\сareer-skills\e-pharmacy
> pnpm --filter @e-pharmacy/client test:integration


> @e-pharmacy/client@0.1.0 test:integration D:\Projects\сareer-skills\e-pharmacy\apps\client
> node ../../scripts/test-runners/run-node-ts-tests.mjs src --match=.integration.test.ts

TAP version 13
# Subtest: private, auth and token routes stay out of the static sitemap and remain robots-disallowed
ok 1 - private, auth and token routes stay out of the static sitemap and remain robots-disallowed
  ---
  duration_ms: 2.904112
  type: 'test'
  ...
# Subtest: product SEO canonical keeps indexed dimensions and removes noindex noise
ok 2 - product SEO canonical keeps indexed dimensions and removes noindex noise
  ---
  duration_ms: 0.832462
  type: 'test'
  ...
# Subtest: pharmacy SEO canonical keeps the indexed city dimension and removes noindex noise
ok 3 - pharmacy SEO canonical keeps the indexed city dimension and removes noindex noise
  ---
  duration_ms: 1.523476
  type: 'test'
  ...
# Subtest: legal documents become index/sitemap eligible only after complete approval metadata exists
ok 4 - legal documents become index/sitemap eligible only after complete approval metadata exists
  ---
  duration_ms: 4.237443
  type: 'test'
  ...
# Subtest: dynamic sitemap/detail URLs reuse the typed canonical entity builders
ok 5 - dynamic sitemap/detail URLs reuse the typed canonical entity builders
  ---
  duration_ms: 1.319882
  type: 'test'
  ...
# Subtest: preserves independent degraded states for product catalog resources
ok 6 - preserves independent degraded states for product catalog resources
  ---
  duration_ms: 10.649029
  type: 'test'
  ...
# Subtest: does not represent a pharmacy filter outage as an available empty list
ok 7 - does not represent a pharmacy filter outage as an available empty list
  ---
  duration_ms: 0.746201
  type: 'test'
  ...
# Subtest: keeps unavailable product state exclusive from empty results
ok 8 - keeps unavailable product state exclusive from empty results
  ---
  duration_ms: 2.19362
  type: 'test'
  ...
# Subtest: classifies filtered empty results separately from an empty catalog
ok 9 - classifies filtered empty results separately from an empty catalog
  ---
  duration_ms: 0.49484
  type: 'test'
  ...
# Subtest: checkout fingerprint changes when quantity, items or price changes
ok 10 - checkout fingerprint changes when quantity, items or price changes
  ---
  duration_ms: 56.380675
  type: 'test'
  ...
# Subtest: client route access, guest routes and token routes keep distinct semantics
ok 11 - client route access, guest routes and token routes keep distinct semantics
  ---
  duration_ms: 8.822249
  type: 'test'
  ...
# Subtest: private redirect targets preserve safe local state and reject external destinations
ok 12 - private redirect targets preserve safe local state and reject external destinations
  ---
  duration_ms: 15.401254
  type: 'test'
  ...
# Subtest: typed public slugs dispatch by entity type before lookup
ok 13 - typed public slugs dispatch by entity type before lookup
  ---
  duration_ms: 1.03652
  type: 'test'
  ...
# Subtest: legacy root resolution remains product-first for colliding ObjectIds
ok 14 - legacy root resolution remains product-first for colliding ObjectIds
  ---
  duration_ms: 0.990608
  type: 'test'
  ...
# Subtest: catalog routes keep path authority, reject malformed pagination and bound catch-all work
ok 15 - catalog routes keep path authority, reject malformed pagination and bound catch-all work
  ---
  duration_ms: 4.1804
  type: 'test'
  ...
# Subtest: runtime pagination correction only applies to successful known page counts
ok 16 - runtime pagination correction only applies to successful known page counts
  ---
  duration_ms: 0.567187
  type: 'test'
  ...
# Subtest: private checkout and order labels are advisory while typed IDs remain authoritative
ok 17 - private checkout and order labels are advisory while typed IDs remain authoritative
  ---
  duration_ms: 1.507708
  type: 'test'
  ...
# Subtest: keeps static routes and reports partial dynamic sitemap failure
ok 18 - keeps static routes and reports partial dynamic sitemap failure
  ---
  duration_ms: 172.24834
  type: 'test'
  ...
# Subtest: keeps active products in the sitemap when temporary inventory is out of stock
ok 19 - keeps active products in the sitemap when temporary inventory is out of stock
  ---
  duration_ms: 4.968341
  type: 'test'
  ...
# Subtest: does not invent lastModified for static routes
ok 20 - does not invent lastModified for static routes
  ---
  duration_ms: 3.507473
  type: 'test'
  ...
# Subtest: reuses the public transport retry policy and preserves sitemap cache options
ok 21 - reuses the public transport retry policy and preserves sitemap cache options
  ---
  duration_ms: 155.685812
  type: 'test'
  ...
# Subtest: caps page collection below the single-sitemap URL ceiling
ok 22 - caps page collection below the single-sitemap URL ceiling
  ---
  duration_ms: 88.671413
  type: 'test'
  ...
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7943.783499

> e-pharmacy@0.1.0 build D:\Projects\сareer-skills\e-pharmacy
> turbo build

• turbo 2.9.8

   • Packages in scope: @e-pharmacy/admin, @e-pharmacy/api, @e-pharmacy/api-client, @e-pharmacy/auth, @e-pharmacy/client, @e-pharmacy/config, @e-pharmacy/hooks, @e-pharmacy/next-api, @e-pharmacy/pharmacy, @e-pharmacy/types, @e-pharmacy/ui, @e-pharmacy/utils, @e-pharmacy/validation
   • Running build in 13 packages
   • Remote caching disabled

@e-pharmacy/hooks:build: cache hit, replaying logs 19cd6269705cb80d
@e-pharmacy/hooks:build: 
@e-pharmacy/hooks:build: > @e-pharmacy/hooks@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\hooks
@e-pharmacy/hooks:build: > tsc -p tsconfig.build.json
@e-pharmacy/hooks:build: 
@e-pharmacy/utils:build: cache hit, replaying logs f225eea11b0b762e
@e-pharmacy/utils:build: 
@e-pharmacy/utils:build: > @e-pharmacy/utils@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\utils
@e-pharmacy/utils:build: > tsc -p tsconfig.build.json
@e-pharmacy/utils:build: 
@e-pharmacy/types:build: cache hit, replaying logs 28fe8dbfdb5a89ff
@e-pharmacy/types:build: 
@e-pharmacy/types:build: > @e-pharmacy/types@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/types:build: > pnpm run clean && tsc -p tsconfig.build.json
@e-pharmacy/types:build: 
@e-pharmacy/types:build: 
@e-pharmacy/types:build: > @e-pharmacy/types@0.1.0 clean D:\Projects\сareer-skills\e-pharmacy\packages\types
@e-pharmacy/types:build: > node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
@e-pharmacy/types:build: 
@e-pharmacy/api:build: cache hit, replaying logs 1a98e9aac4c756b3
@e-pharmacy/api-client:build: cache hit, replaying logs ed64818a990dc827
@e-pharmacy/api:build: 
@e-pharmacy/api:build: > @e-pharmacy/api@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\apps\api
@e-pharmacy/api:build: > tsc && node src/scripts/copy-templates.mjs
@e-pharmacy/api:build: 
@e-pharmacy/api-client:build: 
@e-pharmacy/api-client:build: > @e-pharmacy/api-client@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:build: > pnpm run clean && tsc -p tsconfig.build.json
@e-pharmacy/api-client:build: 
@e-pharmacy/api-client:build: 
@e-pharmacy/api-client:build: > @e-pharmacy/api-client@0.1.0 clean D:\Projects\сareer-skills\e-pharmacy\packages\api-client
@e-pharmacy/api-client:build: > node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
@e-pharmacy/api-client:build: 
@e-pharmacy/config:build: cache hit, replaying logs 62bc32205b701186
@e-pharmacy/config:build: 
@e-pharmacy/config:build: > @e-pharmacy/config@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\config
@e-pharmacy/config:build: > pnpm run clean && tsc -p tsconfig.build.json
@e-pharmacy/config:build: 
@e-pharmacy/config:build: 
@e-pharmacy/config:build: > @e-pharmacy/config@0.1.0 clean D:\Projects\сareer-skills\e-pharmacy\packages\config
@e-pharmacy/config:build: > node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
@e-pharmacy/config:build: 
@e-pharmacy/next-api:build: cache hit, replaying logs 479799ba7a308823
@e-pharmacy/next-api:build: 
@e-pharmacy/next-api:build: > @e-pharmacy/next-api@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\next-api
@e-pharmacy/next-api:build: > pnpm run clean && tsc -p tsconfig.build.json
@e-pharmacy/next-api:build: 
@e-pharmacy/next-api:build: 
@e-pharmacy/next-api:build: > @e-pharmacy/next-api@0.1.0 clean D:\Projects\сareer-skills\e-pharmacy\packages\next-api
@e-pharmacy/next-api:build: > node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
@e-pharmacy/next-api:build: 
@e-pharmacy/auth:build: cache hit, replaying logs 7b8715d99ce11269
@e-pharmacy/auth:build: 
@e-pharmacy/auth:build: > @e-pharmacy/auth@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\auth
@e-pharmacy/auth:build: > pnpm run clean && tsc -p tsconfig.build.json
@e-pharmacy/auth:build: 
@e-pharmacy/auth:build: 
@e-pharmacy/auth:build: > @e-pharmacy/auth@0.1.0 clean D:\Projects\сareer-skills\e-pharmacy\packages\auth
@e-pharmacy/auth:build: > node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
@e-pharmacy/auth:build: 
@e-pharmacy/validation:build: cache hit, replaying logs 964704918eef5a8a
@e-pharmacy/validation:build: 
@e-pharmacy/validation:build: > @e-pharmacy/validation@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\validation
@e-pharmacy/validation:build: > tsc
@e-pharmacy/validation:build: 
@e-pharmacy/ui:build: cache hit, replaying logs cb944ed59146bbcd
@e-pharmacy/ui:build: 
@e-pharmacy/ui:build: > @e-pharmacy/ui@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\packages\ui
@e-pharmacy/ui:build: > tsc -p tsconfig.build.json
@e-pharmacy/ui:build: 
@e-pharmacy/client:build: cache miss, executing a3ba104ca39471ca
@e-pharmacy/pharmacy:build: cache miss, executing e7cb031fb504c8f8
@e-pharmacy/admin:build: cache hit, replaying logs 064ad87c09e3ce34
@e-pharmacy/admin:build: 
@e-pharmacy/admin:build: > @e-pharmacy/admin@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\apps\admin
@e-pharmacy/admin:build: > node -e "require('node:fs').rmSync('.next', { recursive: true, force: true })" && next build
@e-pharmacy/admin:build: 
@e-pharmacy/admin:build: ▲ Next.js 16.2.4 (Turbopack)
@e-pharmacy/admin:build: 
@e-pharmacy/admin:build:   Creating an optimized production build ...
@e-pharmacy/admin:build: ✓ Compiled successfully in 32.7s
@e-pharmacy/admin:build:   Running TypeScript ...
@e-pharmacy/admin:build:   Finished TypeScript in 41s ...
@e-pharmacy/admin:build:   Collecting page data using 3 workers ...
@e-pharmacy/admin:build:   Generating static pages using 3 workers (0/26) ...
@e-pharmacy/admin:build:   Generating static pages using 3 workers (6/26) 
@e-pharmacy/admin:build:   Generating static pages using 3 workers (12/26) 
@e-pharmacy/admin:build:   Generating static pages using 3 workers (19/26) 
@e-pharmacy/admin:build: ✓ Generating static pages using 3 workers (26/26) in 2.4s
@e-pharmacy/admin:build:   Finalizing page optimization ...
@e-pharmacy/admin:build: 
@e-pharmacy/admin:build: Route (app)
@e-pharmacy/admin:build: ┌ ○ /
@e-pharmacy/admin:build: ├ ○ /_not-found
@e-pharmacy/admin:build: ├ ○ /admin/profile
@e-pharmacy/admin:build: ├ ○ /admin/settings/activity
@e-pharmacy/admin:build: ├ ○ /admin/settings/categories
@e-pharmacy/admin:build: ├ ƒ /admin/settings/employees/[employeeId]
@e-pharmacy/admin:build: ├ ○ /admin/settings/positions
@e-pharmacy/admin:build: ├ ƒ /api/admin/access/me
@e-pharmacy/admin:build: ├ ƒ /api/admin/audit
@e-pharmacy/admin:build: ├ ƒ /api/admin/audit/[auditLogId]
@e-pharmacy/admin:build: ├ ƒ /api/admin/audit/actors
@e-pharmacy/admin:build: ├ ƒ /api/admin/employees/me/comments
@e-pharmacy/admin:build: ├ ƒ /api/admin/employees/me/comments/[commentId]
@e-pharmacy/admin:build: ├ ƒ /api/admin/employees/me/documents
@e-pharmacy/admin:build: ├ ƒ /api/admin/employees/me/documents/[documentId]
@e-pharmacy/admin:build: ├ ƒ /api/admin/employees/me/profile
@e-pharmacy/admin:build: ├ ƒ /api/admin/positions
@e-pharmacy/admin:build: ├ ƒ /api/admin/positions/[positionId]
@e-pharmacy/admin:build: ├ ƒ /api/admin/product-categories
@e-pharmacy/admin:build: ├ ƒ /api/admin/product-categories/[categoryId]
@e-pharmacy/admin:build: ├ ƒ /api/auth/login
@e-pharmacy/admin:build: ├ ƒ /api/auth/logout
@e-pharmacy/admin:build: ├ ƒ /api/auth/logout-all
@e-pharmacy/admin:build: ├ ƒ /api/auth/me
@e-pharmacy/admin:build: ├ ƒ /api/auth/password
@e-pharmacy/admin:build: ├ ƒ /api/auth/password-reset/confirm
@e-pharmacy/admin:build: ├ ƒ /api/auth/password-reset/request
@e-pharmacy/admin:build: ├ ƒ /api/auth/sessions
@e-pharmacy/admin:build: ├ ƒ /api/auth/sessions/[sessionId]
@e-pharmacy/admin:build: ├ ○ /icon.svg
@e-pharmacy/admin:build: ├ ○ /login
@e-pharmacy/admin:build: ├ ○ /password-recovery
@e-pharmacy/admin:build: ├ ○ /reset-password
@e-pharmacy/admin:build: └ ○ /robots.txt
@e-pharmacy/admin:build: 
@e-pharmacy/admin:build: 
@e-pharmacy/admin:build: ○  (Static)   prerendered as static content
@e-pharmacy/admin:build: ƒ  (Dynamic)  server-rendered on demand
@e-pharmacy/admin:build: 
@e-pharmacy/pharmacy:build: 
@e-pharmacy/pharmacy:build: > @e-pharmacy/pharmacy@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\apps\pharmacy
@e-pharmacy/pharmacy:build: > node -e "require('node:fs').rmSync('.next', { recursive: true, force: true })" && next build
@e-pharmacy/pharmacy:build: 
@e-pharmacy/client:build: 
@e-pharmacy/client:build: > @e-pharmacy/client@0.1.0 build D:\Projects\сareer-skills\e-pharmacy\apps\client
@e-pharmacy/client:build: > node -e "require('node:fs').rmSync('.next', { recursive: true, force: true })" && next build
@e-pharmacy/client:build: 
@e-pharmacy/client:build: ▲ Next.js 16.2.4 (Turbopack)
@e-pharmacy/client:build: - Environments: .env
@e-pharmacy/client:build: 
@e-pharmacy/client:build:   Creating an optimized production build ...
@e-pharmacy/pharmacy:build: ▲ Next.js 16.2.4 (Turbopack)
@e-pharmacy/pharmacy:build: - Environments: .env
@e-pharmacy/pharmacy:build: 
@e-pharmacy/pharmacy:build:   Creating an optimized production build ...
@e-pharmacy/pharmacy:build: ✓ Compiled successfully in 25.7s
@e-pharmacy/pharmacy:build:   Running TypeScript ...
@e-pharmacy/client:build: ✓ Compiled successfully in 32.8s
@e-pharmacy/client:build:   Running TypeScript ...
@e-pharmacy/pharmacy:build:   Finished TypeScript in 42s ...
@e-pharmacy/pharmacy:build:   Collecting page data using 3 workers ...
@e-pharmacy/client:build:   Finished TypeScript in 37.9s ...
@e-pharmacy/client:build:   Collecting page data using 3 workers ...
@e-pharmacy/pharmacy:build:   Generating static pages using 3 workers (0/29) ...
@e-pharmacy/pharmacy:build:   Generating static pages using 3 workers (7/29) 
@e-pharmacy/pharmacy:build:   Generating static pages using 3 workers (14/29) 
@e-pharmacy/pharmacy:build:   Generating static pages using 3 workers (21/29) 
@e-pharmacy/pharmacy:build: ✓ Generating static pages using 3 workers (29/29) in 2.1s
@e-pharmacy/pharmacy:build:   Finalizing page optimization ...
@e-pharmacy/pharmacy:build: 
@e-pharmacy/pharmacy:build: Route (app)
@e-pharmacy/pharmacy:build: ┌ ○ /
@e-pharmacy/pharmacy:build: ├ ○ /_not-found
@e-pharmacy/pharmacy:build: ├ ƒ /api/auth/logout
@e-pharmacy/pharmacy:build: ├ ƒ /api/auth/logout-all
@e-pharmacy/pharmacy:build: ├ ƒ /api/auth/me
@e-pharmacy/pharmacy:build: ├ ƒ /api/auth/password
@e-pharmacy/pharmacy:build: ├ ƒ /api/auth/sessions
@e-pharmacy/pharmacy:build: ├ ƒ /api/auth/sessions/[sessionId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/clients
@e-pharmacy/pharmacy:build: ├ ƒ /api/clients/[clientId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/clients/[clientId]/products
@e-pharmacy/pharmacy:build: ├ ƒ /api/orders
@e-pharmacy/pharmacy:build: ├ ƒ /api/orders/[orderId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/orders/[orderId]/comments
@e-pharmacy/pharmacy:build: ├ ƒ /api/orders/[orderId]/comments/[commentId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/orders/[orderId]/status
@e-pharmacy/pharmacy:build: ├ ƒ /api/orders/sales-statistics
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/[pharmacyId]/checkout-details
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/me/documents
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/me/documents/[documentId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/me/profile
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/me/profile/moderation-submission
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/me/profile/send-for-verification
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacies/me/summary
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacy-notes/[entityType]/[entityId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/pharmacy-notes/[entityType]/[entityId]/[noteId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/product-categories
@e-pharmacy/pharmacy:build: ├ ƒ /api/product-requests
@e-pharmacy/pharmacy:build: ├ ƒ /api/product-requests/[requestId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/product-requests/article-availability
@e-pharmacy/pharmacy:build: ├ ƒ /api/product-requests/statistics
@e-pharmacy/pharmacy:build: ├ ƒ /api/products
@e-pharmacy/pharmacy:build: ├ ƒ /api/products/[productId]
@e-pharmacy/pharmacy:build: ├ ƒ /api/products/[productId]/my-pharmacy
@e-pharmacy/pharmacy:build: ├ ƒ /api/products/[productId]/reviews
@e-pharmacy/pharmacy:build: ├ ƒ /api/products/[productId]/stock-movements
@e-pharmacy/pharmacy:build: ├ ƒ /api/products/filters
@e-pharmacy/pharmacy:build: ├ ƒ /api/products/statistics
@e-pharmacy/pharmacy:build: ├ ○ /icon.svg
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/all-products/[[...filters]]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/all-products/[productId]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/clients/[[...filters]]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/clients/[clientId]
@e-pharmacy/pharmacy:build: ├ ○ /pharmacy/dashboard
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/orders/[[...filters]]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/orders/[orderId]
@e-pharmacy/pharmacy:build: ├ ○ /pharmacy/orders/new
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/product-requests/[[...filters]]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/product-requests/[requestId]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/product-requests/new
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/products/[[...filters]]
@e-pharmacy/pharmacy:build: ├ ƒ /pharmacy/products/[productId]
@e-pharmacy/pharmacy:build: ├ ○ /pharmacy/profile
@e-pharmacy/pharmacy:build: └ ○ /robots.txt
@e-pharmacy/pharmacy:build: 
@e-pharmacy/pharmacy:build: 
@e-pharmacy/pharmacy:build: ○  (Static)   prerendered as static content
@e-pharmacy/pharmacy:build: ƒ  (Dynamic)  server-rendered on demand
@e-pharmacy/pharmacy:build: 
@e-pharmacy/client:build:   Generating static pages using 3 workers (0/45) ...
@e-pharmacy/client:build:   Generating static pages using 3 workers (11/45) 
@e-pharmacy/client:build: Sitemap was generated with partial backend data. {
@e-pharmacy/client:build:   failures: [
@e-pharmacy/client:build:     { resourcePath: '/products', page: 1, reason: 'request_error' },
@e-pharmacy/client:build:     { resourcePath: '/pharmacies', page: 1, reason: 'request_error' }
@e-pharmacy/client:build:   ]
@e-pharmacy/client:build: }
@e-pharmacy/client:build:   Generating static pages using 3 workers (22/45) 
@e-pharmacy/client:build:   Generating static pages using 3 workers (33/45) 
@e-pharmacy/client:build: ✓ Generating static pages using 3 workers (45/45) in 2.8s
@e-pharmacy/client:build:   Finalizing page optimization ...
@e-pharmacy/client:build: 
@e-pharmacy/client:build: Route (app)
@e-pharmacy/client:build: ┌ ƒ /
@e-pharmacy/client:build: ├ ○ /_not-found
@e-pharmacy/client:build: ├ ƒ /[slugId]
@e-pharmacy/client:build: ├ ƒ /api/auth/login
@e-pharmacy/client:build: ├ ƒ /api/auth/logout
@e-pharmacy/client:build: ├ ƒ /api/auth/logout-all
@e-pharmacy/client:build: ├ ƒ /api/auth/me
@e-pharmacy/client:build: ├ ƒ /api/auth/password
@e-pharmacy/client:build: ├ ƒ /api/auth/password-reset/confirm
@e-pharmacy/client:build: ├ ƒ /api/auth/password-reset/request
@e-pharmacy/client:build: ├ ƒ /api/auth/pharmacy-documents
@e-pharmacy/client:build: ├ ƒ /api/auth/pharmacy-documents/session
@e-pharmacy/client:build: ├ ƒ /api/auth/refresh
@e-pharmacy/client:build: ├ ƒ /api/auth/register
@e-pharmacy/client:build: ├ ƒ /api/auth/sessions
@e-pharmacy/client:build: ├ ƒ /api/auth/sessions/[sessionId]
@e-pharmacy/client:build: ├ ƒ /api/cart
@e-pharmacy/client:build: ├ ƒ /api/cart/clear
@e-pharmacy/client:build: ├ ƒ /api/cart/items
@e-pharmacy/client:build: ├ ƒ /api/cart/items/[cartItemId]
@e-pharmacy/client:build: ├ ƒ /api/cart/pharmacies/[pharmacyId]
@e-pharmacy/client:build: ├ ƒ /api/health
@e-pharmacy/client:build: ├ ƒ /api/orders
@e-pharmacy/client:build: ├ ƒ /api/orders/[orderId]
@e-pharmacy/client:build: ├ ƒ /api/orders/checkout
@e-pharmacy/client:build: ├ ƒ /api/pharmacies
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/[pharmacyId]
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/[pharmacyId]/checkout-details
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/[pharmacyId]/favorite
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/[pharmacyId]/reviews
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/favorites
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/favorites/ids
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/filters
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/me/summary
@e-pharmacy/client:build: ├ ƒ /api/pharmacies/options
@e-pharmacy/client:build: ├ ƒ /api/products
@e-pharmacy/client:build: ├ ƒ /api/products/[productId]
@e-pharmacy/client:build: ├ ƒ /api/products/[productId]/favorite
@e-pharmacy/client:build: ├ ƒ /api/products/[productId]/reviews
@e-pharmacy/client:build: ├ ƒ /api/products/favorites
@e-pharmacy/client:build: ├ ƒ /api/products/favorites/ids
@e-pharmacy/client:build: ├ ƒ /api/products/filters
@e-pharmacy/client:build: ├ ○ /cart
@e-pharmacy/client:build: ├ ○ /checkout
@e-pharmacy/client:build: ├ ƒ /checkout/[slugId]
@e-pharmacy/client:build: ├ ○ /delivery-and-payment
@e-pharmacy/client:build: ├ ○ /icon.svg
@e-pharmacy/client:build: ├ ○ /login
@e-pharmacy/client:build: ├ ○ /password-recovery
@e-pharmacy/client:build: ├ ○ /personal-data-notice
@e-pharmacy/client:build: ├ ƒ /pharmacies
@e-pharmacy/client:build: ├ ƒ /pharmacies/[...segments]
@e-pharmacy/client:build: ├ ƒ /product-catalog
@e-pharmacy/client:build: ├ ƒ /product-catalog/[...segments]
@e-pharmacy/client:build: ├ ƒ /products/[slugId]
@e-pharmacy/client:build: ├ ○ /profile
@e-pharmacy/client:build: ├ ƒ /profile/orders/[orderId]
@e-pharmacy/client:build: ├ ○ /register
@e-pharmacy/client:build: ├ ○ /reset-password
@e-pharmacy/client:build: ├ ○ /return-policy
@e-pharmacy/client:build: ├ ○ /robots.txt
@e-pharmacy/client:build: ├ ○ /sitemap.xml
@e-pharmacy/client:build: └ ○ /user-agreement
@e-pharmacy/client:build: 
@e-pharmacy/client:build: 
@e-pharmacy/client:build: ○  (Static)   prerendered as static content
@e-pharmacy/client:build: ƒ  (Dynamic)  server-rendered on demand
@e-pharmacy/client:build: 

 Tasks:    13 successful, 13 total
Cached:    11 cached, 13 total
  Time:    1m25.016s 


> e-pharmacy@0.1.0 check:deploy-artifact D:\Projects\сareer-skills\e-pharmacy
> pnpm check:archive-hygiene && pnpm archive:source && pnpm check:archive-artifact


> e-pharmacy@0.1.0 check:archive-hygiene D:\Projects\сareer-skills\e-pharmacy
> node scripts/archive/check-source-archive-hygiene.mjs

Source archive hygiene check passed (policy, staged tree, and final ZIP entries verified recursively).

> e-pharmacy@0.1.0 archive:source D:\Projects\сareer-skills\e-pharmacy
> node scripts/archive/create-source-archive.mjs

Clean source ZIP created at D:\Projects\сareer-skills\e-pharmacy\.artifacts\e-pharmacy-source.zip (2069 files; 2069 verified entries).

> e-pharmacy@0.1.0 check:archive-artifact D:\Projects\сareer-skills\e-pharmacy
> node scripts/archive/check-source-archive-artifact.mjs

Final source ZIP hygiene check passed (2069 entries): D:\Projects\сareer-skills\e-pharmacy\.artifacts\e-pharmacy-source.zip
