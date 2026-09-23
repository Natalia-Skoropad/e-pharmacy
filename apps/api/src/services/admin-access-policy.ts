import {
  ADMIN_ACCESS_ERROR_CODES,
  ADMIN_ACCESS_STATUSES,
} from '../constants/admin-access';

import {
  ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
  type AdminPermission,
} from '../constants/admin-permissions';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { AdminAuthorization } from '../types/admin-access';
import { httpError } from '../utils/httpError';
import { hasAdminPermission } from './admin-permission-evaluator';

//===============================================================

export function assertCanManageAdminPermissions({
  actor,
  target,
  nextPermissions,
}: Readonly<{
  actor: AdminAuthorization;
  target: AdminAuthorization;
  nextPermissions: readonly unknown[];
}>): readonly AdminPermission[] {
  if (
    actor.status !== ADMIN_ACCESS_STATUSES.ACTIVE ||
    target.status !== ADMIN_ACCESS_STATUSES.ACTIVE
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access is not active.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REVOKED
    );
  }

  if (actor.userId === target.userId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'An admin employee cannot change their own access.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.SELF_ACCESS_CHANGE_NOT_ALLOWED
    );
  }

  if (!actor.isPlatformOwner) {
    if (target.isPlatformOwner) {
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'Platform Owner access is protected.',
        undefined,
        ADMIN_ACCESS_ERROR_CODES.OWNER_ACCESS_PROTECTED
      );
    }

    if (
      !hasAdminPermission(actor, ADMIN_PERMISSIONS.employees.managePermissions)
    ) {
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'Admin permission is required.',
        undefined,
        ADMIN_ACCESS_ERROR_CODES.PERMISSION_DENIED
      );
    }
  }

  const normalized = normalizeAdminPermissions(nextPermissions);

  if (
    !actor.isPlatformOwner &&
    normalized.some((permission) => !actor.permissions.includes(permission))
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'An admin employee cannot delegate permissions they do not have.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.PERMISSION_DELEGATION_DENIED
    );
  }

  return normalized;
}

//===============================================================

export function assertCanRevokeAdminAccess({
  actor,
  target,
}: Readonly<{
  actor: AdminAuthorization;
  target: AdminAuthorization;
}>): void {
  if (actor.userId === target.userId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'An admin employee cannot revoke their own access.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.SELF_ACCESS_CHANGE_NOT_ALLOWED
    );
  }

  if (target.isPlatformOwner) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Platform Owner access is protected.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.OWNER_ACCESS_PROTECTED
    );
  }

  if (
    !actor.isPlatformOwner &&
    !hasAdminPermission(actor, ADMIN_PERMISSIONS.employees.revokeAccess)
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin permission is required.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.PERMISSION_DENIED
    );
  }
}
