import { sanitizeTextParam } from '@e-pharmacy/validation/url';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import type { PharmaciesSortFilter } from '@e-pharmacy/types/pharmacies';

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
  city?: CatalogSearchParamValue;
  sort?: CatalogSearchParamValue;
  page?: CatalogSearchParamValue;
};

export type PharmacyRouteParams = {
  segments?: string[];
};

export type PharmacyFilters = {
  name: string;
  address: string;
  city: string;
  sort: PharmaciesSortFilter;
  page: number;
};

export type PharmacyApiParams = {
  page: number;
  perPage: number;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: PharmaciesSortFilter;
};

//===================================================================

export function isPharmacySortFilter(
  value?: string
): value is PharmaciesSortFilter {
  return PHARMACY_SORT_VALUES.some((item) => item === value);
}

//===================================================================

export function normalizeCityKey(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('uk-UA')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

//===================================================================

function formatCityFallback(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('uk-UA')
    .replace(/(^|[\s-])(\p{L})/gu, (_match, separator, letter) => {
      return `${separator}${letter.toLocaleUpperCase('uk-UA')}`;
    });
}

//===================================================================

export function formatPharmacyCityLabel(value: string): string {
  const sanitizedCity = sanitizeTextParam(value);

  return sanitizedCity ? formatCityFallback(sanitizedCity) : '';
}

//===================================================================

export function resolvePharmacyCity(value: string, cities: string[]): string {
  const sanitizedCity = sanitizeTextParam(value);
  if (!sanitizedCity) return '';

  const normalizedCity = normalizeCityKey(sanitizedCity);

  const matchedCity = cities.find(
    (city) => normalizeCityKey(city) === normalizedCity
  );

  return matchedCity ?? formatPharmacyCityLabel(sanitizedCity);
}

//===================================================================

export function normalizePharmacyFiltersCity(
  filters: PharmacyFilters,
  cities: string[]
): PharmacyFilters {
  if (!filters.city) return filters;

  return {
    ...filters,
    city: resolvePharmacyCity(filters.city, cities),
  };
}

//===================================================================

export function parsePharmacySearchParams(
  params: PharmacySearchParams = {}
): PharmacyFilters {
  const name = getSingleSearchParam(params.name);
  const address = getSingleSearchParam(params.address);
  const city = getSingleSearchParam(params.city);
  const sort = getSingleSearchParam(params.sort);
  const page = getSingleSearchParam(params.page);

  return {
    name: sanitizeTextParam(name),
    address: sanitizeTextParam(address),
    city: sanitizeTextParam(city),
    sort: isPharmacySortFilter(sort) ? sort : 'newest',
    page: parsePositivePageParam(page),
  };
}

//===================================================================

export function mergePharmacyCatalogFilters(
  routeFilters: PharmacyFilters,
  queryFilters: PharmacyFilters
): PharmacyFilters {
  return {
    name: routeFilters.name || queryFilters.name,
    address: routeFilters.address || queryFilters.address,
    city: routeFilters.city || queryFilters.city,
    sort: routeFilters.sort !== 'newest' ? routeFilters.sort : queryFilters.sort,
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
    city: filters.city || undefined,
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
    Boolean(filters.city)
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
