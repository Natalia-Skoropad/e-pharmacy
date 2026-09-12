'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@e-pharmacy/ui/feedback';
import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';

import { getCurrentPharmacySummary } from '@/lib/api/browser';
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

  const [pharmacySummaryState, setPharmacySummaryState] = useState<Readonly<{
    userId: string;
    pharmacy: CurrentPharmacySummary;
  }> | null>(null);

  const isClientMode = authState.mode === 'authenticated-client';
  const isPharmacyMode = authState.mode === 'authenticated-pharmacy';

  const pharmacyDashboardUrl = isPharmacyMode
    ? getPharmacyDashboardUrl()
    : null;

  const pharmacyUserId = isPharmacyMode ? authState.user.id : null;
  const pharmacySummary =
    pharmacyUserId && pharmacySummaryState?.userId === pharmacyUserId
      ? pharmacySummaryState.pharmacy
      : null;

  useEffect(() => {
    if (!pharmacyUserId) return;

    const controller = new AbortController();

    void getCurrentPharmacySummary({ signal: controller.signal })
      .then(({ pharmacy }) => {
        if (!controller.signal.aborted) {
          setPharmacySummaryState({ userId: pharmacyUserId, pharmacy });
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [pharmacyUserId]);

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
    pharmacySummary,
    isLogoutPending,
    logout,
  } as const;
}
