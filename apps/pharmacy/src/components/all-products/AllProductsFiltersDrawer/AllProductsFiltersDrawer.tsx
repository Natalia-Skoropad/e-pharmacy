import type { ReactNode } from 'react';
import { Boxes, PackageX } from 'lucide-react';

import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import { CategoryIcon } from '@e-pharmacy/ui/forms';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { OWN_PRODUCT_STATUSES } from '@/lib/products/products';
import type { AllProductsFilterState } from '@/lib/products/all-products-filters';

import css from './AllProductsFiltersDrawer.module.css';

//===================================================================

type AllProductsFiltersDrawerProps = Readonly<{
  filters: AllProductsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;

  categoryOptions: readonly (SelectOption<
    AllProductsFilterState['category']
  > & {
    icon?: string;
  })[];

  onChange: (filters: AllProductsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

function renderIconOption(label: string, icon: ReactNode) {
  return (
    <span className={css.optionWithIcon}>
      <span className={css.optionIcon}>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

//===================================================================

const STATUS_OPTIONS: Array<SelectOption<AllProductsFilterState['status']>> = [
  { value: 'all', label: 'All statuses' },

  ...OWN_PRODUCT_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...PRODUCT_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

const ADDED_TO_MY_PHARMACY_OPTIONS: Array<
  SelectOption<AllProductsFilterState['addedToMyPharmacy']>
> = [
  { value: 'all', label: 'All products' },
  {
    value: 'yes',
    label: 'Added to my pharmacies',

    content: renderIconOption(
      'Added to my pharmacies',
      <Boxes size={16} aria-hidden="true" />
    ),
  },
  {
    value: 'no',
    label: 'Not added to my pharmacies',

    content: renderIconOption(
      'Not added to my pharmacies',
      <PackageX size={16} aria-hidden="true" />
    ),
  },
];

//===================================================================

function AllProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  categoryOptions,
  onChange,
  onClose,
  onReset,
}: AllProductsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="all-products-filters-panel"
      eyebrow="All products"
      hasActiveFilters={hasActiveFilters}
      resetHref={PHARMACY_ROUTES.ALL_PRODUCTS}
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
        options={categoryOptions.map((option) => ({
          ...option,
          content:
            option.value === 'all'
              ? undefined
              : renderIconOption(
                  option.label,
                  <CategoryIcon name={option.icon} size={16} />
                ),
        }))}
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
        label="Added to my pharmacies"
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
