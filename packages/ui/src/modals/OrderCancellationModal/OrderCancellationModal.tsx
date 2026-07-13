'use client';

import { MessageSquareText } from 'lucide-react';
import { useId } from 'react';

import Button from '../../common/Button/Button';
import CloseIconButton from '../../common/CloseIconButton/CloseIconButton';
import CommentInput from '../../form-fields/CommentInput/CommentInput';
import ModalBase from '../ModalBase/ModalBase';
import ModalRoot from '../ModalRoot/ModalRoot';

import css from './OrderCancellationModal.module.css';

//===================================================================

export type OrderCancellationModalProps = Readonly<{
  isOpen?: boolean;
  value: string;
  isLoading?: boolean;
  minLength?: number;
  maxLength?: number;
  eyebrow?: string;
  title?: string;
  description?: string;
  fieldLabel?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}>;

//===================================================================

function OrderCancellationModal({
  isOpen = true,
  value,
  isLoading = false,
  minLength = 100,
  maxLength = 500,
  eyebrow = 'Reject order',
  title = 'Explain the cancellation reason',
  description =
    'This explanation will be saved in the order history and helps the client and support team understand what happened.',
  fieldLabel = 'Cancellation comment',
  placeholder = 'Describe why the order cannot be completed...',
  confirmLabel = 'Reject order',
  cancelLabel = 'Keep order',
  onChange,
  onCancel,
  onConfirm,
}: OrderCancellationModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const trimmedLength = value.trim().length;
  const isValid = trimmedLength >= minLength;
  const fieldError =
    value.length > 0 && !isValid
      ? `Add at least ${minLength} characters before rejecting the order.`
      : '';

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
            <p className={css.eyebrow}>{eyebrow}</p>
            <h2 className={css.title} id={titleId}>
              {title}
            </h2>
          </div>

          <CloseIconButton disabled={isLoading} onClick={handleCancel} />
        </div>

        <div className={css.notice}>
          <MessageSquareText size={20} aria-hidden="true" />
          <p id={descriptionId}>{description}</p>
        </div>

        <CommentInput
          id="order-cancellation-reason"
          name="orderCancellationReason"
          label={fieldLabel}
          placeholder={placeholder}
          required
          value={value}
          error={fieldError}
          isTouched={Boolean(value)}
          maxLength={maxLength}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
        />

        <p
          className={isValid ? css.counterValid : css.counterError}
          aria-live="polite"
        >
          {trimmedLength}/{minLength} minimum characters
        </p>

        <div className={css.actions}>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            className={css.confirmButton}
            type="button"
            isLoading={isLoading}
            disabled={!isValid || isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}

export default OrderCancellationModal;

export { OrderCancellationModal };
