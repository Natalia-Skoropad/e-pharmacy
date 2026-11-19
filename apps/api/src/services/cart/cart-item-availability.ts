import type { CartIssueReason } from '../../types/cart/cart';

//===============================================================

type CartItemAvailabilityInput = Readonly<{
  isExpired: boolean;
  offerExists: boolean;
  productStatus?: string;
  pharmacyStatus?: string;
}>;

//===============================================================

export function getCartItemUnavailableReason({
  isExpired,
  offerExists,
  productStatus,
  pharmacyStatus,
}: CartItemAvailabilityInput): CartIssueReason | null {
  if (isExpired) return 'expired';
  if (!offerExists) return 'offer_unavailable';
  if (productStatus !== 'active') return 'product_unavailable';

  if (pharmacyStatus !== 'active' && pharmacyStatus !== 'on_moderation') {
    return 'pharmacy_unavailable';
  }

  return null;
}

//===============================================================

/**
 * A cart is not a stock reservation. If another order consumes its stock,
 * the client must still be able to decrease a stale quantity one unit at a
 * time. Only increases are constrained by the current available quantity.
 * Checkout independently validates the entire final quantity.
 */
export function exceedsAvailableStockOnIncrease(
  currentQuantity: number,
  nextQuantity: number,
  availableQuantity: number
): boolean {
  return nextQuantity > currentQuantity && nextQuantity > availableQuantity;
}
