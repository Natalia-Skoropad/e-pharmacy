import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation';
import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';

import { PHARMACY_PRODUCTS } from '@/lib/layout/routes';

import type {
  OwnProductsFilterState,
  OwnProductsStockFilter,
} from './own-products-filters';
import type { OwnProductStatus } from './products';

//===================================================================

const URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9 .-]/g;
const URL_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9.-]/g;
const SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9]+/g;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

const OWN_PRODUCT_STATUSES: OwnProductStatus[] = ['active', 'blocked'];
const OWN_PRODUCT_STOCK_FILTERS: Array<Exclude<OwnProductsStockFilter, 'all'>> =
  ['available', 'empty'];

//===================================================================

type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

type OwnProductsFilterDraft = {
  addedDate: {
    from: string;
    to: string;
  };
  name: string;
  article: string;
  category: OwnProductsFilterState['category'];
  status: OwnProductsFilterState['status'];
  stock: OwnProductsFilterState['stock'];
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

function isValidOwnProductDate(value?: string): boolean {
  return Boolean(value && DATE_PATTERN.test(value));
}

//===================================================================

function isOwnProductCategory(value?: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}

//===================================================================

function normalizeStatusSegment(value: string): OwnProductStatus | null {
  const normalized = value.replace(/-/g, '_');

  return OWN_PRODUCT_STATUSES.includes(normalized as OwnProductStatus)
    ? (normalized as OwnProductStatus)
    : null;
}

//===================================================================

function normalizeStockSegment(
  value: string
): Exclude<OwnProductsStockFilter, 'all'> | null {
  return OWN_PRODUCT_STOCK_FILTERS.includes(
    value as Exclude<OwnProductsStockFilter, 'all'>
  )
    ? (value as Exclude<OwnProductsStockFilter, 'all'>)
    : null;
}

//===================================================================

function slugifyStatus(status: OwnProductStatus): string {
  return status.replace(/_/g, '-');
}

//===================================================================

export type OwnProductsRouteParams = Readonly<{
  filters?: string[];
}>;

//===================================================================

export function isOwnProductsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('search-name-') ||
    segment.startsWith('article-') ||
    segment.startsWith('category-') ||
    segment.startsWith('status-') ||
    segment.startsWith('stock-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-')
  );
}

//===================================================================

export function isOwnProductsFilterRoute(
  segments: string[] | undefined
): boolean {
  return !segments?.length || segments.every(isOwnProductsFilterSegment);
}

//===================================================================

export function parseOwnProductsSegments(
  params: OwnProductsRouteParams = {}
): OwnProductsFilterState {
  const filters: OwnProductsFilterDraft = {
    addedDate: {
      from: '',
      to: '',
    },
    name: '',
    article: '',
    category: 'all',
    status: 'all',
    stock: 'all',
  };

  for (const segment of params.filters ?? []) {
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

    if (segment.startsWith('category-')) {
      const category = segment.replace('category-', '').replace(/-/g, '_');

      if (isOwnProductCategory(category)) {
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

    if (segment.startsWith('stock-')) {
      const stock = normalizeStockSegment(segment.replace('stock-', ''));

      if (stock) {
        filters.stock = stock;
      }

      continue;
    }

    if (segment.startsWith('date-from-')) {
      const dateFrom = segment.replace('date-from-', '');

      if (isValidOwnProductDate(dateFrom)) {
        filters.addedDate = {
          ...filters.addedDate,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isValidOwnProductDate(dateTo)) {
        filters.addedDate = {
          ...filters.addedDate,
          to: dateTo,
        };
      }
    }
  }

  return filters;
}

//===================================================================

export function buildOwnProductsPath(filters: OwnProductsFilterState): string {
  const segments: string[] = [];
  const name = filters.name.trim();
  const article = filters.article.trim();

  if (name) {
    segments.push(`search-name-${slugifySegment(name)}`);
  }

  if (article) {
    segments.push(`article-${slugifySegment(article)}`);
  }

  if (filters.category !== 'all') {
    segments.push(`category-${filters.category.replace(/_/g, '-')}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (filters.stock !== 'all') {
    segments.push(`stock-${filters.stock}`);
  }

  if (filters.addedDate.from) {
    segments.push(`date-from-${filters.addedDate.from}`);
  }

  if (filters.addedDate.to) {
    segments.push(`date-to-${filters.addedDate.to}`);
  }

  return segments.length
    ? `${PHARMACY_PRODUCTS}/${segments.join('/')}`
    : PHARMACY_PRODUCTS;
}
