import { isProductCategorySlug } from '@e-pharmacy/validation/reference-data';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  DEFAULT_OWN_PRODUCTS_FILTERS,
  type OwnProductsFilterState,
  type OwnProductsStockFilter,
} from './own-products-filters';

import { OWN_PRODUCT_STATUSES, STOCK_AVAILABILITY_FILTERS } from './products';

//===================================================================

type OwnProductsFilterDraft = {
  createdDate: {
    from: string;
    to: string;
  };

  productId: string;
  pharmacyId: string;
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

export type OwnProductsPagination = Readonly<{
  page: number;
  perPage: 20 | 50 | 100;
}>;

export const DEFAULT_OWN_PRODUCTS_PAGINATION: OwnProductsPagination = {
  page: 1,
  perPage: 20,
};

//===================================================================

export function parseOwnProductsPaginationSegments(
  params: OwnProductsRouteParams = {}
): OwnProductsPagination {
  let page = 1;
  let perPage: OwnProductsPagination['perPage'] = 20;

  for (const segment of params.filters ?? []) {
    const pageMatch = /^page-([1-9]\d*)$/.exec(segment);
    const sizeMatch = /^per-page-(20|50|100)$/.exec(segment);

    if (pageMatch && Number.isSafeInteger(Number(pageMatch[1])))
      page = Number(pageMatch[1]);

    if (sizeMatch)
      perPage = Number(sizeMatch[1]) as OwnProductsPagination['perPage'];
  }

  return { page, perPage };
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
    segment.startsWith('product-id-') ||
    segment.startsWith('pharmacy-id-') ||
    /^page-[1-9]\d*$/.test(segment) ||
    /^per-page-(20|50|100)$/.test(segment) ||
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
    if (segment.startsWith('product-id-')) {
      const id = segment.slice('product-id-'.length);

      if (isValidObjectId(id)) filters.productId = id;

      continue;
    }

    if (segment.startsWith('pharmacy-id-')) {
      const id = segment.slice('pharmacy-id-'.length);

      if (isValidObjectId(id)) filters.pharmacyId = id;

      continue;
    }

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
      const rawCategory = segment.slice('category-'.length);

      const category = rawCategory.includes('-')
        ? rawCategory.replace(/-/g, '_')
        : rawCategory;

      if (isProductCategorySlug(category)) {
        filters.category = category;
      }

      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeSlugEnumValue(
        segment.replace('status-', ''),
        OWN_PRODUCT_STATUSES
      );

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

export function buildOwnProductsPath(
  filters: OwnProductsFilterState,
  pagination: OwnProductsPagination = DEFAULT_OWN_PRODUCTS_PAGINATION
): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.createdDate);
  const name = filters.name.trim();
  const article = filters.article.trim();

  if (filters.pharmacyId && isValidObjectId(filters.pharmacyId))
    segments.push(`pharmacy-id-${filters.pharmacyId}`);

  if (filters.productId && isValidObjectId(filters.productId))
    segments.push(`product-id-${filters.productId}`);

  if (name) {
    segments.push(`product-name-${slugifySegment(name)}`);
  }

  if (article) {
    segments.push(`product-article-${slugifySegment(article)}`);
  }

  if (filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
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

  if (pagination.perPage !== 20)
    segments.push(`per-page-${pagination.perPage}`);

  if (pagination.page > 1 && Number.isSafeInteger(pagination.page))
    segments.push(`page-${pagination.page}`);

  return segments.length
    ? `${PHARMACY_ROUTES.PRODUCTS}/${segments.join('/')}`
    : PHARMACY_ROUTES.PRODUCTS;
}

//===================================================================

/** Filter URLs for the Products tab of a particular pharmacy.
 * The pharmacy is encoded in the parent route, not repeated as a filter.
 */
export function buildEmbeddedOwnProductsPath(
  pharmacyId: string,
  filters: OwnProductsFilterState,
  pagination: OwnProductsPagination = DEFAULT_OWN_PRODUCTS_PAGINATION
): string {
  if (!isValidObjectId(pharmacyId)) throw new TypeError('Invalid pharmacy ID.');

  const ownerPath = buildOwnProductsPath(
    { ...filters, pharmacyId: '' },
    pagination
  );

  const base = `${PHARMACY_ROUTES.PHARMACIES}/${pharmacyId}/products`;

  return `${base}${ownerPath.slice(PHARMACY_ROUTES.PRODUCTS.length)}`;
}
