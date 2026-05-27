import AuthFieldLayout from '../shared/FormFieldLayout';

import { EMAIL_MAX_LENGTH } from '@/lib/validations/auth-validation';
import type { AuthFieldBaseProps } from '@/types/form-fields';

import css from '../shared/FormField.module.css';

//===================================================================

function EmailInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  className,
  onChange,
}: AuthFieldBaseProps) {
  return (
    <AuthFieldLayout
      id={id}
      label="Email"
      required={required}
      className={className}
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
