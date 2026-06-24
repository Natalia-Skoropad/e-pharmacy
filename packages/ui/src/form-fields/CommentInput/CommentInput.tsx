import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';
import type { CommentFieldProps } from '../types';

import css from '../FormFieldLayout/FormField.module.css';

//===================================================================

function CommentInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = false,
  disabled = false,
  className,
  errorClassName,
  label = 'Comment for pharmacy',
  placeholder = 'Add details for the pharmacy if needed',
  maxLength,
  hint,
  ariaDescribedBy,
  onChange,
}: CommentFieldProps) {
  const hasError = Boolean(isTouched && error);
  const describedBy =
    [
      hint ? `${id}-hint` : null,
      hasError ? `${id}-error` : null,
      ariaDescribedBy,
    ].filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={className}
      errorClassName={errorClassName}
      error={error}
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

export default CommentInput;

export { CommentInput };
