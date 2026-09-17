'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, UsersRound } from 'lucide-react';

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
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBanner } from '@e-pharmacy/ui/statistics';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getPharmacyOrders } from '@/lib/api/browser';
import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';
import { buildOrdersPath } from '@/lib/orders/order-paths';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from '@/lib/orders/orders-filters';

import type { PharmacyOrdersQueryParams } from '@/lib/orders/orders';
import { useCurrentPharmacyStatus } from '@/hooks/useCurrentPharmacyStatus';

import { OrderStatistics } from '@/components/statistics';
import { OrdersFiltersDrawer } from '@/components/orders/OrdersFiltersDrawer';
import { OrdersTable } from '@/components/orders/OrdersTable/OrdersTable';

import {
  INITIAL_ORDERS_PAGE_RESOURCE_STATE,
  beginOrdersLoad,
  completeOrdersLoad,
  failOrdersLoad,
} from './orders-page-resource-state';

import {
  applyDebouncedOrdersTextFilters,
  getOrdersTextFilterState,
  syncOrdersFiltersFromRoute,
  type OrdersTextFilterState,
} from './orders-page-filter-state';

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

  const [routeTextOverride, setRouteTextOverride] =
    useState<OrdersTextFilterState | null>(null);

  const [ordersResource, setOrdersResource] = useState(
    INITIAL_ORDERS_PAGE_RESOURCE_STATE
  );

  const [retryVersion, setRetryVersion] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const skipCanonicalPageRequestRef = useRef<number | null>(null);
  const internalRoutePathsRef = useRef(new Set<string>());
  const initialFiltersPath = buildOrdersPath(initialFilters);
  const previousInitialFiltersPathRef = useRef(initialFiltersPath);

  const routeFiltersChanged =
    previousInitialFiltersPathRef.current !== initialFiltersPath;

  const {
    status: ordersStatus,
    orders,
    totalOrders,
    totalPages,
    earliestCreatedAt,
    statistics: orderStatistics,
    errorMessage: ordersErrorMessage,
  } = ordersResource;

  const textFilters = useMemo<OrdersTextFilterState>(
    () => ({
      client: filters.client,
      orderNumber: filters.orderNumber,
    }),
    [filters.client, filters.orderNumber]
  );

  const debouncedTextFilters = useDebouncedValue(textFilters, 450);
  const requestTextFilters = routeTextOverride ?? debouncedTextFilters;

  const immediateFilters = useMemo<OrdersFilterState>(
    () => ({
      date: {
        from: filters.date.from,
        to: filters.date.to,
      },
      client: '',
      orderNumber: '',
      deliveryMethod: filters.deliveryMethod,
      paymentMethod: filters.paymentMethod,
      status: filters.status,
      createdByType: filters.createdByType,
    }),
    [
      filters.createdByType,
      filters.date.from,
      filters.date.to,
      filters.deliveryMethod,
      filters.paymentMethod,
      filters.status,
    ]
  );

  const requestFilters = useMemo(
    () => applyDebouncedOrdersTextFilters(immediateFilters, requestTextFilters),
    [immediateFilters, requestTextFilters]
  );

  const queryParams = useMemo(
    () => getOrdersQueryParams(requestFilters, rowsPerPage, currentPage),
    [currentPage, requestFilters, rowsPerPage]
  );

  useEffect(() => {
    if (!routeFiltersChanged) return;

    previousInitialFiltersPathRef.current = initialFiltersPath;

    if (internalRoutePathsRef.current.delete(initialFiltersPath)) {
      return;
    }

    internalRoutePathsRef.current.clear();
    setRouteTextOverride(getOrdersTextFilterState(initialFilters));
    setFilters((currentFilters) =>
      syncOrdersFiltersFromRoute(currentFilters, initialFilters)
    );
    setCurrentPage(1);
  }, [initialFilters, initialFiltersPath, routeFiltersChanged]);

  useEffect(() => {
    if (!routeTextOverride) return;

    if (
      filters.client === routeTextOverride.client &&
      filters.orderNumber === routeTextOverride.orderNumber &&
      debouncedTextFilters.client === routeTextOverride.client &&
      debouncedTextFilters.orderNumber === routeTextOverride.orderNumber
    ) {
      setRouteTextOverride(null);
    }
  }, [
    debouncedTextFilters.client,
    debouncedTextFilters.orderNumber,
    filters.client,
    filters.orderNumber,
    routeTextOverride,
  ]);

  useEffect(() => {
    if (skipCanonicalPageRequestRef.current === queryParams.page) {
      skipCanonicalPageRequestRef.current = null;
      return;
    }

    const controller = new AbortController();

    async function loadOrders() {
      setOrdersResource((state) => beginOrdersLoad(state));

      try {
        const response = await getPharmacyOrders(queryParams, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setOrdersResource(completeOrdersLoad(response));

        if (response.page !== queryParams.page) {
          skipCanonicalPageRequestRef.current = response.page;
          setCurrentPage(response.page);
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setOrdersResource((state) =>
          failOrdersLoad(
            state,
            getSafeApiErrorMessage(
              loadError,
              'Could not load orders. Please try again.'
            )
          )
        );
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [queryParams, retryVersion]);

  useEffect(() => {
    if (routeFiltersChanged) return;

    const nextPath = buildOrdersPath(requestFilters);
    if (pathname === nextPath) return;

    internalRoutePathsRef.current.add(nextPath);
    router.replace(nextPath, { scroll: false });
  }, [pathname, requestFilters, routeFiltersChanged, router]);

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
    if (
      nextFilters.client !== filters.client ||
      nextFilters.orderNumber !== filters.orderNumber
    ) {
      setRouteTextOverride(null);
    }

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

        {ordersStatus === 'error' ? (
          <p role="status">Order statistics are temporarily unavailable.</p>
        ) : (
          <OrderStatistics
            counts={orderStatistics}
            getStatusHref={(status) =>
              buildOrdersPath({ ...DEFAULT_ORDERS_FILTERS, status })
            }
            className={css.orderStatistics}
          />
        )}
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
            label="Client search"
            labelAccessory={
              <InfoTooltip
                label="How can I search for a client?"
                title="Client search"
                icon={<UsersRound size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'Search fields',
                    description:
                      'Search by client name, ID, email, phone number, or address.',
                  },
                ]}
              />
            }
            value={filters.client}
            placeholder="Client"
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

          {ordersStatus === 'success' ? (
            <CountLabel
              className={css.countLabel}
              shown={orders.length}
              total={totalOrders}
              label="orders"
            />
          ) : null}

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

        {ordersStatus === 'error' ? (
          <div className={css.errorState} role="alert">
            <p className={css.errorText}>{ordersErrorMessage}</p>
            <Button
              type="button"
              size="md"
              onClick={() => setRetryVersion((version) => version + 1)}
            >
              Retry
            </Button>
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            isLoading={ordersStatus === 'loading'}
            emptyMessage={
              hasActiveFilters
                ? 'No orders found for the selected filters. Adjust filters or reset them.'
                : 'Orders will appear here after the pharmacy is verified and clients place orders.'
            }
          />
        )}

        {ordersStatus === 'success' ? (
          <PaginationView
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
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
