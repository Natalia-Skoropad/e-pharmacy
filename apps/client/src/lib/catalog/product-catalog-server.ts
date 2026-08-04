import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import {
  getPharmacyOptions,
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
          PUBLIC_API_CACHE_OPTIONS
        )
      ),

      resolveServerDataState(getPharmacyOptions(PUBLIC_API_CACHE_OPTIONS)),
      resolveServerDataState(getProductFilters({}, PUBLIC_API_CACHE_OPTIONS)),
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
