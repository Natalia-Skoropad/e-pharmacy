import type { OrderStatus } from '@e-pharmacy/types/orders';

//===================================================================

export const ORDER_REJECTION_REASON_MIN_LENGTH = 100;
export const ORDER_REJECTION_REASON_MAX_LENGTH = 500;
export const ORDER_STATUS_COMMENT_MAX_LENGTH = 500;

//===================================================================

export type UpdatableOrderStatus = Extract<
  OrderStatus,
  'in_progress' | 'successful' | 'rejected'
>;

//===================================================================

export type OrderStatusChangeValues = Readonly<{
  status: UpdatableOrderStatus;
  rejectionReason?: string;
  comment?: string;
}>;

//===================================================================

export function buildOrderRejectionReasonError(value: string): string {
  const rejectionReason = value.trim();

  if (!rejectionReason) return 'Rejection reason is required';

  if (rejectionReason.length < ORDER_REJECTION_REASON_MIN_LENGTH) {
    return `Rejection reason must be at least ${ORDER_REJECTION_REASON_MIN_LENGTH} characters`;
  }

  if (rejectionReason.length > ORDER_REJECTION_REASON_MAX_LENGTH) {
    return `Rejection reason must be at most ${ORDER_REJECTION_REASON_MAX_LENGTH} characters`;
  }

  return '';
}

//===================================================================

export function validateOrderStatusChange(
  values: OrderStatusChangeValues
): string {
  if (
    values.comment !== undefined &&
    values.comment.trim().length > ORDER_STATUS_COMMENT_MAX_LENGTH
  ) {
    return `Status comment must be at most ${ORDER_STATUS_COMMENT_MAX_LENGTH} characters`;
  }

  return values.status === 'rejected'
    ? buildOrderRejectionReasonError(values.rejectionReason ?? '')
    : '';
}
