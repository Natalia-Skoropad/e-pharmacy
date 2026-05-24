import { EMAIL_MAX_LENGTH } from '@/lib/validations/auth-validation';

import AuthFieldLayout from './AuthFieldLayout';
import type { AuthFieldBaseProps } from './types';
import css from './AuthField.module.css';

//===================================================================

function EmailInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  onChange,
}: AuthFieldBaseProps) {
  return (
    <AuthFieldLayout
      id={id}
      label="Email"
      required={required}
      error={error}
      isTouched={isTouched}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type="email"
          value={value}
          placeholder="example@mail.com"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{EMAIL_MAX_LENGTH}
        </span>
      </div>
    </AuthFieldLayout>
  );
}

export default EmailInput;
