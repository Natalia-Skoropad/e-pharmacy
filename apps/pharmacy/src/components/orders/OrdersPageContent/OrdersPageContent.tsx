'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, ShoppingBag } from 'lucide-react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { countTrueConditions } from '@e-pharmacy/utils/collections';

import { PHARMACY_ROUTES, getPharmacyOrderPath } from '@/lib/routes';
import { getPharmacyOrders } from '@/lib/api/browser/orders.api';
import { getOwnedPharmacyDetail } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { usePharmacySelection } from '@/providers/PharmacySelectionProvider';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from '@/lib/orders/orders-filters';

import {
  buildOrdersPath,
  buildEmbeddedOrdersPath,
  buildRelatedProductOrdersPath,
  parseOrdersSegments,
  parseOrdersPaginationSegments,
  DEFAULT_ORDERS_PAGINATION,
  type OrdersPagination,
} from '@/lib/orders/order-paths';

import type {
  PharmacyOrdersQueryParams,
  PharmacyOrdersResponse,
} from '@/lib/orders/orders';

import { OrderStatistics } from '@/components/statistics';
import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';
import { OrderScopeSearch } from '@/components/orders/OrderScopeSearch/OrderScopeSearch';
import { OrdersFiltersDrawer } from '@/components/orders/OrdersFiltersDrawer';
import { OrdersTable } from '@/components/orders/OrdersTable/OrdersTable';

import {
  INITIAL_ORDERS_PAGE_RESOURCE_STATE,
  completeOrdersLoad,
  failOrdersLoad,
} from './orders-page-resource-state';

import css from './OrdersPageContent.module.css';

//===================================================================

type OrdersPageContentProps = Readonly<{
  embedded?: boolean;
  embeddedPharmacyId?: string;
  embeddedReady?: boolean;
  relatedProductId?: string;
  initialFilters?: OrdersFilterState;
  initialPagination?: OrdersPagination;
}>;

//===================================================================

/** All registry state lives in the pathname, including paging and selected pharmacy. */
function OrdersPageContent({
  embedded = false,
  embeddedPharmacyId,
  embeddedReady = true,
  relatedProductId,
  initialFilters = DEFAULT_ORDERS_FILTERS,
  initialPagination = DEFAULT_ORDERS_PAGINATION,
}: OrdersPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { select: selectCurrentPharmacy, options: membershipOptions } =
    usePharmacySelection();

  // Both registries use the pathname as the single source of truth. Embedded
  // routes have their own base path and an implicit (non-editable) pharmacy ID.
  const routeState = useMemo(() => {
    const base = relatedProductId
      ? `${PHARMACY_ROUTES.PRODUCTS}/${relatedProductId}/related-orders`
      : embedded && embeddedPharmacyId
        ? `${PHARMACY_ROUTES.PHARMACIES}/${embeddedPharmacyId}/orders`
        : PHARMACY_ROUTES.ORDERS;

    const segments =
      pathname === base
        ? []
        : pathname.startsWith(`${base}/`)
          ? pathname.slice(base.length + 1).split('/')
          : null;

    const parsed = segments
      ? parseOrdersSegments({ filters: segments })
      : initialFilters;

    return {
      filters: embedded
        ? { ...parsed, pharmacyId: embeddedPharmacyId ?? '' }
        : parsed,
      pagination: segments
        ? parseOrdersPaginationSegments({ filters: segments })
        : initialPagination,
    };
  }, [
    embedded,
    embeddedPharmacyId,
    relatedProductId,
    initialFilters,
    initialPagination,
    pathname,
  ]);

  const filters = routeState.filters;
  const { page, perPage } = routeState.pagination;
  const [resource, setResource] = useState(INITIAL_ORDERS_PAGE_RESOURCE_STATE);
  const [completedKey, setCompletedKey] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedPharmacyStatus, setSelectedPharmacyStatus] = useState<{
    id: string;
    status: string;
  } | null>(null);

  const navigate = (
    nextFilters: OrdersFilterState,
    nextPage = 1,
    nextPerPage: RowsPerPageValue = perPage
  ) => {
    const pagination = {
      page: nextPage,
      perPage: nextPerPage as OrdersPagination['perPage'],
    };

    const nextPath = relatedProductId
      ? buildRelatedProductOrdersPath(relatedProductId, nextFilters, pagination)
      : embedded && embeddedPharmacyId
        ? buildEmbeddedOrdersPath(embeddedPharmacyId, nextFilters, pagination)
        : buildOrdersPath(nextFilters, pagination);

    if (nextPath !== pathname) router.push(nextPath, { scroll: false });
  };

  const params = useMemo<PharmacyOrdersQueryParams>(
    () => ({
      scope: embedded ? undefined : 'owner',
      productId: relatedProductId || undefined,
      pharmacyId: filters.pharmacyId || undefined,
      clientId: filters.clientId || undefined,
      orderId: filters.orderId || undefined,
      orderNumber: filters.orderNumber.trim() || undefined,
      page,
      perPage,
      dateFrom: filters.date.from || undefined,
      dateTo: filters.date.to || undefined,

      deliveryMethod:
        filters.deliveryMethod === 'all' ? undefined : filters.deliveryMethod,

      paymentMethod:
        filters.paymentMethod === 'all' ? undefined : filters.paymentMethod,

      status: filters.status === 'all' ? undefined : filters.status,

      createdByType:
        filters.createdByType === 'all' ? undefined : filters.createdByType,
    }),
    [embedded, filters, page, perPage, relatedProductId]
  );

  const requestKey = JSON.stringify({ params, retryVersion });
  const isLoading = (embedded && !embeddedReady) || requestKey !== completedKey;
  const isError = !isLoading && resource.status === 'error';

  useEffect(() => {
    const controller = new AbortController();

    if (embedded && !embeddedReady) return () => controller.abort();

    void getPharmacyOrders(params, { signal: controller.signal })
      .then((result: PharmacyOrdersResponse) => {
        if (controller.signal.aborted) return;

        if (result.page !== params.page) {
          const canonical = relatedProductId
            ? buildRelatedProductOrdersPath(relatedProductId, filters, {
                page: result.page,
                perPage,
              })
            : embedded && embeddedPharmacyId
              ? buildEmbeddedOrdersPath(embeddedPharmacyId, filters, {
                  page: result.page,
                  perPage,
                })
              : buildOrdersPath(filters, { page: result.page, perPage });

          router.replace(canonical, { scroll: false });

          return;
        }

        setResource(completeOrdersLoad(result));
        setCompletedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setResource((current) =>
          failOrdersLoad(
            current,
            getSafeApiErrorMessage(
              error,
              'Could not load orders. Please try again.'
            )
          )
        );

        setCompletedKey(requestKey);
      });

    return () => controller.abort();
  }, [
    embedded,
    embeddedPharmacyId,
    embeddedReady,
    filters,
    params,
    perPage,
    relatedProductId,
    requestKey,
    router,
  ]);

  // Prefer membership snapshot (fast), fetch detail for deep-linked pharmacies
  // beyond the first page of options. The server remains the authority.
  const optionStatus = membershipOptions.find(
    (item) => item.id === filters.pharmacyId
  )?.status;

  useEffect(() => {
    if (!filters.pharmacyId || optionStatus) return;

    const controller = new AbortController();

    void getOwnedPharmacyDetail(filters.pharmacyId, {
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted)
          setSelectedPharmacyStatus({
            id: filters.pharmacyId,
            status: result.pharmacy.status,
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSelectedPharmacyStatus({
            id: filters.pharmacyId,
            status: 'unavailable',
          });
      });
    return () => controller.abort();
  }, [filters.pharmacyId, optionStatus]);

  const pharmacyStatus =
    optionStatus ??
    (selectedPharmacyStatus?.id === filters.pharmacyId
      ? selectedPharmacyStatus.status
      : null);

  const mayCreate =
    pharmacyStatus === 'active' || pharmacyStatus === 'on_moderation';

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.date.from || filters.date.to),
    Boolean(filters.clientId),
    Boolean(filters.orderId || filters.orderNumber),
    filters.deliveryMethod !== 'all',
    filters.paymentMethod !== 'all',
    filters.status !== 'all',
    filters.createdByType !== 'all'
  );

  const hasActiveFilters = activeFiltersCount > 0;
  const RootElement = embedded || relatedProductId ? 'section' : 'main';
  const reload = () => setRetryVersion((value) => value + 1);

  return (
    <RootElement
      className={css.page}
      aria-label={relatedProductId ? 'Related orders' : 'Orders'}
    >
      {embedded ? (
        <ProfileSectionHeader
          title="Orders"
          description="View orders created at this pharmacy."
          icon={<ShoppingBag size={21} aria-hidden="true" />}
        />
      ) : null}
      <section
        className={css.card}
        aria-label="Order statistics and pharmacy selection"
      >
        {!embedded && !relatedProductId ? (
          <PageHeader
            title="Orders"
            titleId="orders-page-title"
            icon={<ShoppingBag size={23} aria-hidden="true" />}
          />
        ) : null}
        {!embedded ? (
          <div className={css.pharmacySelector}>
            <OwnedPharmacySearch
              id="orders-pharmacy-search"
              label="Select pharmacy"
              value={filters.pharmacyId}
              explainStatistics
              statisticsContext="orders"
              onChange={(pharmacyId) =>
                navigate({
                  ...filters,
                  pharmacyId,
                  clientId: '',
                  orderId: '',
                  orderNumber: '',
                })
              }
            />
          </div>
        ) : null}
        <div className={css.orderStatistics}>
          {isLoading ? (
            <StatsLoadingSkeleton
              count={4}
              columns={4}
              tabletColumns={2}
              label="Loading order statistics"
            />
          ) : isError ? (
            <ProfileResourceState
              variant="error"
              title="Order statistics could not be loaded"
              description="Order statistics are temporarily unavailable."
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={reload}
            />
          ) : (
            <OrderStatistics
              counts={resource.statistics}
              activeStatus={filters.status === 'all' ? null : filters.status}
              getStatusHref={(status) => {
                const next = {
                  ...filters,
                  status: filters.status === status ? ('all' as const) : status,
                };

                return relatedProductId
                  ? buildRelatedProductOrdersPath(relatedProductId, next, {
                      page: 1,
                      perPage,
                    })
                  : embedded && embeddedPharmacyId
                    ? buildEmbeddedOrdersPath(embeddedPharmacyId, next, {
                        page: 1,
                        perPage,
                      })
                    : buildOrdersPath(next, { page: 1, perPage });
              }}
              className={css.statisticsGrid}
            />
          )}
        </div>
      </section>

      <section className={css.card} aria-label="Orders search">
        <div className={css.searchGrid}>
          <OrderScopeSearch
            kind="client"
            pharmacyId={filters.pharmacyId}
            productId={relatedProductId}
            relatedId={filters.orderId}
            value={filters.clientId}
            onChange={(clientId) => navigate({ ...filters, clientId })}
          />
          <OrderScopeSearch
            kind="order"
            pharmacyId={filters.pharmacyId}
            productId={relatedProductId}
            relatedId={filters.clientId}
            value={filters.orderId}
            onChange={(orderId) =>
              navigate({ ...filters, orderId, orderNumber: '' })
            }
          />
          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="orders-filters-panel"
              isExpanded={filtersOpen}
              onClick={() => setFiltersOpen(true)}
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
              value={perPage}
              onChange={(next) => navigate(filters, 1, next)}
            />
          </div>
          {!isLoading && !isError ? (
            <CountLabel
              shown={resource.orders.length}
              total={resource.totalOrders}
              label="orders"
              fullWidthOnMobile
              className={css.countLabel}
            />
          ) : null}
          {filters.pharmacyId && !relatedProductId ? (
            <Button
              className={css.createButton}
              type="button"
              size="md"
              disabled={!mayCreate}
              onClick={() =>
                selectCurrentPharmacy(
                  filters.pharmacyId,
                  PHARMACY_ROUTES.ORDER_NEW
                )
              }
            >
              <Plus size={18} aria-hidden="true" />
              Create order
            </Button>
          ) : null}
        </div>

        {isError ? (
          <ProfileResourceState
            variant="error"
            title="Orders could not be loaded"
            description={resource.errorMessage}
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={reload}
          />
        ) : (
          <OrdersTable
            orders={isLoading ? [] : resource.orders}
            isLoading={isLoading}
            emptyMessage={
              hasActiveFilters
                ? 'No orders found for the selected filters.'
                : 'No orders yet for these pharmacies.'
            }
            showPharmacy={!filters.pharmacyId}
            productId={relatedProductId}
            onOpenOrder={(order) => {
              const target = getPharmacyOrderPath(order.id);

              if (order.pharmacyId)
                selectCurrentPharmacy(order.pharmacyId, target);
              else router.push(target);
            }}
          />
        )}

        {!isLoading && !isError ? (
          <PaginationView
            currentPage={page}
            totalPages={resource.totalPages}
            onPageChange={(nextPage) => navigate(filters, nextPage)}
          />
        ) : null}
      </section>

      {filtersOpen ? (
        <OrdersFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          availableDates={resource.availableOrderDates}
          onChange={(next) => navigate(next)}
          onClose={() => setFiltersOpen(false)}
          onReset={() =>
            navigate({
              ...DEFAULT_ORDERS_FILTERS,
              pharmacyId: filters.pharmacyId,
            })
          }
        />
      ) : null}
    </RootElement>
  );
}

export default OrdersPageContent;
export { OrdersPageContent };
