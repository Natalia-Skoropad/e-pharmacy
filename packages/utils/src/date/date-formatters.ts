export const DISPLAY_LOCALE = 'en-GB';
export const BUSINESS_TIME_ZONE = 'Europe/Kyiv';

//===================================================================

export type DateInput = string | number | Date;

//===================================================================

export type TableDateTimeParts = Readonly<{
  dayMonth: string;
  year: string;
  time: string;
}>;

//===================================================================

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: BUSINESS_TIME_ZONE,
});

//===================================================================

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: BUSINESS_TIME_ZONE,
});

//===================================================================

const TABLE_DAY_MONTH_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: '2-digit',
  month: 'short',
  timeZone: BUSINESS_TIME_ZONE,
});

//===================================================================

const TABLE_YEAR_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  year: 'numeric',
  timeZone: BUSINESS_TIME_ZONE,
});

//===================================================================

const TABLE_TIME_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: BUSINESS_TIME_ZONE,
});

//===================================================================

export function parseDateInput(value: DateInput): Date | null {
  if (typeof value === 'string' && value.trim() === '') return null;

  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

//===================================================================

export function formatShortDate(value: DateInput): string | null {
  const date = parseDateInput(value);
  return date ? SHORT_DATE_FORMATTER.format(date) : null;
}

//===================================================================

export function formatDateTime(value: DateInput): string | null {
  const date = parseDateInput(value);
  return date ? DATE_TIME_FORMATTER.format(date) : null;
}

//===================================================================

export function formatTableDateTimeParts(
  value: DateInput
): TableDateTimeParts | null {
  const date = parseDateInput(value);
  if (!date) return null;

  return {
    dayMonth: TABLE_DAY_MONTH_FORMATTER.format(date),
    year: TABLE_YEAR_FORMATTER.format(date),
    time: TABLE_TIME_FORMATTER.format(date),
  };
}
