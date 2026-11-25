'use client';

import { Ban, CircleCheckBig, MessageSquareText, X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { CommentInput, RadioOption } from '../../forms';
import { Button, CloseIconButton } from '../../primitives';
import { ModalBase } from '../ModalBase';
import { ModalRoot } from '../ModalRoot';

import css from './ReasonModal.module.css';

//===================================================================

export type ReasonModalTone =
  | 'accent'
  | 'danger'
  | 'verification'
  | 'moderation'
  | 'reactivation';

//===================================================================

export type ReasonModalProps = Readonly<{
  isOpen?: boolean;
  eyebrow: string;
  title: string;
  description: ReactNode;

  /** Optional review content between the explanation and the reason field. */
  details?: ReactNode;

  /** Optional status transition directly below the modal heading. */
  headerDetails?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  requestError?: ReactNode;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  tone?: ReasonModalTone;
  onCancel: () => void;
  onConfirm: () => void;
}> &
  (
    | Readonly<{
        withoutReason: true;
        reasonOptions?: never;
        value?: never;
        fieldName?: never;
        fieldLabel?: never;
        placeholder?: never;
        maxLength?: never;
        error?: never;
        onValueChange?: never;
      }>
    | Readonly<{
        withoutReason?: false;
        reasonOptions?: readonly Readonly<{ code: string; label: string }>[];
        value: string;
        fieldName: string;
        fieldLabel: string;
        placeholder: string;
        maxLength: number;
        error?: string;
        onValueChange: (value: string) => void;
      }>
  );

//===================================================================

function ReasonModal({
  isOpen = true,
  eyebrow,
  title,
  description,
  details,
  headerDetails,
  withoutReason = false,
  value = '',
  reasonOptions,
  fieldName = '',
  fieldLabel = '',
  placeholder = '',
  confirmLabel,
  cancelLabel,
  maxLength = 500,
  error = '',
  requestError,
  isLoading = false,
  confirmDisabled = false,
  tone = 'danger',
  onValueChange,
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const fieldId = useId();
  const [otherSelected, setOtherSelected] = useState(false);

  const selectedPreset = reasonOptions?.find(
    (option) => option.code !== 'other' && option.label === value
  );

  const isOtherReason = Boolean(
    reasonOptions && (otherSelected || (value && !selectedPreset))
  );

  if (!isOpen) return null;

  const handleCancel = () => {
    if (!isLoading) {
      setOtherSelected(false);
      onCancel();
    }
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

        {headerDetails ? (
          <div className={css.headerDetails}>{headerDetails}</div>
        ) : null}

        <div className={clsx(css.notice, css[tone])}>
          <MessageSquareText size={20} aria-hidden="true" />
          <p id={descriptionId}>{description}</p>
        </div>

        {details ? <div>{details}</div> : null}

        {!withoutReason && reasonOptions ? (
          <fieldset className={css.reasonChoices} disabled={isLoading}>
            <legend className={css.reasonLegend}>Choose a reason</legend>
            {reasonOptions.map((option) => (
              <RadioOption
                key={option.code}
                name={`${fieldName}Choice`}
                value={option.code}
                checked={
                  option.code === 'other'
                    ? isOtherReason
                    : !isOtherReason && selectedPreset?.code === option.code
                }
                label={option.label}
                disabled={isLoading}
                onChange={() => {
                  setOtherSelected(option.code === 'other');
                  onValueChange?.(option.code === 'other' ? '' : option.label);
                }}
              />
            ))}
          </fieldset>
        ) : null}

        {!withoutReason && (!reasonOptions || isOtherReason) ? (
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
              onValueChange?.(event.target.value.slice(0, maxLength))
            }
          />
        ) : null}

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
            className={
              tone === 'danger'
                ? css.dangerButton
                : tone === 'verification'
                  ? css.verificationButton
                  : tone === 'moderation'
                    ? css.moderationButton
                    : tone === 'reactivation'
                      ? css.reactivationButton
                      : undefined
            }
            type="button"
            iconLeft={
              tone === 'danger' ? (
                <Ban size={17} aria-hidden="true" />
              ) : (
                <CircleCheckBig size={17} aria-hidden="true" />
              )
            }
            isLoading={isLoading}
            disabled={confirmDisabled || Boolean(error) || isLoading}
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
