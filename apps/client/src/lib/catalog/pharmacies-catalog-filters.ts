import type {
  PharmaciesSortFilter,
  PharmacyLocationFilterOption,
} from '@e-pharmacy/types/pharmacies';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { sanitizeTextParam } from '@e-pharmacy/validation/url';

import {
  getSingleSearchParam,
  parsePositivePageParam,
  type CatalogSearchParamValue,
} from './catalog-param-utils';

//===================================================================

const PHARMACY_SORT_VALUES = [
  'newest',
  'rating-desc',
  'rating-asc',
  'name-asc',
  'name-desc',
] as const satisfies readonly PharmaciesSortFilter[];

//===================================================================

export const PHARMACIES_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
] as const satisfies readonly Readonly<{
  value: PharmaciesSortFilter;
  label: string;
}>[];

const PHARMACIES_PER_PAGE = 24;

//===================================================================

export type PharmacySearchParams = Record<string, CatalogSearchParamValue> & {
  name?: CatalogSearchParamValue;
  address?: CatalogSearchParamValue;
  settlement?: CatalogSearchParamValue;
  region?: CatalogSearchParamValue;
  sort?: CatalogSearchParamValue;
  page?: CatalogSearchParamValue;
};

export type PharmacyRouteParams = {
  segments?: string[];
};

export type PharmacyFilters = {
  name: string;
  address: string;
  settlement: string;
  region: string;
  sort: PharmaciesSortFilter;
  page: number;
};

export type PharmacyApiParams = {
  page: number;
  perPage: number;
  nameKeyword?: string;
  addressKeyword?: string;
  settlement?: string;
  region?: string;
  sort?: PharmaciesSortFilter;
};

//===================================================================

export function isPharmacySortFilter(
  value?: string
): value is PharmaciesSortFilter {
  return PHARMACY_SORT_VALUES.some((item) => item === value);
}

//===================================================================

export function normalizeLocationKey(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('uk-UA')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

//===================================================================

function formatLocationPartFallback(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('uk-UA')
    .replace(/(^|[\s-])(\p{L})/gu, (_match, separator, letter) => {
      return `${separator}${letter.toLocaleUpperCase('uk-UA')}`;
    });
}

//===================================================================

export function formatPharmacyLocationLabel(
  settlement: string,
  region?: string
): string {
  const sanitizedSettlement = sanitizeTextParam(settlement);
  if (!sanitizedSettlement) return '';

  const sanitizedRegion = sanitizeTextParam(region);

  return sanitizedRegion
    ? `${sanitizedSettlement} (${sanitizedRegion})`
    : sanitizedSettlement;
}

//===================================================================

export function resolvePharmacyLocation(
  settlement: string,
  region: string,
  locations: readonly PharmacyLocationFilterOption[]
): Readonly<{ settlement: string; region: string }> {
  const sanitizedSettlement = sanitizeTextParam(settlement);
  if (!sanitizedSettlement) return { settlement: '', region: '' };

  const sanitizedRegion = sanitizeTextParam(region);
  const settlementKey = normalizeLocationKey(sanitizedSettlement);

  const matchingSettlements = locations.filter(
    (location) => normalizeLocationKey(location.settlement) === settlementKey
  );

  if (sanitizedRegion) {
    const regionKey = normalizeLocationKey(sanitizedRegion);
    const exactMatch = matchingSettlements.find(
      (location) => normalizeLocationKey(location.region ?? '') === regionKey
    );

    if (exactMatch) {
      return {
        settlement: exactMatch.settlement,
        region: exactMatch.region ?? '',
      };
    }
  } else if (matchingSettlements.length === 1) {
    const [onlyMatch] = matchingSettlements;

    return {
      settlement: onlyMatch?.settlement ?? sanitizedSettlement,
      region: onlyMatch?.region ?? '',
    };
  } else if (matchingSettlements.length > 1) {
    return {
      settlement: matchingSettlements[0]?.settlement ?? sanitizedSettlement,
      region: '',
    };
  }

  return {
    settlement: formatLocationPartFallback(sanitizedSettlement),
    region: sanitizedRegion ? formatLocationPartFallback(sanitizedRegion) : '',
  };
}

//===================================================================

export function normalizePharmacyFiltersLocation(
  filters: PharmacyFilters,
  locations: readonly PharmacyLocationFilterOption[]
): PharmacyFilters {
  if (!filters.settlement) {
    return filters.region ? { ...filters, region: '' } : filters;
  }

  const normalizedLocation = resolvePharmacyLocation(
    filters.settlement,
    filters.region,
    locations
  );

  return {
    ...filters,
    ...normalizedLocation,
  };
}

//===================================================================

export function parsePharmacySearchParams(
  params: PharmacySearchParams = {}
): PharmacyFilters {
  const name = getSingleSearchParam(params.name);
  const address = getSingleSearchParam(params.address);

  const settlement = getSingleSearchParam(params.settlement);

  const region = getSingleSearchParam(params.region);
  const sort = getSingleSearchParam(params.sort);
  const page = getSingleSearchParam(params.page);
  const sanitizedSettlement = sanitizeTextParam(settlement);

  return {
    name: sanitizeTextParam(name),
    address: sanitizeTextParam(address),
    settlement: sanitizedSettlement,
    region: sanitizedSettlement ? sanitizeTextParam(region) : '',
    sort: isPharmacySortFilter(sort) ? sort : 'newest',
    page: parsePositivePageParam(page),
  };
}

//===================================================================

export function mergePharmacyCatalogFilters(
  routeFilters: PharmacyFilters,
  queryFilters: PharmacyFilters
): PharmacyFilters {
  const settlement = routeFilters.settlement || queryFilters.settlement;

  return {
    name: routeFilters.name || queryFilters.name,
    address: routeFilters.address || queryFilters.address,
    settlement,
    region: settlement ? routeFilters.region || queryFilters.region : '',

    sort:
      routeFilters.sort !== 'newest' ? routeFilters.sort : queryFilters.sort,

    page: routeFilters.page > 1 ? routeFilters.page : queryFilters.page,
  };
}

//===================================================================

export function buildPharmacyApiParams(
  filters: PharmacyFilters
): PharmacyApiParams {
  return {
    page: filters.page,
    perPage: PHARMACIES_PER_PAGE,
    nameKeyword: filters.name || undefined,
    addressKeyword: filters.address || undefined,
    settlement: filters.settlement || undefined,
    region: filters.region || undefined,
    sort: filters.sort,
  };
}

//===================================================================

export function getPharmacyActiveFiltersCount(
  filters: PharmacyFilters
): number {
  return countTrueConditions(
    Boolean(filters.name),
    Boolean(filters.address),
    Boolean(filters.settlement)
  );
}

//===================================================================

export function isPharmacyNoIndex(filters: PharmacyFilters): boolean {
  return (
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.address)
  );
}
