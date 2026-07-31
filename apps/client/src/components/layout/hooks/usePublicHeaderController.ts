'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@e-pharmacy/ui/feedback';

import { getPharmacyDashboardUrl } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

import { runPublicLogoutLifecycle } from './public-logout-lifecycle';
import { usePublicAuthActionsState } from './usePublicAuthActionsState';

//===================================================================

export function usePublicHeaderController() {
  const router = useRouter();
  const toast = useToast();
  const authState = usePublicAuthActionsState();
  const logoutLockRef = useRef(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);

  const isClientMode = authState.mode === 'authenticated-client';
  const isPharmacyMode = authState.mode === 'authenticated-pharmacy';

  const pharmacyDashboardUrl = isPharmacyMode
    ? getPharmacyDashboardUrl()
    : null;

  const logout = async (onSettled?: () => void): Promise<void> => {
    if (!('logout' in authState)) return;

    await runPublicLogoutLifecycle({
      lock: logoutLockRef,
      logout: authState.logout,
      setPending: setIsLogoutPending,
      onSettled,
      navigateHome: () => router.replace(ROUTES.HOME),
      reportRemoteFailure: () =>
        toast.info(
          'You are signed out. Refresh other open tabs if they still show your account.'
        ),
    });
  };

  return {
    authState,
    isClientMode,
    isPharmacyMode,
    pharmacyDashboardUrl,
    isLogoutPending,
    logout,
  } as const;
}
