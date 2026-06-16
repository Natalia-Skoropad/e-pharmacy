import { Router } from 'express';

import {
  checkoutOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from '../controllers/order.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  checkoutOrderSchema,
  orderParamsSchema,
  updateOrderStatusSchema,
} from '../schemas/order.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const orderRoutes = Router();

//===============================================================

orderRoutes.use(authenticate);

orderRoutes.post(
  '/checkout',
  validate({ body: checkoutOrderSchema }),
  ctrlWrapper(checkoutOrder)
);

orderRoutes.get('/', ctrlWrapper(getOrders));

orderRoutes.get(
  '/:orderId',
  validate({ params: orderParamsSchema }),
  ctrlWrapper(getOrderById)
);

orderRoutes.patch(
  '/:orderId/status',
  validate({ params: orderParamsSchema, body: updateOrderStatusSchema }),
  ctrlWrapper(updateOrderStatus)
);
