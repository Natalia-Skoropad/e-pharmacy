import { buildReviewCommentError, buildReviewRatingError } from '../shared';

//===================================================================

export type ReviewFormValues = {
  comment: string;
  rating: number;
};

export type ReviewFormErrors = Partial<Record<keyof ReviewFormValues, string>>;

//===================================================================

export const REVIEW_INITIAL_VALUES: ReviewFormValues = {
  comment: '',
  rating: 0,
};

//===================================================================

export function validateReviewForm(values: ReviewFormValues): ReviewFormErrors {
  const errors: ReviewFormErrors = {};

  const commentError = buildReviewCommentError(values.comment, {
    required: true,
    trailingDot: true,
  });
  const ratingError = buildReviewRatingError(values.rating);

  if (commentError) errors.comment = commentError;
  if (ratingError) errors.rating = ratingError;

  return errors;
}

//===================================================================

export function isReviewFormValid(values: ReviewFormValues): boolean {
  return Object.keys(validateReviewForm(values)).length === 0;
}

//===================================================================

export function isReviewValid(text: string, rating: number): boolean {
  return isReviewFormValid({ comment: text, rating });
}
