import {
  Banknote,
  Landmark,
  MapPin,
  Truck,
  UserCog,
  UserRound,
} from 'lucide-react';

import type { ReactNode } from 'react';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

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

import type { OrdersFilterState } from '@/lib/orders/orders-filters';

import css from './OrdersFiltersDrawer.module.css';

//===================================================================

type OrdersFiltersDrawerProps = Readonly<{
  filters: OrdersFilterState;
  hasActiveFilters: boolean;
  availableDates: readonly string[];
  onChange: (filters: OrdersFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

function filterOption(label: string, icon: ReactNode) {
  return (
    <span className={css.orderFilterOption}>
      <span className={css.orderFilterIcon} aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

//===================================================================

const DELIVERY_METHOD_OPTIONS: Array<
  SelectOption<OrdersFilterState['deliveryMethod']>
> = [
  { value: 'all', label: 'All' },

  ...DELIVERY_METHODS.map((deliveryMethod) => ({
    value: deliveryMethod,
    label: DELIVERY_METHOD_LABELS[deliveryMethod],

    content: filterOption(
      DELIVERY_METHOD_LABELS[deliveryMethod],
      deliveryMethod === 'pickup' ? <MapPin size={16} /> : <Truck size={16} />
    ),
  })),
];

//===================================================================

const PAYMENT_METHOD_OPTIONS: Array<
  SelectOption<OrdersFilterState['paymentMethod']>
> = [
  { value: 'all', label: 'All' },

  ...PAYMENT_METHODS.map((paymentMethod) => ({
    value: paymentMethod,
    label: PAYMENT_METHOD_LABELS[paymentMethod],

    content: filterOption(
      PAYMENT_METHOD_LABELS[paymentMethod],
      paymentMethod === 'cash' ? <Banknote size={16} /> : <Landmark size={16} />
    ),
  })),
];

//===================================================================

const ORDER_STATUS_OPTIONS: Array<SelectOption<OrdersFilterState['status']>> = [
  { value: 'all', label: 'All' },

  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...ORDER_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<OrdersFilterState['createdByType']>
> = [
  { value: 'all', label: 'All' },

  ...ORDER_CREATED_BY_TYPES.map((createdByType) => ({
    value: createdByType,
    label: ORDER_CREATED_BY_LABELS[createdByType],

    content: filterOption(
      ORDER_CREATED_BY_LABELS[createdByType],

      createdByType === 'client' ? (
        <UserRound size={16} />
      ) : (
        <UserCog size={16} />
      )
    ),
  })),
];

//===================================================================

function OrdersFiltersDrawer({
  filters,
  hasActiveFilters,
  availableDates,
  onChange,
  onClose,
  onReset,
}: OrdersFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="orders-filters-panel"
      eyebrow="Orders"
      hasActiveFilters={hasActiveFilters}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="orders-date-filter"
        minDate={availableDates[0]}
        maxDate={availableDates.at(-1)}
        availableDates={availableDates}
        disabled={availableDates.length === 0}
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
