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

export function buildOrderPath(
  order: Pick<ClientOrder, 'id' | 'orderNumber'>
): string {
  if (!isValidObjectId(order.id)) {
    throw new TypeError('Order route requires a valid entity ID.');
  }

  return `${ROUTES.PROFILE}/orders/${buildSlugId(
    order.orderNumber.trim() || 'order',
    order.id
  )}`;
}

//===================================================================

export function getOrderIdFromPathParam(orderSlugId: string): string | null {
  return getIdFromSlugId(orderSlugId);
}
