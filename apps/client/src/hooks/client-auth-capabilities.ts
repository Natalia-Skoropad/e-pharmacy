import type { AuthContextValue } from '@e-pharmacy/auth/react';
import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

type ClientAuthSource = Pick<
  AuthContextValue,
  'user' | 'status' | 'isAuthenticated' | 'isBootstrapping' | 'isUnavailable'
>;

//===================================================================

export type ClientAuthCapabilities = Readonly<{
  user: AuthUser | null;
  status: AuthContextValue['status'];
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isUnavailable: boolean;
  isActiveClient: boolean;
  isActivePharmacyUser: boolean;
  canUseClientFeatures: boolean;
  canOpenPharmacyCabinet: boolean;
}>;

//===================================================================

export function selectClientAuthCapabilities(
  auth: ClientAuthSource
): ClientAuthCapabilities {
  const isActiveUser = auth.user?.status === 'active';
  const isActiveClient =
    auth.isAuthenticated && auth.user?.role === 'client' && isActiveUser;
  const isActivePharmacyUser =
    auth.isAuthenticated && auth.user?.role === 'pharmacy' && isActiveUser;

  return {
    user: auth.user,
    status: auth.status,
    isAuthenticated: auth.isAuthenticated,
    isBootstrapping: auth.isBootstrapping,
    isUnavailable: auth.isUnavailable,
    isActiveClient,
    isActivePharmacyUser,
    canUseClientFeatures: isActiveClient,
    canOpenPharmacyCabinet: isActivePharmacyUser,
  };
}
