import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation';

import { isProductCategory } from '@e-pharmacy/types/products';

import { PHARMACY_PRODUCT_REQUESTS } from '../layout/routes';

import type {
  ProductRequestStatus,
  ProductRequestsFilterState,
} from './product-requests';

//===================================================================

const PRODUCT_REQUEST_STATUSES: ProductRequestStatus[] = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
];

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

function normalizeStatusSegment(value: string): ProductRequestStatus | null {
  const normalized = value.replace(/-/g, '_');

  return PRODUCT_REQUEST_STATUSES.includes(normalized as ProductRequestStatus)
    ? (normalized as ProductRequestStatus)
    : null;
}

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
    date: {
      from: '',
      to: '',
    },
    requestNumber: '',
    productArticle: '',
    productName: '',
    category: 'all',
    status: 'all',
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
      const status = normalizeStatusSegment(segment.replace('status-', ''));

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

  return filters;
}

//===================================================================

export function buildProductRequestsPath(
  filters: ProductRequestsFilterState
): string {
  const segments: string[] = [];
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

  if (filters.date.from) {
    segments.push(`date-from-${filters.date.from}`);
  }

  if (filters.date.to) {
    segments.push(`date-to-${filters.date.to}`);
  }

  return segments.length
    ? `${PHARMACY_PRODUCT_REQUESTS}/${segments.join('/')}`
    : PHARMACY_PRODUCT_REQUESTS;
}
