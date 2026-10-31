'use client';

import {
  type ChangeEventHandler,
  type HTMLInputAutoCompleteAttribute,
} from 'react';

import clsx from 'clsx';

import FormFieldLayout, { FormFieldError } from './FormFieldLayout';
import type { BaseFieldProps } from '../types';

import css from './FormField.module.css';

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
  hasWarning = false,
  ariaDescribedBy,
}: {
  id: string;
  hint?: string;
  hasError: boolean;
  hasWarning?: boolean;
  ariaDescribedBy?: string;
}): string | undefined {
  return (
    [
      hint ? `${id}-hint` : undefined,
      hasError ? `${id}-error` : undefined,
      hasWarning ? `${id}-warning` : undefined,
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
  warning,
  isTouched,
  required = true,
  disabled = false,
  className,
  label,
  placeholder,
  autoComplete,
  maxLength,
  hint,
  ariaDescribedBy,
  type = 'text',
  inputMode,
  onChange,
}: TextInputControlProps) {
  const hasError = Boolean(isTouched && error);
  const hasWarning = Boolean(warning && !hasError);

  const describedBy = getDescribedBy({
    id,
    hint,
    hasError,
    hasWarning,
    ariaDescribedBy,
  });

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={clsx(className, hasWarning && css.warningField)}
      error={error}
      isTouched={isTouched}
      hint={hint}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type={type === 'email' ? 'text' : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={type === 'email' ? 'email' : inputMode}
          maxLength={maxLength}
          aria-required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={onChange}
        />
        {typeof maxLength === 'number' ? (
          <span className={css.inputCounter} aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>

      {hasWarning ? (
        <p id={`${id}-warning`} className={css.warningHint} role="status">
          {warning}
        </p>
      ) : null}
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

  const describedBy = getDescribedBy({
    id,
    hint,
    hasError,
    ariaDescribedBy,
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
          aria-required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={onChange}
        />
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
