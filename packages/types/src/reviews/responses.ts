import type { ApiPaginationResponse } from '../api';
import type { ISODateTimeString } from '../primitives';
import type { PendingReview, Review } from './review';

//===================================================================

export type ReviewsResponse = {
  items: Review[];
  total: number;
};

export type PendingReviewsResponse<TTarget extends object> =
  ApiPaginationResponse<PendingReview<TTarget>>;

export type ReviewMutationResponse = { message: string };

export type ReviewModerationResponse = {
  message: string;
  rating: number;
  reviewsCount: number;
  moderatedAt?: ISODateTimeString;
};
