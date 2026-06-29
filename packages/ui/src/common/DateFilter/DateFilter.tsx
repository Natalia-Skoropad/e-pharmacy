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
  onChange: (value: DateFilterValue) => void;
}>;

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
  onChange,
}: DateFilterProps) {
  const fromId = `${id}-from`;
  const toId = `${id}-to`;

  const handleFromChange = (from: string) => {
    if (disabled) return;
    onChange({ ...value, from });
  };

  const handleToChange = (to: string) => {
    if (disabled) return;
    onChange({ ...value, to });
  };

  return (
    <fieldset className={clsx(css.field, className)} disabled={disabled}>
      <legend className={css.label}>{label}</legend>

      <div className={css.grid}>
        <label className={css.dateField} htmlFor={fromId}>
          <span className={css.dateLabel}>{fromLabel}</span>
          <input
            id={fromId}
            className={clsx(css.input, (isActive || value.from) && css.inputActive)}
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(event) => handleFromChange(event.target.value)}
          />
        </label>

        <label className={css.dateField} htmlFor={toId}>
          <span className={css.dateLabel}>{toLabel}</span>
          <input
            id={toId}
            className={clsx(css.input, (isActive || value.to) && css.inputActive)}
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(event) => handleToChange(event.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
}

export default DateFilter;
export { DateFilter };
