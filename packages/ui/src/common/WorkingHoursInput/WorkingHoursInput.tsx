'use client';

import type { ChangeEventHandler } from 'react';

import css from './WorkingHoursInput.module.css';

//===================================================================

export type WorkingHoursInputProps = {
  id: string;
  name: string;
  value: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

//===================================================================

function WorkingHoursInput({
  id,
  name,
  value,
  label = 'Working hours',
  placeholder = 'Mon–Fri: 08:00–20:00, Sat–Sun: 09:00–18:00',
  hint = 'Add days and hours in a clear format clients can understand.',
  error,
  isTouched,
  required = true,
  disabled = false,
  maxLength = 160,
  onChange,
}: WorkingHoursInputProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = Boolean(isTouched && error);

  return (
    <div className={css.field}>
      <label className={css.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={css.requiredMark} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p className={css.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      <div className={css.inputWrap}>
        <textarea
          className={css.textarea}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={`${hintId} ${errorId}`}
          onChange={onChange}
        />

        <span className={css.counter} aria-hidden="true">
          {value.length}/{maxLength}
        </span>
      </div>

      <p className={css.error} id={errorId}>
        {isTouched ? (error ?? '') : ''}
      </p>
    </div>
  );
}

export default WorkingHoursInput;
export { WorkingHoursInput };
