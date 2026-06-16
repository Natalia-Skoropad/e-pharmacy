import { redirect } from 'next/navigation';

import { ProductCatalogPageContent } from '@/components/product-catalog';

import {
  buildProductCatalogApiParams,
  buildProductCatalogCanonicalPath,
  buildProductCatalogPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductCatalogDescription,
  getProductCatalogTitle,
  hasLegacyProductCatalogSegments,
  isProductCatalogNoIndex,
  mergeProductCatalogFilters,
  parseProductCatalogSearchParams,
  parseProductCatalogSegments,
  sortPharmaciesByName,
  type ProductCatalogRouteParams,
  type ProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog';

import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';

import {
  getProductFilters,
  getProducts,
  getPharmacies,
} from '@e-pharmacy/api-client/client';

//===================================================================

type ProductCatalogPageProps = {
  params?: Promise<ProductCatalogRouteParams>;
  searchParams?: Promise<ProductCatalogSearchParams>;
};

//===================================================================

export async function generateMetadata({
  params,
  searchParams,
}: ProductCatalogPageProps) {
  const filters = mergeProductCatalogFilters(
    parseProductCatalogSegments(await params),
    parseProductCatalogSearchParams(await searchParams)
  );

  const categoryLabel = FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
    (option) => option.value === filters.category
  )?.label;

  const seoContext = {
    ...(categoryLabel ? { categoryLabel } : {}),
  };

  return createPageMetadata({
    title: getProductCatalogTitle(filters, seoContext),
    description: getProductCatalogDescription(filters, seoContext),
    path: buildProductCatalogCanonicalPath(filters),
    noIndex: isProductCatalogNoIndex(filters),
  });
}

//===================================================================

async function ProductCatalogSegmentsPage({
  params,
  searchParams,
}: ProductCatalogPageProps) {
  const resolvedParams = await params;

  const filters = mergeProductCatalogFilters(
    parseProductCatalogSegments(resolvedParams),
    parseProductCatalogSearchParams(await searchParams)
  );

  if (hasLegacyProductCatalogSegments(resolvedParams)) {
    redirect(buildProductCatalogPath(filters));
  }

  const [productsData, pharmaciesData, filterOptionsData] = await Promise.all([
    getProducts(
      buildProductCatalogApiParams(filters),
      PUBLIC_API_CACHE_OPTIONS
    ).catch(() => null),

    getPharmacies({ page: 1, perPage: 100 }, PUBLIC_API_CACHE_OPTIONS).catch(
      () => null
    ),

    getProductFilters(PUBLIC_API_CACHE_OPTIONS).catch(
      () => FALLBACK_PRODUCT_FILTER_OPTIONS
    ),
  ]);

  const activePharmacies = sortPharmaciesByName(
    pharmaciesData?.items ?? []
  );

  return (
    <ProductCatalogPageContent
      products={productsData?.items ?? []}
      pharmacies={activePharmacies}
      filterOptions={filterOptionsData}
      total={productsData?.total ?? 0}
      totalPages={productsData?.totalPages ?? 0}
      filters={filters}
      isUnavailable={!productsData}
    />
  );
}

export default ProductCatalogSegmentsPage;
