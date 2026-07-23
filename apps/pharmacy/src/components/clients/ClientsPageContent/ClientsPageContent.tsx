'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import {
  CountLabel,
  InfoTooltip,
  FiltersButton,
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { getPharmacyClientsPath } from '@e-pharmacy/config/pharmacy';

import {
  DEFAULT_CLIENT_STATISTICS,
  type ClientStatisticsCounts,
  type ClientStatisticsKey,
} from '@e-pharmacy/types/clients';

import { getPharmacyClients } from '@/lib/api/browser';
import { getPharmacyClientStatistics } from '@/lib/clients/client-statistics';
import { getPharmacyClientsFilterPath } from '@/lib/layout/routes';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  type ClientsFilterState,
} from '@/lib/clients/client-paths';

import type {
  PharmacyClientRow,
  PharmacyClientsQueryParams,
} from '@/lib/clients/clients';

import { ClientStatistics } from '@/components/statistics';
import { StatusBanner } from '@/components/common/StatusPresentation';

import { ClientsFiltersDrawer } from '@/components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer';
import { ClientsTable } from '@/components/clients/ClientsTable/ClientsTable';

import css from './ClientsPageContent.module.css';

//===================================================================

function isWalkInClient(client: PharmacyClientRow): boolean {
  return (
    client.isDefault || client.name.trim().toLowerCase() === 'walk-in customer'
  );
}

//===================================================================

function putDefaultClientFirst(
  clients: PharmacyClientRow[]
): PharmacyClientRow[] {
  return [...clients].sort((first, second) => {
    const firstIsWalkIn = isWalkInClient(first);
    const secondIsWalkIn = isWalkInClient(second);

    if (firstIsWalkIn !== secondIsWalkIn) {
      return firstIsWalkIn ? -1 : 1;
    }

    return 0;
  });
}

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

type ClientsPageContentProps = Readonly<{
  initialFilters?: ClientsFilterState;
}>;

//===================================================================

function ClientsPageContent({
  initialFilters = DEFAULT_CLIENTS_FILTERS,
}: ClientsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<ClientsFilterState>(initialFilters);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const [clientStatistics, setClientStatistics] =
    useState<ClientStatisticsCounts>(DEFAULT_CLIENT_STATISTICS);

  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadClientStatistics() {
      const nextStatistics = await getPharmacyClientStatistics();
      if (isMounted) setClientStatistics(nextStatistics);
    }

    void loadClientStatistics();

    return () => {
      isMounted = false;
    };
  }, []);

  const queryParams = useMemo(
    () => getClientsQueryParams(filters, rowsPerPage, currentPage),
    [currentPage, filters, rowsPerPage]
  );
  const activeFiltersCount = countTrueConditions(
    Boolean(filters.firstOrderDate.from || filters.firstOrderDate.to),
    Boolean(filters.name.trim()),
    Boolean(filters.clientId.trim()),
    Boolean(filters.contact.trim()),
    filters.status !== 'all',
    filters.successfulOrders !== 'all'
  );
  const shouldPinDefaultClient = currentPage === 1 && activeFiltersCount === 0;

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      setIsLoading(true);

      try {
        const [response, defaultClientResponse] = await Promise.all([
          getPharmacyClients(queryParams),
          shouldPinDefaultClient
            ? getPharmacyClients({
                page: 1,
                perPage: 20,
                name: 'Walk-in customer',
              })
            : Promise.resolve(null),
        ]);
        if (!isMounted) return;

        const nextClients = putDefaultClientFirst(response.items);
        const defaultClient = defaultClientResponse?.items.find(isWalkInClient);

        if (
          defaultClient &&
          !nextClients.some((client) => client.id === defaultClient.id)
        ) {
          nextClients.unshift(defaultClient);
          nextClients.splice(rowsPerPage);
        }

        setClients(nextClients);
        setTotalClients(response.total);
        setTotalPages(response.totalPages);
        setEarliestCreatedAt(response.earliestCreatedAt);
      } catch {
        if (!isMounted) return;

        setClients([]);
        setTotalClients(0);
        setTotalPages(0);
        setEarliestCreatedAt(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadClients();

    return () => {
      isMounted = false;
    };
  }, [queryParams, rowsPerPage, shouldPinDefaultClient]);

  useEffect(() => {
    const nextPath = buildClientsPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: ClientsFilterState) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_CLIENTS_FILTERS);
    setCurrentPage(1);
  };

  const getClientStatisticHref = (key: ClientStatisticsKey) => {
    if (key === 'active') {
      return getPharmacyClientsFilterPath({ status: 'active' });
    }

    if (key === 'blocked') {
      return getPharmacyClientsFilterPath({ status: 'blocked' });
    }

    if (key === 'repeat') {
      return getPharmacyClientsFilterPath({ 'successful-orders': 'repeat' });
    }

    return getPharmacyClientsPath();
  };

  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = bannerStatus
    ? getLockedFeatureBannerLabel(bannerStatus)
    : null;

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
                      'Customers who have completed two or more successful orders in this pharmacy.',
                  },
                  {
                    title: 'Walk-in customer',
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
            status={bannerStatus}
            label={bannerLabel ?? undefined}
            title="Verification is required"
            message={
              bannerStatus === 'on_verification'
                ? 'Client data stays locked while Admin reviews the submitted pharmacy profile.'
                : 'Client data is connected only to real pharmacy orders, so a new pharmacy starts with an empty client table.'
            }
          />
        ) : null}

        <ClientStatistics
          counts={clientStatistics}
          getStatisticHref={getClientStatisticHref}
          className={css.clientStatistics}
        />
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

          <CountLabel
            className={css.countLabel}
            shown={clients.length}
            total={totalClients}
            label="clients"
          />
        </div>

        <ClientsTable
          clients={clients}
          isLoading={isLoading}
          emptyMessage={
            hasActiveFilters
              ? 'No clients found for the selected filters.'
              : 'Your pharmacy has no clients yet.'
          }
        />

        <PaginationView
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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
