import type { HTMLAttributes } from 'react';

import styles from './LoadingSpinner.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type LoadingSpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

//=============================================================================

export function LoadingSpinner({
  label = 'Loading...',
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <span
      className={joinClassNames(styles.spinner, className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className={styles.icon} aria-hidden="true" />
    </span>
  );
}
