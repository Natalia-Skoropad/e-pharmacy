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

import { PUBLIC_API_CACHE_OPTIONS } from '@/lib/api/server';
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

  const [productsData, pharmaciesData, filterOptionsData] = await Promise.all([
    getProducts(
      buildProductCatalogApiParams(filters),
      PUBLIC_API_CACHE_OPTIONS
    ).catch(() => null),

    getPharmacyOptions(PUBLIC_API_CACHE_OPTIONS).catch(() => null),

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

export default ProductCatalogPage;
