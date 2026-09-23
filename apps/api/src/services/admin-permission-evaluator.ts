import { ADMIN_ACCESS_STATUSES } from '../constants/admin-access';

import {
  isAdminPermission,
  type AdminPermission,
} from '../constants/admin-permissions';

import type { AdminAuthorization } from '../types/admin-access';

//===============================================================

export function hasAdminPermission(
  authorization: AdminAuthorization | null | undefined,
  permission: AdminPermission | unknown
): boolean {
  if (!authorization || !isAdminPermission(permission)) return false;
  if (authorization.status !== ADMIN_ACCESS_STATUSES.ACTIVE) return false;
  if (authorization.isPlatformOwner) return true;
  return authorization.permissions.includes(permission);
}
