import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
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
  return normalizeSlugEnumValue(value, STOCK_AVAILABILITY_FILTERS);
}

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
    ...DEFAULT_OWN_PRODUCTS_FILTERS,
    addedDate: { ...DEFAULT_OWN_PRODUCTS_FILTERS.addedDate },
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
        filters.addedDate = {
          ...filters.addedDate,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isDateParam(dateTo)) {
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
