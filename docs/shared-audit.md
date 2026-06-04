# Shared audit before Vendor development

> Scope: E-PHARMACY monorepo shared-foundation audit before starting `apps/vendor`.
>
> Note: in the provided archive, the app folders are unpacked as `client/`, `api/`, `vendor/`, `admin/`. In the target monorepo documentation below they are referenced as `apps/client`, `apps/api`, `apps/vendor`, `apps/admin`, because that is the intended workspace structure from `pnpm-workspace.yaml`.

## 1. Goal

Before building Vendor, the project must stop treating `apps/client` as the hidden source of truth. Reusable UI, hooks, auth logic, constants, validation, types, API helpers, SEO helpers and utilities must move to `packages/*`, and `apps/client` must also consume those shared packages.

The target dependency direction is:

```txt
apps/client  -> packages/*
apps/vendor  -> packages/*
apps/admin   -> packages/*
```

Forbidden direction:

```txt
apps/vendor -> apps/client
apps/admin  -> apps/vendor
apps/client -> apps/admin
```

No app should import reusable code from another app. If Vendor needs something that currently exists in Client, that thing must first be extracted to a package.

## 2. Current monorepo state

### 2.1 Existing packages

| Package | Current state | Main finding | Action | Priority |
|---|---|---|---|---|
| `@e-pharmacy/ui` | Exists with `Button`, `ButtonLink`, `CloseIconButton`, `Container`, `LoadingSpinner`, `ModalBase`, `Pagination`, `RadioOption`, `SearchInput`, `SelectField`, `Toast` | Several of these also exist locally in `apps/client/src/components/common` | Compare versions and make package versions canonical | High |
| `@e-pharmacy/types` | Exists with API/auth/product/store/cart/order/review/vendor types | Client still has local `src/types/*` duplicates | Move remaining domain types to package | High |
| `@e-pharmacy/config` | Exists with `ROUTE_SEGMENTS`, reserved root slugs and app names | Client still owns most routes/navigation/SEO/config constants | Expand config package by domain | High |
| `@e-pharmacy/validation` | Exists with shared limits/messages/patterns/sanitizers/Zod schemas | Client still has auth/customer/review validation | Move app validation schemas into package domains | High |
| `@e-pharmacy/utils` | Exists with slug helpers | Client still owns most formatters and utilities | Move generic helpers from Client | High |
| `@e-pharmacy/api-client` | Exists with API routes/query string helpers and BFF helpers | Client still owns large `src/lib/api` and route-handler logic | Extract API core and role-specific API modules | High |
| `@e-pharmacy/hooks` | Missing | Client owns reusable UI hooks | Create package before Vendor | High |
| `@e-pharmacy/auth` | Missing | Client owns auth provider, guards and session helpers | Create package or shared auth layer | High |

### 2.2 Existing app state

| App | Current state | Shared-foundation implication |
|---|---|---|
| `apps/client` | Implemented storefront with public pages, private cart/checkout/profile, BFF route handlers and many local components | Main source for extraction, but must become consumer of packages |
| `apps/vendor` | Folder exists but no meaningful implementation in uploaded archive | Must start only after shared foundation is prepared |
| `apps/admin` | Folder exists but no meaningful implementation in uploaded archive | Must later reuse the same foundation |
| `apps/api` | Backend exists and already uses `@e-pharmacy/types` and `@e-pharmacy/validation` | Keep backend shared API separate from Next BFF routes |

## 3. High-priority extraction list before Vendor

These items should be treated as blockers before serious Vendor work begins.

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| Shared styles | `apps/client/src/styles/{reset,tokens,base,utilities}.css` | `packages/ui/src/styles` | Move and export style paths | High | Add app-specific `theme.css` only if needed |
| `Button` / `ButtonLink` | `apps/client/src/components/common/Button` and `packages/ui/src/components` | `packages/ui` | Compare and keep canonical package implementation | High | Avoid two button APIs before Vendor |
| `Container` | `apps/client/src/components/common/Container` and `packages/ui/src/components` | `packages/ui` | Replace client usage with package import | High | Basic layout primitive |
| `CloseIconButton` | Client and package | `packages/ui` | Compare accessibility/props and replace usage | High | Needed by modals/offcanvas |
| `LoadingSpinner` | Client and package | `packages/ui` | Use shared spinner | High | Also used by status pages/forms |
| `Pagination` | Client and package | `packages/ui` | Use shared pagination | High | Vendor/Admin tables will need pagination |
| `RadioOption` | Client and package | `packages/ui` | Use shared radio primitive | Medium | Useful in forms/filters |
| `SearchInput` | Client and package | `packages/ui` | Use shared search field | High | Vendor/Admin filters will need it |
| `SelectField` | Client and package | `packages/ui` | Use shared select primitive | High | Vendor/Admin forms/filters will need it |
| `Toast` | Client and package | `packages/ui/feedback` | Move Toast + provider together | High | Current package has Toast but provider is local |
| `ModalBase` | `apps/client/src/components/modals/ModalBase` and `packages/ui/src/components/ModalBase.tsx` | `packages/ui/src/modals` | Make shared modal system canonical | High | Must include focus trap/body lock/Escape/backdrop |
| `ConfirmActionModal` | `apps/client/src/components/common/ConfirmActionModal` | `packages/ui/src/modals/ConfirmationModal` | Rename/extract as shared confirmation modal | High | Used across all apps |
| `ContinueShoppingModal` | `apps/client/src/components/cart/ContinueShoppingModal` | Shared `ActionChoiceModal` + local wrapper | Do not move literal cart modal to shared | Medium | Cart wording is client-specific |
| `ToastProvider` | `apps/client/src/providers/ToastProvider` | `packages/ui/src/feedback` or `packages/ui/src/providers` | Extract provider and update Client | High | Vendor/Admin need same feedback layer |
| UI hooks | `apps/client/src/hooks/useBackdropClick`, `useBodyScrollLock`, `useEscapeToClose`, `useFocusTrap`, `useListboxNavigation`, `useToast` | `packages/hooks/src` | Create package and move | High | Current reusable hooks are app-local |
| Auth provider core | `apps/client/src/providers/AuthProvider` | `packages/auth` + `ClientAuthProvider` wrapper | Extract configurable auth core | High | Vendor/Admin need role-aware auth |
| Guards | `apps/client/src/routes/ProtectedRoute`, `GuestOnlyRoute` | `packages/auth/src/routes` | Add `RoleProtectedRoute` | High | Role separation is required for Vendor/Admin |
| Form fields | `apps/client/src/components/form-fields` | `packages/ui/src/form-fields` | Convert to controlled, Formik-agnostic primitives | High | Auth, vendor profile, supplier/product forms need them |
| Routes/navigation | `apps/client/src/lib/constants/routes.ts`, `navigation.ts`, `src/lib/routes/*` | `packages/config/src/routes`, `packages/config/src/navigation` | Move route config/builders | High | Breadcrumbs/nav must not be app-local |
| Formatters | `apps/client/src/lib/formatters/*` | `packages/utils/src` | Move price/date/labels/initials formatters | High | Vendor/Admin tables need same formatters |
| API core | `apps/client/src/lib/api/*` | `packages/api-client/src/core` | Move request/error/response/query helpers | High | Do before Vendor API work |
| API routes config | `apps/client/src/lib/constants/api-routes.ts`, `client-api-routes.ts` | `packages/api-client` and/or `packages/config` | Centralize endpoint definitions | High | Avoid separate route maps per app |
| Auth validation | `apps/client/src/lib/validations/auth-validation.ts` | `packages/validation/src/auth` | Extract login/register/password schemas | High | Admin has login, Vendor has auth |
| Customer fields validation | `apps/client/src/lib/validations/customer-fields.ts` | `packages/validation/src/customer` | Extract shared customer fields | Medium | Needed by Client, partly Admin |
| Review validation | `apps/client/src/lib/reviews/review-validation.ts` | `packages/validation/src/reviews` | Extract review schema | Medium | Client first, maybe Vendor/Admin moderation later |
| Domain types | `apps/client/src/types/*` | `packages/types/src/*` | Centralize remaining types | High | Avoid DTO drift |
| Status pages | `apps/client/src/app/error.tsx`, `not-found.tsx`, `loading.tsx` | `packages/ui/src/status-pages` | Extract UI components, keep Next wrappers in apps | High | Do not move special files themselves |
| SEO helpers | `apps/client/src/app/robots.ts`, `sitemap.ts`, `src/lib/seo/*` | `packages/config/src/seo` and/or `packages/utils/src/seo` | Extract builders/helpers | Medium | Client indexable; Vendor/Admin noindex |

## 4. Detailed audit tables

### 4.1 Styles audit

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `reset.css` | `apps/client/src/styles/reset.css` | `packages/ui/src/styles/reset.css` | Move | High | Global reset should be shared |
| `tokens.css` | `apps/client/src/styles/tokens.css` | `packages/ui/src/styles/tokens.css` | Move shared tokens; split app-only tokens if needed | High | Watch for storefront-only variables |
| `base.css` | `apps/client/src/styles/base.css` | `packages/ui/src/styles/base.css` | Move generic base styles | High | Keep app-specific body/page quirks out |
| `utilities.css` | `apps/client/src/styles/utilities.css` | `packages/ui/src/styles/utilities.css` | Move | High | Good shared utility layer |
| Theme overrides | Not currently separated | `apps/client/src/styles/theme.css`, later Vendor/Admin equivalents | Create only if accent/theme differs | Medium | Prevent shared tokens from becoming app-specific soup |

Target package exports should support imports like:

```ts
import '@e-pharmacy/ui/styles/reset.css';
import '@e-pharmacy/ui/styles/tokens.css';
import '@e-pharmacy/ui/styles/base.css';
import '@e-pharmacy/ui/styles/utilities.css';
```

### 4.2 Hooks audit

| Hook | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `useBackdropClick` | `apps/client/src/hooks/useBackdropClick.ts` | `packages/hooks/src/useBackdropClick.ts` | Move | High | Modal/offcanvas primitive |
| `useBodyScrollLock` | `apps/client/src/hooks/useBodyScrollLock.ts` | `packages/hooks/src/useBodyScrollLock.ts` | Move | High | Modal/offcanvas primitive |
| `useEscapeToClose` | `apps/client/src/hooks/useEscapeToClose.ts` | `packages/hooks/src/useEscapeToClose.ts` | Move | High | Modal/offcanvas/dropdown primitive |
| `useFocusTrap` | `apps/client/src/hooks/useFocusTrap.ts` | `packages/hooks/src/useFocusTrap.ts` | Move | High | Required for accessible modals |
| `useListboxNavigation` | `apps/client/src/hooks/useListboxNavigation.ts` | `packages/hooks/src/useListboxNavigation.ts` | Move | High | Select/searchable select primitive |
| `useToast` | `apps/client/src/hooks/useToast.ts` | `packages/hooks/src/useToast.ts` or `packages/ui/src/feedback` | Move with ToastProvider decision | High | Keep provider/hook API aligned |
| `useFavoriteRefresh` | `apps/client/src/hooks/useFavoriteRefresh.ts` | Keep in Client for now | Audit internals only | Low | Favorite UX is storefront-specific |
| `useFavoriteStatusRefresh` | `apps/client/src/hooks/useFavoriteStatusRefresh.ts` | Keep in Client for now | Audit internals only | Low | API/types may be shared later |
| `useFavoriteToggle` | `apps/client/src/hooks/useFavoriteToggle.ts` | Keep in Client for now | Extract API/types only if needed | Low | Product/store favorites are client UX |
| `useReviewForm` | `apps/client/src/hooks/useReviewForm.ts` | Keep in Client initially | Extract validation/types/API only | Medium | Review form may remain storefront-specific |

Create `packages/hooks` with:

```txt
packages/hooks/
  package.json
  tsconfig.json
  src/index.ts
  src/useBackdropClick.ts
  src/useBodyScrollLock.ts
  src/useEscapeToClose.ts
  src/useFocusTrap.ts
  src/useListboxNavigation.ts
  src/useToast.ts
```

### 4.3 Providers and auth audit

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `ToastProvider` | `apps/client/src/providers/ToastProvider` | `packages/ui/src/feedback/ToastProvider` | Move | High | Same provider for Client/Vendor/Admin |
| `Toast` | `apps/client/src/components/common/Toast` and `packages/ui/src/components/Toast.tsx` | `packages/ui/src/feedback/Toast` | Consolidate | High | Keep UI and provider together |
| `AuthProvider` | `apps/client/src/providers/AuthProvider` | `packages/auth/src/AuthProviderCore.tsx` + app wrappers | Extract core, keep app wrapper | High | Do not hardcode customer-only rules in shared core |
| `ProtectedRoute` | `apps/client/src/routes/ProtectedRoute` | `packages/auth/src/routes/ProtectedRoute.tsx` | Move | High | Add role-aware variant |
| `GuestOnlyRoute` | `apps/client/src/routes/GuestOnlyRoute` | `packages/auth/src/routes/GuestOnlyRoute.tsx` | Move | High | Used by Client/Vendor/Admin auth pages |
| `auth-session` | `apps/client/src/lib/auth/auth-session.ts` | `packages/auth/src/auth-session.ts` | Move shared session logic | High | Check browser/server boundaries |
| `auth-token-storage` | `apps/client/src/lib/auth/auth-token-storage.ts` | `packages/auth/src/auth-token-storage.ts` | Move if not app-specific | High | Be careful with Next/server usage |
| `auth-error-message` | `apps/client/src/lib/auth/auth-error-message.ts` | `packages/auth` or `packages/api-client/core` | Move | Medium | Avoid duplicate auth error copy |

Recommended auth structure:

```txt
packages/auth/src/
  AuthProviderCore.tsx
  useAuth.ts
  auth-session.ts
  auth-token-storage.ts
  auth-error-message.ts
  routes/ProtectedRoute.tsx
  routes/GuestOnlyRoute.tsx
  routes/RoleProtectedRoute.tsx
```

App wrappers:

```txt
apps/client/src/providers/ClientAuthProvider.tsx   // role: customer
apps/vendor/src/providers/VendorAuthProvider.tsx   // role: pharmacy/vendor
apps/admin/src/providers/AdminAuthProvider.tsx     // role: admin
```

### 4.4 Common components audit

| Component | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `Button` | Client + `packages/ui` | `packages/ui` | Compare and replace Client imports | High | Shared API should use `variant`, `size`, `tone`, not app flags |
| `ButtonLink` | Client inside Button folder + `packages/ui` | `packages/ui` | Compare and replace Client imports | High | Routing-compatible primitive |
| `CloseIconButton` | Client + `packages/ui` | `packages/ui` | Compare and replace | High | Needed by modals/offcanvas |
| `Container` | Client + `packages/ui` | `packages/ui` | Compare and replace | High | Foundation primitive |
| `LoadingSpinner` | Client + `packages/ui` | `packages/ui` | Compare and replace | High | Forms/status pages |
| `Pagination` | Client + `packages/ui` | `packages/ui` | Compare and replace | High | Vendor/Admin tables |
| `RadioOption` | Client + `packages/ui` | `packages/ui` | Compare and replace | Medium | Filter/forms primitive |
| `SearchInput` | Client + `packages/ui` | `packages/ui` | Compare and replace | High | Filter/search primitive |
| `SelectField` | Client + `packages/ui` | `packages/ui` | Compare and replace | High | Forms/filters primitive |
| `Toast` | Client + `packages/ui` | `packages/ui/src/feedback` | Consolidate | High | Provider is currently missing from package |
| `ModalBase` | Client modal folder + `packages/ui/src/components` | `packages/ui/src/modals` | Consolidate into modal system | High | Do not leave two modal bases |
| `Logo` | Client | `packages/ui` or keep app-specific | Decide after brand strategy | Medium | If same brand across apps, shared; if app labels differ, shared base + app wrapper |
| `LazyLoadButton` | Client | `packages/ui` | Move if generic | Medium | Useful for pagination/load-more |
| `ResetFiltersButton` | Client | `packages/ui` | Move if generic | Medium | Vendor/Admin filters will need reset action |
| `TextActionButton` | Client | `packages/ui` | Move if generic | Medium | Useful as low-emphasis action |
| `Tabs` | Client | `packages/ui` | Move | High | Vendor/Admin sections need tabs |
| `SearchableSelect` | Client | `packages/ui` | Move | High | Vendor medicine/supplier forms likely need it |
| `QuantityCounter` | Client | Keep Client or extract generic | Medium | Cart-specific now; may be useful for stock/order editing later |
| `SvgIcon` | Client | `packages/ui` | Move | High | Icon rendering primitive should be shared |
| `UserBadge` | Client | `packages/ui` or app wrapper | Medium | Could be shared if props are generic |
| `AvatarImage` | Client | `packages/ui` | Move | Medium | Vendor/Admin profiles may use it |
| `ProfilePhotoCard` | Client | `packages/ui` or app wrapper | Medium | Shared if generic upload/display card |
| `StockAvailability` | Client | `packages/ui` + `packages/config/statuses` | Move display primitive, status config to config | Medium | Vendor/Admin product tables need stock status |
| `RatingSummary` | Client | `packages/ui` | Move if generic | Medium | Store/product/review contexts |
| `DeliveryInfoCard` | Client | Keep Client initially | Low | Storefront content card |
| `PaymentInfoCard` | Client | Keep Client initially | Low | Storefront content card |
| `ShimmerImage` | Client | `packages/ui` | Move | Medium | Shared image loading primitive |
| `FavoriteToggleButton` | Client | Keep Client | Low | Customer favorites only |
| `ReviewsSection` | Client | Keep Client initially | Medium | Domain-heavy; extract smaller review primitives later |
| `CartInvoiceLimitModal` | Client | Keep Client | Low | Client cart business rule |

### 4.5 Form fields audit

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `FormFieldLayout` | `apps/client/src/components/form-fields/shared` | `packages/ui/src/form-fields/FormFieldLayout` | Move | High | Base for all fields |
| `EmailInput` | Client form fields | `packages/ui/src/form-fields/EmailField` | Convert to controlled primitive | High | Used by all auth flows |
| `PasswordInput` | Client form fields | `packages/ui/src/form-fields/PasswordField` | Convert to controlled primitive | High | Used by Client/Vendor/Admin login |
| `NameInput` | Client form fields | `packages/ui/src/form-fields/TextField` or `NameField` | Move generic version | High | Vendor/Admin forms need text fields |
| `PhoneInput` | Client form fields | `packages/ui/src/form-fields/PhoneField` | Move | High | Vendor pharmacy profile needs phone |
| `AddressInput` | Client form fields | `packages/ui/src/form-fields/AddressField` | Move | High | Store/pharmacy/supplier forms need address |
| `CommentInput` | Client form fields | `packages/ui/src/form-fields/TextareaField` | Move generic textarea | Medium | Product/order/customer notes later |

Rule: shared fields must not receive a `formik` object. They should accept controlled props: `id`, `name`, `value`, `onChange`, `onBlur`, `error`, `hint`, `disabled`, etc.

### 4.6 Layout components audit

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `AppShell` | `apps/client/src/components/layout/AppShell` | `packages/ui/src/layout/AppShellBase` + Client wrapper | Extract only primitive shell if not storefront-specific | Medium | App composition remains app-specific |
| `Breadcrumbs` | `apps/client/src/components/layout/Breadcrumbs` | `packages/ui/src/layout/Breadcrumbs` | Move generic component | High | Items should come from config/builders |
| `BurgerButton` | Client layout | `packages/ui/src/layout/BurgerButton` | Move | High | Vendor/Admin mobile shell need it |
| `MobileOffcanvas` | Client layout | `packages/ui/src/layout/MobileOffcanvas` | Extract base | High | Navigation content stays app-specific |
| `Header` | Client layout | Keep Client wrapper, maybe shared `HeaderBase` later | Keep local for now | Medium | Storefront-specific nav/auth/cart/favorites likely inside |
| `Footer` | Client layout | Keep Client for now | Keep local | Low | Storefront-specific legal/marketing links |
| Navigation arrays | `apps/client/src/lib/constants/navigation.ts` | `packages/config/src/navigation/client-nav.ts` | Move config | High | Vendor/Admin nav configs go beside it |

### 4.7 Modal system audit

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `ModalBase` | `apps/client/src/components/modals/ModalBase`, `packages/ui/src/components/ModalBase.tsx` | `packages/ui/src/modals/ModalBase` | Consolidate | High | Must include portal/backdrop/Escape/focus/body lock/ARIA |
| `ModalRoot` | `apps/client/src/components/modals/ModalRoot` | `packages/ui/src/modals/ModalRoot` | Move | High | Shared portal root convention |
| `ConfirmActionModal` | `apps/client/src/components/common/ConfirmActionModal` | `packages/ui/src/modals/ConfirmationModal` | Move and rename | High | Avoid action-specific name |
| `ContinueShoppingModal` | Client cart | `packages/ui/src/modals/ActionChoiceModal` + Client wrapper | Extract generic choice modal only | Medium | Keep cart copy local |
| `CartInvoiceLimitModal` | Client common | Keep Client | Keep local | Low | Storefront/cart-specific business rule |
| `InfoModal` | Missing | `packages/ui/src/modals/InfoModal` | Add when needed | Low | Do not overbuild unless needed |
| `ErrorModal` | Missing | `packages/ui/src/modals/ErrorModal` | Add when needed | Low | Can come after base system |
| `UnsavedChangesModal` | Missing | `packages/ui/src/modals/UnsavedChangesModal` | Add when Vendor forms need it | Medium | Vendor/admin forms will likely need it |

## 5. Lib/config/utils/API audit

### 5.1 Constants and config

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `ROUTE_SEGMENTS` | `packages/config/src/routes.ts` | Keep and expand | Already shared | High | Good foundation exists |
| `ROUTES` | `apps/client/src/lib/constants/routes.ts` | `packages/config/src/routes/client-routes.ts` | Move | High | Client currently derives from shared segments but route map is local |
| `CLIENT_NAV_LINKS` | `apps/client/src/lib/constants/navigation.ts` | `packages/config/src/navigation/client-nav.ts` | Move | High | Add vendor/admin nav config beside it |
| `INFO_NAV_LINKS` | Client navigation constants | `packages/config/src/navigation/info-nav.ts` or `client-nav.ts` | Move | Medium | Storefront public footer/info |
| `api-routes.ts` | `apps/client/src/lib/constants/api-routes.ts` | `packages/api-client` or `packages/config/src/api` | Move | High | Endpoint maps should not live only in Client |
| `client-api-routes.ts` | Client constants | `packages/config/src/routes/client-api-routes.ts` | Move or keep as BFF-specific config | High | Needed by BFF wrappers |
| `assets.ts` | Client constants | `packages/config/src/assets.ts` | Move generic asset paths only | Medium | App-specific images can remain local |
| `catalog-controls.ts` | Client constants | `packages/config/src/filters/product-filters.ts` | Move reusable filters/sort/pagination options | High | Vendor/Admin product lists need filter config |
| `metadata.ts` | Client constants | `packages/config/src/seo/metadata.ts` | Move shared metadata constants/builders | Medium | Different app defaults |
| `seo.ts` | Client constants | `packages/config/src/seo/seo.ts` | Move | Medium | Client public SEO vs Vendor/Admin noindex |
| `info-pages.ts` | Client constants | Keep Client or config/client | Keep app-specific unless reused | Low | Storefront legal pages only |
| `env.ts` | Client constants | Keep app-specific + shared env helpers later | Medium | Env names differ per app/deployment |

### 5.2 Formatters and utils

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `formatDate` | `apps/client/src/lib/formatters/format-date.ts` | `packages/utils/src/format-date.ts` | Move | High | Vendor/Admin tables need dates |
| `formatPrice` | Client formatters | `packages/utils/src/format-price.ts` | Move | High | All apps need money formatting |
| `formatPriceRange` | Client formatters | `packages/utils/src/format-price-range.ts` | Move | High | Product/store listings |
| `formatInitials` | Client formatters | `packages/utils/src/format-initials.ts` | Move | Medium | Avatars/user badges |
| `formatCapitalizedLabel` | Client formatters | `packages/utils/src/format-capitalized-label.ts` | Move | Medium | Status/filter labels |
| `formatStockLabel` | Client formatters | `packages/utils/src/format-stock-label.ts` | Move with stock status config | Medium | Vendor/Admin stock/status views |
| `countLabels` | Client formatters | `packages/utils/src/count-labels.ts` | Move | Medium | Generic label pluralization/count |
| `cn` | `apps/client/src/lib/utils/cn.ts` | `packages/utils/src/cn.ts` | Move | High | Common className helper |
| Slug helpers | `apps/client/src/lib/routes/slug-id.ts` and `packages/utils` slug helpers | `packages/utils` | Consolidate | High | Avoid two slug implementations |
| `isActiveRoute` | Client routes | `packages/utils` or `packages/config/routes` | Move | Medium | Shared navigation highlighting |
| `buildQueryString` | `apps/client/src/lib/api/build-query-string.ts`, `packages/api-client` has query helper | `packages/api-client/src/core` or `packages/utils` | Consolidate | High | Avoid duplicate query builders |

### 5.3 Validation

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| Auth schemas | `apps/client/src/lib/validations/auth-validation.ts` | `packages/validation/src/auth` | Move | High | Login is shared; Register differs by app but schema parts shared |
| Customer fields | `apps/client/src/lib/validations/customer-fields.ts` | `packages/validation/src/customer` | Move | Medium | Client/customer profile and admin customer forms |
| Review schema | `apps/client/src/lib/reviews/review-validation.ts` | `packages/validation/src/reviews` | Move | Medium | Review creation/moderation |
| Shared email rules | Package currently has patterns/messages/limits | `packages/validation/src/shared/email.schema.ts` | Add schema-level exports | High | Avoid repeated email rules |
| Shared phone rules | Package currently has patterns/messages/limits | `packages/validation/src/shared/phone.schema.ts` | Add schema-level exports | High | Vendor pharmacy phone fields |
| Pharmacy profile schema | Missing | `packages/validation/src/pharmacy/pharmacy-profile.schema.ts` | Add before Vendor profile | High | Vendor blocker |
| Medicine schema | Missing | `packages/validation/src/medicine/medicine.schema.ts` | Add before Vendor medicine CRUD | High | Vendor blocker |
| Order status schema | Missing | `packages/validation/src/order/order-status.schema.ts` | Add before status updates | Medium | Vendor/Admin order management |

### 5.4 API client and BFF logic

| Entity | Current location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| `api-request` | `apps/client/src/lib/api/api-request.ts` | `packages/api-client/src/core/api-request.ts` | Move | High | Request core must be shared |
| `api-error` | `apps/client/src/lib/api/api-error.ts` | `packages/api-client/src/core/api-error.ts` | Move | High | Shared error shape |
| `api-url` | Client API lib | `packages/api-client/src/core/api-url.ts` | Move if generic | High | Keep env-specific adapter separate |
| `get-response-data` | Client API lib | `packages/api-client/src/core/get-response-data.ts` | Move | High | Shared parsing |
| `get-api-error-message` | Client API lib | `packages/api-client/src/core/get-api-error-message.ts` | Move | High | Shared error extraction |
| `parse-json-safe` | Client API lib | `packages/api-client/src/core/parse-json-safe.ts` | Move | High | Route handlers and API client need it |
| `request-body` | Client API lib | `packages/api-client/src/core/request-body.ts` | Move | Medium | Shared helper if generic |
| `proxy-auth-cookies` | Client API lib | `packages/auth` or `packages/api-client/src/bff` | Extract carefully | High | BFF/session logic; check Next coupling |
| `proxy-headers` | Client API lib | `packages/api-client/src/bff` | Move | High | Thin app route handlers can reuse |
| `proxy-response` | Client API lib | `packages/api-client/src/bff` | Move | High | Shared BFF response helper |
| `auth-proxy` | Client API lib | `packages/auth` + `packages/api-client/src/auth` | Split by responsibility | High | Admin login/no register nuance |
| `backend-proxy` | Client API lib | `packages/api-client/src/bff` | Move generic wrapper | High | Route handlers should become thin |
| `public-backend-proxy` | Client API lib | `packages/api-client/src/bff` | Move | Medium | Public catalog/stores route handlers |
| `local-api` / `server-api` / `bff-api` | Client API lib | `packages/api-client` with app adapters | Audit and split | High | Avoid app-only API client |

Target `packages/api-client` structure:

```txt
packages/api-client/src/
  core/
    api-request.ts
    api-error.ts
    api-url.ts
    get-response-data.ts
    get-api-error-message.ts
    parse-json-safe.ts
    build-query-string.ts
  bff/
    proxy-headers.ts
    proxy-response.ts
    backend-proxy.ts
    public-backend-proxy.ts
  auth/
    auth.api.ts
  client/
    products.api.ts
    stores.api.ts
    cart.api.ts
    checkout.api.ts
    reviews.api.ts
    orders.api.ts
  vendor/
    vendor-dashboard.api.ts
    vendor-orders.api.ts
    vendor-customers.api.ts
    vendor-medicines.api.ts
    medicine-requests.api.ts
  admin/
    admin-dashboard.api.ts
    admin-products.api.ts
    admin-customers.api.ts
    admin-suppliers.api.ts
    admin-orders.api.ts
```

## 6. Next.js app files audit

Special Next.js files must stay inside each app. Extract only their reusable UI/config/helper parts.

| File / Folder | Current location | Shared part | App-specific part | Target package | Action | Priority | Notes |
|---|---|---|---|---|---|---|---|
| `error.tsx` | `apps/client/src/app/error.tsx` | Error page UI, visual layout, action layout | Next error wrapper, text, home/catalog actions | `packages/ui/src/status-pages/ErrorPage` | Extract shared `ErrorPage` component | High | `error.tsx` must remain app-local and client component |
| `not-found.tsx` | `apps/client/src/app/not-found.tsx` | Not found layout, action layout, visual card | App copy, routes, optional secondary action | `packages/ui/src/status-pages/NotFoundPage` | Extract shared `NotFoundPage` component | High | Different home links/copy for Client/Vendor/Admin |
| `loading.tsx` | `apps/client/src/app/loading.tsx` | Page loader UI | Route-level wrapper | `packages/ui/src/status-pages/PageLoader` | Extract shared loader | High | Current loading uses `div`, good: avoid extra `<main>` if layout already has main |
| `loading.module.css` | `apps/client/src/app/loading.module.css` | Loader styles | App sizing if any | `packages/ui/src/status-pages/PageLoader` | Move shared loader styles | High | Keep skeleton sizing configurable |
| `status-page.module.css` | `apps/client/src/app/status-page.module.css` | Status page layout styles | App-specific image/copy maybe | `packages/ui/src/status-pages/StatusPageLayout` | Move shared status styles or split | High | Avoid duplicated error/404 CSS later |
| `layout.tsx` | `apps/client/src/app/layout.tsx` | Provider composition pattern, global styles, shell primitives | `html lang`, metadata, app shell composition | `packages/ui`, `packages/auth`, `packages/config/seo` | Extract providers/shell/helpers only | High | Layout file stays app-specific |
| `page.tsx` | `apps/client/src/app/page.tsx` | Some section primitives maybe | Storefront homepage content | Mostly app-specific | Keep Client page local | Low | Vendor root must not copy Client homepage |
| `page.module.css` | `apps/client/src/app/page.module.css` | Generic hero/card styles only if reused | Storefront homepage design | Keep local initially | Keep local | Low | Do not over-share marketing page CSS |
| `robots.ts` | `apps/client/src/app/robots.ts` | Robots builder/helper | Client public index rules | `packages/config/src/seo/robots.ts` | Extract helper, keep file local | Medium | Vendor/Admin should be noindex |
| `sitemap.ts` | `apps/client/src/app/sitemap.ts` | Sitemap builders, fetch pagination helpers, date parsing | Client public URLs and dynamic products/stores | `packages/config/src/seo/sitemap.ts` or `packages/utils/src/seo` | Extract builders | Medium | Vendor/Admin usually no sitemap or empty private sitemap |
| `icon.svg` | `apps/client/src/app/icon.svg` | Source asset maybe | Physical Next app icon | Optional `packages/assets` or per-app copy | Decide and document | Low | Keeping small duplicate is acceptable |

## 7. Route groups audit

| Route group | Current purpose in Client | Vendor/Admin equivalent? | Shared candidates | App-specific parts | Action | Priority |
|---|---|---|---|---|---|---|
| `(public)` | Public storefront pages | Vendor/Admin have limited public auth pages only | Public layout primitives, SEO helpers | Storefront marketing/catalog pages | Keep route group app-specific | Medium |
| `(public)/(auth)` | Login/register/password flows | Vendor auth yes; Admin login only | Auth shell, form fields, login form logic, password field, validation, auth API, errors | Client register copy/redirects; Admin no register | Extract shared auth primitives | High |
| `(public)/(info)` | Legal/info pages | Usually Client only | Info page layout maybe | Legal copy/pages | Keep Client-specific initially | Low |
| `(public)/(medicines)` | Catalog and product pages | Vendor/Admin have medicine/product management but different pages | Product types, product filters, product cards primitives maybe | Storefront catalog/details UX | Extract domain config/types/API, keep pages local | High |
| `(public)/(pharmacies)` | Store catalog/details pages | Vendor profile/admin pharmacies need same domain | Store/pharmacy types, filters, profile validation, status config | Public listing/details UX | Extract domain logic | High |
| `(public)/[slugId]` | Root-level SEO detail resolver | Vendor/Admin should not use public root slug resolver | Slug helpers, reserved slugs, detail resolver utilities maybe | Client SEO routing | Keep route local, extract slug helpers/config | Medium |
| `(private)` | Cart, checkout, profile/orders | Vendor/Admin private cabinets yes but different sections | Auth guards, shell primitives, status pages, order types/statuses | Cart/checkout/customer profile pages | Extract auth/shell/order domain logic | High |
| `api` | Next BFF/proxy route handlers | Each app may have route handlers, but not same folders | BFF helpers, request helpers, DTO/types | Next route wrapper and role-specific access | Extract reusable logic, keep handlers app-local | High |

## 8. App API route handlers audit

These are Next.js app-level BFF/proxy handlers, not the backend `apps/api`. Do not move whole `app/api` folders into packages. Make handlers thin and move reusable request/domain logic into packages.

| API folder | Shared domain? | Shared logic | App-specific logic | Target package | Action | Priority | Notes |
|---|---|---|---|---|---|---|---|
| `api/auth` | Yes | Auth API methods, DTOs, validation, session/cookie helpers, role redirects, error helpers | Next route handler wrappers; register availability differs by app | `packages/api-client/auth`, `packages/auth`, `packages/types/auth`, `packages/validation/auth` | Extract shared auth logic | High | Admin has login but no register |
| `api/cart` | Mostly Client-specific | Cart types, cart API methods, totals helpers, invoice limit helpers | Customer cart route handlers | `packages/types/cart`, `packages/api-client/client`, `packages/utils/cart` | Extract reusable cart pieces only | Medium | Vendor/Admin do not have customer cart |
| `api/orders` | Yes | Order types, statuses, status config, transition rules, order API helpers | Client order list/details vs Vendor/Admin order management | `packages/types/order`, `packages/config/statuses`, `packages/config/filters`, `packages/api-client` | Extract domain/order logic | High | Vendor/Admin will need orders |
| `api/products` | Yes | Product/medicine types, filters, category labels, sorting, status, product API helpers | Client catalog/favorites/reviews vs Vendor medicine CRUD vs Admin product CRUD | `packages/types/product`, `packages/types/medicine`, `packages/config/filters`, `packages/config/statuses`, `packages/api-client` | Extract product domain logic | High | Keep public Product and Vendor PharmacyMedicine concepts distinct |
| `api/stores` | Yes | Store/pharmacy types, filters, status config, profile validation, review types | Public store catalog/details/favorites vs Vendor pharmacy profile vs Admin pharmacy moderation | `packages/types/store`, `packages/types/pharmacy`, `packages/config`, `packages/validation/pharmacy`, `packages/api-client` | Extract store/pharmacy domain logic | High | Vendor profile depends on this |
| `api/health` | Low | Optional response shape helper | App-specific health endpoint | Optional `packages/types/api` or keep local | Keep simple | Low | Do not over-engineer |

## 9. Types and domain models audit

| Domain | Current state | Target package/action | Priority | Notes |
|---|---|---|---|---|
| `User` / `Role` | Some shared types exist; Client has local auth/user types | Centralize in `packages/types/src/auth.ts` and maybe `user.ts` | High | Roles needed for Client/Vendor/Admin guards |
| `Product` | Shared product types exist; Client has local product types | Consolidate in `packages/types/src/product.ts` and later `medicine.ts` | High | Separate customer product view from vendor medicine CRUD if shapes differ |
| `Store` / `Pharmacy` | Shared store types exist; Client has local stores types | Consolidate and add pharmacy/vendor profile types | High | Vendor depends on pharmacy profile |
| `Cart` | Shared cart types exist; Client has local cart types | Consolidate reusable cart types | Medium | Client-only UX but API shapes should be shared |
| `Order` | Shared order types exist; Client has local order types | Consolidate and add status/transition types | High | Vendor/Admin order flows need it |
| `Review` | Shared review types exist; Client review validation local | Consolidate review DTOs and validation | Medium | Later moderation may reuse |
| `Customer` | Missing/partial | Add `packages/types/src/customer.ts` | High | Admin customers table |
| `Vendor` | Shared vendor file exists | Expand for vendor cabinet | High | Shop/profile/stats/client goods |
| `Medicine` | Product-like currently | Add `packages/types/src/medicine.ts` if vendor shape differs | High | Avoid Product/Medicine confusion |
| `MedicineRequest` | Missing | Add `packages/types/src/medicine-request.ts` | High | Vendor request workflow |
| `Pagination` | Likely repeated in API/types | Centralize in `packages/types/src/api.ts` | High | Lists across all apps |
| `ApiResponse` / `ApiError` | Shared API types exist | Keep canonical in `packages/types/src/api.ts` | High | API client should consume these |
| `DashboardStats` | Missing | Add for Vendor/Admin stats | Medium | Needed before dashboard implementation |

## 10. Vendor routing strategy

Before Vendor implementation starts, fix the route strategy clearly:

```txt
/vendor            -> redirect('/vendor/dashboard')
/vendor/dashboard  -> main Vendor cabinet dashboard
```

Recommended app structure:

```txt
apps/vendor/src/app/
  (public)/
    (auth)/
      login/
      register/
      forgot-password/

  (private)/
    vendor/
      page.tsx                 // redirect('/vendor/dashboard')
      dashboard/
        page.tsx
      orders/
        page.tsx
      customers/
        page.tsx
      medicines/
        page.tsx
      medicine-requests/
        page.tsx
      profile/
        page.tsx
```

Alternative if auth is global:

```txt
/auth/login
/auth/register
/auth/forgot-password
/vendor/dashboard
/vendor/orders
/vendor/customers
/vendor/medicines
/vendor/medicine-requests
/vendor/profile
```

Decision: use explicit `/vendor/dashboard`, not a hidden dashboard at root `page.tsx`. Root `/vendor` is a redirect. Admin should mirror this later:

```txt
/admin           -> redirect('/admin/dashboard')
/admin/dashboard -> main Admin dashboard
```

## 11. Migration implementation plan

### Stage 0 — Audit only

Create `docs/shared-audit.md`. Classify all candidates, risks and target packages. No code migration yet.

Commit:

```bash
git add .
git commit -m "docs: add shared audit before vendor development"
git push
```

### Stage 1 — Prepare shared packages

Create missing `packages/hooks` and `packages/auth` if approved. Ensure `package.json`, `tsconfig.json`, `src/index.ts`, `pnpm-workspace.yaml`, `turbo.json` and package exports are ready.

Commit:

```bash
git add .
git commit -m "chore: prepare shared packages for vendor foundation"
git push
```

### Stage 2 — Move shared styles

Move reset/tokens/base/utilities to `packages/ui/src/styles`. Update Client imports. Split `theme.css` if needed.

Commit:

```bash
git add .
git commit -m "refactor: move shared styles to ui package"
git push
```

### Stage 3 — Move reusable hooks

Move reusable UI hooks to `@e-pharmacy/hooks`. Keep favorites/review hooks local for now.

Commit:

```bash
git add .
git commit -m "refactor: move reusable hooks to shared hooks package"
git push
```

### Stage 4 — Migrate base UI components

Compare Client and package versions, choose canonical implementations in `@e-pharmacy/ui`, update Client imports, remove duplicates.

Commit:

```bash
git add .
git commit -m "refactor: migrate base ui components to shared package"
git push
```

### Stage 5 — Move modal system

Create `packages/ui/src/modals`. Consolidate modal base/root/confirmation/action choice. Leave cart-specific wrappers in Client.

Commit:

```bash
git add .
git commit -m "refactor: move modal system to shared ui package"
git push
```

### Stage 6 — Move toast system

Move Toast UI, ToastProvider and matching hook/API into shared layer.

Commit:

```bash
git add .
git commit -m "refactor: move toast provider to shared ui"
git push
```

### Stage 7 — Move form fields

Move/convert reusable form fields into Formik-agnostic controlled primitives.

Commit:

```bash
git add .
git commit -m "refactor: migrate reusable form fields to shared ui"
git push
```

### Stage 8 — Move layout primitives

Move Breadcrumbs, BurgerButton and MobileOffcanvas base. Keep Client Header/Footer local unless decomposed into shared base + app wrapper.

Commit:

```bash
git add .
git commit -m "refactor: move reusable layout primitives to shared ui"
git push
```

### Stage 8.1 — Extract shared status pages

Extract ErrorPage, NotFoundPage, PageLoader and shared status layout styles. Keep Next special wrappers inside each app.

Commit:

```bash
git add .
git commit -m "refactor: extract shared status pages"
git push
```

### Stage 8.2 — Document app root files strategy

Classify `layout.tsx`, `page.tsx`, `page.module.css`, `icon.svg`. Fix Vendor homepage strategy.

Commit:

```bash
git add .
git commit -m "docs: document app root file sharing strategy"
git push
```

### Stage 8.3 — Extract SEO helpers

Extract robots/sitemap/metadata helpers while keeping app files local.

Commit:

```bash
git add .
git commit -m "refactor: extract shared seo helpers"
git push
```

### Stage 9 — Move routes, navigation and constants

Move route maps, nav configs, metadata constants, filter configs and pagination constants to `@e-pharmacy/config`.

Commit:

```bash
git add .
git commit -m "refactor: move shared routes and constants to config package"
git push
```

### Stage 10 — Move utils and formatters

Move date/price/initials/label/stock/query/className/slug helpers to `@e-pharmacy/utils` or `@e-pharmacy/api-client` where appropriate.

Commit:

```bash
git add .
git commit -m "refactor: move shared utils and formatters to utils package"
git push
```

### Stage 11 — Move validation schemas

Move auth/customer/review validation and prepare pharmacy/medicine/order validation domains.

Commit:

```bash
git add .
git commit -m "refactor: move shared validation schemas to validation package"
git push
```

### Stage 12 — Extract auth core and guards

Create shared auth core, route guards and role guard. Keep app wrappers local.

Commit:

```bash
git add .
git commit -m "refactor: extract shared auth core and route guards"
git push
```

### Stage 13 — API client migration

Move request core and split API methods by `auth`, `client`, `vendor`, `admin` domains.

Commit:

```bash
git add .
git commit -m "refactor: move reusable api layer to api-client package"
git push
```

### Stage 13.1 — Audit app API handlers

Document which `app/api` handlers stay app-local and which logic moves to packages.

Commit:

```bash
git add .
git commit -m "docs: audit app api handlers for shared extraction"
git push
```

### Stage 13.2 — Extract reusable app API logic

Make route handlers thinner by moving reusable business/request logic to packages.

Commit:

```bash
git add .
git commit -m "refactor: extract reusable app api logic to shared packages"
git push
```

### Stage 14 — Centralize domain types

Move remaining local Client domain types to `@e-pharmacy/types` and add Vendor/Admin-needed models.

Commit:

```bash
git add .
git commit -m "refactor: centralize shared domain types"
git push
```

### Stage 15 — Final Client cleanup

Remove leftover shared duplicates from Client. Client must consume shared packages just like Vendor/Admin.

Commit:

```bash
git add .
git commit -m "refactor: clean client after shared package migration"
git push
```

Final commit after the whole shared-foundation block:

```bash
git add .
git commit -m "refactor: prepare shared foundation for vendor development"
git push
```

## 12. Definition of Done

The shared audit/migration block is done when:

1. `docs/shared-audit.md` exists and reflects actual code structure.
2. Shared components are in `packages/ui`.
3. Shared hooks are in `packages/hooks`.
4. Toast UI/provider are shared.
5. Modal system is shared.
6. Form fields are shared or intentionally prepared as shared primitives.
7. Breadcrumbs, BurgerButton and MobileOffcanvas base are shared.
8. Routes/constants/navigation live in `packages/config`.
9. Formatters/utilities live in `packages/utils`.
10. Validation schemas live in `packages/validation`.
11. Auth core/guards are ready for Client/Vendor/Admin.
12. API core lives in `packages/api-client`.
13. Client uses shared packages instead of local duplicates.
14. Vendor can start without copying Client logic.
15. Admin can later reuse the same foundation.
16. Next.js special files are audited: `error`, `not-found`, `loading`, `layout`, `page`, `robots`, `sitemap`, `icon`.
17. Shared status pages are extracted to `packages/ui`.
18. Robots/sitemap helpers are extracted or prepared in `packages/config/seo`.
19. `app/api` route handlers are audited separately.
20. Business logic is not hidden in Client-only BFF handlers.
21. Auth/orders/products/stores API/domain logic is ready for Vendor/Admin.
22. Vendor routing strategy is fixed: `/vendor` redirects to `/vendor/dashboard`.
23. Admin routing strategy mirrors it: `/admin` redirects to `/admin/dashboard`.

## 13. Explicitly forbidden during Vendor implementation

Do not create Vendor copies of existing shared candidates:

```txt
VendorButton
VendorModalBase
VendorToastProvider
VendorSearchInput
VendorPagination
```

Do not add app-specific flags to shared components:

```tsx
<Button isClient isVendor isAdmin />
```

Use real reusable APIs instead:

```tsx
<Button variant="primary" size="md" tone="brand" />
```

Do not import across apps:

```ts
// forbidden
import { Button } from '../../client/src/components/common/Button';
```

Always extract first:

```ts
import { Button } from '@e-pharmacy/ui';
```

## 14. Decision rule for every entity

For each file/component/hook/helper, ask:

1. Will it be used by 2+ apps?
   - Yes: shared candidate.
2. Is it pure UI or interaction logic?
   - `packages/ui` or `packages/hooks`.
3. Is it a business model, DTO or API response type?
   - `packages/types`.
4. Is it routes, permissions, filters, statuses or navigation?
   - `packages/config`.
5. Is it validation?
   - `packages/validation`.
6. Is it backend request logic?
   - `packages/api-client`.
7. Is it concrete Client cart/catalog/profile UX?
   - Keep in `apps/client`.

Small joke, serious rule: if a file says “I am reusable” but secretly imports cart checkout copy, it is not shared — it is just wearing a fake moustache.

## Stage 1 package readiness update

The shared package boundary is prepared for the next migration steps:

| Area | Result | Notes |
|---|---|---|
| `packages/hooks` | Created | Public API starts at `@e-pharmacy/hooks`; reusable hooks from `apps/client/src/hooks` should move here during Stage 3. |
| `packages/auth` | Created | Public API starts at `@e-pharmacy/auth`; currently contains shared auth access config types and is ready for auth core/guards in Stage 12. |
| `packages/ui` | Expanded package namespaces | Reserved public entry points for `feedback`, `form-fields`, `layout`, `modals`, `status-pages`, and `styles/*`. Existing component exports remain unchanged. |
| `packages/config` | Expanded package namespaces | Reserved public entry points for `navigation`, `statuses`, `filters`, `permissions`, `seo`, and `route-groups`. Existing `@e-pharmacy/config/routes` export remains backward-compatible. |
| `packages/api-client` | Expanded package namespaces | Reserved public entry points for `core`, `auth`, `client`, `vendor`, and `admin`. Existing `@e-pharmacy/api-client/bff` export remains unchanged. |
| Workspace scripts | Added package checks | Root scripts now include `lint:packages` and `type-check:packages` for focused shared-package checks. |

Validation performed for Stage 1:

```bash
tsc --noEmit -p packages/types/tsconfig.json
tsc --noEmit -p packages/config/tsconfig.json
tsc --noEmit -p packages/utils/tsconfig.json
tsc --noEmit -p packages/api-client/tsconfig.json
tsc --noEmit -p packages/ui/tsconfig.json
tsc --noEmit -p packages/validation/tsconfig.json
tsc --noEmit -p packages/hooks/tsconfig.json
tsc --noEmit -p packages/auth/tsconfig.json
```

All package type-checks passed in the prepared workspace. Full monorepo `pnpm` commands were not run in this environment because `pnpm` is not installed here; the package-level TypeScript checks were run with the available `tsc` binary.

## Stage 2 shared styles migration update

Shared global styles were moved from the Client app boundary into the UI package boundary.

| Area | Result | Notes |
|---|---|---|
| `packages/ui/src/styles/reset.css` | Added | Copied from `apps/client/src/styles/reset.css`; generic reset rules only. |
| `packages/ui/src/styles/tokens.css` | Added | Copied from `apps/client/src/styles/tokens.css`; tokens are currently generic enough for Client/Vendor/Admin foundation and contain no `--client-*`, `--vendor-*`, `--admin-*`, or cart-panel-only variables. |
| `packages/ui/src/styles/base.css` | Added | Copied from `apps/client/src/styles/base.css`; body, selection and focus-visible defaults depend only on shared tokens. |
| `packages/ui/src/styles/utilities.css` | Added | Copied from `apps/client/src/styles/utilities.css`; contains reusable `.container`, `.visually-hidden`, and `.no-scroll` utilities. |
| `apps/client/src/app/layout.tsx` | Updated | Client now imports global styles from `@e-pharmacy/ui/styles/*` instead of `@/styles/*`. |
| `packages/ui/package.json` | Updated | CSS subpath export changed to `./styles/*.css` → `./src/styles/*.css`, so imports like `@e-pharmacy/ui/styles/tokens.css` resolve correctly without `.css.css` doubling. |
| `apps/client/src/styles/*` | Remove from Client after applying patch | These files are now shared-source duplicates and should not remain as active Client-owned style sources. If an app-specific theme layer is needed later, create a new `apps/client/src/styles/theme.css` instead of restoring reset/base/tokens/utilities locally. |

Validation performed for Stage 2:

```bash
tsc --noEmit -p packages/ui/tsconfig.json
```

The UI package type-check passed after adding the shared style files. Full monorepo `pnpm` commands were not run in this environment because `pnpm` is not installed here.


## Stage 3 shared hooks migration update

Reusable interaction hooks were moved from the Client app boundary into `packages/hooks` and exposed through the public `@e-pharmacy/hooks` API.

| Area | Result | Notes |
|---|---|---|
| `useBackdropClick` | Moved to `packages/hooks` | Used by modals, offcanvas, and filter panels. |
| `useBodyScrollLock` | Moved to `packages/hooks` | Keeps modal/offcanvas scroll-lock behavior reusable across Client/Vendor/Admin. |
| `useEscapeToClose` | Moved to `packages/hooks` | Used by modal/offcanvas/overlay primitives. |
| `useFocusTrap` | Moved to `packages/hooks` | Kept generic and DOM-based; no Client business dependency. |
| `useListboxNavigation` | Moved to `packages/hooks` | Shared keyboard helper exports were added beside the hook because Select/SearchableSelect use the same listbox key logic. |
| `useToast` | Moved to `packages/hooks` | Toast context and hook now live in `@e-pharmacy/hooks`; the current Client `ToastProvider` imports that context until Stage 6 moves the provider/UI layer. |
| Client-specific hooks | Kept in `apps/client/src/hooks` | `useFavoriteRefresh`, `useFavoriteStatusRefresh`, `useFavoriteToggle`, and `useReviewForm` remain Client-specific for now because they depend on auth, favorites, reviews, and storefront services. |
| Client imports | Updated | Shared hooks now import from `@e-pharmacy/hooks`; mixed imports were split so Client-specific hooks still come from `@/hooks`. |

After applying this patch, remove the old shared-hook source duplicates from `apps/client/src/hooks`:

```txt
apps/client/src/hooks/useBackdropClick.ts
apps/client/src/hooks/useBodyScrollLock.ts
apps/client/src/hooks/useEscapeToClose.ts
apps/client/src/hooks/useFocusTrap.ts
apps/client/src/hooks/useListboxNavigation.ts
apps/client/src/hooks/useToast.ts
```

Keep these Client-specific hooks local for now:

```txt
apps/client/src/hooks/useFavoriteRefresh.ts
apps/client/src/hooks/useFavoriteStatusRefresh.ts
apps/client/src/hooks/useFavoriteToggle.ts
apps/client/src/hooks/useReviewForm.ts
```

Validation note for Stage 3: full monorepo `pnpm` commands were not run in this environment because `pnpm` is not installed here. The migration keeps public package imports only and avoids app-to-app or package-to-app imports.


## Stage 4 base UI components migration update

Moved reusable common UI components from `apps/client/src/components/common` into `packages/ui/src/common` using the same folder-per-component structure as the client app. Removed the unused `packages/ui/src/components` structure. Client imports for migrated components now point to `@e-pharmacy/ui/common` or `@e-pharmacy/ui/common/<ComponentName>`. Components migrated in this stage: Button, ButtonLink, CloseIconButton, Container, LoadingSpinner, Pagination, RadioOption, SearchInput, SelectField, Toast, ModalBase, Logo, LazyLoadButton, ResetFiltersButton, TextActionButton, Tabs, SearchableSelect, QuantityCounter, SvgIcon, UserBadge, AvatarImage, ProfilePhotoCard, RatingSummary, ShimmerImage. Local client component folders for these migrated components should be removed after applying the patch.

## Stage 5 modal system migration update

Reusable modal primitives were moved from common/app-level locations into the shared modal namespace `packages/ui/src/modals`, using one folder per component.

| Area | Result | Notes |
|---|---|---|
| `ModalBase` | Moved to `packages/ui/src/modals/ModalBase` | Keeps portal-adjacent dialog shell behavior reusable through `ModalRoot`, backdrop click, Escape close, body scroll lock, and focus trap hooks. |
| `ModalRoot` | Moved to `packages/ui/src/modals/ModalRoot` | Shared portal target for Client/Vendor/Admin modal systems. |
| `ConfirmationModal` | Added to `packages/ui/src/modals/ConfirmationModal` | Replaces the old `ConfirmActionModal` naming with a generic shared confirmation primitive. |
| `ActionChoiceModal` | Added to `packages/ui/src/modals/ActionChoiceModal` | Generic two-action modal prepared for app-specific wrappers and future Vendor/Admin flows. |
| `apps/client/src/components/common/ConfirmActionModal` | Remove from Client | Client usages now import `ConfirmationModal` from `@e-pharmacy/ui/modals`. |
| `apps/client/src/components/modals/ModalRoot` | Remove from Client | Client now imports `ModalRoot` from `@e-pharmacy/ui/modals`. |
| `packages/ui/src/common/ModalBase`, `ModalRoot`, `ConfirmActionModal` | Remove from common | Modal primitives now belong to the `modals` namespace, not `common`. |
| `ContinueShoppingModal` | Kept in Client as app-specific cart/catalog modal | It contains storefront cart/product fetching logic and should not be moved as a shared modal. It now uses shared `ModalBase` and `ModalRoot`. |
| `CartInvoiceLimitModal` | Kept in Client as app-specific wrapper | It contains cart invoice copy/constants and now uses shared `ConfirmationModal`. |

After applying this patch, remove the old duplicate modal folders listed in `DELETE_STAGE_5_DUPLICATES.txt`.


## Stage 6 toast provider and feedback migration update

Toast UI and provider logic were moved from the Client app boundary into the shared UI feedback namespace, using one folder per component.

| Area | Result | Notes |
|---|---|---|
| `Toast` | Moved to `packages/ui/src/feedback/Toast` | Toast UI is now part of the shared feedback layer instead of `common`. |
| `ToastProvider` | Moved to `packages/ui/src/feedback/ToastProvider` | Provider state, duplicate filtering, duration handling, and context wiring are now reusable by Client/Vendor/Admin. |
| `useToast` | Kept in `packages/hooks` | The hook was already migrated in Stage 3 and remains the shared public hook for apps and packages. |
| `apps/client/src/providers/ToastProvider` | Remove from Client | Client now imports `ToastProvider` from `@e-pharmacy/ui/feedback`. |
| `packages/ui/src/common/Toast` | Remove from common | Toast belongs to the feedback namespace, not common. |
| `packages/ui/src/feedback` | Public entry updated | `@e-pharmacy/ui/feedback` now exports `Toast`, `ToastProvider`, and `ToastVariant`. |

After applying this patch, remove the old duplicate toast folders listed in `DELETE_STAGE_6_DUPLICATES.txt`.

## Stage 7 update — reusable form fields

Moved reusable form field UI from `apps/client/src/components/form-fields` to `packages/ui/src/form-fields` using the same folder-per-component structure as the client codebase.

Shared form fields now live in:

- `packages/ui/src/form-fields/AddressInput`
- `packages/ui/src/form-fields/CommentInput`
- `packages/ui/src/form-fields/EmailInput`
- `packages/ui/src/form-fields/FormFieldLayout`
- `packages/ui/src/form-fields/NameInput`
- `packages/ui/src/form-fields/PasswordInput`
- `packages/ui/src/form-fields/PhoneInput`

Client usage was switched to `@e-pharmacy/ui/form-fields`.
The old local `apps/client/src/components/form-fields` folder must be removed after applying this stage to avoid duplicate shared UI.

Notes:

- The fields remain controlled and are not coupled to Formik.
- Validation logic remains outside UI components; fields only use display limits for `maxLength` and counters.
- Domain validation schemas stay in `@e-pharmacy/validation` and will be handled more deeply in the dedicated validation migration stage.


## Stage 8 layout primitives migration update

Reusable layout primitives were moved to `packages/ui/src/layout` with one folder per component where applicable.

| Entity | Current Client role | Target / Result | Action | Notes |
|---|---|---|---|---|
| `Breadcrumbs` | Generic route breadcrumb renderer | `packages/ui/src/layout/Breadcrumbs` | Moved to shared UI | Accepts `items`, optional structured data, and optional `createItemUrl` so apps can provide their own absolute URL builder. |
| `BurgerButton` | Generic mobile menu trigger | `packages/ui/src/layout/BurgerButton` | Moved to shared UI | Keeps accessible `aria-expanded` / `aria-controls` behavior and configurable labels. |
| `MobileOffcanvasBase` | Reusable offcanvas behavior | `packages/ui/src/layout/MobileOffcanvasBase` | Added shared base | Owns portal, backdrop click, Escape close, body scroll lock, focus trap, dialog role, and title wiring. |
| Client `MobileOffcanvas` | Client navigation/auth/cart composition | Stays in `apps/client/src/components/layout/MobileOffcanvas` | App-specific wrapper | Uses shared `MobileOffcanvasBase`, but keeps Client nav items/auth/logout/profile logic local. |
| `Header` / `Footer` | Client-specific storefront navigation and copy | Stay local | Do not move yet | They depend on Client nav constants, auth, cart count, and storefront wording. |
| `AppShell` | Composes Client Header/Footer around page content | Stays local | Do not move yet | Current shell is still Client-specific. A generic `AppShellBase` can be added later when Vendor/Admin layouts exist. |

After applying Stage 8, remove old local duplicate folders for `Breadcrumbs` and `BurgerButton` only.

## Stage 8.1 shared status pages update

Shared status page components were extracted into `packages/ui/src/status-pages` with one folder per component.

| Entity | Result | Notes |
|---|---|---|
| `StatusPageLayout` | Added to `packages/ui/src/status-pages/StatusPageLayout` | Shared visual layout used by error and not-found pages. |
| `ErrorPage` | Added to `packages/ui/src/status-pages/ErrorPage` | Client `app/error.tsx` is now a thin Next.js wrapper that passes title/copy/actions. |
| `NotFoundPage` | Added to `packages/ui/src/status-pages/NotFoundPage` | Client `app/not-found.tsx` is now a thin wrapper with app-specific routes/copy. |
| `PageLoader` | Added to `packages/ui/src/status-pages/PageLoader` | Client `app/loading.tsx` is now a thin wrapper. It uses a `div`, not an extra `main`, so it does not create duplicate main landmarks. |
| `status-page.module.css` / `loading.module.css` | Moved into shared status page components | Old app-level CSS files should be removed after applying this patch. |

## Stage 8.2 root layout/page/icon audit update

| File / Folder | Current location | Shared part | App-specific part | Target package | Action | Priority | Notes |
|---|---|---|---|---|---|---|---|
| `layout.tsx` | `apps/client/src/app/layout.tsx` | Shared providers already include `ToastProvider` from `@e-pharmacy/ui/feedback`; shared styles imports | Metadata constants, Client auth wrapper, Client shell composition | `packages/ui`, later `packages/auth` | Keep app file as wrapper | High | Do not move Next.js layout file into packages. |
| `page.tsx` | `apps/client/src/app/page.tsx` | `Container`, `ButtonLink`, cards/sliders may reuse shared UI later | Storefront homepage content and featured products/stores | App-specific | Keep local | High | Vendor root must not copy Client homepage. |
| `page.module.css` | `apps/client/src/app/page.module.css` | Some hero/status primitives may be reusable later | Storefront homepage layout and marketing sections | App-specific for now | Keep local | Medium | Do not move without Vendor/Admin design needs. |
| `icon.svg` | `apps/client/src/app/icon.svg` | Source brand asset could later be mirrored into shared assets | Next.js physical app icon file | App asset / optional shared assets later | Keep local | Low | Small file; safe to duplicate per app if needed. |

Vendor routing decision remains:

- `/vendor` redirects to `/vendor/dashboard`.
- `/vendor/dashboard` is the main Vendor cabinet page.

Admin should follow the same pattern later:

- `/admin` redirects to `/admin/dashboard`.
- `/admin/dashboard` is the main Admin panel page.

## Stage 8.3 SEO special files update

Shared SEO helpers were added to `packages/config/src/seo`.

| Entity | Result | Notes |
|---|---|---|
| `createRobotsConfig` | Added to `packages/config/src/seo/robots.ts` | Client uses indexable public strategy; Vendor/Admin can use noindex private strategy. |
| Sitemap helpers | Added to `packages/config/src/seo/sitemap.ts` | Includes absolute URL creation, date parsing, static entries, deduplication, and route conversion helpers. |
| `SEO_STRATEGIES` | Added to `packages/config/src/seo/metadata.ts` | Documents Client/Vendor/Admin indexing strategy in config. |
| `apps/client/src/app/robots.ts` | Updated | Stays as a Next.js special file, but now delegates robots config building to `@e-pharmacy/config/seo`. |
| `apps/client/src/app/sitemap.ts` | Updated | Stays as a Next.js special file and keeps Client-specific dynamic product/store fetching, while shared sitemap helper logic lives in config. |

Next.js special files remain in each app. Only reusable builders/components moved to packages.

## Stage 9 routes, navigation, and constants migration update

Reusable route, navigation, SEO, asset, catalog, and info-page constants were moved from `apps/client/src/lib/constants` and `apps/client/src/lib/routes` into `packages/config`.

| Entity | Previous location | Target / Result | Action | Notes |
|---|---|---|---|---|
| Client routes | `apps/client/src/lib/constants/routes.ts` | `packages/config/src/routes/client-routes.ts` | Moved to shared config | Client now imports `ROUTES` from `@e-pharmacy/config/routes`. |
| Route segments / reserved slugs | `packages/config/src/routes.ts` | `packages/config/src/routes/route-segments.ts` plus compatibility `routes.ts` | Reorganized | Keeps root slug protection available from config. |
| Vendor/Admin route placeholders | Not centralized | `packages/config/src/routes/vendor-routes.ts`, `admin-routes.ts` | Added | Establishes `/vendor -> /vendor/dashboard` and `/admin -> /admin/dashboard` strategy. |
| Route helpers | `apps/client/src/lib/routes` | `packages/config/src/routes` | Moved | Includes auth redirects, breadcrumbs, active-route checks, slug-id parsing, product/store path builders. |
| Client navigation | `apps/client/src/lib/constants/navigation.ts` | `packages/config/src/navigation/client-nav.ts` | Moved | Client nav/footer/info links are now shared config. |
| Vendor/Admin navigation placeholders | Not centralized | `packages/config/src/navigation/vendor-nav.ts`, `admin-nav.ts` | Added | Provides a clear place for future app navigation. |
| Assets | `apps/client/src/lib/constants/assets.ts` | `packages/config/src/assets.ts` | Moved | Shared sprite and image directory constants. |
| Catalog controls | `apps/client/src/lib/constants/catalog-controls.ts` | `packages/config/src/catalog.ts` | Moved | Search delay and max length are shared config. |
| Info pages | `apps/client/src/lib/constants/info-pages.ts` | `packages/config/src/info-pages.ts` | Moved | Legal/info page content can be reused or audited centrally. |
| Metadata constants | `apps/client/src/lib/constants/metadata.ts` | `packages/config/src/seo/metadata.ts` | Partially moved | Static title/description/OG constants are shared; runtime `CLIENT_ENV` stays app-specific. |
| SEO route constants | `apps/client/src/lib/constants/seo.ts` | `packages/config/src/seo/client-seo.ts` | Moved | Index/noindex/robots/sitemap static routes are now shared config. |
| API route constants | `apps/client/src/lib/constants/api-routes.ts`, `client-api-routes.ts` | `@e-pharmacy/api-client` direct imports | Replaced | Client now imports `apiRoutes` and `clientApiRoutes` from the API client package. |

After applying Stage 9, remove old duplicated Client constants/routes folders except `apps/client/src/lib/constants/env.ts`, which remains app-specific because it reads Next.js environment variables.

## Stage 10 update — shared formatters and utils

| Entity | Previous location | Target location | Action | Status | Notes |
|---|---|---|---|---|---|
| formatPrice / formatPriceRange | apps/client/src/lib/formatters | packages/utils/src/formatters | Moved to shared utils package | Done | Product offer input is structural to avoid app-only type dependency. |
| formatShortDate / formatOrderDateTime / formatReviewDate | apps/client/src/lib/formatters | packages/utils/src/formatters | Moved to shared utils package | Done | Locale/options behavior preserved. |
| formatInitials / formatCapitalizedLabel / formatStockLabel / count labels | apps/client/src/lib/formatters | packages/utils/src/formatters | Moved to shared utils package | Done | Client imports now use @e-pharmacy/utils/formatters. |
| cn | apps/client/src/lib/utils | packages/utils/src/classes | Moved to shared utils package | Done | Client imports now use @e-pharmacy/utils/classes. |
| buildQueryString | apps/client/src/lib/api/build-query-string.ts | packages/utils/src/query | Moved to shared utils package | Done | API services import it from @e-pharmacy/utils/query; local API barrel no longer exports it. |
| createAbsoluteUrl client wrapper | apps/client/src/lib/seo/url.ts | app-specific wrapper over @e-pharmacy/config/seo | Renamed to createClientAbsoluteUrl | Done | Avoids duplicate helper name/responsibility with shared createAbsoluteUrl(path, siteUrl). |

Client local formatter/utils folders should be deleted after applying this stage to avoid duplicated shared logic.

## Stage 10 duplicate cleanup note

After moving formatters and utils, an additional duplicate audit was performed across `apps/client` and `packages`.

Resolved immediately:
- moved slug helpers out of `packages/utils/src/index.ts` into `packages/utils/src/slug/`;
- removed duplicate slug implementation from `packages/config/src/routes/slug-builder.ts` and switched config routes to `@e-pharmacy/utils/slug`;
- removed local `packages/ui/src/utils` helpers in favor of `@e-pharmacy/utils/classes` and `@e-pharmacy/utils/formatters`;
- reused `createApiUrl`, `getSafeRedirectPath`, and cookie header helpers instead of duplicating them;
- renamed ambiguous local catalog helper names to domain-specific names;
- removed the unused duplicate `createQueryString` implementation from `packages/api-client`.

Detailed duplicate list is documented in `docs/duplicate-audit-stage-10.md`.

## Stage 11 validation schemas migration update

| Entity | Previous location | Target location | Action | Priority | Notes |
|---|---|---|---|---|---|
| Auth validation | apps/client/src/lib/validations/auth-validation.ts | packages/validation/src/auth/auth-validation.ts | Moved to shared auth validation package entry | High | Client imports from @e-pharmacy/validation/auth |
| Customer field validation | apps/client/src/lib/validations/customer-fields.ts | packages/validation/src/customer/customer-fields.ts | Moved to shared customer validation package entry | High | Client imports from @e-pharmacy/validation/customer |
| Review validation | apps/client/src/lib/reviews/review-validation.ts | packages/validation/src/reviews/review-validation.ts | Moved to shared reviews validation package entry | High | Uses shared limits and patterns, no hardcoded duplicate limits |
| Shared validation primitives | packages/validation/src/*.ts | packages/validation/src/shared/*.ts | Grouped assets/errors/limits/messages/patterns/sanitizers/zod schemas in shared folder | High | Root index only re-exports shared primitives |

Stage 11 keeps all implementation files inside logical folders. Index files contain re-exports only. Old client validation files are deleted after applying the deletion script.


## Stage 12 auth core and guards migration update

Shared auth core and route guards live in `packages/auth`, while Client keeps only thin app-specific wrappers for service wiring and UI fallbacks.

| Entity | Previous / current role | Target / Result | Action | Notes |
|---|---|---|---|---|
| `AuthProviderCore` / `useAuth` | Shared auth state, bootstrap, login/register/logout, current user refresh | `packages/auth/src/core` | Shared core | Receives app-provided services, so Client/Vendor/Admin can reuse the same core with different API methods and role rules. |
| Auth session constants / marker helpers | Previously exposed through local Client auth barrel | `packages/auth/src/session` | Shared session utilities | `proxy.ts` and API proxy helpers import cookie names from shared auth instead of deleted Client auth files. |
| `ProtectedRoute`, `GuestOnlyRoute`, `RoleProtectedRoute` | Reusable route guard behavior | `packages/auth/src/guards` | Shared guards | Client local route components remain thin wrappers only for Client routes and loading UI. |
| Auth redirect helpers | Redirect normalization and login redirect building | `packages/auth/src/routing` | Canonical shared implementation | `packages/config/src/routes/auth-routes.ts` re-exports the shared helpers instead of duplicating implementations. |
| Auth error messages | Shared auth error normalization | `packages/auth/src/errors` | Shared helper | Auth forms import `getAuthErrorMessage` directly from `@e-pharmacy/auth/errors`. |
| Client `AuthProvider` | Client API services wiring | `apps/client/src/providers/AuthProvider` | Keep as thin wrapper | It provides Client-specific services to `AuthProviderCore`; Vendor/Admin will create their own wrappers. |
| Client `routes` wrappers | Client-specific route paths/loading fallbacks | `apps/client/src/routes` | Keep as thin wrappers | They wrap shared guards and provide `ROUTES.LOGIN`, `ROUTES.PROFILE`, and `LoadingSpinner`. |
| `apps/client/src/lib/auth` | Local re-export duplicate | Removed | Delete after applying patch | Client now imports shared auth directly. |

Stage 12 also fixes the stale `proxy.ts` import from deleted `@/lib/auth/auth-session` to `@e-pharmacy/auth/session`.

## Stage 13 update — API client migration and app/api audit

### API core migration

| Entity | Previous location | Target location | Action | Notes |
|---|---|---|---|---|
| ApiError / isApiError | apps/client/src/lib/api/api-error.ts | packages/api-client/src/core/api-error.ts | Moved | Shared request error shape for all apps. |
| apiRequest / localApiRequest / bffApiRequest / serverApiRequest | apps/client/src/lib/api | packages/api-client/src/core | Moved | Client services and app routes now import from `@e-pharmacy/api-client/core`. |
| response helpers | apps/client/src/lib/api/get-response-data.ts, get-api-error-message.ts, parse-json-safe.ts | packages/api-client/src/core | Moved | No client-only duplicate remains after deletion script. |
| request helpers | apps/client/src/lib/api/request-body.ts, cache-options.ts, api-url.ts | packages/api-client/src/core | Moved | `createApiUrl` is now API-client scoped and no longer duplicated in client. |
| backend proxy helpers | apps/client/src/lib/api/*proxy*.ts | packages/api-client/src/proxy | Moved | Next route handlers stay in app, but proxy logic is shared. |
| storefront API methods | apps/client/src/services | packages/api-client/src/client | Added shared methods | Client service files are now thin re-export/wrapper files. Cart keeps a client-specific event wrapper only. |

### App API route handlers audit

| API folder | Shared domain? | Shared logic moved | App-specific logic left in app | Target package | Action | Priority | Notes |
|---|---|---|---|---|---|---|---|
| api/auth | Yes | auth proxy routing, token extraction, cookie proxy helpers | Next.js route handler files | packages/api-client/proxy, packages/auth | Route handlers are thin wrappers | High | Admin will use login/logout/me/refresh; register remains client/vendor specific. |
| api/cart | Mostly client-specific | proxy backend request helper | storefront cart route files | packages/api-client/proxy, later packages/types/cart | Keep handlers app-specific | Medium | Vendor/admin do not use customer cart. |
| api/orders | Yes | proxy backend request helper | role-specific route path mapping | packages/api-client/proxy, later packages/types/orders | Keep thin wrappers | High | Vendor/admin will need role-specific order APIs. |
| api/products | Yes | public/private proxy helpers | public catalog route files and product review/favorite wrappers | packages/api-client/proxy, packages/api-client/client | Keep thin wrappers | High | Vendor/admin product CRUD will use separate package modules. |
| api/stores | Yes | public/private proxy helpers | public pharmacy-store route files and review/favorite wrappers | packages/api-client/proxy, packages/api-client/client | Keep thin wrappers | High | Vendor profile/admin pharmacies depend on this domain later. |
| api/health | Low | public proxy helper | per-app health route | packages/api-client/proxy | Keep simple | Low | No over-engineering. |

### Deletion cleanup

After applying this stage, remove `apps/client/src/lib/api` because reusable API core/proxy logic now lives in `packages/api-client`. Keep only client-specific service wrappers where they add UI-side behavior, such as cart update events.
