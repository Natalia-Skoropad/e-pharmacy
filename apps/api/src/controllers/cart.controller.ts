import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  addCartItemSchema,
  updateCartItemSchema,
} from '../schemas/cart.schema';

import {
  addCartItemService,
  clearCartService,
  getCartService,
  removeCartItemService,
  updateCartItemService,
} from '../services/cart.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type CartItemParams = {
  cartItemId: string;
};

//===============================================================

export async function getCart(req: Request, res: Response): Promise<void> {
  const data = await getCartService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function addCartItem(req: Request, res: Response): Promise<void> {
  const body = addCartItemSchema.parse(req.body);
  const data = await addCartItemService(req.user?.id ?? '', body);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function updateCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const { cartItemId } = req.params as CartItemParams;
  const body = updateCartItemSchema.parse(req.body);
  const data = await updateCartItemService(
    req.user?.id ?? '',
    cartItemId,
    body.quantity
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function removeCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const { cartItemId } = req.params as CartItemParams;
  const data = await removeCartItemService(req.user?.id ?? '', cartItemId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function clearCart(req: Request, res: Response): Promise<void> {
  const data = await clearCartService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
