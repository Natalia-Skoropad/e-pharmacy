import { Archive, PackageX, ShoppingBag, Warehouse } from 'lucide-react';

import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  CategoryIcon,
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  OWN_PRODUCT_STATUSES,
  STOCK_AVAILABILITY_FILTERS,
  STOCK_AVAILABILITY_LABELS,
} from '@/lib/products/products';

import type { OwnProductsFilterState } from '@/lib/products/own-products-filters';

import css from './OwnProductsFiltersDrawer.module.css';

//===================================================================

type OwnProductsFiltersDrawerProps = Readonly<{
  filters: OwnProductsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;

  categoryOptions: readonly (SelectOption<
    OwnProductsFilterState['category']
  > & { icon?: string })[];

  onChange: (filters: OwnProductsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const STATUS_OPTIONS: Array<SelectOption<OwnProductsFilterState['status']>> = [
  { value: 'all', label: 'All statuses' },

  ...OWN_PRODUCT_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...PRODUCT_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

const STOCK_ICONS = {
  'in-stock': Warehouse,
  available: Archive,
  reserved: ShoppingBag,
  empty: PackageX,
} as const;

//===================================================================

const STOCK_OPTIONS: Array<SelectOption<OwnProductsFilterState['stock']>> = [
  { value: 'all', label: 'All' },

  ...STOCK_AVAILABILITY_FILTERS.map((stock) => {
    const Icon = STOCK_ICONS[stock];

    return {
      value: stock,
      label: STOCK_AVAILABILITY_LABELS[stock],

      content: (
        <span className={css.optionWithIcon}>
          <span className={css.optionIcon}>
            <Icon size={16} aria-hidden="true" />
          </span>
          <span>{STOCK_AVAILABILITY_LABELS[stock]}</span>
        </span>
      ),
    };
  }),
];

//===================================================================

function OwnProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  categoryOptions,
  onChange,
  onClose,
  onReset,
}: OwnProductsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="own-products-filters-panel"
      eyebrow="Own products"
      hasActiveFilters={hasActiveFilters}
      resetHref={PHARMACY_ROUTES.PRODUCTS}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="own-products-added-date-filter"
        minDate={minDate}
        disabled={!minDate}
        label="Added date"
        value={filters.createdDate}
        isActive={Boolean(filters.createdDate.from || filters.createdDate.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(createdDate) => onChange({ ...filters, createdDate })}
      />

      <SelectField
        id="own-products-category"
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
        id="own-products-status"
        label="Product status"
        value={filters.status}
        options={STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />

      <SelectField
        id="own-products-stock"
        label="Stock availability"
        value={filters.stock}
        options={STOCK_OPTIONS}
        isActive={filters.stock !== 'all'}
        onChange={(stock) => onChange({ ...filters, stock })}
      />
    </FilterDrawer>
  );
}

export default OwnProductsFiltersDrawer;
export { OwnProductsFiltersDrawer };
