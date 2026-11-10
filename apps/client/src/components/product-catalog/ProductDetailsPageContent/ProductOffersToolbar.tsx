'use client';

import { useMemo } from 'react';

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  CalendarDays,
  Map as MapIcon,
  RotateCcw,
  Search,
  Star,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from 'lucide-react';

import type { ProductOffer } from '@e-pharmacy/types/products';

import type {
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
  formatPharmacyLocationLabel,
  normalizeLocationKey,
} from '@/lib/catalog/pharmacies-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import {
  buildProductOffersPath,
  type ProductOffersFilters,
} from '@/lib/catalog/product-offers-paths';

import CatalogFiltersShell from '@/components/catalog/CatalogFiltersShell/CatalogFiltersShell';
import { useCatalogNavigation } from '@/components/catalog/hooks/useCatalogNavigation';
import { useRemotePharmacyOptions } from '@/components/catalog/hooks/useRemotePharmacyOptions';

import {
  PRODUCT_OFFER_SORT_OPTIONS,
  type ProductOfferSort,
} from '@/components/product-catalog/config/product-offers';

import { ProductOfferResultsSkeleton } from './ProductOfferResultsSkeleton';

import css from './ProductOffersToolbar.module.css';

//===================================================================

type Props = Readonly<{
  offers: readonly ProductOffer[];
  productId: string;
  baseProductPath: string;
  contextPharmacyId?: string;
  filters: ProductOffersFilters;
  shown: number;
  total: number;
}>;

//===================================================================

// Match locations by their identity, not the display casing or raw URL spelling.
// Public search results and product offers can represent the same place with
// different capitalization; this key prevents duplicate dropdown entries.
function locationValue(
  location: Pick<PharmacyLocationFilterOption, 'settlement' | 'region'>
): string {
  return `${normalizeLocationKey(location.settlement)}|${normalizeLocationKey(location.region ?? '')}`;
}

//===================================================================

function displayLocationPart(value: string, capitalizeWords = false): string {
  const normalized = value.normalize('NFKC').trim().toLocaleLowerCase('uk-UA');

  if (capitalizeWords) {
    return normalized.replace(
      /(^|[\s-])(\p{L})/gu,
      (_match, separator: string, letter: string) =>
        `${separator}${letter.toLocaleUpperCase('uk-UA')}`
    );
  }

  return normalized.replace(/^(\p{L})/u, (letter) =>
    letter.toLocaleUpperCase('uk-UA')
  );
}

//===================================================================

function displayLocation(
  location: Pick<PharmacyLocationFilterOption, 'settlement' | 'region'>
): string {
  return formatPharmacyLocationLabel(
    displayLocationPart(location.settlement, true),
    location.region ? displayLocationPart(location.region) : undefined
  );
}

//===================================================================

export function ProductOffersToolbar({
  offers,
  productId,
  baseProductPath,
  contextPharmacyId,
  filters,
  shown,
  total,
}: Props) {
  const { isPending, navigate } = useCatalogNavigation();

  // The same server-paged comboboxes used by the public Pharmacies catalog.
  const pharmacySearch = useRemotePharmacyOptions('pharmacy', {
    productId,
    settlement: filters.settlement,
    region: filters.region,
  });

  const locationSearch = useRemotePharmacyOptions('location', {
    productId,
    pharmacyId: filters.pharmacyId,
  });

  const localPharmacies: PharmacyOption[] = useMemo(
    () =>
      offers
        .filter((offer) => offer.inStock)
        .filter(
          (offer) =>
            (!filters.settlement ||
              normalizeLocationKey(offer.pharmacyLocation?.settlement ?? '') ===
                normalizeLocationKey(filters.settlement)) &&
            (!filters.region ||
              normalizeLocationKey(offer.pharmacyLocation?.region ?? '') ===
                normalizeLocationKey(filters.region))
        )
        .filter((offer) => {
          const query = pharmacySearch.isOpen
            ? pharmacySearch.query.trim().toLocaleLowerCase()
            : '';

          if (!query) return offer.pharmacyId === filters.pharmacyId;

          return [
            offer.pharmacyName,
            offer.pharmacyPhone,
            offer.pharmacyEmail,
            offer.pharmacyLocation?.address,
            offer.pharmacyLocation?.settlement,
            offer.pharmacyLocation?.region,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase()
            .includes(query);
        })
        .map((offer) => ({
          id: offer.pharmacyId,
          name: offer.pharmacyName,
          imageUrl: offer.pharmacyImageUrl,
          phone: offer.pharmacyPhone,
          email: offer.pharmacyEmail,
          location: offer.pharmacyLocation,
        })),
    [
      offers,
      pharmacySearch.isOpen,
      pharmacySearch.query,
      filters.pharmacyId,
      filters.settlement,
      filters.region,
    ]
  );

  const pharmacyOptions = useMemo(
    () => [
      ...(!pharmacySearch.query.trim()
        ? [{ value: '', label: 'All pharmacies' }]
        : []),

      ...[
        ...pharmacySearch.items,
        ...localPharmacies.filter(
          (item) => !pharmacySearch.items.some((other) => other.id === item.id)
        ),
      ].map((pharmacy) => ({
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
          pharmacy.phone,
          pharmacy.email,
          pharmacy.location?.address,
          pharmacy.location?.settlement,
          pharmacy.location?.region,
        ]
          .filter(Boolean)
          .join(' '),
      })),
    ],
    [pharmacySearch.query, pharmacySearch.items, localPharmacies]
  );

  // These are fallback suggestions for the product's actual offers. The
  // remote options API remains authoritative and is still paginated 50 + 50.
  const localLocations = useMemo(() => {
    const locations = new Map<string, PharmacyLocationFilterOption>();

    for (const offer of offers) {
      if (
        !offer.inStock ||
        (filters.pharmacyId && offer.pharmacyId !== filters.pharmacyId)
      )
        continue;

      const settlement = offer.pharmacyLocation?.settlement;

      if (!settlement) continue;

      const location = {
        settlement,
        region: offer.pharmacyLocation?.region,
      };

      const key = locationValue(location);

      if (!locations.has(key)) {
        locations.set(key, {
          ...location,
          label: displayLocation(location),
        });
      }
    }

    return [...locations.values()];
  }, [offers, filters.pharmacyId]);

  // Deduplicate server and local suggestions by normalized settlement/region.
  // Prefer server data whenever both sources contain the same location.
  const availableLocations = useMemo(() => {
    const unique = new Map<string, PharmacyLocationFilterOption>();

    for (const item of locationSearch.items) {
      unique.set(locationValue(item), item);
    }

    if (!locationSearch.query.trim()) {
      for (const item of localLocations) {
        const key = locationValue(item);

        if (!unique.has(key)) unique.set(key, item);
      }
    }

    return [...unique.values()];
  }, [locationSearch.items, locationSearch.query, localLocations]);

  // The selected URL location stays visible even before the first remote page
  // arrives. Display casing is normalized, but URL filtering remains untouched.
  const activeLocationValue = filters.settlement
    ? locationValue({ settlement: filters.settlement, region: filters.region })
    : 'all';

  const activeLocation = useMemo(() => {
    if (!filters.settlement) return null;

    return (
      availableLocations.find(
        (item) => locationValue(item) === activeLocationValue
      ) ?? { settlement: filters.settlement, region: filters.region }
    );
  }, [
    availableLocations,
    activeLocationValue,
    filters.settlement,
    filters.region,
  ]);

  const locationOptions = useMemo(() => {
    const searching = Boolean(locationSearch.query.trim());

    const toOption = (
      item: Pick<PharmacyLocationFilterOption, 'settlement' | 'region'>
    ) => ({
      value: locationValue(item),
      label: displayLocation(item),

      leading: (
        <span className={css.locationIcon}>
          <MapIcon size={16} aria-hidden="true" />
        </span>
      ),
    });

    return [
      ...(!searching ? [{ value: 'all', label: 'All locations' }] : []),

      ...(!searching && activeLocation
        ? [{ ...toOption(activeLocation), value: activeLocationValue }]
        : []),

      ...availableLocations
        .filter(
          (item) => searching || locationValue(item) !== activeLocationValue
        )
        .map(toOption),
    ];
  }, [
    availableLocations,
    activeLocation,
    activeLocationValue,
    locationSearch.query,
  ]);

  const update = (next: Partial<ProductOffersFilters>) =>
    navigate(
      buildProductOffersPath(
        baseProductPath,
        { ...filters, ...next, page: 1 },
        contextPharmacyId
      )
    );

  const hasActiveFilters = Boolean(
    filters.pharmacyId || filters.settlement || filters.sort !== 'newest'
  );

  return (
    <CatalogFiltersShell
      headingId="product-offer-filters-title"
      heading="Product pharmacies filters"
      layout="pharmacy"
      isPending={isPending}
      searchFields={
        <SearchableSelect
          id="product-offers-pharmacy-search"
          label="Pharmacy search"
          labelAccessory={
            <InfoTooltip
              label="Pharmacy search help"
              title="Pharmacy search"
              icon={<Building2 size={20} aria-hidden="true" />}
              items={[
                {
                  title: 'Search fields',
                  icon: <Search size={17} />,
                  description:
                    'Find a pharmacy by name, phone number, email, or address.',
                },
              ]}
            />
          }
          value={filters.pharmacyId}
          options={pharmacyOptions}
          selectedFallbackLabel={
            offers.find((offer) => offer.pharmacyId === filters.pharmacyId)
              ?.pharmacyName
          }
          filterOptions={false}
          onOpenChange={pharmacySearch.setIsOpen}
          onQueryChange={pharmacySearch.setQuery}
          isOptionsLoading={
            pharmacySearch.isOptionsLoading && localPharmacies.length === 0
          }
          hasMoreOptions={pharmacySearch.hasMore}
          isLoadingMore={pharmacySearch.isLoadingMore}
          loadMoreError={pharmacySearch.error}
          loadMoreErrorVariant="notice"
          onLoadMore={pharmacySearch.loadMore}
          placeholder="Name, phone, email, or address"
          emptyMessage="No pharmacies found"
          isActive={Boolean(filters.pharmacyId)}
          isLoading={isPending}
          disabled={isPending}
          maxLength={USER_SEARCH_MAX_LENGTH}
          sanitizeQuery={sanitizeCatalogTextSearch}
          onChange={(pharmacyId) => update({ pharmacyId })}
        />
      }
      desktopFilterFields={
        <SearchableSelect
          id="product-offers-location"
          label="Location"
          labelAccessory={
            <InfoTooltip
              label="Location search help"
              title="Location"
              icon={<MapIcon size={20} aria-hidden="true" />}
              items={[
                {
                  title: 'Search by settlement',
                  icon: <Search size={17} />,
                  description:
                    'Find cities, towns, and other settlements where this product is offered.',
                },
              ]}
            />
          }
          value={activeLocationValue}
          options={locationOptions}
          selectedFallbackLabel={
            activeLocation ? displayLocation(activeLocation) : undefined
          }
          filterOptions={false}
          onOpenChange={locationSearch.setIsOpen}
          onQueryChange={locationSearch.setQuery}
          isOptionsLoading={locationSearch.isOptionsLoading}
          hasMoreOptions={locationSearch.hasMore}
          isLoadingMore={locationSearch.isLoadingMore}
          loadMoreError={locationSearch.error}
          loadMoreErrorVariant="notice"
          onLoadMore={locationSearch.loadMore}
          placeholder="All locations"
          emptyMessage="No locations found"
          isActive={Boolean(filters.settlement)}
          isLoading={isPending}
          disabled={isPending}
          maxLength={USER_SEARCH_MAX_LENGTH}
          sanitizeQuery={sanitizeCatalogTextSearch}
          onChange={(value) => {
            if (value === 'all') return update({ settlement: '', region: '' });
            if (value === activeLocationValue) return;

            const location = availableLocations.find(
              (item) => locationValue(item) === value
            );

            if (location)
              update({
                settlement: location.settlement,
                region: location.region ?? '',
              });
          }}
        />
      }
      resetAction={
        hasActiveFilters ? (
          <ResetFiltersButton
            disabled={isPending}
            onClick={() =>
              navigate(
                buildProductOffersPath(baseProductPath, {}, contextPharmacyId)
              )
            }
            label={
              <>
                <RotateCcw size={16} aria-hidden="true" /> Reset filters
              </>
            }
          />
        ) : null
      }
      countLabel={
        <CountLabel
          shown={shown}
          total={total}
          label="pharmacies"
          fullWidthOnMobile
        />
      }
      filterButton={null}
      stackOnTablet
      pendingContent={<ProductOfferResultsSkeleton count={3} />}
      desktopSort={
        <SelectField
          id="product-offers-sort"
          label="Sort by"
          className={css.sortField}
          value={filters.sort}
          isActive={filters.sort !== 'newest'}
          disabled={isPending}
          options={PRODUCT_OFFER_SORT_OPTIONS.map((option) => ({
            ...option,
            content: (
              <span className={css.sortOption}>
                <span
                  className={
                    option.value.startsWith('rating')
                      ? css.ratingIcon
                      : css.sortIcon
                  }
                >
                  {option.value.startsWith('rating') ? (
                    <Star size={15} fill="currentColor" />
                  ) : option.value === 'name-asc' ? (
                    <ArrowDownAZ size={15} />
                  ) : option.value === 'name-desc' ? (
                    <ArrowUpAZ size={15} />
                  ) : option.value === 'price-asc' ? (
                    <ArrowDownWideNarrow size={15} />
                  ) : option.value === 'price-desc' ? (
                    <ArrowUpWideNarrow size={15} />
                  ) : (
                    <CalendarDays size={15} />
                  )}
                </span>
                <span>{option.label}</span>
              </span>
            ),
          }))}
          onChange={(sort: ProductOfferSort) => update({ sort })}
        />
      }
      drawer={null}
    />
  );
}
