'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { PageHeader } from '@e-pharmacy/ui/layout';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getPharmacyOrders } from '@/lib/api/browser';
import { getPharmacyOrdersFilterPath } from '@/lib/layout/routes';

import {
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import { buildOrdersPath } from '@/lib/orders/order-paths';
import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from '@/lib/orders/orders-filters';

import type {
  PharmacyOrdersQueryParams,
  PharmacyOrderRow,
} from '@/lib/orders/orders';

import { OrderStatistics } from '@/components/statistics';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import { OrdersFiltersDrawer } from '@/components/orders/OrdersFiltersDrawer';
import { OrdersTable } from '@/components/orders/OrdersTable/OrdersTable';

import css from './OrdersPageContent.module.css';

//===================================================================

function getOrdersQueryParams(
  filters: OrdersFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number
): PharmacyOrdersQueryParams {
  return {
    page,
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
    createdByType:
      filters.createdByType === 'all' ? undefined : filters.createdByType,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const [orderStatistics, setOrderStatistics] = useState(
    DEFAULT_ORDER_STATISTICS
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryParams = useMemo(
    () => getOrdersQueryParams(filters, rowsPerPage, currentPage),
    [currentPage, filters, rowsPerPage]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setIsLoading(true);

      try {
        const response = await getPharmacyOrders(queryParams, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setOrders([...response.items]);
        setTotalOrders(response.total);
        setTotalPages(response.totalPages);
        setEarliestCreatedAt(response.earliestCreatedAt);
        setOrderStatistics(response.statistics);
      } catch {
        if (controller.signal.aborted) return;

        setOrders([]);
        setTotalOrders(0);
        setTotalPages(0);
        setEarliestCreatedAt(null);
        setOrderStatistics(DEFAULT_ORDER_STATISTICS);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [queryParams]);

  const debouncedFilters = useDebouncedValue(filters, 450);

  useEffect(() => {
    if (debouncedFilters !== filters) return;

    const nextPath = buildOrdersPath(debouncedFilters);
    if (pathname === nextPath) return;

    router.replace(nextPath, { scroll: false });
  }, [debouncedFilters, filters, pathname, router]);

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.date.from || filters.date.to),
    Boolean(filters.client.trim()),
    Boolean(filters.orderNumber.trim()),
    filters.deliveryMethod !== 'all',
    filters.paymentMethod !== 'all',
    filters.status !== 'all',
    filters.createdByType !== 'all'
  );
  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: OrdersFilterState) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_ORDERS_FILTERS);
    setCurrentPage(1);
  };

  const { status: currentPharmacyStatus } = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);

  return (
    <main className={css.page} aria-labelledby="orders-page-title">
      <section className={css.card} aria-labelledby="orders-page-title">
        <PageHeader
          title="Orders"
          titleId="orders-page-title"
          icon={<ShoppingBag size={23} aria-hidden="true" />}
        />

        {bannerStatus ? (
          <StatusBanner
            {...PHARMACY_STATUS_PRESENTATION[bannerStatus]}
            title="Verification is required"
            message={
              bannerStatus === 'on_verification'
                ? 'Orders stay locked while Admin reviews the submitted pharmacy profile.'
                : 'New pharmacies do not receive orders until Admin verifies the pharmacy profile.'
            }
          />
        ) : null}

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
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="orders-rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            />
          </div>

          <CountLabel
            className={css.countLabel}
            shown={orders.length}
            total={totalOrders}
            label="orders"
          />

          <Button
            className={css.createButton}
            type="button"
            size="md"
            disabled={Boolean(bannerStatus)}
            onClick={() => router.push(PHARMACY_ROUTES.ORDER_NEW)}
          >
            Create order
          </Button>
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

        <PaginationView
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>

      {isFiltersOpen ? (
        <OrdersFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
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
