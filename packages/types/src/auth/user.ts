import type { EntityId } from '../shared';
import type { UserRole, UserStatus, PharmacyAccountStatus } from './role';

//===================================================================

export type AuthUser = {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  pharmacyStatus?: PharmacyAccountStatus;
  phone: string;
  address?: string;
  pictureUrl?: string;
};

export type User = AuthUser;
