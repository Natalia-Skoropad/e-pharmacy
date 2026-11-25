import type { ReactNode } from 'react';
import { Settings, RefreshCw } from 'lucide-react';

import {
  DateFilter,
  SelectField,
  CategoryIcon,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { Button } from '@e-pharmacy/ui/primitives';

import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type { ProductRequestsFilterState } from '@/lib/product-requests/admin-product-requests';
import { CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER } from '@/lib/product-requests/admin-product-requests';

import css from './AdminProductRequestsList.module.css';

//===================================================================

type ProductRequestsFiltersDrawerProps = Readonly<{
  filters: ProductRequestsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;

  categoryOptions: readonly (SelectOption<
    ProductRequestsFilterState['category']
  > & { icon?: string })[];

  categoryLoading: boolean;
  categoryError: boolean;
  onRetryCategories: () => void;
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
  categoryLoading,
  categoryError,
  onRetryCategories,
  onChange,
  onClose,
  onReset,
}: ProductRequestsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="product-requests-filters-panel"
      eyebrow="Product requests"
      hasActiveFilters={hasActiveFilters}
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
        disabled={categoryLoading || categoryError}
        value={filters.category}
        options={categoryOptions.map((option) => ({
          ...option,

          content:
            option.value === 'all' || !option.icon
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

      {categoryLoading ? (
        <p role="status">Loading product categories...</p>
      ) : categoryError ? (
        <div role="alert">
          <p>Product categories could not be loaded.</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            iconLeft={<RefreshCw size={16} aria-hidden="true" />}
            onClick={onRetryCategories}
          >
            Try again
          </Button>
        </div>
      ) : null}

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
