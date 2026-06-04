import { REVIEW_COMMENT_PATTERN, VALIDATION_LIMITS } from '../shared';

//=============================================================================

export const REVIEW_MAX_LENGTH = VALIDATION_LIMITS.reviewCommentMax;
export const REVIEW_MIN_LENGTH = VALIDATION_LIMITS.reviewCommentMin;
export const REVIEW_REGEX = REVIEW_COMMENT_PATTERN;

//=============================================================================

export function isReviewValid(text: string, rating: number): boolean {
  const trimmedText = text.trim();

  return (
    trimmedText.length >= REVIEW_MIN_LENGTH &&
    trimmedText.length <= REVIEW_MAX_LENGTH &&
    REVIEW_REGEX.test(trimmedText) &&
    rating >= 1 &&
    rating <= 5
  );
}
