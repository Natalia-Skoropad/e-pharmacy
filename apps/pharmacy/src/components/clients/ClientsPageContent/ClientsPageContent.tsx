'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  StatusBanner,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import { getPharmacyClients } from '@/lib/api/browser';

import type {
  ClientStatus,
  PharmacyClientRow,
  PharmacyClientsQueryParams,
} from '@/lib/clients/clients';

import { ClientsFiltersDrawer } from '@/components/clients/ClientsFiltersDrawer';
import { ClientsTable } from '@/components/clients/ClientsTable';

import css from './ClientsPageContent.module.css';

//===================================================================

type ClientStatusFilter = 'all' | ClientStatus;

//===================================================================

export type ClientsFilterState = Readonly<{
  firstOrderDate: {
    from: string;
    to: string;
  };
  name: string;
  clientId: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatusFilter;
}>;

//===================================================================

const DEFAULT_FILTERS: ClientsFilterState = {
  firstOrderDate: {
    from: '',
    to: '',
  },
  name: '',
  clientId: '',
  email: '',
  phone: '',
  address: '',
  status: 'all',
};

//===================================================================

function getActiveFiltersCount(filters: ClientsFilterState): number {
  return [
    filters.firstOrderDate.from || filters.firstOrderDate.to,
    filters.name.trim(),
    filters.clientId.trim(),
    filters.email.trim(),
    filters.phone.trim(),
    filters.address.trim(),
    filters.status !== 'all',
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
    email: filters.email.trim() || undefined,
    phone: filters.phone.trim() || undefined,
    address: filters.address.trim() || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
  };
}

//===================================================================

function ClientsPageContent() {
  const [filters, setFilters] = useState<ClientsFilterState>(DEFAULT_FILTERS);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);
  const [totalClients, setTotalClients] = useState(0);
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

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="clients-page-title">
      <div className={css.card}>
        <PageHeader
          title="Clients"
          titleId="clients-page-title"
          icon={<Users size={23} aria-hidden="true" />}
          actions={
            <CountLabel
              shown={clients.length}
              total={totalClients}
              label="clients"
            />
          }
        />

        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Verification is required"
            message="Client data is connected only to real pharmacy orders, so a new pharmacy starts with an empty client table."
          />

          <div className={css.toolbar}>
            <div className={css.toolbarActions}>
              <RowsPerPageSelect
                id="clients-rows-per-page"
                value={rowsPerPage}
                onChange={setRowsPerPage}
              />

              <FiltersButton
                activeCount={activeFiltersCount}
                controlsId="clients-filters-panel"
                isExpanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen(true)}
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
        </div>
      </div>

      {isFiltersOpen ? (
        <ClientsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onBackdropMouseDown={handleBackdropClick}
          onChange={setFilters}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </main>
  );
}

export default ClientsPageContent;
export { ClientsPageContent };
