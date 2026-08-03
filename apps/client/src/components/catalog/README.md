# Client catalog architecture

This directory owns application-local presentation foundations shared by the
public product and pharmacy catalogs. It does not own product or pharmacy
domain rules and is intentionally not exported from `packages/ui`.

## Component ownership

| Component | Input | State owner | Consumers | Role |
| --- | --- | --- | --- | --- |
| `CatalogEntityCard` | presentation slots | none | product and pharmacy cards | card surface, media, title, summary and footer |
| `CatalogGrid` | card elements | page composition | both catalog lists | semantic `<ul>/<li>` grid |
| `CatalogPageShell` | page slots | server page | both catalog pages | breadcrumbs, heading, filters, results, pagination and SEO composition |
| `CatalogResourceState` | resolved resource state | server data mapper | both catalog pages | exclusive success, empty or unavailable rendering |
| `CatalogFiltersShell` | filter controls and status | domain filter form | both filter forms | named responsive region and pending-navigation presentation |
| `ProductCard` | `ProductCardSummary` | `FavoritesProvider` | catalog, home, profile and cart discovery | product-specific card composition |
| `PharmacyCard` | `PharmacyCardSummary` | `FavoritesProvider` | catalog, home and profile | pharmacy-specific card composition |
| Product details | `ProductDetails` | server wrapper, providers and local panel hooks | product detail route | full offers, cart, reviews and product panels |
| Pharmacy details | `PublicPharmacy` | server wrapper and bank-details hook | pharmacy detail route | contacts, payment details, about and reviews |

## DTO policy

- Public catalog, home previews, favorites and continue-shopping use compact
  `ProductCardSummary` or `PharmacyCardSummary` items.
- Product offers are present only in explicit full product-detail or
  pharmacy-management responses.
- Bank details never appear in pharmacy card responses.
- Summary payload budgets are enforced by
  `check:client-catalog-performance`.

## Lifecycle policy

- Catalog URL filters are server-owned committed state.
- Search inputs keep a local draft through `useCatalogSearchDraft`.
- Debounced work is cancellable on reset, route changes and unmount.
- `useCatalogNavigation` owns transition and `aria-busy` state.
- Cards never fetch favorite collections; `FavoritesProvider` is the single
  identity-scoped owner.
- `CartProvider` owns cart bootstrap and serialized mutations.
- Product detail pages do not refetch the full product after SSR.
- Pharmacy bank details use an abortable, retryable resource state.

## Public API policy

The stable feature barrels expose only:

```text
product-catalog: ProductCard, ProductCatalogPageContent
pharmacies:      PharmacyCard, PharmaciesPageContent
```

Lists, filters, detail client components, panels and hooks are internal leaf
imports. Nested one-line barrels and local shared-package re-export wrappers
are forbidden.

## Tabs and routing decisions

Detail tabs currently use component state rather than URL hashes. They still
provide complete tab/tabpanel ARIA relationships. URL-backed tabs should be
introduced only with a concrete deep-linking requirement.

The local pharmacy selector remains appropriate while the option count is
below `CATALOG_REMOTE_PHARMACY_SEARCH_THRESHOLD`. Above that threshold the
product requirement should move to remote, paginated option search.

## Verification

The catalog-specific deployment checks are:

```bash
pnpm check:client-catalog-components
pnpm check:client-catalog-contracts
pnpm check:client-catalog-performance
pnpm check:client-catalog-a11y
pnpm check:client-catalog-styles
pnpm check:client-detail-components
```

They are part of both `check:client` and `check:before-deploy`.
