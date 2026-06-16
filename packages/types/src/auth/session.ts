import type { EntityId, ISODateString } from '../shared';
import type { UserRole } from './role';

//===================================================================

export type ActiveSession = {
  id: EntityId;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  roleAtLogin: UserRole;
  createdAt?: ISODateString;
  lastUsedAt: ISODateString;
  expiresAt: ISODateString;
  isCurrent: boolean;
};

//===================================================================

export type ActiveSessionsResponse = {
  sessions: ActiveSession[];
};
