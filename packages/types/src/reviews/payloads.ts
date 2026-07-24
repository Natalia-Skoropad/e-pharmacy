import type { ReviewModerationStatus } from './review';

//===================================================================

export type CreateReviewPayload = { rating: number; comment: string };

//===================================================================

export type ModerateReviewPayload = {
  status: Extract<ReviewModerationStatus, 'approved' | 'rejected'>;
  reason?: string;
};

export type PendingReviewsQueryParams = {
  page?: number;
  perPage?: number;
};
