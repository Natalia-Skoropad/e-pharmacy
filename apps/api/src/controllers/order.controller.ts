import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import {
  checkoutOrderSchema,
  createManagerOrderSchema,
  createOrderManagerCommentSchema,
  orderCommentsQuerySchema,
  orderSalesStatisticsQuerySchema,
  ordersQuerySchema,
  updateOrderDetailsSchema,
  updateOrderStatusSchema,
} from '../schemas/order.schema';

import {
  checkoutOrderService,
  createManagerOrderService,
  createOrderManagerCommentService,
  deleteOrderManagerCommentService,
  getOrderByIdService,
  getOrderManagerCommentsService,
  getOrderSalesStatisticsService,
  getOrdersService,
  updateOrderDetailsService,
  updateOrderStatusService,
} from '../services/order.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type OrderParams = {
  orderId: string;
};

type OrderCommentParams = OrderParams & { commentId: string };

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

export async function createManagerOrder(
  req: Request,
  res: Response
): Promise<void> {
  const body = createManagerOrderSchema.parse(req.body);
  const user = req.user;

  if (!user) return;

  const data = await createManagerOrderService(
    { id: user.id, role: user.role },
    body
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function getOrders(req: Request, res: Response): Promise<void> {
  const query = ordersQuerySchema.parse(req.query);
  const data = await getOrdersService(
    req.user?.id ?? '',
    query,
    req.user?.role
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getOrderSalesStatistics(
  req: Request,
  res: Response
): Promise<void> {
  const query = orderSalesStatisticsQuerySchema.parse(req.query);
  const data = await getOrderSalesStatisticsService(
    req.user?.id ?? '',
    query,
    req.user?.role
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as OrderParams;
  const data = await getOrderByIdService(
    req.user?.id ?? '',
    orderId,
    req.user?.role
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getOrderManagerComments(
  req: Request,
  res: Response
): Promise<void> {
  const { orderId } = req.params as OrderParams;
  const query = orderCommentsQuerySchema.parse(req.query);
  const user = req.user;

  if (!user) return;

  const data = await getOrderManagerCommentsService(
    { id: user.id, role: user.role },
    orderId,
    query
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createOrderManagerComment(
  req: Request,
  res: Response
): Promise<void> {
  const { orderId } = req.params as OrderParams;
  const body = createOrderManagerCommentSchema.parse(req.body);
  const user = req.user;

  if (!user) return;

  const data = await createOrderManagerCommentService(
    { id: user.id, role: user.role },
    orderId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function deleteOrderManagerComment(
  req: Request,
  res: Response
): Promise<void> {
  const { orderId, commentId } = req.params as OrderCommentParams;
  const user = req.user;

  if (!user) return;

  const data = await deleteOrderManagerCommentService(
    { id: user.id, role: user.role },
    orderId,
    commentId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateOrderDetails(
  req: Request,
  res: Response
): Promise<void> {
  const { orderId } = req.params as OrderParams;
  const body = updateOrderDetailsSchema.parse(req.body);
  const user = req.user;

  if (!user) return;

  const data = await updateOrderDetailsService(
    { id: user.id, role: user.role },
    orderId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
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
