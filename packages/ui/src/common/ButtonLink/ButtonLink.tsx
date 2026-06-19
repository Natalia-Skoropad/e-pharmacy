import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import type { ButtonSize, ButtonVariant } from '../Button/Button';
import css from '../Button/Button.module.css';

//===================================================================

export type ButtonLinkProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<typeof Link>;

//===================================================================

function ButtonLink({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={clsx(
        css.button,
        css[variant],
        css[size],
        fullWidth && css.fullWidth,
        className
      )}
      {...props}
    >
      {iconLeft}
      <span className={css.content}>{children}</span>
      {iconRight}
    </Link>
  );
}

export default ButtonLink;

export { ButtonLink };
