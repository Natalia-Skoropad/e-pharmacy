import type { ClientOrder } from '@e-pharmacy/types/orders';

import {
  buildSlugId,
  getIdFromSlugId,
  isValidObjectId,
} from '@e-pharmacy/validation/url';

import { ROUTES } from './routes';

//===================================================================

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
