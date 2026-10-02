import type { HydratedDocument } from 'mongoose';

import type { AuthUserResponse } from '../types/auth';
import type { UserEntity } from '../types/user';

import {
  isAdminAccountStatus,
  isClientAccountStatus,
  isPharmacyOwnerAccountStatus,
} from './account-status';

//===============================================================

type UserDocument = HydratedDocument<UserEntity>;

//===============================================================

export function toAuthUserResponse(user: UserDocument): AuthUserResponse {
  const commonUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    pictureUrl: user.pictureUrl,
    revision: user.updatedAt.toISOString(),
  };

  if (user.role === 'client' && isClientAccountStatus(user.status)) {
    return { ...commonUser, role: user.role, status: user.status };
  }

  if (user.role === 'admin' && isAdminAccountStatus(user.status)) {
    return { ...commonUser, role: user.role, status: user.status };
  }

  if (user.role === 'pharmacy' && isPharmacyOwnerAccountStatus(user.status)) {
    return { ...commonUser, role: user.role, status: user.status };
  }

  throw new Error(
    `User ${String(user._id)} has an invalid account status for role ${user.role}.`
  );
}
