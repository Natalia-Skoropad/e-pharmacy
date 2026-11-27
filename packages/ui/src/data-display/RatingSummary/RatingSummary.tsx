import { Star } from 'lucide-react';

import css from './RatingSummary.module.css';

//===================================================================

export type RatingSummaryProps = {
  rating: number | null | undefined;
  reviewsCount: number;
  isLoading?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  ratingLabel?: (rating: string) => string;
  reviewsLabel?: (reviewsCount: number) => string;
};

//===================================================================

function getDefaultReviewsLabel(reviewsCount: number): string {
  return reviewsCount === 1 ? '1 review' : `${reviewsCount} reviews`;
}

//===================================================================

function RatingSummary({
  rating,
  reviewsCount,
  size = 'md',
  isLoading = false,
  className,
  ratingLabel = (value) => `Rating ${value}`,
  reviewsLabel = getDefaultReviewsLabel,
}: RatingSummaryProps) {
  const hasReviews = reviewsCount > 0;

  const formattedRating =
    hasReviews && typeof rating === 'number' ? rating.toFixed(1) : null;

  return (
    <div
      className={[css.ratingSummary, css[size], className]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? (
        <span
          className={css.loading}
          role="status"
          aria-label="Loading product rating"
        >
          <span
            className={`${css.placeholder} ${css.ratingPlaceholder}`}
            aria-hidden="true"
          />
          <span
            className={`${css.placeholder} ${css.reviewsPlaceholder}`}
            aria-hidden="true"
          />
        </span>
      ) : (
        <>
          {formattedRating ? (
            <span
              className={css.rating}
              role="img"
              aria-label={ratingLabel(formattedRating)}
            >
              <Star size={size === 'sm' ? 16 : 18} aria-hidden="true" />
              {formattedRating}
            </span>
          ) : null}

          <span className={css.reviewsCount}>{reviewsLabel(reviewsCount)}</span>
        </>
      )}
    </div>
  );
}

export default RatingSummary;
export { RatingSummary };
