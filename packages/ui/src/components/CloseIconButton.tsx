import type { ButtonHTMLAttributes } from 'react';

import styles from './CloseIconButton.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type CloseIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type'
> & {
  label?: string;
};

//=============================================================================

export function CloseIconButton({
  label = 'Close',
  className,
  ...props
}: CloseIconButtonProps) {
  return (
    <button
      type="button"
      className={joinClassNames(styles.button, className)}
      aria-label={label}
      {...props}
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}
