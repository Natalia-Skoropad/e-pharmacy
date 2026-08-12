import type { CartIssueReason } from '../types/cart';

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
