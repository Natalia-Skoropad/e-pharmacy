import type {
  PharmacyOption,
  PublicPharmacy,
} from '@e-pharmacy/types/pharmacies';

import type {
  PharmaciesResponse,
  PharmacyFilterOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

import type {
  ProductDetails,
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
  sortPharmaciesByName,
  type ProductCatalogFilters,
} from './product-catalog';

import type { PharmacyFilters } from './pharmacies-catalog';

//===================================================================

export type ProductCatalogPageData = Readonly<{
  products: ProductDetails[];
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  catalogState: ResourceState;
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
    catalogState: toResourceState(productsState),
    pharmacyOptionsState: toResourceState(pharmaciesState),
    filtersState: toResourceState(filterOptionsState),
  };
}

//===================================================================

export type PharmaciesCatalogPageData = Readonly<{
  pharmacies: PublicPharmacy[];
  total: number;
  totalPages: number;
  filters: PharmacyFilters;
  cityOptions: string[];
  catalogState: ResourceState;
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

    catalogState: toResourceState(pharmaciesState),
    filtersState: toResourceState(filterState),
  };
}
