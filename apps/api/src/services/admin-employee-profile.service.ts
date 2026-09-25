import mongoose, { type ClientSession } from 'mongoose';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../constants/admin-audit';

import { AUTH_ERROR_CODES, USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';
import { User } from '../models/user.model';

import type { UpdateMyAdminEmployeeProfileInput } from '../schemas/admin-employee-profile.schema';
import type { AdminAuthorization } from '../types/admin-access';
import type { AuthUserResponse } from '../types/auth';

import { httpError } from '../utils/httpError';
import { toAuthUserResponse } from '../utils/userResponse';
import { appendAdminAuditLog } from './admin-audit.service';

//===============================================================

type ProfileAuditUser = Readonly<{
  name: string;
  email: string;
  pictureUrl?: string | null;
}>;

//===============================================================

function assertSelfAdminAuthorization(
  userId: string,
  authorization: AdminAuthorization
): void {
  if (authorization.userId !== userId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access does not belong to the authenticated user.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }
}

//===============================================================

function getProfileAuditFields(
  input: UpdateMyAdminEmployeeProfileInput
): Array<'hasPicture'> {
  return 'pictureUrl' in input ? ['hasPicture'] : [];
}

//===============================================================

function buildProfileAuditSnapshot(
  user: ProfileAuditUser,
  fields: readonly 'hasPicture'[]
): Record<string, string | boolean> {
  const snapshot: Record<string, string | boolean> = {};

  for (const field of fields) {
    if (field === 'hasPicture') snapshot.hasPicture = Boolean(user.pictureUrl);
  }

  return snapshot;
}

//===============================================================

async function throwProfileConflictOrInvalidSession(
  userId: string,
  session: ClientSession
): Promise<never> {
  const adminExists = await User.exists({
    _id: userId,
    role: USER_ROLES.ADMIN,
  }).session(session);

  if (adminExists) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Profile changed in another session. Reload the latest data and try again.',
      undefined,
      AUTH_ERROR_CODES.PROFILE_CONFLICT
    );
  }

  throw httpError(
    HTTP_STATUS.UNAUTHORIZED,
    API_MESSAGES.USER_NOT_FOUND,
    undefined,
    AUTH_ERROR_CODES.SESSION_INVALID
  );
}

//===============================================================

export async function updateMyAdminEmployeeProfileService(
  userId: string,
  authorization: AdminAuthorization,
  input: UpdateMyAdminEmployeeProfileInput,
  auditRequestId: string
): Promise<AuthUserResponse> {
  assertSelfAdminAuthorization(userId, authorization);

  const update: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  if ('pictureUrl' in input) {
    if (input.pictureUrl) update.pictureUrl = input.pictureUrl;
    else unset.pictureUrl = '';
  }

  const updateQuery: Record<string, unknown> = {};

  if (Object.keys(update).length > 0) updateQuery.$set = update;
  if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

  const expectedRevision = new Date(input.expectedRevision);
  const auditFields = getProfileAuditFields(input);
  const session = await mongoose.startSession();
  let result: AuthUserResponse | null = null;

  try {
    await session.withTransaction(async () => {
      const beforeUser = await User.findOne({
        _id: userId,
        role: USER_ROLES.ADMIN,
        updatedAt: expectedRevision,
      }).session(session);

      if (!beforeUser) {
        await throwProfileConflictOrInvalidSession(userId, session);
      }

      const user = await User.findOneAndUpdate(
        {
          _id: userId,
          role: USER_ROLES.ADMIN,
          updatedAt: expectedRevision,
        },
        updateQuery,
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        }
      );

      if (!user) {
        await throwProfileConflictOrInvalidSession(userId, session);
      }

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.ADMIN_EMPLOYEE_PROFILE_UPDATED,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE,
        entityId: userId,
        entityLabel: user.name,
        before: buildProfileAuditSnapshot(beforeUser, auditFields),
        after: buildProfileAuditSnapshot(user, auditFields),
        changedFields: auditFields,
        requestId: auditRequestId,
        session,
      });

      result = toAuthUserResponse(user);
    });
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Admin profile update transaction did not commit.');
  }

  return result;
}
