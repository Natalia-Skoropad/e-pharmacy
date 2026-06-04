import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@e-pharmacy/utils/classes';

import css from './Button.module.css';

//===================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

//===================================================================

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

//===================================================================

function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        css.button,
        css[variant],
        css[size],
        fullWidth && css.fullWidth,
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
