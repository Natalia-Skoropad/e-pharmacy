import { ROUTE_SEGMENTS } from './route-segments';

//===================================================================

export const ADMIN_ROUTES = {
  ROOT: `/${ROUTE_SEGMENTS.admin}`,
  DASHBOARD: `/${ROUTE_SEGMENTS.admin}/dashboard`,
  ORDERS: `/${ROUTE_SEGMENTS.admin}/orders`,
  PRODUCTS: `/${ROUTE_SEGMENTS.admin}/products`,
  CUSTOMERS: `/${ROUTE_SEGMENTS.admin}/customers`,
  SUPPLIERS: `/${ROUTE_SEGMENTS.admin}/suppliers`,
} as const;
