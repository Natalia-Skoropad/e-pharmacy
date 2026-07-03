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
} from '@e-pharmacy/types/products';

import { getPharmacyAllProductsPath } from '@/lib/layout/routes';
import { PRODUCT_STATUS_LABELS } from '@/lib/products/products';
import type { AllProductsFilterState } from '@/lib/products/all-products-filters';

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
  { value: 'active', label: PRODUCT_STATUS_LABELS.active },
  { value: 'blocked', label: PRODUCT_STATUS_LABELS.blocked },
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
