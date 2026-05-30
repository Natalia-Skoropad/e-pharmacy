import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

import styles from './SelectField.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type SelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps<TValue extends string = string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> & {
  label: string;
  options: SelectOption<TValue>[];
  placeholder?: string;
  error?: string;
  selectClassName?: string;
  errorClassName?: string;
};

//=============================================================================

export function SelectField<TValue extends string = string>({
  label,
  options,
  placeholder,
  error,
  id,
  className,
  selectClassName,
  errorClassName,
  ...props
}: SelectFieldProps<TValue>) {
  const generatedId = useId();
  const selectId = id ?? props.name ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <label className={joinClassNames(styles.field, className)} htmlFor={selectId}>
      <span>{label}</span>
      <select
        id={selectId}
        className={joinClassNames(styles.select, selectClassName)}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} className={joinClassNames(styles.error, errorClassName)}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
