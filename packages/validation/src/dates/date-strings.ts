import type {
  CalendarDateString,
  ISODateTimeString,
} from '@e-pharmacy/types/primitives';

//===================================================================

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

export function isCalendarDateString(
  value: unknown
): value is CalendarDateString {
  if (typeof value !== 'string' || !CALENDAR_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

//===================================================================

export function isISODateTimeString(
  value: unknown
): value is ISODateTimeString {
  if (typeof value !== 'string' || value.length === 0) return false;

  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}
