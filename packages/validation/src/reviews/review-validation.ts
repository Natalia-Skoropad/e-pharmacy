import {
  buildReviewCommentError,
  buildReviewRatingError,
  isValidationResultValid,
  type FormErrors,
  type FormTouchedFields,
} from '../shared';

//===================================================================

export type ReviewFormValues = {
  comment: string;
  rating: number;
};

//===================================================================

export type ReviewFormErrors = FormErrors<ReviewFormValues>;
export type ReviewTouchedFields = FormTouchedFields<ReviewFormValues>;

//===================================================================

export const REVIEW_INITIAL_VALUES: ReviewFormValues = {
  comment: '',
  rating: 0,
};

export const REVIEW_FORM_FIELDS: Array<keyof ReviewFormValues> = [
  'comment',
  'rating',
];

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
  return isValidationResultValid(validateReviewForm(values));
}
