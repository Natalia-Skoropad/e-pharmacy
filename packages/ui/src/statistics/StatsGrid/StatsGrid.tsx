import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

import css from './StatsGrid.module.css';

//===================================================================

type StatsGridStyle = CSSProperties & {
  '--stats-grid-columns'?: string;
  '--stats-grid-tablet-columns'?: string;
};

export type StatsGridProps = Readonly<{
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  columns?: number;
  tabletColumns?: number;
}>;

//===================================================================

export function StatsGrid({
  children,
  className,
  ariaLabel,
  columns,
  tabletColumns,
}: StatsGridProps) {
  const style: StatsGridStyle = {
    '--stats-grid-columns': columns ? String(columns) : undefined,
    '--stats-grid-tablet-columns': tabletColumns
      ? String(tabletColumns)
      : undefined,
  };

  return (
    <div
      className={clsx(css.grid, className)}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
