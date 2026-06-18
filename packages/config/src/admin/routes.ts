const ADMIN_ROOT = '/admin';

//===================================================================

export const ADMIN_ROUTES = {
  ROOT: ADMIN_ROOT,
  DASHBOARD: `${ADMIN_ROOT}/dashboard`,
  ORDERS: `${ADMIN_ROOT}/orders`,
  PRODUCTS: `${ADMIN_ROOT}/products`,
  CLIENTS: `${ADMIN_ROOT}/clients`,
  SUPPLIERS: `${ADMIN_ROOT}/suppliers`,
} as const;
