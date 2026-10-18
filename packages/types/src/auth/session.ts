import type { EntityId, ISODateTimeString } from '../primitives';
import type { UserRole } from './role';

//===================================================================

export type ActiveSession = Readonly<{
  id: EntityId;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  roleAtLogin: UserRole;
  createdAt?: ISODateTimeString;
  lastUsedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
  isCurrent: boolean;
  revokedAt?: ISODateTimeString;

  revokedReason?:
    | 'logout'
    | 'logout_all'
    | 'password_changed'
    | 'user_blocked'
    | 'token_reuse'
    | 'admin_revoked';
}>;

//===================================================================

export type ActiveSessionsResponse = Readonly<{
  sessions: readonly ActiveSession[];
}>;
