'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@e-pharmacy/auth/react';

import { getAdminProductRequestStatistics } from '@/lib/api/browser/admin-product-requests.api';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { canAdmin } from '@/lib/permissions/can-admin';
import { subscribeToProductRequestNavigationRefresh } from '@/lib/product-requests/product-request-navigation-refresh';

import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

//===============================================================

export type ProductRequestNavigationCounts = Readonly<{
  new: number;
  onModeration: number;
}>;

type Snapshot = Readonly<{
  userId: string;
  counts: ProductRequestNavigationCounts | null;
}>;

//===============================================================

const ProductRequestNavigationBadgeContext = createContext<
  ProductRequestNavigationCounts | null | undefined
>(undefined);

//===============================================================

export function AdminProductRequestNavigationBadgeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { access } = useAdminAuthorization();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const canView = canAdmin(access, ADMIN_PERMISSIONS.productRequests.view);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!canView || !userId) return;

    let version = 0;
    let active: AbortController | null = null;

    const refresh = async () => {
      const currentVersion = ++version;

      active?.abort();

      const controller = new AbortController();

      active = controller;

      try {
        const stats = await getAdminProductRequestStatistics({
          signal: controller.signal,
        });

        if (controller.signal.aborted || currentVersion !== version) return;

        setSnapshot({
          userId,
          counts: { new: stats.new, onModeration: stats.on_moderation },
        });
      } catch {
        if (controller.signal.aborted || currentVersion !== version) return;

        // Do not present unavailable or forbidden counts as zero.
        setSnapshot({ userId, counts: null });
      } finally {
        if (active === controller) active = null;
      }
    };

    const onFocus = () => {
      if (!active) void refresh();
    };

    void refresh();

    const unsubscribe = subscribeToProductRequestNavigationRefresh(() => {
      void refresh();
    });

    window.addEventListener('focus', onFocus);

    return () => {
      version += 1;
      active?.abort();
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [canView, userId]);

  const counts =
    canView && userId && snapshot?.userId === userId ? snapshot.counts : null;

  return (
    <ProductRequestNavigationBadgeContext.Provider value={counts}>
      {children}
    </ProductRequestNavigationBadgeContext.Provider>
  );
}

//===============================================================

export function useAdminProductRequestNavigationBadges(): ProductRequestNavigationCounts | null {
  const counts = useContext(ProductRequestNavigationBadgeContext);

  if (counts === undefined) {
    throw new Error(
      'useAdminProductRequestNavigationBadges requires AdminProductRequestNavigationBadgeProvider.'
    );
  }

  return counts;
}
