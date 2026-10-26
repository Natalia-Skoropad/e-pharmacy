import type { OrderStatus } from '../../types/orders/order';

//===============================================================

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ['in_progress', 'rejected'],
  in_progress: ['successful', 'rejected'],
  successful: [],
  rejected: [],
};

//===============================================================

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}
