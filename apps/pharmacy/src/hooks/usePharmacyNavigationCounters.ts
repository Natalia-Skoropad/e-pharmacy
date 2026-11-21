'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { useAuth } from '@e-pharmacy/auth/react';

import { getPharmacyOrders } from '@/lib/api/browser/orders.api';
import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';
import { subscribeToOrderCounterRefresh } from '@/lib/orders/order-counter-refresh';
import { parseOrdersSegments } from '@/lib/orders/order-paths';

import {
  INITIAL_ORDER_COUNTER_STATE,
  createReadyOrderCounterState,
  createUnavailableOrderCounterState,
  getVisibleOrderCounts,
  type OrderCounterState,
} from '@/lib/orders/order-counter-state';

import { isOwnerOrdersListPath } from '@/lib/pharmacies/selected-pharmacy-scope';
import { subscribeToProductRequestCounterRefresh } from '@/lib/product-requests/product-request-counter-refresh';

//===================================================================

export function useOrderNavigationCounts(enabled = true) {
  const pathname = usePathname();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  // The Orders registry may explicitly narrow its counts to one pharmacy.
  // Outside that registry, navigation shows totals for the entire owner.
  const orderScopePharmacyId = isOwnerOrdersListPath(pathname)
    ? parseOrdersSegments({ filters: pathname.split('/').slice(3) }).pharmacyId
    : '';

  const orderCounterScopeKey = `${currentUserId ?? ''}:${orderScopePharmacyId}`;

  const [orderCounterState, setOrderCounterState] = useState<{
    scopeKey: string;
    value: OrderCounterState;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !currentUserId) return;

    let requestVersion = 0;
    let activeController: AbortController | null = null;

    const loadOrderCounts = async () => {
      const currentVersion = ++requestVersion;

      activeController?.abort();

      const controller = new AbortController();

      activeController = controller;

      try {
        const response = await getPharmacyOrders(
          {
            scope: 'owner' as const,

            ...(orderScopePharmacyId
              ? { pharmacyId: orderScopePharmacyId }
              : {}),

            page: 1,
            perPage: 1,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted || currentVersion !== requestVersion) {
          return;
        }

        setOrderCounterState({
          scopeKey: orderCounterScopeKey,

          value: createReadyOrderCounterState({
            new: response.statistics.new.count,
            inProgress: response.statistics.in_progress.count,
          }),
        });
      } catch {
        if (controller.signal.aborted || currentVersion !== requestVersion) {
          return;
        }

        setOrderCounterState({
          scopeKey: orderCounterScopeKey,
          value: createUnavailableOrderCounterState(),
        });
      } finally {
        if (activeController === controller) activeController = null;
      }
    };

    const onFocus = () => {
      if (!activeController) void loadOrderCounts();
    };

    void loadOrderCounts();

    const unsubscribe = subscribeToOrderCounterRefresh(() => {
      void loadOrderCounts();
    });

    window.addEventListener('focus', onFocus);

    return () => {
      requestVersion += 1;
      activeController?.abort();
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, currentUserId, orderCounterScopeKey, orderScopePharmacyId]);

  return getVisibleOrderCounts(
    enabled && orderCounterState?.scopeKey === orderCounterScopeKey
      ? orderCounterState.value
      : INITIAL_ORDER_COUNTER_STATE
  );
}

//===================================================================

export type ProductRequestNavigationCounts = Readonly<{
  draft: number;
  new: number;
  inProgress: number;
}>;

//===================================================================

export function useProductRequestNavigationCounts(
  enabled = true
): ProductRequestNavigationCounts | null {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  const [snapshot, setSnapshot] = useState<{
    ownerId: string;
    counts: ProductRequestNavigationCounts | null;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !ownerId) return;

    let version = 0;
    let controller: AbortController | null = null;

    const refresh = async () => {
      const currentVersion = ++version;

      controller?.abort();

      const active = new AbortController();

      controller = active;

      try {
        const stats = await getPharmacyProductRequestStatistics({
          signal: active.signal,
        });

        if (active.signal.aborted || currentVersion !== version) return;

        setSnapshot({
          ownerId,

          counts: {
            draft: stats.draft,
            new: stats.new,
            inProgress: stats.in_progress,
          },
        });
      } catch {
        // Unavailable data must never be displayed as zero status counts.
        if (!active.signal.aborted && currentVersion === version) {
          setSnapshot({ ownerId, counts: null });
        }
      } finally {
        if (controller === active) controller = null;
      }
    };

    const onFocus = () => {
      if (!controller) void refresh();
    };

    void refresh();

    const unsubscribe = subscribeToProductRequestCounterRefresh(() => {
      void refresh();
    });

    window.addEventListener('focus', onFocus);

    return () => {
      version += 1;
      controller?.abort();
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, ownerId]);

  return enabled && ownerId && snapshot?.ownerId === ownerId
    ? snapshot.counts
    : null;
}
