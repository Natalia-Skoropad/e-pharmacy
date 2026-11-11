import { permanentRedirect } from 'next/navigation';

import {
  buildProductCatalogPath,
  mergeProductCatalogFilters,
  parseProductCatalogSearchParams,
  parseProductCatalogSegments,
  type ProductCatalogRouteParams,
  type ProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog';

import { loadProductCatalogPageData } from '@/lib/catalog/product-catalog-server';
import { hasCatalogSearchParams } from '@/lib/catalog/catalog-param-utils';
import { getProductCatalogMetadata } from '@/lib/catalog/product-catalog-metadata';

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

  return getProductCatalogMetadata(filters);
}

//===================================================================

async function ProductCatalogSegmentsPage({
  params,
  searchParams,
}: ProductCatalogPageProps) {
  const resolvedParams = await params;
  const routeResult = parseProductCatalogSegments(resolvedParams);

  const resolvedSearchParams = await searchParams;

  const filters = mergeProductCatalogFilters(
    routeResult.filters,
    parseProductCatalogSearchParams(resolvedSearchParams)
  );

  const pageData = await loadProductCatalogPageData(filters);
  const canonicalPath = buildProductCatalogPath(filters, pageData.pharmacies);

  const currentPath = resolvedParams?.segments?.length
    ? `/product-catalog/${resolvedParams.segments.join('/')}`
    : '/product-catalog';

  if (
    !routeResult.isCanonical ||
    hasCatalogSearchParams(resolvedSearchParams) ||
    currentPath !== canonicalPath
  ) {
    permanentRedirect(canonicalPath);
  }

  return <ProductCatalogPageContent {...pageData} />;
}

export default ProductCatalogSegmentsPage;
