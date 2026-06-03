import { LoaderCircle } from 'lucide-react';

import Button from '../Button';

import css from './LazyLoadButton.module.css';

//===================================================================

type LazyLoadButtonProps = {
  visibleCount: number;
  totalCount: number;
  label?: string;
  isLoading?: boolean;
  onLoadMore: () => void;
};

//===================================================================

function LazyLoadButton({
  visibleCount,
  totalCount,
  label = 'Show more',
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
        disabled={isLoading}
        onClick={onLoadMore}
      >
        {isLoading ? (
          <LoaderCircle className={css.spinner} size={18} aria-hidden="true" />
        ) : null}
        {label} ({remainingCount})
      </Button>
    </div>
  );
}

export default LazyLoadButton;
