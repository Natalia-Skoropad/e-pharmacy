import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type ReviewModerationStatus = 'on_moderation' | 'approved' | 'rejected';

//===================================================================

export type Review = Readonly<{
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateTimeString;
}>;

export type PendingReview<TTarget extends object> = Readonly<
  TTarget & {
    reviewId: EntityId;
    userName: string;
    rating: number;
    comment: string;
    status: ReviewModerationStatus;
    createdAt: ISODateTimeString;
  }
>;
