import type { CustomerOrder } from '@/types';

//===================================================================

export function buildCustomerOrderPath(
  order: Pick<CustomerOrder, 'id' | 'orderNumber'>
): string {
  const safeNumber = order.orderNumber
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `/profile/orders/${safeNumber}--${order.id}`;
}

//===================================================================

export function getOrderIdFromPathParam(orderId: string): string {
  return orderId.split('--').at(-1) ?? orderId;
}
