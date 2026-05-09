import { MedicineStorePageContent } from '@/components/medicine-store';

import { ROUTES } from '@/lib/constants/routes';
import {
  buildMedicinesCatalogApiParams,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getMedicinesCatalogDescription,
  getMedicinesCatalogTitle,
  isMedicinesCatalogNoIndex,
  parseMedicinesCatalogSearchParams,
  type MedicinesCatalogSearchParams,
} from '@/lib/catalog/medicines-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getProductFilters, getProducts, getStores } from '@/services';

//===================================================================

type MedicinesCatalogPageProps = {
  searchParams?: Promise<MedicinesCatalogSearchParams>;
};

//===================================================================

export const dynamic = 'force-dynamic';

//===================================================================

export async function generateMetadata({
  searchParams,
}: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSearchParams(await searchParams);

  const storesData = filters.storeId
    ? await getStores({ page: 1, perPage: 100 }).catch(() => null)
    : null;

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

  return createPageMetadata({
    title: getMedicinesCatalogTitle(filters, seoContext),
    description: getMedicinesCatalogDescription(filters, seoContext),
    path: ROUTES.MEDICINES_CATALOG,
    noIndex: isMedicinesCatalogNoIndex(filters),
  });
}

//===================================================================

async function MedicinesCatalogPage({
  searchParams,
}: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSearchParams(await searchParams);

  const [productsData, storesData, filterOptionsData] = await Promise.all([
    getProducts(buildMedicinesCatalogApiParams(filters)).catch(() => null),
    getStores({ page: 1, perPage: 100 }).catch(() => null),
    getProductFilters().catch(() => FALLBACK_PRODUCT_FILTER_OPTIONS),
  ]);

  const activeStores =
    storesData?.items.filter((store) => store.isActive) ?? [];

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
