import { MedicineStorePageContent } from '@/components/medicine-store';

import {
  MEDICINE_STORE_DESCRIPTION,
  MEDICINE_STORE_TITLE,
} from '@/lib/constants/metadata';
import { createPageMetadata } from '@/lib/seo';

import { getProducts, getStoreDetails } from '@/services';

//===================================================================

type MedicineStorePageProps = {
  searchParams?: Promise<{
    storeId?: string | string[];
  }>;
};

//===================================================================

export const dynamic = 'force-dynamic';

//===================================================================

export const metadata = createPageMetadata({
  title: MEDICINE_STORE_TITLE,
  description: MEDICINE_STORE_DESCRIPTION,
  path: '/medicine-store',
});

//===================================================================

function getSearchParamValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];

  return value;
}

//===================================================================

function isValidObjectId(value?: string): value is string {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value));
}

//===================================================================

async function MedicineStorePage({ searchParams }: MedicineStorePageProps) {
  const resolvedSearchParams = await searchParams;
  const rawStoreId = getSearchParamValue(resolvedSearchParams?.storeId);
  const storeId = isValidObjectId(rawStoreId) ? rawStoreId : undefined;

  const [storeData, productsData] = await Promise.all([
    storeId ? getStoreDetails(storeId).catch(() => null) : null,
    getProducts({
      page: 1,
      perPage: 12,
      ...(storeId ? { storeId } : {}),
    }).catch(() => null),
  ]);

  return (
    <MedicineStorePageContent
      store={storeData?.store ?? null}
      products={productsData?.items ?? []}
      total={productsData?.total ?? 0}
      isFilteredByStore={Boolean(storeId)}
      isUnavailable={!productsData}
    />
  );
}

export default MedicineStorePage;
