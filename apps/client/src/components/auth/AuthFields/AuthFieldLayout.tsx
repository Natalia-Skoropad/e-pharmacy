import type { ReactNode } from 'react';

import css from './AuthField.module.css';

//===================================================================

type AuthFieldLayoutProps = {
  id: string;
  label: string;
  required?: boolean;
  labelAction?: ReactNode;
  children: ReactNode;
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
  error,
  isTouched,
}: AuthFieldLayoutProps) {
  const errorId = `${id}-error`;

  return (
    <div className={css.field}>
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

      <p className={css.error} id={errorId}>
        {isTouched ? (error ?? '') : ''}
      </p>
    </div>
  );
}

export default AuthFieldLayout;
