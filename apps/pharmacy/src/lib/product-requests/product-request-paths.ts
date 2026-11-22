import {
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import { isProductCategorySlug } from '@e-pharmacy/validation/reference-data';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  type ProductRequestsFilterState,
} from './product-requests';

//===================================================================

export type ProductRequestsRouteParams = Readonly<{ filters?: string[] }>;

export type ProductRequestsPagination = Readonly<{
  page: number;
  perPage: 20 | 50 | 100;
}>;

export const DEFAULT_PRODUCT_REQUESTS_PAGINATION: ProductRequestsPagination = {
  page: 1,
  perPage: 20,
};

//===================================================================

export function isProductRequestsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('request-id-') ||
    segment.startsWith('product-id-') ||
    segment.startsWith('request-product-id-') ||
    segment.startsWith('category-') ||
    segment.startsWith('status-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-') ||
    segment.startsWith('page-') ||
    segment.startsWith('per-page-') ||
    // Previous URL formats are accepted for normalization, not emitted.
    segment.startsWith('request-number-') ||
    segment.startsWith('product-article-') ||
    segment.startsWith('product-name-') ||
    segment.startsWith('search-name-') ||
    segment.startsWith('article-') ||
    segment === 'category-mode-custom'
  );
}

//===================================================================

export function isProductRequestsFilterRoute(
  segments: string[] | undefined
): boolean {
  return !segments?.length || segments.every(isProductRequestsFilterSegment);
}

//===================================================================

export function parseProductRequestsPaginationSegments(
  params: ProductRequestsRouteParams = {}
): ProductRequestsPagination {
  let page = 1;
  let perPage: ProductRequestsPagination['perPage'] = 20;

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('page-')) {
      const raw = segment.slice(5);
      const number = Number(raw);

      if (/^[1-9]\d*$/.test(raw) && Number.isSafeInteger(number)) page = number;
    }

    if (segment.startsWith('per-page-')) {
      const raw = segment.slice('per-page-'.length);

      if (raw === '20' || raw === '50' || raw === '100') {
        perPage = Number(raw) as ProductRequestsPagination['perPage'];
      }
    }
  }

  return { page, perPage };
}

//===================================================================

export function parseProductRequestsSegments(
  params: ProductRequestsRouteParams = {}
): ProductRequestsFilterState {
  const filters: {
    date: { from: string; to: string };
    requestId: string;
    productId: string;
    category: ProductRequestsFilterState['category'];
    status: ProductRequestsFilterState['status'];
  } = {
    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
    date: { ...DEFAULT_PRODUCT_REQUESTS_FILTERS.date },
  };

  for (const segment of params.filters ?? []) {
    if (
      segment.startsWith('request-id-') ||
      segment.startsWith('request-number-')
    ) {
      const id = segment.slice(
        segment.startsWith('request-id-')
          ? 'request-id-'.length
          : 'request-number-'.length
      );

      if (/^[a-f0-9]{24}$/i.test(id)) filters.requestId = id.toLowerCase();

      continue;
    }

    if (segment.startsWith('product-id-')) {
      const id = segment.slice('product-id-'.length);

      if (/^[a-f0-9]{24}$/i.test(id)) filters.productId = id.toLowerCase();

      continue;
    }

    if (segment.startsWith('request-product-id-')) {
      const id = segment.slice('request-product-id-'.length);

      // Legacy links selected an unlinked request as if it were a global
      // product. Preserve the request selection and canonicalize the URL.
      if (/^[a-f0-9]{24}$/i.test(id) && !filters.requestId)
        filters.requestId = id.toLowerCase();

      continue;
    }

    if (segment === 'category-mode-custom') {
      filters.category = CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER;
      continue;
    }

    if (segment.startsWith('category-')) {
      const slug = segment.slice('category-'.length).replace(/-/g, '_');

      if (isProductCategorySlug(slug)) filters.category = slug;

      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeSlugEnumValue(
        segment.slice(7),
        PRODUCT_REQUEST_STATUSES
      );

      if (status) filters.status = status;

      continue;
    }

    if (segment.startsWith('date-from-')) {
      const date = segment.slice('date-from-'.length);

      if (isDateParam(date)) filters.date.from = date;

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const date = segment.slice('date-to-'.length);

      if (isDateParam(date)) filters.date.to = date;
    }
  }

  if (!isDateRangeValid(filters.date)) {
    filters.date = { ...DEFAULT_PRODUCT_REQUESTS_FILTERS.date };
  }

  return filters;
}

//===================================================================

export function buildProductRequestsPath(
  filters: ProductRequestsFilterState,
  pagination: ProductRequestsPagination = DEFAULT_PRODUCT_REQUESTS_PAGINATION
): string {
  const segments: string[] = [];

  if (filters.requestId) segments.push(`request-id-${filters.requestId}`);

  if (filters.productId && !filters.productId.startsWith('request-')) {
    segments.push(`product-id-${filters.productId}`);
  }

  if (filters.category === CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER) {
    segments.push('category-mode-custom');
  } else if (filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.status !== 'all')
    segments.push(`status-${slugifyStatus(filters.status)}`);

  if (isDateRangeValid(filters.date)) {
    if (filters.date.from) segments.push(`date-from-${filters.date.from}`);
    if (filters.date.to) segments.push(`date-to-${filters.date.to}`);
  }

  if (Number.isSafeInteger(pagination.page) && pagination.page > 1) {
    segments.push(`page-${pagination.page}`);
  }

  if (pagination.perPage === 50 || pagination.perPage === 100) {
    segments.push(`per-page-${pagination.perPage}`);
  }

  return segments.length
    ? `${PHARMACY_ROUTES.PRODUCT_REQUESTS}/${segments.join('/')}`
    : PHARMACY_ROUTES.PRODUCT_REQUESTS;
}
