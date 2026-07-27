import type { UserStatus } from '@e-pharmacy/types/auth';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const USER_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly UserStatus[];

//===================================================================

type _UserStatusesAreExhaustive = Assert<
  IsExactValueSet<UserStatus, typeof USER_STATUSES>
>;
