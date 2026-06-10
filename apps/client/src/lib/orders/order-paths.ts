import { ROUTES } from '@e-pharmacy/config/routes';

import type { ClientOrder } from '@e-pharmacy/types';

//===================================================================

export function buildClientOrderPath(
  order: Pick<ClientOrder, 'id' | 'orderNumber'>
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
