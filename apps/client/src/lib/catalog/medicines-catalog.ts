import type {
  ProductCategory,
  ProductFilterOptionsResponse,
  ProductsQueryParams,
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

function isProductCategoryFilter(value?: string): value is ProductCategoryFilter {
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

function sanitizeTextParam(value?: string): string {
  return value?.trim().slice(0, 80) ?? '';
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

//===================================================================

export function parseMedicinesCatalogSearchParams(
  params: MedicinesCatalogSearchParams = {}
): MedicinesCatalogFilters {
  return {
    name: sanitizeTextParam(params.name),
    article: sanitizeTextParam(params.article),
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
