import 'server-only';

import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import type {
  ProductDetails,
  ProductFilterOptionsResponse,
} from '@e-pharmacy/types/products';

import {
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import {
  getPharmacyOptions,
  getProductFilters,
  getProducts,
} from '@/lib/api/server';

import {
  buildProductCatalogApiParams,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  sortPharmaciesByName,
  type ProductCatalogFilters,
} from './product-catalog';

//===================================================================

type ProductCatalogPageData = {
  products: ProductDetails[];
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  isUnavailable: boolean;
};

//===================================================================

export async function loadProductCatalogPageData(
  filters: ProductCatalogFilters
): Promise<ProductCatalogPageData> {
  const [productsState, pharmaciesState, filterOptionsState] =
    await Promise.all([
      resolveServerDataState(
        getProducts(
          buildProductCatalogApiParams(filters),
          PUBLIC_API_CACHE_OPTIONS
        )
      ),
      resolveServerDataState(getPharmacyOptions(PUBLIC_API_CACHE_OPTIONS)),
      resolveServerDataState(getProductFilters(PUBLIC_API_CACHE_OPTIONS)),
    ]);

  const productsData =
    productsState.status === 'success' ? productsState.data : null;

  const filterOptions =
    filterOptionsState.status === 'success'
      ? filterOptionsState.data
      : FALLBACK_PRODUCT_FILTER_OPTIONS;

  const pharmacies = sortPharmaciesByName(
    pharmaciesState.status === 'success' ? pharmaciesState.data.items : []
  );

  return {
    products: [...(productsData?.items ?? [])],
    pharmacies,
    filterOptions,
    total: productsData?.total ?? 0,
    totalPages: productsData?.totalPages ?? 0,
    filters,
    isUnavailable: productsState.status === 'unavailable',
  };
}
