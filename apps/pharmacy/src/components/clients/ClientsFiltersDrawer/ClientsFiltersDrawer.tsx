import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import {
  CLIENT_SUCCESSFUL_ORDERS_FILTER_LABELS,
  CLIENT_SUCCESSFUL_ORDERS_FILTERS,
} from '@e-pharmacy/types/clients';

import { getPharmacyClientsPath } from '@/lib/layout/routes';
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS } from '@/lib/clients/clients';
import type { ClientsFilterState } from '@/lib/clients/client-paths';

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
    ...CLIENT_STATUSES.map((status) => ({
      value: status,
      label: CLIENT_STATUS_LABELS[status],
    })),
  ];

const SUCCESSFUL_ORDERS_OPTIONS: Array<
  SelectOption<ClientsFilterState['successfulOrders']>
> = [
  { value: 'all', label: 'All' },
  ...CLIENT_SUCCESSFUL_ORDERS_FILTERS.map((filter) => ({
    value: filter,
    label: CLIENT_SUCCESSFUL_ORDERS_FILTER_LABELS[filter],
  })),
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
            label="Client added"
            value={filters.firstOrderDate}
            isActive={Boolean(
              filters.firstOrderDate.from || filters.firstOrderDate.to
            )}
            applyOnSubmit
            applyLabel="Apply"
            onChange={(firstOrderDate) =>
              onChange({ ...filters, firstOrderDate })
            }
          />

          <SelectField
            id="clients-status"
            label="Client status"
            value={filters.status}
            options={CLIENT_STATUS_OPTIONS}
            isActive={filters.status !== 'all'}
            onChange={(status) => onChange({ ...filters, status })}
          />

          <SelectField
            id="clients-successful-orders"
            label="Successful orders"
            value={filters.successfulOrders}
            options={SUCCESSFUL_ORDERS_OPTIONS}
            isActive={filters.successfulOrders !== 'all'}
            onChange={(successfulOrders) =>
              onChange({ ...filters, successfulOrders })
            }
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
