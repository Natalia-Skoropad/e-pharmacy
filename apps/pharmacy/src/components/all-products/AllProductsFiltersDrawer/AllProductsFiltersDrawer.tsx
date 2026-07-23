import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/products';
import { getPharmacyAllProductsPath } from '@e-pharmacy/config/pharmacy';

import {
  OWN_PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
} from '@/lib/products/products';

import type { AllProductsFilterState } from '@/lib/products/all-products-filters';

//===================================================================

type AllProductsFiltersDrawerProps = Readonly<{
  filters: AllProductsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (filters: AllProductsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const CATEGORY_OPTIONS: Array<
  SelectOption<AllProductsFilterState['category']>
> = [
  { value: 'all', label: 'All' },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: PRODUCT_CATEGORY_LABELS[category],
  })),
];

const STATUS_OPTIONS: Array<SelectOption<AllProductsFilterState['status']>> = [
  { value: 'all', label: 'All' },
  ...OWN_PRODUCT_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
  })),
];

const ADDED_TO_MY_PHARMACY_OPTIONS: Array<
  SelectOption<AllProductsFilterState['addedToMyPharmacy']>
> = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Added to my pharmacy' },
  { value: 'no', label: 'Not added to my pharmacy' },
];

//===================================================================

function AllProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  onChange,
  onClose,
  onReset,
}: AllProductsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="all-products-filters-panel"
      eyebrow="All products"
      hasActiveFilters={hasActiveFilters}
      resetHref={getPharmacyAllProductsPath()}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="all-products-created-date-filter"
        minDate={minDate}
        disabled={!minDate}
        label="Created date"
        value={filters.createdDate}
        isActive={Boolean(filters.createdDate.from || filters.createdDate.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(createdDate) => onChange({ ...filters, createdDate })}
      />

      <SelectField
        id="all-products-category"
        label="Product category"
        value={filters.category}
        options={CATEGORY_OPTIONS}
        isActive={filters.category !== 'all'}
        onChange={(category) => onChange({ ...filters, category })}
      />

      <SelectField
        id="all-products-status"
        label="Product status"
        value={filters.status}
        options={STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />

      <SelectField
        id="all-products-added-to-my-pharmacy"
        label="Added to my pharmacy"
        value={filters.addedToMyPharmacy}
        options={ADDED_TO_MY_PHARMACY_OPTIONS}
        isActive={filters.addedToMyPharmacy !== 'all'}
        onChange={(addedToMyPharmacy) =>
          onChange({ ...filters, addedToMyPharmacy })
        }
      />
    </FilterDrawer>
  );
}

export default AllProductsFiltersDrawer;
export { AllProductsFiltersDrawer };
