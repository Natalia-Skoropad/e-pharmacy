import clsx from 'clsx';

import type { FormFieldLayoutProps } from '../types';

import css from './FormField.module.css';

//===================================================================

// Keep one error renderer for text inputs and textarea controls.
export function FormFieldError({
  id,
  error,
  isTouched,
  className,
}: Pick<FormFieldLayoutProps, 'id' | 'error' | 'isTouched'> & {
  className?: string;
}) {
  return (
    <p className={clsx(css.error, className)} id={`${id}-error`}>
      {isTouched ? (error ?? '') : ''}
    </p>
  );
}

//===================================================================

function FormFieldLayout({
  id,
  label,
  required = true,
  labelAction,
  children,
  className,
  errorClassName,
  renderError = true,
  error,
  isTouched,
  hint,
}: FormFieldLayoutProps) {
  const hintId = `${id}-hint`;

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

      {hint ? (
        <p className={css.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {children}

      {renderError ? (
        <FormFieldError
          id={id}
          error={error}
          isTouched={isTouched}
          className={errorClassName}
        />
      ) : null}
    </div>
  );
}

export default FormFieldLayout;
export { FormFieldLayout };
