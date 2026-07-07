import clsx from 'clsx';

import {
  formatStatusLabel,
  getStatusTone,
  type PharmacyStatusVariant,
} from './status-types';

import css from './StatusBadge.module.css';

//===================================================================

type StatusBadgeProps = Readonly<{
  status: PharmacyStatusVariant;
  label?: string;
  className?: string;
}>;

//===================================================================

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const tone = getStatusTone(status);

  return (
    <span className={clsx(css.badge, css[tone], className)}>
      {label ?? formatStatusLabel(status)}
    </span>
  );
}
