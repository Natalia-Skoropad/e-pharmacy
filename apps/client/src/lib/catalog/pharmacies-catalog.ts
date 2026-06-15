import type { Pharmacy, PharmaciesSortFilter } from '@e-pharmacy/types';

import {
  parsePositivePageParam,
  sanitizeCatalogTextParam,
  slugifyCatalogSegment,
} from './catalog-param-utils';

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

function isPharmacySortFilter(value?: string): value is PharmaciesSortFilter {
  return SORT_VALUES.includes(value as PharmaciesSortFilter);
}

//===================================================================

function deslugifyTextSegment(value: string): string {
  return sanitizeCatalogTextParam(value.replace(/-/g, ' '));
}

function normalizeCityKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function capitalizeWord(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : '';
}

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

export function getUniquePharmacyCities(pharmacies: Pharmacy[]): string[] {
  const cities = pharmacies
    .map((pharmacy) => pharmacy.city?.trim())
    .filter((city): city is string => Boolean(city));

  return sortCities([...new Set(cities)]);
}

//===================================================================

export function resolvePharmacyCity(value: string, cities: string[]): string {
  const sanitizedCity = sanitizeCatalogTextParam(value);
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
    name: sanitizeCatalogTextParam(params.name),
    address: sanitizeCatalogTextParam(params.address),
    city: sanitizeCatalogTextParam(params.city),
    sort: isPharmacySortFilter(params.sort) ? params.sort : 'newest',
    page: parsePositivePageParam(params.page),
  };
}

//===================================================================

export function parsePharmacySegments(
  params: PharmacyRouteParams = {}
): PharmacyFilters {
  const filters: PharmacyFilters = {
    name: '',
    address: '',
    city: '',
    sort: 'newest',
    page: 1,
  };

  for (const segment of params.segments ?? []) {
    if (segment.startsWith('search-name-')) {
      filters.name = deslugifyTextSegment(segment.replace('search-name-', ''));
      continue;
    }

    if (segment.startsWith('address-')) {
      filters.address = deslugifyTextSegment(segment.replace('address-', ''));
      continue;
    }

    if (segment.startsWith('city-')) {
      filters.city = deslugifyTextSegment(segment.replace('city-', ''));
      continue;
    }

    if (segment.startsWith('sort-')) {
      const sort = segment.replace('sort-', '');

      if (isPharmacySortFilter(sort)) filters.sort = sort;
      continue;
    }

    if (segment.startsWith('page-')) {
      filters.page = parsePositivePageParam(segment.replace('page-', ''));
    }
  }

  return filters;
}

//===================================================================

export function buildPharmacyPath(
  filters: Partial<PharmacyFilters>
): string {
  const segments: string[] = [];

  if (filters.name)
    segments.push(`search-name-${slugifyCatalogSegment(filters.name)}`);
  if (filters.address)
    segments.push(`address-${slugifyCatalogSegment(filters.address)}`);
  if (filters.city)
    segments.push(`city-${slugifyCatalogSegment(filters.city)}`);
  if (filters.sort && filters.sort !== 'newest') {
    segments.push(`sort-${filters.sort}`);
  }
  if (filters.page && filters.page > 1) segments.push(`page-${filters.page}`);

  return segments.length > 0
    ? `/pharmacies/${segments.join('/')}`
    : '/pharmacies';
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

export function isPharmacyNoIndex(
  filters: PharmacyFilters
): boolean {
  return (
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.address)
  );
}

//===================================================================

export function getPharmacyTitle(filters: PharmacyFilters): string {
  if (filters.city) return `Choose a pharmacy in ${filters.city}`;

  return 'Pharmacies';
}

//===================================================================

export function getPharmacyDescription(
  filters: PharmacyFilters
): string {
  if (filters.city) {
    return `Find active E-PHARMACY pharmacies in ${filters.city}, compare ratings, addresses, phone numbers, and available products before choosing a pharmacy.`;
  }

  return 'Find active E-PHARMACY pharmacies, compare ratings, addresses, phone numbers, and available products before choosing where to pharmacy.';
}

//===================================================================

export function getPharmaciesSeoTextParts(
  filters: PharmacyFilters
): string[] {
  const cityText = filters.city
    ? `pharmacies in ${filters.city}`
    : 'active pharmacies';

  return [
    'Choose trusted',
    cityText,
    'without bouncing between random tabs. In the E-PHARMACY pharmacy catalog, you can compare pharmacy ratings, addresses, contact details, and the number of products available before opening a pharmacy page. Use search by name or address, select a city, sort the list, and then move straight to the products from the pharmacy that looks right. Simple, tidy, and much less dramatic than hunting for a pharmacy at 22:59.',
  ];
}

//===================================================================

export function shouldShowPharmaciesSeoText(
  filters: PharmacyFilters
): boolean {
  return !isPharmacyNoIndex(filters);
}
