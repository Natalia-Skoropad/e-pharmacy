// S10.4: Canonical Auth profile domain.
import mongoose from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin-audit';

import {
  AUTH_ERROR_CODES,
  USER_ROLES,
  USER_STATUSES,
} from '../../constants/auth';

import { API_MESSAGES } from '../../constants/messages';
import { HTTP_STATUS } from '../../constants/httpStatus';

import { User } from '../../models/user.model';

import type { AuthUserResponse, UpdateProfileInput } from '../../types/auth';

import { httpError } from '../../utils/httpError';
import { isDuplicatePhoneError } from '../../utils/mongoError';
import { toAuthUserResponse } from '../../utils/userResponse';
import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';

import {
  normalizePhoneForLookup,
  ensurePhoneIsAvailable,
} from './auth-user-fields';

//===============================================================

export async function getUserByIdService(
  userId: string
): Promise<AuthUserResponse> {
  const user = await User.findById(userId);

  if (!user) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.USER_NOT_FOUND,
      undefined,

      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      API_MESSAGES.USER_BLOCKED,
      undefined,

      AUTH_ERROR_CODES.USER_BLOCKED
    );
  }

  return toAuthUserResponse(user);
}

//===============================================================

async function updatePharmacyOwnerUserProfileWithAudit(
  userId: string,
  input: UpdateProfileInput,
  auditRequestId: string | undefined
): Promise<AuthUserResponse> {
  if (!auditRequestId) {
    throw new TypeError('Owner profile updates require an audit request ID.');
  }

  const normalizedPhone =
    typeof input.phone === 'string'
      ? normalizePhoneForLookup(input.phone)
      : undefined;

  if (normalizedPhone) {
    await ensurePhoneIsAvailable(normalizedPhone, userId);
  }

  const expectedRevision = new Date(input.expectedRevision);
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const user = await User.findOne({
        _id: userId,
        role: USER_ROLES.PHARMACY,
      }).session(session);

      if (!user) {
        throw httpError(
          HTTP_STATUS.UNAUTHORIZED,
          API_MESSAGES.USER_NOT_FOUND,
          undefined,

          AUTH_ERROR_CODES.SESSION_INVALID
        );
      }

      if (user.updatedAt.getTime() !== expectedRevision.getTime()) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Profile changed in another session. Reload the latest data and try again.',
          undefined,

          AUTH_ERROR_CODES.PROFILE_CONFLICT
        );
      }

      const beforeProfile: Record<string, string | null> = {};
      const afterProfile: Record<string, string | null> = {};
      const changedProfileFields: string[] = [];

      if (typeof input.name === 'string' && input.name !== user.name) {
        beforeProfile.name = user.name;
        afterProfile.name = input.name;
        changedProfileFields.push('name');
        user.name = input.name;
      }

      if (normalizedPhone && normalizedPhone !== user.phone) {
        beforeProfile.phone = user.phone;
        afterProfile.phone = normalizedPhone;
        changedProfileFields.push('phone');
        user.phone = normalizedPhone;
      }

      if ('address' in input) {
        const beforeAddress = user.address ?? null;
        const afterAddress = input.address ?? null;

        if (beforeAddress !== afterAddress) {
          beforeProfile.address = beforeAddress;
          afterProfile.address = afterAddress;
          changedProfileFields.push('address');
          user.address = input.address ?? undefined;
        }
      }

      const pictureChanged =
        'pictureUrl' in input &&
        (user.pictureUrl ?? null) !== (input.pictureUrl ?? null);

      if (pictureChanged) {
        user.pictureUrl = input.pictureUrl ?? undefined;
      }

      if (changedProfileFields.length === 0 && !pictureChanged) {
        return toAuthUserResponse(user);
      }

      await user.save({ session });

      if (changedProfileFields.length > 0) {
        await appendAdminAuditLog({
          actorUserId: userId,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
          section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
          entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
          entityId: userId,
          entityLabel: user.name,
          scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
          scopeEntityId: userId,
          before: beforeProfile,
          after: afterProfile,
          changedFields: changedProfileFields,
          requestId: auditRequestId,
          session,
        });
      }

      if (pictureChanged) {
        await appendAdminAuditLog({
          actorUserId: userId,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PHOTO_UPDATED,
          section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
          entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
          entityId: userId,
          entityLabel: user.name,
          scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
          scopeEntityId: userId,
          before: { profilePhotoChanged: false },
          after: { profilePhotoChanged: true },
          changedFields: ['profilePhotoChanged'],
          requestId: auditRequestId,
          session,
        });
      }

      return toAuthUserResponse(user);
    });

    if (!result) {
      throw new Error('Owner profile transaction completed without a result.');
    }

    return result;
  } catch (error) {
    if (isDuplicatePhoneError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.PHONE_IN_USE,
        undefined,

        AUTH_ERROR_CODES.PHONE_CONFLICT
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function updateUserProfileService(
  userId: string,
  input: UpdateProfileInput,
  auditRequestId?: string
): Promise<AuthUserResponse> {
  // An owner account exists independently of any Pharmacy (Stage 14.18.2).
  // Identify owner profiles by User.role, so a zero-pharmacy owner still
  // receives the same audit and optimistic-concurrency guarantees.
  const isPharmacyOwner = await User.exists({
    _id: userId,
    role: USER_ROLES.PHARMACY,
  });

  if (isPharmacyOwner) {
    return updatePharmacyOwnerUserProfileWithAudit(
      userId,
      input,
      auditRequestId
    );
  }

  const update: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  if (typeof input.name === 'string') update.name = input.name;

  if (typeof input.phone === 'string') {
    const phone = normalizePhoneForLookup(input.phone);

    await ensurePhoneIsAvailable(phone, userId);

    update.phone = phone;
  }

  if ('address' in input) {
    if (typeof input.address === 'string') update.address = input.address;
    else if (input.address === null) unset.address = '';
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
      { _id: userId, updatedAt: expectedRevision },
      updateQuery,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!user) {
      const userExists = await User.exists({ _id: userId });

      if (userExists) {
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
    if (isDuplicatePhoneError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.PHONE_IN_USE,
        undefined,

        AUTH_ERROR_CODES.PHONE_CONFLICT
      );
    }

    throw error;
  }
}
