import { z } from 'zod';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');

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
