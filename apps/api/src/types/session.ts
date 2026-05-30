import type { Types } from 'mongoose';

import type { UserRole } from './user';

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
};

//===============================================================

export type SessionContext = {
  userAgent?: string;
  ip?: string;
  deviceName?: string;
};
