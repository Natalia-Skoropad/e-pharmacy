export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

export type DateRange = Readonly<{
  from?: string;
  to?: string;
}>;

export type DateRangeValidationResult = Readonly<{
  from?: string;
  to?: string;
  range?: string;
}>;

//===================================================================

export function isCalendarDate(value?: string): boolean {
  if (!value || !DATE_PATTERN.test(value)) return false;

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

//===================================================================

export function validateDateRange({
  from,
  to,
}: DateRange): DateRangeValidationResult {
  const normalizedFrom = from?.trim() ?? '';
  const normalizedTo = to?.trim() ?? '';
  const errors: DateRangeValidationResult = {};

  if (normalizedFrom && !isCalendarDate(normalizedFrom)) {
    return { ...errors, from: 'Enter a valid start date in YYYY-MM-DD format' };
  }

  if (normalizedTo && !isCalendarDate(normalizedTo)) {
    return { ...errors, to: 'Enter a valid end date in YYYY-MM-DD format' };
  }

  if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
    return {
      ...errors,
      range: 'Start date must be earlier than or equal to end date',
    };
  }

  return errors;
}

//===================================================================

export function isDateRangeValid(range: DateRange): boolean {
  return Object.keys(validateDateRange(range)).length === 0;
}
