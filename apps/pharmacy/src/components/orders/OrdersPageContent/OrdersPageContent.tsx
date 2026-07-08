'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { OrderStatistics, StatusBanner } from '@e-pharmacy/ui/statistics';

import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import { DEFAULT_ORDER_STATISTICS } from '@e-pharmacy/types/orders';

import { getPharmacyOrders } from '@/lib/api/browser';
import { getPharmacyOrdersFilterPath } from '@/lib/layout/routes';
import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';
import { buildOrdersPath } from '@/lib/orders/order-paths';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from '@/lib/orders/orders-filters';

import type {
  PharmacyOrdersQueryParams,
  PharmacyOrderRow,
} from '@/lib/orders/orders';

import { OrdersFiltersDrawer } from '@/components/orders/OrdersFiltersDrawer';
import { OrdersTable } from '@/components/orders/OrdersTable';

import css from './OrdersPageContent.module.css';

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
  initialFilters = DEFAULT_ORDERS_FILTERS,
}: OrdersPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<OrdersFilterState>(initialFilters);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderStatistics, setOrderStatistics] = useState(
    DEFAULT_ORDER_STATISTICS
  );
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
        setOrderStatistics(response.statistics);
      } catch {
        if (!isMounted) return;

        setOrders([]);
        setTotalOrders(0);
        setOrderStatistics(DEFAULT_ORDER_STATISTICS);
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

  const handleFiltersChange = (nextFilters: OrdersFilterState) => {
    setFilters(nextFilters);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_ORDERS_FILTERS);
  };

  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = getLockedFeatureBannerLabel(bannerStatus);

  return (
    <main className={css.page} aria-labelledby="orders-page-title">
      <section className={css.card} aria-labelledby="orders-page-title">
        <PageHeader
          title="Orders"
          titleId="orders-page-title"
          icon={<ShoppingBag size={23} aria-hidden="true" />}
        />

        <StatusBanner
          status={bannerStatus}
          label={bannerLabel}
          title="Verification is required"
          message={
            bannerStatus === 'on_verification'
              ? 'Orders stay locked while Admin reviews the submitted pharmacy profile.'
              : 'New pharmacies do not receive orders until Admin verifies the pharmacy profile.'
          }
        />

        <OrderStatistics
          counts={orderStatistics}
          getStatusHref={(status) => getPharmacyOrdersFilterPath({ status })}
          className={css.orderStatistics}
        />
      </section>

      <section className={css.card} aria-labelledby="orders-search-title">
        <h2 className={css.visuallyHidden} id="orders-search-title">
          Orders search
        </h2>

        <div className={css.searchGrid}>
          <SearchInput
            id="orders-number-search"
            label="Order number search"
            value={filters.orderNumber}
            placeholder="Order number"
            isActive={Boolean(filters.orderNumber)}
            onChange={(orderNumber) =>
              handleFiltersChange({ ...filters, orderNumber })
            }
          />

          <SearchInput
            id="orders-client-search"
            label="Client name search"
            value={filters.client}
            placeholder="Client name"
            isActive={Boolean(filters.client)}
            onChange={(client) => handleFiltersChange({ ...filters, client })}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="orders-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Orders table">
        <div className={css.toolbar}>
          <CountLabel
            className={css.countLabel}
            shown={orders.length}
            total={totalOrders}
            label="orders"
          />

          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="orders-rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
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
      </section>

      {isFiltersOpen ? (
        <OrdersFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onBackdropMouseDown={handleBackdropClick}
          onChange={handleFiltersChange}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </main>
  );
}

export default OrdersPageContent;
export { OrdersPageContent };
