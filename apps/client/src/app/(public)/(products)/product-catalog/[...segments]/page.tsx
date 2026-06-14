import { redirect } from 'next/navigation';

import { ProductStorePageContent } from '@/components/products-catalog';

import {
  buildProductsCatalogApiParams,
  buildProductsCatalogCanonicalPath,
  buildProductsCatalogPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductsCatalogDescription,
  getProductsCatalogTitle,
  hasLegacyProductsCatalogSegments,
  isProductsCatalogNoIndex,
  mergeProductsCatalogFilters,
  parseProductsCatalogSearchParams,
  parseProductsCatalogSegments,
  sortStoresByName,
  type ProductsCatalogRouteParams,
  type ProductsCatalogSearchParams,
} from '@/lib/catalog/products-catalog';

import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';

import {
  getProductFilters,
  getProducts,
  getStores,
} from '@e-pharmacy/api-client/client';

//===================================================================

type ProductsCatalogPageProps = {
  params?: Promise<ProductsCatalogRouteParams>;
  searchParams?: Promise<ProductsCatalogSearchParams>;
};

//===================================================================

export async function generateMetadata({
  params,
  searchParams,
}: ProductsCatalogPageProps) {
  const filters = mergeProductsCatalogFilters(
    parseProductsCatalogSegments(await params),
    parseProductsCatalogSearchParams(await searchParams)
  );

  const categoryLabel = FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
    (option) => option.value === filters.category
  )?.label;

  const seoContext = {
    ...(categoryLabel ? { categoryLabel } : {}),
  };

  return createPageMetadata({
    title: getProductsCatalogTitle(filters, seoContext),
    description: getProductsCatalogDescription(filters, seoContext),
    path: buildProductsCatalogCanonicalPath(filters),
    noIndex: isProductsCatalogNoIndex(filters),
  });
}

//===================================================================

async function ProductsCatalogSegmentsPage({
  params,
  searchParams,
}: ProductsCatalogPageProps) {
  const resolvedParams = await params;

  const filters = mergeProductsCatalogFilters(
    parseProductsCatalogSegments(resolvedParams),
    parseProductsCatalogSearchParams(await searchParams)
  );

  if (hasLegacyProductsCatalogSegments(resolvedParams)) {
    redirect(buildProductsCatalogPath(filters));
  }

  const [productsData, storesData, filterOptionsData] = await Promise.all([
    getProducts(
      buildProductsCatalogApiParams(filters),
      PUBLIC_API_CACHE_OPTIONS
    ).catch(() => null),

    getStores({ page: 1, perPage: 100 }, PUBLIC_API_CACHE_OPTIONS).catch(
      () => null
    ),

    getProductFilters(PUBLIC_API_CACHE_OPTIONS).catch(
      () => FALLBACK_PRODUCT_FILTER_OPTIONS
    ),
  ]);

  const activeStores = sortStoresByName(
    storesData?.items.filter((store) => store.isActive) ?? []
  );

  return (
    <ProductStorePageContent
      products={productsData?.items ?? []}
      stores={activeStores}
      filterOptions={filterOptionsData}
      total={productsData?.total ?? 0}
      totalPages={productsData?.totalPages ?? 0}
      filters={filters}
      isUnavailable={!productsData}
    />
  );
}

export default ProductsCatalogSegmentsPage;
