import type { EntityId, ISODateTimeString } from '../primitives';
import type { UserRole } from './role';

//===================================================================

export type ActiveSession = {
  id: EntityId;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  roleAtLogin: UserRole;
  createdAt?: ISODateTimeString;
  lastUsedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
  isCurrent: boolean;
};

//===================================================================

export type ActiveSessionsResponse = {
  sessions: ActiveSession[];
};
