import type { UserRole, UserStatus } from '@e-pharmacy/types/auth';

//===================================================================

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  client: 'Client',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
};

//===================================================================

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
};
