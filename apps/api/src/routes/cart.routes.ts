import { Router } from 'express';

import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  removeCartPharmacy,
  updateCartItem,
} from '../controllers/cart.controller';

import { USER_ROLES } from '../constants/auth';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  addCartItemSchema,
  cartItemParamsSchema,
  cartPharmacyParamsSchema,
  updateCartItemSchema,
} from '../schemas/cart.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const cartRoutes = Router();

//===============================================================

cartRoutes.use(authenticate, authorizeRoles(USER_ROLES.CLIENT));

//=================================================================================

cartRoutes.get('/', ctrlWrapper(getCart));

//=================================================================================

cartRoutes.post(
  '/items',
  validate({
    body: addCartItemSchema,
  }),
  ctrlWrapper(addCartItem)
);

//=================================================================================

cartRoutes.patch(
  '/items/:cartItemId',
  validate({
    params: cartItemParamsSchema,
    body: updateCartItemSchema,
  }),
  ctrlWrapper(updateCartItem)
);

//=================================================================================

cartRoutes.delete(
  '/items/:cartItemId',
  validate({
    params: cartItemParamsSchema,
  }),
  ctrlWrapper(removeCartItem)
);

//=================================================================================

cartRoutes.delete(
  '/pharmacies/:pharmacyId',
  validate({
    params: cartPharmacyParamsSchema,
  }),

  ctrlWrapper(removeCartPharmacy)
);

cartRoutes.delete('/clear', ctrlWrapper(clearCart));
