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
  const [productsState, pharmaciesState, filterOptionsState] =
    await Promise.all([
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
    ]);

  const pageData = createProductCatalogPageData({
    filters,
    productsState,
    pharmaciesState,
    filterOptionsState,
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
