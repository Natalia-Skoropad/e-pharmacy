'use client';

import { useCallback, useRef, useState } from 'react';

import { getSharedLoginUrl } from '@/lib/auth/shared-auth';

import { runPharmacyLogoutLifecycle } from './pharmacy-logout-lifecycle';

//===================================================================

export function usePharmacyLogoutController(
  logout: () => Promise<void>
): Readonly<{
  isLogoutPending: boolean;
  logoutFromPharmacy: (onSettled?: () => void) => Promise<void>;
}> {
  const logoutLockRef = useRef(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);

  const logoutFromPharmacy = useCallback(
    async (onSettled?: () => void) => {
      await runPharmacyLogoutLifecycle({
        lock: logoutLockRef,
        logout,
        setPending: setIsLogoutPending,
        onSettled,
        navigateToLogin: () => window.location.replace(getSharedLoginUrl()),
      });
    },
    [logout]
  );

  return {
    isLogoutPending,
    logoutFromPharmacy,
  };
}
