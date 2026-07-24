import type { EntityId } from '../primitives';

//===================================================================

export type AddCartItemPayload = {
  productId: EntityId;
  pharmacyId: EntityId;
  quantity: number;
};

export type UpdateCartItemPayload = { quantity: number };
