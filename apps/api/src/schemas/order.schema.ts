import { z } from 'zod';

import {
  DATE_RANGE_MESSAGE,
  isDateRangeOrdered,
  optionalCalendarDateSchema,
} from './shared/date.schema';

import {
  sharedUserNameSchema,
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
  z
    .object({
      page: positivePageSchema,
      perPage: perPageSchema,
      dateFrom: optionalCalendarDateSchema,
      dateTo: optionalCalendarDateSchema,
      client: sharedSearchSchema,
      clientId: mongoIdSchema.optional(),
      orderNumber: sharedSearchSchema,
      deliveryMethod: z.enum(['pickup', 'postal_delivery']).optional(),
      paymentMethod: z.enum(['cash', 'bank_transfer']).optional(),
      status: z
        .enum(['new', 'in_progress', 'successful', 'rejected'])
        .optional(),
      createdByType: z.enum(['client', 'manager']).optional(),
      productId: mongoIdSchema.optional(),
      comment: sharedSearchSchema,
      clientComment: sharedSearchSchema,
      clientCommentPresence: z.enum(['with', 'without']).optional(),
    })

    .refine(({ dateFrom, dateTo }) => isDateRangeOrdered(dateFrom, dateTo), {
      message: DATE_RANGE_MESSAGE,
      path: ['dateTo'],
    })
);

//===============================================================

export const orderParamsSchema = z.object({ orderId: orderRouteIdSchema });

//===============================================================

export const orderCommentParamsSchema = z.object({
  orderId: orderRouteIdSchema,
  commentId: orderRouteIdSchema,
});

//===============================================================

export const orderCommentsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: z.coerce.number().int().min(1).max(50).default(5),
  })
);

//===============================================================

export const createOrderManagerCommentSchema = z.object({
  text: z.string().trim().min(1, 'Comment is required').max(1000),
});

//===============================================================

export const orderSalesStatisticsQuerySchema = z
  .object({
    dateFrom: optionalCalendarDateSchema,
    dateTo: optionalCalendarDateSchema,
    groupBy: z.enum(['day', 'month']).default('month'),
    productId: mongoIdSchema.optional(),
  })
  .refine(({ dateFrom, dateTo }) => isDateRangeOrdered(dateFrom, dateTo), {
    message: DATE_RANGE_MESSAGE,
    path: ['dateTo'],
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
      recipientName: sharedUserNameSchema,
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

const managerOrderBaseSchema = z.object({
  clientId: mongoIdSchema,
  items: z.array(orderEditableItemSchema).min(1, 'Order must contain products'),
  paymentMethod: z.enum(['cash', 'bank_transfer']),
  comment: sharedOrderCommentSchema,
});

//===============================================================

export const createManagerOrderSchema = z.discriminatedUnion('deliveryMethod', [
  managerOrderBaseSchema.extend({
    deliveryMethod: z.literal('pickup'),
    deliveryDetails: z.never().optional(),
  }),
  managerOrderBaseSchema.extend({
    deliveryMethod: z.literal('postal_delivery'),
    deliveryDetails: z.object({
      recipientName: sharedUserNameSchema,
      recipientPhone: sharedRequiredPhoneSchema,
      address: sharedRequiredAddressSchema,
    }),
  }),
]);

//===============================================================

export const updateOrderDetailsSchema = z
  .object({
    items: z.array(orderEditableItemSchema).min(1).optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer']).optional(),
    deliveryMethod: z.enum(['pickup', 'postal_delivery']).optional(),
    deliveryDetails: z
      .object({
        recipientName: sharedUserNameSchema,
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
export type CreateManagerOrderInput = z.infer<typeof createManagerOrderSchema>;
export type UpdateOrderDetailsInput = z.infer<typeof updateOrderDetailsSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderCommentsQuery = z.infer<typeof orderCommentsQuerySchema>;

export type CreateOrderManagerCommentInput = z.infer<
  typeof createOrderManagerCommentSchema
>;
