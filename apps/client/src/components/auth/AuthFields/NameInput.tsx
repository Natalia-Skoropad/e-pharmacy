import { CUSTOMER_NAME_MAX_LENGTH } from '@/lib/validations/auth-validation';

import AuthFieldLayout from './AuthFieldLayout';
import type { AuthFieldBaseProps } from './types';
import css from './AuthField.module.css';

//===================================================================

function NameInput({
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
      label="Name"
      required={required}
      error={error}
      isTouched={isTouched}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type="text"
          value={value}
          placeholder="Your name"
          autoComplete="name"
          maxLength={CUSTOMER_NAME_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{CUSTOMER_NAME_MAX_LENGTH}
        </span>
      </div>
    </AuthFieldLayout>
  );
}

export default NameInput;
