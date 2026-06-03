'use client';

import { useId } from 'react';

import Button from '../Button';
import ModalBase from '../ModalBase';
import ModalRoot from '../ModalRoot';

import css from './ConfirmActionModal.module.css';

//===================================================================

type ConfirmActionModalProps = {
  title: string;
  text: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isOpen?: boolean;
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
  isOpen = true,
  isLoading = false,
  confirmButtonClassName,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <ModalRoot>
      <ModalBase isOpen={isOpen} labelledBy={titleId} onClose={onCancel}>
        <h2 className={css.title} id={titleId}>
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
