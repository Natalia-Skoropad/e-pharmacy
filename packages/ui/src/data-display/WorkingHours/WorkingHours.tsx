import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';

import css from './WorkingHours.module.css';

//===================================================================

export type WorkingHoursProps = Readonly<{
  value: string;
  className?: string;
}>;

//===================================================================

/** Shared, read-only schedule presentation for client and admin applications. */
export function WorkingHours({ value, className }: WorkingHoursProps) {
  const items = getWorkingHoursDisplayItems(value.trim());
  if (!items?.length) return null;

  return (
    <span className={[css.workingHours, className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <span key={item.day}>
          <strong>{item.day}</strong>: {item.hours}
        </span>
      ))}
    </span>
  );
}
