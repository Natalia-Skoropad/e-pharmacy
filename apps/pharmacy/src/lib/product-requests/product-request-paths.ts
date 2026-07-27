import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import { isProductCategory } from '@e-pharmacy/validation/products';
import { PHARMACY_ROUTES } from '@/lib/routes';

import { DEFAULT_PRODUCT_REQUESTS_FILTERS } from './product-requests';
import type { ProductRequestsFilterState } from './product-requests';

//===================================================================

type ProductRequestCategoryFilter = ProductRequestsFilterState['category'];
type ProductRequestStatusFilter = ProductRequestsFilterState['status'];

//===================================================================

type ProductRequestsFilterDraft = {
  date: {
    from: string;
    to: string;
  };
  requestNumber: string;
  productArticle: string;
  productName: string;
  category: ProductRequestCategoryFilter;
  status: ProductRequestStatusFilter;
};

//===================================================================

export type ProductRequestsRouteParams = Readonly<{
  filters?: string[];
}>;

//===================================================================

export function isProductRequestsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('request-number-') ||
    segment.startsWith('product-article-') ||
    segment.startsWith('product-name-') ||
    segment.startsWith('search-name-') ||
    segment.startsWith('article-') ||
    segment.startsWith('category-') ||
    segment.startsWith('status-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-')
  );
}

//===================================================================

export function isProductRequestsFilterRoute(
  segments: string[] | undefined
): boolean {
  return !segments?.length || segments.every(isProductRequestsFilterSegment);
}

//===================================================================

export function parseProductRequestsSegments(
  params: ProductRequestsRouteParams = {}
): ProductRequestsFilterState {
  const filters: ProductRequestsFilterDraft = {
    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
    date: { ...DEFAULT_PRODUCT_REQUESTS_FILTERS.date },
  };

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('request-number-')) {
      filters.requestNumber = deslugifyArticleSegment(
        segment.replace('request-number-', '')
      );
      continue;
    }

    if (segment.startsWith('product-article-')) {
      filters.productArticle = deslugifyArticleSegment(
        segment.replace('product-article-', '')
      );
      continue;
    }

    if (segment.startsWith('product-name-')) {
      filters.productName = deslugifyNameSegment(
        segment.replace('product-name-', '')
      );
      continue;
    }

    if (segment.startsWith('search-name-')) {
      filters.productName = deslugifyNameSegment(
        segment.replace('search-name-', '')
      );
      continue;
    }

    if (segment.startsWith('article-')) {
      filters.productArticle = deslugifyArticleSegment(
        segment.replace('article-', '')
      );
      continue;
    }

    if (segment.startsWith('category-')) {
      const category = segment.replace('category-', '').replace(/-/g, '_');

      if (isProductCategory(category)) {
        filters.category = category;
      }

      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeSlugEnumValue(
        segment.replace('status-', ''),
        PRODUCT_REQUEST_STATUSES
      );

      if (status) {
        filters.status = status;
      }

      continue;
    }

    if (segment.startsWith('date-from-')) {
      const dateFrom = segment.replace('date-from-', '');

      if (isDateParam(dateFrom)) {
        filters.date = {
          ...filters.date,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isDateParam(dateTo)) {
        filters.date = {
          ...filters.date,
          to: dateTo,
        };
      }
    }
  }

  if (!isDateRangeValid(filters.date)) {
    filters.date = { ...DEFAULT_PRODUCT_REQUESTS_FILTERS.date };
  }

  return filters;
}

//===================================================================

export function buildProductRequestsPath(
  filters: ProductRequestsFilterState
): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.date);
  const requestNumber = filters.requestNumber.trim();
  const productArticle = filters.productArticle.trim();
  const productName = filters.productName.trim();

  if (requestNumber) {
    segments.push(`request-number-${slugifySegment(requestNumber)}`);
  }

  if (productArticle) {
    segments.push(`product-article-${slugifySegment(productArticle)}`);
  }

  if (productName) {
    segments.push(`product-name-${slugifySegment(productName)}`);
  }

  if (filters.category !== 'all') {
    segments.push(`category-${filters.category.replace(/_/g, '-')}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (dateRangeIsValid && filters.date.from) {
    segments.push(`date-from-${filters.date.from}`);
  }

  if (dateRangeIsValid && filters.date.to) {
    segments.push(`date-to-${filters.date.to}`);
  }

  return segments.length
    ? `${PHARMACY_ROUTES.PRODUCT_REQUESTS}/${segments.join('/')}`
    : PHARMACY_ROUTES.PRODUCT_REQUESTS;
}
