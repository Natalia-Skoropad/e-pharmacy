import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isValidObjectId,
  slugifySegment,
} from '@e-pharmacy/validation/url';

import { ROUTES } from '@/lib/routes';

import {
  isCanonicalPositivePageParam,
  parsePositivePageParam,
} from './catalog-param-utils';

import {
  isProductAvailabilityFilter,
  isProductCatalogNoIndex,
  isProductCategoryFilter,
  isProductSortFilter,
  type ProductCatalogFilters,
  type ProductCatalogRouteParams,
} from './product-catalog-filters';

//===================================================================

export type CatalogSegmentIssue = Readonly<{
  code: 'duplicate' | 'malformed' | 'unknown';
  segment: string;
  index: number;
}>;

//===================================================================

export type ProductCatalogParseResult = Readonly<{
  filters: ProductCatalogFilters;
  issues: readonly CatalogSegmentIssue[];
  isCanonical: boolean;
}>;

//===================================================================

function getPharmacySegment(
  pharmacyId: string,
  pharmacies: readonly PharmacyOption[]
): string | null {
  if (!isValidObjectId(pharmacyId)) return null;

  const pharmacy = pharmacies.find((item) => item.id === pharmacyId);
  const pharmacySlug = pharmacy ? slugifySegment(pharmacy.name) : 'pharmacy';

  return `pharmacy-${pharmacySlug}-${pharmacyId}`;
}

//===================================================================

export function parseProductCatalogSegments(
  params: ProductCatalogRouteParams = {}
): ProductCatalogParseResult {
  const filters: ProductCatalogFilters = {
    name: '',
    article: '',
    category: 'all',
    availability: 'all',
    sort: 'newest',
    page: 1,
  };

  const issues: CatalogSegmentIssue[] = [];
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

  for (const [index, segment] of (params.segments ?? []).entries()) {
    if (segment.startsWith('category-')) {
      apply('category', segment, index, () => {
        const value = segment.slice('category-'.length);
        if (!isProductCategoryFilter(value) || value === 'all') return false;
        filters.category = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('availability-')) {
      apply('availability', segment, index, () => {
        const value = segment.slice('availability-'.length);
        if (!isProductAvailabilityFilter(value) || value === 'all')
          return false;
        filters.availability = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('sort-')) {
      apply('sort', segment, index, () => {
        const value = segment.slice('sort-'.length);
        if (!isProductSortFilter(value) || value === 'newest') return false;
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

    if (segment.startsWith('article-')) {
      apply('article', segment, index, () => {
        const value = deslugifyArticleSegment(segment.slice('article-'.length));
        if (!value) return false;
        filters.article = value;
        return true;
      });

      continue;
    }

    if (segment.startsWith('pharmacy-')) {
      apply('pharmacy', segment, index, () => {
        const pharmacyId = segment.match(/-([a-f\d]{24})$/i)?.[1];
        if (!isValidObjectId(pharmacyId)) return false;
        filters.pharmacyId = pharmacyId;
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

export function buildProductCatalogIndexedPath(
  filters: Partial<ProductCatalogFilters>,
  pharmacies: readonly PharmacyOption[] = []
): string {
  const segments: string[] = [];

  if (
    filters.category &&
    filters.category !== 'all' &&
    isProductCategoryFilter(filters.category)
  ) {
    segments.push(`category-${filters.category}`);
  }

  if (filters.pharmacyId) {
    const pharmacySegment = getPharmacySegment(filters.pharmacyId, pharmacies);
    if (pharmacySegment) segments.push(pharmacySegment);
  }

  return segments.length
    ? `${ROUTES.PRODUCTS_CATALOG}/${segments.join('/')}`
    : ROUTES.PRODUCTS_CATALOG;
}

//===================================================================

export function buildProductCatalogPath(
  filters: Partial<ProductCatalogFilters>,
  pharmacies: readonly PharmacyOption[] = []
): string {
  const segments: string[] = [];

  if (filters.name) {
    const value = slugifySegment(filters.name);
    if (value) segments.push(`search-name-${value}`);
  }

  if (filters.article) {
    const value = slugifySegment(filters.article);
    if (value) segments.push(`article-${value}`);
  }

  if (
    filters.category &&
    filters.category !== 'all' &&
    isProductCategoryFilter(filters.category)
  ) {
    segments.push(`category-${filters.category}`);
  }

  if (
    filters.availability &&
    filters.availability !== 'all' &&
    isProductAvailabilityFilter(filters.availability)
  ) {
    segments.push(`availability-${filters.availability}`);
  }

  if (filters.pharmacyId) {
    const pharmacySegment = getPharmacySegment(filters.pharmacyId, pharmacies);
    if (pharmacySegment) segments.push(pharmacySegment);
  }

  if (
    filters.sort &&
    filters.sort !== 'newest' &&
    isProductSortFilter(filters.sort)
  ) {
    segments.push(`sort-${filters.sort}`);
  }

  if (filters.page && filters.page > 1 && Number.isSafeInteger(filters.page)) {
    segments.push(`page-${filters.page}`);
  }

  return segments.length
    ? `${ROUTES.PRODUCTS_CATALOG}/${segments.join('/')}`
    : ROUTES.PRODUCTS_CATALOG;
}

//===================================================================

export function buildProductCatalogCanonicalPath(
  filters: ProductCatalogFilters,
  pharmacies: readonly PharmacyOption[] = []
): string {
  return isProductCatalogNoIndex(filters)
    ? buildProductCatalogIndexedPath(filters, pharmacies)
    : buildProductCatalogPath(filters, pharmacies);
}
