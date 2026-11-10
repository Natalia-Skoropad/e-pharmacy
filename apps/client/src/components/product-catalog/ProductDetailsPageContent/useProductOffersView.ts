'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import type { ProductOffer } from '@e-pharmacy/types/products';

import {
  DEFAULT_PRODUCT_OFFERS_FILTERS,
  filterProductOffers,
  parseProductOffersSegments,
} from '@/lib/catalog/product-offers-paths';

import { PRODUCT_OFFERS_PER_PAGE } from '@/components/product-catalog/config/product-offers';

//===================================================================

// All offers are already included in the public product detail response.
// Keep pagination deterministic, driven by URL rather than local component state.
export function useProductOffersView(
  offers: readonly ProductOffer[],
  contextPharmacyId?: string,
  favoritePharmacyIds?: ReadonlySet<string>
) {
  const pathname = usePathname();

  const filters = useMemo(() => {
    const tabMarker = '/pharmacies';
    const tabIndex = pathname.lastIndexOf(tabMarker);

    const segments =
      tabIndex >= 0
        ? pathname
            .slice(tabIndex + tabMarker.length)
            .split('/')
            .filter(Boolean)
        : [];

    return (
      parseProductOffersSegments(segments) ?? DEFAULT_PRODUCT_OFFERS_FILTERS
    );
  }, [pathname]);

  const filteredOffers = useMemo(
    () =>
      filterProductOffers(
        offers,
        filters,
        favoritePharmacyIds,
        contextPharmacyId
      ),
    [offers, filters, favoritePharmacyIds, contextPharmacyId]
  );

  const totalPages = Math.ceil(filteredOffers.length / PRODUCT_OFFERS_PER_PAGE);

  const visibleOffers = filteredOffers.slice(
    (filters.page - 1) * PRODUCT_OFFERS_PER_PAGE,
    filters.page * PRODUCT_OFFERS_PER_PAGE
  );

  return {
    filters,
    filteredOffers,
    visibleOffers,
    totalPages,
    availableOffers: offers.filter((offer) => offer.inStock),

    hasActiveFilters: Boolean(
      filters.pharmacyId || filters.settlement || filters.sort !== 'newest'
    ),
  };
}
