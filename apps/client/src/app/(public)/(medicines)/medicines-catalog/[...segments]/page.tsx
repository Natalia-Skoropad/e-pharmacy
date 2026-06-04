import { redirect } from 'next/navigation';

import { MedicineStorePageContent } from '@/components/medicines-catalog';

import {
  buildMedicinesCatalogApiParams,
  buildMedicinesCatalogCanonicalPath,
  buildMedicinesCatalogPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getMedicinesCatalogDescription,
  getMedicinesCatalogTitle,
  hasLegacyMedicinesCatalogSegments,
  isMedicinesCatalogNoIndex,
  mergeMedicinesCatalogFilters,
  parseMedicinesCatalogSearchParams,
  parseMedicinesCatalogSegments,
  sortStoresByName,
  type MedicinesCatalogRouteParams,
  type MedicinesCatalogSearchParams,
} from '@/lib/catalog/medicines-catalog';

import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';

import { getProductFilters, getProducts, getStores } from '@e-pharmacy/api-client/client';

//===================================================================

type MedicinesCatalogPageProps = {
  params?: Promise<MedicinesCatalogRouteParams>;
  searchParams?: Promise<MedicinesCatalogSearchParams>;
};

//===================================================================


export async function generateMetadata({
  params,
  searchParams,
}: MedicinesCatalogPageProps) {
  const filters = mergeMedicinesCatalogFilters(
    parseMedicinesCatalogSegments(await params),
    parseMedicinesCatalogSearchParams(await searchParams)
  );

  const categoryLabel = FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
    (option) => option.value === filters.category
  )?.label;

  const seoContext = {
    ...(categoryLabel ? { categoryLabel } : {}),
  };

  return createPageMetadata({
    title: getMedicinesCatalogTitle(filters, seoContext),
    description: getMedicinesCatalogDescription(filters, seoContext),
    path: buildMedicinesCatalogCanonicalPath(filters),
    noIndex: isMedicinesCatalogNoIndex(filters),
  });
}

//===================================================================

async function MedicinesCatalogSegmentsPage({
  params,
  searchParams,
}: MedicinesCatalogPageProps) {
  const resolvedParams = await params;

  const filters = mergeMedicinesCatalogFilters(
    parseMedicinesCatalogSegments(resolvedParams),
    parseMedicinesCatalogSearchParams(await searchParams)
  );

  if (hasLegacyMedicinesCatalogSegments(resolvedParams)) {
    redirect(buildMedicinesCatalogPath(filters));
  }

  const [productsData, storesData, filterOptionsData] = await Promise.all([
    getProducts(
      buildMedicinesCatalogApiParams(filters),
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
    <MedicineStorePageContent
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

export default MedicinesCatalogSegmentsPage;
