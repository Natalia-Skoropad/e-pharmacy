import type { Order } from '@e-pharmacy/types';

import { ROUTES } from './routes';
import { buildSlugId } from './slug-id';

//===================================================================

// Product and pharmacy details intentionally use root-level SEO URLs. Keep
// reserved root slugs protected in root-detail-resolver when adding new public
// pages.
export function buildProductPath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}

//===================================================================

export function buildPharmacyPath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}

//===================================================================

export function buildCheckoutPath(
  pharmacyName: string | null | undefined,
  pharmacyId: string
): string {
  const safePharmacyName = pharmacyName?.trim() ? pharmacyName : 'pharmacy';

  return `${ROUTES.CHECKOUT}/${buildSlugId(safePharmacyName, pharmacyId)}`;
}

//===================================================================

export function buildOrderPath(
  order: Pick<Order, 'id' | 'orderNumber'>
): string {
  const safeNumber = order.orderNumber
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${ROUTES.PROFILE}/orders/${safeNumber}--${order.id}`;
}

//===================================================================

export function getOrderIdFromPathParam(orderId: string): string {
  return orderId.split('--').at(-1) ?? orderId;
}
