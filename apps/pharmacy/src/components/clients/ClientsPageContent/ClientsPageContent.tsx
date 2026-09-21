'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { countTrueConditions } from '@e-pharmacy/utils/collections';

import {
  type ClientStatisticsCounts,
  type ClientStatisticsKey,
} from '@/lib/statistics/config';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getPharmacyClients } from '@/lib/api/browser';
import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  type ClientsFilterState,
} from '@/lib/clients/client-paths';

import type {
  PharmacyClientRow,
  PharmacyClientsQueryParams,
} from '@/lib/clients/clients';

import { useCurrentPharmacyStatus } from '@/hooks/useCurrentPharmacyStatus';

import { ClientStatistics } from '@/components/statistics';
import { ClientsFiltersDrawer } from '@/components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer';
import { ClientsTable } from '@/components/clients/ClientsTable/ClientsTable';
import { useLastKnownStatistics } from '@/components/clients/useLastKnownStatistics';

import css from './ClientsPageContent.module.css';

//===================================================================

function getClientsQueryParams(
  filters: ClientsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number
): PharmacyClientsQueryParams {
  return {
    page,
    perPage: rowsPerPage,
    firstOrderFrom: filters.firstOrderDate.from || undefined,
    firstOrderTo: filters.firstOrderDate.to || undefined,
    name: filters.name.trim() || undefined,
    clientId: filters.clientId.trim() || undefined,
    contact: filters.contact.trim() || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    successfulOrders:
      filters.successfulOrders === 'all' ? undefined : filters.successfulOrders,
  };
}

//===================================================================

type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

//===================================================================

type ClientsPageContentProps = Readonly<{
  initialFilters?: ClientsFilterState;
}>;

//===================================================================

function ClientsPageContent({
  initialFilters = DEFAULT_CLIENTS_FILTERS,
}: ClientsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingRoutePathRef = useRef<string | null>(null);

  const [searchFilters, setSearchFilters] = useState(() => ({
    name: initialFilters.name,
    clientId: initialFilters.clientId,
    contact: initialFilters.contact,
  }));

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const {
    data: clientStatistics,
    status: clientStatisticsStatus,
    startLoading: startClientStatisticsLoading,
    setSuccess: setClientStatisticsSuccess,
    setFailure: setClientStatisticsFailure,
  } = useLastKnownStatistics<ClientStatisticsCounts>();

  const [clientsStatus, setClientsStatus] = useState<ResourceStatus>('idle');
  const [clientsError, setClientsError] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const routeFilters = useMemo<ClientsFilterState>(
    () => ({
      ...DEFAULT_CLIENTS_FILTERS,
      firstOrderDate: {
        from: initialFilters.firstOrderDate.from,
        to: initialFilters.firstOrderDate.to,
      },
      status: initialFilters.status,
      successfulOrders: initialFilters.successfulOrders,
    }),
    [
      initialFilters.firstOrderDate.from,
      initialFilters.firstOrderDate.to,
      initialFilters.status,
      initialFilters.successfulOrders,
    ]
  );

  const filters = useMemo<ClientsFilterState>(
    () => ({
      ...routeFilters,
      name: searchFilters.name,
      clientId: searchFilters.clientId,
      contact: searchFilters.contact,
    }),
    [
      routeFilters,
      searchFilters.clientId,
      searchFilters.contact,
      searchFilters.name,
    ]
  );

  const debouncedSearchFilters = useDebouncedValue(searchFilters, 450);

  const requestFilters = useMemo<ClientsFilterState>(
    () => ({
      ...routeFilters,
      name: debouncedSearchFilters.name,
      clientId: debouncedSearchFilters.clientId,
      contact: debouncedSearchFilters.contact,
    }),
    [
      debouncedSearchFilters.clientId,
      debouncedSearchFilters.contact,
      debouncedSearchFilters.name,
      routeFilters,
    ]
  );

  const canonicalInitialPath = buildClientsPath(routeFilters);
  const [pageState, setPageState] = useState(() => ({
    routeKey: canonicalInitialPath,
    page: 1,
  }));

  const currentPage =
    pageState.routeKey === canonicalInitialPath ? pageState.page : 1;

  const queryParams = useMemo(
    () => getClientsQueryParams(requestFilters, rowsPerPage, currentPage),
    [currentPage, requestFilters, rowsPerPage]
  );

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.firstOrderDate.from || filters.firstOrderDate.to),
    Boolean(filters.name.trim()),
    Boolean(filters.clientId.trim()),
    Boolean(filters.contact.trim()),
    filters.status !== 'all',
    filters.successfulOrders !== 'all'
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadClients() {
      setClientsStatus('loading');
      setClientsError('');
      startClientStatisticsLoading();

      try {
        const response = await getPharmacyClients(queryParams, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setClients([...response.items]);
        setTotalClients(response.total);
        setTotalPages(response.totalPages);
        setPageState({ routeKey: canonicalInitialPath, page: response.page });
        setEarliestCreatedAt(response.earliestCreatedAt);
        setClientStatisticsSuccess(response.statistics);
        setClientsStatus('success');
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setClientsError(
          getSafeApiErrorMessage(
            loadError,
            'Could not load clients. Please try again.'
          )
        );
        setClientStatisticsFailure();
        setClientsStatus('error');
      }
    }

    void loadClients();

    return () => {
      controller.abort();
    };
  }, [
    canonicalInitialPath,
    queryParams,
    setClientStatisticsFailure,
    setClientStatisticsSuccess,
    startClientStatisticsLoading,
    retryVersion,
  ]);

  useEffect(() => {
    const pendingPath = pendingRoutePathRef.current;

    if (pendingPath) {
      if (pathname === pendingPath && canonicalInitialPath === pendingPath) {
        pendingRoutePathRef.current = null;
      }

      return;
    }

    if (pathname !== canonicalInitialPath) {
      router.replace(canonicalInitialPath, { scroll: false });
    }
  }, [canonicalInitialPath, pathname, router]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: ClientsFilterState) => {
    if (
      nextFilters.name !== searchFilters.name ||
      nextFilters.clientId !== searchFilters.clientId ||
      nextFilters.contact !== searchFilters.contact
    ) {
      setSearchFilters({
        name: nextFilters.name,
        clientId: nextFilters.clientId,
        contact: nextFilters.contact,
      });
    }

    const nextPath = buildClientsPath(nextFilters);

    if (nextPath !== canonicalInitialPath) {
      pendingRoutePathRef.current = nextPath;
      router.replace(nextPath, { scroll: false });
    }

    setPageState({ routeKey: nextPath, page: 1 });
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
    setPageState({ routeKey: canonicalInitialPath, page: 1 });
  };

  const resetFilters = () => {
    setSearchFilters({ name: '', clientId: '', contact: '' });

    if (canonicalInitialPath !== PHARMACY_ROUTES.CLIENTS) {
      pendingRoutePathRef.current = PHARMACY_ROUTES.CLIENTS;
      router.replace(PHARMACY_ROUTES.CLIENTS, { scroll: false });
    }

    setPageState({ routeKey: PHARMACY_ROUTES.CLIENTS, page: 1 });
  };

  const getClientStatisticHref = (key: ClientStatisticsKey) => {
    if (key === 'active') {
      return buildClientsPath({ ...DEFAULT_CLIENTS_FILTERS, status: 'active' });
    }

    if (key === 'blocked') {
      return buildClientsPath({
        ...DEFAULT_CLIENTS_FILTERS,
        status: 'blocked',
      });
    }

    if (key === 'repeat') {
      return buildClientsPath({
        ...DEFAULT_CLIENTS_FILTERS,
        successfulOrders: 'repeat',
      });
    }

    return PHARMACY_ROUTES.CLIENTS;
  };

  const { status: currentPharmacyStatus } = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);

  return (
    <main className={css.page} aria-labelledby="clients-page-title">
      <section className={css.card} aria-labelledby="clients-page-title">
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
              Clients
              <InfoTooltip
                label="About client types"
                title="Client types"
                items={[
                  {
                    title: 'Repeat clients',
                    description:
                      'Clients who have completed two or more successful orders in this pharmacy.',
                  },
                  {
                    title: 'Walk-in client',
                    description:
                      'The default active client created when the pharmacy first becomes Active. Use it for counter sales when a visitor has no personal account. Its photo comes from the pharmacy profile, and its purchase statistics are tracked like any other client.',
                  },
                ]}
              />
            </span>
          }
          titleId="clients-page-title"
          icon={<Users size={23} aria-hidden="true" />}
        />

        {bannerStatus ? (
          <StatusBanner
            {...PHARMACY_STATUS_PRESENTATION[bannerStatus]}
            title={
              bannerStatus === 'blocked'
                ? 'Pharmacy access is temporarily restricted'
                : 'Verification is required'
            }
            message={
              bannerStatus === 'blocked'
                ? 'Existing client data remains available for review, while operational pharmacy actions stay disabled until Admin restores access.'
                : bannerStatus === 'on_verification'
                  ? 'Client data stays locked while Admin reviews the submitted pharmacy profile.'
                  : 'Client data is connected only to real pharmacy orders, so a new pharmacy starts with an empty client table.'
            }
          />
        ) : null}

        {clientStatistics ? (
          <ClientStatistics
            counts={clientStatistics}
            getStatisticHref={getClientStatisticHref}
            className={css.clientStatistics}
          />
        ) : clientStatisticsStatus === 'error' ? (
          <p className={css.statisticsState} role="alert">
            Client statistics are temporarily unavailable.
          </p>
        ) : (
          <p className={css.statisticsState} role="status">
            Loading client statistics...
          </p>
        )}
      </section>

      <section className={css.card} aria-labelledby="clients-search-title">
        <h2 className={css.visuallyHidden} id="clients-search-title">
          Clients search
        </h2>

        <div className={css.searchGrid}>
          <SearchInput
            id="clients-id-search"
            label="Client ID search"
            value={filters.clientId}
            placeholder="Client ID"
            isActive={Boolean(filters.clientId)}
            onChange={(clientId) =>
              handleFiltersChange({ ...filters, clientId })
            }
          />

          <SearchInput
            id="clients-name-search"
            label="Client name search"
            value={filters.name}
            placeholder="Client name"
            isActive={Boolean(filters.name)}
            onChange={(name) => handleFiltersChange({ ...filters, name })}
          />

          <SearchInput
            id="clients-contact-search"
            label="Client contact search"
            value={filters.contact}
            placeholder="Email, phone, or address"
            isActive={Boolean(filters.contact)}
            onChange={(contact) => handleFiltersChange({ ...filters, contact })}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="clients-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Clients table">
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="clients-rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            />
          </div>

          {clientsStatus === 'success' ? (
            <CountLabel
              className={css.countLabel}
              shown={clients.length}
              total={totalClients}
              label="clients"
            />
          ) : null}
        </div>

        {clientsStatus === 'error' ? (
          <div role="alert">
            <p className={css.errorText}>{clientsError}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setRetryVersion((version) => version + 1)}
            >
              Retry clients
            </Button>
          </div>
        ) : (
          <ClientsTable
            clients={clients}
            isLoading={clientsStatus === 'idle' || clientsStatus === 'loading'}
            emptyMessage={
              hasActiveFilters
                ? 'No clients found for the selected filters.'
                : 'Your pharmacy has no clients yet.'
            }
          />
        )}

        {clientsStatus === 'success' ? (
          <PaginationView
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) =>
              setPageState({ routeKey: canonicalInitialPath, page })
            }
          />
        ) : null}
      </section>

      {isFiltersOpen ? (
        <ClientsFiltersDrawer
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

export default ClientsPageContent;
export { ClientsPageContent };
