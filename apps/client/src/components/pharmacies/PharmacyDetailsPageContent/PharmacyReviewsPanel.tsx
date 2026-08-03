'use client';

import { useState } from 'react';

import {
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  CountLabel,
} from '@e-pharmacy/ui/data-display';

import { useToast } from '@e-pharmacy/ui/feedback';
import { USER_REVIEW_COMMENT_MAX_LENGTH } from '@e-pharmacy/validation/reviews';
import type { Review } from '@e-pharmacy/types/reviews';

import { useReviewForm } from '@/hooks';
import { createPharmacyReview } from '@/lib/api/browser';

import { ReviewsSection } from '@/components/common';

import css from './PharmacyReviewsPanel.module.css';

//===================================================================

export type PharmacyReviewsPanelProps = Readonly<{
  pharmacyId: string;
  reviews: readonly Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
}>;

//===================================================================

export function PharmacyReviewsPanel({
  pharmacyId,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: PharmacyReviewsPanelProps) {
  const toast = useToast();
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(
    DEFAULT_VISIBLE_REVIEWS_COUNT
  );

  const {
    reviewText,
    reviewRating,
    reviewErrors,
    reviewTouchedFields,
    isReviewValid,
    isReviewSubmitting,
    canCreateReview,
    isAuthUnavailable,
    reviewAccessMessage,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  } = useReviewForm({
    scopeKey: `pharmacy:${pharmacyId}`,
    createReview: (payload, options) =>
      createPharmacyReview(pharmacyId, payload, options),
    notifier: toast,
    successMessage: 'Review was accepted and will be visible after moderation.',
    errorMessage: 'Could not submit review.',
    authRequiredMessage: 'Please log in to submit a review.',
    authUnavailableMessage:
      'We could not verify your session. Please try again shortly.',
    clientAccountRequiredMessage:
      'Reviews are available only for active client accounts.',
  });

  return (
    <div className={css.panel}>
      <div className={css.header}>
        <h2 className={css.title}>Reviews</h2>
        <CountLabel
          shown={Math.min(visibleReviewsCount, reviews.length)}
          total={reviewsTotal}
          label="reviews"
        />
      </div>

      <ReviewsSection
        reviews={reviews}
        visibleCount={visibleReviewsCount}
        onVisibleCountChange={setVisibleReviewsCount}
        reviewText={reviewText}
        reviewRating={reviewRating}
        isReviewValid={isReviewValid}
        commentError={reviewErrors.comment}
        ratingError={reviewErrors.rating}
        reviewTouchedFields={reviewTouchedFields}
        isReviewSubmitting={isReviewSubmitting}
        canCreateReview={canCreateReview}
        reviewAccessMessage={reviewAccessMessage}
        isAuthUnavailable={isAuthUnavailable}
        isUnavailable={areReviewsUnavailable}
        emptyText="Pharmacy reviews will appear here after clients share their feedback."
        textareaId="pharmacy-review"
        maxLength={USER_REVIEW_COMMENT_MAX_LENGTH}
        onReviewTextChange={handleReviewTextChange}
        onReviewRatingChange={handleReviewRatingChange}
        onReviewSubmit={() => void handleReviewSubmit()}
      />
    </div>
  );
}
