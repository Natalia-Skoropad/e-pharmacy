import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SearchInput,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from '@e-pharmacy/types/products';

import { getPharmacyProductRequestsPath } from '@/lib/pharmacy/routes';

import {
  PRODUCT_REQUEST_CATEGORY_LABELS,
  PRODUCT_REQUEST_STATUS_LABELS,
} from '@/lib/pharmacy/product-requests';

import type { ProductRequestsFilterState } from '@/components/product-requests/ProductRequestsPageContent';

import css from './ProductRequestsFiltersDrawer.module.css';

//===================================================================

type ProductRequestsFiltersDrawerProps = Readonly<{
  filters: ProductRequestsFilterState;
  hasActiveFilters: boolean;
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
    label: PRODUCT_REQUEST_CATEGORY_LABELS[category],
  })),
];

const STATUS_OPTIONS: Array<
  SelectOption<ProductRequestsFilterState['status']>
> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: PRODUCT_REQUEST_STATUS_LABELS.draft },
  { value: 'new', label: PRODUCT_REQUEST_STATUS_LABELS.new },
  { value: 'in_progress', label: PRODUCT_REQUEST_STATUS_LABELS.in_progress },
  { value: 'approved', label: PRODUCT_REQUEST_STATUS_LABELS.approved },
  { value: 'rejected', label: PRODUCT_REQUEST_STATUS_LABELS.rejected },
];

//===================================================================

function ProductRequestsFiltersDrawer({
  filters,
  hasActiveFilters,
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
            label="Created date"
            value={filters.date}
            isActive={Boolean(filters.date.from || filters.date.to)}
            onChange={(date) => onChange({ ...filters, date })}
          />

          <SearchInput
            id="product-requests-name-search"
            label="Name search"
            value={filters.name}
            placeholder="Request name"
            isActive={Boolean(filters.name)}
            onChange={(name) => onChange({ ...filters, name })}
          />

          <SearchInput
            id="product-requests-article-search"
            label="Article search"
            value={filters.article}
            placeholder="Article"
            isActive={Boolean(filters.article)}
            onChange={(article) => onChange({ ...filters, article })}
          />

          <SelectField
            id="product-requests-category"
            label="Category"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            isActive={filters.category !== 'all'}
            onChange={(category) => onChange({ ...filters, category })}
          />

          <SelectField
            id="product-requests-status"
            label="Status"
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
