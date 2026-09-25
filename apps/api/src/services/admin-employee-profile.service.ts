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
import { isDuplicateEmailError } from '../utils/mongoError';
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

function assertEditableFields(
  authorization: AdminAuthorization,
  input: UpdateMyAdminEmployeeProfileInput
): void {
  if (authorization.isPlatformOwner) return;

  if (input.name !== undefined || input.email !== undefined) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only a Platform Owner can update admin name or email.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.PLATFORM_OWNER_REQUIRED
    );
  }
}

//===============================================================

function getProfileAuditFields(
  input: UpdateMyAdminEmployeeProfileInput
): Array<'name' | 'email' | 'hasPicture'> {
  const fields: Array<'name' | 'email' | 'hasPicture'> = [];

  if (input.name !== undefined) fields.push('name');
  if (input.email !== undefined) fields.push('email');
  if ('pictureUrl' in input) fields.push('hasPicture');

  return fields;
}

//===============================================================

function buildProfileAuditSnapshot(
  user: ProfileAuditUser,
  fields: readonly ('name' | 'email' | 'hasPicture')[]
): Record<string, string | boolean> {
  const snapshot: Record<string, string | boolean> = {};

  for (const field of fields) {
    if (field === 'name') snapshot.name = user.name;
    if (field === 'email') snapshot.email = user.email;
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
  assertEditableFields(authorization, input);

  const update: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  if (authorization.isPlatformOwner && input.name !== undefined) {
    update.name = input.name;
  }

  if (authorization.isPlatformOwner && input.email !== undefined) {
    update.email = input.email;
  }

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
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.EMAIL_IN_USE,
        undefined,
        AUTH_ERROR_CODES.EMAIL_CONFLICT
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Admin profile update transaction did not commit.');
  }

  return result;
}
