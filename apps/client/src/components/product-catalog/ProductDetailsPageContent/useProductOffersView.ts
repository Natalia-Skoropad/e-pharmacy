'use client';

import { useMemo, useState } from 'react';

import type { ProductOffer } from '@e-pharmacy/types/products';

import {
  normalizeCatalogSearchValue,
  sanitizeCatalogTextSearch,
} from '@/lib/catalog/search-sanitizers';

import {
  PRODUCT_OFFERS_PER_PAGE,
  type ProductOfferSort,
} from '@/components/product-catalog/config/product-offers';

//===================================================================

function getOfferAddress(offer: ProductOffer): string {
  return [offer.pharmacyCity, offer.pharmacyAddress].filter(Boolean).join(', ');
}

//===================================================================

function getUniqueOfferCities(offers: readonly ProductOffer[]): string[] {
  const cities = offers
    .map((offer) => offer.pharmacyCity?.trim())
    .filter((city): city is string => Boolean(city));

  return [...new Set(cities)].sort((a, b) => a.localeCompare(b, 'en'));
}

//===================================================================

export function useProductOffersView(
  offers: readonly ProductOffer[],
  contextPharmacyId?: string
) {
  const [pharmacyNameQuery, setPharmacyNameQuery] = useState('');
  const [pharmacyAddressQuery, setPharmacyAddressQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [offerSort, setOfferSort] = useState<ProductOfferSort>('newest');

  const [visibleOffersCount, setVisibleOffersCount] = useState(
    PRODUCT_OFFERS_PER_PAGE
  );

  const [areFiltersOpen, setAreFiltersOpen] = useState(false);

  const availableOffers = useMemo(
    () => offers.filter((offer) => offer.inStock),
    [offers]
  );

  const cityOptions = useMemo(
    () => [
      { value: 'all', label: 'All cities' },
      ...getUniqueOfferCities(availableOffers).map((city) => ({
        value: city,
        label: city,
      })),
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
          getOfferAddress(offer)
        ).includes(normalizedAddressQuery);

        const cityMatches =
          cityFilter === 'all' || offer.pharmacyCity?.trim() === cityFilter;

        return nameMatches && addressMatches && cityMatches;
      })
      .sort((a, b) => {
        if (a.offer.pharmacyIsFavorite !== b.offer.pharmacyIsFavorite) {
          return a.offer.pharmacyIsFavorite ? -1 : 1;
        }

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
    cityFilter,
    contextPharmacyId,
    offerSort,
    pharmacyAddressQuery,
    pharmacyNameQuery,
  ]);

  const visibleOffers = filteredOffers.slice(0, visibleOffersCount);

  const hasActiveFilters =
    Boolean(pharmacyNameQuery.trim()) ||
    Boolean(pharmacyAddressQuery.trim()) ||
    cityFilter !== 'all';

  const resetVisibleCount = () =>
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);

  return {
    availableOffers,
    filteredOffers,
    visibleOffers,
    cityOptions,
    pharmacyNameQuery,
    pharmacyAddressQuery,
    cityFilter,
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

    setCityFilter: (value: string) => {
      setCityFilter(value);
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
