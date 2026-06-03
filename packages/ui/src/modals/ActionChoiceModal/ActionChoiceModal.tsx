'use client';

import { useId } from 'react';

import Button from '../../common/Button';
import ModalBase from '../ModalBase';
import ModalRoot from '../ModalRoot';

import css from './ActionChoiceModal.module.css';

//===================================================================

type ActionChoiceModalProps = {
  title: string;
  text?: string;
  primaryLabel: string;
  secondaryLabel: string;
  isOpen?: boolean;
  isLoading?: boolean;
  primaryButtonClassName?: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onClose?: () => void;
};

//===================================================================

function ActionChoiceModal({
  title,
  text,
  primaryLabel,
  secondaryLabel,
  isOpen = true,
  isLoading = false,
  primaryButtonClassName,
  onPrimaryAction,
  onSecondaryAction,
  onClose,
}: ActionChoiceModalProps) {
  const titleId = useId();
  const handleClose = onClose ?? onSecondaryAction;

  if (!isOpen) return null;

  return (
    <ModalRoot>
      <ModalBase isOpen={isOpen} labelledBy={titleId} onClose={handleClose}>
        <h2 className={css.title} id={titleId}>
          {title}
        </h2>

        {text ? <p className={css.text}>{text}</p> : null}

        <div className={css.actions}>
          <Button
            type="button"
            className={primaryButtonClassName}
            disabled={isLoading}
            onClick={onPrimaryAction}
          >
            {primaryLabel}
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onSecondaryAction}
          >
            {secondaryLabel}
          </Button>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}

export default ActionChoiceModal;
