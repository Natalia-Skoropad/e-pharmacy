'use client';

import { useAuth } from '@e-pharmacy/auth/react';

//===================================================================

export function useClientAuthCapabilities() {
  const auth = useAuth();
  const isActiveUser = auth.user?.status === 'active';
  const isClient = auth.user?.role === 'client' && isActiveUser;
  const isPharmacy = auth.user?.role === 'pharmacy' && isActiveUser;

  return {
    ...auth,
    isClient,
    isPharmacy,
    canUseClientFeatures:
      auth.isAuthReady && auth.isAuthenticated && isClient,
    canOpenPharmacyCabinet:
      auth.isAuthReady && auth.isAuthenticated && isPharmacy,
  };
}
