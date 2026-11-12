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

//===============================================================

// Calendar filters in the pharmacy dashboard use the same Kyiv dates as
// TableDateTime. UTC day boundaries would miss late-evening records.
const BUSINESS_DATE_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

//===============================================================

export function getStartOfBusinessDay(value: string): Date {
  // Reuse strict validation; convert a local calendar midnight to an instant.
  const date = getStartOfDay(value);
  const localMidnight = date.getTime();

  let time = localMidnight;

  // Converges at local midnight across daylight-saving transitions too.
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = BUSINESS_DATE_PARTS.formatToParts(new Date(time));

    const fields = Object.fromEntries(
      parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)])
    );

    const displayedAsUtc = Date.UTC(
      fields.year,
      fields.month - 1,
      fields.day,
      fields.hour,
      fields.minute,
      fields.second
    );

    const next = time + (localMidnight - displayedAsUtc);

    if (next === time) break;

    time = next;
  }

  return new Date(time);
}

//===============================================================

export function getEndOfBusinessDay(value: string): Date {
  const date = getStartOfDay(value);

  date.setUTCDate(date.getUTCDate() + 1);

  return new Date(
    getStartOfBusinessDay(date.toISOString().slice(0, 10)).getTime() - 1
  );
}
