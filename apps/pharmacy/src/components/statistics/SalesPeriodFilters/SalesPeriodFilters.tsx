'use client';

import clsx from 'clsx';

import { SelectField } from '@e-pharmacy/ui/common';

import css from './SalesPeriodFilters.module.css';

//===================================================================

export type SalesPeriodMonth =
  | 'all'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

//===================================================================

type SalesPeriodFiltersProps = Readonly<{
  idPrefix: string;
  year: string;
  month: SalesPeriodMonth;
  onYearChange: (value: string) => void;
  onMonthChange: (value: SalesPeriodMonth) => void;
  className?: string;
  yearsBack?: number;
  showAppliedPeriod?: boolean;
}>;

//===================================================================

const CURRENT_YEAR = new Date().getFullYear();

//===================================================================

const MONTH_OPTIONS: Array<{ value: SalesPeriodMonth; label: string }> = [
  { value: 'all', label: 'All months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

//===================================================================

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

//===================================================================

export function getSalesPeriodDateRange(year: string, month: SalesPeriodMonth) {
  const parsedYear = Number(year) || CURRENT_YEAR;

  if (month === 'all') {
    return {
      dateFrom: `${parsedYear}-01-01`,
      dateTo: `${parsedYear}-12-31`,
      groupBy: 'month' as const,
    };
  }

  const parsedMonth = Number(month);
  const lastDay = new Date(parsedYear, parsedMonth, 0).getDate();
  const monthPart = padDatePart(parsedMonth);

  return {
    dateFrom: `${parsedYear}-${monthPart}-01`,
    dateTo: `${parsedYear}-${monthPart}-${padDatePart(lastDay)}`,
    groupBy: 'day' as const,
  };
}

//===================================================================

function SalesPeriodFilters({
  idPrefix,
  year,
  month,
  onYearChange,
  onMonthChange,
  className,
  yearsBack = 2,
  showAppliedPeriod = false,
}: SalesPeriodFiltersProps) {
  const yearOptions = Array.from({ length: yearsBack + 1 }, (_, index) => {
    const optionYear = CURRENT_YEAR - index;

    return { value: String(optionYear), label: String(optionYear) };
  });

  const selectedMonthLabel =
    MONTH_OPTIONS.find((option) => option.value === month)?.label ??
    'All months';

  return (
    <div className={clsx(css.filters, className)}>
      <SelectField
        id={`${idPrefix}-year`}
        label="Year"
        value={year}
        options={yearOptions}
        onChange={onYearChange}
      />

      <SelectField
        id={`${idPrefix}-month`}
        label="Month"
        value={month}
        options={MONTH_OPTIONS}
        onChange={onMonthChange}
      />

      {showAppliedPeriod ? (
        <p className={css.appliedPeriod} aria-live="polite">
          <span>Filters applied</span>
          <strong>
            {year} · {selectedMonthLabel}
          </strong>
        </p>
      ) : null}
    </div>
  );
}

export default SalesPeriodFilters;
export { SalesPeriodFilters };
export type { SalesPeriodFiltersProps };
