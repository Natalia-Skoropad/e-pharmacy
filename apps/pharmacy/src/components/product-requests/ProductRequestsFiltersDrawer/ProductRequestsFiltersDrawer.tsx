import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from '@e-pharmacy/types/products';

import {
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_STATUS_LABELS,
  type ProductRequestsFilterState,
} from '@e-pharmacy/types/product-requests';

import { getPharmacyProductRequestsPath } from '@/lib/layout/routes';

import css from './ProductRequestsFiltersDrawer.module.css';

//===================================================================

type ProductRequestsFiltersDrawerProps = Readonly<{
  filters: ProductRequestsFilterState;
  hasActiveFilters: boolean;
  minDate?: string;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
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
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: ProductRequestsFiltersDrawerProps) {
  return (
    <div
      className={css.backdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.panel}
        id="product-requests-filters-panel"
        aria-labelledby="product-requests-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.header}>
          <div>
            <p className={css.kicker}>Product requests</p>
            <h2 className={css.title} id="product-requests-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.controls}>
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
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={getPharmacyProductRequestsPath()}
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

export default ProductRequestsFiltersDrawer;
export { ProductRequestsFiltersDrawer };
