import { sanitizeTextParam } from '@e-pharmacy/validation/url';
import type { Pharmacy, PharmaciesSortFilter } from '@e-pharmacy/types';

import { parsePositivePageParam } from './catalog-param-utils';

//===================================================================

export const PHARMACIES_PER_PAGE = 24;

//===================================================================

export const PHARMACIES_SORT_OPTIONS: Array<{
  value: PharmaciesSortFilter;
  label: string;
}> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

//===================================================================

export type PharmacySearchParams = {
  name?: string;
  address?: string;
  city?: string;
  sort?: string;
  page?: string;
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

const SORT_VALUES = PHARMACIES_SORT_OPTIONS.map((option) => option.value);

//===================================================================

export function isPharmacySortFilter(
  value?: string
): value is PharmaciesSortFilter {
  return SORT_VALUES.includes(value as PharmaciesSortFilter);
}

//===================================================================

function normalizeCityKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

//===================================================================

function capitalizeWord(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : '';
}

//===================================================================

function formatCityFallback(value: string): string {
  return value
    .split(/([ -]+)/)
    .map((part) => (/^[A-Za-z]+$/.test(part) ? capitalizeWord(part) : part))
    .join('');
}

//===================================================================

export function sortCities(cities: string[]): string[] {
  return [...cities].sort((a, b) => a.localeCompare(b, 'en'));
}

//===================================================================

export function getUniquePharmacyCities(pharmacies: Pharmacy[]): string[] {
  const cities = pharmacies
    .map((pharmacy) => pharmacy.city?.trim())
    .filter((city): city is string => Boolean(city));

  return sortCities([...new Set(cities)]);
}

//===================================================================

export function resolvePharmacyCity(value: string, cities: string[]): string {
  const sanitizedCity = sanitizeTextParam(value);
  if (!sanitizedCity) return '';

  const normalizedCity = normalizeCityKey(sanitizedCity);
  const matchedCity = cities.find(
    (city) => normalizeCityKey(city) === normalizedCity
  );

  return matchedCity ?? formatCityFallback(sanitizedCity);
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
  return {
    name: sanitizeTextParam(params.name),
    address: sanitizeTextParam(params.address),
    city: sanitizeTextParam(params.city),
    sort: isPharmacySortFilter(params.sort) ? params.sort : 'newest',
    page: parsePositivePageParam(params.page),
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
  return [filters.name, filters.address, filters.city].filter(Boolean).length;
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
