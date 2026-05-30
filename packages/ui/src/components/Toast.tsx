import type { ReactNode } from 'react';

import styles from './Toast.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastProps = {
  message: ReactNode;
  variant?: ToastVariant;
  className?: string;
};

//=============================================================================

export function Toast({ message, variant = 'info', className }: ToastProps) {
  return (
    <div
      className={joinClassNames(styles.toast, styles[variant], className)}
      data-variant={variant}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
