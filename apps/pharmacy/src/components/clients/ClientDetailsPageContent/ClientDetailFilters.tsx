import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  CategoryIcon,
  DateFilter,
  SelectField,
  type RowsPerPageValue,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

export type { ClientProductFilters } from '@/lib/clients/client-purchased-products-paths';
import type { ClientProductFilters } from '@/lib/clients/client-purchased-products-paths';

import css from './ClientDetailFilters.module.css';

//===================================================================

export const PRODUCT_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [20, 50, 100];

//===================================================================

export const DEFAULT_PRODUCT_FILTERS: ClientProductFilters = {
  date: { from: '', to: '' },
  productId: '',
  category: 'all',
  status: 'all',
};

//===================================================================

const PRODUCT_STATUS_OPTIONS: Array<
  SelectOption<ClientProductFilters['status']>
> = [
  { value: 'all', label: 'All' },

  ...(['active', 'blocked'] as const).map((status) => ({
    value: status,
    label: PRODUCT_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...PRODUCT_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

type ClientProductsFiltersDrawerProps = Readonly<{
  filters: ClientProductFilters;
  hasActiveFilters: boolean;
  availableDates: readonly string[];

  categoryOptions: readonly (SelectOption<ClientProductFilters['category']> & {
    icon?: string;
  })[];

  onChange: (filters: ClientProductFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

export function ClientProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  availableDates,
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
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="client-products-order-date"
        minDate={availableDates[0]}
        maxDate={availableDates[availableDates.length - 1]}
        availableDates={availableDates}
        disabled={availableDates.length === 0}
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
        options={categoryOptions.map((option) => ({
          ...option,

          content:
            option.value === 'all' ? undefined : (
              <span className={css.optionWithIcon}>
                <span className={css.optionIcon}>
                  <CategoryIcon name={option.icon} size={16} />
                </span>
                <span>{option.label}</span>
              </span>
            ),
        }))}
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
