import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  slugifySegment,
} from '@e-pharmacy/validation/url';

import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import { isValidObjectId } from '@/lib/routes';

import { parsePositivePageParam } from './catalog-param-utils';

import {
  isProductAvailabilityFilter,
  isProductCatalogNoIndex,
  isProductCategoryFilter,
  isProductSortFilter,
  type ProductCatalogFilters,
  type ProductCatalogRouteParams,
} from './product-catalog-filters';

//===================================================================

function getPharmacySegment(
  pharmacyId: string,
  pharmacies: PharmacyOption[]
): string {
  const pharmacy = pharmacies.find((item) => item.id === pharmacyId);
  const pharmacySlug = pharmacy ? slugifySegment(pharmacy.name) : 'pharmacy';

  return `pharmacy-${pharmacySlug}-${pharmacyId}`;
}

//===================================================================

export function parseProductCatalogSegments(
  params: ProductCatalogRouteParams = {}
): ProductCatalogFilters {
  const filters: ProductCatalogFilters = {
    name: '',
    article: '',
    category: 'all',
    availability: 'all',
    sort: 'newest',
    page: 1,
  };

  for (const segment of params.segments ?? []) {
    if (segment.startsWith('category-')) {
      const category = segment.replace('category-', '');

      if (isProductCategoryFilter(category)) filters.category = category;
      continue;
    }

    if (segment.startsWith('availability-')) {
      const availability = segment.replace('availability-', '');

      if (isProductAvailabilityFilter(availability)) {
        filters.availability = availability;
      }
      continue;
    }

    if (segment.startsWith('sort-')) {
      const sort = segment.replace('sort-', '');

      if (isProductSortFilter(sort)) filters.sort = sort;
      continue;
    }

    if (segment.startsWith('page-')) {
      filters.page = parsePositivePageParam(segment.replace('page-', ''));
      continue;
    }

    if (segment.startsWith('search-name-')) {
      filters.name = deslugifyNameSegment(segment.replace('search-name-', ''));
      continue;
    }

    if (segment.startsWith('article-')) {
      filters.article = deslugifyArticleSegment(
        segment.replace('article-', '')
      );
      continue;
    }

    if (segment.startsWith('pharmacy-')) {
      const pharmacyId = segment.match(/-([a-f\d]{24})$/i)?.[1];

      if (isValidObjectId(pharmacyId)) filters.pharmacyId = pharmacyId;
    }
  }

  return filters;
}

//===================================================================

export function buildProductCatalogIndexedPath(
  filters: Partial<ProductCatalogFilters>,
  pharmacies: PharmacyOption[] = []
): string {
  const segments: string[] = [];

  if (filters.category && filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.pharmacyId) {
    segments.push(getPharmacySegment(filters.pharmacyId, pharmacies));
  }

  return segments.length
    ? `/product-catalog/${segments.join('/')}`
    : '/product-catalog';
}

//===================================================================

export function buildProductCatalogPath(
  filters: Partial<ProductCatalogFilters>,
  pharmacies: PharmacyOption[] = []
): string {
  const segments: string[] = [];

  if (filters.name)
    segments.push(`search-name-${slugifySegment(filters.name)}`);
  if (filters.article)
    segments.push(`article-${slugifySegment(filters.article)}`);

  if (filters.category && filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.availability && filters.availability !== 'all') {
    segments.push(`availability-${filters.availability}`);
  }

  if (filters.pharmacyId) {
    segments.push(getPharmacySegment(filters.pharmacyId, pharmacies));
  }

  if (filters.sort && filters.sort !== 'newest') {
    segments.push(`sort-${filters.sort}`);
  }

  if (filters.page && filters.page > 1) {
    segments.push(`page-${filters.page}`);
  }

  return segments.length
    ? `/product-catalog/${segments.join('/')}`
    : '/product-catalog';
}

//===================================================================

export function buildProductCatalogCanonicalPath(
  filters: ProductCatalogFilters,
  pharmacies: PharmacyOption[] = []
): string {
  return isProductCatalogNoIndex(filters)
    ? buildProductCatalogIndexedPath(filters, pharmacies)
    : buildProductCatalogPath(filters, pharmacies);
}

//===================================================================

export function hasLegacyProductCatalogSegments(
  params: ProductCatalogRouteParams = {}
): boolean {
  void params;

  return false;
}
