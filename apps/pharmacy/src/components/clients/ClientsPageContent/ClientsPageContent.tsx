'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { ClientStatistics, StatusBanner } from '@e-pharmacy/ui/statistics';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import { getPharmacyClients } from '@/lib/api/browser';
import { getPharmacyClientStatistics } from '@/lib/clients/client-statistics';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  type ClientsFilterState,
} from '@/lib/clients/client-paths';

import type {
  PharmacyClientRow,
  PharmacyClientsQueryParams,
} from '@/lib/clients/clients';

import {
  DEFAULT_CLIENT_STATISTICS,
  type ClientStatisticsCounts,
  type ClientStatisticsKey,
} from '@e-pharmacy/types/clients';

import { ClientsFiltersDrawer } from '@/components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer';
import { ClientsTable } from '@/components/clients/ClientsTable/ClientsTable';

import {
  getPharmacyClientsFilterPath,
  getPharmacyClientsPath,
} from '@/lib/layout/routes';

import css from './ClientsPageContent.module.css';

//===================================================================

function getActiveFiltersCount(filters: ClientsFilterState): number {
  return [
    filters.firstOrderDate.from || filters.firstOrderDate.to,
    filters.name.trim(),
    filters.clientId.trim(),
    filters.contact.trim(),
    filters.status !== 'all',
    filters.successfulOrders !== 'all',
  ].filter(Boolean).length;
}

//===================================================================

function getClientsQueryParams(
  filters: ClientsFilterState,
  rowsPerPage: RowsPerPageValue
): PharmacyClientsQueryParams {
  return {
    page: 1,
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
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [clientStatistics, setClientStatistics] =
    useState<ClientStatisticsCounts>(DEFAULT_CLIENT_STATISTICS);
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
    () => getClientsQueryParams(filters, rowsPerPage),
    [filters, rowsPerPage]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      setIsLoading(true);

      try {
        const response = await getPharmacyClients(queryParams);
        if (!isMounted) return;

        setClients(response.items);
        setTotalClients(response.total);
      } catch {
        if (!isMounted) return;

        setClients([]);
        setTotalClients(0);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadClients();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  useEffect(() => {
    const nextPath = buildClientsPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: ClientsFilterState) => {
    setFilters(nextFilters);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_CLIENTS_FILTERS);
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

  return (
    <main className={css.page} aria-labelledby="clients-page-title">
      <section className={css.card} aria-labelledby="clients-page-title">
        <PageHeader
          title="Clients"
          titleId="clients-page-title"
          icon={<Users size={23} aria-hidden="true" />}
        />

        <StatusBanner
          status="new"
          label="New"
          title="Verification is required"
          message="Client data is connected only to real pharmacy orders, so a new pharmacy starts with an empty client table."
        />

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
          <CountLabel
            className={css.countLabel}
            shown={clients.length}
            total={totalClients}
            label="clients"
          />

          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="clients-rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            />
          </div>
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
      </section>

      {isFiltersOpen ? (
        <ClientsFiltersDrawer
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

export default ClientsPageContent;
export { ClientsPageContent };
