'use client';

import { useEffect, useRef, useState } from 'react';

import {
  WORKING_DAYS,
  formatWorkingHoursValue,
  parseWorkingHoursValue,
  type WorkingHoursValue,
} from '@e-pharmacy/validation/pharmacy';

import css from './WorkingHoursInput.module.css';

//===================================================================

export type WorkingHoursInputProps = Readonly<{
  id: string;
  value: string;
  label?: string;
  hint?: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}>;

//===================================================================

function WorkingHoursInput({
  id,
  value,
  label = 'Working hours',
  hint = 'Choose opening and closing time for all seven days.',
  error,
  isTouched,
  required = true,
  disabled = false,
  onValueChange,
}: WorkingHoursInputProps) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;
  const hasError = Boolean(isTouched && error);
  const describedBy =
    [hintId, hasError ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined;
  const lastEmittedValueRef = useRef<string | null>(null);
  const [currentValue, setCurrentValue] = useState<WorkingHoursValue>(() =>
    parseWorkingHoursValue(value)
  );

  useEffect(() => {
    if (value === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      return;
    }

    setCurrentValue(parseWorkingHoursValue(value));
  }, [value]);

  const emitChange = (nextValue: WorkingHoursValue) => {
    const formattedValue = formatWorkingHoursValue(nextValue);

    lastEmittedValueRef.current = formattedValue;
    setCurrentValue(nextValue);
    onValueChange(formattedValue);
  };

  const updateDay = (
    dayKey: keyof WorkingHoursValue,
    patch: Partial<WorkingHoursValue[keyof WorkingHoursValue]>
  ) => {
    emitChange({
      ...currentValue,
      [dayKey]: {
        ...currentValue[dayKey],
        ...patch,
      },
    });
  };

  return (
    <fieldset
      className={css.field}
      disabled={disabled}
      aria-required={required || undefined}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
    >
      <legend className={css.label}>
        {label}
        {required ? (
          <span className={css.requiredMark} aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>

      {hint ? (
        <p className={css.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      <div className={css.schedule}>
        {WORKING_DAYS.map((day) => {
          const dayValue = currentValue[day.key];
          const fromId = `${id}-${day.key}-from`;
          const toId = `${id}-${day.key}-to`;
          const closedId = `${id}-${day.key}-closed`;

          return (
            <div
              className={css.dayRow}
              key={day.key}
              role="group"
              aria-label={day.label}
            >
              <span className={css.dayName} aria-hidden="true">
                {day.label}
              </span>

              <label className={css.timeLabel} htmlFor={fromId}>
                <span>From</span>
                <input
                  className={css.timeInput}
                  id={fromId}
                  type="time"
                  value={dayValue.from}
                  required={required && !dayValue.isClosed}
                  disabled={disabled || dayValue.isClosed}
                  aria-label={`${day.label} opening time`}
                  aria-invalid={hasError || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    updateDay(day.key, { from: event.target.value })
                  }
                />
              </label>

              <label className={css.timeLabel} htmlFor={toId}>
                <span>To</span>
                <input
                  className={css.timeInput}
                  id={toId}
                  type="time"
                  value={dayValue.to}
                  required={required && !dayValue.isClosed}
                  disabled={disabled || dayValue.isClosed}
                  aria-label={`${day.label} closing time`}
                  aria-invalid={hasError || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    updateDay(day.key, { to: event.target.value })
                  }
                />
              </label>

              <label className={css.closedLabel} htmlFor={closedId}>
                <input
                  id={closedId}
                  type="checkbox"
                  checked={dayValue.isClosed}
                  disabled={disabled}
                  aria-label={`${day.label} is closed`}
                  aria-invalid={hasError || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    updateDay(day.key, {
                      isClosed: event.target.checked,
                      from: event.target.checked ? '' : dayValue.from,
                      to: event.target.checked ? '' : dayValue.to,
                    })
                  }
                />
                <span>Closed</span>
              </label>
            </div>
          );
        })}
      </div>

      <div className={css.metaRow}>
        <p className={css.error} id={errorId} aria-live="polite">
          {isTouched ? (error ?? '') : ''}
        </p>
      </div>
    </fieldset>
  );
}

export default WorkingHoursInput;
export { WorkingHoursInput };
