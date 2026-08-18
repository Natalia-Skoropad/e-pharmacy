import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  PUBLIC_COMMERCE_CACHE_OPTIONS,
  PUBLIC_DICTIONARY_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import { getPharmacyFilters, getPharmacies } from '@/lib/api/server';

import { getCatalogRedirectPage } from './catalog-resource-state';

import {
  createPharmaciesCatalogPageData,
  type PharmaciesCatalogPageData,
} from './catalog-page-data';

import {
  buildPharmacyApiParams,
  buildPharmacyPath,
  normalizePharmacyFiltersCity,
  type PharmacyFilters,
} from './pharmacies-catalog';

//===================================================================

export async function resolvePharmaciesCatalogFilters(
  parsedFilters: PharmacyFilters
) {
  const filterState = await resolveServerDataState(
    getPharmacyFilters(PUBLIC_DICTIONARY_CACHE_OPTIONS)
  );

  const cityOptions =
    filterState.status === 'success'
      ? filterState.data.cities.map((city) => city.value)
      : [];

  return {
    filters: normalizePharmacyFiltersCity(parsedFilters, cityOptions),
    filterState,
  };
}

//===================================================================

export async function loadPharmaciesCatalogPageData(
  parsedFilters: PharmacyFilters
): Promise<PharmaciesCatalogPageData> {
  const [filterResolution, initialPharmaciesState] = await Promise.all([
    resolvePharmaciesCatalogFilters(parsedFilters),
    resolveServerDataState(
      getPharmacies(
        buildPharmacyApiParams(parsedFilters),
        PUBLIC_COMMERCE_CACHE_OPTIONS
      )
    ),
  ]);

  const { filters, filterState } = filterResolution;
  const shouldRefetchWithNormalizedCity = filters.city !== parsedFilters.city;

  const pharmaciesState = shouldRefetchWithNormalizedCity
    ? await resolveServerDataState(
        getPharmacies(
          buildPharmacyApiParams(filters),
          PUBLIC_COMMERCE_CACHE_OPTIONS
        )
      )
    : initialPharmaciesState;

  const pageData = createPharmaciesCatalogPageData({
    filters,
    pharmaciesState,
    filterState,
  });

  if (pageData.resourceState.status === 'unavailable') {
    noStore();
  }

  const redirectPage = getCatalogRedirectPage(
    filters.page,
    pageData.totalPages,
    pageData.resourceState
  );

  if (redirectPage !== null) {
    redirect(buildPharmacyPath({ ...filters, page: redirectPage }));
  }

  return pageData;
}
