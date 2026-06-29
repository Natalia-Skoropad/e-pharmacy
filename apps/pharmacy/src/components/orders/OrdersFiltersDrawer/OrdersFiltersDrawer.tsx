import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SearchInput,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import { getPharmacyOrdersPath } from '@/lib/pharmacy/routes';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/pharmacy/orders';

import type { OrdersFilterState } from '@/components/orders/OrdersPageContent';

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
  { value: 'pickup', label: DELIVERY_METHOD_LABELS.pickup },
  { value: 'postal_delivery', label: DELIVERY_METHOD_LABELS.postal_delivery },
];

const PAYMENT_METHOD_OPTIONS: Array<
  SelectOption<OrdersFilterState['paymentMethod']>
> = [
  { value: 'all', label: 'All' },
  { value: 'cash', label: PAYMENT_METHOD_LABELS.cash },
  { value: 'bank_transfer', label: PAYMENT_METHOD_LABELS.bank_transfer },
];

const ORDER_STATUS_OPTIONS: Array<SelectOption<OrdersFilterState['status']>> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'successful', label: 'Successful' },
  { value: 'rejected', label: 'Rejected' },
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

          <SearchInput
            id="orders-client-search"
            label="Client search"
            value={filters.client}
            placeholder="Client name"
            isActive={Boolean(filters.client)}
            onChange={(client) => onChange({ ...filters, client })}
          />

          <SearchInput
            id="orders-number-search"
            label="Order number search"
            value={filters.orderNumber}
            placeholder="Order number"
            isActive={Boolean(filters.orderNumber)}
            onChange={(orderNumber) => onChange({ ...filters, orderNumber })}
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
