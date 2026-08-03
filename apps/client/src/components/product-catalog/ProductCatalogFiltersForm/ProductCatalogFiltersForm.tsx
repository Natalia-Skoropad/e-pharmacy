'use client';

import { useCallback, useMemo, useState } from 'react';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { FiltersButton, ResetFiltersButton } from '@e-pharmacy/ui/primitives';

import {
  SearchableSelect,
  SearchInput,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';
import type { ProductFilterOptionsResponse } from '@e-pharmacy/types/products';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import { CATALOG_SEARCH_UPDATE_DELAY } from '@/lib/catalog/catalog-config';

import {
  buildProductCatalogPath,
  getProductCatalogActiveFiltersCount,
  isProductSortFilter,
  type ProductAvailabilityFilter,
  type ProductCatalogFilters,
  type ProductCategoryFilter,
  type ProductSortFilter,
} from '@/lib/catalog/product-catalog';

import {
  sanitizeCatalogArticleSearch,
  sanitizeCatalogTextSearch,
} from '@/lib/catalog/search-sanitizers';

import CatalogFiltersShell from '@/components/catalog/CatalogFiltersShell/CatalogFiltersShell';
import { useCatalogNavigation } from '@/components/catalog/hooks/useCatalogNavigation';
import { useCatalogSearchDraft } from '@/components/catalog/hooks/useCatalogSearchDraft';

//===================================================================

type ProductCatalogFiltersFormProps = Readonly<{
  filters: ProductCatalogFilters;
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  visibleProductsCount: number;
  productsCount: number;
}>;

type CatalogHrefFilters = Omit<ProductCatalogFilters, 'page'> & {
  page?: number;
};

type ProductSearchDraft = Readonly<{
  name: string;
  article: string;
}>;

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { isPending, navigate } = useCatalogNavigation();

  const committedSearch = useMemo<ProductSearchDraft>(
    () => ({ name: filters.name, article: filters.article }),
    [filters.article, filters.name]
  );

  const normalizeSearch = useCallback(
    (draft: ProductSearchDraft): ProductSearchDraft => ({
      name: draft.name.trim(),
      article: draft.article.trim(),
    }),
    []
  );

  const commitSearch = useCallback(
    (search: ProductSearchDraft) => {
      navigate(
        buildProductsFiltersHref({ ...filters, ...search, page: 1 }, pharmacies)
      );
    },
    [filters, navigate, pharmacies]
  );

  const { draft, isDraftDirty, setDraft } = useCatalogSearchDraft({
    committed: committedSearch,
    delay: CATALOG_SEARCH_UPDATE_DELAY,
    normalize: normalizeSearch,
    onCommit: commitSearch,
  });

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      name: draft.name.trim(),
      article: draft.article.trim(),
    }),
    [draft.article, draft.name, filters]
  );

  const activeFiltersCount =
    getProductCatalogActiveFiltersCount(effectiveFilters);
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
        (
          option
        ): option is Readonly<{
          value: ProductSortFilter;
          label: string;
        }> => isProductSortFilter(option.value)
      ),
    [filterOptions.sort]
  );

  const resetDraft = () => {
    setDraft({ name: '', article: '' });
  };

  const updateCatalog = (nextFilters: CatalogHrefFilters) => {
    navigate(buildProductsFiltersHref({ ...nextFilters, page: 1 }, pharmacies));
    setIsFiltersOpen(false);
  };

  const renderFiltersControls = (idSuffix: string) => (
    <>
      <SelectField
        id={`catalog-category-${idSuffix}`}
        label="Category"
        value={filters.category}
        options={filterOptions.categories}
        isActive={filters.category !== 'all'}
        disabled={isPending}
        onChange={(category: ProductCategoryFilter) =>
          updateCatalog({ ...filters, category })
        }
      />

      <SelectField
        id={`catalog-availability-${idSuffix}`}
        label="Availability"
        value={filters.availability}
        options={filterOptions.availability}
        isActive={filters.availability !== 'all'}
        disabled={isPending}
        onChange={(availability: ProductAvailabilityFilter) =>
          updateCatalog({ ...filters, availability })
        }
      />

      <SearchableSelect
        id={`catalog-pharmacy-${idSuffix}`}
        label="Pharmacy"
        value={filters.pharmacyId ?? 'all'}
        options={pharmacyOptions}
        placeholder="All pharmacies"
        emptyMessage="No pharmacies found"
        isActive={Boolean(filters.pharmacyId)}
        disabled={isPending}
        maxLength={USER_SEARCH_MAX_LENGTH}
        sanitizeQuery={sanitizeCatalogTextSearch}
        onChange={(pharmacyId: string) =>
          updateCatalog({
            ...filters,
            pharmacyId: pharmacyId === 'all' ? undefined : pharmacyId,
          })
        }
      />
    </>
  );

  const sortControl = (id: string) => (
    <SelectField
      id={id}
      label="Sort by"
      value={filters.sort}
      options={productCatalogSortOptions}
      isActive={filters.sort !== 'newest'}
      disabled={isPending}
      onChange={(sort: ProductSortFilter) =>
        updateCatalog({ ...filters, sort })
      }
    />
  );

  return (
    <CatalogFiltersShell
      headingId="product-catalog-filters-title"
      heading="Product catalog filters"
      layout="wide"
      isPending={isPending || isDraftDirty}
      searchFields={
        <>
          <SearchInput
            id="catalog-name-search"
            label="Search by name"
            value={draft.name}
            placeholder="Product name"
            isActive={Boolean(draft.name.trim())}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={(name) => setDraft({ ...draft, name })}
          />

          <SearchInput
            id="catalog-article-search"
            label="Search by article"
            value={draft.article}
            placeholder="Article"
            isActive={Boolean(draft.article.trim())}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogArticleSearch}
            onChange={(article) => setDraft({ ...draft, article })}
          />
        </>
      }
      desktopFilterFields={renderFiltersControls('desktop')}
      resetAction={
        <ResetFiltersButton
          href={resetHref}
          isVisible={hasActiveFilters}
          disabled={isPending}
          onClick={resetDraft}
        />
      }
      countLabel={
        <CountLabel
          shown={visibleProductsCount}
          total={productsCount}
          label="products"
        />
      }
      filterButton={
        <FiltersButton
          activeCount={activeFiltersCount}
          controlsId="catalog-filters-panel"
          isExpanded={isFiltersOpen}
          disabled={isPending}
          onClick={() => setIsFiltersOpen(true)}
        />
      }
      desktopSort={sortControl('catalog-sort-desktop')}
      drawer={
        <FilterDrawer
          id="catalog-filters-panel"
          eyebrow="Catalog"
          title="Filters and sorting"
          isOpen={isFiltersOpen}
          hasActiveFilters={hasActiveFilters}
          resetHref={resetHref}
          onClose={() => setIsFiltersOpen(false)}
          onReset={() => {
            resetDraft();
            setIsFiltersOpen(false);
          }}
        >
          {renderFiltersControls('mobile')}
          {sortControl('catalog-sort-mobile')}
        </FilterDrawer>
      }
    />
  );
}

export default ProductCatalogFiltersForm;
