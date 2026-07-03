import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from '@e-pharmacy/types/products';

import type {
  ProductCategory,
  ProductFilterOptionsResponse,
  ProductsQueryParams,
  PharmacyOption,
} from '@e-pharmacy/types';

import {
  sanitizeArticleParam,
  sanitizeTextParam,
} from '@e-pharmacy/validation';

import { isValidObjectId } from '@/lib/routes';

import { parsePositivePageParam } from './catalog-param-utils';

//===================================================================

export const PRODUCTS_CATALOG_PER_PAGE = 24;

//===================================================================

export const FALLBACK_PRODUCT_FILTER_OPTIONS: ProductFilterOptionsResponse = {
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
};

//===================================================================

export type ProductCategoryFilter =
  ProductFilterOptionsResponse['categories'][number]['value'];

export type ProductAvailabilityFilter =
  ProductFilterOptionsResponse['availability'][number]['value'];

export type ProductSortFilter =
  ProductFilterOptionsResponse['sort'][number]['value'];

export type ProductCatalogSeoContext = {
  categoryLabel?: string;
  pharmacyName?: string;
};

//===================================================================

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

const CATEGORY_VALUES = FALLBACK_PRODUCT_FILTER_OPTIONS.categories.map(
  (option) => option.value
);

const AVAILABILITY_VALUES = FALLBACK_PRODUCT_FILTER_OPTIONS.availability.map(
  (option) => option.value
);

const SORT_VALUES = FALLBACK_PRODUCT_FILTER_OPTIONS.sort.map(
  (option) => option.value
);

//===================================================================

export function isProductCategoryFilter(
  value?: string
): value is ProductCategoryFilter {
  return CATEGORY_VALUES.includes(value as ProductCategoryFilter);
}

//===================================================================

export function isProductAvailabilityFilter(
  value?: string
): value is ProductAvailabilityFilter {
  return AVAILABILITY_VALUES.includes(value as ProductAvailabilityFilter);
}

//===================================================================

export function isProductSortFilter(
  value?: string
): value is ProductSortFilter {
  return SORT_VALUES.includes(value as ProductSortFilter);
}

//===================================================================

export function getProductCategoryLabel(
  filters: ProductCatalogFilters,
  fallback?: string
) {
  return (
    fallback ??
    FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
      (option) => option.value === filters.category
    )?.label
  );
}

//===================================================================

export function sortPharmaciesByName(
  pharmacies: PharmacyOption[]
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

export function hasLegacyProductCatalogSearchParams(
  params: ProductCatalogSearchParams = {}
): boolean {
  return Boolean(
    params.name ||
    params.article ||
    params.category ||
    params.availability ||
    params.sort ||
    params.page ||
    params.pharmacyId
  );
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
): ProductsQueryParams {
  return {
    page: filters.page,
    perPage: PRODUCTS_CATALOG_PER_PAGE,
    nameKeyword: filters.name || undefined,
    articleKeyword: filters.article || undefined,
    category:
      filters.category === 'all'
        ? undefined
        : (filters.category as ProductCategory),
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
  return [
    filters.name,
    filters.article,
    filters.category !== 'all',
    filters.availability !== 'all',
    Boolean(filters.pharmacyId),
  ].filter(Boolean).length;
}

//===================================================================

export function hasActiveProductCatalogFilters(
  filters: ProductCatalogFilters
): boolean {
  return getProductCatalogActiveFiltersCount(filters) > 0;
}

//===================================================================

export function hasActiveProductCatalogState(
  filters: ProductCatalogFilters
): boolean {
  return (
    hasActiveProductCatalogFilters(filters) ||
    filters.sort !== 'newest' ||
    filters.page > 1
  );
}

//===================================================================

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
