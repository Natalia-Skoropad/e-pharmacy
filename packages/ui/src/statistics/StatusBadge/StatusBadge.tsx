import clsx from 'clsx';

import css from './StatusBadge.module.css';

//===================================================================

export type StatusTone =
  | 'blue'
  | 'yellow'
  | 'green'
  | 'red'
  | 'gray'
  | 'beauty';

//===================================================================

export type StatusBadgeProps = Readonly<{
  label: string;
  tone: StatusTone;
  className?: string;
}>;

//===================================================================

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return <span className={clsx(css.badge, css[tone], className)}>{label}</span>;
}
