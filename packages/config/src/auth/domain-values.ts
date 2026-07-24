import type { AuthApplication, UserRole } from '@e-pharmacy/types/auth';

//===================================================================

export const AUTH_APPLICATIONS = [
  'client',
  'pharmacy',
  'admin',
] as const satisfies readonly AuthApplication[];

//===================================================================

export const USER_ROLES = [
  'client',
  'pharmacy',
  'admin',
] as const satisfies readonly UserRole[];
