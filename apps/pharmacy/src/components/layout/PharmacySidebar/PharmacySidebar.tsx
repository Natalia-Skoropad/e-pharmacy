'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CabinetSidebar } from '@e-pharmacy/ui/cabinet';
import { isApiError } from '@e-pharmacy/api-client/transport';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getPharmacyOrders } from '@/lib/api/browser/orders.api';
import { getOwnedPharmacyStatistics } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { subscribeToPharmacyCounterRefresh } from '@/lib/pharmacies/pharmacy-counter-refresh';
import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';
import { subscribeToOrderCounterRefresh } from '@/lib/orders/order-counter-refresh';

import {
  INITIAL_ORDER_COUNTER_STATE,
  createReadyOrderCounterState,
  createUnavailableOrderCounterState,
  getVisibleOrderCounts,
  type OrderCounterState,
} from '@/lib/orders/order-counter-state';

import {
  formatVisibleOrderCount,
  getCollapsedOrderNotificationLabel,
  getOrderCountAriaLabel,
  hasOrderNotifications,
} from './order-counter-presentation';

import css from './PharmacySidebar.module.css';

//===================================================================

type PharmacySidebarProps = Readonly<{
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}>;

//===================================================================

export function PharmacySidebar({
  isCollapsed,
  onToggleCollapsed,
}: PharmacySidebarProps) {
  const pathname = usePathname();

  const [orderCounterState, setOrderCounterState] = useState<OrderCounterState>(
    INITIAL_ORDER_COUNTER_STATE
  );

  const orderCounts = getVisibleOrderCounts(orderCounterState);

  const [pharmacyCounts, setPharmacyCounts] = useState<null | {
    new: number;
    onVerification: number;
    onModeration: number;
    onReactivation: number;
  }>(null);

  useEffect(() => {
    let requestVersion = 0;
    let activeController: AbortController | null = null;
    let needsPharmacySelection = false;

    const loadOrderCounts = async () => {
      requestVersion += 1;

      const currentVersion = requestVersion;

      activeController?.abort();

      const controller = new AbortController();

      activeController = controller;

      try {
        const requestOptions = { signal: controller.signal };

        const [newOrders, inProgressOrders] = await Promise.all([
          getPharmacyOrders(
            { page: 1, perPage: 1, status: 'new' },
            requestOptions
          ),

          getPharmacyOrders(
            { page: 1, perPage: 1, status: 'in_progress' },
            requestOptions
          ),
        ]);

        if (controller.signal.aborted || currentVersion !== requestVersion) {
          return;
        }

        setOrderCounterState(
          createReadyOrderCounterState({
            new: newOrders.total,
            inProgress: inProgressOrders.total,
          })
        );
      } catch (error) {
        if (controller.signal.aborted || currentVersion !== requestVersion) {
          return;
        }

        // A multi-pharmacy owner must explicitly select a pharmacy for the
        // legacy /orders endpoint. Repeating its 409 on every focus only adds
        // auth and database traffic without ever producing badge counts.
        needsPharmacySelection = Boolean(
          isApiError(error) &&
          error.httpStatus === 409 &&
          error.code === 'PHARMACY_SELECTION_REQUIRED'
        );

        setOrderCounterState(createUnavailableOrderCounterState());
      } finally {
        if (activeController === controller) activeController = null;
      }
    };

    const handleFocus = () => {
      if (needsPharmacySelection || activeController) return;

      void loadOrderCounts();
    };

    void loadOrderCounts();

    const unsubscribeRefresh = subscribeToOrderCounterRefresh(() => {
      needsPharmacySelection = false;

      void loadOrderCounts();
    });

    window.addEventListener('focus', handleFocus);

    return () => {
      requestVersion += 1;
      activeController?.abort();
      unsubscribeRefresh();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    let generation = 0;
    let activeController: AbortController | null = null;

    const refresh = async () => {
      const version = ++generation;

      activeController?.abort();

      const controller = new AbortController();

      activeController = controller;

      try {
        const stats = await getOwnedPharmacyStatistics({
          signal: controller.signal,
        });

        if (controller.signal.aborted || generation !== version) return;

        setPharmacyCounts({
          new: stats.new,
          onVerification: stats.onVerification,
          onModeration: stats.onModeration,
          onReactivation: stats.onReactivation,
        });
      } catch {
        if (!controller.signal.aborted && generation === version) {
          setPharmacyCounts(null);
        }
      } finally {
        if (activeController === controller) activeController = null;
      }
    };

    const onFocus = () => {
      if (activeController) return;

      void refresh();
    };

    void refresh();

    const unsubscribe = subscribeToPharmacyCounterRefresh(onFocus);

    window.addEventListener('focus', onFocus);

    return () => {
      generation += 1;
      activeController?.abort();
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <CabinetSidebar
      className={css.sidebar}
      items={PHARMACY_NAVIGATION}
      activePath={pathname}
      ariaLabel="Pharmacy navigation"
      logoHref={PHARMACY_ROUTES.DASHBOARD}
      logoLabel="E-PHARMACY"
      logoAriaLabel="E-PHARMACY pharmacy dashboard"
      isCollapsed={isCollapsed}
      collapseLabel="Collapse pharmacy menu"
      expandLabel="Expand pharmacy menu"
      onToggleCollapsed={onToggleCollapsed}
      renderLogoLink={({ href, className, children, ...props }) => (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      )}
      renderLink={({ item, href, className, children, ...props }) => {
        const isOrdersLink = item.href === PHARMACY_ROUTES.ORDERS;
        const isPharmaciesLink = item.href === PHARMACY_ROUTES.PHARMACIES;

        const showPharmacyCounters = Boolean(
          isPharmaciesLink &&
          pharmacyCounts &&
          (pharmacyCounts.new ||
            pharmacyCounts.onVerification ||
            pharmacyCounts.onModeration ||
            pharmacyCounts.onReactivation)
        );

        const hasNotifications = Boolean(
          isOrdersLink && orderCounts && hasOrderNotifications(orderCounts)
        );

        return (
          <Link
            href={href}
            className={
              isOrdersLink || isPharmaciesLink
                ? `${className} ${css.ordersLink}`
                : className
            }
            {...props}
          >
            {children}

            {!isCollapsed && hasNotifications && orderCounts ? (
              <span className={css.orderCounters}>
                {orderCounts.new > 0 ? (
                  <span
                    className={css.newCounter}
                    aria-label={getOrderCountAriaLabel(orderCounts.new, 'new')}
                  >
                    {formatVisibleOrderCount(orderCounts.new)}
                  </span>
                ) : null}

                {orderCounts.inProgress > 0 ? (
                  <span
                    className={css.progressCounter}
                    aria-label={getOrderCountAriaLabel(
                      orderCounts.inProgress,
                      'in_progress'
                    )}
                  >
                    {formatVisibleOrderCount(orderCounts.inProgress)}
                  </span>
                ) : null}
              </span>
            ) : null}

            {!isCollapsed && showPharmacyCounters && pharmacyCounts ? (
              <span
                className={css.orderCounters}
                aria-label="Pharmacy status totals"
              >
                {pharmacyCounts.new > 0 ? (
                  <span
                    className={css.newCounter}
                    aria-label={`${pharmacyCounts.new} new pharmacies`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.new)}
                  </span>
                ) : null}
                {pharmacyCounts.onVerification > 0 ? (
                  <span
                    className={css.verificationCounter}
                    aria-label={`${pharmacyCounts.onVerification} pharmacies on verification`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.onVerification)}
                  </span>
                ) : null}
                {pharmacyCounts.onModeration > 0 ? (
                  <span
                    className={css.moderationCounter}
                    aria-label={`${pharmacyCounts.onModeration} pharmacies on moderation`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.onModeration)}
                  </span>
                ) : null}
                {pharmacyCounts.onReactivation > 0 ? (
                  <span
                    className={css.reactivationCounter}
                    aria-label={`${pharmacyCounts.onReactivation} pharmacies awaiting reactivation`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.onReactivation)}
                  </span>
                ) : null}
              </span>
            ) : null}
            {isCollapsed && showPharmacyCounters && pharmacyCounts ? (
              <span
                className={css.collapsedCounter}
                aria-label={`${pharmacyCounts.new} new, ${pharmacyCounts.onVerification} on verification, ${pharmacyCounts.onModeration} on moderation, ${pharmacyCounts.onReactivation} awaiting reactivation`}
              />
            ) : null}

            {isCollapsed && hasNotifications && orderCounts ? (
              <span
                className={css.collapsedCounter}
                aria-label={getCollapsedOrderNotificationLabel(orderCounts)}
              />
            ) : null}
          </Link>
        );
      }}
    />
  );
}
