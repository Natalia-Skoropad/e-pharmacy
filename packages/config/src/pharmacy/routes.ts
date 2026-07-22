const PHARMACY_ROOT = '/pharmacy';

//===================================================================

export const PHARMACY_ROUTES = {
  ROOT: PHARMACY_ROOT,
  DASHBOARD: `${PHARMACY_ROOT}/dashboard`,
  ORDERS: `${PHARMACY_ROOT}/orders`,
  ORDER_NEW: `${PHARMACY_ROOT}/orders/new`,
  CLIENTS: `${PHARMACY_ROOT}/clients`,
  PRODUCTS: `${PHARMACY_ROOT}/products`,
  ALL_PRODUCTS: `${PHARMACY_ROOT}/all-products`,
  PRODUCT_REQUESTS: `${PHARMACY_ROOT}/product-requests`,
  PRODUCT_REQUEST_NEW: `${PHARMACY_ROOT}/product-requests/new`,
  PROFILE: `${PHARMACY_ROOT}/profile`,
} as const;

//===================================================================

function appendRouteParam(basePath: string, value: string | number): string {
  return `${basePath}/${encodeURIComponent(String(value))}`;
}

//===================================================================

export function getPharmacyDashboardPath(): string {
  return PHARMACY_ROUTES.DASHBOARD;
}

//===================================================================

export function getPharmacyProfilePath(): string {
  return PHARMACY_ROUTES.PROFILE;
}

//===================================================================

export function getPharmacyOrdersPath(): string {
  return PHARMACY_ROUTES.ORDERS;
}

//===================================================================

export function getPharmacyNewOrderPath(): string {
  return PHARMACY_ROUTES.ORDER_NEW;
}

//===================================================================

export function getPharmacyClientsPath(): string {
  return PHARMACY_ROUTES.CLIENTS;
}

//===================================================================

export function getPharmacyProductsPath(): string {
  return PHARMACY_ROUTES.PRODUCTS;
}

//===================================================================

export function getPharmacyAllProductsPath(): string {
  return PHARMACY_ROUTES.ALL_PRODUCTS;
}

//===================================================================

export function getPharmacyProductRequestsPath(): string {
  return PHARMACY_ROUTES.PRODUCT_REQUESTS;
}

//===================================================================

export function getPharmacyNewRequestPath(): string {
  return PHARMACY_ROUTES.PRODUCT_REQUEST_NEW;
}

//===================================================================

export function getPharmacyOrderPath(orderId: string | number): string {
  return appendRouteParam(PHARMACY_ROUTES.ORDERS, orderId);
}

//===================================================================

export function getPharmacyClientPath(clientId: string | number): string {
  return appendRouteParam(PHARMACY_ROUTES.CLIENTS, clientId);
}

//===================================================================

export function getPharmacyProductPath(productId: string | number): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCTS, productId);
}

//===================================================================

export function getPharmacyAllProductPath(productId: string | number): string {
  return appendRouteParam(PHARMACY_ROUTES.ALL_PRODUCTS, productId);
}

//===================================================================

export function getPharmacyRequestPath(requestId: string | number): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCT_REQUESTS, requestId);
}

//===================================================================

export function getPharmacyRequestEditPath(requestId: string | number): string {
  return `${getPharmacyRequestPath(requestId)}/edit`;
}
