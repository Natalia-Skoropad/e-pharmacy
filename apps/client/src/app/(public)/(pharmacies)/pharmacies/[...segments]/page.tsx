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

import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';
import { getPharmacyFilters, getPharmacies } from '@e-pharmacy/api-client/client';

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

async function PharmaciesSegmentsPage({
  params,
}: PharmaciesSegmentsPageProps) {
  const parsedFilters = parsePharmacySegments(await params);

  const pharmacyFiltersData = await getPharmacyFilters(
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  const cityOptions = pharmacyFiltersData?.cities.map((city) => city.value) ?? [];

  const filters = normalizePharmacyFiltersCity(
    parsedFilters,
    cityOptions
  );

  const pharmaciesData = await getPharmacies(
    buildPharmacyApiParams(filters),
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return (
    <PharmaciesPageContent
      pharmacies={pharmaciesData?.items ?? []}
      total={pharmaciesData?.total ?? 0}
      totalPages={pharmaciesData?.totalPages ?? 0}
      filters={filters}
      cityOptions={cityOptions}
      isUnavailable={!pharmaciesData}
    />
  );
}

export default PharmaciesSegmentsPage;
