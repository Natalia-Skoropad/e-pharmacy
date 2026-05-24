import { CUSTOMER_PHONE_MAX_LENGTH } from '@/lib/validations/auth-validation';

import AuthFieldLayout from './AuthFieldLayout';
import type { AuthFieldBaseProps } from './types';
import css from './AuthField.module.css';

//===================================================================

function PhoneInput({
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
      label="Phone"
      required={required}
      error={error}
      isTouched={isTouched}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type="tel"
          value={value}
          placeholder="+380XXXXXXXXX"
          autoComplete="tel"
          maxLength={CUSTOMER_PHONE_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{CUSTOMER_PHONE_MAX_LENGTH}
        </span>
      </div>
    </AuthFieldLayout>
  );
}

export default PhoneInput;
