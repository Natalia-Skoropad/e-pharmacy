'use client';

import {
  useState,
  type FormEvent,
  type ChangeEventHandler,
  type HTMLInputAutoCompleteAttribute,
} from 'react';

import clsx from 'clsx';

import FormFieldLayout, { FormFieldError } from './FormFieldLayout';
import type { BaseFieldProps } from '../types';

import css from './FormField.module.css';

//===================================================================

// Replaces browser-localized constraint bubbles with the existing site's
// dark, compact tooltip style. Domain/submit errors still use FormFieldError.
export function useFieldValidationTooltip() {
  const [message, setMessage] = useState('');

  const onInvalid = (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();

    const field = event.currentTarget;
    const { validity } = field;

    if (validity.valueMissing) setMessage('Please fill out this field.');
    else if (validity.typeMismatch)
      setMessage('Please enter a valid email address.');
    else if (validity.patternMismatch)
      setMessage('Please use the requested format.');
    else if (validity.tooShort)
      setMessage(`Enter at least ${field.minLength} characters.`);
    else if (validity.tooLong)
      setMessage(`Use no more than ${field.maxLength} characters.`);
    else setMessage('Please check this field.');
  };

  return { message, onInvalid, hide: () => setMessage('') };
}

//===================================================================

type SharedControlProps = Omit<BaseFieldProps, 'label'> & {
  label: string;
  ariaDescribedBy?: string;
};

//===================================================================

function getDescribedBy({
  id,
  hint,
  hasError,
  ariaDescribedBy,
}: {
  id: string;
  hint?: string;
  hasError: boolean;
  ariaDescribedBy?: string;
}): string | undefined {
  return (
    [
      hint ? `${id}-hint` : undefined,
      hasError ? `${id}-error` : undefined,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  );
}

//===================================================================

export type TextInputControlProps = SharedControlProps & {
  type?: 'text' | 'email' | 'tel';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  pattern?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

//===================================================================

export function TextInputControl({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  label,
  placeholder,
  autoComplete,
  maxLength,
  pattern,
  hint,
  ariaDescribedBy,
  type = 'text',
  inputMode,
  onChange,
}: TextInputControlProps) {
  const hasError = Boolean(isTouched && error);
  const constraint = useFieldValidationTooltip();

  const describedBy = getDescribedBy({
    id,
    hint,
    hasError,

    ariaDescribedBy: [
      ariaDescribedBy,
      constraint.message ? `${id}-validation-tooltip` : undefined,
    ]
      .filter(Boolean)
      .join(' '),
  });

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={className}
      error={error}
      isTouched={isTouched}
      hint={hint}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          pattern={pattern}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            constraint.hide();
            onChange(event);
          }}
          onInvalid={constraint.onInvalid}
          onBlur={constraint.hide}
        />
        {constraint.message ? (
          <span
            className={css.validationTooltip}
            id={`${id}-validation-tooltip`}
            role="tooltip"
          >
            {constraint.message}
          </span>
        ) : null}

        {typeof maxLength === 'number' ? (
          <span className={css.inputCounter} aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </FormFieldLayout>
  );
}

//===================================================================

export type TextareaControlProps = SharedControlProps & {
  errorClassName?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

//===================================================================

export function TextareaControl({
  id,
  name,
  value,
  error,
  isTouched,
  required = false,
  disabled = false,
  className,
  errorClassName,
  label,
  placeholder,
  autoComplete,
  maxLength,
  hint,
  ariaDescribedBy,
  onChange,
}: TextareaControlProps) {
  const hasError = Boolean(isTouched && error);
  const constraint = useFieldValidationTooltip();

  const describedBy = getDescribedBy({
    id,
    hint,
    hasError,

    ariaDescribedBy: [
      ariaDescribedBy,
      constraint.message ? `${id}-validation-tooltip` : undefined,
    ]
      .filter(Boolean)
      .join(' '),
  });

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={className}
      renderError={false}
      error={error}
      isTouched={isTouched}
      hint={hint}
    >
      <div className={css.inputWrap}>
        <textarea
          className={css.textarea}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            constraint.hide();
            onChange(event);
          }}
          onInvalid={constraint.onInvalid}
          onBlur={constraint.hide}
        />
        {constraint.message ? (
          <span
            className={css.validationTooltip}
            id={`${id}-validation-tooltip`}
            role="tooltip"
          >
            {constraint.message}
          </span>
        ) : null}

        {typeof maxLength === 'number' ? (
          <span className={css.textareaCounter} aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        ) : null}

        <FormFieldError
          id={id}
          error={error}
          isTouched={isTouched}
          className={clsx(css.textareaError, errorClassName)}
        />
      </div>
    </FormFieldLayout>
  );
}
