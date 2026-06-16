import type { Types } from 'mongoose';

import type { UserRole } from './user';

//===============================================================

export type SessionRevokedReason =
  | 'logout'
  | 'logout_all'
  | 'password_changed'
  | 'user_blocked'
  | 'token_reuse'
  | 'admin_revoked';

//===============================================================

export type SessionEntity = {
  userId: Types.ObjectId | string;
  refreshTokenHash: string;
  previousRefreshTokenHash?: string;
  previousRefreshTokenValidUntil?: Date;
  userAgent?: string;
  ip?: string;
  deviceName?: string;
  roleAtLogin: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date;
  revokedReason?: SessionRevokedReason;
};

export type SessionResponseDto = {
  id: string;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  roleAtLogin: UserRole;
  createdAt?: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

//===============================================================

export type SessionContext = {
  userAgent?: string;
  ip?: string;
  deviceName?: string;
};
