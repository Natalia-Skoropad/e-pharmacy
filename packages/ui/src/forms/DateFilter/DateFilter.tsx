'use client';

import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';

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

//===================================================================

function getMaxDate(...values: Array<string | undefined>) {
  const validValues = values.filter(Boolean) as string[];
  return validValues.length ? [...validValues].sort()[0] : undefined;
}

//===================================================================

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
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const generatedErrorId = useId();
  const [draftValue, setDraftValue] = useState<DateFilterValue>(value);
  const valueFrom = value.from;
  const valueTo = value.to;
  const currentValue = applyOnSubmit ? draftValue : value;
  const validation = validateDateRange(currentValue);
  const rangeError = validation.from ?? validation.to ?? validation.range;
  const errorId = `${id}-${generatedErrorId}-error`;

  useEffect(() => {
    setDraftValue({ from: valueFrom, to: valueTo });
  }, [valueFrom, valueTo]);

  const fromId = `${id}-from`;
  const toId = `${id}-to`;
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

  const updateValue = (nextValue: DateFilterValue) => {
    if (disabled) return;

    if (applyOnSubmit) {
      setDraftValue(nextValue);
      return;
    }

    onChange(nextValue);
  };

  const handleApply = () => {
    if (!isApplyDisabled) onChange(currentValue);
  };

  return (
    <fieldset
      className={clsx(css.field, applyOnSubmit && css.withApply, className)}
      disabled={disabled}
      aria-invalid={Boolean(rangeError) || undefined}
      aria-describedby={rangeError ? errorId : undefined}
    >
      <legend className={css.label}>{label}</legend>

      <div className={css.grid}>
        <label className={css.dateField} htmlFor={fromId}>
          <span className={css.dateLabel}>{fromLabel}</span>
          <input
            ref={fromInputRef}
            id={fromId}
            className={clsx(
              css.input,
              (isActive || currentValue.from) && css.inputActive
            )}
            type="date"
            value={currentValue.from}
            min={minDate || undefined}
            max={getMaxDate(currentValue.to, maxDate)}
            aria-invalid={
              Boolean(validation.from || validation.range) || undefined
            }
            aria-describedby={rangeError ? errorId : undefined}
            onClick={() => fromInputRef.current?.showPicker?.()}
            onChange={(event) =>
              updateValue({ ...currentValue, from: event.target.value })
            }
          />
        </label>

        <label className={css.dateField} htmlFor={toId}>
          <span className={css.dateLabel}>{toLabel}</span>
          <input
            ref={toInputRef}
            id={toId}
            className={clsx(
              css.input,
              (isActive || currentValue.to) && css.inputActive
            )}
            type="date"
            value={currentValue.to}
            min={currentValue.from || minDate || undefined}
            max={maxDate}
            aria-invalid={
              Boolean(validation.to || validation.range) || undefined
            }
            aria-describedby={rangeError ? errorId : undefined}
            onClick={() => toInputRef.current?.showPicker?.()}
            onChange={(event) =>
              updateValue({ ...currentValue, to: event.target.value })
            }
          />
        </label>
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
