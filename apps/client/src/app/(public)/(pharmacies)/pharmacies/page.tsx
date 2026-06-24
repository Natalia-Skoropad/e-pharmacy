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

import {
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo';
import { getPharmacyFilters, getPharmacies } from '@/lib/api/server';

//===================================================================

type PharmaciesPageProps = {
  searchParams?: Promise<PharmacySearchParams>;
};

//===================================================================

export async function generateMetadata({ searchParams }: PharmaciesPageProps) {
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

  const [pharmacyFiltersState, initialPharmaciesState] = await Promise.all([
    resolveServerDataState(getPharmacyFilters(PUBLIC_API_CACHE_OPTIONS)),
    resolveServerDataState(
      getPharmacies(
        buildPharmacyApiParams(parsedFilters),
        PUBLIC_API_CACHE_OPTIONS
      )
    ),
  ]);

  const cityOptions =
    pharmacyFiltersState.status === 'success'
      ? pharmacyFiltersState.data.cities.map((city) => city.value)
      : [];

  const filters = normalizePharmacyFiltersCity(parsedFilters, cityOptions);

  const shouldRefetchWithNormalizedCity =
    filters.city !== parsedFilters.city && Boolean(filters.city);

  const pharmaciesState = shouldRefetchWithNormalizedCity
    ? await resolveServerDataState(
        getPharmacies(buildPharmacyApiParams(filters), PUBLIC_API_CACHE_OPTIONS)
      )
    : initialPharmaciesState;

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

export default PharmaciesPage;
