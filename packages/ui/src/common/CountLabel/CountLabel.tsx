import clsx from 'clsx';

import css from './CountLabel.module.css';

//===================================================================

type CountLabelProps = {
  shown: number;
  total: number;
  label: string;
  className?: string;
};

//===================================================================

function normalizeCount(count: number): number {
  return Math.max(0, count);
}

//===================================================================

function CountLabel({ shown, total, label, className }: CountLabelProps) {
  const safeTotal = normalizeCount(total);
  const safeShown = Math.min(normalizeCount(shown), safeTotal);

  return (
    <p className={clsx(css.countLabel, className)}>
      Showing {safeShown} of {safeTotal} {label}
    </p>
  );
}

export default CountLabel;

export type { CountLabelProps };
export { CountLabel };
