import { Eye, EyeOff } from 'lucide-react';

import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';
import type { PasswordFieldProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

//===================================================================

function PasswordInput({
  id,
  name,
  value,
  label = 'Password',
  placeholder = 'Enter your password',
  autoComplete,
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  maxLength,
  pattern,
  hint,
  ariaDescribedBy,
  isVisible,
  labelAction,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  const hasError = Boolean(isTouched && error);
  const describedBy = [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null, ariaDescribedBy]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={className}
      labelAction={labelAction}
      error={error}
      isTouched={isTouched}
      hint={hint}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={onChange}
        />
        {typeof maxLength === 'number' ? (
          <span className={css.passwordCounter} aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        ) : null}
        <button
          className={css.eyeButton}
          type="button"
          aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
          disabled={disabled}
          onClick={onToggleVisibility}
        >
          {isVisible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </FormFieldLayout>
  );
}

export default PasswordInput;

export { PasswordInput };
