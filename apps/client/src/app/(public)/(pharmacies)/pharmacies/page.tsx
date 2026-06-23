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

import { PUBLIC_API_CACHE_OPTIONS } from '@/lib/api/server';
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

  const [pharmacyFiltersData, initialPharmaciesData] = await Promise.all([
    getPharmacyFilters(PUBLIC_API_CACHE_OPTIONS).catch(() => null),
    getPharmacies(
      buildPharmacyApiParams(parsedFilters),
      PUBLIC_API_CACHE_OPTIONS
    ).catch(() => null),
  ]);

  const cityOptions =
    pharmacyFiltersData?.cities.map((city) => city.value) ?? [];

  const filters = normalizePharmacyFiltersCity(parsedFilters, cityOptions);

  const shouldRefetchWithNormalizedCity =
    filters.city !== parsedFilters.city && Boolean(filters.city);

  const pharmaciesData = shouldRefetchWithNormalizedCity
    ? await getPharmacies(
        buildPharmacyApiParams(filters),
        PUBLIC_API_CACHE_OPTIONS
      ).catch(() => initialPharmaciesData)
    : initialPharmaciesData;

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
