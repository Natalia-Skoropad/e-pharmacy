'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
} from 'react';

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

type WorkingDay = {
  key: string;
  label: string;
};

type DayValue = {
  from: string;
  to: string;
  isClosed: boolean;
};

type WorkingHoursValue = Record<string, DayValue>;

//===================================================================

const WORKING_DAYS: WorkingDay[] = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];

//===================================================================

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

//===================================================================

function createEmptyValue(): WorkingHoursValue {
  return Object.fromEntries(
    WORKING_DAYS.map((day) => [
      day.key,
      {
        from: '',
        to: '',
        isClosed: false,
      },
    ])
  ) as WorkingHoursValue;
}

//===================================================================

function parseWorkingHours(value: string): WorkingHoursValue {
  const result = createEmptyValue();

  value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const separatorIndex = part.indexOf(':');

      if (separatorIndex < 0) return;

      const dayKey = part.slice(0, separatorIndex).trim();
      const rawHours = part.slice(separatorIndex + 1).trim();

      if (!dayKey || !rawHours || !(dayKey in result)) return;

      if (rawHours.toLowerCase() === 'closed') {
        result[dayKey] = { from: '', to: '', isClosed: true };
        return;
      }

      const [from, to] = rawHours.split('-').map((item) => item.trim());

      if (TIME_PATTERN.test(from) && TIME_PATTERN.test(to)) {
        result[dayKey] = { from, to, isClosed: false };
      }
    });

  return result;
}

//===================================================================

function formatWorkingHours(value: WorkingHoursValue): string {
  return WORKING_DAYS.map((day) => {
    const dayValue = value[day.key];

    if (dayValue.isClosed) return `${day.key}: Closed`;
    if (dayValue.from && dayValue.to) {
      return `${day.key}: ${dayValue.from}-${dayValue.to}`;
    }

    return '';
  })
    .filter(Boolean)
    .join('; ');
}

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
  hint = 'Choose opening and closing time for each working day.',
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
    parseWorkingHours(value)
  );

  useEffect(() => {
    if (value === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      return;
    }

    setCurrentValue(parseWorkingHours(value));
  }, [value]);

  const emitChange = (nextValue: WorkingHoursValue) => {
    const formattedValue = formatWorkingHours(nextValue);

    lastEmittedValueRef.current = formattedValue;
    setCurrentValue(nextValue);
    onChange(createSyntheticTextareaEvent(id, name, formattedValue));
  };

  const updateDay = (dayKey: string, patch: Partial<DayValue>) => {
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
