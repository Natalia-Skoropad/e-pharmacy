import type { AuthUser } from './user';

//===================================================================

export type AuthResponse = Readonly<{
  user: AuthUser;
}>;
