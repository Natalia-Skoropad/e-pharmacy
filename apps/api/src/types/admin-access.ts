import type { Types } from 'mongoose';

import type { ADMIN_ACCESS_STATUSES } from '../constants/admin-access';
import type { AdminPermission } from '../constants/admin-permissions';

//===============================================================

export type AdminAccessStatus =
  (typeof ADMIN_ACCESS_STATUSES)[keyof typeof ADMIN_ACCESS_STATUSES];

export type AdminAccessEntity = {
  userId: Types.ObjectId;
  status: AdminAccessStatus;
  isPlatformOwner: boolean;
  permissions: AdminPermission[];
  createdAt: Date;
  updatedAt: Date;
};

export type AdminAuthorization = Readonly<{
  userId: string;
  status: typeof ADMIN_ACCESS_STATUSES.ACTIVE;
  isPlatformOwner: boolean;
  permissions: readonly AdminPermission[];
}>;

export type AdminAccessResponseDto = Readonly<{
  status: typeof ADMIN_ACCESS_STATUSES.ACTIVE;
  isPlatformOwner: boolean;
  permissions: readonly AdminPermission[];
}>;
