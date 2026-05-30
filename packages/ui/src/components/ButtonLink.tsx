import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from './Button';

//=============================================================================

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

//=============================================================================

export function ButtonLink({
  children,
  leftIcon,
  rightIcon,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={className} data-size={size} data-variant={variant} {...props}>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </a>
  );
}
