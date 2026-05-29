import { buildCheckoutPath } from '@/lib/checkout/checkout-routes';
import type { Cart } from '@/types';

//===================================================================

export type CartStoreGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
  storeRating?: number;
  storeReviewsCount?: number;
};

//===================================================================

export function groupCartItemsByStore(items: Cart['items']): CartStoreGroup[] {
  const groups = new Map<string, CartStoreGroup>();

  for (const item of items) {
    const storeName =
      item.storeName || item.product.storeName || 'Pharmacy order';
    const currentGroup = groups.get(item.storeId);

    if (currentGroup) {
      currentGroup.items.push(item);
      currentGroup.totalItems += item.quantity;
      currentGroup.totalPrice += item.totalPrice;
      continue;
    }

    groups.set(item.storeId, {
      storeId: item.storeId,
      storeName,
      items: [item],
      totalItems: item.quantity,
      totalPrice: item.totalPrice,
      storeRating: item.storeRating,
      storeReviewsCount: item.storeReviewsCount,
    });
  }

  return [...groups.values()];
}

//===================================================================

export function groupCartByStore(cart: Cart): CartStoreGroup[] {
  return groupCartItemsByStore(cart.items);
}

export function getCartInvoiceTotal(group: CartStoreGroup): number {
  return group.items.reduce((total, item) => total + item.totalPrice, 0);
}

export function getCartInvoicePath(group: CartStoreGroup): string {
  return buildCheckoutPath(group.storeName, group.storeId);
}
