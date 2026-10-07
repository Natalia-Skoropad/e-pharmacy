'use client';

import { ReasonModal } from '@e-pharmacy/ui/overlays';

import {
  ORDER_REJECTION_REASON_MAX_LENGTH,
  buildOrderRejectionReasonError,
} from '@e-pharmacy/validation/order';

//===================================================================

export type OrderCancellationModalProps = Readonly<{
  isOpen?: boolean;
  value: string;
  isLoading?: boolean;
  onValueChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}>;

//===================================================================

function OrderCancellationModal({
  isOpen = true,
  value,
  isLoading = false,
  onValueChange,
  onCancel,
  onConfirm,
}: OrderCancellationModalProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      eyebrow="Reject order"
      title="Explain the cancellation reason"
      description="This explanation will be saved in the order history and helps the client and support team understand what happened."
      value={value}
      fieldName="orderCancellationReason"
      fieldLabel="Cancellation comment"
      placeholder="Describe why the order cannot be completed..."
      confirmLabel="Reject order"
      cancelLabel="Keep order"
      maxLength={ORDER_REJECTION_REASON_MAX_LENGTH}
      error={buildOrderRejectionReasonError(value)}
      isLoading={isLoading}
      tone="danger"
      onValueChange={onValueChange}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export default OrderCancellationModal;
export { OrderCancellationModal };
