import type { HydratedDocument } from 'mongoose';

import type { AuthUserResponse } from '../types/auth';
import type { UserEntity } from '../types/user';

//===============================================================

type UserDocument = HydratedDocument<UserEntity>;

//===============================================================

export function toAuthUserResponse(user: UserDocument): AuthUserResponse {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    vendorStatus: user.vendorStatus,
    phone: user.phone,
    address: user.address,
    avatarUrl: user.avatarUrl,
  };
}
