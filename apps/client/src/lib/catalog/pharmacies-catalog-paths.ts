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
  'location-',
  'region-',
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
    settlement: '',
    region: '',
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

    if (segment.startsWith('location-')) {
      apply('settlement', segment, index, () => {
        const value = deslugifyNameSegment(segment.slice('location-'.length));
        if (!value) return false;
        filters.settlement = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('region-')) {
      apply('region', segment, index, () => {
        const value = deslugifyNameSegment(segment.slice('region-'.length));
        if (!value) return false;
        filters.region = value;
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

  if (filters.region && !filters.settlement) {
    const regionIndex = segments.findIndex((segment) =>
      segment.startsWith('region-')
    );

    issues.push({
      code: 'malformed',
      segment: regionIndex >= 0 ? (segments[regionIndex] ?? '') : '',
      index: Math.max(regionIndex, 0),
    });
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

  if (filters.settlement) {
    const settlement = slugifySegment(filters.settlement);
    if (settlement) segments.push(`location-${settlement}`);

    if (filters.region) {
      const region = slugifySegment(filters.region);
      if (region) segments.push(`region-${region}`);
    }
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
  return buildPharmacyPath({
    settlement: filters.settlement,
    region: filters.region,
  });
}

//===================================================================

export function buildPharmacyCanonicalPath(filters: PharmacyFilters): string {
  return isPharmacyNoIndex(filters)
    ? buildPharmacyIndexedPath(filters)
    : buildPharmacyPath(filters);
}
