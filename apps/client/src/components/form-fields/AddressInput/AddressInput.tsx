import FormFieldLayout from '../shared/FormFieldLayout';

import { CUSTOMER_ADDRESS_MAX_LENGTH } from '@/lib/validations';
import type { AddressFieldProps } from '@/types/form-fields';

import css from '../shared/FormField.module.css';

//===================================================================

function AddressInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  className,
  onChange,
}: AddressFieldProps) {
  return (
    <FormFieldLayout
      id={id}
      label="Delivery address / post office"
      required={required}
      className={className}
      error={error}
      errorClassName={css.addressError}
      isTouched={isTouched}
    >
      <div className={css.inputWrap}>
        <textarea
          className={css.textarea}
          id={id}
          name={name}
          value={value}
          placeholder="Example: 12 Central Street, Nova Poshta office #5, Kyiv"
          autoComplete="street-address"
          maxLength={CUSTOMER_ADDRESS_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.textareaCounter} aria-hidden="true">
          {value.length}/{CUSTOMER_ADDRESS_MAX_LENGTH}
        </span>
      </div>
    </FormFieldLayout>
  );
}

export default AddressInput;
