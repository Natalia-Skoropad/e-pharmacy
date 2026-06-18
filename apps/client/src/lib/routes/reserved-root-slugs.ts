import { CLIENT_RESERVED_APP_PREFIXES } from './routes';
import { ROUTE_SEGMENTS } from './route-segments';

//===================================================================

/**
 * Root-level product/pharmacy SEO URLs live at `/:slugId`.
 * Every static top-level client route and reserved application prefix must stay
 * here so dynamic details never accidentally capture those URLs.
 */
export const RESERVED_ROOT_SLUGS = [
  ROUTE_SEGMENTS.cart,
  ROUTE_SEGMENTS.checkout,
  ROUTE_SEGMENTS.profile,
  ROUTE_SEGMENTS.login,
  ROUTE_SEGMENTS.register,
  ROUTE_SEGMENTS.pharmacies,
  ROUTE_SEGMENTS.medicinePharmacy,
  ROUTE_SEGMENTS.productCatalog,
  ROUTE_SEGMENTS.deliveryPayment,
  ROUTE_SEGMENTS.returnPolicy,
  ROUTE_SEGMENTS.userAgreement,
  ROUTE_SEGMENTS.personalDataNotice,
  ROUTE_SEGMENTS.passwordRecovery,
  ROUTE_SEGMENTS.resetPassword,
  ...CLIENT_RESERVED_APP_PREFIXES,
] as const;

const RESERVED_ROOT_SLUG_SET = new Set<string>(RESERVED_ROOT_SLUGS);

export function isReservedRootSlug(value: string): boolean {
  return RESERVED_ROOT_SLUG_SET.has(value.trim().toLowerCase());
}
