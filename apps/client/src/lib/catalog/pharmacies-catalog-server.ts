import 'server-only';

import type { PublicPharmacy } from '@e-pharmacy/types';

import {
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import { getPharmacyFilters, getPharmacies } from '@/lib/api/server';

import {
  buildPharmacyApiParams,
  normalizePharmacyFiltersCity,
  type PharmacyFilters,
} from './pharmacies-catalog';

//===================================================================

type PharmaciesCatalogPageData = {
  pharmacies: PublicPharmacy[];
  total: number;
  totalPages: number;
  filters: PharmacyFilters;
  cityOptions: string[];
  isUnavailable: boolean;
};

//===================================================================

export async function loadPharmaciesCatalogPageData(
  parsedFilters: PharmacyFilters
): Promise<PharmaciesCatalogPageData> {
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

  const shouldRefetchWithNormalizedCity = filters.city !== parsedFilters.city;

  const pharmaciesState = shouldRefetchWithNormalizedCity
    ? await resolveServerDataState(
        getPharmacies(buildPharmacyApiParams(filters), PUBLIC_API_CACHE_OPTIONS)
      )
    : initialPharmaciesState;

  const pharmaciesData =
    pharmaciesState.status === 'success' ? pharmaciesState.data : null;

  return {
    pharmacies: pharmaciesData?.items ?? [],
    total: pharmaciesData?.total ?? 0,
    totalPages: pharmaciesData?.totalPages ?? 0,
    filters,
    cityOptions,
    isUnavailable: pharmaciesState.status === 'unavailable',
  };
}
