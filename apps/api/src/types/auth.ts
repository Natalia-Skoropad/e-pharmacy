import type { z } from 'zod';

import type { loginSchema, registerSchema } from '../schemas/auth.schema';
import type { UserRole, UserStatus } from './user';

//===============================================================

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;

//===============================================================

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
};

//===============================================================

export type AuthResponse = {
  user: AuthUserResponse;
  token: string;
};
