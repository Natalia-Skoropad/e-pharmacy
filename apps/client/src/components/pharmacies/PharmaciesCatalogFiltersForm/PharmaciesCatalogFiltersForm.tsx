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

import type { PharmaciesSortFilter } from '@e-pharmacy/types';

import {
  CATALOG_SEARCH_MAX_LENGTH,
  CATALOG_SEARCH_UPDATE_DELAY,
} from '@/lib/catalog/catalog-config';

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

  useBodyScrollLock(isFiltersOpen);

  useEscapeToClose({
    isOpen: isFiltersOpen,
    onClose: () => setIsFiltersOpen(false),
  });

  const handleBackdropClick = useBackdropClick({
    onClose: () => setIsFiltersOpen(false),
  });

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
      maxLength={CATALOG_SEARCH_MAX_LENGTH}
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
            maxLength={CATALOG_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={setName}
          />

          <SearchInput
            id="pharmacies-address-search"
            label="Search by address"
            value={address}
            placeholder="Address"
            isActive={Boolean(filters.address)}
            maxLength={CATALOG_SEARCH_MAX_LENGTH}
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

      {isFiltersOpen ? (
        <div
          className={css.offcanvasBackdrop}
          role="presentation"
          onMouseDown={handleBackdropClick}
        >
          <aside
            className={css.offcanvas}
            id="pharmacies-filters-panel"
            aria-labelledby="pharmacies-filters-title"
            aria-modal="true"
            role="dialog"
          >
            <div className={css.offcanvasHeader}>
              <div>
                <p className={css.offcanvasKicker}>Pharmacies</p>

                <h2
                  className={css.offcanvasTitle}
                  id="pharmacies-filters-title"
                >
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
                id="pharmacies-sort-mobile"
                label="Sort by"
                value={filters.sort}
                options={PHARMACIES_SORT_OPTIONS}
                isActive={filters.sort !== 'newest'}
                onChange={handleSortChange}
              />
            </div>

            {hasActiveFilters ? (
              <ResetFiltersButton
                className={css.offcanvasReset}
                href={resetHref}
                onClick={() => {
                  setName('');
                  setAddress('');
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

export default PharmaciesCatalogFiltersForm;
