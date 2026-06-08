import { buildReviewCommentError } from '../shared';

//===================================================================

export type ReviewFormValues = {
  comment: string;
  rating: number;
};

export type ReviewFormErrors = Partial<Record<keyof ReviewFormValues, string>>;

//===================================================================

const MIN_REVIEW_RATING = 1;
const MAX_REVIEW_RATING = 5;

//===================================================================

export const REVIEW_INITIAL_VALUES: ReviewFormValues = {
  comment: '',
  rating: 0,
};

//===================================================================

export function sanitizeReviewComment(value: string): string {
  return value.replace(/[^A-Za-z0-9\s.,!?;:'"()\-]/g, '');
}

//===================================================================

export function buildReviewRatingError(value: number): string {
  return Number.isInteger(value) &&
    value >= MIN_REVIEW_RATING &&
    value <= MAX_REVIEW_RATING
    ? ''
    : 'Choose a rating from 1 to 5 stars';
}

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
