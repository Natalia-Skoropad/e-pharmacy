import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import styles from './SearchInput.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label?: string;
  inputClassName?: string;
};

//=============================================================================

export function SearchInput({
  label = 'Search',
  id,
  className,
  inputClassName,
  ...props
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={joinClassNames(styles.field, className)} htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className={joinClassNames(styles.input, inputClassName)}
        type="search"
        {...props}
      />
    </label>
  );
}
