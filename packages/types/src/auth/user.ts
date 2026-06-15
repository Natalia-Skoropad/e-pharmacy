import type { EntityId } from '../shared';
import type { UserRole, UserStatus, PharmacyStatus } from './role';

//===================================================================

export type AuthUser = {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  pharmacyStatus?: PharmacyStatus;
  phone: string;
  address?: string;
  pictureUrl?: string;
};
