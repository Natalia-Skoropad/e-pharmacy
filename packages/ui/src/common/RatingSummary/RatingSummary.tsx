import { Star } from 'lucide-react';

import css from './RatingSummary.module.css';

//===================================================================

type RatingSummaryProps = {
  rating: number | null | undefined;
  reviewsCount: number;
  size?: 'sm' | 'md';
  className?: string;
};

//===================================================================

function getReviewsLabel(reviewsCount: number): string {
  return reviewsCount === 1 ? '1 review' : `${reviewsCount} reviews`;
}

//===================================================================

function RatingSummary({
  rating,
  reviewsCount,
  size = 'md',
  className,
}: RatingSummaryProps) {
  const hasReviews = reviewsCount > 0;
  const ratingLabel =
    hasReviews && typeof rating === 'number' ? rating.toFixed(1) : null;

  return (
    <div
      className={[css.ratingSummary, css[size], className]
        .filter(Boolean)
        .join(' ')}
    >
      {ratingLabel ? (
        <span
          className={css.rating}
          role="img"
          aria-label={`Rating ${ratingLabel}`}
        >
          <Star size={size === 'sm' ? 16 : 18} aria-hidden="true" />
          {ratingLabel}
        </span>
      ) : null}

      <span className={css.reviewsCount}>{getReviewsLabel(reviewsCount)}</span>
    </div>
  );
}

export default RatingSummary;

export { RatingSummary };
