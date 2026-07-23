'use client';

import { Star } from 'lucide-react';

import { Button } from '@e-pharmacy/ui/primitives';

import {
  ReviewsList,
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  type ReviewsListItem,
} from '@e-pharmacy/ui/data-display';

import { CommentInput } from '@e-pharmacy/ui/forms';
import type { ReviewTouchedFields } from '@e-pharmacy/validation/reviews';

import css from './ReviewsSection.module.css';

//===================================================================

type ReviewsSectionProps = Readonly<{
  reviews: readonly ReviewsListItem[];
  reviewText: string;
  reviewRating: number;
  isReviewValid: boolean;
  reviewError?: string;
  reviewTouchedFields: ReviewTouchedFields;
  isReviewSubmitting: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
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
  reviewError,
  reviewTouchedFields,
  isReviewSubmitting,
  isAuthenticated,
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
      <form
        className={css.reviewForm}
        onSubmit={(event) => {
          event.preventDefault();
          onReviewSubmit();
        }}
      >
        <CommentInput
          id={textareaId}
          name="review"
          label="Your review"
          value={reviewText}
          required
          error={reviewError}
          errorClassName={css.reviewCommentError}
          isTouched={Boolean(reviewTouchedFields.comment)}
          maxLength={maxLength}
          placeholder="Write 10–500 characters using latin letters."
          onChange={(event) => onReviewTextChange(event.target.value)}
        />

        <fieldset className={css.ratingFieldset}>
          <legend className={css.reviewLabel}>Rating</legend>

          <div className={css.ratingButtons}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                className={
                  reviewRating >= rating ? css.starButtonActive : css.starButton
                }
                key={rating}
                type="button"
                onClick={() => onReviewRatingChange(rating)}
                aria-label={`Set rating ${rating}`}
              >
                <Star size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className={css.reviewActions}>
          <Button
            type="submit"
            className={css.reviewSubmitButton}
            disabled={!isReviewValid || isReviewSubmitting || !isAuthenticated}
          >
            {isReviewSubmitting ? 'Sending...' : 'Send review'}
          </Button>

          {!isAuthenticated ? (
            <p className={css.authNote}>
              Only logged-in users can submit reviews.
            </p>
          ) : null}
        </div>
      </form>

      {isUnavailable ? (
        <div className={css.notice} role="alert">
          Reviews are temporarily unavailable. Please check that the backend API
          is running.
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
