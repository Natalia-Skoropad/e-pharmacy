import { MedicineStorePageContent } from '@/components/medicine-store';

import {
  MEDICINES_CATALOG_DESCRIPTION,
  MEDICINES_CATALOG_TITLE,
} from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import {
  buildMedicinesCatalogApiParams,
  hasActiveMedicinesCatalogFilters,
  parseMedicinesCatalogSearchParams,
  type MedicinesCatalogSearchParams,
} from '@/lib/catalog/medicines-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getProducts } from '@/services';

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
  const hasActiveFilters = hasActiveMedicinesCatalogFilters(filters);

  return createPageMetadata({
    title: MEDICINES_CATALOG_TITLE,
    description: MEDICINES_CATALOG_DESCRIPTION,
    path: ROUTES.MEDICINES_CATALOG,
    noIndex: hasActiveFilters,
  });
}

//===================================================================

async function MedicinesCatalogPage({ searchParams }: MedicinesCatalogPageProps) {
  const filters = parseMedicinesCatalogSearchParams(await searchParams);
  const productsData = await getProducts(
    buildMedicinesCatalogApiParams(filters)
  ).catch(() => null);

  return (
    <MedicineStorePageContent
      products={productsData?.items ?? []}
      total={productsData?.total ?? 0}
      totalPages={productsData?.totalPages ?? 0}
      filters={filters}
      isUnavailable={!productsData}
    />
  );
}

export default MedicinesCatalogPage;
