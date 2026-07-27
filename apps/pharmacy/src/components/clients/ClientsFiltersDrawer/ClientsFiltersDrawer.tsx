import { USER_STATUSES } from '@e-pharmacy/config/users';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES } from '@/lib/clients/config';
import { CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS } from '@/lib/clients/config';
import type { ClientsFilterState } from '@/lib/clients/client-paths';

//===================================================================

type ClientsFiltersDrawerProps = Readonly<{
  filters: ClientsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (filters: ClientsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const CLIENT_STATUS_OPTIONS: Array<SelectOption<ClientsFilterState['status']>> =
  [
    { value: 'all', label: 'All' },
    ...USER_STATUSES.map((status) => ({
      value: status,
      label: USER_STATUS_PRESENTATION[status].label,
    })),
  ];

const SUCCESSFUL_ORDERS_OPTIONS: Array<
  SelectOption<ClientsFilterState['successfulOrders']>
> = [
  { value: 'all', label: 'All' },
  ...CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES.map((filter) => ({
    value: filter,
    label: CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS[filter],
  })),
];

//===================================================================

function ClientsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  onChange,
  onClose,
  onReset,
}: ClientsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="clients-filters-panel"
      eyebrow="Clients"
      hasActiveFilters={hasActiveFilters}
      resetHref={PHARMACY_ROUTES.CLIENTS}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="clients-first-order-date-filter"
        minDate={minDate}
        disabled={!minDate}
        label="Client added"
        value={filters.firstOrderDate}
        isActive={Boolean(
          filters.firstOrderDate.from || filters.firstOrderDate.to
        )}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(firstOrderDate) => onChange({ ...filters, firstOrderDate })}
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
    </FilterDrawer>
  );
}

export default ClientsFiltersDrawer;
export { ClientsFiltersDrawer };
