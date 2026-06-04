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

import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';
import { getStoreFilters, getStores } from '@e-pharmacy/api-client/client';

//===================================================================

type PharmacyStoresSegmentsPageProps = {
  params?: Promise<PharmacyStoresRouteParams>;
};

//===================================================================


export async function generateMetadata({
  params,
}: PharmacyStoresSegmentsPageProps) {
  const parsedFilters = parsePharmacyStoresSegments(await params);

  return createPageMetadata({
    title: getPharmacyStoresTitle(parsedFilters),
    description: getPharmacyStoresDescription(parsedFilters),
    path: buildPharmacyStoresPath(parsedFilters),
    noIndex: isPharmacyStoresNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmacyStoresSegmentsPage({
  params,
}: PharmacyStoresSegmentsPageProps) {
  const parsedFilters = parsePharmacyStoresSegments(await params);

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

export default PharmacyStoresSegmentsPage;
