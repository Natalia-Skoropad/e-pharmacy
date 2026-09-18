import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type PharmacyNoteEntityType =
  | 'client'
  | 'product'
  | 'pharmacy'
  | 'product_request';

//===================================================================

type PharmacyNoteAuthor = Readonly<{
  userId: EntityId;
  displayName: string;
}>;

//===================================================================

export type PharmacyNote = Readonly<{
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;
  author: PharmacyNoteAuthor;
}>;
