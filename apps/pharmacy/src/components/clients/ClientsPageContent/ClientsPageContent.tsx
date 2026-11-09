'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat2, Store, Users, UsersRound } from 'lucide-react';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { StatsLoadingSkeleton, StatusBanner } from '@e-pharmacy/ui/statistics';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

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
  type ClientsPaginationState,
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
import { OwnerClientSearch } from '@/components/clients/OwnerClientSearch/OwnerClientSearch';
import { useLastKnownStatistics } from '@/components/clients/useLastKnownStatistics';

import css from './ClientsPageContent.module.css';

//===================================================================

function getClientsQueryParams(
  filters: ClientsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number,
  ownerScope: boolean
): PharmacyClientsQueryParams {
  return {
    page,
    perPage: rowsPerPage,

    ...(ownerScope ? { scope: 'owner' as const } : {}),

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
  embedded?: boolean;
  initialFilters?: ClientsFilterState;
  basePath?: string;
  initialPage?: number;
  initialPerPage?: RowsPerPageValue;
}>;

//===================================================================

function ClientsPageContent({
  embedded = false,
  initialFilters = DEFAULT_CLIENTS_FILTERS,
  basePath = PHARMACY_ROUTES.CLIENTS,
  initialPage = 1,
  initialPerPage = 20,
}: ClientsPageContentProps) {
  const router = useRouter();
  const ownerScope = !embedded;

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
    () =>
      embedded
        ? initialFilters
        : {
            ...DEFAULT_CLIENTS_FILTERS,

            firstOrderDate: {
              from: initialFilters.firstOrderDate.from,
              to: initialFilters.firstOrderDate.to,
            },

            status: initialFilters.status,
            clientId: ownerScope ? initialFilters.clientId : '',
            successfulOrders: initialFilters.successfulOrders,
          },
    [embedded, initialFilters, ownerScope]
  );

  // Both the owner registry and the embedded tab use URL-backed selected IDs.
  // Free text is handled inside OwnerClientSearch and never persisted in URLs.
  const filters = routeFilters;

  // Both registry variants use the canonical URL as their paging source.
  // This survives refresh and browser Back/Forward without stale component state.
  const pagination: ClientsPaginationState = {
    page: initialPage,
    perPage: initialPerPage,
  };

  const canonicalInitialPath = buildClientsPath(
    routeFilters,
    basePath,
    pagination
  );

  const currentPage = pagination.page;
  const rowsPerPage = pagination.perPage;

  const queryParams = useMemo(
    () => getClientsQueryParams(filters, rowsPerPage, currentPage, ownerScope),
    [currentPage, filters, rowsPerPage, ownerScope]
  );

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.clientId.trim()),
    Boolean(filters.name.trim()),
    Boolean(filters.contact.trim()),
    Boolean(filters.firstOrderDate.from || filters.firstOrderDate.to),
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

        if (response.page !== currentPage) {
          router.replace(
            buildClientsPath(routeFilters, basePath, {
              page: response.page,
              perPage: rowsPerPage,
            }),
            { scroll: false }
          );
        }

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
    basePath,
    currentPage,
    queryParams,
    routeFilters,
    router,
    rowsPerPage,
    setClientStatisticsFailure,
    setClientStatisticsSuccess,
    startClientStatisticsLoading,
    retryVersion,
  ]);

  // Route pages canonicalize legacy URLs on the server. Do not replace a
  // browser Back/Forward destination with stale client-side route props.

  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: ClientsFilterState) => {
    const nextPath = buildClientsPath(nextFilters, basePath, {
      page: 1,
      perPage: rowsPerPage,
    });

    if (nextPath !== canonicalInitialPath) {
      router.push(nextPath, { scroll: false });
    }
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    const nextPath = buildClientsPath(routeFilters, basePath, {
      page: 1,
      perPage: nextRowsPerPage,
    });

    if (nextPath !== canonicalInitialPath) {
      router.push(nextPath, { scroll: false });
    }
  };

  const resetFilters = () => {
    const nextPath = buildClientsPath(DEFAULT_CLIENTS_FILTERS, basePath, {
      page: 1,
      perPage: rowsPerPage,
    });

    if (nextPath !== canonicalInitialPath) {
      router.push(nextPath, { scroll: false });
    }
  };

  // Client status and Successful orders are independent filter dimensions.
  // Statistic cards change only the status dimension; the order filter is
  // retained, including when the user clears an active status card.
  const getClientStatisticHref = (key: ClientStatisticsKey) => {
    const link = (status: ClientsFilterState['status']) =>
      buildClientsPath({ ...routeFilters, status }, basePath, {
        page: 1,
        perPage: rowsPerPage,
      });

    if (key === 'active') {
      return link(filters.status === 'active' ? 'all' : 'active');
    }

    if (key === 'blocked') {
      return link(filters.status === 'blocked' ? 'all' : 'blocked');
    }

    return link('all');
  };

  const { status: currentPharmacyStatus } = useCurrentPharmacyStatus();

  const bannerStatus = ownerScope
    ? null
    : getLockedFeatureBannerStatus(currentPharmacyStatus);

  const RootElement = embedded ? 'section' : 'main';

  return (
    <RootElement
      className={css.page}
      aria-label={embedded ? 'Pharmacy clients' : undefined}
      aria-labelledby={embedded ? undefined : 'clients-page-title'}
    >
      <section
        className={
          embedded ? `${css.card} ${css.embeddedStatisticsCard}` : css.card
        }
        aria-label={embedded ? 'Client statistics' : undefined}
        aria-labelledby={embedded ? undefined : 'clients-page-title'}
      >
        {!embedded ? (
          <PageHeader
            title={
              <span className={css.titleWithHelp}>
                Clients
                <InfoTooltip
                  label="About client types"
                  title="Client types"
                  icon={<UsersRound size={20} aria-hidden="true" />}
                  items={[
                    {
                      title: 'Repeat clients',
                      icon: <Repeat2 size={17} aria-hidden="true" />,
                      description: ownerScope
                        ? 'Clients who have completed two or more successful orders across your pharmacies.'
                        : 'Clients who have completed two or more successful orders in this pharmacy.',
                    },
                    {
                      title: 'Walk-in client',
                      icon: <Store size={17} aria-hidden="true" />,
                      description:
                        'The default active client created when each pharmacy first becomes Active. Use it for counter sales when a visitor has no personal account. Its photo comes from the pharmacy profile, and its purchase statistics are tracked like any other client.',
                    },
                  ]}
                />
              </span>
            }
            titleId="clients-page-title"
            icon={<Users size={23} aria-hidden="true" />}
          />
        ) : null}

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

        {clientStatisticsStatus === 'error' ? (
          <ProfileResourceState
            variant="error"
            title="Client statistics could not be loaded"
            description="Client statistics are temporarily unavailable. Please try again."
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={() => setRetryVersion((version) => version + 1)}
          />
        ) : clientStatistics ? (
          <ClientStatistics
            counts={clientStatistics}
            getStatisticHref={getClientStatisticHref}
            activeKey={
              filters.status === 'active' || filters.status === 'blocked'
                ? filters.status
                : null
            }
            className={css.clientStatistics}
          />
        ) : (
          <StatsLoadingSkeleton
            className={css.statisticsSkeleton}
            count={3}
            columns={3}
            tabletColumns={2}
            label="Loading client statistics"
          />
        )}
      </section>

      <section className={css.card} aria-labelledby="clients-search-title">
        <h2 className={css.visuallyHidden} id="clients-search-title">
          Clients search
        </h2>

        <div className={css.ownerSearchGrid}>
          <OwnerClientSearch
            embedded={embedded}
            value={filters.clientId}
            onChange={(clientId) =>
              handleFiltersChange({ ...filters, clientId })
            }
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
              fullWidthOnMobile
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
                : ownerScope
                  ? 'Your pharmacies have no clients yet.'
                  : 'Your pharmacy has no clients yet.'
            }
          />
        )}

        {clientsStatus === 'success' ? (
          <PaginationView
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const nextPath = buildClientsPath(routeFilters, basePath, {
                page,
                perPage: rowsPerPage,
              });

              if (nextPath !== canonicalInitialPath) {
                router.push(nextPath, { scroll: false });
              }
            }}
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
          resetHref={basePath}
        />
      ) : null}
    </RootElement>
  );
}

export default ClientsPageContent;
export { ClientsPageContent };
