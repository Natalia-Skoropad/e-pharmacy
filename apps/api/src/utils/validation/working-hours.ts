export type WorkingHoursValidationIssue =
  | 'format'
  | 'missing-days'
  | 'duplicate-days'
  | 'range';

//===============================================================

const WORKING_DAY_KEYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const;

//===============================================================

type WorkingDayKey = (typeof WORKING_DAY_KEYS)[number];

//===============================================================

const WORKING_HOURS_ENTRY_PATTERN =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(Closed|([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d)$/;

//===============================================================

export function getWorkingHoursValidationIssue(
  value: string
): WorkingHoursValidationIssue | null {
  const parts = value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'format';

  const seenDays = new Set<WorkingDayKey>();

  for (const part of parts) {
    const match = part.match(WORKING_HOURS_ENTRY_PATTERN);
    if (!match) return 'format';

    const day = match[1] as WorkingDayKey;
    if (seenDays.has(day)) return 'duplicate-days';
    seenDays.add(day);

    if (match[2] === 'Closed') continue;

    const from = match[3];
    const to = match[4];
    if (!from || !to || from >= to) return 'range';
  }

  if (
    parts.length !== WORKING_DAY_KEYS.length ||
    WORKING_DAY_KEYS.some((day) => !seenDays.has(day))
  ) {
    return 'missing-days';
  }

  return null;
}
