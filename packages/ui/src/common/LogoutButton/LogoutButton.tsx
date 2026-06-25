'use client';

import { LogOut } from 'lucide-react';

import Button, { type ButtonProps } from '../Button/Button';

//===================================================================

type LogoutButtonProps = Omit<
  ButtonProps,
  'children' | 'type' | 'isLoading' | 'loadingLabel'
> & {
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
};

//===================================================================

function LogoutButton({
  isLoading = false,
  label = 'Log out',
  loadingLabel = 'Logging out...',
  variant = 'secondary',
  size = 'sm',
  iconLeft,
  ...props
}: LogoutButtonProps) {
  return (
    <Button
      {...props}
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
