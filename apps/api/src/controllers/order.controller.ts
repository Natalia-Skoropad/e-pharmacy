import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  checkoutOrderSchema,
  updateOrderStatusSchema,
} from '../schemas/order.schema';

import {
  checkoutOrderService,
  getOrderByIdService,
  getOrdersService,
  updateOrderStatusService,
} from '../services/order.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type OrderParams = {
  orderId: string;
};

//===============================================================

export async function checkoutOrder(
  req: Request,
  res: Response
): Promise<void> {
  const body = checkoutOrderSchema.parse(req.body);
  const data = await checkoutOrderService(req.user?.id ?? '', body);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function getOrders(req: Request, res: Response): Promise<void> {
  const data = await getOrdersService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as OrderParams;
  const data = await getOrderByIdService(req.user?.id ?? '', orderId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function updateOrderStatus(
  req: Request,
  res: Response
): Promise<void> {
  const { orderId } = req.params as OrderParams;
  const body = updateOrderStatusSchema.parse(req.body);
  const user = req.user;

  if (!user) return;
  const data = await updateOrderStatusService(
    { id: user.id, role: user.role },
    orderId,
    body
  );
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
