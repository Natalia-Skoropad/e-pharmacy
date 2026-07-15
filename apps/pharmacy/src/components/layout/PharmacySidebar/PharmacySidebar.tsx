'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CabinetSidebar } from '@e-pharmacy/ui/layout';

import { getPharmacyOrders } from '@/lib/api/browser';
import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';

import {
  getPharmacyDashboardPath,
  getPharmacyOrdersPath,
} from '@/lib/layout/routes';

import css from './PharmacySidebar.module.css';

//===================================================================

type PharmacySidebarProps = Readonly<{
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}>;

type OrderMenuCounts = Readonly<{
  new: number;
  inProgress: number;
}>;

//===================================================================

export function PharmacySidebar({
  isCollapsed,
  onToggleCollapsed,
}: PharmacySidebarProps) {
  const pathname = usePathname();
  const [orderCounts, setOrderCounts] = useState<OrderMenuCounts>({
    new: 0,
    inProgress: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOrderCounts() {
      try {
        const [newOrders, inProgressOrders] = await Promise.all([
          getPharmacyOrders({ page: 1, perPage: 1, status: 'new' }),
          getPharmacyOrders({ page: 1, perPage: 1, status: 'in_progress' }),
        ]);

        if (isMounted) {
          setOrderCounts({
            new: newOrders.total,
            inProgress: inProgressOrders.total,
          });
        }
      } catch {
        // Navigation must stay usable when counters cannot be loaded.
      }
    }

    void loadOrderCounts();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <CabinetSidebar
      className={css.sidebar}
      items={PHARMACY_NAVIGATION}
      activePath={pathname}
      ariaLabel="Pharmacy navigation"
      logoHref={getPharmacyDashboardPath()}
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
          {!isCollapsed && item.href === getPharmacyOrdersPath() ? (
            <span
              className={css.orderCounters}
              aria-label="Order notifications"
            >
              <span className={css.newCounter} title="New orders">
                {orderCounts.new}
              </span>
              <span className={css.progressCounter} title="Orders in progress">
                {orderCounts.inProgress}
              </span>
            </span>
          ) : null}
        </Link>
      )}
    />
  );
}
