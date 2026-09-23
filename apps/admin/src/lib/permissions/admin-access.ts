import {
  normalizeAdminPermissions,
  type AdminPermission,
} from './admin-permissions';

//===================================================================

export const ADMIN_ACCESS_ERROR_CODES = {
  ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED',
  ACCESS_REVOKED: 'ADMIN_ACCESS_REVOKED',
  PERMISSION_DENIED: 'ADMIN_PERMISSION_DENIED',
  PLATFORM_OWNER_REQUIRED: 'PLATFORM_OWNER_REQUIRED',
  LAST_PLATFORM_OWNER: 'LAST_PLATFORM_OWNER',
  SELF_ACCESS_CHANGE_NOT_ALLOWED: 'ADMIN_SELF_ACCESS_CHANGE_NOT_ALLOWED',
  OWNER_ACCESS_PROTECTED: 'ADMIN_OWNER_ACCESS_PROTECTED',
  PERMISSION_DELEGATION_DENIED: 'ADMIN_PERMISSION_DELEGATION_DENIED',
  INVALID_ACCESS_RECORD: 'ADMIN_INVALID_ACCESS_RECORD',
} as const;

//===================================================================

export type AdminAccess = Readonly<{
  status: 'active';
  isPlatformOwner: boolean;
  permissions: readonly AdminPermission[];
}>;

export type AdminAccessResponse = Readonly<{
  access: AdminAccess;
}>;

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

export function parseAdminAccessResponse(value: unknown): AdminAccessResponse {
  if (!isRecord(value) || !isRecord(value.access)) {
    throw new TypeError('Invalid admin access response.');
  }

  const access = value.access;

  if (
    access.status !== 'active' ||
    typeof access.isPlatformOwner !== 'boolean' ||
    !Array.isArray(access.permissions)
  ) {
    throw new TypeError('Invalid admin access response.');
  }

  return {
    access: {
      status: 'active',
      isPlatformOwner: access.isPlatformOwner,
      permissions: normalizeAdminPermissions(access.permissions),
    },
  };
}
