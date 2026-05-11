'use client';

import Button from '../Button';
import { useBackdropClick, useBodyScrollLock, useEscapeToClose } from '@/hooks';

import css from './ConfirmActionModal.module.css';

//===================================================================

type ConfirmActionModalProps = {
  title: string;
  text: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

//===================================================================

function ConfirmActionModal({
  title,
  text,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  useBodyScrollLock(true);
  useEscapeToClose({ isOpen: true, onClose: onCancel });

  const handleBackdropMouseDown = useBackdropClick({ onClose: onCancel });

  return (
    <div className={css.backdrop} role="presentation" onMouseDown={handleBackdropMouseDown}>
      <div
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
      >
        <h2 className={css.title} id="confirm-action-title">
          {title}
        </h2>

        <p className={css.text}>{text}</p>

        <div className={css.actions}>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionModal;
