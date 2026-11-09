import { CheckCircle2, CircleMinus, Repeat2 } from 'lucide-react';

import { CLIENT_ACCOUNT_STATUSES } from '@e-pharmacy/config/users';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { getBusinessCalendarDate } from '@e-pharmacy/utils/date';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES } from '@/lib/clients/config';
import { CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS } from '@/lib/clients/config';
import type { ClientsFilterState } from '@/lib/clients/client-paths';

import css from './ClientsFiltersDrawer.module.css';

//===================================================================

type ClientsFiltersDrawerProps = Readonly<{
  filters: ClientsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  maxDate?: string;
  availableDates?: readonly string[];
  onChange: (filters: ClientsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
  resetHref?: string;
  includeSuccessfulOrders?: boolean;
}>;

//===================================================================

const CLIENT_STATUS_OPTIONS: Array<SelectOption<ClientsFilterState['status']>> =
  [
    { value: 'all', label: 'All statuses' },

    ...CLIENT_ACCOUNT_STATUSES.map((status) => ({
      value: status,
      label: USER_STATUS_PRESENTATION[status].label,
      content: <StatusBadge {...USER_STATUS_PRESENTATION[status]} />,
    })),
  ];

//===================================================================

const SUCCESSFUL_ORDERS_OPTIONS: Array<
  SelectOption<ClientsFilterState['successfulOrders']>
> = [
  {
    value: 'all',
    label: 'All',
  },

  ...CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES.map((filter) => ({
    value: filter,
    label: CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS[filter],

    content: (
      <span className={css.orderOption}>
        <span className={css.orderIcon}>
          {filter === 'successful' ? (
            <CheckCircle2 size={15} aria-hidden="true" />
          ) : filter === 'repeat' ? (
            <Repeat2 size={15} aria-hidden="true" />
          ) : (
            <CircleMinus size={15} aria-hidden="true" />
          )}
        </span>
        {CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS[filter]}
      </span>
    ),
  })),
];

//===================================================================

function ClientsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  maxDate,
  availableDates,
  onChange,
  onClose,
  onReset,
  resetHref = PHARMACY_ROUTES.CLIENTS,
  includeSuccessfulOrders = true,
}: ClientsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="clients-filters-panel"
      eyebrow="Clients"
      hasActiveFilters={hasActiveFilters}
      resetHref={resetHref}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="clients-first-order-date-filter"
        minDate={minDate}
        maxDate={maxDate ?? getBusinessCalendarDate() ?? undefined}
        availableDates={availableDates}
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

      {includeSuccessfulOrders ? (
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
      ) : null}
    </FilterDrawer>
  );
}

export default ClientsFiltersDrawer;
export { ClientsFiltersDrawer };
