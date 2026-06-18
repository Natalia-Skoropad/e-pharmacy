import type { AuthApplication } from './application';
import type { UserRole } from './role';
import type { AuthUser } from './user';

//===================================================================

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
  phone: string;
  address?: string;
  role?: Extract<UserRole, 'client' | 'pharmacy'>;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
  application: AuthApplication;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  pictureUrl?: string | null;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
