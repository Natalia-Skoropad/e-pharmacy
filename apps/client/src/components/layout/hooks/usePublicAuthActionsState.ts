'use client';

import { useClientAuthCapabilities } from '@/hooks';

//===================================================================

export function usePublicAuthActionsState() {
  const {
    status,
    isAuthenticated,
    isAuthReady,
    isClient,
    isPharmacy,
    user,
    logout,
  } = useClientAuthCapabilities();

  const hasAuthenticatedUser = isAuthReady && isAuthenticated;

  return {
    user,
    logout,
    isAuthenticated: hasAuthenticatedUser,
    isAuthReady,
    isAuthLoading: !isAuthReady,
    isClient,
    isPharmacy,
    shouldShowGuestActions: isAuthReady && !hasAuthenticatedUser,
    shouldShowClientActions: hasAuthenticatedUser && isClient,
    shouldShowPharmacyActions: hasAuthenticatedUser && isPharmacy,
    shouldShowAuthenticatedActions: hasAuthenticatedUser,
    isAuthUnavailable: status === 'unavailable',
  };
}
