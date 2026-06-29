'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  CloseIconButton,
  CountLabel,
  FiltersButton,
  ResetFiltersButton,
  SearchableSelect,
  SearchInput,
  SelectField,
} from '@e-pharmacy/ui/common';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type {
  ProductFilterOptionsResponse,
  PharmacyOption,
} from '@e-pharmacy/types';

import {
  CATALOG_SEARCH_MAX_LENGTH,
  CATALOG_SEARCH_UPDATE_DELAY,
} from '@/lib/catalog/catalog-config';

import {
  buildProductCatalogPath,
  getProductCatalogActiveFiltersCount,
  type ProductCatalogFilters,
  type ProductAvailabilityFilter,
  type ProductCategoryFilter,
  type ProductSortFilter,
} from '@/lib/catalog/product-catalog';

import {
  sanitizeCatalogArticleSearch,
  sanitizeCatalogTextSearch,
} from '@/lib/catalog/search-sanitizers';

import css from './ProductCatalogFiltersForm.module.css';

//===================================================================

type PharmacySelectValue = 'all' | string;

//===================================================================

type ProductCatalogFiltersFormProps = {
  filters: ProductCatalogFilters;
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  visibleProductsCount: number;
  productsCount: number;
};

type CatalogHrefFilters = Omit<ProductCatalogFilters, 'page'> & {
  page?: number;
};

//===================================================================

function buildProductsFiltersHref(
  filters: CatalogHrefFilters,
  pharmacies: PharmacyOption[]
) {
  return buildProductCatalogPath(filters, pharmacies);
}

//===================================================================

function createProductsResetFiltersHref(
  filters: ProductCatalogFilters,
  pharmacies: PharmacyOption[]
) {
  return buildProductsFiltersHref(
    {
      name: '',
      article: '',
      category: 'all',
      availability: 'all',
      sort: filters.sort,
    },
    pharmacies
  );
}

//===================================================================

function ProductCatalogFiltersForm({
  filters,
  pharmacies,
  filterOptions,
  visibleProductsCount,
  productsCount,
}: ProductCatalogFiltersFormProps) {
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

  const activeFiltersCount = getProductCatalogActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;
  const resetHref = createProductsResetFiltersHref(filters, pharmacies);

  const pharmacyOptions = useMemo(
    () => [
      { value: 'all', label: 'All pharmacies' },
      ...pharmacies.map((pharmacy) => ({
        value: pharmacy.id,
        label: pharmacy.name,
      })),
    ],
    [pharmacies]
  );

  const productCatalogSortOptions = useMemo(
    () =>
      filterOptions.sort.filter(
        (option) => option.value !== 'price-asc' && option.value !== 'price-desc'
      ),
    [filterOptions.sort]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedName = name.trim();
      const trimmedArticle = article.trim();

      if (trimmedName === filters.name && trimmedArticle === filters.article) {
        return;
      }

      router.replace(
        buildProductsFiltersHref(
          {
            ...filters,
            name: trimmedName,
            article: trimmedArticle,
            page: 1,
          },
          pharmacies
        ),
        { scroll: false }
      );
    }, CATALOG_SEARCH_UPDATE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [article, filters, name, router, pharmacies]);

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
    router.replace(
      buildProductsFiltersHref({ ...nextFilters, page: 1 }, pharmacies),
      {
        scroll: false,
      }
    );

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

  const handlePharmacyChange = (pharmacyId: PharmacySelectValue) => {
    updateCatalog({
      ...filters,
      pharmacyId: pharmacyId === 'all' ? undefined : pharmacyId,
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
        value={filters.pharmacyId ?? 'all'}
        options={pharmacyOptions}
        placeholder="All pharmacies"
        emptyMessage="No pharmacies found"
        isActive={Boolean(filters.pharmacyId)}
        maxLength={CATALOG_SEARCH_MAX_LENGTH}
        sanitizeQuery={sanitizeCatalogTextSearch}
        onChange={handlePharmacyChange}
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
        <CountLabel
          shown={visibleProductsCount}
          total={productsCount}
          label="products"
        />

        <FiltersButton
          className={css.filterButton}
          activeCount={activeFiltersCount}
          controlsId="catalog-filters-panel"
          isExpanded={isFiltersOpen}
          onClick={() => setIsFiltersOpen(true)}
        />

        <div className={css.desktopSort}>
          <SelectField
            id="catalog-sort-desktop"
            label="Sort by"
            value={filters.sort}
            options={productCatalogSortOptions}
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
            id="catalog-filters-panel"
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
                options={productCatalogSortOptions}
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

export default ProductCatalogFiltersForm;
