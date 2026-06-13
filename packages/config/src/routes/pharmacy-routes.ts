import { ROUTE_SEGMENTS } from './route-segments';

//===================================================================

export const PHARMACY_ROUTES = {
  ROOT: `/${ROUTE_SEGMENTS.pharmacy}`,
  DASHBOARD: `/${ROUTE_SEGMENTS.pharmacy}/dashboard`,
  ORDERS: `/${ROUTE_SEGMENTS.pharmacy}/orders`,
  CLIENTS: `/${ROUTE_SEGMENTS.pharmacy}/clients`,
  MEDICINES: `/${ROUTE_SEGMENTS.pharmacy}/medicines`,
  MEDICINE_REQUESTS: `/${ROUTE_SEGMENTS.pharmacy}/medicine-requests`,
  PROFILE: `/${ROUTE_SEGMENTS.pharmacy}/profile`,
} as const;
