import type { AuthApplication, UserRole } from '@e-pharmacy/types/auth';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

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

//===================================================================

type _AuthApplicationsAreExhaustive = Assert<
  IsExactValueSet<AuthApplication, typeof AUTH_APPLICATIONS>
>;

//===================================================================

type _UserRolesAreExhaustive = Assert<
  IsExactValueSet<UserRole, typeof USER_ROLES>
>;
