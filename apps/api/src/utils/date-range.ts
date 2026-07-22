const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

//===============================================================

function parseValidatedCalendarDate(value: string, endOfDay: boolean): Date {
  const match = value.match(CALENDAR_DATE_PATTERN);

  if (!match) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    )
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  return date;
}

//===============================================================

export function getStartOfDay(value: string): Date {
  return parseValidatedCalendarDate(value, false);
}

//===============================================================

export function getEndOfDay(value: string): Date {
  return parseValidatedCalendarDate(value, true);
}
