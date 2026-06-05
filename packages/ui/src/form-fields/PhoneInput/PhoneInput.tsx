import { USER_PHONE_MAX_LENGTH } from '@e-pharmacy/validation';

import FormFieldLayout from '../FormFieldLayout';
import type { AuthFieldBaseProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

//===================================================================

function PhoneInput({
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
      label="Phone"
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
          type="tel"
          value={value}
          placeholder="+380XXXXXXXXX"
          autoComplete="tel"
          maxLength={USER_PHONE_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{USER_PHONE_MAX_LENGTH}
        </span>
      </div>
    </FormFieldLayout>
  );
}

export default PhoneInput;
