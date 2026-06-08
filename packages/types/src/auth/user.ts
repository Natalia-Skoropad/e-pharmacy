import type { EntityId } from '../shared';
import type { UserRole, UserStatus, VendorAccountStatus } from './role';

//===================================================================

export type AuthUser = {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  vendorStatus?: VendorAccountStatus;
  phone: string;
  address?: string;
  pictureUrl?: string;
};

export type User = AuthUser;
