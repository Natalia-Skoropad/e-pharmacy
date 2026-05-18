export type UserRole = 'customer' | 'vendor' | 'admin';

export type UserStatus = 'active' | 'blocked';

//===================================================================

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  address?: string;
  avatarUrl?: string;
};

//===================================================================

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

//===================================================================

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


//===================================================================

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
