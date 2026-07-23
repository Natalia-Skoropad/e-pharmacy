'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { FiltersButton, ResetFiltersButton } from '@e-pharmacy/ui/primitives';

import {
  SearchableSelect,
  SearchInput,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import type { PharmaciesSortFilter } from '@e-pharmacy/types';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import { CATALOG_SEARCH_UPDATE_DELAY } from '@/lib/catalog/catalog-config';

import {
  buildPharmacyPath,
  getPharmacyActiveFiltersCount,
  PHARMACIES_SORT_OPTIONS,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import css from './PharmaciesCatalogFiltersForm.module.css';

//===================================================================

type CitySelectValue = 'all' | string;

//===================================================================

type PharmaciesCatalogFiltersFormProps = {
  filters: PharmacyFilters;
  cityOptions: string[];
  visiblePharmaciesCount: number;
  pharmaciesCount: number;
};

//===================================================================

type PharmaciesHrefFilters = Omit<PharmacyFilters, 'page'> & {
  page?: number;
};

//===================================================================

function buildPharmacyFiltersHref(filters: PharmaciesHrefFilters) {
  return buildPharmacyPath(filters);
}

//===================================================================

function createPharmaciesResetFiltersHref(filters: PharmacyFilters) {
  return buildPharmacyFiltersHref({
    name: '',
    address: '',
    city: '',
    sort: filters.sort,
  });
}

//===================================================================

function PharmaciesCatalogFiltersForm({
  filters,
  cityOptions,
  visiblePharmaciesCount,
  pharmaciesCount,
}: PharmaciesCatalogFiltersFormProps) {
  const router = useRouter();

  const [name, setName] = useState(filters.name);
  const [address, setAddress] = useState(filters.address);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = getPharmacyActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;
  const resetHref = createPharmaciesResetFiltersHref(filters);

  const citySelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All cities' },
      ...cityOptions.map((city) => ({ value: city, label: city })),
    ],
    [cityOptions]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedName = name.trim();
      const trimmedAddress = address.trim();

      if (trimmedName === filters.name && trimmedAddress === filters.address) {
        return;
      }

      router.replace(
        buildPharmacyFiltersHref({
          ...filters,
          name: trimmedName,
          address: trimmedAddress,
          page: 1,
        }),
        { scroll: false }
      );
    }, CATALOG_SEARCH_UPDATE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [address, filters, name, router]);

  const updatePharmaciesCatalog = (nextFilters: PharmaciesHrefFilters) => {
    router.replace(buildPharmacyFiltersHref({ ...nextFilters, page: 1 }), {
      scroll: false,
    });

    setIsFiltersOpen(false);
  };

  const handleCityChange = (city: CitySelectValue) => {
    updatePharmaciesCatalog({
      ...filters,
      city: city === 'all' ? '' : city,
    });
  };

  const handleSortChange = (sort: PharmaciesSortFilter) => {
    updatePharmaciesCatalog({ ...filters, sort });
  };

  const renderFiltersControls = (idSuffix: string) => (
    <SearchableSelect
      id={`pharmacies-city-${idSuffix}`}
      label="City"
      value={filters.city || 'all'}
      options={citySelectOptions}
      placeholder="All cities"
      emptyMessage="No cities found"
      isActive={Boolean(filters.city)}
      maxLength={USER_SEARCH_MAX_LENGTH}
      sanitizeQuery={sanitizeCatalogTextSearch}
      onChange={handleCityChange}
    />
  );

  return (
    <>
      <div className={css.searchCard}>
        <div className={css.searchGrid}>
          <SearchInput
            id="pharmacies-name-search"
            label="Search by name"
            value={name}
            placeholder="Pharmacy name"
            isActive={Boolean(filters.name)}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={setName}
          />

          <SearchInput
            id="pharmacies-address-search"
            label="Search by address"
            value={address}
            placeholder="Address"
            isActive={Boolean(filters.address)}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={setAddress}
          />

          <div className={css.desktopFilters}>
            {renderFiltersControls('desktop')}
          </div>

          <div className={css.desktopResetSlot}>
            <ResetFiltersButton
              href={resetHref}
              isVisible={hasActiveFilters}
              onClick={() => {
                setName('');
                setAddress('');
              }}
            />
          </div>
        </div>
      </div>

      <div className={css.catalogToolbar}>
        <CountLabel
          shown={visiblePharmaciesCount}
          total={pharmaciesCount}
          label="pharmacies"
        />

        <FiltersButton
          className={css.filterButton}
          activeCount={activeFiltersCount}
          controlsId="pharmacies-filters-panel"
          isExpanded={isFiltersOpen}
          onClick={() => setIsFiltersOpen(true)}
        />

        <div className={css.desktopSort}>
          <SelectField
            id="pharmacies-sort-desktop"
            label="Sort by"
            value={filters.sort}
            options={PHARMACIES_SORT_OPTIONS}
            isActive={filters.sort !== 'newest'}
            onChange={handleSortChange}
          />
        </div>
      </div>

      <FilterDrawer
        id="pharmacies-filters-panel"
        eyebrow="Pharmacies"
        title="Filters and sorting"
        isOpen={isFiltersOpen}
        hasActiveFilters={hasActiveFilters}
        resetHref={resetHref}
        onClose={() => setIsFiltersOpen(false)}
        onReset={() => {
          setName('');
          setAddress('');
          setIsFiltersOpen(false);
        }}
      >
        {renderFiltersControls('mobile')}

        <SelectField
          id="pharmacies-sort-mobile"
          label="Sort by"
          value={filters.sort}
          options={PHARMACIES_SORT_OPTIONS}
          isActive={filters.sort !== 'newest'}
          onChange={handleSortChange}
        />
      </FilterDrawer>
    </>
  );
}

export default PharmaciesCatalogFiltersForm;
