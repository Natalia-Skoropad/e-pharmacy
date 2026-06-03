import clsx from 'clsx';

import type { FormFieldLayoutProps } from '../types';

import css from './FormField.module.css';

//===================================================================

function FormFieldLayout({
  id,
  label,
  required = true,
  labelAction,
  children,
  className,
  errorClassName,
  error,
  isTouched,
}: FormFieldLayoutProps) {
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

export default FormFieldLayout;
