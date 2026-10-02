import {
  ADMIN_ACCOUNT_STATUSES,
  CLIENT_ACCOUNT_STATUSES,
  PHARMACY_OWNER_ACCOUNT_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import type {
  AdminAccountStatus,
  ClientAccountStatus,
  PharmacyOwnerAccountStatus,
  UserRole,
  UserStatus,
} from '../types/user';

//===============================================================

export function isClientAccountStatus(
  status: UserStatus
): status is ClientAccountStatus {
  return (CLIENT_ACCOUNT_STATUSES as readonly UserStatus[]).includes(status);
}

//===============================================================

export function isAdminAccountStatus(
  status: UserStatus
): status is AdminAccountStatus {
  return (ADMIN_ACCOUNT_STATUSES as readonly UserStatus[]).includes(status);
}

//===============================================================

export function isPharmacyOwnerAccountStatus(
  status: UserStatus
): status is PharmacyOwnerAccountStatus {
  return (PHARMACY_OWNER_ACCOUNT_STATUSES as readonly UserStatus[]).includes(
    status
  );
}

//===============================================================

export function isAccountStatusAllowedForRole(
  role: UserRole,
  status: UserStatus
): boolean {
  if (role === USER_ROLES.CLIENT) return isClientAccountStatus(status);
  if (role === USER_ROLES.ADMIN) return isAdminAccountStatus(status);
  return isPharmacyOwnerAccountStatus(status);
}

//===============================================================

export function getInitialAccountStatusForRole(role: UserRole): UserStatus {
  return role === USER_ROLES.PHARMACY
    ? USER_STATUSES.NEW
    : USER_STATUSES.ACTIVE;
}
