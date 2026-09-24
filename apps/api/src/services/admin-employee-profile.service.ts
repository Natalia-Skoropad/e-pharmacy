import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
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

export async function updateMyAdminEmployeeProfileService(
  userId: string,
  authorization: AdminAuthorization,
  input: UpdateMyAdminEmployeeProfileInput
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

  try {
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
      }
    );

    if (!user) {
      const adminExists = await User.exists({
        _id: userId,
        role: USER_ROLES.ADMIN,
      });

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

    return toAuthUserResponse(user);
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
  }
}
