'use client';

import { useCallback, useRef, useState } from 'react';

import { ADMIN_ROUTES } from '@/lib/routes';

import { runAdminLogoutLifecycle } from './admin-logout-lifecycle';

//===================================================================

export function useAdminLogoutController(
  logout: () => Promise<void>
): Readonly<{
  isLogoutPending: boolean;
  logoutFromAdmin: (onSettled?: () => void) => Promise<void>;
}> {
  const logoutLockRef = useRef(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);

  const logoutFromAdmin = useCallback(
    async (onSettled?: () => void) => {
      await runAdminLogoutLifecycle({
        lock: logoutLockRef,
        logout,
        setPending: setIsLogoutPending,
        onSettled,
        navigateToLogin: () => window.location.replace(ADMIN_ROUTES.LOGIN),
      });
    },
    [logout]
  );

  return {
    isLogoutPending,
    logoutFromAdmin,
  };
}
