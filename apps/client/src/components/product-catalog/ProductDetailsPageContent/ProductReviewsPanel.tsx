'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import {
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  CountLabel,
} from '@e-pharmacy/ui/data-display';

import { useToast } from '@e-pharmacy/ui/feedback';
import { USER_REVIEW_COMMENT_MAX_LENGTH } from '@e-pharmacy/validation/reviews';
import type { Review } from '@e-pharmacy/types/reviews';

import { useReviewForm } from '@/hooks';
import { createProductReview } from '@/lib/api/browser';

import { ReviewsSection } from '@/components/common';

import css from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyReviewsPanel.module.css';

//===================================================================

export type ProductReviewsPanelProps = Readonly<{
  productId: string;
  isPageHeading?: boolean;
  reviews: readonly Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
}>;

//===================================================================

export function ProductReviewsPanel({
  productId,
  isPageHeading = false,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: ProductReviewsPanelProps) {
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
    scopeKey: `product:${productId}`,

    createReview: (payload, options) =>
      createProductReview(productId, payload, options),

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
    <>
      <div className={css.header}>
        <div className={css.heading}>
          <span className={css.headerIcon} aria-hidden="true">
            <Star size={22} />
          </span>
          <div>
            {isPageHeading ? (
              <h1 className={css.title}>Reviews</h1>
            ) : (
              <h2 className={css.title}>Reviews</h2>
            )}
            <p className={css.subtitle}>
              Read feedback from clients who have ordered this product.
            </p>
          </div>
        </div>

        <CountLabel
          shown={Math.min(visibleReviewsCount, reviews.length)}
          total={reviewsTotal}
          label="reviews"
          fullWidthOnMobile
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
        emptyVariant="resource"
        emptyTitle="This product has no reviews yet."
        emptyText="Reviews appear here after real client orders are completed and approved."
        textareaId="product-review"
        maxLength={USER_REVIEW_COMMENT_MAX_LENGTH}
        onReviewTextChange={handleReviewTextChange}
        onReviewRatingChange={handleReviewRatingChange}
        onReviewSubmit={() => void handleReviewSubmit()}
      />
    </>
  );
}
