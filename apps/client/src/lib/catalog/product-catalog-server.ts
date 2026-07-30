import 'server-only';

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
  createProductCatalogPageData,
  type ProductCatalogPageData,
} from './catalog-page-data';

import {
  buildProductCatalogApiParams,
  type ProductCatalogFilters,
} from './product-catalog';

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
      resolveServerDataState(getProductFilters({}, PUBLIC_API_CACHE_OPTIONS)),
    ]);

  return createProductCatalogPageData({
    filters,
    productsState,
    pharmaciesState,
    filterOptionsState,
  });
}
