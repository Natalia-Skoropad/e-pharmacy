import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';
import type { AddressFieldProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

//===================================================================

function AddressInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  label = 'Delivery address / post office',
  placeholder = 'Example: 12 Central Street, Nova Poshta office #5, Kyiv',
  autoComplete = 'street-address',
  maxLength,
  hint,
  ariaDescribedBy,
  onChange,
}: AddressFieldProps) {
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
      error={error}
      errorClassName={css.addressError}
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
          disabled={disabled}
          aria-invalid={hasError}
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

export default AddressInput;

export { AddressInput };
