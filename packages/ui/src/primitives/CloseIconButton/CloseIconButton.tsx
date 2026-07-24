import type { ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

import IconButton from '../IconButton/IconButton';

import css from './CloseIconButton.module.css';

//===================================================================

type CloseIconButtonVariant = 'light' | 'dark';

//===================================================================

type CloseIconButtonProps = {
  label?: string;
  className?: string;
  variant?: CloseIconButtonVariant;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>;

//===================================================================

function CloseIconButton({
  label = 'Close',
  className,
  variant = 'light',
  ...props
}: CloseIconButtonProps) {
  return (
    <IconButton
      {...props}
      className={clsx(css.button, css[variant], className)}
      label={label}
      size="sm"
      icon={<X size={20} aria-hidden="true" />}
    />
  );
}

export default CloseIconButton;
export { CloseIconButton };
