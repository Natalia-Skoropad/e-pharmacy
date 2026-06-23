'use client';

import { useAuth } from '@e-pharmacy/auth/core';

//===================================================================

export function usePublicAuthActionsState() {
  const { status, isAuthenticated, isAuthReady, user, logout } = useAuth();
  const shouldShowAuthenticatedActions = isAuthReady && isAuthenticated;

  return {
    user,
    logout,
    isAuthenticated: shouldShowAuthenticatedActions,
    isAuthReady,
    isAuthLoading: !isAuthReady,
    shouldShowGuestActions: isAuthReady && !shouldShowAuthenticatedActions,
    shouldShowAuthenticatedActions,
    isAuthUnavailable: status === 'error',
  };
}
