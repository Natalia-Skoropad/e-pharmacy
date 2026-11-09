import { isValidObjectId } from '@e-pharmacy/validation/url';

//===================================================================

export const OWN_PRODUCT_DETAIL_TABS = [
  'details',
  'statistics',
  'related-orders',
  'stock-movement',
  'clients',
  'pharmacies',
  'comments',
] as const;

//===================================================================

export type OwnProductDetailTab = (typeof OWN_PRODUCT_DETAIL_TABS)[number];

//===================================================================

export function isOwnProductDetailTab(
  value: string
): value is OwnProductDetailTab {
  return OWN_PRODUCT_DETAIL_TABS.some((tab) => tab === value);
}

//===================================================================

export function getOwnProductDetailTabPath(
  productId: string,
  tab: OwnProductDetailTab
): string {
  const base = `/pharmacy/products/${encodeURIComponent(productId)}`;

  return tab === 'details' ? base : `${base}/${tab}`;
}

//===================================================================

export function parseOwnProductDetailTabPath(
  pathname: string,
  productId: string
): OwnProductDetailTab | null {
  if (!isValidObjectId(productId)) return null;

  const base = `/pharmacy/products/${productId}`;

  if (pathname === base) return 'details';
  if (!pathname.startsWith(`${base}/`)) return null;

  const [segment, ...extra] = pathname.slice(base.length + 1).split('/');

  // Statistics has its own URL-backed pharmacy and period filters. Other
  // tabs retain their existing single-segment canonical routes.
  return isOwnProductDetailTab(segment) &&
    segment !== 'details' &&
    (extra.length === 0 || segment === 'statistics')
    ? segment
    : null;
}
