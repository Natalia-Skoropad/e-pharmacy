import {
  deslugifyNameSegment,
  slugifySegment,
} from '@e-pharmacy/validation/url';

import type { ProductOffer } from '@e-pharmacy/types/products';

import type { ProductOfferSort } from '@/components/product-catalog/config/product-offers';

import { normalizeLocationKey } from './pharmacies-catalog-filters';

//===================================================================

// Offer URLs follow the public pharmacy catalog's location/region/sort/page
// convention. All segments are optional and the default is the bare tab URL.
export type ProductOffersFilters = Readonly<{
  pharmacyId: string;
  settlement: string;
  region: string;
  sort: ProductOfferSort;
  page: number;
}>;

//===================================================================

export const DEFAULT_PRODUCT_OFFERS_FILTERS: ProductOffersFilters = {
  pharmacyId: '',
  settlement: '',
  region: '',
  sort: 'newest',
  page: 1,
};

//===================================================================

const SORT_VALUES: readonly ProductOfferSort[] = [
  'newest',
  'rating-desc',
  'rating-asc',
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
];

//===================================================================

export function parseProductOffersSegments(
  segments: readonly string[]
): ProductOffersFilters | null {
  if (segments.length > 5) return null;

  const result = { ...DEFAULT_PRODUCT_OFFERS_FILTERS };
  const seen = new Set<string>();

  for (const encodedSegment of segments) {
    // Next route params may already be decoded; usePathname can be encoded.
    // Normalize both forms so Cyrillic settlements work after refresh.
    let segment: string;

    try {
      segment = decodeURIComponent(encodedSegment);
    } catch {
      return null;
    }

    const prefix = [
      'pharmacy-id-',
      'location-',
      'region-',
      'sort-',
      'page-',
    ].find((candidate) => segment.startsWith(candidate));

    if (!prefix || seen.has(prefix)) return null;

    seen.add(prefix);

    const raw = segment.slice(prefix.length);

    if (!raw) return null;

    if (prefix === 'pharmacy-id-') {
      if (!/^[a-f\d]{24}$/i.test(raw)) return null;
      result.pharmacyId = raw.toLowerCase();
    } else if (prefix === 'location-') {
      result.settlement = deslugifyNameSegment(raw);
      if (!result.settlement) return null;
    } else if (prefix === 'region-') {
      result.region = deslugifyNameSegment(raw);
      if (!result.region) return null;
    } else if (prefix === 'sort-') {
      if (!SORT_VALUES.includes(raw as ProductOfferSort) || raw === 'newest')
        return null;

      result.sort = raw as ProductOfferSort;
    } else {
      const page = Number(raw);

      if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(page) || page < 2)
        return null;
      result.page = page;
    }
  }

  if (result.region && !result.settlement) return null;

  return result;
}

//===================================================================

export function buildProductOffersPath(
  baseProductPath: string,
  filters: Partial<ProductOffersFilters> = {},
  contextPharmacyId?: string
): string {
  const parts: string[] = [];

  if (filters.pharmacyId && /^[a-f\d]{24}$/i.test(filters.pharmacyId)) {
    parts.push(`pharmacy-id-${filters.pharmacyId.toLowerCase()}`);
  }

  if (filters.settlement) {
    const location = slugifySegment(filters.settlement);

    if (location) parts.push(`location-${location}`);

    if (filters.region) {
      const region = slugifySegment(filters.region);

      if (region) parts.push(`region-${region}`);
    }
  }

  if (
    filters.sort &&
    filters.sort !== 'newest' &&
    SORT_VALUES.includes(filters.sort)
  ) {
    parts.push(`sort-${filters.sort}`);
  }

  if (filters.page && filters.page > 1 && Number.isSafeInteger(filters.page)) {
    parts.push(`page-${filters.page}`);
  }

  const pathname = `${baseProductPath.replace(/\/$/, '')}/pharmacies${parts.length ? `/${parts.join('/')}` : ''}`;

  return contextPharmacyId
    ? `${pathname}?pharmacyId=${encodeURIComponent(contextPharmacyId)}`
    : pathname;
}

//===================================================================

export function filterProductOffers(
  offers: readonly ProductOffer[],
  filters: ProductOffersFilters,
  favoriteIds?: ReadonlySet<string>,
  contextPharmacyId?: string
): ProductOffer[] {
  const result = offers.filter((offer) => {
    if (!offer.inStock) return false;

    if (filters.pharmacyId && offer.pharmacyId !== filters.pharmacyId)
      return false;

    if (
      filters.settlement &&
      normalizeLocationKey(offer.pharmacyLocation?.settlement ?? '') !==
        normalizeLocationKey(filters.settlement)
    )
      return false;

    if (
      filters.region &&
      normalizeLocationKey(offer.pharmacyLocation?.region ?? '') !==
        normalizeLocationKey(filters.region)
    )
      return false;

    return true;
  });

  return result
    .map((offer, index) => ({ offer, index }))
    .sort((a, b) => {
      const aFavorite = favoriteIds
        ? favoriteIds.has(a.offer.pharmacyId)
        : a.offer.pharmacyIsFavorite;

      const bFavorite = favoriteIds
        ? favoriteIds.has(b.offer.pharmacyId)
        : b.offer.pharmacyIsFavorite;

      if (aFavorite !== bFavorite) return aFavorite ? -1 : 1;

      if (contextPharmacyId) {
        if (a.offer.pharmacyId === contextPharmacyId) return -1;
        if (b.offer.pharmacyId === contextPharmacyId) return 1;
      }

      switch (filters.sort) {
        case 'price-asc':
          return a.offer.price - b.offer.price;
        case 'price-desc':
          return b.offer.price - a.offer.price;
        case 'rating-desc':
          return (b.offer.pharmacyRating ?? 0) - (a.offer.pharmacyRating ?? 0);
        case 'rating-asc':
          return (a.offer.pharmacyRating ?? 0) - (b.offer.pharmacyRating ?? 0);
        case 'name-asc':
          return a.offer.pharmacyName.localeCompare(b.offer.pharmacyName, 'en');
        case 'name-desc':
          return b.offer.pharmacyName.localeCompare(a.offer.pharmacyName, 'en');
        default:
          return a.index - b.index;
      }
    })
    .map(({ offer }) => offer);
}
