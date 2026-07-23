import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import clsx from 'clsx';

import css from './Button.module.css';

//===================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

//===================================================================

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

//===================================================================

function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingLabel,
  iconLeft,
  iconRight,
  className,
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={clsx(
        css.button,
        css[variant],
        css[size],
        fullWidth && css.fullWidth,
        isLoading && css.loading,
        className
      )}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className={css.spinner} size={18} aria-hidden="true" />
      ) : (
        iconLeft
      )}

      <span className={css.content}>
        {loadingLabel && isLoading ? loadingLabel : children}
      </span>

      {!isLoading ? iconRight : null}
    </button>
  );
}

export default Button;
export { Button };
