import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
} from './shared';

import {
  DATE_RANGE_MESSAGE,
  isDateRangeOrdered,
  dateQuerySchema,
} from './shared/date.schema';

import {
  sharedUserNameSchema,
  sharedOrderCommentSchema,
  sharedRequiredAddressSchema,
  sharedRequiredPhoneSchema,
  sharedSearchSchema,
} from './shared-validation.schema';

import {
  ORDER_REJECTION_REASON_MAX_LENGTH,
  ORDER_REJECTION_REASON_MIN_LENGTH,
  ORDER_STATUS_COMMENT_MAX_LENGTH,
  ORDER_STATUS_VALIDATION_MESSAGES,
} from '../constants/order-validation';

//===============================================================

const orderRouteIdSchema = z.string().trim().min(1, 'ID is required');
const ordersPerPageSchema = createPerPageSchema({ defaultValue: 20, max: 200 });

const orderCommentsPerPageSchema = createPerPageSchema({
  defaultValue: 5,
  max: 50,
});

//===============================================================

export const ordersQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: ordersPerPageSchema,
      dateFrom: dateQuerySchema,
      dateTo: dateQuerySchema,
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
    perPage: orderCommentsPerPageSchema,
  })
);

//===============================================================

export const createOrderManagerCommentSchema = z.object({
  text: z.string().trim().min(1, 'Comment is required').max(1000),
});

//===============================================================

export const orderSalesStatisticsQuerySchema = z
  .object({
    dateFrom: dateQuerySchema,
    dateTo: dateQuerySchema,
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
    rejectionReason: z
      .string()
      .trim()
      .min(
        ORDER_REJECTION_REASON_MIN_LENGTH,
        ORDER_STATUS_VALIDATION_MESSAGES.rejectionReasonMin
      )
      .max(
        ORDER_REJECTION_REASON_MAX_LENGTH,
        ORDER_STATUS_VALIDATION_MESSAGES.rejectionReasonMax
      )
      .optional(),
    comment: z
      .string()
      .trim()
      .max(
        ORDER_STATUS_COMMENT_MAX_LENGTH,
        ORDER_STATUS_VALIDATION_MESSAGES.commentMax
      )
      .optional(),
  })

  .superRefine((value, ctx) => {
    if (value.status === 'rejected' && !value.rejectionReason) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejectionReason'],
        message: ORDER_STATUS_VALIDATION_MESSAGES.requiredRejectionReason,
      });
    }
  });

//===============================================================

export type OrderParams = z.infer<typeof orderParamsSchema>;
export type OrderCommentParams = z.infer<typeof orderCommentParamsSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateOrderDetailsInput = z.infer<typeof updateOrderDetailsSchema>;

export type CreateOrderManagerCommentInput = z.infer<
  typeof createOrderManagerCommentSchema
>;

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

export type OrderSalesStatisticsQuery = z.infer<
  typeof orderSalesStatisticsQuerySchema
>;

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
export type CreateManagerOrderInput = z.infer<typeof createManagerOrderSchema>;
export type OrderCommentsQuery = z.infer<typeof orderCommentsQuerySchema>;
