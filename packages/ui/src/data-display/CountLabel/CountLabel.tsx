import clsx from 'clsx';

import css from './CountLabel.module.css';

//===================================================================

type CountLabelProps = {
  shown: number;
  total: number;
  label: string;
  className?: string;
  fullWidthOnMobile?: boolean;
};

//===================================================================

function normalizeCount(count: number): number {
  return Math.max(0, count);
}

//===================================================================

function CountLabel({
  shown,
  total,
  label,
  className,
  fullWidthOnMobile = false,
}: CountLabelProps) {
  const safeTotal = normalizeCount(total);
  const safeShown = Math.min(normalizeCount(shown), safeTotal);

  return (
    <p
      className={clsx(
        css.countLabel,
        fullWidthOnMobile && css.fullWidthOnMobile,
        className
      )}
    >
      Showing {safeShown} of {safeTotal} {label}
    </p>
  );
}

export default CountLabel;
export type { CountLabelProps };
export { CountLabel };
