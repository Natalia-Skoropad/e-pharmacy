'use client';

import {
  ReviewsList,
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  type ReviewsListItem,
} from '@e-pharmacy/ui/data-display';

import type { ReviewTouchedFields } from '@e-pharmacy/validation/reviews';

import { ReviewComposer } from './ReviewComposer';
import css from './ReviewsSection.module.css';

//===================================================================

export type ReviewsSectionProps = Readonly<{
  reviews: readonly ReviewsListItem[];
  reviewText: string;
  reviewRating: number;
  isReviewValid: boolean;
  commentError?: string;
  ratingError?: string;
  reviewTouchedFields: ReviewTouchedFields;
  isReviewSubmitting: boolean;
  canCreateReview: boolean;
  reviewAccessMessage?: string;
  isAuthUnavailable?: boolean;
  isUnavailable?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  textareaId: string;
  maxLength: number;
  onReviewTextChange: (value: string) => void;
  onReviewRatingChange: (value: number) => void;
  onReviewSubmit: () => void;
  initialVisibleCount?: number;
  visibleCount?: number;
  step?: number;
  onVisibleCountChange?: (value: number) => void;
}>;

//===================================================================

function ReviewsSection({
  reviews,
  reviewText,
  reviewRating,
  isReviewValid,
  commentError,
  ratingError,
  reviewTouchedFields,
  isReviewSubmitting,
  canCreateReview,
  reviewAccessMessage = '',
  isAuthUnavailable = false,
  isUnavailable = false,
  emptyTitle = 'No reviews yet',
  emptyText = 'Reviews will appear here after clients share their feedback.',
  textareaId,
  maxLength,
  onReviewTextChange,
  onReviewRatingChange,
  onReviewSubmit,
  initialVisibleCount = DEFAULT_VISIBLE_REVIEWS_COUNT,
  visibleCount,
  step = DEFAULT_VISIBLE_REVIEWS_COUNT,
  onVisibleCountChange,
}: ReviewsSectionProps) {
  return (
    <>
      <ReviewComposer
        reviewText={reviewText}
        reviewRating={reviewRating}
        isReviewValid={isReviewValid}
        commentError={commentError}
        ratingError={ratingError}
        reviewTouchedFields={reviewTouchedFields}
        isReviewSubmitting={isReviewSubmitting}
        canCreateReview={canCreateReview}
        reviewAccessMessage={reviewAccessMessage}
        isAuthUnavailable={isAuthUnavailable}
        textareaId={textareaId}
        maxLength={maxLength}
        onReviewTextChange={onReviewTextChange}
        onReviewRatingChange={onReviewRatingChange}
        onReviewSubmit={onReviewSubmit}
      />

      {isUnavailable ? (
        <div className={css.notice} role="status">
          Reviews are temporarily unavailable. Please try again later.
        </div>
      ) : (
        <ReviewsList
          reviews={reviews}
          title={null}
          emptyTitle={emptyTitle}
          emptyText={emptyText}
          initialVisibleCount={initialVisibleCount}
          visibleCount={visibleCount}
          step={step}
          onVisibleCountChange={onVisibleCountChange}
        />
      )}
    </>
  );
}

export default ReviewsSection;
