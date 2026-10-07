import clsx from 'clsx';
import type { CSSProperties } from 'react';

import css from './StatsLoadingSkeleton.module.css';

//===================================================================

type StatsLoadingSkeletonStyle = CSSProperties & {
  '--stats-grid-columns'?: number;
  '--stats-grid-tablet-columns'?: number;
};

//===================================================================

export type StatsLoadingSkeletonProps = Readonly<{
  count?: number;
  columns?: number;
  tabletColumns?: number;
  label?: string;
  className?: string;
}>;

//===================================================================

export function StatsLoadingSkeleton({
  count = 4,
  columns = 4,
  tabletColumns = 2,
  label = 'Loading statistics',
  className,
}: StatsLoadingSkeletonProps) {
  const safeCount = Math.max(1, Math.min(12, Math.trunc(count)));

  const style: StatsLoadingSkeletonStyle = {
    '--stats-grid-columns': columns,
    '--stats-grid-tablet-columns': tabletColumns,
  };

  return (
    <div
      className={clsx(css.root, className)}
      role="status"
      aria-label={label}
      style={style}
    >
      <span className={css.visuallyHidden}>{label}</span>

      <div className={css.grid} aria-hidden="true">
        {Array.from({ length: safeCount }, (_, index) => (
          <article className={css.card} key={index}>
            <div className={css.header}>
              <span className={clsx(css.block, css.title)} />
              <span className={clsx(css.block, css.icon)} />
            </div>

            <span className={clsx(css.block, css.value)} />
          </article>
        ))}
      </div>
    </div>
  );
}

export default StatsLoadingSkeleton;
