// S10.4: Canonical Auth user-fields domain.
import type { HydratedDocument } from 'mongoose';

import { AUTH_ERROR_CODES } from '../../constants/auth/auth';
import { API_MESSAGES } from '../../constants/shared/messages';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { User } from '../../models/accounts/user.model';

import type { UserEntity } from '../../types/accounts/user';

import { httpError } from '../../utils/http/httpError';

//===============================================================

export type UserDocument = HydratedDocument<UserEntity>;

//===============================================================

export function normalizePhoneForLookup(phone: string): string {
  return phone.trim();
}

//===============================================================

export async function ensurePhoneIsAvailable(
  phone: string,
  excludeUserId?: string
): Promise<void> {
  const normalizedPhone = normalizePhoneForLookup(phone);

  const existingPhoneOwner = await User.exists({
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),

    phone: normalizedPhone,
  });

  if (existingPhoneOwner) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      API_MESSAGES.PHONE_IN_USE,
      undefined,

      AUTH_ERROR_CODES.PHONE_CONFLICT
    );
  }
}
