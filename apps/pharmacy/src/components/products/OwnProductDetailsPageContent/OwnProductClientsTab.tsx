'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { RowsPerPageSelect } from '@e-pharmacy/ui/forms';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { FiltersButton } from '@e-pharmacy/ui/primitives';
import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import { getPharmacyClients } from '@/lib/api/browser/clients.api';
import type { PharmacyClientsResponse } from '@/lib/clients/clients';

import {
  DEFAULT_CLIENTS_FILTERS,
  type ClientsFilterState,
} from '@/lib/clients/client-paths';

import type { ClientStatisticsKey } from '@/lib/statistics/config';

import {
  buildOwnProductClientsPath,
  parseOwnProductClientsSegments,
  DEFAULT_OWN_PRODUCT_CLIENTS_ROUTE,
  type OwnProductClientsRouteState,
} from '@/lib/products/own-product-clients-paths';

import { ClientStatistics } from '@/components/statistics/ClientStatistics/ClientStatistics';
import { ClientsTable } from '@/components/clients/ClientsTable/ClientsTable';
import { OwnerClientSearch } from '@/components/clients/OwnerClientSearch/OwnerClientSearch';
import { ClientsFiltersDrawer } from '@/components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer';
import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

export function OwnProductClientsTab({
  productId,
}: Readonly<{ productId: string }>) {
  const router = useRouter();
  const pathname = usePathname();

  const route = useMemo(() => {
    const base = `/pharmacy/products/${productId}/clients`;

    const segments = pathname.startsWith(`${base}/`)
      ? pathname.slice(base.length + 1).split('/')
      : [];

    return parseOwnProductClientsSegments(segments);
  }, [pathname, productId]);

  const [data, setData] = useState<PharmacyClientsResponse | null>(null);
  const [requestKey, setRequestKey] = useState('');
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const key = [
    productId,
    route.pharmacyId,
    route.clientId,
    route.status,
    route.date.from,
    route.date.to,
    route.page,
    route.perPage,
    retry,
  ].join(':');

  const isLoading = requestKey !== key;
  const isError = !isLoading && error;

  const navigate = (updates: Partial<OwnProductClientsRouteState>) => {
    router.push(
      buildOwnProductClientsPath(productId, {
        ...route,
        ...updates,
        page: updates.page ?? 1,
      }),
      { scroll: false }
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    void getPharmacyClients(
      {
        scope: 'owner',
        productId,
        pharmacyId: route.pharmacyId || undefined,
        clientId: route.clientId || undefined,
        status: route.status === 'all' ? undefined : route.status,
        firstOrderFrom: route.date.from || undefined,
        firstOrderTo: route.date.to || undefined,
        page: route.page,
        perPage: route.perPage,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        const lastPage = Math.max(1, response.totalPages);

        if (route.page > lastPage) {
          router.replace(
            buildOwnProductClientsPath(productId, {
              ...route,
              page: lastPage,
            }),
            { scroll: false }
          );
          return;
        }

        setData(response);
        setError(false);
        setRequestKey(key);
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setData(null);
        setError(true);
        setRequestKey(key);
      });

    return () => controller.abort();
  }, [key, productId, route, router]);

  const filters: ClientsFilterState = {
    ...DEFAULT_CLIENTS_FILTERS,
    pharmacyId: route.pharmacyId,
    clientId: route.clientId,
    status: route.status,
    firstOrderDate: route.date,
  };

  const updateFilters = (next: ClientsFilterState) =>
    navigate({
      clientId: next.clientId,
      status: next.status,
      date: next.firstOrderDate,
    });

  const activeFilterCount =
    Number(Boolean(route.clientId)) +
    Number(route.status !== 'all') +
    Number(Boolean(route.date.from || route.date.to));

  // These dates are computed across all matching buyers (all pages), not
  // inferred from the current page or the current business calendar date.
  const clientAddedDates = isLoading
    ? []
    : (data?.availableClientAddedDates ?? []);

  const stats = data?.statistics;
  const statsCurrent = isLoading ? null : stats;
  const activeKey = route.status === 'all' ? null : route.status;

  const handleStatisticHref = (key: ClientStatisticsKey) =>
    buildOwnProductClientsPath(productId, {
      ...route,
      status:
        (key !== 'active' && key !== 'blocked') || key === route.status
          ? 'all'
          : key,
      page: 1,
    });

  return (
    <div className={css.sectionStack}>
      <div className={css.pharmacySelector}>
        <OwnedPharmacySearch
          id="own-product-clients-pharmacy-search"
          label="Select pharmacy"
          value={route.pharmacyId}
          onChange={(pharmacyId) =>
            router.push(
              buildOwnProductClientsPath(productId, {
                ...DEFAULT_OWN_PRODUCT_CLIENTS_ROUTE,
                pharmacyId,
              }),
              { scroll: false }
            )
          }
        />
      </div>

      <section
        className={`${css.sectionCard} ${css.productClientsStatisticsCard}`}
        aria-label="Product client statistics"
      >
        {isError ? (
          <ProfileResourceState
            variant="error"
            title="Product client statistics could not be loaded"
            description="Client statistics are temporarily unavailable."
            onRetry={() => setRetry((value) => value + 1)}
            retryLabel="Try again"
          />
        ) : statsCurrent ? (
          <ClientStatistics
            counts={statsCurrent}
            activeKey={activeKey}
            getStatisticHref={handleStatisticHref}
          />
        ) : (
          <StatsLoadingSkeleton
            count={3}
            columns={3}
            tabletColumns={2}
            label="Loading product client statistics"
          />
        )}
      </section>

      <section className={css.sectionCard} aria-label="Search product clients">
        <div className={css.stockSearchGrid}>
          <OwnerClientSearch
            key={`${productId}:${route.pharmacyId}`}
            id="own-product-clients-search"
            productId={productId}
            pharmacyId={route.pharmacyId}
            value={route.clientId}
            onChange={(clientId) => navigate({ clientId })}
          />
          <div className={css.searchAction}>
            <FiltersButton
              className={css.filterButton}
              activeCount={activeFilterCount}
              controlsId="clients-filters-panel"
              isExpanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.sectionCard} aria-label="Product clients table">
        <div className={css.tableStack}>
          <div className={css.tableToolbar}>
            <div className={css.rowsControl}>
              <RowsPerPageSelect
                id="own-product-clients-rows-per-page"
                value={route.perPage}
                onChange={(perPage) => navigate({ perPage })}
              />
            </div>
            {!isLoading && !isError ? (
              <CountLabel
                className={css.countLabel}
                fullWidthOnMobile
                shown={data?.items.length ?? 0}
                total={data?.total ?? 0}
                label="clients"
              />
            ) : null}
          </div>

          {isError ? (
            <ProfileResourceState
              variant="error"
              title="Product clients could not be loaded"
              description="Please try loading the clients again."
              retryLabel="Try again"
              onRetry={() => setRetry((value) => value + 1)}
            />
          ) : (
            <ClientsTable
              clients={isLoading ? [] : [...(data?.items ?? [])]}
              isLoading={isLoading}
              showProductQuantity
              emptyMessage="No clients have successfully purchased this product for the selected filters."
            />
          )}

          {!isLoading && !isError ? (
            <PaginationView
              currentPage={route.page}
              totalPages={Math.max(1, data?.totalPages ?? 1)}
              onPageChange={(page) => navigate({ page })}
            />
          ) : null}
        </div>
      </section>

      {drawerOpen ? (
        <ClientsFiltersDrawer
          filters={filters}
          includeSuccessfulOrders={false}
          hasActiveFilters={activeFilterCount > 0}
          resetHref=""
          minDate={clientAddedDates[0]}
          maxDate={clientAddedDates[clientAddedDates.length - 1]}
          availableDates={clientAddedDates}
          onChange={updateFilters}
          onReset={() => {
            router.push(
              buildOwnProductClientsPath(productId, {
                ...DEFAULT_OWN_PRODUCT_CLIENTS_ROUTE,
                pharmacyId: route.pharmacyId,
              }),
              { scroll: false }
            );
          }}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}
