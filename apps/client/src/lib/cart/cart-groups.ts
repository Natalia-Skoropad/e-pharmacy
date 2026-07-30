import type { Cart } from '@e-pharmacy/types/cart';

import { buildCheckoutPath } from '@/lib/routes';

//===================================================================

export type CartPharmacyGroup = Readonly<{
  pharmacyId: string;
  pharmacyName: string;
  items: readonly Cart['items'][number][];
  totalItems: number;
  totalPrice: number;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  hasInconsistentPharmacyMetadata: boolean;
}>;

//===================================================================

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

//===================================================================

function getDistinctStrings(values: readonly (string | undefined)[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    ),
  ].sort((a, b) => a.localeCompare(b, 'en'));
}

//===================================================================

function getDistinctFiniteNumbers(
  values: readonly (number | undefined)[]
): number[] {
  return [
    ...new Set(
      values.filter(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value)
      )
    ),
  ].sort((a, b) => a - b);
}

//===================================================================

export function groupCartItemsByPharmacy(
  items: Cart['items']
): readonly CartPharmacyGroup[] {
  const itemsByPharmacy = new Map<string, Cart['items'][number][]>();

  for (const item of items) {
    const groupItems = itemsByPharmacy.get(item.pharmacyId) ?? [];
    groupItems.push(item);
    itemsByPharmacy.set(item.pharmacyId, groupItems);
  }

  return Object.freeze(
    [...itemsByPharmacy.entries()].map(([pharmacyId, groupItems]) => {
      const pharmacyNames = getDistinctStrings(
        groupItems.flatMap((item) => [
          item.pharmacyName,
          item.product.pharmacyName,
        ])
      );

      const pharmacyRatings = getDistinctFiniteNumbers(
        groupItems.map((item) => item.pharmacyRating)
      );

      const pharmacyReviewsCounts = getDistinctFiniteNumbers(
        groupItems.map((item) => item.pharmacyReviewsCount)
      );

      const group = {
        pharmacyId,
        pharmacyName: pharmacyNames[0] ?? pharmacyId,
        items: Object.freeze([...groupItems]),
        totalItems: groupItems.reduce(
          (total, item) => total + item.quantity,
          0
        ),

        totalPrice: roundMoney(
          groupItems.reduce((total, item) => total + item.totalPrice, 0)
        ),

        ...(pharmacyRatings.length === 1
          ? { pharmacyRating: pharmacyRatings[0] }
          : {}),

        ...(pharmacyReviewsCounts.length === 1
          ? { pharmacyReviewsCount: pharmacyReviewsCounts[0] }
          : {}),

        hasInconsistentPharmacyMetadata:
          pharmacyNames.length > 1 ||
          pharmacyRatings.length > 1 ||
          pharmacyReviewsCounts.length > 1,
      } satisfies CartPharmacyGroup;

      return Object.freeze(group);
    })
  );
}

//===================================================================

export function groupCartByPharmacy(cart: Cart): readonly CartPharmacyGroup[] {
  return groupCartItemsByPharmacy(cart.items);
}

//===================================================================

export function getCartOrderTotal(group: CartPharmacyGroup): number {
  return group.totalPrice;
}

//===================================================================

export function getCartOrderPath(group: CartPharmacyGroup): string {
  return buildCheckoutPath(group.pharmacyName, group.pharmacyId);
}
