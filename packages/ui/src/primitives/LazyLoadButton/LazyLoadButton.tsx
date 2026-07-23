import Button from '../../primitives/Button/Button';

import css from './LazyLoadButton.module.css';

//===================================================================

export type LazyLoadButtonProps = {
  visibleCount: number;
  totalCount: number;
  label?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onLoadMore: () => void;
};

//===================================================================

function LazyLoadButton({
  visibleCount,
  totalCount,
  label = 'Show more',
  loadingLabel = 'Loading...',
  isLoading = false,
  onLoadMore,
}: LazyLoadButtonProps) {
  if (visibleCount >= totalCount) return null;

  const remainingCount = totalCount - visibleCount;

  return (
    <div className={css.wrap}>
      <Button
        type="button"
        variant="secondary"
        className={css.button}
        isLoading={isLoading}
        loadingLabel={loadingLabel}
        onClick={onLoadMore}
      >
        {label} ({remainingCount})
      </Button>
    </div>
  );
}

export default LazyLoadButton;
export { LazyLoadButton };
