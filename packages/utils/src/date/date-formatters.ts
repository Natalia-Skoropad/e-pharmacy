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

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const ISO_DATE_TIME_WITH_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

//===================================================================

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: BUSINESS_TIME_ZONE,
});

//===================================================================

const CALENDAR_DATE_FORMATTER = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
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

export function parseCalendarDate(value: string): Date | null {
  const match = value.trim().match(CALENDAR_DATE_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

//===================================================================

export function parseInstantDate(value: DateInput): Date | null {
  if (value instanceof Date) {
    const date = new Date(value.getTime());
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  // Offset-less date-times are environment-dependent in JavaScript and can
  // produce different SSR and browser output. API instants must include Z or
  // an explicit numeric offset.
  if (!ISO_DATE_TIME_WITH_ZONE_PATTERN.test(normalizedValue)) return null;

  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

//===================================================================

export function formatCalendarDate(value: string): string | null {
  const date = parseCalendarDate(value);
  return date ? CALENDAR_DATE_FORMATTER.format(date) : null;
}

//===================================================================

export function formatShortDate(value: DateInput): string | null {
  if (typeof value === 'string') {
    const calendarDate = parseCalendarDate(value);
    if (calendarDate) return CALENDAR_DATE_FORMATTER.format(calendarDate);
  }

  const date = parseInstantDate(value);
  return date ? SHORT_DATE_FORMATTER.format(date) : null;
}

//===================================================================

export function formatDateTime(value: DateInput): string | null {
  const date = parseInstantDate(value);
  return date ? DATE_TIME_FORMATTER.format(date) : null;
}

//===================================================================

export function formatTableDateTimeParts(
  value: DateInput
): TableDateTimeParts | null {
  const date = parseInstantDate(value);
  if (!date) return null;

  return {
    dayMonth: TABLE_DAY_MONTH_FORMATTER.format(date),
    year: TABLE_YEAR_FORMATTER.format(date),
    time: TABLE_TIME_FORMATTER.format(date),
  };
}
