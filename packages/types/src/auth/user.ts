import type { EntityId } from '../primitives';
import type { UserRole, UserStatus } from './role';

//===================================================================

export type AuthUser = {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  address?: string;
  pictureUrl?: string;
};
