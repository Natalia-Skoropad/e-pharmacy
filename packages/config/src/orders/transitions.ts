import type { OrderStatus } from '@e-pharmacy/types/orders';

//===================================================================

export const ORDER_STATUS_TRANSITIONS = {
  new: ['in_progress', 'rejected'],
  in_progress: ['successful', 'rejected'],
  successful: [],
  rejected: [],
} as const satisfies Readonly<Record<OrderStatus, readonly OrderStatus[]>>;

//===================================================================

export function getOrderStatusTransitions<TStatus extends OrderStatus>(
  status: TStatus
): (typeof ORDER_STATUS_TRANSITIONS)[TStatus] {
  return ORDER_STATUS_TRANSITIONS[status];
}
