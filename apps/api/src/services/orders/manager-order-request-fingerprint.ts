import { createHash } from 'node:crypto';

import type { CreateManagerOrderInput } from '../../schemas/orders/order.schema';

//===================================================================

export function createManagerOrderRequestFingerprint(
  input: CreateManagerOrderInput
): string {
  const quantitiesByOffer = new Map<
    string,
    { quantity: number; expectedUnitPrice?: number }
  >();

  for (const item of input.items) {
    const previous = quantitiesByOffer.get(item.productOfferId);

    quantitiesByOffer.set(item.productOfferId, {
      quantity: (previous?.quantity ?? 0) + item.quantity,
      ...(item.expectedUnitPrice !== undefined
        ? { expectedUnitPrice: item.expectedUnitPrice }
        : previous?.expectedUnitPrice !== undefined
          ? { expectedUnitPrice: previous.expectedUnitPrice }
          : {}),
    });
  }

  const normalized = {
    clientId: input.clientId,

    items: [...quantitiesByOffer.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([productOfferId, item]) => ({ productOfferId, ...item })),

    paymentMethod: input.paymentMethod,

    deliveryMethod: input.deliveryMethod,

    ...(input.deliveryMethod === 'postal_delivery'
      ? { deliveryDetails: input.deliveryDetails }
      : {}),

    comment: input.comment ?? '',
  };

  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
