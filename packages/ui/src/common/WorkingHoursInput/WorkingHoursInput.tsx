'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
} from 'react';

import {
  WORKING_DAYS,
  formatWorkingHoursValue,
  parseWorkingHoursValue,
  type WorkingHoursValue,
} from '@e-pharmacy/validation/pharmacy';

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

function createSyntheticTextareaEvent(
  id: string,
  name: string,
  value: string
): ChangeEvent<HTMLTextAreaElement> {
  const target = { id, name, value } as HTMLTextAreaElement;

  return {
    target,
    currentTarget: target,
  } as ChangeEvent<HTMLTextAreaElement>;
}

//===================================================================

function WorkingHoursInput({
  id,
  name,
  value,
  label = 'Working hours',
  hint = 'Choose opening and closing time for all seven days.',
  error,
  isTouched,
  required = true,
  disabled = false,
  onChange,
}: WorkingHoursInputProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = Boolean(isTouched && error);
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
    onChange(createSyntheticTextareaEvent(id, name, formattedValue));
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
    <div className={css.field}>
      <label className={css.label} htmlFor={`${id}-Mon-from`}>
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

      <div
        className={css.schedule}
        aria-invalid={hasError}
        aria-describedby={`${hintId} ${errorId}`}
      >
        {WORKING_DAYS.map((day) => {
          const dayValue = currentValue[day.key];
          const fromId = `${id}-${day.key}-from`;
          const toId = `${id}-${day.key}-to`;
          const closedId = `${id}-${day.key}-closed`;

          return (
            <div className={css.dayRow} key={day.key}>
              <span className={css.dayName}>{day.label}</span>

              <label className={css.timeLabel} htmlFor={fromId}>
                <span>From</span>
                <input
                  className={css.timeInput}
                  id={fromId}
                  type="time"
                  value={dayValue.from}
                  disabled={disabled || dayValue.isClosed}
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
                  disabled={disabled || dayValue.isClosed}
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
        <p className={css.error} id={errorId}>
          {isTouched ? (error ?? '') : ''}
        </p>
      </div>
    </div>
  );
}

export default WorkingHoursInput;
export { WorkingHoursInput };
