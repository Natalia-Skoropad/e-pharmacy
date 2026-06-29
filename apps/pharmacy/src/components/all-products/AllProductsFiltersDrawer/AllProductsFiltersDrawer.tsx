import type { MouseEventHandler } from 'react';

import {
  CloseIconButton,
  DateFilter,
  ResetFiltersButton,
  SearchInput,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';

import { getPharmacyAllProductsPath } from '@/lib/pharmacy/routes';

import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  STOCK_AVAILABILITY_LABELS,
} from '@/lib/pharmacy/products';

import type { AllProductsFilterState } from '@/components/all-products/AllProductsPageContent';

import css from './AllProductsFiltersDrawer.module.css';

//===================================================================

type AllProductsFiltersDrawerProps = Readonly<{
  filters: AllProductsFilterState;
  hasActiveFilters: boolean;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
  onChange: (filters: AllProductsFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

const CATEGORY_OPTIONS: Array<SelectOption<AllProductsFilterState['category']>> = [
  { value: 'all', label: 'All' },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: PRODUCT_CATEGORY_LABELS[category],
  })),
];

const STATUS_OPTIONS: Array<SelectOption<AllProductsFilterState['status']>> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: PRODUCT_STATUS_LABELS.active },
  { value: 'blocked', label: PRODUCT_STATUS_LABELS.blocked },
];

const STOCK_OPTIONS: Array<SelectOption<AllProductsFilterState['stock']>> = [
  { value: 'all', label: 'All' },
  { value: 'available', label: STOCK_AVAILABILITY_LABELS.available },
  { value: 'empty', label: STOCK_AVAILABILITY_LABELS.empty },
];

//===================================================================

function AllProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: AllProductsFiltersDrawerProps) {
  return (
    <div
      className={css.backdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.panel}
        id="all-products-filters-panel"
        aria-labelledby="all-products-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.header}>
          <div>
            <p className={css.kicker}>All products</p>
            <h2 className={css.title} id="all-products-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.controls}>
          <DateFilter
            id="all-products-created-date-filter"
            label="Created date"
            value={filters.createdDate}
            isActive={Boolean(
              filters.createdDate.from || filters.createdDate.to
            )}
            onChange={(createdDate) => onChange({ ...filters, createdDate })}
          />

          <SearchInput
            id="all-products-name-search"
            label="Name search"
            value={filters.name}
            placeholder="Product name"
            isActive={Boolean(filters.name)}
            onChange={(name) => onChange({ ...filters, name })}
          />

          <SearchInput
            id="all-products-article-search"
            label="Article search"
            value={filters.article}
            placeholder="Product article"
            isActive={Boolean(filters.article)}
            onChange={(article) => onChange({ ...filters, article })}
          />

          <SelectField
            id="all-products-category"
            label="Category"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            isActive={filters.category !== 'all'}
            onChange={(category) => onChange({ ...filters, category })}
          />

          <SelectField
            id="all-products-status"
            label="Status"
            value={filters.status}
            options={STATUS_OPTIONS}
            isActive={filters.status !== 'all'}
            onChange={(status) => onChange({ ...filters, status })}
          />

          <SelectField
            id="all-products-stock"
            label="Stock availability"
            value={filters.stock}
            options={STOCK_OPTIONS}
            isActive={filters.stock !== 'all'}
            onChange={(stock) => onChange({ ...filters, stock })}
          />
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={getPharmacyAllProductsPath()}
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

export default AllProductsFiltersDrawer;
export { AllProductsFiltersDrawer };
