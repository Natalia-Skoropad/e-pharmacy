import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  PUBLIC_COMMERCE_CACHE_OPTIONS,
  PUBLIC_DICTIONARY_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import {
  getPharmacyFilters,
  getPharmacies,
  getPharmacyOptions,
} from '@/lib/api/server';

import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

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

export async function resolvePharmaciesCatalogFilters(
  parsedFilters: PharmacyFilters
) {
  const filterState = await resolveServerDataState(
    getPharmacyFilters(PUBLIC_DICTIONARY_CACHE_OPTIONS)
  );

  const locationOptions =
    filterState.status === 'success' ? filterState.data.locations : [];

  return {
    filters: normalizePharmacyFiltersLocation(parsedFilters, locationOptions),
    filterState,
  };
}

//===================================================================

export async function loadPharmaciesCatalogPageData(
  parsedFilters: PharmacyFilters
): Promise<
  PharmaciesCatalogPageData & { pharmacyOptions: readonly PharmacyOption[] }
> {
  const [filterResolution, initialPharmaciesState, pharmacyOptionsState] =
    await Promise.all([
      resolvePharmaciesCatalogFilters(parsedFilters),

      resolveServerDataState(
        getPharmacies(
          buildPharmacyApiParams(parsedFilters),
          PUBLIC_COMMERCE_CACHE_OPTIONS
        )
      ),

      resolveServerDataState(
        getPharmacyOptions(PUBLIC_DICTIONARY_CACHE_OPTIONS)
      ),
    ]);

  const { filters, filterState } = filterResolution;

  const shouldRefetchWithNormalizedLocation =
    filters.settlement !== parsedFilters.settlement ||
    filters.region !== parsedFilters.region;

  const pharmaciesState = shouldRefetchWithNormalizedLocation
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

  return {
    ...pageData,
    pharmacyOptions:
      pharmacyOptionsState.status === 'success'
        ? pharmacyOptionsState.data.items
        : [],
  };
}

//===================================================================

// Use the public option snapshot for both page metadata and the visible heading.
// A missing/stale option must not leak an internal ID into public SEO copy.
export async function getSelectedPharmacySeoName(
  pharmacyId?: string
): Promise<string | undefined> {
  if (!pharmacyId) return undefined;

  const state = await resolveServerDataState(
    getPharmacyOptions(PUBLIC_DICTIONARY_CACHE_OPTIONS)
  );

  return state.status === 'success'
    ? state.data.items.find((pharmacy) => pharmacy.id === pharmacyId)?.name
    : undefined;
}
