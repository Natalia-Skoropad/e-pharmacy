'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';
import { getBusinessCalendarDate } from '@e-pharmacy/utils/date';
import { validateDateRange } from '@e-pharmacy/validation/url';

import css from './DateFilter.module.css';

//===================================================================

export type DateFilterValue = Readonly<{
  from: string;
  to: string;
}>;

export type DateFilterProps = Readonly<{
  id: string;
  label?: string;
  value: DateFilterValue;
  fromLabel?: string;
  toLabel?: string;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  applyOnSubmit?: boolean;
  applyLabel?: string;
  rangeMode?: 'partial' | 'full';
  onChange: (value: DateFilterValue) => void;
}>;

type CalendarField = 'from' | 'to';

type CalendarDateParts = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

//===================================================================

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const DAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

//===================================================================

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function parseCalendarDate(
  value: string | undefined
): CalendarDateParts | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toCalendarDate(parts: CalendarDateParts): string {
  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

function toUtcDate(parts: CalendarDateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function formatDisplayDate(value: string): string {
  const parts = parseCalendarDate(value);
  if (!parts) return '';
  return `${padDatePart(parts.day)}.${padDatePart(parts.month)}.${parts.year}`;
}

function getMonthStart(value: string | undefined): CalendarDateParts {
  const parsed = parseCalendarDate(value);
  const fallback = parseCalendarDate(getBusinessCalendarDate() ?? '') ?? {
    year: 1970,
    month: 1,
    day: 1,
  };
  const source = parsed ?? fallback;
  return { year: source.year, month: source.month, day: 1 };
}

function addMonths(
  parts: CalendarDateParts,
  amount: number
): CalendarDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + amount, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: 1,
  };
}

function compareCalendarDates(first: string, second: string): number {
  return first.localeCompare(second);
}

function getMaxDate(...values: Array<string | undefined>) {
  const validValues = values.filter(Boolean) as string[];
  return validValues.length ? [...validValues].sort()[0] : undefined;
}

function getFieldBounds(
  field: CalendarField,
  value: DateFilterValue,
  minDate: string | undefined,
  maxDate: string | undefined
) {
  return field === 'from'
    ? {
        min: minDate,
        max: getMaxDate(value.to || undefined, maxDate),
      }
    : {
        min: value.from || minDate || undefined,
        max: maxDate,
      };
}

function clampMonth(
  month: CalendarDateParts,
  minDate: string | undefined,
  maxDate: string | undefined
): CalendarDateParts {
  const monthKey = toCalendarDate(month).slice(0, 7);
  const minKey = minDate?.slice(0, 7);
  const maxKey = maxDate?.slice(0, 7);

  if (minKey && monthKey < minKey) return getMonthStart(minDate);
  if (maxKey && monthKey > maxKey) return getMonthStart(maxDate);
  return month;
}

function getCalendarDays(month: CalendarDateParts): CalendarDateParts[] {
  const monthStart = toUtcDate(month);
  const weekDay = monthStart.getUTCDay();
  const mondayIndex = (weekDay + 6) % 7;
  const firstCell = new Date(monthStart);
  firstCell.setUTCDate(firstCell.getUTCDate() - mondayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setUTCDate(firstCell.getUTCDate() + index);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  });
}

function isDateAllowed(
  value: string,
  minDate: string | undefined,
  maxDate: string | undefined
) {
  if (minDate && compareCalendarDates(value, minDate) < 0) return false;
  if (maxDate && compareCalendarDates(value, maxDate) > 0) return false;
  return true;
}

function areDatesEqual(first: DateFilterValue, second: DateFilterValue) {
  return first.from === second.from && first.to === second.to;
}

//===================================================================

export function DateFilter({
  id,
  label = 'Date',
  value,
  fromLabel = 'From',
  toLabel = 'To',
  isActive = false,
  disabled = false,
  className,
  minDate,
  maxDate = getBusinessCalendarDate() ?? undefined,
  applyOnSubmit = false,
  applyLabel = 'Apply',
  rangeMode = 'partial',
  onChange,
}: DateFilterProps) {
  const rootRef = useRef<HTMLFieldSetElement>(null);
  const generatedErrorId = useId();
  const [draftValue, setDraftValue] = useState<DateFilterValue>(value);
  const [openField, setOpenField] = useState<CalendarField | null>(null);

  const [visibleMonth, setVisibleMonth] = useState<CalendarDateParts>(() =>
    getMonthStart(maxDate ?? value.from ?? value.to)
  );

  const valueFrom = value.from;
  const valueTo = value.to;
  const currentValue = applyOnSubmit ? draftValue : value;
  const validation = validateDateRange(currentValue);
  const rangeError = validation.from ?? validation.to ?? validation.range;
  const errorId = `${id}-${generatedErrorId}-error`;

  useEffect(() => {
    setDraftValue({ from: valueFrom, to: valueTo });
  }, [valueFrom, valueTo]);

  useOutsidePointerDown({
    refs: [rootRef],
    enabled: openField !== null,
    onOutside: () => setOpenField(null),
  });

  const requiresFullRange = rangeMode === 'full';
  const hasAnyDate = Boolean(currentValue.from || currentValue.to);
  const hasRequiredDates = requiresFullRange
    ? Boolean(currentValue.from && currentValue.to)
    : hasAnyDate;

  const isApplyDisabled =
    disabled ||
    !hasRequiredDates ||
    Boolean(rangeError) ||
    areDatesEqual(currentValue, value);

  const activeBounds = openField
    ? getFieldBounds(openField, currentValue, minDate, maxDate)
    : { min: minDate, max: maxDate };

  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const today = getBusinessCalendarDate() ?? '';
  const selectedDate = openField ? currentValue[openField] : '';

  const updateValue = (nextValue: DateFilterValue) => {
    if (disabled) return;

    if (applyOnSubmit) {
      setDraftValue(nextValue);
      return;
    }

    onChange(nextValue);
  };

  const openCalendar = (field: CalendarField) => {
    if (disabled) return;

    const bounds = getFieldBounds(field, currentValue, minDate, maxDate);
    const selected = currentValue[field];
    const anchor = selected || bounds.max || bounds.min || today;
    setVisibleMonth(clampMonth(getMonthStart(anchor), bounds.min, bounds.max));
    setOpenField(field);
  };

  const selectDate = (date: string) => {
    if (
      !openField ||
      !isDateAllowed(date, activeBounds.min, activeBounds.max)
    ) {
      return;
    }

    updateValue({ ...currentValue, [openField]: date });
    setOpenField(null);
  };

  const clearDate = () => {
    if (!openField) return;
    updateValue({ ...currentValue, [openField]: '' });
    setOpenField(null);
  };

  const handleCalendarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    setOpenField(null);
  };

  const handleApply = () => {
    if (!isApplyDisabled) onChange(currentValue);
  };

  const canGoPrevious =
    !activeBounds.min ||
    toCalendarDate(addMonths(visibleMonth, -1)).slice(0, 7) >=
      activeBounds.min.slice(0, 7);

  const canGoNext =
    !activeBounds.max ||
    toCalendarDate(addMonths(visibleMonth, 1)).slice(0, 7) <=
      activeBounds.max.slice(0, 7);

  const canSelectToday =
    Boolean(today) && isDateAllowed(today, activeBounds.min, activeBounds.max);

  return (
    <fieldset
      ref={rootRef}
      className={clsx(css.field, applyOnSubmit && css.withApply, className)}
      disabled={disabled}
      aria-invalid={Boolean(rangeError) || undefined}
      aria-describedby={rangeError ? errorId : undefined}
    >
      <legend className={css.label}>{label}</legend>

      <div className={css.grid}>
        {(['from', 'to'] as const).map((field) => {
          const fieldLabel = field === 'from' ? fromLabel : toLabel;
          const fieldValue = currentValue[field];
          const fieldError =
            field === 'from'
              ? validation.from || validation.range
              : validation.to || validation.range;
          const buttonId = `${id}-${field}`;
          const popupId = `${buttonId}-calendar`;
          const isOpen = openField === field;

          return (
            <div className={css.dateField} key={field}>
              <label className={css.dateLabel} htmlFor={buttonId}>
                {fieldLabel}
              </label>

              <div className={css.dateControl}>
                <button
                  id={buttonId}
                  className={clsx(
                    css.input,
                    (isActive || fieldValue) && css.inputActive,
                    isOpen && css.inputOpen
                  )}
                  type="button"
                  disabled={disabled}
                  aria-haspopup="dialog"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? popupId : undefined}
                  aria-invalid={Boolean(fieldError) || undefined}
                  aria-describedby={rangeError ? errorId : undefined}
                  onClick={() => openCalendar(field)}
                >
                  <span
                    className={clsx(
                      css.inputValue,
                      !fieldValue && css.inputPlaceholder
                    )}
                  >
                    {fieldValue ? formatDisplayDate(fieldValue) : 'DD.MM.YYYY'}
                  </span>
                  <CalendarDays size={18} aria-hidden="true" />
                </button>

                {isOpen ? (
                  <div
                    className={css.calendar}
                    id={popupId}
                    role="dialog"
                    aria-modal="false"
                    aria-label={`${fieldLabel} date calendar`}
                    onKeyDown={handleCalendarKeyDown}
                  >
                    <div className={css.calendarHeader}>
                      <strong className={css.monthLabel}>
                        {MONTH_FORMATTER.format(toUtcDate(visibleMonth))}
                      </strong>

                      <div className={css.monthActions}>
                        <button
                          className={css.monthButton}
                          type="button"
                          disabled={!canGoPrevious}
                          aria-label="Previous month"
                          onClick={() =>
                            setVisibleMonth((month) => addMonths(month, -1))
                          }
                        >
                          <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        <button
                          className={css.monthButton}
                          type="button"
                          disabled={!canGoNext}
                          aria-label="Next month"
                          onClick={() =>
                            setVisibleMonth((month) => addMonths(month, 1))
                          }
                        >
                          <ChevronRight size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className={css.weekdays} aria-hidden="true">
                      {WEEKDAY_LABELS.map((weekday) => (
                        <span key={weekday}>{weekday}</span>
                      ))}
                    </div>

                    <div className={css.days} role="grid">
                      {calendarDays.map((parts) => {
                        const date = toCalendarDate(parts);
                        const isOutsideMonth =
                          parts.month !== visibleMonth.month;
                        const isDisabled = !isDateAllowed(
                          date,
                          activeBounds.min,
                          activeBounds.max
                        );

                        return (
                          <button
                            className={clsx(
                              css.day,
                              isOutsideMonth && css.dayOutside,
                              date === today && css.dayToday,
                              date === selectedDate && css.daySelected
                            )}
                            type="button"
                            key={date}
                            disabled={isDisabled}
                            role="gridcell"
                            aria-selected={date === selectedDate}
                            aria-label={DAY_FORMATTER.format(toUtcDate(parts))}
                            onClick={() => selectDate(date)}
                          >
                            {parts.day}
                          </button>
                        );
                      })}
                    </div>

                    <div className={css.calendarFooter}>
                      <button
                        className={css.calendarTextButton}
                        type="button"
                        disabled={!selectedDate}
                        onClick={clearDate}
                      >
                        Clear
                      </button>
                      <button
                        className={css.calendarTextButton}
                        type="button"
                        disabled={!canSelectToday}
                        onClick={() => selectDate(today)}
                      >
                        Today
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {rangeError ? (
        <p className={css.error} id={errorId} role="alert">
          {rangeError}
        </p>
      ) : null}

      {applyOnSubmit ? (
        <button
          className={css.applyButton}
          type="button"
          disabled={isApplyDisabled}
          onClick={handleApply}
        >
          {applyLabel}
        </button>
      ) : null}
    </fieldset>
  );
}

export default DateFilter;
