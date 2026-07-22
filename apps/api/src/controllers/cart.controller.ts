import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  AddCartItemInput,
  CartItemParams,
  UpdateCartItemInput,
} from '../schemas/cart.schema';

import {
  addCartItemService,
  clearCartService,
  getCartService,
  removeCartItemService,
  updateCartItemService,
} from '../services/cart.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getCart(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getCartService(req.user?.id ?? '');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function addCartItem(
  req: Request,
  res: ValidatedResponse<AddCartItemInput>
): Promise<void> {
  const { body } = res.locals.validated;
  const data = await addCartItemService(req.user?.id ?? '', body);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateCartItem(
  req: Request,
  res: ValidatedResponse<UpdateCartItemInput, CartItemParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const data = await updateCartItemService(
    req.user?.id ?? '',
    params.cartItemId,
    body.quantity
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function removeCartItem(
  req: Request,
  res: ValidatedResponse<unknown, CartItemParams>
): Promise<void> {
  const { cartItemId } = res.locals.validated.params;
  const data = await removeCartItemService(req.user?.id ?? '', cartItemId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function clearCart(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await clearCartService(req.user?.id ?? '');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
