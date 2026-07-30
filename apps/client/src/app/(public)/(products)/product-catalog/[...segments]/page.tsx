import { redirect } from 'next/navigation';

import {
  buildProductCatalogCanonicalPath,
  buildProductCatalogPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductCatalogDescription,
  getProductCatalogTitle,
  isProductCatalogNoIndex,
  mergeProductCatalogFilters,
  parseProductCatalogSearchParams,
  parseProductCatalogSegments,
  type ProductCatalogRouteParams,
  type ProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog';

import { loadProductCatalogPageData } from '@/lib/catalog/product-catalog-server';
import { createPageMetadata } from '@/lib/seo/server';

import { ProductCatalogPageContent } from '@/components/product-catalog';

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
    parseProductCatalogSegments(await params).filters,
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

  const routeResult = parseProductCatalogSegments(resolvedParams);
  const filters = mergeProductCatalogFilters(
    routeResult.filters,
    parseProductCatalogSearchParams(await searchParams)
  );

  if (!routeResult.isCanonical) {
    redirect(buildProductCatalogPath(filters));
  }

  const pageData = await loadProductCatalogPageData(filters);

  return <ProductCatalogPageContent {...pageData} />;
}

export default ProductCatalogSegmentsPage;
