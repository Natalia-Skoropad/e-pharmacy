import type { z } from 'zod';

import type {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';

import type {
  AdminAccountStatus,
  ClientAccountStatus,
  PharmacyOwnerAccountStatus,
} from './user';

//===============================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

//===============================================================

type AuthUserResponseBase = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  pictureUrl?: string;
  revision: string;
};

//===============================================================

export type AuthUserResponse =
  | (AuthUserResponseBase & {
      role: 'client';
      status: ClientAccountStatus;
    })
  | (AuthUserResponseBase & {
      role: 'pharmacy';
      status: PharmacyOwnerAccountStatus;
    })
  | (AuthUserResponseBase & {
      role: 'admin';
      status: AdminAccountStatus;
    });

//===============================================================

export type AuthResponse = {
  user: AuthUserResponse;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export type AuthSessionResult = {
  user: AuthUserResponse;
  tokens: AuthTokens;
};
