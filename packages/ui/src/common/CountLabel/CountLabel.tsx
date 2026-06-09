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

function normalizeCount(count = 0): number {
  return Math.max(0, count);
}

//===================================================================

function formatCountLabel(
  visibleCount = 0,
  totalCount = visibleCount,
  singularLabel: string,
  pluralLabel = `${singularLabel}s`
): string {
  const safeTotalCount = normalizeCount(totalCount);
  const safeVisibleCount = Math.min(
    normalizeCount(visibleCount),
    safeTotalCount
  );
  const label = safeTotalCount === 1 ? singularLabel : pluralLabel;

  return `Showing ${safeVisibleCount} of ${safeTotalCount} ${label}`;
}

//===================================================================

function CountLabel({
  visibleCount = 0,
  totalCount = visibleCount,
  singularLabel,
  pluralLabel,
  emptyLabel,
  className,
}: CountLabelProps) {
  const safeTotalCount = normalizeCount(totalCount);
  const label =
    safeTotalCount === 0 && emptyLabel
      ? emptyLabel
      : formatCountLabel(
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
