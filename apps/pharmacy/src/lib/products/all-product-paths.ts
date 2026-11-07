import { isProductCategorySlug } from '@e-pharmacy/validation/reference-data';

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

import { OWN_PRODUCT_STATUSES } from './products';

import {
  DEFAULT_ALL_PRODUCTS_FILTERS,
  type AllProductsAddedToMyPharmacyFilter,
  type AllProductsFilterState,
} from './all-products-filters';

//===================================================================

const ADDED_TO_MY_PHARMACY_FILTERS = [
  'yes',
  'no',
] as const satisfies ReadonlyArray<
  Exclude<AllProductsAddedToMyPharmacyFilter, 'all'>
>;

//===================================================================

type AllProductsFilterDraft = {
  createdDate: {
    from: string;
    to: string;
  };

  productId: string;
  name: string;
  article: string;
  category: AllProductsFilterState['category'];
  status: AllProductsFilterState['status'];
  addedToMyPharmacy: AllProductsFilterState['addedToMyPharmacy'];
};

//===================================================================

export type AllProductsRouteParams = Readonly<{
  filters?: string[];
}>;

//===================================================================

export type AllProductsPagination = Readonly<{
  page: number;
  perPage: 20 | 50 | 100;
}>;

export const DEFAULT_ALL_PRODUCTS_PAGINATION: AllProductsPagination = {
  page: 1,
  perPage: 20,
};

//===================================================================

/** Query-free canonical pagination, matching the owner Pharmacies registry. */
export function parseAllProductsPaginationSegments(
  params: AllProductsRouteParams = {}
): AllProductsPagination {
  let page = DEFAULT_ALL_PRODUCTS_PAGINATION.page;
  let perPage = DEFAULT_ALL_PRODUCTS_PAGINATION.perPage;

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('page-')) {
      const raw = segment.slice('page-'.length);
      const value = Number(raw);

      if (/^[1-9]\d*$/.test(raw) && Number.isSafeInteger(value)) {
        page = value;
      }
    } else if (segment.startsWith('per-page-')) {
      const raw = segment.slice('per-page-'.length);

      if (raw === '20' || raw === '50' || raw === '100') {
        perPage = Number(raw) as AllProductsPagination['perPage'];
      }
    }
  }

  return { page, perPage };
}

//===================================================================

function normalizeAddedToMyPharmacySegment(
  value: string
): Exclude<AllProductsAddedToMyPharmacyFilter, 'all'> | null {
  return normalizeSlugEnumValue(value, ADDED_TO_MY_PHARMACY_FILTERS);
}

//===================================================================

export function isAllProductsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('product-id-') ||
    segment.startsWith('product-name-') ||
    segment.startsWith('product-article-') ||
    segment.startsWith('search-name-') ||
    segment.startsWith('article-') ||
    segment.startsWith('category-') ||
    segment.startsWith('status-') ||
    segment.startsWith('added-to-my-pharmacy-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-') ||
    segment.startsWith('page-') ||
    segment.startsWith('per-page-')
  );
}

//===================================================================

export function isAllProductsFilterRoute(
  segments: string[] | undefined
): boolean {
  return !segments?.length || segments.every(isAllProductsFilterSegment);
}

//===================================================================

export function parseAllProductsSegments(
  params: AllProductsRouteParams = {}
): AllProductsFilterState {
  const filters: AllProductsFilterDraft = {
    ...DEFAULT_ALL_PRODUCTS_FILTERS,
    createdDate: { ...DEFAULT_ALL_PRODUCTS_FILTERS.createdDate },
  };

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('product-id-')) {
      const productId = segment.slice('product-id-'.length);

      if (/^[0-9a-f]{24}$/i.test(productId))
        filters.productId = productId.toLowerCase();

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

    if (segment.startsWith('added-to-my-pharmacy-')) {
      const addedToMyPharmacy = normalizeAddedToMyPharmacySegment(
        segment.replace('added-to-my-pharmacy-', '')
      );

      if (addedToMyPharmacy) {
        filters.addedToMyPharmacy = addedToMyPharmacy;
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
    filters.createdDate = { ...DEFAULT_ALL_PRODUCTS_FILTERS.createdDate };
  }

  return filters;
}

//===================================================================

export function buildAllProductsPath(
  filters: AllProductsFilterState,
  pagination: AllProductsPagination = DEFAULT_ALL_PRODUCTS_PAGINATION
): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.createdDate);
  const name = filters.name.trim();
  const article = filters.article.trim();

  if (filters.productId) segments.push(`product-id-${filters.productId}`);

  if (article) {
    segments.push(`product-article-${slugifySegment(article)}`);
  }

  if (name) {
    segments.push(`product-name-${slugifySegment(name)}`);
  }

  if (filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (filters.addedToMyPharmacy !== 'all') {
    segments.push(`added-to-my-pharmacy-${filters.addedToMyPharmacy}`);
  }

  if (dateRangeIsValid && filters.createdDate.from) {
    segments.push(`date-from-${filters.createdDate.from}`);
  }

  if (dateRangeIsValid && filters.createdDate.to) {
    segments.push(`date-to-${filters.createdDate.to}`);
  }

  if (Number.isSafeInteger(pagination.page) && pagination.page > 1) {
    segments.push(`page-${pagination.page}`);
  }

  if (pagination.perPage === 50 || pagination.perPage === 100) {
    segments.push(`per-page-${pagination.perPage}`);
  }

  return segments.length
    ? `${PHARMACY_ROUTES.ALL_PRODUCTS}/${segments.join('/')}`
    : PHARMACY_ROUTES.ALL_PRODUCTS;
}
