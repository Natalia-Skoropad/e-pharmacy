import type { ReactNode } from 'react';

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
      className={className}
      data-variant={variant}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
