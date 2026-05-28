export const REVIEW_MAX_LENGTH = 500;
export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_REGEX = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/;

//===================================================================

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
