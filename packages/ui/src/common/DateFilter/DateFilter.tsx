'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';

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
  onChange: (value: DateFilterValue) => void;
}>;

//===================================================================

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

//===================================================================

function getMinDate(value: string | undefined) {
  return value || undefined;
}

//===================================================================

function getMaxDate(...values: Array<string | undefined>) {
  const validValues = values.filter(Boolean) as string[];

  if (!validValues.length) return undefined;

  return validValues.sort()[0];
}

//===================================================================

function areDatesEqual(first: DateFilterValue, second: DateFilterValue) {
  return first.from === second.from && first.to === second.to;
}

//===================================================================

function DateFilter({
  id,
  label = 'Date',
  value,
  fromLabel = 'From',
  toLabel = 'To',
  isActive = false,
  disabled = false,
  className,
  minDate,
  maxDate = getTodayIsoDate(),
  applyOnSubmit = false,
  applyLabel = 'Apply',
  onChange,
}: DateFilterProps) {
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [draftValue, setDraftValue] = useState<DateFilterValue>(value);
  const currentValue = applyOnSubmit ? draftValue : value;

  const fromId = `${id}-from`;
  const toId = `${id}-to`;
  const applyButtonId = `${id}-apply`;

  const isApplyDisabled =
    disabled ||
    !currentValue.from ||
    !currentValue.to ||
    areDatesEqual(currentValue, value);

  const updateValue = (nextValue: DateFilterValue) => {
    if (disabled) return;

    if (applyOnSubmit) {
      setDraftValue(nextValue);
      return;
    }

    onChange(nextValue);
  };

  const handleFromChange = (from: string) => {
    updateValue({ ...currentValue, from });
  };

  const handleToChange = (to: string) => {
    updateValue({ ...currentValue, to });
  };

  const handleApply = () => {
    if (isApplyDisabled) return;

    onChange(currentValue);
  };

  return (
    <fieldset
      className={clsx(css.field, applyOnSubmit && css.withApply, className)}
      disabled={disabled}
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
            min={minDate}
            max={getMaxDate(currentValue.to, maxDate)}
            onClick={() => fromInputRef.current?.showPicker?.()}
            aria-describedby={applyOnSubmit ? applyButtonId : undefined}
            onChange={(event) => handleFromChange(event.target.value)}
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
            min={getMinDate(currentValue.from || minDate)}
            max={maxDate}
            onClick={() => toInputRef.current?.showPicker?.()}
            aria-describedby={applyOnSubmit ? applyButtonId : undefined}
            onChange={(event) => handleToChange(event.target.value)}
          />
        </label>
      </div>

      {applyOnSubmit ? (
        <button
          className={css.applyButton}
          id={applyButtonId}
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
export { DateFilter };
