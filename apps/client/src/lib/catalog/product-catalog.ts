import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';
import { PRODUCT_CATEGORY_LABELS } from './product-category-labels';
import { isValidObjectId } from '@/lib/routes';

import type {
  ProductCategory,
  ProductFilterOptionsResponse,
  ProductsQueryParams,
  PharmacyOption,
} from '@e-pharmacy/types';

import {
  parsePositivePageParam,
  sanitizeCatalogArticleParam,
  sanitizeCatalogTextParam,
  slugifyCatalogSegment,
} from './catalog-param-utils';

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

//===================================================================

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

function isProductCategoryFilter(
  value?: string
): value is ProductCategoryFilter {
  return CATEGORY_VALUES.includes(value as ProductCategoryFilter);
}

function isProductAvailabilityFilter(
  value?: string
): value is ProductAvailabilityFilter {
  return AVAILABILITY_VALUES.includes(value as ProductAvailabilityFilter);
}

function isProductSortFilter(value?: string): value is ProductSortFilter {
  return SORT_VALUES.includes(value as ProductSortFilter);
}

//===================================================================

function getCategoryLabel(filters: ProductCatalogFilters, fallback?: string) {
  return (
    fallback ??
    FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
      (option) => option.value === filters.category
    )?.label
  );
}

//===================================================================

function deslugifyNameSegment(value: string): string {
  return sanitizeCatalogTextParam(value.replace(/-/g, ' '));
}

function deslugifyArticleSegment(value: string): string {
  return sanitizeCatalogArticleParam(value);
}

//===================================================================

function getPharmacySegment(
  pharmacyId: string,
  pharmacies: PharmacyOption[]
): string {
  const pharmacy = pharmacies.find((item) => item.id === pharmacyId);
  const pharmacySlug = pharmacy
    ? slugifyCatalogSegment(pharmacy.name)
    : 'pharmacy';

  return `pharmacy-${pharmacySlug}-${pharmacyId}`;
}

//===================================================================

export function sortPharmaciesByName(pharmacies: PharmacyOption[]): PharmacyOption[] {
  return [...pharmacies].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

//===================================================================

export function parseProductCatalogSearchParams(
  params: ProductCatalogSearchParams = {}
): ProductCatalogFilters {
  return {
    name: sanitizeCatalogTextParam(params.name),
    article: sanitizeCatalogArticleParam(params.article),
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

export function parseProductCatalogSegments(
  params: ProductCatalogRouteParams = {}
): ProductCatalogFilters {
  const filters: ProductCatalogFilters = {
    name: '',
    article: '',
    category: 'all',
    availability: 'all',
    sort: 'newest',
    page: 1,
  };

  for (const segment of params.segments ?? []) {
    if (segment.startsWith('category-')) {
      const category = segment.replace('category-', '');

      if (isProductCategoryFilter(category)) filters.category = category;
      continue;
    }

    if (segment.startsWith('availability-')) {
      const availability = segment.replace('availability-', '');

      if (isProductAvailabilityFilter(availability)) {
        filters.availability = availability;
      }
      continue;
    }

    if (segment.startsWith('sort-')) {
      const sort = segment.replace('sort-', '');

      if (isProductSortFilter(sort)) filters.sort = sort;
      continue;
    }

    if (segment.startsWith('page-')) {
      filters.page = parsePositivePageParam(segment.replace('page-', ''));
      continue;
    }

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

    if (segment.startsWith('pharmacy-')) {
      const pharmacyId = segment.match(/-([a-f\d]{24})$/i)?.[1];

      if (isValidObjectId(pharmacyId)) filters.pharmacyId = pharmacyId;
    }
  }

  return filters;
}

//===================================================================

export function buildProductCatalogIndexedPath(
  filters: Partial<ProductCatalogFilters>,
  pharmacies: PharmacyOption[] = []
): string {
  const segments: string[] = [];

  if (filters.category && filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.pharmacyId) {
    segments.push(getPharmacySegment(filters.pharmacyId, pharmacies));
  }

  return segments.length
    ? `/product-catalog/${segments.join('/')}`
    : '/product-catalog';
}

//===================================================================

export function buildProductCatalogPath(
  filters: Partial<ProductCatalogFilters>,
  pharmacies: PharmacyOption[] = []
): string {
  const segments: string[] = [];

  if (filters.name)
    segments.push(`search-name-${slugifyCatalogSegment(filters.name)}`);
  if (filters.article)
    segments.push(`article-${slugifyCatalogSegment(filters.article)}`);

  if (filters.category && filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.availability && filters.availability !== 'all') {
    segments.push(`availability-${filters.availability}`);
  }

  if (filters.pharmacyId) {
    segments.push(getPharmacySegment(filters.pharmacyId, pharmacies));
  }

  if (filters.sort && filters.sort !== 'newest') {
    segments.push(`sort-${filters.sort}`);
  }

  if (filters.page && filters.page > 1) {
    segments.push(`page-${filters.page}`);
  }

  return segments.length
    ? `/product-catalog/${segments.join('/')}`
    : '/product-catalog';
}

//===================================================================

export function buildProductCatalogCanonicalPath(
  filters: ProductCatalogFilters,
  pharmacies: PharmacyOption[] = []
): string {
  return isProductCatalogNoIndex(filters)
    ? buildProductCatalogIndexedPath(filters, pharmacies)
    : buildProductCatalogPath(filters, pharmacies);
}

//===================================================================

export function hasLegacyProductCatalogSegments(
  params: ProductCatalogRouteParams = {}
): boolean {
  void params;

  return false;
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

//===================================================================

export function getProductCatalogTitle(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
) {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);

  if (filters.category !== 'all' && context.pharmacyName && categoryLabel) {
    return `Choose ${categoryLabel.toLowerCase()} from ${context.pharmacyName}`;
  }

  if (filters.category !== 'all' && categoryLabel) {
    return `Choose trusted ${categoryLabel.toLowerCase()} online`;
  }

  if (context.pharmacyName) {
    return `Choose products from ${context.pharmacyName}`;
  }

  return 'Product catalog';
}

//===================================================================

export function getProductCatalogDescription(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
) {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';

  if (filters.category !== 'all' && context.pharmacyName) {
    return `Explore ${categoryText} from ${context.pharmacyName}, compare availability, ratings, and details, then choose the right online pharmacy offer with confidence.`;
  }

  if (filters.category !== 'all') {
    return `Explore ${categoryText}, compare availability in active pharmacies, review ratings and product details, and choose a trusted online pharmacy offer.`;
  }

  if (context.pharmacyName) {
    return `Browse products from ${context.pharmacyName}, compare prices, availability, ratings, and product details before choosing a trusted online pharmacy offer.`;
  }

  return 'Search products by name or article, filter products by category and pharmacy, compare ratings and availability, and choose trusted online pharmacy offers.';
}

//===================================================================

export function getProductCatalogSeoTextParts(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
): string[] {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';
  const pharmacyText = context.pharmacyName ?? 'active online pharmacies';

  return [
    'Find the right',
    categoryText,
    'without opening a dozen tabs. In the E-PHARMACY catalog, you can compare products from',
    pharmacyText,
    'check availability, review ratings, and move to the product details when something looks promising. Use the filters to narrow the list by category or pharmacy, search by name or article, and choose the offer that fits your needs faster. Calm, clear, and pharmacy-shopping friendly — almost like a tiny assistant in a white coat. Perfect for quick comparison before adding products to your cart.',
  ];
}

//===================================================================

export function shouldShowProductCatalogSeoText(
  filters: ProductCatalogFilters
): boolean {
  return !isProductCatalogNoIndex(filters);
}
