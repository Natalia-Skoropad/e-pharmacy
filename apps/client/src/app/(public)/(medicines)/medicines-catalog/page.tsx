import { MedicineStorePageContent } from '@/components/medicines-catalog';

import {
  buildMedicinesCatalogApiParams,
  buildMedicinesCatalogCanonicalPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getMedicinesCatalogDescription,
  getMedicinesCatalogTitle,
  isMedicinesCatalogNoIndex,
  parseMedicinesCatalogSearchParams,
  sortStoresByName,
  type MedicinesCatalogSearchParams,
} from '@/lib/catalog/medicines-catalog';

import { PUBLIC_API_CACHE_OPTIONS } from '@/lib/api';
import { createPageMetadata } from '@/lib/seo';

import { getProductFilters, getProducts, getStores } from '@/services';

//===================================================================

type MedicinesCatalogPageProps = {
  searchParams?: Promise<MedicinesCatalogSearchParams>;
};

//===================================================================

export const revalidate = 300;

//===================================================================

export async function generateMetadata({
  searchParams,
}: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSearchParams(await searchParams);

  const storesData = await getStores(
    { page: 1, perPage: 100 },
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  const selectedStore = storesData?.items.find(
    (store) => store.id === filters.storeId
  );

  const categoryLabel = FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
    (option) => option.value === filters.category
  )?.label;

  const seoContext = {
    ...(selectedStore ? { storeName: selectedStore.name } : {}),
    ...(categoryLabel ? { categoryLabel } : {}),
  };

  const productsData = await getProducts(
    buildMedicinesCatalogApiParams(filters),
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return createPageMetadata({
    title: getMedicinesCatalogTitle(filters, seoContext),
    description: getMedicinesCatalogDescription(filters, seoContext),
    path: buildMedicinesCatalogCanonicalPath(filters, storesData?.items ?? []),
    noIndex: isMedicinesCatalogNoIndex(filters) || productsData?.total === 0,
  });
}

//===================================================================

async function MedicinesCatalogPage({
  searchParams,
}: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSearchParams(await searchParams);

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

export default MedicinesCatalogPage;
