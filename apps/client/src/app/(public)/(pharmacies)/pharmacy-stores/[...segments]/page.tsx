import { StoresPageContent } from '@/components/pharmacy-stores';

import {
  buildPharmacyStoresApiParams,
  buildPharmacyStoresPath,
  getPharmacyStoresDescription,
  getPharmacyStoresTitle,
  isPharmacyStoresNoIndex,
  normalizePharmacyStoresFiltersCity,
  parsePharmacyStoresSegments,
  type PharmacyStoresRouteParams,
} from '@/lib/catalog/pharmacy-stores-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getStoreFilters, getStores } from '@/services';

//===================================================================

type PharmacyStoresSegmentsPageProps = {
  params?: Promise<PharmacyStoresRouteParams>;
};

//===================================================================

export const revalidate = 300;

//===================================================================

export async function generateMetadata({
  params,
}: PharmacyStoresSegmentsPageProps) {
  const parsedFilters = parsePharmacyStoresSegments(await params);
  const storeFiltersData = await getStoreFilters().catch(() => null);
  const filters = normalizePharmacyStoresFiltersCity(
    parsedFilters,
    storeFiltersData?.cities.map((city) => city.value) ?? []
  );
  const storesData = await getStores(
    buildPharmacyStoresApiParams(filters)
  ).catch(() => null);

  return createPageMetadata({
    title: getPharmacyStoresTitle(filters),
    description: getPharmacyStoresDescription(filters),
    path: buildPharmacyStoresPath(filters),
    noIndex: isPharmacyStoresNoIndex(filters) || storesData?.total === 0,
  });
}

//===================================================================

async function PharmacyStoresSegmentsPage({
  params,
}: PharmacyStoresSegmentsPageProps) {
  const parsedFilters = parsePharmacyStoresSegments(await params);

  const storeFiltersData = await getStoreFilters().catch(() => null);
  const cityOptions = storeFiltersData?.cities.map((city) => city.value) ?? [];
  const filters = normalizePharmacyStoresFiltersCity(
    parsedFilters,
    cityOptions
  );

  const storesData = await getStores(
    buildPharmacyStoresApiParams(filters)
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

export default PharmacyStoresSegmentsPage;
