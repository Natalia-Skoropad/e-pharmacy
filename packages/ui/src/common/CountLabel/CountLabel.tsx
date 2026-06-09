import clsx from 'clsx';

import css from './CountLabel.module.css';

//===================================================================

type CountLabelProps = {
  visibleCount?: number;
  totalCount?: number;
  singularLabel: string;
  pluralLabel?: string;
  emptyLabel?: string;
  className?: string;
};

//===================================================================

function formatVisibleCount(
  visibleCount = 0,
  totalCount = 0,
  singularLabel: string,
  pluralLabel = `${singularLabel}s`
): string {
  const safeTotalCount = Math.max(0, totalCount);
  const safeVisibleCount = Math.min(Math.max(0, visibleCount), safeTotalCount);
  const label = safeTotalCount === 1 ? singularLabel : pluralLabel;

  return `Showing ${safeVisibleCount} of ${safeTotalCount} ${label}`;
}

//===================================================================

function CountLabel({
  visibleCount = 0,
  totalCount = 0,
  singularLabel,
  pluralLabel,
  emptyLabel,
  className,
}: CountLabelProps) {
  const safeTotalCount = Math.max(0, totalCount);
  const label =
    safeTotalCount === 0 && emptyLabel
      ? emptyLabel
      : formatVisibleCount(
          visibleCount,
          safeTotalCount,
          singularLabel,
          pluralLabel
        );

  return <p className={clsx(css.countLabel, className)}>{label}</p>;
}

export default CountLabel;

export type { CountLabelProps };
export { CountLabel };
