import { ROUTES } from '@e-pharmacy/config/routes';

import type { CustomerOrder } from '@e-pharmacy/types';

//===================================================================

export function buildCustomerOrderPath(
  order: Pick<CustomerOrder, 'id' | 'orderNumber'>
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
