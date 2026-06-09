import type { Store, StoresSortFilter } from '@e-pharmacy/types';

import {
  parsePositivePageParam,
  sanitizeCatalogTextParam,
  slugifyCatalogSegment,
} from './catalog-param-utils';

//===================================================================

export const PHARMACY_STORES_PER_PAGE = 24;

//===================================================================

export const PHARMACY_STORES_SORT_OPTIONS: Array<{
  value: StoresSortFilter;
  label: string;
}> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

//===================================================================

export type PharmacyStoresSearchParams = {
  name?: string;
  address?: string;
  city?: string;
  sort?: string;
  page?: string;
};

export type PharmacyStoresRouteParams = {
  segments?: string[];
};

export type PharmacyStoresFilters = {
  name: string;
  address: string;
  city: string;
  sort: StoresSortFilter;
  page: number;
};

export type PharmacyStoresApiParams = {
  page: number;
  perPage: number;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: StoresSortFilter;
};

//===================================================================

const SORT_VALUES = PHARMACY_STORES_SORT_OPTIONS.map((option) => option.value);

//===================================================================

function isStoresSortFilter(value?: string): value is StoresSortFilter {
  return SORT_VALUES.includes(value as StoresSortFilter);
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

export function getUniqueStoreCities(stores: Store[]): string[] {
  const cities = stores
    .map((store) => store.city?.trim())
    .filter((city): city is string => Boolean(city));

  return sortCities([...new Set(cities)]);
}

//===================================================================

export function resolveStoreCity(value: string, cities: string[]): string {
  const sanitizedCity = sanitizeCatalogTextParam(value);
  if (!sanitizedCity) return '';

  const normalizedCity = normalizeCityKey(sanitizedCity);
  const matchedCity = cities.find(
    (city) => normalizeCityKey(city) === normalizedCity
  );

  return matchedCity ?? formatCityFallback(sanitizedCity);
}

//===================================================================

export function normalizePharmacyStoresFiltersCity(
  filters: PharmacyStoresFilters,
  cities: string[]
): PharmacyStoresFilters {
  if (!filters.city) return filters;

  return {
    ...filters,
    city: resolveStoreCity(filters.city, cities),
  };
}

//===================================================================

export function parsePharmacyStoresSearchParams(
  params: PharmacyStoresSearchParams = {}
): PharmacyStoresFilters {
  return {
    name: sanitizeCatalogTextParam(params.name),
    address: sanitizeCatalogTextParam(params.address),
    city: sanitizeCatalogTextParam(params.city),
    sort: isStoresSortFilter(params.sort) ? params.sort : 'newest',
    page: parsePositivePageParam(params.page),
  };
}

//===================================================================

export function parsePharmacyStoresSegments(
  params: PharmacyStoresRouteParams = {}
): PharmacyStoresFilters {
  const filters: PharmacyStoresFilters = {
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

      if (isStoresSortFilter(sort)) filters.sort = sort;
      continue;
    }

    if (segment.startsWith('page-')) {
      filters.page = parsePositivePageParam(segment.replace('page-', ''));
    }
  }

  return filters;
}

//===================================================================

export function buildPharmacyStoresPath(
  filters: Partial<PharmacyStoresFilters>
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
    ? `/pharmacy-stores/${segments.join('/')}`
    : '/pharmacy-stores';
}

//===================================================================

export function buildPharmacyStoresApiParams(
  filters: PharmacyStoresFilters
): PharmacyStoresApiParams {
  return {
    page: filters.page,
    perPage: PHARMACY_STORES_PER_PAGE,
    nameKeyword: filters.name || undefined,
    addressKeyword: filters.address || undefined,
    city: filters.city || undefined,
    sort: filters.sort,
  };
}

//===================================================================

export function getPharmacyStoresActiveFiltersCount(
  filters: PharmacyStoresFilters
): number {
  return [filters.name, filters.address, filters.city].filter(Boolean).length;
}

//===================================================================

export function isPharmacyStoresNoIndex(
  filters: PharmacyStoresFilters
): boolean {
  return (
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.address)
  );
}

//===================================================================

export function getPharmacyStoresTitle(filters: PharmacyStoresFilters): string {
  if (filters.city) return `Choose a pharmacy store in ${filters.city}`;

  return 'Pharmacy stores';
}

//===================================================================

export function getPharmacyStoresDescription(
  filters: PharmacyStoresFilters
): string {
  if (filters.city) {
    return `Find active E-PHARMACY stores in ${filters.city}, compare ratings, addresses, phone numbers, and available medicines before choosing a pharmacy.`;
  }

  return 'Find active E-PHARMACY pharmacy stores, compare ratings, addresses, phone numbers, and available medicines before choosing where to shop.';
}

//===================================================================

export function getPharmacyStoresSeoTextParts(
  filters: PharmacyStoresFilters
): string[] {
  const cityText = filters.city
    ? `pharmacies in ${filters.city}`
    : 'active pharmacy stores';

  return [
    'Choose trusted',
    cityText,
    'without bouncing between random tabs. In the E-PHARMACY pharmacy catalog, you can compare store ratings, addresses, contact details, and the number of medicines available before opening a pharmacy page. Use search by name or address, select a city, sort the list, and then move straight to the medicines from the store that looks right. Simple, tidy, and much less dramatic than hunting for a pharmacy at 22:59.',
  ];
}

//===================================================================

export function shouldShowPharmacyStoresSeoText(
  filters: PharmacyStoresFilters
): boolean {
  return !isPharmacyStoresNoIndex(filters);
}
