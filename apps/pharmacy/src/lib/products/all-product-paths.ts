import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation';

import { isProductCategory } from '@e-pharmacy/types/products';

import { PHARMACY_ALL_PRODUCTS } from '@/lib/layout/routes';

import type { OwnProductStatus } from './products';

import type {
  AllProductsAddedToMyPharmacyFilter,
  AllProductsFilterState,
} from './all-products-filters';

//===================================================================

const ALL_PRODUCT_STATUSES: OwnProductStatus[] = ['active', 'blocked'];

const ADDED_TO_MY_PHARMACY_FILTERS: Array<
  Exclude<AllProductsAddedToMyPharmacyFilter, 'all'>
> = ['yes', 'no'];

//===================================================================

type AllProductsFilterDraft = {
  createdDate: {
    from: string;
    to: string;
  };
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

function normalizeStatusSegment(value: string): OwnProductStatus | null {
  const normalized = value.replace(/-/g, '_');

  return ALL_PRODUCT_STATUSES.includes(normalized as OwnProductStatus)
    ? (normalized as OwnProductStatus)
    : null;
}

//===================================================================

function normalizeAddedToMyPharmacySegment(
  value: string
): Exclude<AllProductsAddedToMyPharmacyFilter, 'all'> | null {
  return ADDED_TO_MY_PHARMACY_FILTERS.includes(
    value as Exclude<AllProductsAddedToMyPharmacyFilter, 'all'>
  )
    ? (value as Exclude<AllProductsAddedToMyPharmacyFilter, 'all'>)
    : null;
}

//===================================================================

export function isAllProductsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('product-name-') ||
    segment.startsWith('product-article-') ||
    segment.startsWith('search-name-') ||
    segment.startsWith('article-') ||
    segment.startsWith('category-') ||
    segment.startsWith('status-') ||
    segment.startsWith('added-to-my-pharmacy-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-')
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
    createdDate: {
      from: '',
      to: '',
    },
    name: '',
    article: '',
    category: 'all',
    status: 'all',
    addedToMyPharmacy: 'all',
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

  return filters;
}

//===================================================================

export function buildAllProductsPath(filters: AllProductsFilterState): string {
  const segments: string[] = [];
  const name = filters.name.trim();
  const article = filters.article.trim();

  if (article) {
    segments.push(`product-article-${slugifySegment(article)}`);
  }

  if (name) {
    segments.push(`product-name-${slugifySegment(name)}`);
  }

  if (filters.category !== 'all') {
    segments.push(`category-${filters.category.replace(/_/g, '-')}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (filters.addedToMyPharmacy !== 'all') {
    segments.push(`added-to-my-pharmacy-${filters.addedToMyPharmacy}`);
  }

  if (filters.createdDate.from) {
    segments.push(`date-from-${filters.createdDate.from}`);
  }

  if (filters.createdDate.to) {
    segments.push(`date-to-${filters.createdDate.to}`);
  }

  return segments.length
    ? `${PHARMACY_ALL_PRODUCTS}/${segments.join('/')}`
    : PHARMACY_ALL_PRODUCTS;
}
