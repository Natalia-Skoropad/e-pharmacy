import type { ApiPaginationResponse } from '../api';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '../primitives';

import type { ReferenceDataListQueryParams } from './common';

//===================================================================

/**
 * Employee position is descriptive reference data only.
 * It must not grant permissions or act as an AdminAccess permission preset.
 */
export type PositionEntity = Readonly<{
  id: EntityId;
  name: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  createdBy: EntityId;
  updatedBy: EntityId;
}>;

//===================================================================

export type PositionUsage = Readonly<{
  employeesCount: number;
  total: number;
}>;

export type PositionListItem = Readonly<
  Pick<PositionEntity, 'id' | 'name' | 'createdAt'> & {
    usage: PositionUsage;
  }
>;

export type PositionListQueryParams = ReferenceDataListQueryParams;

export type PositionListResponse = Readonly<
  ApiPaginationResponse<PositionListItem> & {
    earliestCreatedAt: CalendarDateString | null;
  }
>;

//===================================================================

export type CreatePositionPayload = Readonly<{
  name: string;
}>;

export type UpdatePositionPayload = Readonly<{
  name: string;
}>;

export type PositionResponse = Readonly<{
  position: PositionEntity;
}>;
