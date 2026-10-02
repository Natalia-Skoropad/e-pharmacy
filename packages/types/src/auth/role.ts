export type UserRole = 'client' | 'pharmacy' | 'admin';

//===================================================================

export type ClientAccountStatus = 'active' | 'blocked';
export type AdminAccountStatus = 'active' | 'blocked';
export type PharmacyOwnerAccountStatus = 'new' | 'active' | 'blocked';

/**
 * Union of every persisted user account status.
 *
 * Consumers that know the account role should prefer the role-specific
 * account status aliases above so `new` cannot leak into client/admin flows.
 */
export type UserStatus =
  | ClientAccountStatus
  | AdminAccountStatus
  | PharmacyOwnerAccountStatus;
