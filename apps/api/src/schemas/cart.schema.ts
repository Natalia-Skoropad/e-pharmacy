import { z } from 'zod';

import { mongoIdSchema } from './shared';

//===============================================================

export const cartItemParamsSchema = z.object({
  cartItemId: mongoIdSchema,
});

export const addCartItemSchema = z.object({
  productId: mongoIdSchema,
  pharmacyId: mongoIdSchema,
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});


//===============================================================

export type CartItemParams = z.infer<typeof cartItemParamsSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
