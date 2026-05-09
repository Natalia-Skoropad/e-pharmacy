import type { ProductCategory, ProductsQueryParams } from '@/types';

//===================================================================

export const MEDICINES_CATALOG_PER_PAGE = 20;

//===================================================================

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'vitamins', label: 'Vitamins' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'medical-devices', label: 'Medical devices' },
  { value: 'other', label: 'Other' },
] as const;

export const PRODUCT_AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All products' },
  { value: 'in-stock', label: 'Available in pharmacies' },
  { value: 'out-of-stock', label: 'Not available in pharmacies' },
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
] as const;

//===================================================================

export type ProductCategoryFilter =
  (typeof PRODUCT_CATEGORY_OPTIONS)[number]['value'];

export type ProductAvailabilityFilter =
  (typeof PRODUCT_AVAILABILITY_OPTIONS)[number]['value'];

export type ProductSortFilter = (typeof PRODUCT_SORT_OPTIONS)[number]['value'];

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

function isProductCategoryFilter(value?: string): value is ProductCategoryFilter {
  return PRODUCT_CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isProductAvailabilityFilter(
  value?: string
): value is ProductAvailabilityFilter {
  return PRODUCT_AVAILABILITY_OPTIONS.some((option) => option.value === value);
}

function isProductSortFilter(value?: string): value is ProductSortFilter {
  return PRODUCT_SORT_OPTIONS.some((option) => option.value === value);
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

export function hasActiveMedicinesCatalogFilters(
  filters: MedicinesCatalogFilters
): boolean {
  return Boolean(
    filters.name ||
      filters.article ||
      filters.category !== 'all' ||
      filters.availability !== 'all' ||
      filters.sort !== 'newest' ||
      Boolean(filters.storeId) ||
      filters.page > 1
  );
}
