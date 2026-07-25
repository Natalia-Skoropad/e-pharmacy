'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
} from '@e-pharmacy/validation/reviews';

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
  notifier: ReviewNotifier;
  successMessage: string;
  errorMessage: string;
  authRequiredMessage?: string;
};

type ReviewFormState = Readonly<{
  identity: string | null;
  values: ReviewFormValues;
  touchedFields: ReviewTouchedFields;
  isSubmitting: boolean;
}>;

//===================================================================

function createReviewFormState(identity: string | null): ReviewFormState {
  return {
    identity,
    values: REVIEW_INITIAL_VALUES,
    touchedFields: {},
    isSubmitting: false,
  };
}

//===================================================================

export function useReviewForm({
  createReview,
  notifier,
  successMessage,
  errorMessage,
  authRequiredMessage,
}: UseReviewFormParams) {
  const {
    user,
    isAuthenticated,
    isAuthReady,
    canUseClientFeatures,
    isPharmacy,
  } = useClientAuthCapabilities();

  const identity = user?.id ?? null;

  const [formState, setFormState] = useState<ReviewFormState>(() =>
    createReviewFormState(identity)
  );

  const mountedRef = useRef(true);
  const submitLockRef = useRef(false);
  const submissionVersionRef = useRef(0);

  const currentFormState =
    formState.identity === identity
      ? formState
      : createReviewFormState(identity);

  const reviewValues = currentFormState.values;
  const reviewTouchedFields = currentFormState.touchedFields;
  const isReviewSubmitting = currentFormState.isSubmitting;

  const reviewErrors = useMemo(
    () => validateReviewForm(reviewValues),
    [reviewValues]
  );

  const reviewFormIsValid = isReviewFormValid(reviewValues);

  useEffect(() => {
    submissionVersionRef.current += 1;
    submitLockRef.current = false;
  }, [identity]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      submissionVersionRef.current += 1;
      submitLockRef.current = false;
    };
  }, []);

  const updateCurrentFormState = (
    update: (current: ReviewFormState) => ReviewFormState
  ) => {
    setFormState((current) =>
      update(
        current.identity === identity
          ? current
          : createReviewFormState(identity)
      )
    );
  };

  const handleReviewTextChange = (value: string) => {
    updateCurrentFormState((current) => ({
      ...current,
      values: {
        ...current.values,
        comment: value,
      },
      touchedFields: {
        ...current.touchedFields,
        comment: true,
      },
    }));
  };

  const handleReviewRatingChange = (rating: number) => {
    updateCurrentFormState((current) => ({
      ...current,
      values: {
        ...current.values,
        rating,
      },
      touchedFields: {
        ...current.touchedFields,
        rating: true,
      },
    }));
  };

  const handleReviewSubmit = async () => {
    if (submitLockRef.current) return;

    const nextErrors = validateReviewForm(reviewValues);

    if (hasValidationErrors(nextErrors)) {
      updateCurrentFormState((current) => ({
        ...current,
        touchedFields: markAllFieldsTouched(REVIEW_FORM_FIELDS),
      }));
      return;
    }

    if (!isAuthReady || !isAuthenticated) {
      updateCurrentFormState((current) => ({
        ...current,
        touchedFields: markAllFieldsTouched(REVIEW_FORM_FIELDS),
      }));
      if (authRequiredMessage) notifier.error(authRequiredMessage);
      return;
    }

    if (!canUseClientFeatures) {
      notifier.error(
        isPharmacy
          ? 'Reviews are available only for client accounts.'
          : (authRequiredMessage ?? errorMessage)
      );
      return;
    }

    submitLockRef.current = true;
    const submissionVersion = submissionVersionRef.current + 1;
    submissionVersionRef.current = submissionVersion;

    updateCurrentFormState((current) => ({
      ...current,
      isSubmitting: true,
    }));

    try {
      await createReview({
        rating: reviewValues.rating,
        comment: reviewValues.comment.trim(),
      });

      if (
        !mountedRef.current ||
        submissionVersionRef.current !== submissionVersion
      ) {
        return;
      }

      setFormState((current) =>
        current.identity === identity
          ? createReviewFormState(identity)
          : current
      );
      notifier.success(successMessage);
    } catch {
      if (
        mountedRef.current &&
        submissionVersionRef.current === submissionVersion
      ) {
        notifier.error(errorMessage);
      }
    } finally {
      if (
        mountedRef.current &&
        submissionVersionRef.current === submissionVersion
      ) {
        submitLockRef.current = false;
        setFormState((current) =>
          current.identity === identity
            ? { ...current, isSubmitting: false }
            : current
        );
      }
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
