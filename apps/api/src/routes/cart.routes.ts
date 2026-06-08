import { Router } from 'express';

import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cart.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  addCartItemSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from '../schemas/cart.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const cartRoutes = Router();

//===============================================================

cartRoutes.use(authenticate);

cartRoutes.get('/', ctrlWrapper(getCart));

cartRoutes.post(
  '/items',
  validate({
    body: addCartItemSchema,
  }),
  ctrlWrapper(addCartItem)
);

cartRoutes.patch(
  '/items/:cartItemId',
  validate({
    params: cartItemParamsSchema,
    body: updateCartItemSchema,
  }),
  ctrlWrapper(updateCartItem)
);

cartRoutes.delete(
  '/items/:cartItemId',
  validate({
    params: cartItemParamsSchema,
  }),
  ctrlWrapper(removeCartItem)
);

cartRoutes.delete('/clear', ctrlWrapper(clearCart));
