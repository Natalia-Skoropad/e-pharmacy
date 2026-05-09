import { StoresPageContent } from '@/components/pharmacy-stores';

import {
  buildPharmacyStoresApiParams,
  getPharmacyStoresDescription,
  getPharmacyStoresTitle,
  getUniqueStoreCities,
  isPharmacyStoresNoIndex,
  parsePharmacyStoresSearchParams,
  type PharmacyStoresSearchParams,
} from '@/lib/catalog/pharmacy-stores-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getStores } from '@/services';

//===================================================================

type PharmacyStoresPageProps = {
  searchParams?: Promise<PharmacyStoresSearchParams>;
};

//===================================================================

export const dynamic = 'force-dynamic';

//===================================================================

export async function generateMetadata({
  searchParams,
}: PharmacyStoresPageProps) {
  const filters = parsePharmacyStoresSearchParams(await searchParams);

  return createPageMetadata({
    title: getPharmacyStoresTitle(filters),
    description: getPharmacyStoresDescription(filters),
    path: '/pharmacy-stores',
    noIndex: isPharmacyStoresNoIndex(filters),
  });
}

//===================================================================

async function PharmacyStoresPage({ searchParams }: PharmacyStoresPageProps) {
  const filters = parsePharmacyStoresSearchParams(await searchParams);

  const [storesData, allStoresData] = await Promise.all([
    getStores(buildPharmacyStoresApiParams(filters)).catch(() => null),
    getStores({ page: 1, perPage: 100, sort: 'name-asc' }).catch(() => null),
  ]);

  const cityOptions = getUniqueStoreCities(allStoresData?.items ?? []);

  return (
    <StoresPageContent
      stores={storesData?.items ?? []}
      total={storesData?.total ?? 0}
      totalPages={storesData?.totalPages ?? 0}
      filters={filters}
      cityOptions={cityOptions}
      isUnavailable={!storesData}
    />
  );
}

export default PharmacyStoresPage;
