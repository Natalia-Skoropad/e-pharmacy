import type { OrderStatus } from '@e-pharmacy/types';

//===================================================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  successful: 'Successful',
  rejected: 'Rejected',
};
