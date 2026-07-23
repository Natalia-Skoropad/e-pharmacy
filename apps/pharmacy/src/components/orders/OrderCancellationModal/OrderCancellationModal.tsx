'use client';

import { MessageSquareText } from 'lucide-react';
import { useId } from 'react';

import { Button, CloseIconButton } from '@e-pharmacy/ui/common';
import { CommentInput } from '@e-pharmacy/ui/form-fields';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/modals';

import {
  ORDER_REJECTION_REASON_MAX_LENGTH,
  buildOrderRejectionReasonError,
} from '@e-pharmacy/validation/order';

import css from './OrderCancellationModal.module.css';

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
  const titleId = useId();
  const descriptionId = useId();
  const fieldId = useId();
  const fieldError = buildOrderRejectionReasonError(value);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (!isLoading) onCancel();
  };

  return (
    <ModalRoot>
      <ModalBase
        isOpen={isOpen}
        labelledBy={titleId}
        describedBy={descriptionId}
        dialogClassName={css.dialog}
        closeOnBackdrop={!isLoading}
        closeOnEscape={!isLoading}
        onClose={handleCancel}
      >
        <div className={css.header}>
          <div>
            <p className={css.eyebrow}>Reject order</p>
            <h2 className={css.title} id={titleId}>
              Explain the cancellation reason
            </h2>
          </div>

          <CloseIconButton disabled={isLoading} onClick={handleCancel} />
        </div>

        <div className={css.notice}>
          <MessageSquareText size={20} aria-hidden="true" />
          <p id={descriptionId}>
            This explanation will be saved in the order history and helps the
            client and support team understand what happened.
          </p>
        </div>

        <CommentInput
          id={fieldId}
          name="orderCancellationReason"
          label="Cancellation comment"
          placeholder="Describe why the order cannot be completed..."
          required
          value={value}
          error={fieldError}
          isTouched
          maxLength={ORDER_REJECTION_REASON_MAX_LENGTH}
          disabled={isLoading}
          onChange={(event) =>
            onValueChange(
              event.target.value.slice(0, ORDER_REJECTION_REASON_MAX_LENGTH)
            )
          }
        />

        <div className={css.actions}>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={handleCancel}
          >
            Keep order
          </Button>

          <Button
            className={css.confirmButton}
            type="button"
            isLoading={isLoading}
            disabled={Boolean(fieldError) || isLoading}
            onClick={onConfirm}
          >
            Reject order
          </Button>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}

export default OrderCancellationModal;
export { OrderCancellationModal };
