import { PRODUCT_CATEGORIES } from '@e-pharmacy/config/products';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import type {
  CatalogProductsQueryParams,
  ProductCategory,
  ProductsSortOption,
} from '@e-pharmacy/types/products';

import {
  isValidObjectId,
  sanitizeArticleParam,
  sanitizeTextParam,
} from '@e-pharmacy/validation/url';

import { parsePositivePageParam } from './catalog-param-utils';

//===================================================================

const PRODUCT_AVAILABILITY_VALUES = [
  'all',
  'in-stock',
  'out-of-stock',
] as const;

const PRODUCT_SORT_VALUES = [
  'newest',
  'rating-desc',
  'rating-asc',
  'name-asc',
  'name-desc',
] as const satisfies readonly ProductsSortOption[];

//===================================================================

const PRODUCTS_CATALOG_PER_PAGE = 24;

//===================================================================

export const FALLBACK_PRODUCT_FILTER_OPTIONS = {
  categories: [
    { value: 'all', label: 'All categories' },
    ...PRODUCT_CATEGORIES.map((value) => ({
      value,
      label: PRODUCT_CATEGORY_LABELS[value],
    })),
  ],

  availability: [
    { value: 'all', label: 'All products' },
    { value: 'in-stock', label: 'Available in pharmacies' },
    { value: 'out-of-stock', label: 'Not available in pharmacies' },
  ],

  sort: [
    { value: 'newest', label: 'Newest first' },
    { value: 'rating-desc', label: 'Rating: highest first' },
    { value: 'rating-asc', label: 'Rating: lowest first' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
  ],
} as const;

//===================================================================

export type ProductCategoryFilter = 'all' | ProductCategory;

//===================================================================

export type ProductAvailabilityFilter =
  (typeof PRODUCT_AVAILABILITY_VALUES)[number];

export type ProductSortFilter = (typeof PRODUCT_SORT_VALUES)[number];

export type ProductCatalogSeoContext = {
  categoryLabel?: string;
  pharmacyName?: string;
};

export type ProductCatalogSearchParams = {
  name?: string;
  article?: string;
  category?: string;
  availability?: string;
  sort?: string;
  page?: string;
  pharmacyId?: string;
};

export type ProductCatalogRouteParams = {
  segments?: string[];
};

export type ProductCatalogFilters = {
  name: string;
  article: string;
  category: ProductCategoryFilter;
  availability: ProductAvailabilityFilter;
  sort: ProductSortFilter;
  page: number;
  pharmacyId?: string;
};

//===================================================================

export function isProductCategoryFilter(
  value?: string
): value is ProductCategoryFilter {
  return value === 'all' || PRODUCT_CATEGORIES.some((item) => item === value);
}

//===================================================================

export function isProductAvailabilityFilter(
  value?: string
): value is ProductAvailabilityFilter {
  return PRODUCT_AVAILABILITY_VALUES.some((item) => item === value);
}

//===================================================================

export function isProductSortFilter(
  value?: string
): value is ProductSortFilter {
  return PRODUCT_SORT_VALUES.some((item) => item === value);
}

//===================================================================

export function getProductCategoryLabel(
  filters: ProductCatalogFilters,
  fallback?: string
): string | undefined {
  return (
    fallback ??
    FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
      (option) => option.value === filters.category
    )?.label
  );
}

//===================================================================

export function sortPharmaciesByName(
  pharmacies: readonly PharmacyOption[]
): PharmacyOption[] {
  return [...pharmacies].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

//===================================================================

export function parseProductCatalogSearchParams(
  params: ProductCatalogSearchParams = {}
): ProductCatalogFilters {
  return {
    name: sanitizeTextParam(params.name),
    article: sanitizeArticleParam(params.article),

    category: isProductCategoryFilter(params.category)
      ? params.category
      : 'all',

    availability: isProductAvailabilityFilter(params.availability)
      ? params.availability
      : 'all',

    sort: isProductSortFilter(params.sort) ? params.sort : 'newest',
    page: parsePositivePageParam(params.page),
    ...(isValidObjectId(params.pharmacyId)
      ? { pharmacyId: params.pharmacyId }
      : {}),
  };
}

//===================================================================

export function mergeProductCatalogFilters(
  routeFilters: ProductCatalogFilters,
  queryFilters: ProductCatalogFilters
): ProductCatalogFilters {
  return {
    ...routeFilters,
    ...(queryFilters.name ? { name: queryFilters.name } : {}),
    ...(queryFilters.article ? { article: queryFilters.article } : {}),
    ...(queryFilters.category !== 'all'
      ? { category: queryFilters.category }
      : {}),
    ...(queryFilters.availability !== 'all'
      ? { availability: queryFilters.availability }
      : {}),
    ...(queryFilters.pharmacyId ? { pharmacyId: queryFilters.pharmacyId } : {}),
    ...(queryFilters.sort !== 'newest' ? { sort: queryFilters.sort } : {}),
    ...(queryFilters.page > 1 ? { page: queryFilters.page } : {}),
  };
}

//===================================================================

export function buildProductCatalogApiParams(
  filters: ProductCatalogFilters
): CatalogProductsQueryParams {
  return {
    page: filters.page,
    perPage: PRODUCTS_CATALOG_PER_PAGE,
    nameKeyword: filters.name || undefined,
    articleKeyword: filters.article || undefined,
    category: filters.category === 'all' ? undefined : filters.category,

    inStock:
      filters.availability === 'all'
        ? undefined
        : filters.availability === 'in-stock',

    sort: filters.sort,
    pharmacyId: filters.pharmacyId,
  };
}

//===================================================================

export function getProductCatalogActiveFiltersCount(
  filters: ProductCatalogFilters
): number {
  return countTrueConditions(
    Boolean(filters.name),
    Boolean(filters.article),
    filters.category !== 'all',
    filters.availability !== 'all',
    Boolean(filters.pharmacyId)
  );
}

export function isProductCatalogNoIndex(
  filters: ProductCatalogFilters
): boolean {
  return (
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.article) ||
    filters.availability !== 'all'
  );
}
