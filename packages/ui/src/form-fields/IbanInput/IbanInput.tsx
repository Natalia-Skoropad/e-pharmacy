import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';
import type { AuthFieldBaseProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

//===================================================================

function IbanInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  label = 'IBAN',
  placeholder = 'UA123456789012345678901234567',
  autoComplete = 'off',
  maxLength = 29,
  hint = 'Use the Ukrainian IBAN format: UA + 27 digits.',
  ariaDescribedBy,
  onChange,
}: AuthFieldBaseProps) {
  const hasError = Boolean(isTouched && error);
  const describedBy =
    [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null, ariaDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={className}
      error={error}
      isTouched={isTouched}
      hint={hint}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern="UA[0-9]{27}"
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{maxLength}
        </span>
      </div>
    </FormFieldLayout>
  );
}

export default IbanInput;
export { IbanInput };
