import { createHash } from 'node:crypto';

import type { CreateManagerOrderInput } from '../schemas/order.schema';

//===================================================================

export function createManagerOrderRequestFingerprint(
  input: CreateManagerOrderInput
): string {
  const quantitiesByOffer = new Map<string, number>();

  for (const item of input.items) {
    quantitiesByOffer.set(
      item.productOfferId,
      (quantitiesByOffer.get(item.productOfferId) ?? 0) + item.quantity
    );
  }

  const normalized = {
    clientId: input.clientId,
    items: [...quantitiesByOffer.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([productOfferId, quantity]) => ({ productOfferId, quantity })),

    paymentMethod: input.paymentMethod,

    deliveryMethod: input.deliveryMethod,
    ...(input.deliveryMethod === 'postal_delivery'
      ? { deliveryDetails: input.deliveryDetails }
      : {}),
    comment: input.comment ?? '',
  };

  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
