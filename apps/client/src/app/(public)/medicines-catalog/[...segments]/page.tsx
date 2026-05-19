import { MedicineStorePageContent } from '@/components/medicines-catalog';

import {
  buildMedicinesCatalogApiParams,
  buildMedicinesCatalogPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  MEDICINES_CATALOG_CATEGORY_OPTIONS_LIMIT,
  getProductFilterOptionsForProducts,
  getMedicinesCatalogDescription,
  getMedicinesCatalogTitle,
  isMedicinesCatalogNoIndex,
  parseMedicinesCatalogSegments,
  sortStoresByName,
  type MedicinesCatalogRouteParams,
} from '@/lib/catalog/medicines-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getProductFilters, getProducts, getStores } from '@/services';

//===================================================================

type MedicinesCatalogPageProps = {
  params?: Promise<MedicinesCatalogRouteParams>;
};

//===================================================================

export const revalidate = 300;

//===================================================================

export async function generateMetadata({ params }: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSegments(await params);

  const storesData = await getStores({ page: 1, perPage: 100 }).catch(
    () => null
  );
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
    buildMedicinesCatalogApiParams(filters)
  ).catch(() => null);

  return createPageMetadata({
    title: getMedicinesCatalogTitle(filters, seoContext),
    description: getMedicinesCatalogDescription(filters, seoContext),
    path: buildMedicinesCatalogPath(filters, storesData?.items ?? []),
    noIndex: isMedicinesCatalogNoIndex(filters) || productsData?.total === 0,
  });
}

//===================================================================

async function MedicinesCatalogSegmentsPage({
  params,
}: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSegments(await params);

  const [productsData, storesData, filterOptionsData, allProductsData] =
    await Promise.all([
      getProducts(buildMedicinesCatalogApiParams(filters)).catch(() => null),
      getStores({ page: 1, perPage: 100 }).catch(() => null),
      getProductFilters().catch(() => FALLBACK_PRODUCT_FILTER_OPTIONS),
      getProducts({
        page: 1,
        perPage: MEDICINES_CATALOG_CATEGORY_OPTIONS_LIMIT,
      }).catch(() => null),
    ]);

  const activeStores = sortStoresByName(
    storesData?.items.filter((store) => store.isActive) ?? []
  );

  return (
    <MedicineStorePageContent
      products={productsData?.items ?? []}
      stores={activeStores}
      filterOptions={getProductFilterOptionsForProducts(
        filterOptionsData,
        allProductsData?.items ?? []
      )}
      total={productsData?.total ?? 0}
      totalPages={productsData?.totalPages ?? 0}
      filters={filters}
      isUnavailable={!productsData}
    />
  );
}

export default MedicinesCatalogSegmentsPage;
