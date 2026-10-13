'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { AdminPharmacyStatistics } from '@e-pharmacy/types/admin';

import { getAdminPharmacySummary } from '@/lib/api/browser/admin-pharmacy-registry.api';
import { subscribeToPharmacyModerationRefresh } from '@/lib/pharmacies/pharmacy-moderation-refresh';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { canAdmin } from '@/lib/permissions/can-admin';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

//===================================================================

export type PharmacyNavigationCounts = Readonly<{
  new: number;
  onVerification: number;
  onModeration: number;
}>;

type PharmacyNavigationBadgeState = Readonly<{
  canView: boolean;
  refreshVersion: number;
  counts: PharmacyNavigationCounts | null;
}>;

const PharmacyNavigationBadgeContext = createContext<
  PharmacyNavigationCounts | null | undefined
>(undefined);

//===================================================================

function toNavigationCounts(
  summary: AdminPharmacyStatistics
): PharmacyNavigationCounts {
  return {
    new: summary.new,
    onVerification: summary.onVerification,
    onModeration: summary.onModeration,
  };
}

//===================================================================

export function AdminPharmacyNavigationBadgeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { access } = useAdminAuthorization();
  const canView = canAdmin(access, ADMIN_PERMISSIONS.pharmacies.view);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestVersionRef = useRef(0);

  const [state, setState] = useState<PharmacyNavigationBadgeState>({
    canView: false,
    refreshVersion: 0,
    counts: null,
  });

  useEffect(() => {
    const refresh = () => setRefreshVersion((current) => current + 1);
    const unsubscribe = subscribeToPharmacyModerationRefresh(refresh);

    window.addEventListener('focus', refresh);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    requestVersionRef.current += 1;
    const requestVersion = requestVersionRef.current;

    if (!canView) return;

    const controller = new AbortController();

    void getAdminPharmacySummary({ signal: controller.signal })
      .then((summary) => {
        if (
          controller.signal.aborted ||
          requestVersionRef.current !== requestVersion
        )
          return;

        setState({
          canView,
          refreshVersion,
          counts: toNavigationCounts(summary),
        });
      })

      .catch(() => {
        if (
          controller.signal.aborted ||
          requestVersionRef.current !== requestVersion
        )
          return;

        // Unavailable or forbidden metrics must not appear as actual zeros.
        setState({ canView, refreshVersion, counts: null });
      });

    return () => controller.abort();
  }, [canView, refreshVersion]);

  const counts = useMemo(
    () =>
      canView &&
      state.canView === canView &&
      state.refreshVersion === refreshVersion
        ? state.counts
        : null,
    [canView, refreshVersion, state]
  );

  return (
    <PharmacyNavigationBadgeContext.Provider value={counts}>
      {children}
    </PharmacyNavigationBadgeContext.Provider>
  );
}

//===================================================================

export function useAdminPharmacyNavigationBadges(): PharmacyNavigationCounts | null {
  const counts = useContext(PharmacyNavigationBadgeContext);

  if (counts === undefined) {
    throw new Error(
      'useAdminPharmacyNavigationBadges requires AdminPharmacyNavigationBadgeProvider.'
    );
  }

  return counts;
}
