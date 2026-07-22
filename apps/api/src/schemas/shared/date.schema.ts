import { z } from 'zod';

import { emptyStringToUndefined } from './optional-text.schema';

//===================================================================

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DATE_FORMAT_MESSAGE =
  'Date must be a valid calendar date in YYYY-MM-DD format';

export const DATE_RANGE_MESSAGE =
  'Start date must be earlier than or equal to end date';

//===================================================================

export function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;

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

export const calendarDateSchema = z
  .string()
  .trim()
  .refine(isCalendarDate, DATE_FORMAT_MESSAGE);

export const dateQuerySchema = z.preprocess(
  emptyStringToUndefined,
  calendarDateSchema.optional()
);

//===================================================================

export function isDateRangeOrdered(from?: string, to?: string): boolean {
  return !from || !to || from <= to;
}
