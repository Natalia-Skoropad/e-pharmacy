import { permanentRedirect } from 'next/navigation';

import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import {
  buildProductCatalogCanonicalPath,
  buildProductCatalogPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductCatalogDescription,
  getProductCatalogTitle,
  isProductCatalogNoIndex,
  parseProductCatalogSearchParams,
  type ProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog';

import { loadProductCatalogPageData } from '@/lib/catalog/product-catalog-server';
import { hasCatalogSearchParams } from '@/lib/catalog/catalog-param-utils';

import {
  getPharmacyOptions,
  PUBLIC_DICTIONARY_CACHE_OPTIONS,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo/server';

import { ProductCatalogPageContent } from '@/components/product-catalog';

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

  let pharmacies: readonly PharmacyOption[] = [];
  if (filters.pharmacyId) {
    try {
      pharmacies = (await getPharmacyOptions(PUBLIC_DICTIONARY_CACHE_OPTIONS))
        .items;
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

async function ProductCatalogPage({ searchParams }: ProductCatalogPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseProductCatalogSearchParams(resolvedSearchParams);
  const pageData = await loadProductCatalogPageData(filters);

  if (hasCatalogSearchParams(resolvedSearchParams)) {
    permanentRedirect(buildProductCatalogPath(filters, pageData.pharmacies));
  }

  return <ProductCatalogPageContent {...pageData} />;
}

export default ProductCatalogPage;
