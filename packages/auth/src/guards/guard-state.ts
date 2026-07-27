export type GuestGuardDecision =
  | 'loading'
  | 'unavailable-fallback'
  | 'unavailable-guest-content'
  | 'redirect-authenticated'
  | 'allow-guest';

//===================================================================

export function getGuestGuardDecision({
  isBootstrapping,
  isUnavailable,
  isAuthenticated,
  allowGuestContentWhenUnavailable,
}: {
  isBootstrapping: boolean;
  isUnavailable: boolean;
  isAuthenticated: boolean;
  allowGuestContentWhenUnavailable: boolean;
}): GuestGuardDecision {
  if (isBootstrapping) return 'loading';
  if (isUnavailable) {
    return allowGuestContentWhenUnavailable
      ? 'unavailable-guest-content'
      : 'unavailable-fallback';
  }
  if (isAuthenticated) return 'redirect-authenticated';
  return 'allow-guest';
}

//===================================================================

export type RoleGuardDecision =
  | 'loading'
  | 'unavailable'
  | 'redirect-login'
  | 'forbidden'
  | 'allow';

//===================================================================

export function getRoleGuardDecision({
  isBootstrapping,
  isUnavailable,
  isAuthenticated,
  hasAllowedRole,
}: {
  isBootstrapping: boolean;
  isUnavailable: boolean;
  isAuthenticated: boolean;
  hasAllowedRole: boolean;
}): RoleGuardDecision {
  if (isBootstrapping) return 'loading';
  if (isUnavailable) return 'unavailable';
  if (!isAuthenticated) return 'redirect-login';
  if (!hasAllowedRole) return 'forbidden';
  return 'allow';
}
