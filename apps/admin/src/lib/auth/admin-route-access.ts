import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

export function canAccessAdminPrivateRoutes(user: AuthUser): boolean {
  return user.role === 'admin' && user.status === 'active';
}
