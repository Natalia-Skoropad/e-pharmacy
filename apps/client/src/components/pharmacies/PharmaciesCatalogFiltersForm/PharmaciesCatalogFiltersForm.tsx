'use client';

import { useMemo, useState } from 'react';

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  Clock3,
  RotateCcw,
  Search,
  Star,
} from 'lucide-react';

import type {
  PharmaciesSortFilter,
  PharmacyLocationFilterOption,
  PharmacyOption,
} from '@e-pharmacy/types/pharmacies';

import { CountLabel, formatInitials } from '@e-pharmacy/ui/data-display';
import { SearchableSelect, SelectField } from '@e-pharmacy/ui/forms';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { FilterDrawer, InfoTooltip } from '@e-pharmacy/ui/overlays';
import { FiltersButton, ResetFiltersButton } from '@e-pharmacy/ui/primitives';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import {
  buildPharmacyPath,
  getPharmacyActiveFiltersCount,
  PHARMACIES_SORT_OPTIONS,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import CatalogFiltersShell from '@/components/catalog/CatalogFiltersShell/CatalogFiltersShell';
import { useCatalogNavigation } from '@/components/catalog/hooks/useCatalogNavigation';

//===================================================================

type PharmaciesCatalogFiltersFormProps = Readonly<{
  filters: PharmacyFilters;
  locationOptions: readonly PharmacyLocationFilterOption[];
  pharmacyOptions: readonly PharmacyOption[];
  visiblePharmaciesCount: number;
  pharmaciesCount: number;
}>;

type PharmaciesHrefFilters = Omit<PharmacyFilters, 'page'> & {
  page?: number;
};

//===================================================================

function buildPharmacyFiltersHref(filters: PharmaciesHrefFilters) {
  return buildPharmacyPath(filters);
}

//===================================================================

function getLocationOptionValue(
  option: Pick<PharmacyLocationFilterOption, 'settlement' | 'region'>
): string {
  return `${encodeURIComponent(option.settlement)}|${encodeURIComponent(option.region ?? '')}`;
}

//===================================================================

function createPharmaciesResetFiltersHref() {
  return buildPharmacyFiltersHref({
    name: '',
    address: '',
    pharmacyId: '',
    settlement: '',
    region: '',
    sort: 'newest',
  });
}

//===================================================================

function PharmaciesCatalogFiltersForm({
  filters,
  locationOptions,
  pharmacyOptions,
  visiblePharmaciesCount,
  pharmaciesCount,
}: PharmaciesCatalogFiltersFormProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { isPending, navigate } = useCatalogNavigation();

  const activeFiltersCount = getPharmacyActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;
  const resetHref = createPharmaciesResetFiltersHref();

  const pharmacySelectOptions = useMemo(
    () => [
      { value: '', label: 'All pharmacies' },
      ...pharmacyOptions.map((pharmacy) => ({
        value: pharmacy.id,
        label: pharmacy.name,
        leading: (
          <TableImagePreview
            src={pharmacy.imageUrl}
            alt={`${pharmacy.name} photo`}
            fallback={formatInitials(pharmacy.name, 'P')}
            size={30}
          />
        ),

        searchText: [
          pharmacy.email,
          pharmacy.phone,
          pharmacy.location?.settlement,
          pharmacy.location?.region,
          pharmacy.location?.address,
        ]
          .filter(Boolean)
          .join(' '),
      })),
    ],
    [pharmacyOptions]
  );

  const locationSelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All locations' },
      ...locationOptions.map((location) => ({
        value: getLocationOptionValue(location),
        label: location.label,
      })),
    ],
    [locationOptions]
  );

  const selectedLocationValue = useMemo(() => {
    if (!filters.settlement) return 'all';

    return getLocationOptionValue({
      settlement: filters.settlement,
      ...(filters.region ? { region: filters.region } : {}),
    });
  }, [filters.region, filters.settlement]);

  const updateCatalog = (nextFilters: PharmaciesHrefFilters) => {
    navigate(buildPharmacyFiltersHref({ ...nextFilters, page: 1 }));
    setIsFiltersOpen(false);
  };

  const locationControl = (idSuffix: string) => (
    <SearchableSelect
      id={`pharmacies-location-${idSuffix}`}
      label="Location"
      value={selectedLocationValue}
      options={locationSelectOptions}
      placeholder="All locations"
      emptyMessage="No locations found"
      isActive={Boolean(filters.settlement)}
      disabled={isPending}
      maxLength={USER_SEARCH_MAX_LENGTH}
      sanitizeQuery={sanitizeCatalogTextSearch}
      onChange={(value: string) => {
        if (value === 'all') {
          updateCatalog({ ...filters, settlement: '', region: '' });
          return;
        }

        const location = locationOptions.find(
          (option) => getLocationOptionValue(option) === value
        );
        if (!location) return;

        updateCatalog({
          ...filters,
          settlement: location.settlement,
          region: location.region ?? '',
        });
      }}
    />
  );

  const sortControl = (id: string) => (
    <SelectField
      id={id}
      label="Sort by"
      value={filters.sort}
      options={PHARMACIES_SORT_OPTIONS.map((option) => ({
        ...option,
        content: (
          <span
            className="pharmacy-sort-option"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            {option.value.startsWith('rating') ? (
              <Star size={17} fill="#f5bd3f" color="#d99d18" />
            ) : option.value === 'name-asc' ? (
              <ArrowDownAZ size={17} />
            ) : option.value === 'name-desc' ? (
              <ArrowUpAZ size={17} />
            ) : (
              <Clock3 size={17} />
            )}
            {option.label}
          </span>
        ),
      }))}
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
      layout="pharmacy"
      isPending={isPending}
      searchFields={
        <SearchableSelect
          id="pharmacies-pharmacy-search"
          label="Pharmacy search"
          labelAccessory={
            <InfoTooltip
              label="Pharmacy search help"
              title="Pharmacy search"
              icon={<Building2 size={20} aria-hidden="true" />}
              items={[
                {
                  title: 'Search fields',
                  icon: <Search size={17} aria-hidden="true" />,
                  description:
                    'Find a pharmacy by name, phone number, email, or address (settlement, optional region, and pharmacy address).',
                },
              ]}
            />
          }
          value={filters.pharmacyId ?? ''}
          options={pharmacySelectOptions}
          placeholder="Name, phone, email, or address"
          emptyMessage="No pharmacies found"
          isActive={Boolean(filters.pharmacyId)}
          disabled={isPending}
          maxLength={USER_SEARCH_MAX_LENGTH}
          sanitizeQuery={sanitizeCatalogTextSearch}
          onChange={(pharmacyId: string) =>
            updateCatalog({ ...filters, name: '', address: '', pharmacyId })
          }
        />
      }
      desktopFilterFields={locationControl('desktop')}
      resetAction={
        <ResetFiltersButton
          href={resetHref}
          label={
            <>
              <RotateCcw size={16} aria-hidden="true" /> Reset filters
            </>
          }
          isVisible={hasActiveFilters}
          disabled={isPending}
        />
      }
      countLabel={
        <CountLabel
          shown={visiblePharmaciesCount}
          total={pharmaciesCount}
          label="pharmacies"
          fullWidthOnMobile
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
          onReset={() => setIsFiltersOpen(false)}
        >
          {locationControl('mobile')}
          {sortControl('pharmacies-sort-mobile')}
        </FilterDrawer>
      }
    />
  );
}

export default PharmaciesCatalogFiltersForm;
