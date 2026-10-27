'use client';

import { useMemo } from 'react';

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  CalendarDays,
  Map,
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
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { ResetFiltersButton } from '@e-pharmacy/ui/primitives';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import {
  buildPharmacyPath,
  formatPharmacyLocationLabel,
  normalizeLocationKey,
  PHARMACIES_SORT_OPTIONS,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import CatalogFiltersShell from '@/components/catalog/CatalogFiltersShell/CatalogFiltersShell';
import { useCatalogNavigation } from '@/components/catalog/hooks/useCatalogNavigation';
import { useRemotePharmacyOptions } from '@/components/catalog/hooks/useRemotePharmacyOptions';

import css from './PharmaciesCatalogFiltersForm.module.css';

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
  const { isPending, navigate } = useCatalogNavigation();

  const hasActiveFilters = Boolean(
    filters.pharmacyId ||
    filters.name ||
    filters.address ||
    filters.settlement ||
    filters.region ||
    filters.sort !== 'newest'
  );

  const resetHref = createPharmaciesResetFiltersHref();

  const pharmacySearch = useRemotePharmacyOptions('pharmacy', {
    settlement: filters.settlement,
    region: filters.region,
  });

  const locationSearch = useRemotePharmacyOptions('location', {
    pharmacyId: filters.pharmacyId,
  });

  const availablePharmacyOptions = useMemo(
    () => [
      ...pharmacySearch.items,

      ...pharmacyOptions.filter(
        (item) =>
          (!pharmacySearch.isOpen || !pharmacySearch.query.trim()) &&
          !pharmacySearch.items.some((loaded) => loaded.id === item.id)
      ),
    ],
    [
      pharmacySearch.items,
      pharmacySearch.isOpen,
      pharmacySearch.query,
      pharmacyOptions,
    ]
  );

  const availableLocationOptions = useMemo(
    () => [
      ...locationSearch.items,

      ...locationOptions.filter(
        (item) =>
          (!locationSearch.isOpen || !locationSearch.query.trim()) &&
          !locationSearch.items.some(
            (loaded) =>
              getLocationOptionValue(loaded) === getLocationOptionValue(item)
          )
      ),
    ],
    [
      locationSearch.items,
      locationSearch.isOpen,
      locationSearch.query,
      locationOptions,
    ]
  );

  const pharmacySelectOptions = useMemo(
    () => [
      ...(!pharmacySearch.query.trim()
        ? [{ value: '', label: 'All pharmacies' }]
        : []),

      ...availablePharmacyOptions.map((pharmacy) => ({
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
    [availablePharmacyOptions, pharmacySearch.query]
  );

  const selectedLocationValue = useMemo(() => {
    if (!filters.settlement) return 'all';

    return getLocationOptionValue({
      settlement: filters.settlement,
      ...(filters.region ? { region: filters.region } : {}),
    });
  }, [filters.region, filters.settlement]);

  // A selected location must survive opening a deep link, an empty remote
  // page and cache misses. The URL is the source of truth for the selection,
  // not the first 50 server-side suggestions.
  const selectedLocation = useMemo(() => {
    if (!filters.settlement) return null;

    return (
      availableLocationOptions.find(
        (option) =>
          normalizeLocationKey(option.settlement) ===
            normalizeLocationKey(filters.settlement) &&
          normalizeLocationKey(option.region ?? '') ===
            normalizeLocationKey(filters.region)
      ) ?? {
        settlement: filters.settlement,
        region: filters.region,
      }
    );
  }, [availableLocationOptions, filters.settlement, filters.region]);

  const locationSelectOptions = useMemo(() => {
    const searching = Boolean(locationSearch.query.trim());

    const asOption = (
      location: Pick<PharmacyLocationFilterOption, 'settlement' | 'region'>
    ) => ({
      value: getLocationOptionValue(location),
      label: formatPharmacyLocationLabel(location.settlement, location.region),

      leading: (
        <span className={css.locationIcon}>
          <Map size={16} />
        </span>
      ),
    });

    return [
      ...(!searching ? [{ value: 'all', label: 'All locations' }] : []),

      // Pin the active option to its URL value even if the API returned the
      // same location with different punctuation/capitalization.
      ...(!searching && selectedLocation
        ? [{ ...asOption(selectedLocation), value: selectedLocationValue }]
        : []),

      ...availableLocationOptions
        .filter(
          (location) =>
            searching ||
            !selectedLocation ||
            normalizeLocationKey(location.settlement) !==
              normalizeLocationKey(selectedLocation.settlement) ||
            normalizeLocationKey(location.region ?? '') !==
              normalizeLocationKey(selectedLocation.region ?? '')
        )
        .map(asOption),
    ];
  }, [
    availableLocationOptions,
    locationSearch.query,
    selectedLocation,
    selectedLocationValue,
  ]);

  const updateCatalog = (nextFilters: PharmaciesHrefFilters) => {
    navigate(buildPharmacyFiltersHref({ ...nextFilters, page: 1 }));
  };

  const locationControl = (idSuffix: string) => (
    <SearchableSelect
      id={`pharmacies-location-${idSuffix}`}
      label="Location"
      labelAccessory={
        <InfoTooltip
          label="Location search help"
          title="Location"
          icon={<Map size={20} aria-hidden="true" />}
          items={[
            {
              title: 'Search by settlement',
              icon: <Search size={17} aria-hidden="true" />,
              description:
                'Find cities, towns, and other settlements where E-PHARMACY pharmacies are available. Choose a location to see pharmacies serving that area.',
            },
          ]}
        />
      }
      value={selectedLocationValue}
      options={locationSelectOptions}
      selectedFallbackLabel={
        selectedLocation
          ? formatPharmacyLocationLabel(
              selectedLocation.settlement,
              selectedLocation.region
            )
          : undefined
      }
      filterOptions={false}
      onOpenChange={locationSearch.setIsOpen}
      onQueryChange={locationSearch.setQuery}
      isOptionsLoading={locationSearch.isOptionsLoading}
      hasMoreOptions={locationSearch.hasMore}
      isLoadingMore={locationSearch.isLoadingMore}
      loadMoreError={locationSearch.error}
      onLoadMore={locationSearch.loadMore}
      placeholder="All locations"
      emptyMessage="No locations found"
      isActive={Boolean(filters.settlement)}
      isLoading={isPending}
      disabled={isPending}
      maxLength={USER_SEARCH_MAX_LENGTH}
      sanitizeQuery={sanitizeCatalogTextSearch}
      onChange={(value: string) => {
        if (value === 'all') {
          updateCatalog({ ...filters, settlement: '', region: '' });
          return;
        }

        // Selecting the pinned, already-active option is a no-op.
        if (value === selectedLocationValue) return;

        const location = availableLocationOptions.find(
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
      className={css.sortField}
      value={filters.sort}
      options={PHARMACIES_SORT_OPTIONS.map((option) => ({
        ...option,

        content: (
          <span className={css.sortOption}>
            <span
              className={
                option.value.startsWith('rating')
                  ? css.ratingIcon
                  : css.sortIcon
              }
              aria-hidden="true"
            >
              {option.value.startsWith('rating') ? (
                <Star size={15} fill="currentColor" />
              ) : option.value === 'name-asc' ? (
                <ArrowDownAZ size={15} />
              ) : option.value === 'name-desc' ? (
                <ArrowUpAZ size={15} />
              ) : (
                <CalendarDays size={15} />
              )}
            </span>
            <span>{option.label}</span>
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
                    'Find a pharmacy by name, phone number, email, or address.',
                },
              ]}
            />
          }
          value={filters.pharmacyId ?? ''}
          options={pharmacySelectOptions}
          filterOptions={false}
          onOpenChange={pharmacySearch.setIsOpen}
          onQueryChange={pharmacySearch.setQuery}
          isOptionsLoading={pharmacySearch.isOptionsLoading}
          hasMoreOptions={pharmacySearch.hasMore}
          isLoadingMore={pharmacySearch.isLoadingMore}
          loadMoreError={pharmacySearch.error}
          onLoadMore={pharmacySearch.loadMore}
          placeholder="Name, phone, email, or address"
          emptyMessage="No pharmacies found"
          isActive={Boolean(filters.pharmacyId)}
          isLoading={isPending}
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
        hasActiveFilters ? (
          <ResetFiltersButton
            onClick={() => navigate(resetHref)}
            label={
              <>
                <RotateCcw size={16} aria-hidden="true" /> Reset filters
              </>
            }
            disabled={isPending}
          />
        ) : null
      }
      countLabel={
        <CountLabel
          shown={visiblePharmaciesCount}
          total={pharmaciesCount}
          label="pharmacies"
          fullWidthOnMobile
        />
      }
      filterButton={null}
      desktopSort={sortControl('pharmacies-sort-desktop')}
      drawer={null}
    />
  );
}

export default PharmaciesCatalogFiltersForm;
