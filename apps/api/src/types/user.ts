import type { USER_ROLES, USER_STATUSES } from '../constants/auth';

//===============================================================

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

//===============================================================

export type UserEntity = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  favoriteProductIds?: string[];
  favoriteStoreIds?: string[];
};
