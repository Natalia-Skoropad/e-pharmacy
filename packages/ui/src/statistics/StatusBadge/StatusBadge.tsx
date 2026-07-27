import clsx from 'clsx';

import type { StatusTone } from '../status-tone';

import css from './StatusBadge.module.css';

//===================================================================

export type { StatusTone } from '../status-tone';

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
