import type {
  ProductCategory,
  ProductFilterOptionsResponse,
  ProductsQueryParams,
  Store,
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
    { value: 'medicine', label: 'Medicine' },
    { value: 'vitamins', label: 'Vitamins' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'hygiene', label: 'Hygiene' },
    { value: 'medical-devices', label: 'Medical devices' },
    { value: 'other', label: 'Other' },
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

export type ProductsCatalogSeoContext = {
  categoryLabel?: string;
  storeName?: string;
};

//===================================================================

export type ProductsCatalogSearchParams = {
  name?: string;
  article?: string;
  category?: string;
  availability?: string;
  sort?: string;
  page?: string;
  storeId?: string;
};

export type ProductsCatalogRouteParams = {
  segments?: string[];
};

export type ProductsCatalogFilters = {
  name: string;
  article: string;
  category: ProductCategoryFilter;
  availability: ProductAvailabilityFilter;
  sort: ProductSortFilter;
  page: number;
  storeId?: string;
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

function isValidObjectId(value?: string): value is string {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value));
}

//===================================================================

function getCategoryLabel(filters: ProductsCatalogFilters, fallback?: string) {
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

function getStoreSegment(storeId: string, stores: Store[]): string {
  const store = stores.find((item) => item.id === storeId);
  const storeSlug = store ? slugifyCatalogSegment(store.name) : 'pharmacy';

  return `pharmacy-${storeSlug}-${storeId}`;
}

//===================================================================

export function sortStoresByName(stores: Store[]): Store[] {
  return [...stores].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

//===================================================================

export function parseProductsCatalogSearchParams(
  params: ProductsCatalogSearchParams = {}
): ProductsCatalogFilters {
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
    ...(isValidObjectId(params.storeId) ? { storeId: params.storeId } : {}),
  };
}

//===================================================================

export function parseProductsCatalogSegments(
  params: ProductsCatalogRouteParams = {}
): ProductsCatalogFilters {
  const filters: ProductsCatalogFilters = {
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
      const storeId = segment.match(/-([a-f\d]{24})$/i)?.[1];

      if (isValidObjectId(storeId)) filters.storeId = storeId;
    }
  }

  return filters;
}

//===================================================================

export function buildProductsCatalogIndexedPath(
  filters: Partial<ProductsCatalogFilters>,
  stores: Store[] = []
): string {
  const segments: string[] = [];

  if (filters.category && filters.category !== 'all') {
    segments.push(`category-${filters.category}`);
  }

  if (filters.storeId) {
    segments.push(getStoreSegment(filters.storeId, stores));
  }

  return segments.length
    ? `/product-catalog/${segments.join('/')}`
    : '/product-catalog';
}

//===================================================================

export function buildProductsCatalogPath(
  filters: Partial<ProductsCatalogFilters>,
  stores: Store[] = []
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

  if (filters.storeId) {
    segments.push(getStoreSegment(filters.storeId, stores));
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

export function buildProductsCatalogCanonicalPath(
  filters: ProductsCatalogFilters,
  stores: Store[] = []
): string {
  return isProductsCatalogNoIndex(filters)
    ? buildProductsCatalogIndexedPath(filters, stores)
    : buildProductsCatalogPath(filters, stores);
}

//===================================================================

export function hasLegacyProductsCatalogSegments(
  params: ProductsCatalogRouteParams = {}
): boolean {
  void params;

  return false;
}

//===================================================================

export function hasLegacyProductsCatalogSearchParams(
  params: ProductsCatalogSearchParams = {}
): boolean {
  return Boolean(
    params.name ||
    params.article ||
    params.category ||
    params.availability ||
    params.sort ||
    params.page ||
    params.storeId
  );
}

//===================================================================

export function mergeProductsCatalogFilters(
  routeFilters: ProductsCatalogFilters,
  queryFilters: ProductsCatalogFilters
): ProductsCatalogFilters {
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
    ...(queryFilters.storeId ? { storeId: queryFilters.storeId } : {}),
    ...(queryFilters.sort !== 'newest' ? { sort: queryFilters.sort } : {}),
    ...(queryFilters.page > 1 ? { page: queryFilters.page } : {}),
  };
}

//===================================================================

export function buildProductsCatalogApiParams(
  filters: ProductsCatalogFilters
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
    storeId: filters.storeId,
  };
}

//===================================================================

export function getProductsCatalogActiveFiltersCount(
  filters: ProductsCatalogFilters
): number {
  return [
    filters.name,
    filters.article,
    filters.category !== 'all',
    filters.availability !== 'all',
    Boolean(filters.storeId),
  ].filter(Boolean).length;
}

//===================================================================

export function hasActiveProductsCatalogFilters(
  filters: ProductsCatalogFilters
): boolean {
  return getProductsCatalogActiveFiltersCount(filters) > 0;
}

export function hasActiveProductsCatalogState(
  filters: ProductsCatalogFilters
): boolean {
  return (
    hasActiveProductsCatalogFilters(filters) ||
    filters.sort !== 'newest' ||
    filters.page > 1
  );
}

//===================================================================

export function isProductsCatalogNoIndex(
  filters: ProductsCatalogFilters
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

export function getProductsCatalogTitle(
  filters: ProductsCatalogFilters,
  context: ProductsCatalogSeoContext = {}
) {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);

  if (filters.category !== 'all' && context.storeName && categoryLabel) {
    return `Choose ${categoryLabel.toLowerCase()} from ${context.storeName}`;
  }

  if (filters.category !== 'all' && categoryLabel) {
    return `Choose trusted ${categoryLabel.toLowerCase()} online`;
  }

  if (context.storeName) {
    return `Choose products from ${context.storeName}`;
  }

  return 'Product catalog';
}

//===================================================================

export function getProductsCatalogDescription(
  filters: ProductsCatalogFilters,
  context: ProductsCatalogSeoContext = {}
) {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';

  if (filters.category !== 'all' && context.storeName) {
    return `Explore ${categoryText} from ${context.storeName}, compare availability, ratings, and details, then choose the right online pharmacy offer with confidence.`;
  }

  if (filters.category !== 'all') {
    return `Explore ${categoryText}, compare availability in active pharmacies, review ratings and product details, and choose a trusted online pharmacy offer.`;
  }

  if (context.storeName) {
    return `Browse products from ${context.storeName}, compare prices, availability, ratings, and product details before choosing a trusted online pharmacy offer.`;
  }

  return 'Search products by name or article, filter products by category and pharmacy, compare ratings and availability, and choose trusted online pharmacy offers.';
}

//===================================================================

export function getProductsCatalogSeoTextParts(
  filters: ProductsCatalogFilters,
  context: ProductsCatalogSeoContext = {}
): string[] {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';
  const pharmacyText = context.storeName ?? 'active online pharmacies';

  return [
    'Find the right',
    categoryText,
    'without opening a dozen tabs. In the E-PHARMACY catalog, you can compare products from',
    pharmacyText,
    'check availability, review ratings, and move to the product details when something looks promising. Use the filters to narrow the list by category or pharmacy, search by name or article, and choose the offer that fits your needs faster. Calm, clear, and pharmacy-shopping friendly — almost like a tiny assistant in a white coat. Perfect for quick comparison before adding products to your cart.',
  ];
}

//===================================================================

export function shouldShowProductsCatalogSeoText(
  filters: ProductsCatalogFilters
): boolean {
  return !isProductsCatalogNoIndex(filters);
}
