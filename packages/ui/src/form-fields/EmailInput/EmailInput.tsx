import { USER_EMAIL_MAX_LENGTH } from '@e-pharmacy/validation';

import FormFieldLayout from '../FormFieldLayout';
import type { AuthFieldBaseProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

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
    <FormFieldLayout
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
          maxLength={USER_EMAIL_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{USER_EMAIL_MAX_LENGTH}
        </span>
      </div>
    </FormFieldLayout>
  );
}

export default EmailInput;
