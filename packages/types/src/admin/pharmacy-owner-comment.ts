import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type AdminPharmacyOwnerComment = Readonly<{
  id: EntityId;
  ownerUserId: EntityId;
  text: string;
  createdAt: ISODateTimeString;

  author: Readonly<{
    userId: EntityId;
    displayName: string;
  }>;
}>;

//===================================================================

export type AdminPharmacyOwnerCommentsResponse = Readonly<{
  comments: readonly AdminPharmacyOwnerComment[];
}>;

export type AdminPharmacyOwnerCommentResponse = Readonly<{
  comment: AdminPharmacyOwnerComment;
}>;

//===================================================================

export type CreateAdminPharmacyOwnerCommentPayload = Readonly<{
  text: string;
  clientRequestId: string;
}>;
