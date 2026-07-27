import type { UserRole, UserStatus } from '@e-pharmacy/types/auth';

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
  Record<UserStatus, Readonly<{ label: string; tone: string }>>
>;

//===================================================================

export function getUserStatusPresentation(status: UserStatus) {
  return USER_STATUS_PRESENTATION[status];
}
