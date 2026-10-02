import type {
  AdminAccountStatus,
  ClientAccountStatus,
  PharmacyOwnerAccountStatus,
  UserStatus,
} from '@e-pharmacy/types/auth';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const USER_STATUSES = [
  'new',
  'active',
  'blocked',
] as const satisfies readonly UserStatus[];

export const CLIENT_ACCOUNT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly ClientAccountStatus[];

export const ADMIN_ACCOUNT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly AdminAccountStatus[];

export const PHARMACY_OWNER_ACCOUNT_STATUSES = [
  'new',
  'active',
  'blocked',
] as const satisfies readonly PharmacyOwnerAccountStatus[];

//===================================================================

type _UserStatusesAreExhaustive = Assert<
  IsExactValueSet<UserStatus, typeof USER_STATUSES>
>;

type _ClientAccountStatusesAreExhaustive = Assert<
  IsExactValueSet<ClientAccountStatus, typeof CLIENT_ACCOUNT_STATUSES>
>;

type _AdminAccountStatusesAreExhaustive = Assert<
  IsExactValueSet<AdminAccountStatus, typeof ADMIN_ACCOUNT_STATUSES>
>;

type _PharmacyOwnerAccountStatusesAreExhaustive = Assert<
  IsExactValueSet<
    PharmacyOwnerAccountStatus,
    typeof PHARMACY_OWNER_ACCOUNT_STATUSES
  >
>;
