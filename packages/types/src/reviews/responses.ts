import type { ApiPaginationResponse } from '../api';
import type { ISODateTimeString } from '../primitives';
import type { PendingReview, Review } from './review';

//===================================================================

export type ReviewsResponse = Readonly<{
  items: readonly Review[];
  total: number;
}>;

export type PendingReviewsResponse<TTarget extends object> = Readonly<
  ApiPaginationResponse<PendingReview<TTarget>>
>;

export type ReviewMutationResponse = Readonly<{ message: string }>;

export type ReviewModerationResponse = Readonly<{
  message: string;
  rating: number;
  reviewsCount: number;
  moderatedAt?: ISODateTimeString;
}>;
