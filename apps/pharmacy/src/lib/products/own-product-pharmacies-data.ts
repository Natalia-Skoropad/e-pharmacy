import type { OwnedPharmacyListItem } from '@e-pharmacy/types/pharmacies';
import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';

import type {
  OwnProductPharmaciesRouteState,
  ProductPharmacyStockFilter,
} from './own-product-pharmacies-paths';

import { getProductPharmacyLocationKey } from './own-product-pharmacies-paths';

//===================================================================

export type ProductPharmacyRow = Readonly<{
  offer: ProductOffer;
  pharmacy: OwnedPharmacyListItem;
  availability: Exclude<ProductPharmacyStockFilter, 'all'>;
}>;

export type ProductPharmacyStatistics = Readonly<{
  total: number;
  available: number;
  unavailable: number;
}>;

//===================================================================

/** The owner registry is authoritative for both membership and pharmacy status. */
export function getProductPharmacyRows(
  product: ProductDetails,
  pharmacies: readonly OwnedPharmacyListItem[]
): ProductPharmacyRow[] {
  const owned = new Map(pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]));
  const unique = new Map<string, ProductOffer>();

  for (const offer of product.offers) {
    if (!owned.has(offer.pharmacyId)) continue;

    const previous = unique.get(offer.pharmacyId);

    if (!previous || previous.updatedAt < offer.updatedAt) {
      unique.set(offer.pharmacyId, offer);
    }
  }

  return [...unique.values()]
    .flatMap((offer) => {
      const pharmacy = owned.get(offer.pharmacyId);

      if (!pharmacy) return [];

      const maySell =
        product.status === 'active' &&
        (pharmacy.status === 'active' || pharmacy.status === 'on_moderation');

      let availability: ProductPharmacyRow['availability'];

      if (!maySell) availability = 'unavailable';
      else if (offer.availableQuantity > 0 && offer.inStock)
        availability = 'available';
      else if ((offer.reservedQuantity ?? 0) > 0) availability = 'reserved';
      else availability = 'out-of-stock';

      return [{ offer, pharmacy, availability }];
    })

    .sort((a, b) => b.offer.createdAt.localeCompare(a.offer.createdAt));
}

//===================================================================

export function getProductPharmacyStatistics(
  rows: readonly ProductPharmacyRow[]
): ProductPharmacyStatistics {
  return {
    total: rows.length,
    available: rows.filter((row) => row.availability === 'available').length,
    unavailable: rows.filter((row) => row.availability !== 'available').length,
  };
}

//===================================================================

export function filterProductPharmacyRows(
  rows: readonly ProductPharmacyRow[],
  state: OwnProductPharmaciesRouteState
): ProductPharmacyRow[] {
  return rows.filter(({ offer, pharmacy, availability }) => {
    if (state.pharmacyId && pharmacy.id !== state.pharmacyId) return false;

    if (state.status !== 'all' && pharmacy.status !== state.status)
      return false;

    if (state.stock !== 'all' && availability !== state.stock) return false;

    if (
      state.region &&
      getProductPharmacyLocationKey(pharmacy.location?.region) !== state.region
    )
      return false;

    if (
      state.settlement &&
      getProductPharmacyLocationKey(pharmacy.location?.settlement) !==
        state.settlement
    )
      return false;

    const added = offer.createdAt.slice(0, 10);

    if (state.date.from && added < state.date.from) return false;
    if (state.date.to && added > state.date.to) return false;

    return true;
  });
}

//===================================================================

export function productPharmacyAddedDates(
  rows: readonly ProductPharmacyRow[]
): string[] {
  return [
    ...new Set(rows.map(({ offer }) => offer.createdAt.slice(0, 10))),
  ].sort();
}
