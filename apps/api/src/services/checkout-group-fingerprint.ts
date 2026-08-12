import type { Types } from 'mongoose';

//===================================================================

type CheckoutFingerprintItem = Readonly<{
  id: Types.ObjectId;
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
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
  input: Readonly<{
    pharmacyId: string;
    items: readonly CheckoutFingerprintItem[];
  }>
): string {
  const items = [...input.items]
    .sort((left, right) =>
      left.id.toString().localeCompare(right.id.toString(), 'en')
    )
    .map((item) => ({
      id: item.id.toString(),
      productOfferId: item.productOfferId.toString(),
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
    }));

  const totalItems = input.items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return JSON.stringify({
    pharmacyId: input.pharmacyId,
    items,
    totalItems,
    totalPrice: money(totalPrice),
  });
}
