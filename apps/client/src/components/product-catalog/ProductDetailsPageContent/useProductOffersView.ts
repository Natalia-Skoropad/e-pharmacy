'use client';

import { useMemo, useState } from 'react';

import type { ProductOffer } from '@e-pharmacy/types/products';
import { formatPharmacyLocation } from '@e-pharmacy/utils/strings';

import {
  normalizeCatalogSearchValue,
  sanitizeCatalogTextSearch,
} from '@/lib/catalog/search-sanitizers';

import {
  PRODUCT_OFFERS_PER_PAGE,
  type ProductOfferSort,
} from '@/components/product-catalog/config/product-offers';

//===================================================================

type ProductOfferLocationOption = Readonly<{
  value: string;
  label: string;
}>;

//===================================================================

function getOfferLocationFilterValue(offer: ProductOffer): string {
  const settlement = offer.pharmacyLocation?.settlement?.trim();
  if (!settlement) return '';

  const region = offer.pharmacyLocation?.region?.trim() ?? '';

  return [settlement, region]
    .map((part) => normalizeCatalogSearchValue(part))
    .join('::');
}

//===================================================================

function getUniqueOfferLocations(
  offers: readonly ProductOffer[]
): ProductOfferLocationOption[] {
  const locations = new Map<
    string,
    Readonly<{ settlement: string; region?: string }>
  >();

  for (const offer of offers) {
    const settlement = offer.pharmacyLocation?.settlement?.trim();
    if (!settlement) continue;

    const region = offer.pharmacyLocation?.region?.trim() || undefined;
    const value = getOfferLocationFilterValue(offer);

    if (!locations.has(value)) {
      locations.set(value, { settlement, ...(region ? { region } : {}) });
    }
  }

  const settlementVariants = new Map<string, number>();

  for (const location of locations.values()) {
    const key = normalizeCatalogSearchValue(location.settlement);
    settlementVariants.set(key, (settlementVariants.get(key) ?? 0) + 1);
  }

  return [...locations.entries()]
    .map(([value, location]) => {
      const settlementKey = normalizeCatalogSearchValue(location.settlement);
      const needsRegion = (settlementVariants.get(settlementKey) ?? 0) > 1;

      return {
        value,
        label:
          needsRegion && location.region
            ? `${location.settlement} (${location.region})`
            : location.settlement,
      };
    })
    .sort((first, second) => first.label.localeCompare(second.label, 'en'));
}

//===================================================================

export function useProductOffersView(
  offers: readonly ProductOffer[],
  contextPharmacyId?: string,
  favoritePharmacyIds?: ReadonlySet<string>
) {
  const [pharmacyNameQuery, setPharmacyNameQuery] = useState('');
  const [pharmacyAddressQuery, setPharmacyAddressQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [offerSort, setOfferSort] = useState<ProductOfferSort>('newest');

  const [visibleOffersCount, setVisibleOffersCount] = useState(
    PRODUCT_OFFERS_PER_PAGE
  );

  const [areFiltersOpen, setAreFiltersOpen] = useState(false);

  const availableOffers = useMemo(
    () => offers.filter((offer) => offer.inStock),
    [offers]
  );

  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All locations' },
      ...getUniqueOfferLocations(availableOffers),
    ],
    [availableOffers]
  );

  const filteredOffers = useMemo(() => {
    const normalizedNameQuery = normalizeCatalogSearchValue(pharmacyNameQuery);
    const normalizedAddressQuery =
      normalizeCatalogSearchValue(pharmacyAddressQuery);

    return availableOffers
      .map((offer, index) => ({ offer, index }))
      .filter(({ offer }) => {
        const nameMatches = normalizeCatalogSearchValue(
          offer.pharmacyName
        ).includes(normalizedNameQuery);

        const addressMatches = normalizeCatalogSearchValue(
          formatPharmacyLocation(offer.pharmacyLocation)
        ).includes(normalizedAddressQuery);

        const locationMatches =
          locationFilter === 'all' ||
          getOfferLocationFilterValue(offer) === locationFilter;

        return nameMatches && addressMatches && locationMatches;
      })
      .sort((a, b) => {
        const isAFavorite = favoritePharmacyIds
          ? favoritePharmacyIds.has(a.offer.pharmacyId)
          : a.offer.pharmacyIsFavorite;

        const isBFavorite = favoritePharmacyIds
          ? favoritePharmacyIds.has(b.offer.pharmacyId)
          : b.offer.pharmacyIsFavorite;

        if (isAFavorite !== isBFavorite) return isAFavorite ? -1 : 1;

        if (contextPharmacyId) {
          if (a.offer.pharmacyId === contextPharmacyId) return -1;
          if (b.offer.pharmacyId === contextPharmacyId) return 1;
        }

        if (offerSort === 'price-asc') return a.offer.price - b.offer.price;
        if (offerSort === 'price-desc') return b.offer.price - a.offer.price;

        if (offerSort === 'rating-desc') {
          return (b.offer.pharmacyRating ?? 0) - (a.offer.pharmacyRating ?? 0);
        }

        if (offerSort === 'rating-asc') {
          return (a.offer.pharmacyRating ?? 0) - (b.offer.pharmacyRating ?? 0);
        }

        if (offerSort === 'name-asc') {
          return a.offer.pharmacyName.localeCompare(b.offer.pharmacyName, 'en');
        }

        if (offerSort === 'name-desc') {
          return b.offer.pharmacyName.localeCompare(a.offer.pharmacyName, 'en');
        }

        return a.index - b.index;
      })
      .map(({ offer }) => offer);
  }, [
    availableOffers,
    contextPharmacyId,
    favoritePharmacyIds,
    locationFilter,
    offerSort,
    pharmacyAddressQuery,
    pharmacyNameQuery,
  ]);

  const visibleOffers = filteredOffers.slice(0, visibleOffersCount);

  const hasActiveFilters =
    Boolean(pharmacyNameQuery.trim()) ||
    Boolean(pharmacyAddressQuery.trim()) ||
    locationFilter !== 'all';

  const resetVisibleCount = () =>
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);

  return {
    availableOffers,
    filteredOffers,
    visibleOffers,
    locationOptions,
    pharmacyNameQuery,
    pharmacyAddressQuery,
    locationFilter,
    offerSort,
    areFiltersOpen,
    hasActiveFilters,
    sanitizeSearchValue: sanitizeCatalogTextSearch,
    setPharmacyNameQuery: (value: string) => {
      setPharmacyNameQuery(value);
      resetVisibleCount();
    },

    setPharmacyAddressQuery: (value: string) => {
      setPharmacyAddressQuery(value);
      resetVisibleCount();
    },

    setLocationFilter: (value: string) => {
      setLocationFilter(value);
      resetVisibleCount();
    },

    setOfferSort: (value: ProductOfferSort) => {
      setOfferSort(value);
      resetVisibleCount();
    },

    toggleFilters: () => setAreFiltersOpen((current) => !current),
    showMore: () =>
      setVisibleOffersCount((current) => current + PRODUCT_OFFERS_PER_PAGE),
  } as const;
}
