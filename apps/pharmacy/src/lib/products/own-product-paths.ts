import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation';

import { isProductCategory } from '@e-pharmacy/types/products';

import { PHARMACY_PRODUCTS } from '@/lib/layout/routes';

import {
  DEFAULT_OWN_PRODUCTS_FILTERS,
  type OwnProductsFilterState,
  type OwnProductsStockFilter,
} from './own-products-filters';

import {
  OWN_PRODUCT_STATUSES,
  STOCK_AVAILABILITY_FILTERS,
  type OwnProductStatus,
} from './products';

//===================================================================

type OwnProductsFilterDraft = {
  createdDate: {
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

export type OwnProductsRouteParams = Readonly<{
  filters?: string[];
}>;

//===================================================================

function normalizeStatusSegment(value: string): OwnProductStatus | null {
  return normalizeSlugEnumValue(value, OWN_PRODUCT_STATUSES);
}

//===================================================================

function normalizeStockSegment(
  value: string
): Exclude<OwnProductsStockFilter, 'all'> | null {
  if (value === 'in-stock') return 'in-stock';

  return normalizeSlugEnumValue(value, STOCK_AVAILABILITY_FILTERS);
}

//===================================================================

export function isOwnProductsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('product-name-') ||
    segment.startsWith('product-article-') ||
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
    ...DEFAULT_OWN_PRODUCTS_FILTERS,
    createdDate: { ...DEFAULT_OWN_PRODUCTS_FILTERS.createdDate },
  };

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('product-name-')) {
      filters.name = deslugifyNameSegment(segment.replace('product-name-', ''));
      continue;
    }

    if (segment.startsWith('search-name-')) {
      filters.name = deslugifyNameSegment(segment.replace('search-name-', ''));
      continue;
    }

    if (segment.startsWith('product-article-')) {
      filters.article = deslugifyArticleSegment(
        segment.replace('product-article-', '')
      );
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

    if (segment.startsWith('stock-')) {
      const stock = normalizeStockSegment(segment.replace('stock-', ''));

      if (stock) {
        filters.stock = stock;
      }

      continue;
    }

    if (segment.startsWith('date-from-')) {
      const dateFrom = segment.replace('date-from-', '');

      if (isDateParam(dateFrom)) {
        filters.createdDate = {
          ...filters.createdDate,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isDateParam(dateTo)) {
        filters.createdDate = {
          ...filters.createdDate,
          to: dateTo,
        };
      }
    }
  }

  if (!isDateRangeValid(filters.createdDate)) {
    filters.createdDate = { ...DEFAULT_OWN_PRODUCTS_FILTERS.createdDate };
  }

  return filters;
}

//===================================================================

export function buildOwnProductsPath(filters: OwnProductsFilterState): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.createdDate);
  const name = filters.name.trim();
  const article = filters.article.trim();

  if (name) {
    segments.push(`product-name-${slugifySegment(name)}`);
  }

  if (article) {
    segments.push(`product-article-${slugifySegment(article)}`);
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

  if (dateRangeIsValid && filters.createdDate.from) {
    segments.push(`date-from-${filters.createdDate.from}`);
  }

  if (dateRangeIsValid && filters.createdDate.to) {
    segments.push(`date-to-${filters.createdDate.to}`);
  }

  return segments.length
    ? `${PHARMACY_PRODUCTS}/${segments.join('/')}`
    : PHARMACY_PRODUCTS;
}
