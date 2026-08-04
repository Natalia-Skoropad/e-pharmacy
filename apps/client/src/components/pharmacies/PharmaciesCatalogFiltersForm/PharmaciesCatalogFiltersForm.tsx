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
import type { PharmaciesSortFilter } from '@e-pharmacy/types/pharmacies';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import { CATALOG_SEARCH_UPDATE_DELAY } from '@/lib/catalog/catalog-config';

import {
  buildPharmacyPath,
  getPharmacyActiveFiltersCount,
  PHARMACIES_SORT_OPTIONS,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import CatalogFiltersShell from '@/components/catalog/CatalogFiltersShell/CatalogFiltersShell';
import { useCatalogNavigation } from '@/components/catalog/hooks/useCatalogNavigation';
import { useCatalogSearchDraft } from '@/components/catalog/hooks/useCatalogSearchDraft';

//===================================================================

type PharmaciesCatalogFiltersFormProps = Readonly<{
  filters: PharmacyFilters;
  cityOptions: string[];
  visiblePharmaciesCount: number;
  pharmaciesCount: number;
}>;

type PharmaciesHrefFilters = Omit<PharmacyFilters, 'page'> & {
  page?: number;
};

type PharmacySearchDraft = Readonly<{
  name: string;
  address: string;
}>;

//===================================================================

function buildPharmacyFiltersHref(filters: PharmaciesHrefFilters) {
  return buildPharmacyPath(filters);
}

//===================================================================

function createPharmaciesResetFiltersHref() {
  return buildPharmacyFiltersHref({
    name: '',
    address: '',
    city: '',
    sort: 'newest',
  });
}

//===================================================================

function PharmaciesCatalogFiltersForm({
  filters,
  cityOptions,
  visiblePharmaciesCount,
  pharmaciesCount,
}: PharmaciesCatalogFiltersFormProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { isPending, navigate } = useCatalogNavigation();

  const committedSearch = useMemo<PharmacySearchDraft>(
    () => ({ name: filters.name, address: filters.address }),
    [filters.address, filters.name]
  );

  const normalizeSearch = useCallback(
    (draft: PharmacySearchDraft): PharmacySearchDraft => ({
      name: draft.name.trim(),
      address: draft.address.trim(),
    }),
    []
  );

  const commitSearch = useCallback(
    (search: PharmacySearchDraft) => {
      navigate(buildPharmacyFiltersHref({ ...filters, ...search, page: 1 }));
    },
    [filters, navigate]
  );

  const { draft, isDraftDirty, setDraft, resetDraft } = useCatalogSearchDraft({
    committed: committedSearch,
    delay: CATALOG_SEARCH_UPDATE_DELAY,
    normalize: normalizeSearch,
    onCommit: commitSearch,
  });

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      name: draft.name.trim(),
      address: draft.address.trim(),
    }),
    [draft.address, draft.name, filters]
  );

  const activeFiltersCount = getPharmacyActiveFiltersCount(effectiveFilters);
  const hasActiveFilters = activeFiltersCount > 0;
  const resetHref = createPharmaciesResetFiltersHref();

  const citySelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All cities' },
      ...cityOptions.map((city) => ({ value: city, label: city })),
    ],
    [cityOptions]
  );

  const clearSearchDraft = () => {
    resetDraft({ name: '', address: '' });
  };

  const updateCatalog = (nextFilters: PharmaciesHrefFilters) => {
    navigate(buildPharmacyFiltersHref({ ...nextFilters, page: 1 }));
    setIsFiltersOpen(false);
  };

  const cityControl = (idSuffix: string) => (
    <SearchableSelect
      id={`pharmacies-city-${idSuffix}`}
      label="City"
      value={filters.city || 'all'}
      options={citySelectOptions}
      placeholder="All cities"
      emptyMessage="No cities found"
      isActive={Boolean(filters.city)}
      disabled={isPending}
      maxLength={USER_SEARCH_MAX_LENGTH}
      sanitizeQuery={sanitizeCatalogTextSearch}
      onChange={(city: string) =>
        updateCatalog({ ...filters, city: city === 'all' ? '' : city })
      }
    />
  );

  const sortControl = (id: string) => (
    <SelectField
      id={id}
      label="Sort by"
      value={filters.sort}
      options={PHARMACIES_SORT_OPTIONS}
      isActive={filters.sort !== 'newest'}
      disabled={isPending}
      onChange={(sort: PharmaciesSortFilter) =>
        updateCatalog({ ...filters, sort })
      }
    />
  );

  return (
    <CatalogFiltersShell
      headingId="pharmacies-catalog-filters-title"
      heading="Pharmacy catalog filters"
      layout="compact"
      isPending={isPending || isDraftDirty}
      searchFields={
        <>
          <SearchInput
            id="pharmacies-name-search"
            label="Search by name"
            value={draft.name}
            placeholder="Pharmacy name"
            isActive={Boolean(draft.name.trim())}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={(name) => setDraft({ ...draft, name })}
          />

          <SearchInput
            id="pharmacies-address-search"
            label="Search by address"
            value={draft.address}
            placeholder="Address"
            isActive={Boolean(draft.address.trim())}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={(address) => setDraft({ ...draft, address })}
          />
        </>
      }
      desktopFilterFields={cityControl('desktop')}
      resetAction={
        <ResetFiltersButton
          href={resetHref}
          isVisible={hasActiveFilters}
          disabled={isPending}
          onClick={clearSearchDraft}
        />
      }
      countLabel={
        <CountLabel
          shown={visiblePharmaciesCount}
          total={pharmaciesCount}
          label="pharmacies"
        />
      }
      filterButton={
        <FiltersButton
          activeCount={activeFiltersCount}
          controlsId="pharmacies-filters-panel"
          isExpanded={isFiltersOpen}
          disabled={isPending}
          onClick={() => setIsFiltersOpen(true)}
        />
      }
      desktopSort={sortControl('pharmacies-sort-desktop')}
      drawer={
        <FilterDrawer
          id="pharmacies-filters-panel"
          eyebrow="Pharmacies"
          title="Filters and sorting"
          isOpen={isFiltersOpen}
          hasActiveFilters={hasActiveFilters}
          resetHref={resetHref}
          onClose={() => setIsFiltersOpen(false)}
          onReset={() => {
            clearSearchDraft();
            setIsFiltersOpen(false);
          }}
        >
          {cityControl('mobile')}
          {sortControl('pharmacies-sort-mobile')}
        </FilterDrawer>
      }
    />
  );
}

export default PharmaciesCatalogFiltersForm;
