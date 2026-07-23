import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/products';
import { getPharmacyProductsPath } from '@e-pharmacy/config/pharmacy';

import {
  OWN_PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  STOCK_AVAILABILITY_FILTERS,
  STOCK_AVAILABILITY_LABELS,
} from '@/lib/products/products';

import type { OwnProductsFilterState } from '@/lib/products/own-products-filters';

//===================================================================

type OwnProductsFiltersDrawerProps = Readonly<{
  filters: OwnProductsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (filters: OwnProductsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const CATEGORY_OPTIONS: Array<
  SelectOption<OwnProductsFilterState['category']>
> = [
  { value: 'all', label: 'All' },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: PRODUCT_CATEGORY_LABELS[category],
  })),
];

const STATUS_OPTIONS: Array<SelectOption<OwnProductsFilterState['status']>> = [
  { value: 'all', label: 'All' },
  ...OWN_PRODUCT_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
  })),
];

const STOCK_OPTIONS: Array<SelectOption<OwnProductsFilterState['stock']>> = [
  { value: 'all', label: 'All' },
  ...STOCK_AVAILABILITY_FILTERS.map((stock) => ({
    value: stock,
    label: STOCK_AVAILABILITY_LABELS[stock],
  })),
];

//===================================================================

function OwnProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  onChange,
  onClose,
  onReset,
}: OwnProductsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="own-products-filters-panel"
      eyebrow="Own products"
      hasActiveFilters={hasActiveFilters}
      resetHref={getPharmacyProductsPath()}
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
        options={CATEGORY_OPTIONS}
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
