import type { UserRole, UserStatus } from '@e-pharmacy/types/auth';

import type { StatusPresentation } from './types';

//===================================================================

export const USER_ROLE_LABELS = {
  client: 'Client',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
} as const satisfies Readonly<Record<UserRole, string>>;

//===================================================================

export const USER_STATUS_PRESENTATION = {
  active: { label: 'Active', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
} as const satisfies Readonly<
  Record<UserStatus, StatusPresentation>
>;

//===================================================================

export function getUserStatusPresentation(status: UserStatus) {
  return USER_STATUS_PRESENTATION[status];
}
