import type { ClientSession } from 'mongoose';

import {
  ADMIN_ACCESS_ERROR_CODES,
  ADMIN_ACCESS_STATUSES,
} from '../constants/admin-access';

import {
  normalizeAdminPermissions,
  type AdminPermission,
} from '../constants/admin-permissions';

import { HTTP_STATUS } from '../constants/httpStatus';
import { AdminAccess } from '../models/adminAccess.model';

import type {
  AdminAccessResponseDto,
  AdminAuthorization,
} from '../types/admin-access';

import { httpError } from '../utils/httpError';

//===============================================================

type AdminAccessLeanRecord = Readonly<{
  userId: unknown;
  status: unknown;
  isPlatformOwner: unknown;
  permissions: unknown;
}>;

//===============================================================

function parseAdminAccessRecord(
  record: AdminAccessLeanRecord
): AdminAuthorization {
  if (
    record.status !== ADMIN_ACCESS_STATUSES.ACTIVE &&
    record.status !== ADMIN_ACCESS_STATUSES.REVOKED
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access record is invalid.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.INVALID_ACCESS_RECORD
    );
  }

  if (record.status === ADMIN_ACCESS_STATUSES.REVOKED) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access has been revoked.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REVOKED
    );
  }

  if (
    typeof record.isPlatformOwner !== 'boolean' ||
    !Array.isArray(record.permissions)
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access record is invalid.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.INVALID_ACCESS_RECORD
    );
  }

  let permissions: AdminPermission[];

  try {
    permissions = normalizeAdminPermissions(record.permissions);
  } catch {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access record is invalid.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.INVALID_ACCESS_RECORD
    );
  }

  return {
    userId: String(record.userId),
    status: ADMIN_ACCESS_STATUSES.ACTIVE,
    isPlatformOwner: record.isPlatformOwner,
    permissions,
  };
}

//===============================================================

export async function getAdminAuthorizationService(
  userId: string,
  session?: ClientSession
): Promise<AdminAuthorization> {
  const query = AdminAccess.findOne({ userId }).select(
    'userId status isPlatformOwner permissions'
  );

  if (session) query.session(session);

  const record = await query.lean<AdminAccessLeanRecord | null>();

  if (!record) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access is required.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }

  return parseAdminAccessRecord(record);
}

//===============================================================

export function serializeAdminAccess(
  authorization: AdminAuthorization
): AdminAccessResponseDto {
  return {
    status: ADMIN_ACCESS_STATUSES.ACTIVE,
    isPlatformOwner: authorization.isPlatformOwner,
    permissions: authorization.permissions,
  };
}
