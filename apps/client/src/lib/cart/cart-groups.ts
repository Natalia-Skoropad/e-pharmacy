import { buildCheckoutPath } from '@/lib/routes';
import type { Cart } from '@e-pharmacy/types';

//===================================================================

export type CartPharmacyGroup = {
  pharmacyId: string;
  pharmacyName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
};

//===================================================================

export function groupCartItemsByPharmacy(
  items: Cart['items']
): CartPharmacyGroup[] {
  const groups = new Map<string, CartPharmacyGroup>();

  for (const item of items) {
    const pharmacyName =
      item.pharmacyName || item.product.pharmacyName || 'Pharmacy order';

    const currentGroup = groups.get(item.pharmacyId);

    if (currentGroup) {
      currentGroup.items.push(item);
      currentGroup.totalItems += item.quantity;
      currentGroup.totalPrice += item.totalPrice;
      continue;
    }

    groups.set(item.pharmacyId, {
      pharmacyId: item.pharmacyId,
      pharmacyName,
      items: [item],
      totalItems: item.quantity,
      totalPrice: item.totalPrice,
      pharmacyRating: item.pharmacyRating,
      pharmacyReviewsCount: item.pharmacyReviewsCount,
    });
  }

  return [...groups.values()];
}

//===================================================================

export function groupCartByPharmacy(cart: Cart): CartPharmacyGroup[] {
  return groupCartItemsByPharmacy(cart.items);
}

export function getCartOrderTotal(group: CartPharmacyGroup): number {
  return group.items.reduce((total, item) => total + item.totalPrice, 0);
}

export function getCartOrderPath(group: CartPharmacyGroup): string {
  return buildCheckoutPath(group.pharmacyName, group.pharmacyId);
}

export function getCartOrdersCount(cart: Cart): number {
  return groupCartByPharmacy(cart).length;
}
