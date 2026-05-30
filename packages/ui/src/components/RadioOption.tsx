import type { InputHTMLAttributes, ReactNode } from 'react';

import styles from './RadioOption.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type RadioOptionProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: ReactNode;
  inputClassName?: string;
};

//=============================================================================

export function RadioOption({
  label,
  className,
  inputClassName,
  ...props
}: RadioOptionProps) {
  return (
    <label className={joinClassNames(styles.option, className)}>
      <input
        className={joinClassNames(styles.input, inputClassName)}
        type="radio"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
