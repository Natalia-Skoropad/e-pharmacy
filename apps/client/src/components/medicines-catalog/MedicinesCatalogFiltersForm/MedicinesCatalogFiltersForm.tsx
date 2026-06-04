'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';

import { CloseIconButton, ResetFiltersButton, SearchableSelect, SearchInput, SelectField } from '@e-pharmacy/ui/common';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import {
  CATALOG_SEARCH_MAX_LENGTH,
  CATALOG_SEARCH_UPDATE_DELAY,
} from '@e-pharmacy/config/catalog';

import {
  buildMedicinesCatalogPath,
  getMedicinesCatalogActiveFiltersCount,
  type MedicinesCatalogFilters,
  type ProductAvailabilityFilter,
  type ProductCategoryFilter,
  type ProductSortFilter,
} from '@/lib/catalog/medicines-catalog';

import {
  sanitizeCatalogArticleSearch,
  sanitizeCatalogTextSearch,
} from '@/lib/catalog/search-sanitizers';

import type { ProductFilterOptionsResponse, Store } from '@/types';

import css from './MedicinesCatalogFiltersForm.module.css';

//===================================================================

type StoreSelectValue = 'all' | string;

type MedicinesCatalogFiltersFormProps = {
  filters: MedicinesCatalogFilters;
  stores: Store[];
  filterOptions: ProductFilterOptionsResponse;
  productsCountLabel: string;
};

type CatalogHrefFilters = Omit<MedicinesCatalogFilters, 'page'> & {
  page?: number;
};

//===================================================================

function buildCatalogHref(filters: CatalogHrefFilters, stores: Store[]) {
  return buildMedicinesCatalogPath(filters, stores);
}

function createResetFiltersHref(
  filters: MedicinesCatalogFilters,
  stores: Store[]
) {
  return buildCatalogHref(
    {
      name: '',
      article: '',
      category: 'all',
      availability: 'all',
      sort: filters.sort,
    },
    stores
  );
}

//===================================================================

function MedicinesCatalogFiltersForm({
  filters,
  stores,
  filterOptions,
  productsCountLabel,
}: MedicinesCatalogFiltersFormProps) {
  const router = useRouter();

  const [searchDraft, setSearchDraft] = useState(() => ({
    name: filters.name,
    article: filters.article,
    sourceName: filters.name,
    sourceArticle: filters.article,
  }));

  const name =
    searchDraft.sourceName === filters.name ? searchDraft.name : filters.name;
  const article =
    searchDraft.sourceArticle === filters.article
      ? searchDraft.article
      : filters.article;

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
  const resetHref = createResetFiltersHref(filters, stores);

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

      router.replace(
        buildCatalogHref(
          {
            ...filters,
            name: trimmedName,
            article: trimmedArticle,
            page: 1,
          },
          stores
        ),
        { scroll: false }
      );
    }, CATALOG_SEARCH_UPDATE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [article, filters, name, router, stores]);

  const handleNameChange = (nextName: string) => {
    setSearchDraft({
      name: nextName,
      article,
      sourceName: filters.name,
      sourceArticle: filters.article,
    });
  };

  const handleArticleChange = (nextArticle: string) => {
    setSearchDraft({
      name,
      article: nextArticle,
      sourceName: filters.name,
      sourceArticle: filters.article,
    });
  };

  const handleResetFilters = () => {
    setSearchDraft({
      name: '',
      article: '',
      sourceName: '',
      sourceArticle: '',
    });
  };

  const updateCatalog = (nextFilters: CatalogHrefFilters) => {
    router.replace(buildCatalogHref({ ...nextFilters, page: 1 }, stores), {
      scroll: false,
    });

    setIsFiltersOpen(false);
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
        options={filterOptions.categories}
        isActive={filters.category !== 'all'}
        onChange={handleCategoryChange}
      />

      <SelectField
        id={`catalog-availability-${idSuffix}`}
        label="Availability"
        value={filters.availability}
        options={filterOptions.availability}
        isActive={filters.availability !== 'all'}
        onChange={handleAvailabilityChange}
      />

      <SearchableSelect
        id={`catalog-pharmacy-${idSuffix}`}
        label="Pharmacy"
        value={filters.storeId ?? 'all'}
        options={storeOptions}
        placeholder="All pharmacies"
        emptyMessage="No pharmacies found"
        isActive={Boolean(filters.storeId)}
        maxLength={CATALOG_SEARCH_MAX_LENGTH}
        sanitizeQuery={sanitizeCatalogTextSearch}
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
            maxLength={CATALOG_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={handleNameChange}
          />

          <SearchInput
            id="catalog-article-search"
            label="Search by article"
            value={article}
            placeholder="Article"
            isActive={Boolean(filters.article)}
            maxLength={CATALOG_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogArticleSearch}
            onChange={handleArticleChange}
          />

          <div className={css.desktopFilters}>
            {renderFiltersControls('desktop')}
          </div>

          <div className={css.desktopResetSlot}>
            <ResetFiltersButton
              href={resetHref}
              isVisible={hasActiveFilters}
              onClick={handleResetFilters}
            />
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
            options={filterOptions.sort}
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
                options={filterOptions.sort}
                isActive={filters.sort !== 'newest'}
                onChange={handleSortChange}
              />
            </div>

            {hasActiveFilters ? (
              <ResetFiltersButton
                className={css.offcanvasReset}
                href={resetHref}
                onClick={() => {
                  handleResetFilters();
                  setIsFiltersOpen(false);
                }}
              />
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

export default MedicinesCatalogFiltersForm;
