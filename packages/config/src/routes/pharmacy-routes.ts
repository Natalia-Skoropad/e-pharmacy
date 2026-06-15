import { ROUTE_SEGMENTS } from './route-segments';

//===================================================================

export const PHARMACY_ROUTES = {
  ROOT: `/${ROUTE_SEGMENTS.pharmacy}`,
  DASHBOARD: `/${ROUTE_SEGMENTS.pharmacy}/dashboard`,
  ORDERS: `/${ROUTE_SEGMENTS.pharmacy}/orders`,
  CLIENTS: `/${ROUTE_SEGMENTS.pharmacy}/clients`,
  PRODUCTS: `/${ROUTE_SEGMENTS.pharmacy}/products`,
  PRODUCT_REQUESTS: `/${ROUTE_SEGMENTS.pharmacy}/product-requests`,
  PROFILE: `/${ROUTE_SEGMENTS.pharmacy}/profile`,
} as const;
import { buildSlugId } from './slug-id';

//===================================================================

// Pharmacy details intentionally use root-level SEO URLs. Keep reserved root
// slugs protected in root-detail-resolver when adding new public pages.

export function buildPharmacyPath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}
