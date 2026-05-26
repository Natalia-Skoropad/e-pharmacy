import type { ReactNode } from 'react';
import clsx from 'clsx';

import css from './FormField.module.css';

//===================================================================

type AuthFieldLayoutProps = {
  id: string;
  label: string;
  required?: boolean;
  labelAction?: ReactNode;
  children: ReactNode;
  className?: string;
  errorClassName?: string;
  error?: string;
  isTouched?: boolean;
};

//===================================================================

function AuthFieldLayout({
  id,
  label,
  required = true,
  labelAction,
  children,
  className,
  errorClassName,
  error,
  isTouched,
}: AuthFieldLayoutProps) {
  const errorId = `${id}-error`;

  return (
    <div className={clsx(css.field, className)}>
      <div className={labelAction ? css.labelRow : undefined}>
        <label className={css.label} htmlFor={id}>
          {label}
          {required ? (
            <span className={css.requiredMark} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>

        {labelAction}
      </div>

      {children}

      <p className={clsx(css.error, errorClassName)} id={errorId}>
        {isTouched ? (error ?? '') : ''}
      </p>
    </div>
  );
}

export default AuthFieldLayout;
