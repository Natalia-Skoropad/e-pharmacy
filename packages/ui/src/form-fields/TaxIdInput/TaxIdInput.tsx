import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';
import type { AuthFieldBaseProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

//===================================================================

function TaxIdInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  label = 'Tax ID / EDRPOU',
  placeholder = '12345678',
  autoComplete = 'off',
  maxLength = 10,
  hint = 'Use 8–10 digits.',
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
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern="[0-9]{8,10}"
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

export default TaxIdInput;
export { TaxIdInput };
