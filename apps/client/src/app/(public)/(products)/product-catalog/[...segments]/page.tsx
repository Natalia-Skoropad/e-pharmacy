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

import {
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo';

import {
  getProductFilters,
  getProducts,
  getPharmacyOptions,
} from '@/lib/api/server';

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

  const filterOptionsData =
    filterOptionsState.status === 'success'
      ? filterOptionsState.data
      : FALLBACK_PRODUCT_FILTER_OPTIONS;

  const activePharmacies = sortPharmaciesByName(
    pharmaciesState.status === 'success' ? pharmaciesState.data.items : []
  );

  return (
    <ProductCatalogPageContent
      products={productsData?.items ?? []}
      pharmacies={activePharmacies}
      filterOptions={filterOptionsData}
      total={productsData?.total ?? 0}
      totalPages={productsData?.totalPages ?? 0}
      filters={filters}
      isUnavailable={productsState.status === 'unavailable'}
    />
  );
}

export default ProductCatalogSegmentsPage;
