import { PharmaciesPageContent } from '@/components/pharmacies';

import {
  buildPharmacyApiParams,
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  normalizePharmacyFiltersCity,
  parsePharmacySearchParams,
  type PharmacySearchParams,
} from '@/lib/catalog/pharmacies-catalog';

import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';
import { getPharmacyFilters, getPharmacies } from '@e-pharmacy/api-client/client';

//===================================================================

type PharmaciesPageProps = {
  searchParams?: Promise<PharmacySearchParams>;
};

//===================================================================


export async function generateMetadata({
  searchParams,
}: PharmaciesPageProps) {
  const parsedFilters = parsePharmacySearchParams(await searchParams);

  return createPageMetadata({
    title: getPharmacyTitle(parsedFilters),
    description: getPharmacyDescription(parsedFilters),
    path: buildPharmacyPath(parsedFilters),
    noIndex: isPharmacyNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmaciesPage({ searchParams }: PharmaciesPageProps) {
  const parsedFilters = parsePharmacySearchParams(await searchParams);

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

export default PharmaciesPage;
