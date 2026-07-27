import type { UserStatus } from '@e-pharmacy/types/auth';

//===================================================================

export const USER_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly UserStatus[];
