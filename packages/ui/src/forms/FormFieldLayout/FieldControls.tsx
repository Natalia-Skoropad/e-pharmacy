import type { ChangeEventHandler, HTMLInputAutoCompleteAttribute } from 'react';

import FormFieldLayout from './FormFieldLayout';
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
          onChange={onChange}
        />

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
      errorClassName={errorClassName}
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
          onChange={onChange}
        />

        {typeof maxLength === 'number' ? (
          <span className={css.textareaCounter} aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </FormFieldLayout>
  );
}
