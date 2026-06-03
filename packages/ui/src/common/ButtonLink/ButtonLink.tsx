import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '../../utils/classNames';

import css from '../Button/Button.module.css';

//===================================================================

type ButtonLinkVariant = 'primary' | 'secondary' | 'ghost';
type ButtonLinkSize = 'sm' | 'md' | 'lg';

//===================================================================

type ButtonLinkProps = {
  children: ReactNode;
  variant?: ButtonLinkVariant;
  size?: ButtonLinkSize;
  fullWidth?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<typeof Link>;

//===================================================================

function ButtonLink({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        css.button,
        css[variant],
        css[size],
        fullWidth && css.fullWidth,
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export default ButtonLink;
