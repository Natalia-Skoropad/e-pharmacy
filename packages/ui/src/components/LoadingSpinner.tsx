import type { HTMLAttributes } from 'react';

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
    <span className={className} role="status" aria-label={label} {...props}>
      <span aria-hidden="true">⏳</span>
    </span>
  );
}
