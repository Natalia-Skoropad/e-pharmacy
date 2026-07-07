import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import { getPharmacyOrdersPath } from '@/lib/layout/routes';

import {
  DELIVERY_METHOD_LABELS,
  DELIVERY_METHODS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from '@/lib/orders/orders';

import type { OrdersFilterState } from '@/lib/orders/orders-filters';

import css from './OrdersFiltersDrawer.module.css';

//===================================================================

type OrdersFiltersDrawerProps = Readonly<{
  filters: OrdersFilterState;
  hasActiveFilters: boolean;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
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
    label: ORDER_STATUS_LABELS[status],
  })),
];

//===================================================================

function OrdersFiltersDrawer({
  filters,
  hasActiveFilters,
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: OrdersFiltersDrawerProps) {
  return (
    <div
      className={css.backdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.panel}
        id="orders-filters-panel"
        aria-labelledby="orders-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.header}>
          <div>
            <p className={css.kicker}>Orders</p>
            <h2 className={css.title} id="orders-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.controls}>
          <DateFilter
            id="orders-date-filter"
            label="Order date"
            value={filters.date}
            isActive={Boolean(filters.date.from || filters.date.to)}
            onChange={(date) => onChange({ ...filters, date })}
          />

          <SelectField
            id="orders-delivery-method"
            label="Delivery method"
            value={filters.deliveryMethod}
            options={DELIVERY_METHOD_OPTIONS}
            isActive={filters.deliveryMethod !== 'all'}
            onChange={(deliveryMethod) =>
              onChange({ ...filters, deliveryMethod })
            }
          />

          <SelectField
            id="orders-payment-method"
            label="Payment method"
            value={filters.paymentMethod}
            options={PAYMENT_METHOD_OPTIONS}
            isActive={filters.paymentMethod !== 'all'}
            onChange={(paymentMethod) =>
              onChange({ ...filters, paymentMethod })
            }
          />

          <SelectField
            id="orders-status"
            label="Status"
            value={filters.status}
            options={ORDER_STATUS_OPTIONS}
            isActive={filters.status !== 'all'}
            onChange={(status) => onChange({ ...filters, status })}
          />
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={getPharmacyOrdersPath()}
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

export default OrdersFiltersDrawer;
export { OrdersFiltersDrawer };
