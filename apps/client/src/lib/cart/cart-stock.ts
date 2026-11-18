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

//===================================================================

// The cart is not yet reserved by the server; show the unselected stock.
// Do not use this value to enforce limits: server stock remains authoritative.
export function getRemainingCartStock(
  stockQuantity: number,
  selectedQuantity: number
): number {
  return Math.max(0, stockQuantity - selectedQuantity);
}
