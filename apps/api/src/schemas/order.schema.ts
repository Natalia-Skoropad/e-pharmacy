import { z } from 'zod';

import {
  sharedNameSchema,
  sharedOrderCommentSchema,
  sharedRequiredAddressSchema,
  sharedRequiredPhoneSchema,
  sharedSearchSchema,
} from './shared-validation.schema';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');
const orderRouteIdSchema = z.string().trim().min(1, 'ID is required');

//===============================================================

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(20);

const dateFilterSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .optional();

//===============================================================

function normalizePaginationQuery(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const query = { ...(value as Record<string, unknown>) };

  if (query.perPage === undefined && query.limit !== undefined) {
    query.perPage = query.limit;
  }

  return query;
}

//===============================================================

export const ordersQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
    dateFrom: dateFilterSchema,
    dateTo: dateFilterSchema,
    client: sharedSearchSchema,
    orderNumber: sharedSearchSchema,
    deliveryMethod: z.enum(['pickup', 'postal_delivery']).optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer']).optional(),
    status: z.enum(['new', 'in_progress', 'successful', 'rejected']).optional(),
    productId: mongoIdSchema.optional(),
    comment: sharedSearchSchema,
  })
);

//===============================================================

export const orderParamsSchema = z.object({ orderId: orderRouteIdSchema });

//===============================================================

export const orderSalesStatisticsQuerySchema = z.object({
  dateFrom: dateFilterSchema,
  dateTo: dateFilterSchema,
  groupBy: z.enum(['day', 'month']).default('month'),
});

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

const orderEditableItemSchema = z.object({
  productOfferId: mongoIdSchema,
  quantity: z.coerce.number().int().min(1).max(999),
});

//===============================================================

export const updateOrderDetailsSchema = z
  .object({
    items: z.array(orderEditableItemSchema).min(1).optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer']).optional(),
    deliveryMethod: z.enum(['pickup', 'postal_delivery']).optional(),
    deliveryDetails: z
      .object({
        recipientName: sharedNameSchema,
        recipientPhone: sharedRequiredPhoneSchema,
        address: sharedRequiredAddressSchema,
      })
      .optional(),
    managerComment: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMethod === 'postal_delivery' && !value.deliveryDetails) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryDetails'],
        message: 'Delivery details are required for postal delivery',
      });
    }
  });

//===============================================================

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['in_progress', 'successful', 'rejected']),
    rejectionReason: z.string().trim().min(100).max(500).optional(),
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

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

export type OrderSalesStatisticsQuery = z.infer<
  typeof orderSalesStatisticsQuerySchema
>;

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
export type UpdateOrderDetailsInput = z.infer<typeof updateOrderDetailsSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
