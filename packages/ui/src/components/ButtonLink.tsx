import type { AnchorHTMLAttributes, ReactNode } from 'react';

import type { ButtonSize, ButtonVariant } from './Button';
import styles from './Button.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isDisabled?: boolean;
};

//=============================================================================

export function ButtonLink({
  children,
  leftIcon,
  rightIcon,
  variant = 'primary',
  size = 'md',
  className,
  isDisabled = false,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={joinClassNames(
        styles.button,
        styles[size],
        styles[variant],
        className
      )}
      data-size={size}
      data-variant={variant}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : props.tabIndex}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </a>
  );
}
