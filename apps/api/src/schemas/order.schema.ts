import { z } from 'zod';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');

//===============================================================

export const orderParamsSchema = z.object({
  orderId: mongoIdSchema,
});

export const checkoutOrderSchema = z
  .object({
    storeId: mongoIdSchema,
    paymentMethod: z.enum(['cash', 'bank-transfer']),
    deliveryMethod: z.enum(['pickup', 'post']),
    deliveryDetails: z
      .object({
        recipientName: z.string().trim().min(2).max(80).optional(),
        recipientPhone: z.string().trim().min(10).max(30).optional(),
        address: z.string().trim().min(5).max(160).optional(),
      })
      .optional(),
    comment: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMethod !== 'post') return;

    if (!value.deliveryDetails?.recipientName) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryDetails', 'recipientName'],
        message: 'Recipient name is required for post delivery',
      });
    }

    if (!value.deliveryDetails?.recipientPhone) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryDetails', 'recipientPhone'],
        message: 'Recipient phone is required for post delivery',
      });
    }

    if (!value.deliveryDetails?.address) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryDetails', 'address'],
        message: 'Delivery address is required for post delivery',
      });
    }
  });

//===============================================================

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
