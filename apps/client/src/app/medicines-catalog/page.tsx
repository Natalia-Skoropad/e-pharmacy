import { MedicineStorePageContent } from '@/components/medicine-store';

import { ROUTES } from '@/lib/constants/routes';
import {
  buildMedicinesCatalogApiParams,
  getMedicinesCatalogDescription,
  getMedicinesCatalogTitle,
  parseMedicinesCatalogSearchParams,
  type MedicinesCatalogSearchParams,
} from '@/lib/catalog/medicines-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getProducts, getStores } from '@/services';

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
  const noIndex =
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.article) ||
    Boolean(filters.storeId);

  return createPageMetadata({
    title: getMedicinesCatalogTitle(filters),
    description: getMedicinesCatalogDescription(filters),
    path: ROUTES.MEDICINES_CATALOG,
    noIndex,
  });
}

//===================================================================

async function MedicinesCatalogPage({
  searchParams,
}: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSearchParams(await searchParams);

  const [productsData, storesData] = await Promise.all([
    getProducts(buildMedicinesCatalogApiParams(filters)).catch(() => null),
    getStores({ page: 1, perPage: 100 }).catch(() => null),
  ]);

  const activeStores =
    storesData?.items.filter((store) => store.isActive) ?? [];

  return (
    <MedicineStorePageContent
      products={productsData?.items ?? []}
      stores={activeStores}
      total={productsData?.total ?? 0}
      totalPages={productsData?.totalPages ?? 0}
      filters={filters}
      isUnavailable={!productsData}
    />
  );
}

export default MedicinesCatalogPage;
