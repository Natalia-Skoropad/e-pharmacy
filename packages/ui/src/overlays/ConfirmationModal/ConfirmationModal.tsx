'use client';

import { type ReactNode, useId } from 'react';

import Button, {
  type ButtonSize,
  type ButtonVariant,
} from '../../primitives/Button/Button';

import ModalBase from '../ModalBase/ModalBase';
import ModalRoot from '../ModalRoot/ModalRoot';

import css from './ConfirmationModal.module.css';

//===================================================================

export type ConfirmationModalProps = {
  title: ReactNode;
  text?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isOpen?: boolean;
  isLoading?: boolean;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  confirmButtonVariant?: ButtonVariant;
  cancelButtonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

//===================================================================

function ConfirmationModal({
  title,
  text,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isOpen = true,
  isLoading = false,
  confirmButtonClassName,
  cancelButtonClassName,
  confirmButtonVariant = 'primary',
  cancelButtonVariant = 'secondary',
  buttonSize = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const modalDescription = description ?? text;

  if (!isOpen) return null;

  return (
    <ModalRoot>
      <ModalBase
        isOpen={isOpen}
        labelledBy={titleId}
        describedBy={modalDescription ? descriptionId : undefined}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
        onClose={onCancel}
      >
        <h2 className={css.title} id={titleId}>
          {title}
        </h2>

        {modalDescription ? (
          <div className={css.text} id={descriptionId}>
            {modalDescription}
          </div>
        ) : null}

        <div className={css.actions}>
          <Button
            type="button"
            className={confirmButtonClassName}
            variant={confirmButtonVariant}
            size={buttonSize}
            isLoading={isLoading}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>

          <Button
            type="button"
            className={cancelButtonClassName}
            variant={cancelButtonVariant}
            size={buttonSize}
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

export default ConfirmationModal;
export { ConfirmationModal };
