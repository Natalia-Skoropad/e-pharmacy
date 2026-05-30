import type { SelectHTMLAttributes } from 'react';

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
};

//=============================================================================

export function SelectField<TValue extends string = string>({
  label,
  options,
  placeholder,
  error,
  id,
  className,
  ...props
}: SelectFieldProps<TValue>) {
  const selectId = id ?? props.name;
  const errorId = error && selectId ? `${selectId}-error` : undefined;

  return (
    <label className={className} htmlFor={selectId}>
      <span>{label}</span>
      <select
        id={selectId}
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
      {error ? <span id={errorId}>{error}</span> : null}
    </label>
  );
}
