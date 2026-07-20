'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import {
  CountLabel,
  InfoTooltip,
  FiltersButton,
  Pagination,
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

function putDefaultClientFirst(
  clients: PharmacyClientRow[]
): PharmacyClientRow[] {
  return [...clients].sort((first, second) => {
    if (first.isDefault !== second.isDefault) {
      return first.isDefault ? -1 : 1;
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
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(null);

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
    () => getClientsQueryParams(filters, rowsPerPage, currentPage),
    [currentPage, filters, rowsPerPage]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      setIsLoading(true);

      try {
        const response = await getPharmacyClients(queryParams);
        if (!isMounted) return;

        setClients(putDefaultClientFirst(response.items));
        setTotalClients(response.total);
        setEarliestCreatedAt(response.earliestCreatedAt);
      } catch {
        if (!isMounted) return;

        setClients([]);
        setTotalClients(0);
        setEarliestCreatedAt(null);
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
  const totalPages = Math.ceil(totalClients / rowsPerPage);

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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={(page) => String(page)}
          renderLink={({
            href,
            className,
            children,
            'aria-label': ariaLabel,
          }) => (
            <button
              className={className}
              type="button"
              aria-label={ariaLabel}
              onClick={() => setCurrentPage(Number(href))}
            >
              {children}
            </button>
          )}
        />
      </section>

      {isFiltersOpen ? (
        <ClientsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
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
