import type { CartItem } from '@e-pharmacy/types/cart';

import type { CartPharmacyGroup } from './cart-groups';

//===================================================================

export function hasCartItemStockConflict(item: CartItem): boolean {
  return item.stockQuantity < item.quantity;
}

//===================================================================

export function hasCartGroupStockConflict(group: CartPharmacyGroup): boolean {
  return group.items.some(hasCartItemStockConflict);
}
