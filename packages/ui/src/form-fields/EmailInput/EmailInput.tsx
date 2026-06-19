import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';
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
  disabled = false,
  className,
  label = 'Email',
  placeholder = 'example@mail.com',
  autoComplete = 'email',
  maxLength,
  pattern,
  hint,
  ariaDescribedBy,
  onChange,
}: AuthFieldBaseProps) {
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
      isTouched={isTouched}
      hint={hint}
    >
      <div className={css.inputWrap}>
        <input
          className={css.input}
          id={id}
          name={name}
          type="email"
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={onChange}
        />
        {typeof maxLength === 'number' ? (
          <span className={css.inputCounter} aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </FormFieldLayout>
  );
}

export default EmailInput;

export { EmailInput };
