import type {
  PharmacyOption,
  PharmacyCardSummary,
} from '@e-pharmacy/types/pharmacies';

import type {
  PharmaciesResponse,
  PharmacyFilterOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

import type {
  ProductCardSummary,
  ProductFilterOptionsResponse,
  ProductsResponse,
} from '@e-pharmacy/types/products';

import {
  toResourceState,
  type ResolvedDataState,
  type ResourceState,
} from '@/lib/api/resource-state';

import {
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductCatalogActiveFiltersCount,
  sortPharmaciesByName,
  type ProductCatalogFilters,
} from './product-catalog';

import {
  getPharmacyActiveFiltersCount,
  type PharmacyFilters,
} from './pharmacies-catalog';

import type { CatalogResourceState } from './catalog-resource-state';

//===================================================================

export type ProductCatalogPageData = Readonly<{
  products: readonly ProductCardSummary[];
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  resourceState: CatalogResourceState;
  pharmacyOptionsState: ResourceState;
  filtersState: ResourceState;
}>;

//===================================================================

export function createProductCatalogPageData({
  filters,
  productsState,
  pharmaciesState,
  filterOptionsState,
}: Readonly<{
  filters: ProductCatalogFilters;
  productsState: ResolvedDataState<ProductsResponse>;

  pharmaciesState: ResolvedDataState<
    Readonly<{ items: readonly PharmacyOption[] }>
  >;

  filterOptionsState: ResolvedDataState<ProductFilterOptionsResponse>;
}>): ProductCatalogPageData {
  const productsData =
    productsState.status === 'success' ? productsState.data : null;

  return {
    products: [...(productsData?.items ?? [])],

    pharmacies: sortPharmaciesByName(
      pharmaciesState.status === 'success' ? pharmaciesState.data.items : []
    ),

    filterOptions:
      filterOptionsState.status === 'success'
        ? filterOptionsState.data
        : FALLBACK_PRODUCT_FILTER_OPTIONS,

    total: productsData?.total ?? 0,
    totalPages: productsData?.totalPages ?? 0,
    filters,

    resourceState:
      productsState.status === 'unavailable'
        ? { status: 'unavailable' }
        : (productsData?.total ?? 0) === 0
          ? {
              status: 'empty',
              reason:
                getProductCatalogActiveFiltersCount(filters) > 0
                  ? 'no-matches'
                  : 'catalog-empty',
            }
          : { status: 'success' },

    pharmacyOptionsState: toResourceState(pharmaciesState),
    filtersState: toResourceState(filterOptionsState),
  };
}

//===================================================================

export type PharmaciesCatalogPageData = Readonly<{
  pharmacies: readonly PharmacyCardSummary[];
  total: number;
  totalPages: number;
  filters: PharmacyFilters;
  cityOptions: string[];
  resourceState: CatalogResourceState;
  filtersState: ResourceState;
}>;

//===================================================================

export function createPharmaciesCatalogPageData({
  filters,
  pharmaciesState,
  filterState,
}: Readonly<{
  filters: PharmacyFilters;
  pharmaciesState: ResolvedDataState<PharmaciesResponse>;
  filterState: ResolvedDataState<PharmacyFilterOptionsResponse>;
}>): PharmaciesCatalogPageData {
  const pharmaciesData =
    pharmaciesState.status === 'success' ? pharmaciesState.data : null;

  return {
    pharmacies: [...(pharmaciesData?.items ?? [])],
    total: pharmaciesData?.total ?? 0,
    totalPages: pharmaciesData?.totalPages ?? 0,
    filters,

    cityOptions:
      filterState.status === 'success'
        ? filterState.data.cities.map((city) => city.value)
        : [],

    resourceState:
      pharmaciesState.status === 'unavailable'
        ? { status: 'unavailable' }
        : (pharmaciesData?.total ?? 0) === 0
          ? {
              status: 'empty',
              reason:
                getPharmacyActiveFiltersCount(filters) > 0
                  ? 'no-matches'
                  : 'catalog-empty',
            }
          : { status: 'success' },
    filtersState: toResourceState(filterState),
  };
}
