import type { AdminAccess } from './admin-access';
import { isAdminPermission, type AdminPermission } from './admin-permissions';

//===================================================================

export function canAdmin(
  access: AdminAccess | null | undefined,
  permission: AdminPermission | unknown
): boolean {
  if (!access || access.status !== 'active' || !isAdminPermission(permission)) {
    return false;
  }

  if (access.isPlatformOwner) return true;
  return access.permissions.includes(permission);
}
