import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from 'clsx';

import css from './AuthFormLayout.module.css';

//===================================================================

type AuthFormLayoutProps = Omit<
  ComponentPropsWithoutRef<'form'>,
  'children' | 'title'
> & {
  title?: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
};

//===================================================================

function AuthFormLayout({
  title,
  description,
  footer,
  children,
  className,
  ...formProps
}: AuthFormLayoutProps) {
  const hasHeader = Boolean(title || description);

  return (
    <form className={clsx(css.form, className)} {...formProps}>
      {hasHeader ? (
        <div className={css.head}>
          {title ? <h1 className={css.title}>{title}</h1> : null}
          {description ? <p className={css.text}>{description}</p> : null}
        </div>
      ) : null}

      {children}

      {footer ? <p className={css.footerText}>{footer}</p> : null}
    </form>
  );
}

export type { AuthFormLayoutProps };
export default AuthFormLayout;
