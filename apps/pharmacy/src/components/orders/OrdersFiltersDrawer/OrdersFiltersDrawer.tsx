import {
  DELIVERY_METHODS,
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@e-pharmacy/config/orders';

import {
  ORDER_CREATED_BY_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { PHARMACY_ROUTES } from '@/lib/routes';

import type { OrdersFilterState } from '@/lib/orders/orders-filters';

//===================================================================

type OrdersFiltersDrawerProps = Readonly<{
  filters: OrdersFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (filters: OrdersFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const DELIVERY_METHOD_OPTIONS: Array<
  SelectOption<OrdersFilterState['deliveryMethod']>
> = [
  { value: 'all', label: 'All' },
  ...DELIVERY_METHODS.map((deliveryMethod) => ({
    value: deliveryMethod,
    label: DELIVERY_METHOD_LABELS[deliveryMethod],
  })),
];

const PAYMENT_METHOD_OPTIONS: Array<
  SelectOption<OrdersFilterState['paymentMethod']>
> = [
  { value: 'all', label: 'All' },
  ...PAYMENT_METHODS.map((paymentMethod) => ({
    value: paymentMethod,
    label: PAYMENT_METHOD_LABELS[paymentMethod],
  })),
];

const ORDER_STATUS_OPTIONS: Array<SelectOption<OrdersFilterState['status']>> = [
  { value: 'all', label: 'All' },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_PRESENTATION[status].label,
  })),
];

const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<OrdersFilterState['createdByType']>
> = [
  { value: 'all', label: 'All' },
  ...ORDER_CREATED_BY_TYPES.map((createdByType) => ({
    value: createdByType,
    label: ORDER_CREATED_BY_LABELS[createdByType],
  })),
];

//===================================================================

function OrdersFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  onChange,
  onClose,
  onReset,
}: OrdersFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="orders-filters-panel"
      eyebrow="Orders"
      hasActiveFilters={hasActiveFilters}
      resetHref={PHARMACY_ROUTES.ORDERS}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="orders-date-filter"
        minDate={minDate}
        disabled={!minDate}
        label="Order date"
        value={filters.date}
        isActive={Boolean(filters.date.from || filters.date.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(date) => onChange({ ...filters, date })}
      />

      <SelectField
        id="orders-delivery-method"
        label="Delivery method"
        value={filters.deliveryMethod}
        options={DELIVERY_METHOD_OPTIONS}
        isActive={filters.deliveryMethod !== 'all'}
        onChange={(deliveryMethod) => onChange({ ...filters, deliveryMethod })}
      />

      <SelectField
        id="orders-payment-method"
        label="Payment method"
        value={filters.paymentMethod}
        options={PAYMENT_METHOD_OPTIONS}
        isActive={filters.paymentMethod !== 'all'}
        onChange={(paymentMethod) => onChange({ ...filters, paymentMethod })}
      />

      <SelectField
        id="orders-status"
        label="Order status"
        value={filters.status}
        options={ORDER_STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />

      <SelectField
        id="orders-created-by"
        label="Created by"
        value={filters.createdByType}
        options={ORDER_CREATED_BY_OPTIONS}
        isActive={filters.createdByType !== 'all'}
        onChange={(createdByType) => onChange({ ...filters, createdByType })}
      />
    </FilterDrawer>
  );
}

export default OrdersFiltersDrawer;
export { OrdersFiltersDrawer };
