import { z } from 'zod';

import { CART_ITEM_MAX_QUANTITY } from '../constants/cart';
import { mongoIdSchema } from './shared';

//===============================================================

export const cartItemParamsSchema = z.object({
  cartItemId: mongoIdSchema,
});

export const cartPharmacyParamsSchema = z.object({
  pharmacyId: mongoIdSchema,
});

export const addCartItemSchema = z.object({
  productId: mongoIdSchema,
  pharmacyId: mongoIdSchema,
  quantity: z.coerce.number().int().min(1).max(CART_ITEM_MAX_QUANTITY).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(CART_ITEM_MAX_QUANTITY),
});


//===============================================================

export type CartItemParams = z.infer<typeof cartItemParamsSchema>;
export type CartPharmacyParams = z.infer<typeof cartPharmacyParamsSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
