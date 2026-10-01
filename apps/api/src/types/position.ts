import type { Types } from 'mongoose';

//===============================================================

export type PositionPersistenceEntity = {
  name: string;
  normalizedName: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
