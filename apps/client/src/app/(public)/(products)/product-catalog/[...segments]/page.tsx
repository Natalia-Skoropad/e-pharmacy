import { permanentRedirect } from 'next/navigation';
import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

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
import { getPharmacyOptions, PUBLIC_API_CACHE_OPTIONS } from '@/lib/api/server';
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

  let pharmacies: readonly PharmacyOption[] = [];

  if (filters.pharmacyId) {
    try {
      pharmacies = (await getPharmacyOptions(PUBLIC_API_CACHE_OPTIONS)).items;
    } catch {
      pharmacies = [];
    }
  }

  const selectedPharmacy = filters.pharmacyId
    ? pharmacies.find((pharmacy) => pharmacy.id === filters.pharmacyId)
    : undefined;

  const seoContext = {
    ...(categoryLabel ? { categoryLabel } : {}),
    ...(selectedPharmacy ? { pharmacyName: selectedPharmacy.name } : {}),
  };

  return createPageMetadata({
    title: getProductCatalogTitle(filters, seoContext),
    description: getProductCatalogDescription(filters, seoContext),
    path: buildProductCatalogCanonicalPath(filters, pharmacies),
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

  const pageData = await loadProductCatalogPageData(filters);
  const canonicalPath = buildProductCatalogPath(filters, pageData.pharmacies);

  const currentPath = resolvedParams?.segments?.length
    ? `/product-catalog/${resolvedParams.segments.join('/')}`
    : '/product-catalog';

  if (!routeResult.isCanonical || currentPath !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  return <ProductCatalogPageContent {...pageData} />;
}

export default ProductCatalogSegmentsPage;
