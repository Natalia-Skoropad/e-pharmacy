import type { EntityId, ISODateString } from './id';

export type TimestampedEntity = {
  id: EntityId;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
};
