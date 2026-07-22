const PHARMACY_ROOT = '/pharmacy';

//===================================================================

export const PHARMACY_ROUTES = {
  ROOT: PHARMACY_ROOT,
  DASHBOARD: `${PHARMACY_ROOT}/dashboard`,
  ORDERS: `${PHARMACY_ROOT}/orders`,
  CLIENTS: `${PHARMACY_ROOT}/clients`,
  PRODUCTS: `${PHARMACY_ROOT}/products`,
  ALL_PRODUCTS: `${PHARMACY_ROOT}/all-products`,
  PRODUCT_REQUESTS: `${PHARMACY_ROOT}/product-requests`,
  PRODUCT_REQUEST_NEW: `${PHARMACY_ROOT}/product-requests/new`,
  PROFILE: `${PHARMACY_ROOT}/profile`,
} as const;

//===================================================================

function appendRouteParam(basePath: string, value: string): string {
  return `${basePath}/${encodeURIComponent(value)}`;
}

//===================================================================

export function getPharmacyOrderPath(orderId: string): string {
  return appendRouteParam(PHARMACY_ROUTES.ORDERS, orderId);
}

//===================================================================

export function getPharmacyClientPath(clientId: string): string {
  return appendRouteParam(PHARMACY_ROUTES.CLIENTS, clientId);
}

//===================================================================

export function getPharmacyProductPath(productId: string): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCTS, productId);
}

//===================================================================

export function getPharmacyAllProductPath(productId: string): string {
  return appendRouteParam(PHARMACY_ROUTES.ALL_PRODUCTS, productId);
}

//===================================================================

export function getPharmacyRequestPath(requestId: string): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCT_REQUESTS, requestId);
}

//===================================================================

export function getPharmacyRequestEditPath(requestId: string): string {
  return `${getPharmacyRequestPath(requestId)}/edit`;
}
