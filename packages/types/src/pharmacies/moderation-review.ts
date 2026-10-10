import type { EntityId, ISODateTimeString } from '../primitives';

//=============================================================================

// Review metadata is independent from the existing five Pharmacy statuses.
export type PharmacyModerationReviewState = 'pending' | 'changes_requested';

//=============================================================================

export type PharmacyModerationReview = Readonly<{
  reviewState?: PharmacyModerationReviewState;
  reviewFeedback?: string;
  reviewedAt?: ISODateTimeString;
  reviewedBy?: EntityId;
}>;
