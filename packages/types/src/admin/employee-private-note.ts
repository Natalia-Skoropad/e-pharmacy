import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type AdminEmployeePrivateNote = Readonly<{
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;

  author: Readonly<{
    userId: EntityId;
    displayName: string;
  }>;
}>;

//===================================================================

export type AdminEmployeePrivateNotesResponse = Readonly<
  ApiPaginationResponse<AdminEmployeePrivateNote>
>;

//===================================================================

export type AdminEmployeePrivateNoteResponse = Readonly<{
  note: AdminEmployeePrivateNote;
}>;

//===================================================================

export type CreateAdminEmployeePrivateNotePayload = Readonly<{
  text: string;
  clientRequestId: string;
}>;
