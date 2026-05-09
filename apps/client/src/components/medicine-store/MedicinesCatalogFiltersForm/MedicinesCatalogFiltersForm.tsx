'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter } from 'lucide-react';

import {
  CloseIconButton,
  ResetFiltersButton,
  SearchableSelect,
  SearchInput,
  SelectField,
} from '@/components/common';

import { useBackdropClick, useBodyScrollLock, useEscapeToClose } from '@/hooks';
import { ROUTES } from '@/lib/constants/routes';
import {
  getMedicinesCatalogActiveFiltersCount,
  PRODUCT_AVAILABILITY_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_SORT_OPTIONS,
  type MedicinesCatalogFilters,
  type ProductAvailabilityFilter,
  type ProductCategoryFilter,
  type ProductSortFilter,
} from '@/lib/catalog/medicines-catalog';

import type { Store } from '@/types';

import css from './MedicinesCatalogFiltersForm.module.css';

//===================================================================

type StoreSelectValue = 'all' | string;

type MedicinesCatalogFiltersFormProps = {
  filters: MedicinesCatalogFilters;
  stores: Store[];
  productsCountLabel: string;
};

type CatalogHrefFilters = Omit<MedicinesCatalogFilters, 'page'> & {
  page?: number;
};

//===================================================================

const SEARCH_UPDATE_DELAY = 450;

//===================================================================

function buildCatalogHref(filters: CatalogHrefFilters) {
  const searchParams = new URLSearchParams();

  if (filters.storeId) searchParams.set('storeId', filters.storeId);
  if (filters.name) searchParams.set('name', filters.name.trim());
  if (filters.article) searchParams.set('article', filters.article.trim());
  if (filters.category !== 'all')
    searchParams.set('category', filters.category);
  if (filters.availability !== 'all') {
    searchParams.set('availability', filters.availability);
  }
  if (filters.sort !== 'newest') searchParams.set('sort', filters.sort);
  if (filters.page && filters.page > 1)
    searchParams.set('page', String(filters.page));

  const queryString = searchParams.toString();

  return queryString
    ? `${ROUTES.MEDICINES_CATALOG}?${queryString}`
    : ROUTES.MEDICINES_CATALOG;
}

function createResetFiltersHref(filters: MedicinesCatalogFilters) {
  return buildCatalogHref({
    name: '',
    article: '',
    category: 'all',
    availability: 'all',
    sort: filters.sort,
  });
}

//===================================================================

function MedicinesCatalogFiltersForm({
  filters,
  stores,
  productsCountLabel,
}: MedicinesCatalogFiltersFormProps) {
  const [name, setName] = useState(filters.name);
  const [article, setArticle] = useState(filters.article);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useBodyScrollLock(isFiltersOpen);
  useEscapeToClose({
    isOpen: isFiltersOpen,
    onClose: () => setIsFiltersOpen(false),
  });
  const handleBackdropClick = useBackdropClick({
    onClose: () => setIsFiltersOpen(false),
  });

  const activeFiltersCount = getMedicinesCatalogActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;
  const resetHref = createResetFiltersHref(filters);

  const storeOptions = useMemo(
    () => [
      { value: 'all', label: 'All pharmacies' },
      ...stores.map((store) => ({ value: store.id, label: store.name })),
    ],
    [stores]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedName = name.trim();
      const trimmedArticle = article.trim();

      if (trimmedName === filters.name && trimmedArticle === filters.article) {
        return;
      }

      window.location.href = buildCatalogHref({
        ...filters,
        name: trimmedName,
        article: trimmedArticle,
        page: 1,
      });
    }, SEARCH_UPDATE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [article, filters, name]);

  const updateCatalog = (nextFilters: CatalogHrefFilters) => {
    window.location.href = buildCatalogHref({ ...nextFilters, page: 1 });
  };

  const handleCategoryChange = (category: ProductCategoryFilter) => {
    updateCatalog({ ...filters, category });
  };

  const handleAvailabilityChange = (
    availability: ProductAvailabilityFilter
  ) => {
    updateCatalog({ ...filters, availability });
  };

  const handleStoreChange = (storeId: StoreSelectValue) => {
    updateCatalog({
      ...filters,
      storeId: storeId === 'all' ? undefined : storeId,
    });
  };

  const handleSortChange = (sort: ProductSortFilter) => {
    updateCatalog({ ...filters, sort });
  };

  const renderFiltersControls = (idSuffix: string) => (
    <>
      <SelectField
        id={`catalog-category-${idSuffix}`}
        label="Category"
        value={filters.category}
        options={[...PRODUCT_CATEGORY_OPTIONS]}
        isActive={filters.category !== 'all'}
        onChange={handleCategoryChange}
      />

      <SelectField
        id={`catalog-availability-${idSuffix}`}
        label="Availability"
        value={filters.availability}
        options={[...PRODUCT_AVAILABILITY_OPTIONS]}
        isActive={filters.availability !== 'all'}
        onChange={handleAvailabilityChange}
      />

      <SearchableSelect
        id={`catalog-pharmacy-${idSuffix}`}
        label="Pharmacy"
        value={filters.storeId ?? 'all'}
        options={storeOptions}
        searchPlaceholder="Search pharmacy"
        emptyMessage="No pharmacies found"
        isActive={Boolean(filters.storeId)}
        onChange={handleStoreChange}
      />
    </>
  );

  return (
    <>
      <div className={css.searchCard}>
        <div className={css.searchGrid}>
          <SearchInput
            id="catalog-name-search"
            label="Search by name"
            value={name}
            placeholder="Product name"
            isActive={Boolean(filters.name)}
            onChange={setName}
          />

          <SearchInput
            id="catalog-article-search"
            label="Search by article"
            value={article}
            placeholder="Article"
            isActive={Boolean(filters.article)}
            onChange={setArticle}
          />

          <div className={css.desktopFilters}>
            {renderFiltersControls('desktop')}
          </div>

          <div className={css.desktopResetSlot}>
            <ResetFiltersButton href={resetHref} isVisible={hasActiveFilters} />
          </div>
        </div>
      </div>

      <div className={css.catalogToolbar}>
        <p className={css.resultCount}>{productsCountLabel}</p>

        <button
          className={css.filterButton}
          type="button"
          onClick={() => setIsFiltersOpen(true)}
        >
          <Filter size={18} aria-hidden="true" />
          <span>Filters</span>
          {activeFiltersCount ? (
            <span className={css.filterBadge}>{activeFiltersCount}</span>
          ) : null}
        </button>

        <div className={css.desktopSort}>
          <SelectField
            id="catalog-sort-desktop"
            label="Sort by"
            value={filters.sort}
            options={[...PRODUCT_SORT_OPTIONS]}
            isActive={filters.sort !== 'newest'}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {isFiltersOpen ? (
        <div
          className={css.offcanvasBackdrop}
          role="presentation"
          onMouseDown={handleBackdropClick}
        >
          <aside
            className={css.offcanvas}
            aria-labelledby="catalog-filters-title"
            aria-modal="true"
            role="dialog"
          >
            <div className={css.offcanvasHeader}>
              <div>
                <p className={css.offcanvasKicker}>Catalog</p>
                <h2 className={css.offcanvasTitle} id="catalog-filters-title">
                  Filters and sorting
                </h2>
              </div>

              <CloseIconButton
                label="Close filters"
                onClick={() => setIsFiltersOpen(false)}
              />
            </div>

            <div className={css.offcanvasControls}>
              {renderFiltersControls('mobile')}

              <SelectField
                id="catalog-sort-mobile"
                label="Sort by"
                value={filters.sort}
                options={[...PRODUCT_SORT_OPTIONS]}
                isActive={filters.sort !== 'newest'}
                onChange={handleSortChange}
              />
            </div>

            {hasActiveFilters ? (
              <ResetFiltersButton
                className={css.offcanvasReset}
                href={resetHref}
              />
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

export default MedicinesCatalogFiltersForm;
