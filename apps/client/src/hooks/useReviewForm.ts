'use client';

import { useMemo, useState } from 'react';

import {
  REVIEW_INITIAL_VALUES,
  sanitizeReviewComment,
  validateReviewForm,
} from '@e-pharmacy/validation';

import { useAuth } from '@/providers';

//===================================================================

type ReviewPayload = {
  rating: number;
  comment: string;
};

type ReviewNotifier = {
  success: (message: string) => void;
  error: (message: string) => void;
};

type UseReviewFormParams = {
  createReview: (payload: ReviewPayload) => Promise<unknown>;
  notifier?: ReviewNotifier;
  showToast?: (message: string) => void;
};

//===================================================================

export function useReviewForm({
  createReview,
  notifier,
  showToast,
}: UseReviewFormParams) {
  const { sessionMarker, isAuthenticated } = useAuth();

  const [reviewText, setReviewText] = useState(REVIEW_INITIAL_VALUES.comment);
  const [reviewRating, setReviewRating] = useState(
    REVIEW_INITIAL_VALUES.rating
  );
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const reviewErrors = useMemo(
    () => validateReviewForm({ comment: reviewText, rating: reviewRating }),
    [reviewRating, reviewText]
  );

  const isValid = Object.keys(reviewErrors).length === 0;

  const notifySuccess = (message: string) => {
    if (notifier) {
      notifier.success(message);
      return;
    }

    showToast?.(message);
  };

  const notifyError = (message: string) => {
    if (notifier) {
      notifier.error(message);
      return;
    }

    showToast?.(message);
  };

  const handleReviewTextChange = (value: string) => {
    setReviewText(sanitizeReviewComment(value));
  };

  const handleReviewSubmit = async () => {
    if (!isValid || !isAuthenticated || !sessionMarker) return;

    try {
      setIsReviewSubmitting(true);

      await createReview({
        rating: reviewRating,
        comment: reviewText.trim(),
      });

      setReviewText(REVIEW_INITIAL_VALUES.comment);
      setReviewRating(REVIEW_INITIAL_VALUES.rating);
      notifySuccess(
        'Review was accepted and will be visible after moderation.'
      );
    } catch {
      notifyError('Could not submit review.');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return {
    reviewText,
    reviewRating,
    reviewErrors,
    isReviewValid: isValid,
    isReviewSubmitting,
    handleReviewTextChange,
    handleReviewRatingChange: setReviewRating,
    handleReviewSubmit,
  };
}
