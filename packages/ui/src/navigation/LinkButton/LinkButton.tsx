import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import type { ButtonSize, ButtonVariant } from '../../primitives/Button/Button';

import css from '../../primitiv../../primitives/Button/Button.module.css';

//===================================================================

type LinkButtonRenderProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'children'
> & {
  children: ReactNode;
  className: string;
};

export type LinkButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  renderLink?: (props: LinkButtonRenderProps) => ReactNode;
} & ComponentPropsWithoutRef<typeof Link>;

//===================================================================

function LinkButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  renderLink,
  ...props
}: LinkButtonProps) {
  const classNames = clsx(
    css.button,
    css[variant],
    css[size],
    fullWidth && css.fullWidth,
    className
  );
  const content = (
    <>
      {iconLeft}
      <span className={css.content}>{children}</span>
      {iconRight}
    </>
  );

  if (renderLink) {
    return renderLink({ ...props, className: classNames, children: content });
  }

  return (
    <Link className={classNames} {...props}>
      {content}
    </Link>
  );
}

export default LinkButton;
export { LinkButton };
