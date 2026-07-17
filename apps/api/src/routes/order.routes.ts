import { Router } from 'express';

import {
  checkoutOrder,
  createManagerOrder,
  createOrderManagerComment,
  deleteOrderManagerComment,
  getOrderById,
  getOrderManagerComments,
  getOrderSalesStatistics,
  getOrders,
  updateOrderDetails,
  updateOrderStatus,
} from '../controllers/order.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  checkoutOrderSchema,
  createManagerOrderSchema,
  createOrderManagerCommentSchema,
  orderCommentParamsSchema,
  orderCommentsQuerySchema,
  orderParamsSchema,
  orderSalesStatisticsQuerySchema,
  ordersQuerySchema,
  updateOrderDetailsSchema,
  updateOrderStatusSchema,
} from '../schemas/order.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const orderRoutes = Router();

//===============================================================

orderRoutes.use(authenticate);

//===============================================================

orderRoutes.post(
  '/checkout',
  validate({ body: checkoutOrderSchema }),
  ctrlWrapper(checkoutOrder)
);

//===============================================================

orderRoutes.post(
  '/',
  validate({ body: createManagerOrderSchema }),
  ctrlWrapper(createManagerOrder)
);

//===============================================================

orderRoutes.get(
  '/',
  validate({ query: ordersQuerySchema }),
  ctrlWrapper(getOrders)
);

//===============================================================

orderRoutes.get(
  '/sales-statistics',
  validate({ query: orderSalesStatisticsQuerySchema }),
  ctrlWrapper(getOrderSalesStatistics)
);

//===============================================================

orderRoutes.get(
  '/:orderId/comments',
  validate({ params: orderParamsSchema, query: orderCommentsQuerySchema }),
  ctrlWrapper(getOrderManagerComments)
);

orderRoutes.post(
  '/:orderId/comments',
  validate({
    params: orderParamsSchema,
    body: createOrderManagerCommentSchema,
  }),
  ctrlWrapper(createOrderManagerComment)
);

orderRoutes.delete(
  '/:orderId/comments/:commentId',
  validate({ params: orderCommentParamsSchema }),
  ctrlWrapper(deleteOrderManagerComment)
);

//===============================================================

orderRoutes.get(
  '/:orderId',
  validate({ params: orderParamsSchema }),
  ctrlWrapper(getOrderById)
);

//===============================================================

orderRoutes.patch(
  '/:orderId',
  validate({ params: orderParamsSchema, body: updateOrderDetailsSchema }),
  ctrlWrapper(updateOrderDetails)
);

//===============================================================

orderRoutes.patch(
  '/:orderId/status',
  validate({ params: orderParamsSchema, body: updateOrderStatusSchema }),
  ctrlWrapper(updateOrderStatus)
);
