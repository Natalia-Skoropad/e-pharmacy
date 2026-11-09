import { isValidObjectId } from '@e-pharmacy/validation/url';

//===================================================================

export const ALL_PRODUCT_DETAIL_TABS = [
  'details',
  'characteristics',
  'reviews',
] as const;

//===================================================================

export type AllProductDetailTab = (typeof ALL_PRODUCT_DETAIL_TABS)[number];

//===================================================================

export function isAllProductDetailTab(
  value: string
): value is AllProductDetailTab {
  return ALL_PRODUCT_DETAIL_TABS.some((tab) => tab === value);
}

//===================================================================

export function getAllProductDetailTabPath(
  productId: string,
  tab: AllProductDetailTab
): string {
  const base = `/pharmacy/all-products/${encodeURIComponent(productId)}`;

  return tab === 'details' ? base : `${base}/${tab}`;
}

//===================================================================

export function parseAllProductDetailTabPath(
  pathname: string,
  productId: string
): AllProductDetailTab | null {
  if (!isValidObjectId(productId)) return null;

  const base = `/pharmacy/all-products/${productId}`;

  if (pathname === base) return 'details';
  if (!pathname.startsWith(`${base}/`)) return null;

  const segment = pathname.slice(base.length + 1);

  return isAllProductDetailTab(segment) && segment !== 'details'
    ? segment
    : null;
}
