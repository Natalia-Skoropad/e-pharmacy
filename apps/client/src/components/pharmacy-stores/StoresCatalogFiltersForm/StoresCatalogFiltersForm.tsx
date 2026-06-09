'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';

import {
  CloseIconButton,
  CountLabel,
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

import {
  CATALOG_SEARCH_MAX_LENGTH,
  CATALOG_SEARCH_UPDATE_DELAY,
} from '@e-pharmacy/config/catalog';

import {
  buildPharmacyStoresPath,
  getPharmacyStoresActiveFiltersCount,
  PHARMACY_STORES_SORT_OPTIONS,
  type PharmacyStoresFilters,
} from '@/lib/catalog/pharmacy-stores-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';
import type { StoresSortFilter } from '@e-pharmacy/types';

import css from './StoresCatalogFiltersForm.module.css';

//===================================================================

type CitySelectValue = 'all' | string;

type StoresCatalogFiltersFormProps = {
  filters: PharmacyStoresFilters;
  cityOptions: string[];
  visibleStoresCount: number;
  storesCount: number;
};

type StoresHrefFilters = Omit<PharmacyStoresFilters, 'page'> & {
  page?: number;
};

//===================================================================

function buildStoresFiltersHref(filters: StoresHrefFilters) {
  return buildPharmacyStoresPath(filters);
}

function createStoresResetFiltersHref(filters: PharmacyStoresFilters) {
  return buildStoresFiltersHref({
    name: '',
    address: '',
    city: '',
    sort: filters.sort,
  });
}

//===================================================================

function StoresCatalogFiltersForm({
  filters,
  cityOptions,
  visibleStoresCount,
  storesCount,
}: StoresCatalogFiltersFormProps) {
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

  const activeFiltersCount = getPharmacyStoresActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;
  const resetHref = createStoresResetFiltersHref(filters);

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
        buildStoresFiltersHref({
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

  const updateStoresCatalog = (nextFilters: StoresHrefFilters) => {
    router.replace(buildStoresFiltersHref({ ...nextFilters, page: 1 }), {
      scroll: false,
    });

    setIsFiltersOpen(false);
  };

  const handleCityChange = (city: CitySelectValue) => {
    updateStoresCatalog({
      ...filters,
      city: city === 'all' ? '' : city,
    });
  };

  const handleSortChange = (sort: StoresSortFilter) => {
    updateStoresCatalog({ ...filters, sort });
  };

  const renderFiltersControls = (idSuffix: string) => (
    <SearchableSelect
      id={`stores-city-${idSuffix}`}
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
            id="stores-name-search"
            label="Search by name"
            value={name}
            placeholder="Pharmacy name"
            isActive={Boolean(filters.name)}
            maxLength={CATALOG_SEARCH_MAX_LENGTH}
            sanitizeValue={sanitizeCatalogTextSearch}
            onChange={setName}
          />

          <SearchInput
            id="stores-address-search"
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
          visibleCount={visibleStoresCount}
          totalCount={storesCount}
          singularLabel="store"
        />

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
            id="stores-sort-desktop"
            label="Sort by"
            value={filters.sort}
            options={PHARMACY_STORES_SORT_OPTIONS}
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
            aria-labelledby="stores-filters-title"
            aria-modal="true"
            role="dialog"
          >
            <div className={css.offcanvasHeader}>
              <div>
                <p className={css.offcanvasKicker}>Stores</p>

                <h2 className={css.offcanvasTitle} id="stores-filters-title">
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
                id="stores-sort-mobile"
                label="Sort by"
                value={filters.sort}
                options={PHARMACY_STORES_SORT_OPTIONS}
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

export default StoresCatalogFiltersForm;
