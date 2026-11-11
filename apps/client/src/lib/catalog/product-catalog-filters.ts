import { ALL_PRODUCT_CATEGORIES_FILTER_OPTION } from '@e-pharmacy/config/products';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import type {
  CatalogProductsQueryParams,
  ProductsSortOption,
} from '@e-pharmacy/types/products';

import type { ProductCategorySlug } from '@e-pharmacy/types/reference-data';
import { isProductCategorySlug } from '@e-pharmacy/validation/reference-data';

import {
  isValidObjectId,
  sanitizeArticleParam,
  sanitizeTextParam,
} from '@e-pharmacy/validation/url';

import {
  getSingleSearchParam,
  parsePositivePageParam,
  type CatalogSearchParamValue,
} from './catalog-param-utils';

//===================================================================

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
  categories: [ALL_PRODUCT_CATEGORIES_FILTER_OPTION],

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

export type ProductCategoryFilter = 'all' | ProductCategorySlug;

//===================================================================

export type ProductSortFilter = (typeof PRODUCT_SORT_VALUES)[number];

//===================================================================

export type ProductCatalogSeoContext = {
  categoryLabel?: string;
  pharmacyName?: string;
  productName?: string;
};

//===================================================================

export type ProductCatalogSearchParams = Record<
  string,
  CatalogSearchParamValue
> & {
  name?: CatalogSearchParamValue;
  article?: CatalogSearchParamValue;
  category?: CatalogSearchParamValue;
  sort?: CatalogSearchParamValue;
  page?: CatalogSearchParamValue;
  pharmacyId?: CatalogSearchParamValue;
  productId?: CatalogSearchParamValue;
};

//===================================================================

export type ProductCatalogRouteParams = {
  segments?: string[];
};

export type ProductCatalogFilters = {
  name: string;
  article: string;
  category: ProductCategoryFilter;
  sort: ProductSortFilter;
  page: number;
  pharmacyId?: string;
  productId?: string;
};

//===================================================================

export function isProductCategoryFilter(
  value?: string
): value is ProductCategoryFilter {
  return value === 'all' || isProductCategorySlug(value);
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
  return filters.category === 'all' ? undefined : fallback;
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
  const name = getSingleSearchParam(params.name);
  const article = getSingleSearchParam(params.article);
  const category = getSingleSearchParam(params.category);
  const sort = getSingleSearchParam(params.sort);
  const page = getSingleSearchParam(params.page);
  const pharmacyId = getSingleSearchParam(params.pharmacyId);
  const productId = getSingleSearchParam(params.productId);

  return {
    name: sanitizeTextParam(name),
    article: sanitizeArticleParam(article),
    category: isProductCategoryFilter(category) ? category : 'all',
    sort: isProductSortFilter(sort) ? sort : 'newest',
    page: parsePositivePageParam(page),

    ...(isValidObjectId(pharmacyId) ? { pharmacyId } : {}),
    ...(isValidObjectId(productId) ? { productId } : {}),
  };
}

//===================================================================

export function mergeProductCatalogFilters(
  routeFilters: ProductCatalogFilters,
  queryFilters: ProductCatalogFilters
): ProductCatalogFilters {
  return {
    name: routeFilters.name || queryFilters.name,
    article: routeFilters.article || queryFilters.article,

    category:
      routeFilters.category !== 'all'
        ? routeFilters.category
        : queryFilters.category,

    sort:
      routeFilters.sort !== 'newest' ? routeFilters.sort : queryFilters.sort,

    page: routeFilters.page > 1 ? routeFilters.page : queryFilters.page,

    ...(routeFilters.pharmacyId || queryFilters.pharmacyId
      ? { pharmacyId: routeFilters.pharmacyId ?? queryFilters.pharmacyId }
      : {}),

    ...(routeFilters.productId || queryFilters.productId
      ? { productId: routeFilters.productId ?? queryFilters.productId }
      : {}),
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
    productId: filters.productId,
    articleKeyword: filters.article || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
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
    Boolean(filters.pharmacyId),
    Boolean(filters.productId)
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
    Boolean(filters.article)
  );
}
