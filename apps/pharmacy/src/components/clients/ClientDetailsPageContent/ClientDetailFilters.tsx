import {
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
} from '@e-pharmacy/config/orders';

import {
  ORDER_CREATED_BY_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
  PRODUCT_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import type {
  OrderCreatedByType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { ProductStatus } from '@e-pharmacy/types/products';
import type { ProductCategorySlug } from '@e-pharmacy/types/reference-data';

import {
  DateFilter,
  SelectField,
  type DateFilterValue,
  type RowsPerPageValue,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

//===================================================================

export type ClientProductFilters = Readonly<{
  date: DateFilterValue;
  category: 'all' | ProductCategorySlug;
  status: 'all' | ProductStatus;
}>;

export type ClientOrderFilters = Readonly<{
  date: DateFilterValue;
  status: 'all' | OrderStatus;
  deliveryMethod: 'all' | DeliveryMethod;
  paymentMethod: 'all' | PaymentMethod;
  clientCommentPresence: 'all' | 'with' | 'without';
  createdByType: 'all' | OrderCreatedByType;
}>;

//===================================================================

export const PRODUCT_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [20, 50, 100];

//===================================================================

export const DEFAULT_PRODUCT_FILTERS: ClientProductFilters = {
  date: { from: '', to: '' },
  category: 'all',
  status: 'all',
};

//===================================================================

export const DEFAULT_ORDER_FILTERS: ClientOrderFilters = {
  date: { from: '', to: '' },
  status: 'all',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  clientCommentPresence: 'all',
  createdByType: 'all',
};

//===================================================================

const ORDER_STATUS_OPTIONS: Array<SelectOption<ClientOrderFilters['status']>> =
  [
    { value: 'all', label: 'All' },

    ...ORDER_STATUSES.map((status) => ({
      value: status,
      label: ORDER_STATUS_PRESENTATION[status].label,
    })),
  ];

//===================================================================

const DELIVERY_METHOD_OPTIONS: Array<
  SelectOption<ClientOrderFilters['deliveryMethod']>
> = [
  { value: 'all', label: 'All' },
  { value: 'pickup', label: DELIVERY_METHOD_LABELS.pickup },
  { value: 'postal_delivery', label: DELIVERY_METHOD_LABELS.postal_delivery },
];

//===================================================================

const PAYMENT_METHOD_OPTIONS: Array<
  SelectOption<ClientOrderFilters['paymentMethod']>
> = [
  { value: 'all', label: 'All' },
  { value: 'cash', label: PAYMENT_METHOD_LABELS.cash },
  { value: 'bank_transfer', label: PAYMENT_METHOD_LABELS.bank_transfer },
];

//===================================================================

const CLIENT_COMMENT_OPTIONS: Array<
  SelectOption<ClientOrderFilters['clientCommentPresence']>
> = [
  { value: 'all', label: 'All' },
  { value: 'with', label: 'With client comment' },
  { value: 'without', label: 'Without client comment' },
];

//===================================================================

const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<ClientOrderFilters['createdByType']>
> = [
  { value: 'all', label: 'All' },

  ...ORDER_CREATED_BY_TYPES.map((createdByType) => ({
    value: createdByType,
    label: ORDER_CREATED_BY_LABELS[createdByType],
  })),
];

//===================================================================

const PRODUCT_STATUS_OPTIONS: Array<
  SelectOption<ClientProductFilters['status']>
> = [
  { value: 'all', label: 'All' },

  ...(Object.keys(PRODUCT_STATUS_PRESENTATION) as ProductStatus[]).map(
    (status) => ({
      value: status,
      label: PRODUCT_STATUS_PRESENTATION[status].label,
    })
  ),
];

//===================================================================

type ClientOrdersFiltersDrawerProps = Readonly<{
  filters: ClientOrderFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  resetHref: string;
  onChange: (filters: ClientOrderFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

export function ClientOrdersFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  resetHref,
  onChange,
  onClose,
  onReset,
}: ClientOrdersFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="client-orders-filters-panel"
      eyebrow="Client orders"
      hasActiveFilters={hasActiveFilters}
      resetHref={resetHref}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="client-orders-date"
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
        id="client-orders-status"
        label="Order status"
        value={filters.status}
        options={ORDER_STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />

      <SelectField
        id="client-orders-delivery"
        label="Delivery method"
        value={filters.deliveryMethod}
        options={DELIVERY_METHOD_OPTIONS}
        isActive={filters.deliveryMethod !== 'all'}
        onChange={(deliveryMethod) => onChange({ ...filters, deliveryMethod })}
      />

      <SelectField
        id="client-orders-payment"
        label="Payment method"
        value={filters.paymentMethod}
        options={PAYMENT_METHOD_OPTIONS}
        isActive={filters.paymentMethod !== 'all'}
        onChange={(paymentMethod) => onChange({ ...filters, paymentMethod })}
      />

      <SelectField
        id="client-orders-comment-presence"
        label="Client comment"
        value={filters.clientCommentPresence}
        options={CLIENT_COMMENT_OPTIONS}
        isActive={filters.clientCommentPresence !== 'all'}
        onChange={(clientCommentPresence) =>
          onChange({ ...filters, clientCommentPresence })
        }
      />

      <SelectField
        id="client-orders-created-by"
        label="Created by"
        value={filters.createdByType}
        options={ORDER_CREATED_BY_OPTIONS}
        isActive={filters.createdByType !== 'all'}
        onChange={(createdByType) => onChange({ ...filters, createdByType })}
      />
    </FilterDrawer>
  );
}

//===================================================================

type ClientProductsFiltersDrawerProps = Readonly<{
  filters: ClientProductFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  resetHref: string;
  categoryOptions: readonly SelectOption<ClientProductFilters['category']>[];
  onChange: (filters: ClientProductFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

export function ClientProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  resetHref,
  categoryOptions,
  onChange,
  onClose,
  onReset,
}: ClientProductsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="client-products-filters-panel"
      eyebrow="Client products"
      hasActiveFilters={hasActiveFilters}
      resetHref={resetHref}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="client-products-order-date"
        minDate={minDate}
        disabled={!minDate}
        label="First order date"
        value={filters.date}
        isActive={Boolean(filters.date.from || filters.date.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(date) => onChange({ ...filters, date })}
      />

      <SelectField
        id="client-products-category"
        label="Product category"
        value={filters.category}
        options={categoryOptions}
        isActive={filters.category !== 'all'}
        onChange={(category) => onChange({ ...filters, category })}
      />

      <SelectField
        id="client-products-status"
        label="Product status"
        value={filters.status}
        options={PRODUCT_STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />
    </FilterDrawer>
  );
}
