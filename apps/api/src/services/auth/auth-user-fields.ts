// S10.4: Canonical Auth user-fields domain.
import type { HydratedDocument } from 'mongoose';

import { AUTH_ERROR_CODES } from '../../constants/auth';
import { API_MESSAGES } from '../../constants/messages';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { User } from '../../models/user.model';

import type { UserEntity } from '../../types/user';

import { httpError } from '../../utils/httpError';

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
