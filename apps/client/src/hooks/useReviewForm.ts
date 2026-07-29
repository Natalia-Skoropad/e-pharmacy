'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

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

import { isAbortError } from '@/lib/async/is-abort-error';
import { useClientSessionScope } from '@/providers/AuthProvider';

import { useClientAuthCapabilities } from './useClientAuthCapabilities';

//===================================================================

type ReviewPayload = Readonly<{
  rating: number;
  comment: string;
}>;

type ReviewRequestOptions = Readonly<{
  signal: AbortSignal;
}>;

type ReviewNotifier = Readonly<{
  success: (message: string) => void;
  error: (message: string) => void;
}>;

type UseReviewFormParams = Readonly<{
  scopeKey: string;
  createReview: (
    payload: ReviewPayload,
    options: ReviewRequestOptions
  ) => Promise<unknown>;
  notifier: ReviewNotifier;
  successMessage: string;
  errorMessage: string;
  authRequiredMessage: string;
  authUnavailableMessage: string;
  clientAccountRequiredMessage: string;
}>;

type ReviewFormState = Readonly<{
  ownerKey: string;
  values: ReviewFormValues;
  touchedFields: ReviewTouchedFields;
  isSubmitting: boolean;
}>;

type ReviewFormStore = Readonly<{
  getSnapshot: () => ReviewFormState;
  subscribe: (listener: () => void) => () => void;
  update: (update: (current: ReviewFormState) => ReviewFormState) => void;
  reset: () => void;
}>;

export type ReviewFormController = Readonly<{
  reviewText: string;
  reviewRating: number;
  reviewErrors: ReturnType<typeof validateReviewForm>;
  reviewTouchedFields: ReviewTouchedFields;
  isReviewValid: boolean;
  canCreateReview: boolean;
  isAuthUnavailable: boolean;
  reviewAccessMessage: string;
  isReviewSubmitting: boolean;
  handleReviewTextChange: (value: string) => void;
  handleReviewRatingChange: (rating: number) => void;
  handleReviewSubmit: () => Promise<void>;
}>;

//===================================================================

function createReviewFormState(ownerKey: string): ReviewFormState {
  return {
    ownerKey,
    values: REVIEW_INITIAL_VALUES,
    touchedFields: {},
    isSubmitting: false,
  };
}

//===================================================================

function createReviewFormStore(ownerKey: string): ReviewFormStore {
  let state = createReviewFormState(ownerKey);
  const listeners = new Set<() => void>();

  const emit = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update: (update) => {
      const nextState = update(state);
      if (nextState === state) return;

      state = nextState;
      emit();
    },
    reset: () => {
      state = createReviewFormState(ownerKey);
      emit();
    },
  };
}

//===================================================================

export function useReviewForm({
  scopeKey,
  createReview,
  notifier,
  successMessage,
  errorMessage,
  authRequiredMessage,
  authUnavailableMessage,
  clientAccountRequiredMessage,
}: UseReviewFormParams): ReviewFormController {
  const {
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    canUseClientFeatures,
  } = useClientAuthCapabilities();

  const { ownerKey: sessionOwnerKey } = useClientSessionScope();
  const ownerKey = `${sessionOwnerKey}:${scopeKey}`;

  const formStore = useMemo(() => createReviewFormStore(ownerKey), [ownerKey]);
  const formState = useSyncExternalStore(
    formStore.subscribe,
    formStore.getSnapshot,
    formStore.getSnapshot
  );

  const ownerKeyRef = useRef(ownerKey);
  const submitLockRef = useRef(false);
  const submissionVersionRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

  const reviewValues = formState.values;
  const reviewTouchedFields = formState.touchedFields;
  const isReviewSubmitting = formState.isSubmitting;

  const reviewErrors = useMemo(
    () => validateReviewForm(reviewValues),
    [reviewValues]
  );

  const reviewFormIsValid = isReviewFormValid(reviewValues);

  useLayoutEffect(() => {
    ownerKeyRef.current = ownerKey;
    submissionVersionRef.current += 1;
    submitLockRef.current = false;
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
  }, [ownerKey]);

  useEffect(
    () => () => {
      submissionVersionRef.current += 1;
      submitLockRef.current = false;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    },
    []
  );

  const updateCurrentFormState = useCallback(
    (update: (current: ReviewFormState) => ReviewFormState): void => {
      formStore.update(update);
    },
    [formStore]
  );

  const handleReviewTextChange = useCallback(
    (value: string): void => {
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
    },
    [updateCurrentFormState]
  );

  const handleReviewRatingChange = useCallback(
    (rating: number): void => {
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
    },
    [updateCurrentFormState]
  );

  const handleReviewSubmit = useCallback(async (): Promise<void> => {
    if (submitLockRef.current) return;

    const nextErrors = validateReviewForm(reviewValues);

    if (hasValidationErrors(nextErrors)) {
      updateCurrentFormState((current) => ({
        ...current,
        touchedFields: markAllFieldsTouched(REVIEW_FORM_FIELDS),
      }));
      return;
    }

    if (isBootstrapping) return;

    if (isUnavailable) {
      notifier.error(authUnavailableMessage);
      return;
    }

    if (!isAuthenticated) {
      updateCurrentFormState((current) => ({
        ...current,
        touchedFields: markAllFieldsTouched(REVIEW_FORM_FIELDS),
      }));
      notifier.error(authRequiredMessage);
      return;
    }

    if (!canUseClientFeatures) {
      notifier.error(clientAccountRequiredMessage);
      return;
    }

    submitLockRef.current = true;
    const submissionVersion = submissionVersionRef.current + 1;
    submissionVersionRef.current = submissionVersion;

    const submissionOwnerKey = ownerKey;
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;

    updateCurrentFormState((current) => ({
      ...current,
      isSubmitting: true,
    }));

    try {
      await createReview(
        {
          rating: reviewValues.rating,
          comment: reviewValues.comment.trim(),
        },
        { signal: controller.signal }
      );

      if (
        controller.signal.aborted ||
        ownerKeyRef.current !== submissionOwnerKey ||
        submissionVersionRef.current !== submissionVersion
      ) {
        return;
      }

      formStore.reset();
      notifier.success(successMessage);
    } catch (error) {
      if (
        controller.signal.aborted ||
        isAbortError(error) ||
        ownerKeyRef.current !== submissionOwnerKey ||
        submissionVersionRef.current !== submissionVersion
      ) {
        return;
      }

      notifier.error(errorMessage);
    } finally {
      if (
        activeControllerRef.current === controller &&
        ownerKeyRef.current === submissionOwnerKey &&
        submissionVersionRef.current === submissionVersion
      ) {
        activeControllerRef.current = null;
        submitLockRef.current = false;
        formStore.update((current) => ({
          ...current,
          isSubmitting: false,
        }));
      }
    }
  }, [
    authRequiredMessage,
    authUnavailableMessage,
    canUseClientFeatures,
    clientAccountRequiredMessage,
    createReview,
    errorMessage,
    formStore,
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    notifier,
    ownerKey,
    reviewValues,
    successMessage,
    updateCurrentFormState,
  ]);

  const reviewAccessMessage = isUnavailable
    ? authUnavailableMessage
    : canUseClientFeatures
      ? ''
      : isAuthenticated
        ? clientAccountRequiredMessage
        : authRequiredMessage;

  return {
    reviewText: reviewValues.comment,
    reviewRating: reviewValues.rating,
    reviewErrors,
    reviewTouchedFields,
    isReviewValid: reviewFormIsValid,
    canCreateReview: canUseClientFeatures,
    isAuthUnavailable: isUnavailable,
    reviewAccessMessage,
    isReviewSubmitting,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  };
}
