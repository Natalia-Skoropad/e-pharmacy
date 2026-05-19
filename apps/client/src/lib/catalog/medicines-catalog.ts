import type {
  ProductCategory,
  ProductFilterOptionsResponse,
  ProductsQueryParams,
  Store,
} from '@/types';

//===================================================================

export const MEDICINES_CATALOG_PER_PAGE = 24;

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

export type MedicinesCatalogSeoContext = {
  categoryLabel?: string;
  storeName?: string;
};

//===================================================================

export type MedicinesCatalogSearchParams = {
  name?: string;
  article?: string;
  category?: string;
  availability?: string;
  sort?: string;
  page?: string;
  storeId?: string;
};

export type MedicinesCatalogRouteParams = {
  segments?: string[];
};

export type MedicinesCatalogFilters = {
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

function sanitizeNameParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[^A-Za-z0-9 .-]/g, '')
      .slice(0, 80) ?? ''
  );
}

function sanitizeArticleParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[^A-Za-z0-9.-]/g, '')
      .slice(0, 80) ?? ''
  );
}

function isValidObjectId(value?: string): value is string {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value));
}

function parsePage(value?: string): number {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getCategoryLabel(filters: MedicinesCatalogFilters, fallback?: string) {
  return (
    fallback ??
    FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
      (option) => option.value === filters.category
    )?.label
  );
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function deslugifyNameSegment(value: string): string {
  return sanitizeNameParam(value.replace(/-/g, ' '));
}

function deslugifyArticleSegment(value: string): string {
  return sanitizeArticleParam(value);
}

function getStoreSegment(storeId: string, stores: Store[]): string {
  const store = stores.find((item) => item.id === storeId);
  const storeSlug = store ? slugify(store.name) : 'pharmacy';

  return `pharmacy-${storeSlug}-${storeId}`;
}

//===================================================================

export function sortStoresByName(stores: Store[]): Store[] {
  return [...stores].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

export function parseMedicinesCatalogSearchParams(
  params: MedicinesCatalogSearchParams = {}
): MedicinesCatalogFilters {
  return {
    name: sanitizeNameParam(params.name),
    article: sanitizeArticleParam(params.article),
    category: isProductCategoryFilter(params.category)
      ? params.category
      : 'all',
    availability: isProductAvailabilityFilter(params.availability)
      ? params.availability
      : 'all',
    sort: isProductSortFilter(params.sort) ? params.sort : 'newest',
    page: parsePage(params.page),
    ...(isValidObjectId(params.storeId) ? { storeId: params.storeId } : {}),
  };
}

export function parseMedicinesCatalogSegments(
  params: MedicinesCatalogRouteParams = {}
): MedicinesCatalogFilters {
  const filters: MedicinesCatalogFilters = {
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
      filters.page = parsePage(segment.replace('page-', ''));
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

export function buildMedicinesCatalogIndexedPath(
  filters: Partial<MedicinesCatalogFilters>,
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
    ? `/medicines-catalog/${segments.join('/')}`
    : '/medicines-catalog';
}

export function buildMedicinesCatalogPath(
  filters: Partial<MedicinesCatalogFilters>,
  stores: Store[] = []
): string {
  const path = buildMedicinesCatalogIndexedPath(filters, stores);
  const params = new URLSearchParams();

  if (filters.name) params.set('name', filters.name);
  if (filters.article) params.set('article', filters.article);

  if (filters.availability && filters.availability !== 'all') {
    params.set('availability', filters.availability);
  }

  if (filters.sort && filters.sort !== 'newest') {
    params.set('sort', filters.sort);
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

export function buildMedicinesCatalogCanonicalPath(
  filters: MedicinesCatalogFilters,
  stores: Store[] = []
): string {
  return isMedicinesCatalogNoIndex(filters)
    ? buildMedicinesCatalogIndexedPath(filters, stores)
    : buildMedicinesCatalogPath(filters, stores);
}

export function hasLegacyMedicinesCatalogSegments(
  params: MedicinesCatalogRouteParams = {}
): boolean {
  return (params.segments ?? []).some(
    (segment) =>
      segment.startsWith('availability-') ||
      segment.startsWith('sort-') ||
      segment.startsWith('search-name-') ||
      segment.startsWith('article-') ||
      segment.startsWith('page-')
  );
}

export function mergeMedicinesCatalogFilters(
  routeFilters: MedicinesCatalogFilters,
  queryFilters: MedicinesCatalogFilters
): MedicinesCatalogFilters {
  return {
    ...routeFilters,
    name: queryFilters.name,
    article: queryFilters.article,
    availability: queryFilters.availability,
    sort: queryFilters.sort,
    page: queryFilters.page,
  };
}

export function buildMedicinesCatalogApiParams(
  filters: MedicinesCatalogFilters
): ProductsQueryParams {
  return {
    page: filters.page,
    perPage: MEDICINES_CATALOG_PER_PAGE,
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

export function getMedicinesCatalogActiveFiltersCount(
  filters: MedicinesCatalogFilters
): number {
  return [
    filters.name,
    filters.article,
    filters.category !== 'all',
    filters.availability !== 'all',
    Boolean(filters.storeId),
  ].filter(Boolean).length;
}

export function hasActiveMedicinesCatalogFilters(
  filters: MedicinesCatalogFilters
): boolean {
  return getMedicinesCatalogActiveFiltersCount(filters) > 0;
}

export function hasActiveMedicinesCatalogState(
  filters: MedicinesCatalogFilters
): boolean {
  return (
    hasActiveMedicinesCatalogFilters(filters) ||
    filters.sort !== 'newest' ||
    filters.page > 1
  );
}

export function isMedicinesCatalogNoIndex(
  filters: MedicinesCatalogFilters
): boolean {
  return (
    filters.page > 1 ||
    filters.sort !== 'newest' ||
    Boolean(filters.name) ||
    Boolean(filters.article) ||
    filters.availability !== 'all'
  );
}

export function getMedicinesCatalogTitle(
  filters: MedicinesCatalogFilters,
  context: MedicinesCatalogSeoContext = {}
) {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);

  if (filters.category !== 'all' && context.storeName && categoryLabel) {
    return `Choose ${categoryLabel.toLowerCase()} from ${context.storeName}`;
  }

  if (filters.category !== 'all' && categoryLabel) {
    return `Choose trusted ${categoryLabel.toLowerCase()} online`;
  }

  if (context.storeName) {
    return `Choose medicines from ${context.storeName}`;
  }

  return 'Medicine catalog';
}

export function getMedicinesCatalogDescription(
  filters: MedicinesCatalogFilters,
  context: MedicinesCatalogSeoContext = {}
) {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'medicines';

  if (filters.category !== 'all' && context.storeName) {
    return `Explore ${categoryText} from ${context.storeName}, compare availability, ratings, and details, then choose the right online pharmacy offer with confidence.`;
  }

  if (filters.category !== 'all') {
    return `Explore ${categoryText}, compare availability in active pharmacies, review ratings and product details, and choose a trusted online pharmacy offer.`;
  }

  if (context.storeName) {
    return `Browse medicines from ${context.storeName}, compare prices, availability, ratings, and product details before choosing a trusted online pharmacy offer.`;
  }

  return 'Search medicines by name or article, filter products by category and pharmacy, compare ratings and availability, and choose trusted online pharmacy offers.';
}

export function getMedicinesCatalogSeoTextParts(
  filters: MedicinesCatalogFilters,
  context: MedicinesCatalogSeoContext = {}
): string[] {
  const categoryLabel = getCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'medicines';
  const pharmacyText = context.storeName ?? 'active online pharmacies';

  return [
    'Find the right',
    categoryText,
    'without opening a dozen tabs. In the E-PHARMACY catalog, you can compare products from',
    pharmacyText,
    'check availability, review ratings, and move to the product details when something looks promising. Use the filters to narrow the list by category or pharmacy, search by name or article, and choose the offer that fits your needs faster. Calm, clear, and pharmacy-shopping friendly — almost like a tiny assistant in a white coat. Perfect for quick comparison before adding products to your cart.',
  ];
}

export function shouldShowMedicinesCatalogSeoText(
  filters: MedicinesCatalogFilters
): boolean {
  return !isMedicinesCatalogNoIndex(filters);
}
