import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';

import {
  DateFilter,
  SelectField,
  CategoryIcon,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type { ProductRequestsFilterState } from '@/lib/product-requests/product-requests';
import { CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER } from '@/lib/product-requests/product-requests';
import { PHARMACY_ROUTES } from '@/lib/routes';

import css from '@/components/all-products/AllProductsFiltersDrawer/AllProductsFiltersDrawer.module.css';

//===================================================================

type ProductRequestsFiltersDrawerProps = Readonly<{
  filters: ProductRequestsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  categoryOptions: readonly (SelectOption<
    ProductRequestsFilterState['category']
  > & { icon?: string })[];
  onChange: (filters: ProductRequestsFilterState) => void;
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

const STATUS_OPTIONS: Array<
  SelectOption<ProductRequestsFilterState['status']>
> = [
  { value: 'all', label: 'All statuses' },

  ...PRODUCT_REQUEST_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_REQUEST_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...PRODUCT_REQUEST_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

function ProductRequestsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  categoryOptions,
  onChange,
  onClose,
  onReset,
}: ProductRequestsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="product-requests-filters-panel"
      eyebrow="Product requests"
      hasActiveFilters={hasActiveFilters}
      resetHref={PHARMACY_ROUTES.PRODUCT_REQUESTS}
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
        options={categoryOptions.map((option) => ({
          ...option,

          content:
            option.value === 'all'
              ? undefined
              : renderIconOption(
                  option.label,
                  option.value === CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER ? (
                    <Settings size={16} aria-hidden="true" />
                  ) : (
                    <CategoryIcon name={option.icon} size={16} />
                  )
                ),
        }))}
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
