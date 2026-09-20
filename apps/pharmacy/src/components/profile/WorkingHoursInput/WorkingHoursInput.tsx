'use client';

import { useEffect, useRef, useState } from 'react';

import { SelectField, type SelectOption } from '@e-pharmacy/ui/forms';

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

const TIME_STEP_MINUTES = 15;

//===================================================================

const BASE_TIME_OPTIONS: readonly SelectOption<string>[] = [
  { value: '', label: '--:--' },
  ...Array.from({ length: (24 * 60) / TIME_STEP_MINUTES }, (_, index) => {
    const totalMinutes = index * TIME_STEP_MINUTES;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    const value = `${hours}:${minutes}`;

    return { value, label: value };
  }),
];

//===================================================================

function getTimeOptions(value: string): readonly SelectOption<string>[] {
  if (!value || BASE_TIME_OPTIONS.some((option) => option.value === value)) {
    return BASE_TIME_OPTIONS;
  }

  const customOption: SelectOption<string> = { value, label: value };
  const timeOptions = BASE_TIME_OPTIONS.filter((option) => option.value);

  return [
    { value: '', label: '--:--' },
    ...[...timeOptions, customOption].sort((first, second) =>
      first.value.localeCompare(second.value)
    ),
  ];
}

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

  const openDaysCount = WORKING_DAYS.reduce(
    (count, day) => count + (currentValue[day.key].isClosed ? 0 : 1),
    0
  );

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
          const fromOptions = getTimeOptions(dayValue.from);
          const toOptions = getTimeOptions(dayValue.to);
          const isLastOpenDay = !dayValue.isClosed && openDaysCount === 1;

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

              <div className={css.timeControl}>
                <span className={css.timeCaption} aria-hidden="true">
                  From
                </span>
                <SelectField
                  id={fromId}
                  className={css.timeSelect}
                  label={`${day.label} opening time`}
                  labelVisibility="visually-hidden"
                  value={dayValue.from}
                  options={fromOptions}
                  placeholder="--:--"
                  compact
                  escapeOverflow
                  disabled={disabled || dayValue.isClosed}
                  describedBy={describedBy}
                  onChange={(from) => updateDay(day.key, { from })}
                />
              </div>

              <div className={css.timeControl}>
                <span className={css.timeCaption} aria-hidden="true">
                  To
                </span>
                <SelectField
                  id={toId}
                  className={css.timeSelect}
                  label={`${day.label} closing time`}
                  labelVisibility="visually-hidden"
                  value={dayValue.to}
                  options={toOptions}
                  placeholder="--:--"
                  compact
                  escapeOverflow
                  disabled={disabled || dayValue.isClosed}
                  describedBy={describedBy}
                  onChange={(to) => updateDay(day.key, { to })}
                />
              </div>

              <label className={css.closedLabel} htmlFor={closedId}>
                <input
                  id={closedId}
                  type="checkbox"
                  checked={dayValue.isClosed}
                  disabled={disabled || isLastOpenDay}
                  aria-label={`${day.label} is closed`}
                  title={
                    isLastOpenDay
                      ? 'At least one day must remain open'
                      : undefined
                  }
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
