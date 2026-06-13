import type { Types } from 'mongoose';

import type {
  USER_ROLES,
  USER_STATUSES,
  PHARMACY_ACCOUNT_STATUSES,
} from '../constants/auth';

//===============================================================

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export type PharmacyAccountStatus =
  (typeof PHARMACY_ACCOUNT_STATUSES)[keyof typeof PHARMACY_ACCOUNT_STATUSES];

//===============================================================

export type UserEntity = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  pharmacyStatus?: PharmacyAccountStatus;
  phone: string;
  address?: string;
  pictureUrl?: string;
  favoriteProductIds?: string[];
  favoriteStoreIds?: string[];
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
};
