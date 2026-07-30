import 'server-only';

import { PUBLIC_API_CACHE_OPTIONS, resolveServerDataState } from '@/lib/api/server';
import { getPharmacyFilters, getPharmacies } from '@/lib/api/server';

import {
  createPharmaciesCatalogPageData,
  type PharmaciesCatalogPageData,
} from './catalog-page-data';

import {
  buildPharmacyApiParams,
  normalizePharmacyFiltersCity,
  type PharmacyFilters,
} from './pharmacies-catalog';

//===================================================================

export async function loadPharmaciesCatalogPageData(
  parsedFilters: PharmacyFilters
): Promise<PharmaciesCatalogPageData> {
  const [filterState, initialPharmaciesState] = await Promise.all([
    resolveServerDataState(getPharmacyFilters(PUBLIC_API_CACHE_OPTIONS)),
    resolveServerDataState(
      getPharmacies(
        buildPharmacyApiParams(parsedFilters),
        PUBLIC_API_CACHE_OPTIONS
      )
    ),
  ]);

  const cityOptions =
    filterState.status === 'success'
      ? filterState.data.cities.map((city) => city.value)
      : [];

  const filters = normalizePharmacyFiltersCity(parsedFilters, cityOptions);
  const shouldRefetchWithNormalizedCity = filters.city !== parsedFilters.city;

  const pharmaciesState = shouldRefetchWithNormalizedCity
    ? await resolveServerDataState(
        getPharmacies(buildPharmacyApiParams(filters), PUBLIC_API_CACHE_OPTIONS)
      )
    : initialPharmaciesState;

  return createPharmaciesCatalogPageData({
    filters,
    pharmaciesState,
    filterState,
  });
}
