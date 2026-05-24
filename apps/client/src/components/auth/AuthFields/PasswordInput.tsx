import { Eye, EyeOff } from 'lucide-react';

import { PASSWORD_MAX_LENGTH } from '@/lib/validations/auth-validation';

import AuthFieldLayout from './AuthFieldLayout';
import type { PasswordFieldProps } from './types';
import css from './AuthField.module.css';

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
  isVisible,
  labelAction,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <AuthFieldLayout
      id={id}
      label={label}
      required={required}
      labelAction={labelAction}
      error={error}
      isTouched={isTouched}
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
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.passwordCounter} aria-hidden="true">
          {value.length}/{PASSWORD_MAX_LENGTH}
        </span>
        <button
          className={css.eyeButton}
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          onClick={onToggleVisibility}
        >
          {isVisible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </AuthFieldLayout>
  );
}

export default PasswordInput;
