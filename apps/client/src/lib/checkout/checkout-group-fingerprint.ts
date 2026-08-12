import type { CartItem } from '@e-pharmacy/types/cart';

//===================================================================

type CheckoutFingerprintItem = Pick<
  CartItem,
  'id' | 'productOfferId' | 'quantity' | 'unitPrice'
>;

type CheckoutFingerprintGroup = Readonly<{
  pharmacyId: string;
  items: readonly CheckoutFingerprintItem[];
  totalItems: number;
  totalPrice: number;
}>;

//===================================================================

function money(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      'Checkout money values must be finite and non-negative.'
    );
  }

  return value.toFixed(2);
}

//===================================================================

export function createCheckoutGroupFingerprint(
  group: CheckoutFingerprintGroup
): string {
  const items = [...group.items]
    .sort((left, right) => left.id.localeCompare(right.id, 'en'))
    .map((item) => ({
      id: item.id,
      productOfferId: item.productOfferId,
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
    }));

  return JSON.stringify({
    pharmacyId: group.pharmacyId,
    items,
    totalItems: group.totalItems,
    totalPrice: money(group.totalPrice),
  });
}
