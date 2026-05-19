import { StoresPageContent } from '@/components/pharmacy-stores';

import {
  buildPharmacyStoresApiParams,
  buildPharmacyStoresPath,
  getPharmacyStoresDescription,
  getPharmacyStoresTitle,
  getUniqueStoreCities,
  isPharmacyStoresNoIndex,
  normalizePharmacyStoresFiltersCity,
  parsePharmacyStoresSegments,
  type PharmacyStoresRouteParams,
} from '@/lib/catalog/pharmacy-stores-catalog';
import { createPageMetadata } from '@/lib/seo';

import { getStores } from '@/services';

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
  const allStoresData = await getStores({ page: 1, perPage: 100 }).catch(
    () => null
  );
  const filters = normalizePharmacyStoresFiltersCity(
    parsedFilters,
    getUniqueStoreCities(allStoresData?.items ?? [])
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

  const allStoresData = await getStores({
    page: 1,
    perPage: 100,
    sort: 'name-asc',
  }).catch(() => null);
  const cityOptions = getUniqueStoreCities(allStoresData?.items ?? []);
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
