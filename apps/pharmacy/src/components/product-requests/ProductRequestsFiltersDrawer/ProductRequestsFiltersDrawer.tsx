import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from '@e-pharmacy/types/products';

import {
  PRODUCT_REQUEST_STATUSES,
  type ProductRequestsFilterState,
} from '@e-pharmacy/types/product-requests';

import { PRODUCT_REQUEST_STATUS_LABELS } from '@e-pharmacy/config/product-requests';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/products';
import { getPharmacyProductRequestsPath } from '@e-pharmacy/config/pharmacy';

//===================================================================

type ProductRequestsFiltersDrawerProps = Readonly<{
  filters: ProductRequestsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (filters: ProductRequestsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const CATEGORY_OPTIONS: Array<
  SelectOption<ProductRequestsFilterState['category']>
> = [
  { value: 'all', label: 'All' },
  ...PRODUCT_CATEGORIES.map((category: ProductCategory) => ({
    value: category,
    label: PRODUCT_CATEGORY_LABELS[category],
  })),
];

//===================================================================

const STATUS_OPTIONS: Array<
  SelectOption<ProductRequestsFilterState['status']>
> = [
  { value: 'all', label: 'All' },
  ...PRODUCT_REQUEST_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_REQUEST_STATUS_LABELS[status],
  })),
];

//===================================================================

function ProductRequestsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  onChange,
  onClose,
  onReset,
}: ProductRequestsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="product-requests-filters-panel"
      eyebrow="Product requests"
      hasActiveFilters={hasActiveFilters}
      resetHref={getPharmacyProductRequestsPath()}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="product-requests-date-filter"
        minDate={minDate}
        disabled={!minDate}
        label="Created date"
        value={filters.date}
        isActive={Boolean(filters.date.from || filters.date.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(date) => onChange({ ...filters, date })}
      />

      <SelectField
        id="product-requests-category"
        label="Product category"
        value={filters.category}
        options={CATEGORY_OPTIONS}
        isActive={filters.category !== 'all'}
        onChange={(category) => onChange({ ...filters, category })}
      />

      <SelectField
        id="product-requests-status"
        label="Request status"
        value={filters.status}
        options={STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />
    </FilterDrawer>
  );
}

export default ProductRequestsFiltersDrawer;
export { ProductRequestsFiltersDrawer };
