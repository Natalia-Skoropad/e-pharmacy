import FormFieldLayout from '../shared/FormFieldLayout';

import type { CommentFieldProps } from '@/types/form-fields';

import css from '../shared/FormField.module.css';

//===================================================================

const COMMENT_MAX_LENGTH = 500;

//===================================================================

function CommentInput({
  id,
  name,
  value,
  error,
  isTouched,
  required = false,
  className,
  label = 'Comment for pharmacy',
  placeholder = 'Add details for the pharmacy if needed',
  maxLength = COMMENT_MAX_LENGTH,
  onChange,
}: CommentFieldProps) {
  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={className}
      error={error}
      isTouched={isTouched}
    >
      <div className={css.inputWrap}>
        <textarea
          className={css.textarea}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.textareaCounter} aria-hidden="true">
          {value.length}/{maxLength}
        </span>
      </div>
    </FormFieldLayout>
  );
}

export default CommentInput;
