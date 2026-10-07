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

import { getAdminPharmacyOwnerSummary } from '@/lib/api/browser/admin-pharmacy-owners.api';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { canAdmin } from '@/lib/permissions/can-admin';

import { subscribeToPharmacyOwnerNavigationBadgeRefresh } from '@/lib/pharmacy-owners/pharmacy-owner-navigation-badge-refresh';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

//===================================================================

type AdminPharmacyOwnerNavigationBadgeContextValue = Readonly<{
  newOwnerCount: number | null;
}>;

type BadgeState = Readonly<{
  canViewOwners: boolean;
  refreshVersion: number;
  newOwnerCount: number | null;
}>;

//===================================================================

const AdminPharmacyOwnerNavigationBadgeContext =
  createContext<AdminPharmacyOwnerNavigationBadgeContextValue | null>(null);

//===================================================================

type AdminPharmacyOwnerNavigationBadgeProviderProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export function AdminPharmacyOwnerNavigationBadgeProvider({
  children,
}: AdminPharmacyOwnerNavigationBadgeProviderProps) {
  const { access } = useAdminAuthorization();
  const canViewOwners = canAdmin(access, ADMIN_PERMISSIONS.pharmacyOwners.view);

  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestVersionRef = useRef(0);

  const [state, setState] = useState<BadgeState>({
    canViewOwners: false,
    refreshVersion: 0,
    newOwnerCount: null,
  });

  useEffect(() => {
    const requestRefresh = () => {
      setRefreshVersion((version) => version + 1);
    };

    const unsubscribe =
      subscribeToPharmacyOwnerNavigationBadgeRefresh(requestRefresh);

    window.addEventListener('focus', requestRefresh);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', requestRefresh);
    };
  }, []);

  useEffect(() => {
    requestVersionRef.current += 1;
    const requestVersion = requestVersionRef.current;

    if (!canViewOwners) return;

    const controller = new AbortController();

    void getAdminPharmacyOwnerSummary({ signal: controller.signal })
      .then((summary) => {
        if (
          controller.signal.aborted ||
          requestVersionRef.current !== requestVersion
        ) {
          return;
        }

        setState({
          canViewOwners,
          refreshVersion,
          newOwnerCount: summary.new,
        });
      })

      .catch(() => {
        if (
          controller.signal.aborted ||
          requestVersionRef.current !== requestVersion
        ) {
          return;
        }

        // A failed summary request must never masquerade as a real zero count.
        setState({
          canViewOwners,
          refreshVersion,
          newOwnerCount: null,
        });
      });

    return () => controller.abort();
  }, [canViewOwners, refreshVersion]);

  const value = useMemo<AdminPharmacyOwnerNavigationBadgeContextValue>(
    () => ({
      newOwnerCount:
        canViewOwners &&
        state.canViewOwners === canViewOwners &&
        state.refreshVersion === refreshVersion
          ? state.newOwnerCount
          : null,
    }),
    [canViewOwners, refreshVersion, state]
  );

  return (
    <AdminPharmacyOwnerNavigationBadgeContext.Provider value={value}>
      {children}
    </AdminPharmacyOwnerNavigationBadgeContext.Provider>
  );
}

//===================================================================

export function useAdminPharmacyOwnerNavigationBadge(): AdminPharmacyOwnerNavigationBadgeContextValue {
  const context = useContext(AdminPharmacyOwnerNavigationBadgeContext);

  if (!context) {
    throw new Error(
      'useAdminPharmacyOwnerNavigationBadge must be used inside AdminPharmacyOwnerNavigationBadgeProvider.'
    );
  }

  return context;
}
