import type { ISODateTimeString } from '../types/date';

//===============================================================

export function requireISODateTime(
  value: Date | string,
  field: string
): ISODateTimeString {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid ${field}: expected a valid date-time value.`);
  }

  return date.toISOString();
}
