export const WORKING_DAYS = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
] as const;

//===================================================================

export type WorkingDayKey = (typeof WORKING_DAYS)[number]['key'];

//===================================================================

export type WorkingDayValue = Readonly<{
  from: string;
  to: string;
  isClosed: boolean;
}>;

//===================================================================

export type WorkingHoursValue = Record<WorkingDayKey, WorkingDayValue>;

//===================================================================

export type WorkingHoursValidationIssue =
  | 'format'
  | 'missing-days'
  | 'duplicate-days'
  | 'range';

//===================================================================

const WORKING_DAY_KEYS = WORKING_DAYS.map((day) => day.key);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const WORKING_HOURS_ENTRY_PATTERN =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(Closed|([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d)$/;

//===================================================================

export function createEmptyWorkingHoursValue(): WorkingHoursValue {
  return Object.fromEntries(
    WORKING_DAYS.map((day) => [day.key, { from: '', to: '', isClosed: false }])
  ) as WorkingHoursValue;
}

//===================================================================

export function parseWorkingHoursValue(value: string): WorkingHoursValue {
  const result = createEmptyWorkingHoursValue();

  for (const part of value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)) {
    const match = part.match(WORKING_HOURS_ENTRY_PATTERN);
    if (!match) continue;

    const day = match[1] as WorkingDayKey;
    const rawHours = match[2];

    if (rawHours === 'Closed') {
      result[day] = { from: '', to: '', isClosed: true };
      continue;
    }

    const [from, to] = rawHours.split('-');
    result[day] = { from, to, isClosed: false };
  }

  return result;
}

//===================================================================

export function formatWorkingHoursValue(value: WorkingHoursValue): string {
  return WORKING_DAYS.map((day) => {
    const dayValue = value[day.key];

    if (dayValue.isClosed) return `${day.key}: Closed`;
    if (TIME_PATTERN.test(dayValue.from) && TIME_PATTERN.test(dayValue.to)) {
      return `${day.key}: ${dayValue.from}-${dayValue.to}`;
    }

    return '';
  })
    .filter(Boolean)
    .join('; ');
}

//===================================================================

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
