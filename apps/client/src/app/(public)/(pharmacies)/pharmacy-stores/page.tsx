import { StoresPageContent } from '@/components/pharmacy-stores';

import {
  buildPharmacyStoresApiParams,
  buildPharmacyStoresPath,
  getPharmacyStoresDescription,
  getPharmacyStoresTitle,
  isPharmacyStoresNoIndex,
  normalizePharmacyStoresFiltersCity,
  parsePharmacyStoresSearchParams,
  type PharmacyStoresSearchParams,
} from '@/lib/catalog/pharmacy-stores-catalog';

import { PUBLIC_API_CACHE_OPTIONS } from '@/lib/api';
import { createPageMetadata } from '@/lib/seo';
import { getStoreFilters, getStores } from '@/services';

//===================================================================

type PharmacyStoresPageProps = {
  searchParams?: Promise<PharmacyStoresSearchParams>;
};

//===================================================================

export const revalidate = 300;

//===================================================================

export async function generateMetadata({
  searchParams,
}: PharmacyStoresPageProps) {
  const parsedFilters = parsePharmacyStoresSearchParams(await searchParams);

  return createPageMetadata({
    title: getPharmacyStoresTitle(parsedFilters),
    description: getPharmacyStoresDescription(parsedFilters),
    path: buildPharmacyStoresPath(parsedFilters),
    noIndex: isPharmacyStoresNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmacyStoresPage({ searchParams }: PharmacyStoresPageProps) {
  const parsedFilters = parsePharmacyStoresSearchParams(await searchParams);

  const storeFiltersData = await getStoreFilters(
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  const cityOptions = storeFiltersData?.cities.map((city) => city.value) ?? [];

  const filters = normalizePharmacyStoresFiltersCity(
    parsedFilters,
    cityOptions
  );

  const storesData = await getStores(
    buildPharmacyStoresApiParams(filters),
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

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
