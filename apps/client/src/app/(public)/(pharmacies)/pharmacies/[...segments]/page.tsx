import { PharmaciesPageContent } from '@/components/pharmacies';

import {
  buildPharmacyApiParams,
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  normalizePharmacyFiltersCity,
  parsePharmacySegments,
  type PharmacyRouteParams,
} from '@/lib/catalog/pharmacies-catalog';

import {
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo';
import { getPharmacyFilters, getPharmacies } from '@/lib/api/server';

//===================================================================

type PharmaciesSegmentsPageProps = {
  params?: Promise<PharmacyRouteParams>;
};

//===================================================================

export async function generateMetadata({
  params,
}: PharmaciesSegmentsPageProps) {
  const parsedFilters = parsePharmacySegments(await params);

  return createPageMetadata({
    title: getPharmacyTitle(parsedFilters),
    description: getPharmacyDescription(parsedFilters),
    path: buildPharmacyPath(parsedFilters),
    noIndex: isPharmacyNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmaciesSegmentsPage({ params }: PharmaciesSegmentsPageProps) {
  const parsedFilters = parsePharmacySegments(await params);

  const pharmacyFiltersState = await resolveServerDataState(
    getPharmacyFilters(PUBLIC_API_CACHE_OPTIONS)
  );

  const cityOptions =
    pharmacyFiltersState.status === 'success'
      ? pharmacyFiltersState.data.cities.map((city) => city.value)
      : [];

  const filters = normalizePharmacyFiltersCity(parsedFilters, cityOptions);

  const pharmaciesState = await resolveServerDataState(
    getPharmacies(buildPharmacyApiParams(filters), PUBLIC_API_CACHE_OPTIONS)
  );

  const pharmaciesData =
    pharmaciesState.status === 'success' ? pharmaciesState.data : null;

  return (
    <PharmaciesPageContent
      pharmacies={pharmaciesData?.items ?? []}
      total={pharmaciesData?.total ?? 0}
      totalPages={pharmaciesData?.totalPages ?? 0}
      filters={filters}
      cityOptions={cityOptions}
      isUnavailable={pharmaciesState.status === 'unavailable'}
    />
  );
}

export default PharmaciesSegmentsPage;
