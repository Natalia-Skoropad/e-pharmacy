'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CabinetSidebar } from '@e-pharmacy/ui/cabinet';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getPharmacyOrders } from '@/lib/api/browser/orders.api';
import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';
import { subscribeToOrderCounterRefresh } from '@/lib/orders/order-counter-refresh';

import {
  INITIAL_ORDER_COUNTER_STATE,
  createReadyOrderCounterState,
  createUnavailableOrderCounterState,
  getVisibleOrderCounts,
  type OrderCounterState,
} from '@/lib/orders/order-counter-state';

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

  useEffect(() => {
    let requestVersion = 0;
    let activeController: AbortController | null = null;

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
      } catch {
        if (controller.signal.aborted || currentVersion !== requestVersion) {
          return;
        }

        setOrderCounterState(createUnavailableOrderCounterState());
      }
    };

    const handleFocus = () => {
      void loadOrderCounts();
    };

    void loadOrderCounts();

    const unsubscribeRefresh = subscribeToOrderCounterRefresh(() => {
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
      renderLink={({ item, href, className, children, ...props }) => (
        <Link href={href} className={className} {...props}>
          {children}
          {!isCollapsed &&
          orderCounts &&
          item.href === PHARMACY_ROUTES.ORDERS &&
          (orderCounts.new > 0 || orderCounts.inProgress > 0) ? (
            <span
              className={css.orderCounters}
              aria-label="Order notifications"
            >
              {orderCounts.new > 0 ? (
                <span className={css.newCounter} title="New orders">
                  {orderCounts.new}
                </span>
              ) : null}
              {orderCounts.inProgress > 0 ? (
                <span
                  className={css.progressCounter}
                  title="Orders in progress"
                >
                  {orderCounts.inProgress}
                </span>
              ) : null}
            </span>
          ) : null}
        </Link>
      )}
    />
  );
}
