'use client';

import { LogOut } from 'lucide-react';
import clsx from 'clsx';

import Button, { type ButtonProps } from '../../primitives/Button/Button';

import css from './LogoutButton.module.css';

//===================================================================

type LogoutButtonTone = 'default' | 'inverse';

//===================================================================

type LogoutButtonProps = Omit<
  ButtonProps,
  'children' | 'type' | 'isLoading' | 'loadingLabel'
> & {
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
  tone?: LogoutButtonTone;
};

//===================================================================

function LogoutButton({
  isLoading = false,
  label = 'Log out',
  loadingLabel = 'Logging out...',
  variant = 'secondary',
  size = 'sm',
  tone = 'default',
  iconLeft,
  className,
  ...props
}: LogoutButtonProps) {
  return (
    <Button
      {...props}
      className={clsx(tone === 'inverse' && css.inverse, className)}
      type="button"
      variant={variant}
      size={size}
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      iconLeft={iconLeft ?? <LogOut size={16} aria-hidden="true" />}
    >
      {label}
    </Button>
  );
}

export default LogoutButton;
export { LogoutButton };
