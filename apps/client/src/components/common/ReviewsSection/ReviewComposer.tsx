'use client';

import { Button } from '@e-pharmacy/ui/primitives';
import { CommentInput } from '@e-pharmacy/ui/forms';
import type { ReviewTouchedFields } from '@e-pharmacy/validation/reviews';

import { ReviewRatingInput } from './ReviewRatingInput';
import css from './ReviewsSection.module.css';

//===================================================================

type ReviewComposerProps = Readonly<{
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
  textareaId: string;
  maxLength: number;
  onReviewTextChange: (value: string) => void;
  onReviewRatingChange: (value: number) => void;
  onReviewSubmit: () => void;
}>;

//===================================================================

export function ReviewComposer({
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
  textareaId,
  maxLength,
  onReviewTextChange,
  onReviewRatingChange,
  onReviewSubmit,
}: ReviewComposerProps) {
  const ratingGroupId = `${textareaId}-rating`;

  return (
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
        error={commentError}
        errorClassName={css.reviewCommentError}
        isTouched={Boolean(reviewTouchedFields.comment)}
        maxLength={maxLength}
        placeholder="Write 10–500 characters using latin letters."
        onChange={(event) => onReviewTextChange(event.target.value)}
      />

      <ReviewRatingInput
        id={ratingGroupId}
        value={reviewRating}
        error={ratingError}
        isTouched={Boolean(reviewTouchedFields.rating)}
        disabled={isReviewSubmitting || isAuthUnavailable || !canCreateReview}
        onChange={onReviewRatingChange}
      />

      <div className={css.reviewActions}>
        <Button
          type="submit"
          className={css.reviewSubmitButton}
          isLoading={isReviewSubmitting}
          loadingLabel="Sending..."
          disabled={
            !isReviewValid ||
            isReviewSubmitting ||
            isAuthUnavailable ||
            !canCreateReview
          }
        >
          Send review
        </Button>

        {reviewAccessMessage ? (
          <p className={css.authNote}>{reviewAccessMessage}</p>
        ) : null}
      </div>
    </form>
  );
}
