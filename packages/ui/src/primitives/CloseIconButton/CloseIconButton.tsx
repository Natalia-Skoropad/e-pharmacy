import type { ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

import css from './CloseIconButton.module.css';

//===================================================================

type CloseIconButtonVariant = 'light' | 'dark';

//===================================================================

type CloseIconButtonProps = {
  label?: string;
  className?: string;
  variant?: CloseIconButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

//===================================================================

function CloseIconButton({
  label = 'Close',
  className,
  type = 'button',
  variant = 'light',
  ...props
}: CloseIconButtonProps) {
  return (
    <button
      className={clsx(css.button, css[variant], className)}
      type={type}
      aria-label={label}
      {...props}
    >
      <X size={20} aria-hidden="true" />
    </button>
  );
}

export default CloseIconButton;
export { CloseIconButton };
