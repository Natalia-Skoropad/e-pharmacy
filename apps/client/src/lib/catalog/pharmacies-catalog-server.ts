import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  PUBLIC_COMMERCE_CACHE_OPTIONS,
  PUBLIC_DICTIONARY_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import { getPharmacies, getPharmacySearchOptions } from '@/lib/api/server';

import type {
  PharmacyOption,
  PharmacyLocationFilterOption,
} from '@e-pharmacy/types/pharmacies';

import { getCatalogRedirectPage } from './catalog-resource-state';

import {
  createPharmaciesCatalogPageData,
  type PharmaciesCatalogPageData,
} from './catalog-page-data';

import {
  buildPharmacyApiParams,
  buildPharmacyPath,
  normalizePharmacyFiltersLocation,
  type PharmacyFilters,
} from './pharmacies-catalog';

//===================================================================

// Only resolve matching location candidates when the URL contains a location.
// The unfiltered page no longer materializes the location dictionary.
export async function resolvePharmaciesCatalogFilters(
  parsedFilters: PharmacyFilters
) {
  const locationState = parsedFilters.settlement
    ? await resolveServerDataState(
        getPharmacySearchOptions(
          {
            kind: 'location',
            settlement: parsedFilters.settlement,
            ...(parsedFilters.region ? { region: parsedFilters.region } : {}),
            page: 1,
            perPage: 50,
          },

          PUBLIC_DICTIONARY_CACHE_OPTIONS
        )
      )
    : null;

  const locations: readonly PharmacyLocationFilterOption[] =
    locationState?.status === 'success' &&
    locationState.data.kind === 'location'
      ? locationState.data.items
      : [];

  return {
    filters: normalizePharmacyFiltersLocation(parsedFilters, locations),

    filterState:
      locationState?.status === 'unavailable'
        ? locationState
        : ({ status: 'success', data: { locations, sort: [] } } as const),
  };
}

//===================================================================

export async function loadPharmaciesCatalogPageData(
  parsedFilters: PharmacyFilters
): Promise<
  PharmaciesCatalogPageData & { pharmacyOptions: readonly PharmacyOption[] }
> {
  const [filterResolution, initialPharmaciesState, selectedPharmacyState] =
    await Promise.all([
      resolvePharmaciesCatalogFilters(parsedFilters),

      resolveServerDataState(
        getPharmacies(
          buildPharmacyApiParams(parsedFilters),
          PUBLIC_COMMERCE_CACHE_OPTIONS
        )
      ),

      parsedFilters.pharmacyId
        ? resolveServerDataState(
            getPharmacySearchOptions(
              {
                kind: 'pharmacy',
                selectedId: parsedFilters.pharmacyId,
                page: 1,
                perPage: 1,
              },

              PUBLIC_DICTIONARY_CACHE_OPTIONS
            )
          )
        : Promise.resolve(null),
    ]);

  const { filters, filterState } = filterResolution;

  const changed =
    filters.settlement !== parsedFilters.settlement ||
    filters.region !== parsedFilters.region;

  const pharmaciesState = changed
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

  if (pageData.resourceState.status === 'unavailable') noStore();

  const redirectPage = getCatalogRedirectPage(
    filters.page,
    pageData.totalPages,
    pageData.resourceState
  );

  if (redirectPage !== null)
    redirect(buildPharmacyPath({ ...filters, page: redirectPage }));

  return {
    ...pageData,

    // Selected entry only. Options for opening/scrolling are loaded by the browser.
    pharmacyOptions:
      selectedPharmacyState?.status === 'success' &&
      selectedPharmacyState.data.kind === 'pharmacy'
        ? selectedPharmacyState.data.items
        : [],
  };
}

//===================================================================

export async function getSelectedPharmacySeoName(
  pharmacyId?: string
): Promise<string | undefined> {
  if (!pharmacyId) return undefined;

  const state = await resolveServerDataState(
    getPharmacySearchOptions(
      { kind: 'pharmacy', selectedId: pharmacyId, page: 1, perPage: 1 },
      PUBLIC_DICTIONARY_CACHE_OPTIONS
    )
  );

  return state.status === 'success' && state.data.kind === 'pharmacy'
    ? state.data.items[0]?.name
    : undefined;
}
