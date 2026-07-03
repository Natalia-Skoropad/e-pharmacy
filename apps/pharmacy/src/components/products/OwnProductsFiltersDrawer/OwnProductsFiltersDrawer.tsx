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
  PRODUCT_CATEGORY_LABELS,
} from '@e-pharmacy/types/products';

import { getPharmacyProductsPath } from '@/lib/layout/routes';

import {
  OWN_PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  STOCK_AVAILABILITY_FILTERS,
  STOCK_AVAILABILITY_LABELS,
} from '@/lib/products/products';

import type { OwnProductsFilterState } from '@/lib/products/own-products-filters';

import css from './OwnProductsFiltersDrawer.module.css';

//===================================================================

type OwnProductsFiltersDrawerProps = Readonly<{
  filters: OwnProductsFilterState;
  hasActiveFilters: boolean;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
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
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: OwnProductsFiltersDrawerProps) {
  return (
    <div
      className={css.backdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.panel}
        id="own-products-filters-panel"
        aria-labelledby="own-products-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.header}>
          <div>
            <p className={css.kicker}>Own products</p>
            <h2 className={css.title} id="own-products-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.controls}>
          <DateFilter
            id="own-products-added-date-filter"
            label="Added date"
            value={filters.addedDate}
            isActive={Boolean(filters.addedDate.from || filters.addedDate.to)}
            onChange={(addedDate) => onChange({ ...filters, addedDate })}
          />

          <SearchInput
            id="own-products-name-search"
            label="Name search"
            value={filters.name}
            placeholder="Product name"
            isActive={Boolean(filters.name)}
            onChange={(name) => onChange({ ...filters, name })}
          />

          <SearchInput
            id="own-products-article-search"
            label="Article search"
            value={filters.article}
            placeholder="Product article"
            isActive={Boolean(filters.article)}
            onChange={(article) => onChange({ ...filters, article })}
          />

          <SelectField
            id="own-products-category"
            label="Category"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            isActive={filters.category !== 'all'}
            onChange={(category) => onChange({ ...filters, category })}
          />

          <SelectField
            id="own-products-status"
            label="Status"
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
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={getPharmacyProductsPath()}
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

export default OwnProductsFiltersDrawer;
export { OwnProductsFiltersDrawer };
