import { Types } from 'mongoose';

import type {
  AdminPositionDto,
  PositionUsageDto,
} from '../../../types/admin/settings/admin-settings';

import type { PositionPersistenceEntity } from '../../../types/admin/settings/position';

//===============================================================

export type LeanPosition = PositionPersistenceEntity & {
  _id: Types.ObjectId;
};

//===============================================================

export function zeroPositionUsage(): PositionUsageDto {
  return { employeesCount: 0, total: 0 };
}

//===============================================================

export function serializePosition(position: LeanPosition): AdminPositionDto {
  return {
    id: String(position._id),
    name: position.name,
    usage: zeroPositionUsage(),
    createdAt: position.createdAt.toISOString(),
    updatedAt: position.updatedAt.toISOString(),
  };
}
