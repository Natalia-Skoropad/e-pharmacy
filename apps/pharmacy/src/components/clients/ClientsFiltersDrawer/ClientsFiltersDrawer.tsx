import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SearchInput,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import { getPharmacyClientsPath } from '@/lib/pharmacy/routes';

import type { ClientsFilterState } from '@/components/clients/ClientsPageContent';

import css from './ClientsFiltersDrawer.module.css';

//===================================================================

type ClientsFiltersDrawerProps = Readonly<{
  filters: ClientsFilterState;
  hasActiveFilters: boolean;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
  onChange: (filters: ClientsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const CLIENT_STATUS_OPTIONS: Array<SelectOption<ClientsFilterState['status']>> =
  [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
  ];

//===================================================================

function ClientsFiltersDrawer({
  filters,
  hasActiveFilters,
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: ClientsFiltersDrawerProps) {
  return (
    <div
      className={css.backdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.panel}
        id="clients-filters-panel"
        aria-labelledby="clients-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.header}>
          <div>
            <p className={css.kicker}>Clients</p>
            <h2 className={css.title} id="clients-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.controls}>
          <DateFilter
            id="clients-first-order-date-filter"
            label="Order date"
            value={filters.firstOrderDate}
            isActive={Boolean(
              filters.firstOrderDate.from || filters.firstOrderDate.to
            )}
            onChange={(firstOrderDate) =>
              onChange({ ...filters, firstOrderDate })
            }
          />

          <SearchInput
            id="clients-name-search"
            label="Name search"
            value={filters.name}
            placeholder="Client name"
            isActive={Boolean(filters.name)}
            onChange={(name) => onChange({ ...filters, name })}
          />

          <SearchInput
            id="clients-id-search"
            label="Client ID search"
            value={filters.clientId}
            placeholder="Client ID"
            isActive={Boolean(filters.clientId)}
            onChange={(clientId) => onChange({ ...filters, clientId })}
          />

          <SearchInput
            id="clients-email-search"
            label="Email search"
            value={filters.email}
            placeholder="Client email"
            isActive={Boolean(filters.email)}
            onChange={(email) => onChange({ ...filters, email })}
          />

          <SearchInput
            id="clients-phone-search"
            label="Phone search"
            value={filters.phone}
            placeholder="Client phone"
            isActive={Boolean(filters.phone)}
            onChange={(phone) => onChange({ ...filters, phone })}
          />

          <SearchInput
            id="clients-address-search"
            label="Address search"
            value={filters.address}
            placeholder="Client address"
            isActive={Boolean(filters.address)}
            onChange={(address) => onChange({ ...filters, address })}
          />

          <SelectField
            id="clients-status"
            label="Status"
            value={filters.status}
            options={CLIENT_STATUS_OPTIONS}
            isActive={filters.status !== 'all'}
            onChange={(status) => onChange({ ...filters, status })}
          />
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={getPharmacyClientsPath()}
            onClick={() => {
              onReset();
              onClose();
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}

export default ClientsFiltersDrawer;
export { ClientsFiltersDrawer };
