import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';

import css from './WorkingHours.module.css';

//===================================================================

export type WorkingHoursProps = Readonly<{
  value: string;
  className?: string;
}>;

//===================================================================

function WorkingHours({ value, className }: WorkingHoursProps) {
  const items = getWorkingHoursDisplayItems(value.trim());

  if (!items?.length) return null;

  const classes = [css.workingHours, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {items.map((item) => (
        <span key={item.day}>
          <strong>{item.day}</strong>: {item.hours}
        </span>
      ))}
    </span>
  );
}

export default WorkingHours;
