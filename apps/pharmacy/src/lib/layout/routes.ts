import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

export type PharmacyFilterValue = string | number | boolean | null | undefined;
export type PharmacyFilterMap = Record<string, PharmacyFilterValue>;

//===================================================================

const FILTER_PREFIXES = {
  status: 'status',
  delivery: 'delivery',
  payment: 'payment',
  date: 'date',
  search: 'search',
  clientId: 'client-id',
  contact: 'contact',
  email: 'email',
  phone: 'phone',
  address: 'address',
  successfulOrders: 'successful-orders',
  category: 'category',
  stock: 'stock',
  article: 'article',
  name: 'name',
} as const;

//===================================================================

function encodeFilterValue(
  value: Exclude<PharmacyFilterValue, null | undefined>
): string {
  return encodeURIComponent(
    String(value).trim().toLowerCase().replaceAll(' ', '-')
  );
}

//===================================================================

function buildFilterPath(
  basePath: string,
  filters: PharmacyFilterMap = {}
): string {
  const segments = Object.entries(filters).flatMap(([key, value]) =>
    value === undefined || value === null || value === ''
      ? []
      : [`${key}-${encodeFilterValue(value)}`]
  );

  return segments.length > 0 ? `${basePath}/${segments.join('/')}` : basePath;
}

//===================================================================

function parseFilterSegments(
  segments: string[] | undefined,
  allowedKeys: readonly string[]
): Record<string, string> {
  const filters: Record<string, string> = {};

  for (const segment of segments ?? []) {
    const matchedKey = allowedKeys.find((key) => segment.startsWith(`${key}-`));

    if (!matchedKey) continue;

    const value = segment.slice(matchedKey.length + 1);
    if (value) filters[matchedKey] = decodeURIComponent(value);
  }

  return filters;
}

//===================================================================

export function getPharmacyOrdersFilterPath(
  filters: PharmacyFilterMap
): string {
  return buildFilterPath(PHARMACY_ROUTES.ORDERS, filters);
}

//===================================================================

export function getPharmacyClientsFilterPath(
  filters: PharmacyFilterMap
): string {
  return buildFilterPath(PHARMACY_ROUTES.CLIENTS, filters);
}

//===================================================================

export function getPharmacyProductsFilterPath(
  filters: PharmacyFilterMap
): string {
  return buildFilterPath(PHARMACY_ROUTES.PRODUCTS, filters);
}

//===================================================================

export function getPharmacyAllProductsFilterPath(
  filters: PharmacyFilterMap
): string {
  return buildFilterPath(PHARMACY_ROUTES.ALL_PRODUCTS, filters);
}

//===================================================================

export function getPharmacyRequestsFilterPath(
  filters: PharmacyFilterMap
): string {
  const segments: string[] = [];
  const requestNumber = filters.requestNumber
    ? String(filters.requestNumber).trim()
    : '';
  const name = filters.productName
    ? String(filters.productName).trim()
    : filters.name
      ? String(filters.name).trim()
      : '';
  const article = filters.productArticle
    ? String(filters.productArticle).trim()
    : filters.article
      ? String(filters.article).trim()
      : '';
  const category = filters.category ? String(filters.category).trim() : '';
  const status = filters.status ? String(filters.status).trim() : '';
  const dateFrom = filters.dateFrom ? String(filters.dateFrom).trim() : '';
  const dateTo = filters.dateTo ? String(filters.dateTo).trim() : '';

  if (requestNumber) {
    segments.push(`request-number-${encodeFilterValue(requestNumber)}`);
  }
  if (article) {
    segments.push(`product-article-${encodeFilterValue(article)}`);
  }
  if (name) {
    segments.push(`product-name-${encodeFilterValue(name)}`);
  }
  if (category && category !== 'all') {
    segments.push(`category-${category.replaceAll('_', '-')}`);
  }
  if (status && status !== 'all') {
    segments.push(`status-${status.replaceAll('_', '-')}`);
  }
  if (dateFrom) segments.push(`date-from-${dateFrom}`);
  if (dateTo) segments.push(`date-to-${dateTo}`);

  return segments.length
    ? `${PHARMACY_ROUTES.PRODUCT_REQUESTS}/${segments.join('/')}`
    : PHARMACY_ROUTES.PRODUCT_REQUESTS;
}

//===================================================================

export function parsePharmacyOrderFilters(
  segments?: string[]
): Record<string, string> {
  return parseFilterSegments(segments, [
    FILTER_PREFIXES.status,
    FILTER_PREFIXES.delivery,
    FILTER_PREFIXES.payment,
    FILTER_PREFIXES.date,
    FILTER_PREFIXES.search,
  ]);
}

//===================================================================

export function parsePharmacyClientFilters(
  segments?: string[]
): Record<string, string> {
  return parseFilterSegments(segments, [
    FILTER_PREFIXES.status,
    FILTER_PREFIXES.date,
    FILTER_PREFIXES.search,
    FILTER_PREFIXES.name,
    FILTER_PREFIXES.clientId,
    FILTER_PREFIXES.contact,
    FILTER_PREFIXES.email,
    FILTER_PREFIXES.phone,
    FILTER_PREFIXES.address,
    FILTER_PREFIXES.successfulOrders,
  ]);
}

//===================================================================

export function parsePharmacyProductFilters(
  segments?: string[]
): Record<string, string> {
  return parseFilterSegments(segments, [
    FILTER_PREFIXES.date,
    FILTER_PREFIXES.name,
    FILTER_PREFIXES.article,
    FILTER_PREFIXES.category,
    FILTER_PREFIXES.status,
    FILTER_PREFIXES.stock,
  ]);
}

//===================================================================

export function parsePharmacyAllProductFilters(
  segments?: string[]
): Record<string, string> {
  return parsePharmacyProductFilters(segments);
}

//===================================================================

export function parsePharmacyRequestFilters(
  segments?: string[]
): Record<string, string> {
  return parseFilterSegments(segments, [
    FILTER_PREFIXES.date,
    FILTER_PREFIXES.name,
    FILTER_PREFIXES.article,
    FILTER_PREFIXES.category,
    FILTER_PREFIXES.status,
  ]);
}
