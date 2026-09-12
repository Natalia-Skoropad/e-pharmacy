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
      renderLink={({ item, href, className, children, ...props }) => {
        const isOrdersLink = item.href === PHARMACY_ROUTES.ORDERS;
        const hasNotifications = Boolean(
          isOrdersLink && orderCounts && hasOrderNotifications(orderCounts)
        );

        return (
          <Link
            href={href}
            className={
              isOrdersLink ? `${className} ${css.ordersLink}` : className
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
