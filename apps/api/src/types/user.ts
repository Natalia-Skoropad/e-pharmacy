import type { Types } from 'mongoose';

import type {
  ADMIN_ACCOUNT_STATUSES,
  CLIENT_ACCOUNT_STATUSES,
  PHARMACY_OWNER_ACCOUNT_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

//===============================================================

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export type ClientAccountStatus = (typeof CLIENT_ACCOUNT_STATUSES)[number];
export type AdminAccountStatus = (typeof ADMIN_ACCOUNT_STATUSES)[number];

export type PharmacyOwnerAccountStatus =
  (typeof PHARMACY_OWNER_ACCOUNT_STATUSES)[number];

//===============================================================

export type UserEntity = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  statusReason?: string;
  phone: string;
  address?: string;
  pictureUrl?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  isDefaultPharmacyClient?: boolean;
  defaultClientPharmacyId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
