import type { ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

import css from './CloseIconButton.module.css';

//===================================================================

type CloseIconButtonProps = {
  label?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

//===================================================================

function CloseIconButton({
  label = 'Close',
  className,
  type = 'button',
  ...props
}: CloseIconButtonProps) {
  return (
    <button
      className={clsx(css.button, className)}
      type={type}
      aria-label={label}
      {...props}
    >
      <X size={20} aria-hidden="true" />
    </button>
  );
}

export default CloseIconButton;
