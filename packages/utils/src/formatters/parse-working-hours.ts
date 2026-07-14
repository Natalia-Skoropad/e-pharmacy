export type WorkingHoursItem =
  | Readonly<{ day: string; hours: string }>
  | string;

//===================================================================

export function parseWorkingHours(value: string): WorkingHoursItem[] {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [day, ...rest] = part.split(':');
      const hours = rest.join(':').trim();

      if (!day || !hours) return part;

      return { day: day.trim(), hours };
    });
}
