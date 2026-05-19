'use client';

import Button from '../Button';
import { ModalBase, ModalRoot } from '@/components/modals';

import css from './ConfirmActionModal.module.css';

//===================================================================

type ConfirmActionModalProps = {
  title: string;
  text: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  confirmButtonClassName?: string;
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
  confirmButtonClassName,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  return (
    <ModalRoot>
      <ModalBase
        labelledBy="confirm-action-title"
        onClose={onCancel}
      >
        <h2 className={css.title} id="confirm-action-title">
          {title}
        </h2>

        <p className={css.text}>{text}</p>

        <div className={css.actions}>
          <Button
            type="button"
            className={confirmButtonClassName}
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
      </ModalBase>
    </ModalRoot>
  );
}

export default ConfirmActionModal;
