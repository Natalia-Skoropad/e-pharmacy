import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

// This contract is user-scoped, not pharmacy-scoped. The same shape is
// supported by the existing shared Comments UI.
export type PharmacyUserPrivateNote = Readonly<{
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;

  author: Readonly<{
    userId: EntityId;
    displayName: string;
    pictureUrl?: string;
  }>;
}>;

//===================================================================

export type PharmacyUserPrivateNotesResponse = Readonly<
  ApiPaginationResponse<PharmacyUserPrivateNote>
>;

export type PharmacyUserPrivateNoteResponse = Readonly<{
  note: PharmacyUserPrivateNote;
}>;

export type CreatePharmacyUserPrivateNotePayload = Readonly<{
  text: string;
  clientRequestId: string;
}>;
