import type { ButtonHTMLAttributes, ReactNode } from 'react';

//=============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

//=============================================================================

export function Button({
  children,
  disabled,
  isLoading = false,
  loadingLabel = 'Loading...',
  leftIcon,
  rightIcon,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={className}
      data-size={size}
      data-variant={variant}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {leftIcon}
      <span>{isLoading ? loadingLabel : children}</span>
      {rightIcon}
    </button>
  );
}
