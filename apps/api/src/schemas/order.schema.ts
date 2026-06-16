import { z } from 'zod';

import {
  sharedOrderCommentSchema,
  sharedRequiredAddressSchema,
  sharedRequiredPhoneSchema,
  sharedNameSchema,
} from './shared-validation.schema';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');

//===============================================================

export const orderParamsSchema = z.object({ orderId: mongoIdSchema });

//===============================================================

const baseCheckoutSchema = z.object({
  pharmacyId: mongoIdSchema,
  paymentMethod: z.enum(['cash', 'bank_transfer']),
  comment: sharedOrderCommentSchema,
});

//===============================================================

export const checkoutOrderSchema = z.discriminatedUnion('deliveryMethod', [
  baseCheckoutSchema.extend({
    deliveryMethod: z.literal('pickup'),
    deliveryDetails: z.never().optional(),
  }),

  baseCheckoutSchema.extend({
    deliveryMethod: z.literal('postal_delivery'),
    deliveryDetails: z.object({
      recipientName: sharedNameSchema,
      recipientPhone: sharedRequiredPhoneSchema,
      address: sharedRequiredAddressSchema,
    }),
  }),
]);

//===============================================================

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['in_progress', 'successful', 'rejected']),
    rejectionReason: z.string().trim().min(3).max(500).optional(),
    comment: z.string().trim().max(500).optional(),
  })

  .superRefine((value, ctx) => {
    if (value.status === 'rejected' && !value.rejectionReason) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejectionReason'],
        message: 'Rejection reason is required',
      });
    }
  });

//===============================================================

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
