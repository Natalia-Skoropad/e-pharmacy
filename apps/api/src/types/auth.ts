import type { z } from 'zod';

import type {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';

import type { UserRole, UserStatus, PharmacyAccountStatus } from './user';

//===============================================================

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

//===============================================================

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  pharmacyStatus?: PharmacyAccountStatus;
  phone: string;
  address?: string;
  pictureUrl?: string;
};

//===============================================================

export type AuthResponse = {
  user: AuthUserResponse;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthSessionResult = {
  user: AuthUserResponse;
  tokens: AuthTokens;
};

//===============================================================

export type CurrentUserResponse = {
  user: AuthUserResponse;
};
