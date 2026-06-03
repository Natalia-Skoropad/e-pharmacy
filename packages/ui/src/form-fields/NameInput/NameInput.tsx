import FormFieldLayout from '../FormFieldLayout';
import type { AuthFieldBaseProps } from '../types';
import css from '../FormFieldLayout/FormField.module.css';

const CUSTOMER_NAME_MAX_LENGTH = 20;


//===================================================================

function NameInput({
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
      label="Name"
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
          type="text"
          value={value}
          placeholder="Your name"
          autoComplete="name"
          maxLength={CUSTOMER_NAME_MAX_LENGTH}
          aria-invalid={Boolean(isTouched && error)}
          aria-describedby={`${id}-error`}
          onChange={onChange}
        />
        <span className={css.inputCounter} aria-hidden="true">
          {value.length}/{CUSTOMER_NAME_MAX_LENGTH}
        </span>
      </div>
    </FormFieldLayout>
  );
}

export default NameInput;
