import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

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

function appendRouteParam(basePath: string, value: EntityId): string {
  const routeSegment = value.trim();

  if (!routeSegment) {
    throw new TypeError('Route parameter must be a non-empty entity ID.');
  }

  return `${basePath}/${encodeURIComponent(routeSegment)}`;
}

//===================================================================

export function getPharmacyOrderPath(orderId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.ORDERS, orderId);
}

//===================================================================

export function getPharmacyClientPath(clientId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.CLIENTS, clientId);
}

//===================================================================

export function getPharmacyProductPath(productId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCTS, productId);
}

//===================================================================

export function getPharmacyAllProductPath(productId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.ALL_PRODUCTS, productId);
}

//===================================================================

export function getPharmacyRequestPath(requestId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCT_REQUESTS, requestId);
}
