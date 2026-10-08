'use client';

import { Ban, CircleCheckBig, MessageSquareText, X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import clsx from 'clsx';

import { CommentInput } from '../../forms';
import { Button, CloseIconButton } from '../../primitives';
import { ModalBase } from '../ModalBase';
import { ModalRoot } from '../ModalRoot';

import css from './ReasonModal.module.css';

//===================================================================

export type ReasonModalTone = 'accent' | 'danger';

//===================================================================

export type ReasonModalProps = Readonly<{
  isOpen?: boolean;
  eyebrow: string;
  title: string;
  description: ReactNode;
  value: string;
  fieldName: string;
  fieldLabel: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel: string;
  maxLength: number;
  error?: string;
  requestError?: ReactNode;
  isLoading?: boolean;
  tone?: ReasonModalTone;
  onValueChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}>;

//===================================================================

function ReasonModal({
  isOpen = true,
  eyebrow,
  title,
  description,
  value,
  fieldName,
  fieldLabel,
  placeholder,
  confirmLabel,
  cancelLabel,
  maxLength,
  error = '',
  requestError,
  isLoading = false,
  tone = 'danger',
  onValueChange,
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const fieldId = useId();

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

        <div className={clsx(css.notice, css[tone])}>
          <MessageSquareText size={20} aria-hidden="true" />
          <p id={descriptionId}>{description}</p>
        </div>

        <CommentInput
          id={fieldId}
          name={fieldName}
          label={fieldLabel}
          placeholder={placeholder}
          required
          value={value}
          error={error}
          isTouched
          maxLength={maxLength}
          disabled={isLoading}
          onChange={(event) =>
            onValueChange(event.target.value.slice(0, maxLength))
          }
        />

        {requestError ? (
          <div className={css.requestError} role="alert">
            {requestError}
          </div>
        ) : null}

        <div className={css.actions}>
          <Button
            type="button"
            variant="secondary"
            iconLeft={<X size={17} aria-hidden="true" />}
            disabled={isLoading}
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            className={tone === 'danger' ? css.dangerButton : undefined}
            type="button"
            iconLeft={
              tone === 'danger' ? (
                <Ban size={17} aria-hidden="true" />
              ) : (
                <CircleCheckBig size={17} aria-hidden="true" />
              )
            }
            isLoading={isLoading}
            disabled={Boolean(error) || isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}

export default ReasonModal;
export { ReasonModal };
