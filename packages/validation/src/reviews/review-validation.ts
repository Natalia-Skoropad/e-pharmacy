import { buildReviewCommentError } from '../shared';

//=============================================================================

export function isReviewValid(text: string, rating: number): boolean {
  return (
    !buildReviewCommentError(text, { required: true }) &&
    rating >= 1 &&
    rating <= 5
  );
}
