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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function deslugifyTextSegment(value: string): string {
  return sanitizeTextParam(value.replace(/-/g, ' '));
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
      filters.page = parsePage(segment.replace('page-', ''));
    }
  }

  return filters;
}

export function buildPharmacyStoresPath(
  filters: Partial<PharmacyStoresFilters>
): string {
  const segments: string[] = [];

  if (filters.name) segments.push(`search-name-${slugify(filters.name)}`);
  if (filters.address) segments.push(`address-${slugify(filters.address)}`);
  if (filters.city) segments.push(`city-${slugify(filters.city)}`);
  if (filters.sort && filters.sort !== 'newest') {
    segments.push(`sort-${filters.sort}`);
  }
  if (filters.page && filters.page > 1) segments.push(`page-${filters.page}`);

  return segments.length > 0
    ? `/pharmacy-stores/${segments.join('/')}`
    : '/pharmacy-stores';
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

export function getPharmacyStoresSeoTextParts(
  filters: PharmacyStoresFilters
): string[] {
  const cityText = filters.city ? `pharmacies in ${filters.city}` : 'active pharmacy stores';

  return [
    'Choose trusted',
    cityText,
    'without bouncing between random tabs. In the E-PHARMACY pharmacy catalog, you can compare store ratings, addresses, contact details, and the number of medicines available before opening a pharmacy page. Use search by name or address, select a city, sort the list, and then move straight to the medicines from the store that looks right. Simple, tidy, and much less dramatic than hunting for a pharmacy at 22:59.',
  ];
}

export function shouldShowPharmacyStoresSeoText(
  filters: PharmacyStoresFilters
): boolean {
  return !isPharmacyStoresNoIndex(filters);
}
