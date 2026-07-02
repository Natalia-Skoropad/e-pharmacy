'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  StatusBanner,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

import { getPharmacyOrders } from '@/lib/api/browser';
import { buildOrdersPath } from '@/lib/orders/order-paths';

import type {
  PharmacyOrdersQueryParams,
  PharmacyOrderRow,
} from '@/lib/orders/orders';

import { OrdersFiltersDrawer } from '@/components/orders/OrdersFiltersDrawer';
import { OrdersTable } from '@/components/orders/OrdersTable';

import css from './OrdersPageContent.module.css';

//===================================================================

type DeliveryMethodFilter = 'all' | DeliveryMethod;
type PaymentMethodFilter = 'all' | PaymentMethod;
type OrderStatusFilter = 'all' | OrderStatus;

//===================================================================

export type OrdersFilterState = Readonly<{
  date: {
    from: string;
    to: string;
  };
  client: string;
  orderNumber: string;
  deliveryMethod: DeliveryMethodFilter;
  paymentMethod: PaymentMethodFilter;
  status: OrderStatusFilter;
}>;

//===================================================================

const DEFAULT_FILTERS: OrdersFilterState = {
  date: {
    from: '',
    to: '',
  },
  client: '',
  orderNumber: '',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  status: 'all',
};

//===================================================================

function getActiveFiltersCount(filters: OrdersFilterState): number {
  return [
    filters.date.from || filters.date.to,
    filters.client.trim(),
    filters.orderNumber.trim(),
    filters.deliveryMethod !== 'all',
    filters.paymentMethod !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;
}

//===================================================================

function getOrdersQueryParams(
  filters: OrdersFilterState,
  rowsPerPage: RowsPerPageValue
): PharmacyOrdersQueryParams {
  return {
    page: 1,
    perPage: rowsPerPage,
    dateFrom: filters.date.from || undefined,
    dateTo: filters.date.to || undefined,
    client: filters.client.trim() || undefined,
    orderNumber: filters.orderNumber.trim() || undefined,
    deliveryMethod:
      filters.deliveryMethod === 'all' ? undefined : filters.deliveryMethod,
    paymentMethod:
      filters.paymentMethod === 'all' ? undefined : filters.paymentMethod,
    status: filters.status === 'all' ? undefined : filters.status,
  };
}

//===================================================================

type OrdersPageContentProps = Readonly<{
  initialFilters?: OrdersFilterState;
}>;

//===================================================================

function OrdersPageContent({
  initialFilters = DEFAULT_FILTERS,
}: OrdersPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<OrdersFilterState>(initialFilters);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useBodyScrollLock(isFiltersOpen);

  useEscapeToClose({
    isOpen: isFiltersOpen,
    onClose: () => setIsFiltersOpen(false),
  });

  const handleBackdropClick = useBackdropClick({
    onClose: () => setIsFiltersOpen(false),
  });

  const queryParams = useMemo(
    () => getOrdersQueryParams(filters, rowsPerPage),
    [filters, rowsPerPage]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);

      try {
        const response = await getPharmacyOrders(queryParams);
        if (!isMounted) return;

        setOrders(response.items);
        setTotalOrders(response.total);
      } catch {
        if (!isMounted) return;

        setOrders([]);
        setTotalOrders(0);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  useEffect(() => {
    const nextPath = buildOrdersPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="orders-page-title">
      <div className={css.card}>
        <PageHeader
          title="Orders"
          titleId="orders-page-title"
          icon={<ShoppingBag size={23} aria-hidden="true" />}
          actions={
            <CountLabel
              shown={orders.length}
              total={totalOrders}
              label="orders"
            />
          }
        />
        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Verification is required"
            message="New pharmacies do not receive orders until Admin verifies the pharmacy profile."
          />

          <div className={css.toolbar}>
            <div className={css.toolbarActions}>
              <RowsPerPageSelect
                id="orders-rows-per-page"
                value={rowsPerPage}
                onChange={setRowsPerPage}
              />

              <FiltersButton
                activeCount={activeFiltersCount}
                controlsId="orders-filters-panel"
                isExpanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen(true)}
              />
            </div>
          </div>

          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            emptyMessage={
              hasActiveFilters
                ? 'No orders found for the selected filters. Adjust filters or reset them.'
                : 'Orders will appear here after the pharmacy is verified and clients place orders.'
            }
          />
        </div>
      </div>

      {isFiltersOpen ? (
        <OrdersFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onBackdropMouseDown={handleBackdropClick}
          onChange={setFilters}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </main>
  );
}

export default OrdersPageContent;
export { OrdersPageContent };
