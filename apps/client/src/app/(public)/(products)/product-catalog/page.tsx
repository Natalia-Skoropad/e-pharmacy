import { ProductCatalogPageContent } from '@/components/product-catalog';

import {
  buildProductCatalogApiParams,
  buildProductCatalogCanonicalPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductCatalogDescription,
  getProductCatalogTitle,
  isProductCatalogNoIndex,
  parseProductCatalogSearchParams,
  sortPharmaciesByName,
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
  searchParams?: Promise<ProductCatalogSearchParams>;
};

//===================================================================

export async function generateMetadata({
  searchParams,
}: ProductCatalogPageProps) {
  const filters = parseProductCatalogSearchParams(await searchParams);

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

async function ProductCatalogPage({ searchParams }: ProductCatalogPageProps) {
  const filters = parseProductCatalogSearchParams(await searchParams);

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

export default ProductCatalogPage;
