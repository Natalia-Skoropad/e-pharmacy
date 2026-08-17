import type { Cart } from '@e-pharmacy/types/cart';

import { buildCheckoutPath } from '@/lib/routes';

//===================================================================

export type CartPharmacyGroup = Readonly<{
  pharmacyId: string;
  pharmacyName: string;
  pharmacyImageUrl?: string;
  items: readonly Cart['items'][number][];
  totalItems: number;
  totalPrice: number;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
}>;

//===================================================================

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
      const firstItem = groupItems[0];

      if (!firstItem) {
        throw new Error(`Cart pharmacy group ${pharmacyId} is empty.`);
      }

      const group = {
        pharmacyId,
        pharmacyName: firstItem.pharmacyName,
        ...(firstItem.pharmacyImageUrl !== undefined
          ? { pharmacyImageUrl: firstItem.pharmacyImageUrl }
          : {}),
        items: Object.freeze([...groupItems]),
        totalItems: groupItems.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        totalPrice: roundMoney(
          groupItems.reduce((total, item) => total + item.totalPrice, 0)
        ),
        ...(firstItem.pharmacyRating !== undefined
          ? { pharmacyRating: firstItem.pharmacyRating }
          : {}),
        ...(firstItem.pharmacyReviewsCount !== undefined
          ? { pharmacyReviewsCount: firstItem.pharmacyReviewsCount }
          : {}),
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

export function getCartOrderPath(group: CartPharmacyGroup): string {
  return buildCheckoutPath(group.pharmacyName, group.pharmacyId);
}
