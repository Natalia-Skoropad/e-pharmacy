import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { cache } from 'react';
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

// Share the same public catalogue read between metadata and the page within a
// server render. Selected pharmacy names are already in the page response; a
// second /search-options?selectedId call can time out for a large document.
const readCatalogState = cache((paramsKey: string) =>
  resolveServerDataState(
    getPharmacies(
      JSON.parse(paramsKey) as ReturnType<typeof buildPharmacyApiParams>,
      PUBLIC_COMMERCE_CACHE_OPTIONS
    )
  )
);

//===================================================================

function readCatalogForFilters(filters: PharmacyFilters) {
  return readCatalogState(JSON.stringify(buildPharmacyApiParams(filters)));
}

//===================================================================

// Resolve the URL's location BEFORE reading the catalogue. Canonicalization
// (strumok -> Strumok) must not trigger a second identical MongoDB read.
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
  const { filters, filterState } =
    await resolvePharmaciesCatalogFilters(parsedFilters);

  const pharmaciesState = await readCatalogForFilters(filters);

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

  // Reuse the visible cards as lightweight local search suggestions. This
  // includes the selected pharmacy and lets a user select it immediately while
  // the remote, full-catalog autocomplete is still loading.
  const pharmacyOptions: readonly PharmacyOption[] = pageData.pharmacies.map(
    (item) => ({
      id: item.id,
      name: item.name,

      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      ...(item.email ? { email: item.email } : {}),
      ...(item.phone ? { phone: item.phone } : {}),
      ...(item.location ? { location: item.location } : {}),
    })
  );

  return { ...pageData, pharmacyOptions };
}

//===================================================================

/** Reuse the same cached catalogue response for social metadata and the page. */
export async function getSelectedPharmacySeoDetails(
  filters: PharmacyFilters
): Promise<{ name: string; imageUrl?: string } | undefined> {
  if (!filters.pharmacyId) return undefined;

  // No extra /search-options request: the selected pharmacy is part of the
  // filtered catalogue response. Its public photo is safe for OG/Twitter.
  const state = await readCatalogForFilters(filters);

  if (state.status !== 'success') return undefined;

  const pharmacy = state.data.items.find(
    (item) => item.id === filters.pharmacyId
  );

  return pharmacy
    ? {
        name: pharmacy.name,
        ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
      }
    : undefined;
}
