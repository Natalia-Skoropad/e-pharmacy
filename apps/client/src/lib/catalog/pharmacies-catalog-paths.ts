import { deslugifyNameSegment, slugifySegment } from '@e-pharmacy/validation';

import { parsePositivePageParam } from './catalog-param-utils';

import {
  isPharmacySortFilter,
  type PharmacyFilters,
  type PharmacyRouteParams,
} from './pharmacies-catalog-filters';

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
      filters.name = deslugifyNameSegment(segment.replace('search-name-', ''));
      continue;
    }

    if (segment.startsWith('address-')) {
      filters.address = deslugifyNameSegment(segment.replace('address-', ''));
      continue;
    }

    if (segment.startsWith('city-')) {
      filters.city = deslugifyNameSegment(segment.replace('city-', ''));
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

export function buildPharmacyPath(filters: Partial<PharmacyFilters>): string {
  const segments: string[] = [];

  if (filters.name)
    segments.push(`search-name-${slugifySegment(filters.name)}`);
  if (filters.address)
    segments.push(`address-${slugifySegment(filters.address)}`);
  if (filters.city)
    segments.push(`city-${slugifySegment(filters.city)}`);
  if (filters.sort && filters.sort !== 'newest') {
    segments.push(`sort-${filters.sort}`);
  }
  if (filters.page && filters.page > 1) segments.push(`page-${filters.page}`);

  return segments.length > 0
    ? `/pharmacies/${segments.join('/')}`
    : '/pharmacies';
}
