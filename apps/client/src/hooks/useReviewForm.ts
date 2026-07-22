'use client';

import { useMemo, useState } from 'react';
import { useClientAuthCapabilities } from './useClientAuthCapabilities';

import {
  REVIEW_FORM_FIELDS,
  REVIEW_INITIAL_VALUES,
  hasValidationErrors,
  isReviewFormValid,
  markAllFieldsTouched,
  validateReviewForm,
  type ReviewFormValues,
  type ReviewTouchedFields,
} from '@e-pharmacy/validation';

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
  successMessage: string;
  errorMessage: string;
  authRequiredMessage?: string;
};

//===================================================================

export function useReviewForm({
  createReview,
  notifier,
  showToast,
  successMessage,
  errorMessage,
  authRequiredMessage,
}: UseReviewFormParams) {
  const { isAuthenticated, isAuthReady, canUseClientFeatures, isPharmacy } =
    useClientAuthCapabilities();

  const [reviewValues, setReviewValues] = useState<ReviewFormValues>(
    REVIEW_INITIAL_VALUES
  );

  const [reviewTouchedFields, setReviewTouchedFields] =
    useState<ReviewTouchedFields>({});

  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const reviewErrors = useMemo(
    () => validateReviewForm(reviewValues),
    [reviewValues]
  );

  const reviewFormIsValid = isReviewFormValid(reviewValues);

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
    setReviewTouchedFields((prev) => ({ ...prev, comment: true }));
    setReviewValues((prev) => ({
      ...prev,
      comment: value,
    }));
  };

  const handleReviewRatingChange = (rating: number) => {
    setReviewTouchedFields((prev) => ({ ...prev, rating: true }));
    setReviewValues((prev) => ({ ...prev, rating }));
  };

  const handleReviewSubmit = async () => {
    const nextErrors = validateReviewForm(reviewValues);

    if (hasValidationErrors(nextErrors)) {
      setReviewTouchedFields(markAllFieldsTouched(REVIEW_FORM_FIELDS));
      return;
    }

    if (!isAuthReady || !isAuthenticated) {
      setReviewTouchedFields(markAllFieldsTouched(REVIEW_FORM_FIELDS));
      if (authRequiredMessage) notifyError(authRequiredMessage);
      return;
    }

    if (!canUseClientFeatures) {
      notifyError(
        isPharmacy
          ? 'Reviews are available only for client accounts.'
          : (authRequiredMessage ?? errorMessage)
      );
      return;
    }

    try {
      setIsReviewSubmitting(true);

      await createReview({
        rating: reviewValues.rating,
        comment: reviewValues.comment.trim(),
      });

      setReviewValues(REVIEW_INITIAL_VALUES);
      setReviewTouchedFields({});
      notifySuccess(successMessage);
    } catch {
      notifyError(errorMessage);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return {
    reviewValues,
    reviewText: reviewValues.comment,
    reviewRating: reviewValues.rating,
    reviewErrors,
    reviewTouchedFields,
    isReviewValid: reviewFormIsValid,
    canSubmitReview: canUseClientFeatures,
    isReviewSubmitting,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  };
}
