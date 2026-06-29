import { Filter } from 'lucide-react';
import clsx from 'clsx';

import css from './FiltersButton.module.css';

//===================================================================

export type FiltersButtonProps = Readonly<{
  activeCount?: number;
  label?: string;
  className?: string;
  controlsId?: string;
  isExpanded?: boolean;
  onClick: () => void;
}>;

//===================================================================

function FiltersButton({
  activeCount = 0,
  label = 'Filters',
  className,
  controlsId,
  isExpanded,
  onClick,
}: FiltersButtonProps) {
  const normalizedCount = Math.max(0, activeCount);

  return (
    <button
      className={clsx(css.button, normalizedCount > 0 && css.buttonActive, className)}
      type="button"
      aria-controls={controlsId}
      aria-expanded={typeof isExpanded === 'boolean' ? isExpanded : undefined}
      onClick={onClick}
    >
      <Filter size={18} aria-hidden="true" />
      <span>{label}</span>

      {normalizedCount > 0 ? (
        <span className={css.badge} aria-label={`${normalizedCount} active filters`}>
          {normalizedCount}
        </span>
      ) : null}
    </button>
  );
}

export default FiltersButton;
export { FiltersButton };
