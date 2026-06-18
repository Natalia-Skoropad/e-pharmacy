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
  PROFILE: `${PHARMACY_ROOT}/profile`,
} as const;
