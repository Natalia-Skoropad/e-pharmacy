import { ROUTE_SEGMENTS } from './route-segments';

//===================================================================

export const VENDOR_ROUTES = {
  ROOT: `/${ROUTE_SEGMENTS.vendor}`,
  DASHBOARD: `/${ROUTE_SEGMENTS.vendor}/dashboard`,
  ORDERS: `/${ROUTE_SEGMENTS.vendor}/orders`,
  CUSTOMERS: `/${ROUTE_SEGMENTS.vendor}/customers`,
  MEDICINES: `/${ROUTE_SEGMENTS.vendor}/medicines`,
  MEDICINE_REQUESTS: `/${ROUTE_SEGMENTS.vendor}/medicine-requests`,
  PROFILE: `/${ROUTE_SEGMENTS.vendor}/profile`,
} as const;
