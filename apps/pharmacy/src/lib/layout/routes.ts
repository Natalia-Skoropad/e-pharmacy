export const PHARMACY_DASHBOARD = '/pharmacy/dashboard';
export const PHARMACY_PROFILE = '/pharmacy/profile';
export const PHARMACY_ORDERS = '/pharmacy/orders';
export const PHARMACY_CLIENTS = '/pharmacy/clients';
export const PHARMACY_PRODUCTS = '/pharmacy/products';
export const PHARMACY_ALL_PRODUCTS = '/pharmacy/all-products';
export const PHARMACY_PRODUCT_REQUESTS = '/pharmacy/product-requests';

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
  category: 'category',
  stock: 'stock',
  article: 'article',
  name: 'name',
} as const;

//===================================================================

function encodeFilterValue(
  value: Exclude<PharmacyFilterValue, null | undefined>
) {
  return encodeURIComponent(
    String(value).trim().toLowerCase().replaceAll(' ', '-')
  );
}

//===================================================================

function buildFilterPath(basePath: string, filters: PharmacyFilterMap = {}) {
  const segments = Object.entries(filters).flatMap(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return [];
    }

    return [`${key}-${encodeFilterValue(value)}`];
  });

  return segments.length > 0 ? `${basePath}/${segments.join('/')}` : basePath;
}

//===================================================================

function parseFilterSegments(
  segments: string[] | undefined,
  allowedKeys: readonly string[]
) {
  const filters: Record<string, string> = {};

  for (const segment of segments ?? []) {
    const matchedKey = allowedKeys.find((key) => segment.startsWith(`${key}-`));

    if (!matchedKey) {
      continue;
    }

    const value = segment.slice(matchedKey.length + 1);

    if (value) {
      filters[matchedKey] = decodeURIComponent(value);
    }
  }

  return filters;
}

//===================================================================

export function getPharmacyDashboardPath() {
  return PHARMACY_DASHBOARD;
}

export function getPharmacyProfilePath() {
  return PHARMACY_PROFILE;
}

export function getPharmacyOrdersPath() {
  return PHARMACY_ORDERS;
}

export function getPharmacyClientsPath() {
  return PHARMACY_CLIENTS;
}

export function getPharmacyProductsPath() {
  return PHARMACY_PRODUCTS;
}

export function getPharmacyAllProductsPath() {
  return PHARMACY_ALL_PRODUCTS;
}

export function getPharmacyProductRequestsPath() {
  return PHARMACY_PRODUCT_REQUESTS;
}

export function getPharmacyOrderPath(orderId: string | number) {
  return `${PHARMACY_ORDERS}/${encodeURIComponent(String(orderId))}`;
}

export function getPharmacyClientPath(clientId: string | number) {
  return `${PHARMACY_CLIENTS}/${encodeURIComponent(String(clientId))}`;
}

export function getPharmacyProductPath(productId: string | number) {
  return `${PHARMACY_PRODUCTS}/${encodeURIComponent(String(productId))}`;
}

export function getPharmacyAllProductPath(productId: string | number) {
  return `${PHARMACY_ALL_PRODUCTS}/${encodeURIComponent(String(productId))}`;
}

export function getPharmacyRequestPath(requestId: string | number) {
  return `${PHARMACY_PRODUCT_REQUESTS}/${encodeURIComponent(String(requestId))}`;
}

export function getPharmacyRequestEditPath(requestId: string | number) {
  return `${getPharmacyRequestPath(requestId)}/edit`;
}

export function getPharmacyNewRequestPath() {
  return `${PHARMACY_PRODUCT_REQUESTS}/new`;
}

export function getPharmacyOrdersFilterPath(filters: PharmacyFilterMap) {
  return buildFilterPath(PHARMACY_ORDERS, filters);
}

export function getPharmacyClientsFilterPath(filters: PharmacyFilterMap) {
  return buildFilterPath(PHARMACY_CLIENTS, filters);
}

export function getPharmacyProductsFilterPath(filters: PharmacyFilterMap) {
  return buildFilterPath(PHARMACY_PRODUCTS, filters);
}

export function getPharmacyAllProductsFilterPath(filters: PharmacyFilterMap) {
  return buildFilterPath(PHARMACY_ALL_PRODUCTS, filters);
}

//===================================================================

export function getPharmacyRequestsFilterPath(filters: PharmacyFilterMap) {
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
  if (article) segments.push(`product-article-${encodeFilterValue(article)}`);
  if (name) segments.push(`product-name-${encodeFilterValue(name)}`);
  if (category && category !== 'all') {
    segments.push(`category-${category.replaceAll('_', '-')}`);
  }
  if (status && status !== 'all') {
    segments.push(`status-${status.replaceAll('_', '-')}`);
  }
  if (dateFrom) segments.push(`date-from-${dateFrom}`);
  if (dateTo) segments.push(`date-to-${dateTo}`);

  return segments.length
    ? `${PHARMACY_PRODUCT_REQUESTS}/${segments.join('/')}`
    : PHARMACY_PRODUCT_REQUESTS;
}

//===================================================================

export function parsePharmacyOrderFilters(segments?: string[]) {
  return parseFilterSegments(segments, [
    FILTER_PREFIXES.status,
    FILTER_PREFIXES.delivery,
    FILTER_PREFIXES.payment,
    FILTER_PREFIXES.date,
    FILTER_PREFIXES.search,
  ]);
}

//===================================================================

export function parsePharmacyClientFilters(segments?: string[]) {
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
  ]);
}

//===================================================================

export function parsePharmacyProductFilters(segments?: string[]) {
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

export function parsePharmacyAllProductFilters(segments?: string[]) {
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

export function parsePharmacyRequestFilters(segments?: string[]) {
  return parseFilterSegments(segments, [
    FILTER_PREFIXES.date,
    FILTER_PREFIXES.name,
    FILTER_PREFIXES.article,
    FILTER_PREFIXES.category,
    FILTER_PREFIXES.status,
  ]);
}
