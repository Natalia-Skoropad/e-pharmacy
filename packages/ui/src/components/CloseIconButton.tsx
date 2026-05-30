import type { ButtonHTMLAttributes } from 'react';

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
    <button type="button" className={className} aria-label={label} {...props}>
      <span aria-hidden="true">×</span>
    </button>
  );
}
