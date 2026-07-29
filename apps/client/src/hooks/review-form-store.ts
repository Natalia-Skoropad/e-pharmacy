import {
  REVIEW_INITIAL_VALUES,
  type ReviewFormValues,
  type ReviewTouchedFields,
} from '@e-pharmacy/validation/reviews';

//===================================================================

export type ReviewFormState = Readonly<{
  ownerKey: string;
  values: ReviewFormValues;
  touchedFields: ReviewTouchedFields;
  isSubmitting: boolean;
}>;

export type ReviewFormStore = Readonly<{
  getSnapshot: () => ReviewFormState;
  subscribe: (listener: () => void) => () => void;
  update: (update: (current: ReviewFormState) => ReviewFormState) => void;
  reset: () => void;
}>;

//===================================================================

export function createReviewFormState(ownerKey: string): ReviewFormState {
  return {
    ownerKey,
    values: REVIEW_INITIAL_VALUES,
    touchedFields: {},
    isSubmitting: false,
  };
}

//===================================================================

export function createReviewFormStore(ownerKey: string): ReviewFormStore {
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
