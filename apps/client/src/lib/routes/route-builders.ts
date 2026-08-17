import type { ClientOrder } from '@e-pharmacy/types/orders';

import {
  buildPublicEntitySlugId,
  buildSlugId,
  getIdFromSlugId,
  getPharmacyIdFromPublicSlugId,
  isValidObjectId,
} from '@e-pharmacy/validation/url';

import { ROUTES } from './routes';

//===================================================================

export function buildProductPath(
  name: string,
  id: string,
  publicSlugId?: string
): string {
  const slugId = publicSlugId ?? buildPublicEntitySlugId('product', name, id);

  return `/${slugId}`;
}

//===================================================================

export function buildPharmacyPath(
  name: string,
  id: string,
  publicSlugId?: string
): string {
  const slugId = publicSlugId ?? buildPublicEntitySlugId('pharmacy', name, id);

  return `/${slugId}`;
}

//===================================================================

export function buildCheckoutPath(
  pharmacyName: string | null | undefined,
  pharmacyId: string
): string {
  const safePharmacyName = pharmacyName?.trim() ? pharmacyName : 'pharmacy';
  return `${ROUTES.CHECKOUT}/${buildPublicEntitySlugId(
    'pharmacy',
    safePharmacyName,
    pharmacyId
  )}`;
}

//===================================================================

export function getCheckoutPharmacyIdFromPathParam(
  slugId: string
): string | null {
  return getPharmacyIdFromPublicSlugId(slugId);
}

//===================================================================

export function getLegacyCheckoutRedirectPath(slugId: string): string | null {
  if (getCheckoutPharmacyIdFromPathParam(slugId)) return null;

  const legacyId = getIdFromSlugId(slugId);
  if (!legacyId) return null;

  const suffix = `-${legacyId}`;
  const pharmacyName = slugId.endsWith(suffix)
    ? slugId.slice(0, -suffix.length)
    : 'pharmacy';

  return buildCheckoutPath(pharmacyName || 'pharmacy', legacyId);
}

//===================================================================

const ORDER_ROUTE_ID_PREFIX = 'ph';

//===================================================================

export function buildOrderPath(
  order: Pick<ClientOrder, 'id' | 'orderNumber'>
): string {
  if (!isValidObjectId(order.id)) {
    throw new TypeError('Order route requires a valid entity ID.');
  }

  return `${ROUTES.PROFILE}/orders/${buildSlugId(
    order.orderNumber.trim() || 'order',
    `${ORDER_ROUTE_ID_PREFIX}${order.id}`
  )}`;
}

//===================================================================

export function getOrderIdFromPathParam(orderSlugId: string): string | null {
  const match = orderSlugId.match(/(?:^|-)ph([a-f\d]{24})$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

//===================================================================

export function getLegacyOrderRedirectPath(
  orderSlugId: string
): string | null {
  if (getOrderIdFromPathParam(orderSlugId)) return null;

  const legacyId = getIdFromSlugId(orderSlugId);
  if (!legacyId) return null;

  const suffix = `-${legacyId}`;
  const orderNumber = orderSlugId.endsWith(suffix)
    ? orderSlugId.slice(0, -suffix.length)
    : 'order';

  return buildOrderPath({
    id: legacyId,
    orderNumber: orderNumber || 'order',
  });
}
