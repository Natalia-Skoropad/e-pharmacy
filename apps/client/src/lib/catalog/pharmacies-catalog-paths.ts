import {
  deslugifyNameSegment,
  slugifySegment,
} from '@e-pharmacy/validation/url';

import { ROUTES } from '@/lib/routes';

import {
  isCanonicalPositivePageParam,
  MAX_CATALOG_SEGMENTS,
  parsePositivePageParam,
} from './catalog-param-utils';

import {
  isPharmacyNoIndex,
  isPharmacySortFilter,
  type PharmacyFilters,
  type PharmacyRouteParams,
} from './pharmacies-catalog-filters';

import type { CatalogSegmentIssue } from './product-catalog-paths';

//===================================================================

const PHARMACY_CATALOG_SEGMENT_PREFIXES = [
  'search-name-',
  'address-',
  'city-',
  'sort-',
  'page-',
] as const;

//===================================================================

export function isPharmacyCatalogSegment(segment: string): boolean {
  return PHARMACY_CATALOG_SEGMENT_PREFIXES.some((prefix) =>
    segment.startsWith(prefix)
  );
}

//===================================================================

export type PharmacyCatalogParseResult = Readonly<{
  filters: PharmacyFilters;
  issues: readonly CatalogSegmentIssue[];
  isCanonical: boolean;
}>;

//===================================================================

export function parsePharmacySegments(
  params: PharmacyRouteParams = {}
): PharmacyCatalogParseResult {
  const filters: PharmacyFilters = {
    name: '',
    address: '',
    city: '',
    sort: 'newest',
    page: 1,
  };

  const issues: CatalogSegmentIssue[] = [];
  const segments = params.segments ?? [];

  if (segments.length > MAX_CATALOG_SEGMENTS) {
    return {
      filters,
      issues: [
        {
          code: 'too_many',
          segment: segments[MAX_CATALOG_SEGMENTS] ?? '',
          index: MAX_CATALOG_SEGMENTS,
        },
      ],
      isCanonical: false,
    };
  }

  const seen = new Set<string>();

  const apply = (
    key: string,
    segment: string,
    index: number,
    update: () => boolean
  ) => {
    if (seen.has(key)) {
      issues.push({ code: 'duplicate', segment, index });
      return;
    }

    seen.add(key);
    if (!update()) issues.push({ code: 'malformed', segment, index });
  };

  for (const [index, segment] of segments.entries()) {
    if (segment.startsWith('search-name-')) {
      apply('name', segment, index, () => {
        const value = deslugifyNameSegment(
          segment.slice('search-name-'.length)
        );

        if (!value) return false;
        filters.name = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('address-')) {
      apply('address', segment, index, () => {
        const value = deslugifyNameSegment(segment.slice('address-'.length));
        if (!value) return false;
        filters.address = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('city-')) {
      apply('city', segment, index, () => {
        const value = deslugifyNameSegment(segment.slice('city-'.length));
        if (!value) return false;
        filters.city = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('sort-')) {
      apply('sort', segment, index, () => {
        const value = segment.slice('sort-'.length);
        if (!isPharmacySortFilter(value) || value === 'newest') return false;
        filters.sort = value;
        return true;
      });
      continue;
    }

    if (segment.startsWith('page-')) {
      apply('page', segment, index, () => {
        const value = segment.slice('page-'.length);
        if (!isCanonicalPositivePageParam(value) || value === '1') return false;
        filters.page = parsePositivePageParam(value);
        return true;
      });

      continue;
    }

    issues.push({ code: 'unknown', segment, index });
  }

  return {
    filters,
    issues,
    isCanonical: issues.length === 0,
  };
}

//===================================================================

export function buildPharmacyPath(filters: Partial<PharmacyFilters>): string {
  const segments: string[] = [];

  if (filters.name) {
    const value = slugifySegment(filters.name);
    if (value) segments.push(`search-name-${value}`);
  }

  if (filters.address) {
    const value = slugifySegment(filters.address);
    if (value) segments.push(`address-${value}`);
  }

  if (filters.city) {
    const value = slugifySegment(filters.city);
    if (value) segments.push(`city-${value}`);
  }

  if (
    filters.sort &&
    filters.sort !== 'newest' &&
    isPharmacySortFilter(filters.sort)
  ) {
    segments.push(`sort-${filters.sort}`);
  }

  if (filters.page && filters.page > 1 && Number.isSafeInteger(filters.page)) {
    segments.push(`page-${filters.page}`);
  }

  return segments.length
    ? `${ROUTES.PHARMACIES}/${segments.join('/')}`
    : ROUTES.PHARMACIES;
}

//===================================================================

export function buildPharmacyIndexedPath(
  filters: Partial<PharmacyFilters>
): string {
  return buildPharmacyPath({ city: filters.city });
}

//===================================================================

export function buildPharmacyCanonicalPath(filters: PharmacyFilters): string {
  return isPharmacyNoIndex(filters)
    ? buildPharmacyIndexedPath(filters)
    : buildPharmacyPath(filters);
}
