import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  PUBLIC_COMMERCE_CACHE_OPTIONS,
  PUBLIC_DICTIONARY_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import {
  getPharmacySearchOptions,
  getProductFilters,
  getProductDetails,
  getProducts,
} from '@/lib/api/server';

import { getCatalogRedirectPage } from './catalog-resource-state';

import {
  createProductCatalogPageData,
  type ProductCatalogPageData,
} from './catalog-page-data';

import {
  buildProductCatalogApiParams,
  buildProductCatalogPath,
  type ProductCatalogFilters,
} from './product-catalog';

//===================================================================

export async function loadProductCatalogPageData(
  filters: ProductCatalogFilters
): Promise<ProductCatalogPageData> {
  const [
    productsState,
    pharmaciesState,
    filterOptionsState,
    selectedProductState,
    scopedCategoryState,
  ] = await Promise.all([
    resolveServerDataState(
      getProducts(
        buildProductCatalogApiParams(filters),
        PUBLIC_COMMERCE_CACHE_OPTIONS
      )
    ),

    filters.pharmacyId
      ? resolveServerDataState(
          getPharmacySearchOptions(
            {
              kind: 'pharmacy',
              selectedId: filters.pharmacyId,
              page: 1,
              perPage: 1,
            },

            PUBLIC_DICTIONARY_CACHE_OPTIONS
          ).then((response) => ({
            items: response.kind === 'pharmacy' ? response.items : [],
          }))
        )
      : Promise.resolve({ status: 'success' as const, data: { items: [] } }),

    resolveServerDataState(
      getProductFilters({}, PUBLIC_DICTIONARY_CACHE_OPTIONS)
    ),

    filters.productId
      ? resolveServerDataState(
          getProductDetails(filters.productId, PUBLIC_COMMERCE_CACHE_OPTIONS)
        )
      : Promise.resolve({ status: 'success' as const, data: null }),

    filters.productId || filters.pharmacyId
      ? resolveServerDataState(
          getProductFilters(
            { productId: filters.productId, pharmacyId: filters.pharmacyId },
            PUBLIC_DICTIONARY_CACHE_OPTIONS
          )
        )
      : Promise.resolve(null),
  ]);

  const pageData = createProductCatalogPageData({
    filters,

    ...(selectedProductState.status === 'success' && selectedProductState.data
      ? {
          selectedProductName: selectedProductState.data.product.name,
          selectedProductImageUrl: selectedProductState.data.product.imageUrl,
        }
      : {}),

    productsState,
    pharmaciesState,
    filterOptionsState,
    scopedCategoryState,
  });

  if (pageData.resourceState.status === 'unavailable') {
    noStore();
  }

  const redirectPage = getCatalogRedirectPage(
    filters.page,
    pageData.totalPages,
    pageData.resourceState
  );

  if (redirectPage !== null) {
    redirect(
      buildProductCatalogPath(
        { ...filters, page: redirectPage },
        pageData.pharmacies
      )
    );
  }

  return pageData;
}
