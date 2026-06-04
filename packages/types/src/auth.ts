import type { EntityId } from './base';

//=============================================================================

export type UserRole = 'customer' | 'vendor' | 'admin';
export type UserStatus = 'active' | 'blocked';
export type VendorAccountStatus = 'pending' | 'active' | 'rejected' | 'blocked';
export type ShopStatus = 'draft' | 'pending_review' | 'active' | 'suspended';

//=============================================================================

export type AuthUser = {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  vendorStatus?: VendorAccountStatus;
  phone?: string;
  address?: string;
  avatarUrl?: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: Extract<UserRole, 'customer' | 'vendor'>;
  phone?: string;
  address?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string | null;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
