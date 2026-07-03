import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation';
import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';

import { PHARMACY_PRODUCT_REQUESTS } from '../layout/routes';

import type {
  ProductRequestStatus,
  ProductRequestsFilterState,
} from './product-requests';

//===================================================================

const URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9 .-]/g;
const URL_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9.-]/g;
const SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9]+/g;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

const PRODUCT_REQUEST_STATUSES: ProductRequestStatus[] = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
];

//===================================================================

type ProductRequestCategory = (typeof PRODUCT_CATEGORIES)[number];
type ProductRequestCategoryFilter = ProductRequestsFilterState['category'];
type ProductRequestStatusFilter = ProductRequestsFilterState['status'];

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

function sanitizeTextParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
  );
}

//===================================================================

function sanitizeArticleParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(URL_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
  );
}

//===================================================================

function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(SLUG_SEGMENT_SEPARATOR_PATTERN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USER_SEARCH_MAX_LENGTH);
}

//===================================================================

function deslugifyNameSegment(value: string): string {
  return sanitizeTextParam(value.replace(/-/g, ' '));
}

//===================================================================

function deslugifyArticleSegment(value: string): string {
  return sanitizeArticleParam(value);
}

//===================================================================

function isValidProductRequestDate(value?: string): boolean {
  return Boolean(value && DATE_PATTERN.test(value));
}

//===================================================================

function isProductRequestCategory(
  value?: string
): value is ProductRequestCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductRequestCategory);
}

//===================================================================

function normalizeStatusSegment(value: string): ProductRequestStatus | null {
  const normalized = value.replace(/-/g, '_');

  return PRODUCT_REQUEST_STATUSES.includes(normalized as ProductRequestStatus)
    ? (normalized as ProductRequestStatus)
    : null;
}

//===================================================================

function slugifyStatus(status: ProductRequestStatus): string {
  return status.replace(/_/g, '-');
}

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

      if (isProductRequestCategory(category)) {
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

      if (isValidProductRequestDate(dateFrom)) {
        filters.date = {
          ...filters.date,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isValidProductRequestDate(dateTo)) {
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
