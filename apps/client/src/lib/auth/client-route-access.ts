import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

export function canAccessClientPrivateRoutes(user: AuthUser): boolean {
  return user.role === 'client' && user.status === 'active';
}
