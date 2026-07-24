import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type PharmacyNote = Readonly<{
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;
}>;
