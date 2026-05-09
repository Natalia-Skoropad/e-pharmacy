import type { Store, StoresSortFilter } from '@/types';

//===================================================================

export const PHARMACY_STORES_PER_PAGE = 12;

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

function sanitizeTextParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[^A-Za-z0-9 .-]/g, '')
      .slice(0, 80) ?? ''
  );
}

function parsePage(value?: string): number {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
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

export function parsePharmacyStoresSearchParams(
  params: PharmacyStoresSearchParams = {}
): PharmacyStoresFilters {
  return {
    name: sanitizeTextParam(params.name),
    address: sanitizeTextParam(params.address),
    city: sanitizeTextParam(params.city),
    sort: isStoresSortFilter(params.sort) ? params.sort : 'newest',
    page: parsePage(params.page),
  };
}

export function buildPharmacyStoresPath(
  filters: Partial<PharmacyStoresFilters>
): string {
  const params = new URLSearchParams();

  if (filters.name) params.set('name', filters.name);
  if (filters.address) params.set('address', filters.address);
  if (filters.city) params.set('city', filters.city);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));

  const queryString = params.toString();

  return queryString ? `/pharmacy-stores?${queryString}` : '/pharmacy-stores';
}

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

export function getPharmacyStoresActiveFiltersCount(
  filters: PharmacyStoresFilters
): number {
  return [filters.name, filters.address, filters.city].filter(Boolean).length;
}

export function isPharmacyStoresNoIndex(filters: PharmacyStoresFilters): boolean {
  return (
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.address)
  );
}

export function getPharmacyStoresTitle(filters: PharmacyStoresFilters): string {
  if (filters.city) return `Choose a pharmacy store in ${filters.city}`;

  return 'Pharmacy stores';
}

export function getPharmacyStoresDescription(
  filters: PharmacyStoresFilters
): string {
  if (filters.city) {
    return `Find active E-PHARMACY stores in ${filters.city}, compare ratings, addresses, phone numbers, and available medicines before choosing a pharmacy.`;
  }

  return 'Find active E-PHARMACY pharmacy stores, compare ratings, addresses, phone numbers, and available medicines before choosing where to shop.';
}
